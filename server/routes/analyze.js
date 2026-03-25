const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const SERVICES = require("../services");
const upload = require("../middleware/upload");
const analyzeRateLimit = require("../middleware/rateLimit");
const { fetchRecipesFromSpoonacular } = require("../utils/spoonacularUtil");
const { generateImageWithHuggingFace } = require("../utils/hfImageUtil");

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function parseJsonFromText(rawText) {
  const raw = String(rawText || "").trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }

  const fenceMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      // continue
    }
  }

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function extractIngredientsFromVision(parsed) {
  const source = parsed && Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
  const cleaned = source
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean)
    .map((item) => item.replace(/[^a-z\s-]/g, "").trim())
    .filter(Boolean);

  return [...new Set(cleaned)].slice(0, 15);
}

function hasLatinText(value) {
  return /[A-Za-z]/.test(String(value || ""));
}

function recipeContainsLatin(recipe) {
  if (!recipe) return false;
  return [
    recipe.name,
    recipe.ingredients,
    recipe.steps,
    ...(Array.isArray(recipe.benefits) ? recipe.benefits : []),
  ].some(hasLatinText);
}

async function generateStrictJson(prompt, imagePart) {
  const strictPrompt = `${prompt}\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanation, no extra text.`;
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: strictPrompt }, imagePart],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  return response.response.text();
}

async function localizeRecipesToTunisian(recipes) {
  const safeRecipes = Array.isArray(recipes) ? recipes : [];
  if (!safeRecipes.length) return [];

  const translationPrompt = [
    "Translate these recipe fields to Tunisian Arabic dialect (Arabizi not allowed).",
    "Keep JSON only. Do not add markdown.",
    "Translate only: name, ingredients, steps, benefits.",
    "Keep unchanged: mealEnglish, nutrition, imageUrl.",
    "No English words in translated fields unless it's a strict unit like g, kg, ml, kcal.",
    "Return JSON shape: {\"recipes\": [{\"name\": string, \"ingredients\": string, \"steps\": string, \"mealEnglish\": string, \"nutrition\": object, \"benefits\": string[], \"imageUrl\": string}]}",
    JSON.stringify({ recipes: safeRecipes }),
  ].join("\n");

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: translationPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const localized = parseJsonFromText(response.response.text());
  if (!localized || !Array.isArray(localized.recipes)) return safeRecipes;

  let merged = localized.recipes.map((recipe, index) => ({
    ...safeRecipes[index],
    ...recipe,
    mealEnglish: safeRecipes[index]?.mealEnglish,
    nutrition: safeRecipes[index]?.nutrition,
    imageUrl: safeRecipes[index]?.imageUrl,
  }));

  // Second strict pass only for entries that still contain Latin text.
  const unresolved = merged
    .map((recipe, index) => ({ recipe, index }))
    .filter((item) => recipeContainsLatin(item.recipe));

  if (!unresolved.length) return merged;

  try {
    const strictPrompt = [
      "Rewrite the following recipe fields into Tunisian Arabic script only.",
      "Do not leave English words except units: g, kg, ml, kcal.",
      "Return ONLY JSON in shape: {\"recipes\": [{\"name\": string, \"ingredients\": string, \"steps\": string, \"benefits\": string[]}]}.",
      JSON.stringify({ recipes: unresolved.map((item) => item.recipe) }),
    ].join("\n");

    const strictResponse = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: strictPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const strictParsed = parseJsonFromText(strictResponse.response.text());
    if (strictParsed && Array.isArray(strictParsed.recipes)) {
      strictParsed.recipes.forEach((localizedRecipe, i) => {
        const targetIndex = unresolved[i]?.index;
        if (typeof targetIndex === "number") {
          merged[targetIndex] = {
            ...merged[targetIndex],
            ...localizedRecipe,
            mealEnglish: merged[targetIndex]?.mealEnglish,
            nutrition: merged[targetIndex]?.nutrition,
            imageUrl: merged[targetIndex]?.imageUrl,
          };
        }
      });
    }
  } catch (strictPassError) {
    console.warn("⚠️ Strict localization pass failed:", strictPassError.message);
  }

  return merged;
}

async function localizeSummaryToTunisian(summaryText) {
  const summary = String(summaryText || "").trim();
  if (!summary || !hasLatinText(summary)) return summary;

  const prompt = [
    "Translate this sentence to Tunisian Arabic script.",
    "No English words unless impossible.",
    "Return plain text only.",
    summary,
  ].join("\n");

  try {
    const response = await model.generateContent(prompt);
    const localized = String(response.response.text() || "").trim();
    return localized || summary;
  } catch {
    return summary;
  }
}

async function addGeneratedRecipeImages(recipes) {
  const safeRecipes = Array.isArray(recipes) ? recipes : [];
  if (!safeRecipes.length) return [];

  const withImages = await Promise.all(
    safeRecipes.map(async (recipe) => {
      const title = String(recipe?.mealEnglish || recipe?.name || "meal").trim();
      const prompt = `Professional food photography of ${title}, plated dish, natural light, realistic details, appetizing composition`;
      const generated = await generateImageWithHuggingFace(prompt);

      return {
        ...recipe,
        imageUrl: generated || String(recipe?.imageUrl || "").trim(),
      };
    })
  );

  return withImages;
}

async function addGeneratedStyleImages(styles, serviceId) {
  const safeStyles = Array.isArray(styles) ? styles : [];
  if (!safeStyles.length) return [];

  const styleType = serviceId === "beard" ? "beard style" : "haircut style";

  const withImages = await Promise.all(
    safeStyles.map(async (style) => {
      const name = String(style?.name || styleType).trim();
      const prompt = `Studio portrait of a man with ${name} ${styleType}, barbershop lighting, realistic hairstyle details, high quality photo`;
      const generated = await generateImageWithHuggingFace(prompt);

      return {
        ...style,
        imageUrl: generated || "",
      };
    })
  );

  return withImages;
}

router.post("/:serviceId", analyzeRateLimit, upload.single("photo"), async (req, res) => {
  try {
    const serviceId = String(req.params.serviceId || "").trim().toLowerCase();
    console.log("📥 Request for serviceId:", serviceId);
    console.log("📁 File received:", req.file ? req.file.originalname : "NONE");

    const service = SERVICES[serviceId];
    if (!service) {
      console.log("❌ Unknown serviceId:", serviceId);
      return res.status(404).json({ success: false, error: `Invalid serviceId: ${serviceId}` });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log("❌ Missing GEMINI_API_KEY");
      return res.status(500).json({ success: false, error: "Missing GEMINI_API_KEY." });
    }

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ success: false, error: "photo is required." });
    }

    console.log("🤖 Calling Gemini...");
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const response = await model.generateContent([service.prompt, imagePart]);
    const resultText = response.response.text();
    console.log("✅ Gemini responded, length:", resultText.length);

    // For fridge service, parse and add meal images
    if (serviceId === 'fridge') {
      let visionParsed = parseJsonFromText(resultText);

      if (!visionParsed || !Array.isArray(visionParsed.ingredients) || !visionParsed.ingredients.length) {
        try {
          console.warn("⚠️ Fridge ingredient extraction invalid, retrying in strict JSON mode...");
          const strictJsonText = await generateStrictJson(service.prompt, imagePart);
          visionParsed = parseJsonFromText(strictJsonText);
        } catch (strictError) {
          console.warn("⚠️ Strict JSON ingredient retry failed:", strictError.message);
        }
      }

      const ingredients = extractIngredientsFromVision(visionParsed || {});
      if (!ingredients.length) {
        return res.status(422).json({
          success: false,
          error: "Could not detect enough ingredients from image.",
        });
      }

      const recipes = await fetchRecipesFromSpoonacular(ingredients, 3);
      if (!recipes.length) {
        return res.status(404).json({
          success: false,
          error: "No Spoonacular recipes found for detected ingredients.",
        });
      }

      let localizedRecipes = recipes;
      try {
        localizedRecipes = await localizeRecipesToTunisian(recipes);
      } catch (localizeError) {
        console.warn("⚠️ Recipe localization failed, using original recipe text:", localizeError.message);
      }

      let recipesWithImages = localizedRecipes;
      try {
        recipesWithImages = await addGeneratedRecipeImages(localizedRecipes);
      } catch (imageError) {
        console.warn("⚠️ Recipe image generation failed, using fallbacks:", imageError.message);
      }

      const rawSummary = String(visionParsed?.summary || "").trim() || `المكونات اللي تبينو: ${ingredients.join("، ")}`;
      const summary = await localizeSummaryToTunisian(rawSummary);
      return res.json({
        success: true,
        result: JSON.stringify({
          summary,
          recipes: recipesWithImages,
        }),
      });
    }

    // Generate style preview images for structured style outputs.
    if (serviceId === "beard" || serviceId === "haircut") {
      const parsed = parseJsonFromText(resultText);
      if (parsed && Array.isArray(parsed.styles) && parsed.styles.length) {
        try {
          parsed.styles = await addGeneratedStyleImages(parsed.styles, serviceId);
          return res.json({ success: true, result: JSON.stringify(parsed) });
        } catch (styleImageError) {
          console.warn("⚠️ Style image generation failed, returning original styles:", styleImageError.message);
        }
      }
    }

    return res.json({ success: true, result: resultText });

  } catch (error) {
    // ✅ log the FULL error so you can see exactly what went wrong
    console.error("🔴 Analyze error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze image.",
    });
  }
});

module.exports = router;
