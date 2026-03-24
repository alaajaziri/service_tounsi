const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const SERVICES = require("../services");
const upload = require("../middleware/upload");
const analyzeRateLimit = require("../middleware/rateLimit");
const { fetchRecipesFromSpoonacular } = require("../utils/spoonacularUtil");

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
    "Translate these recipe fields to Tunisian Arabic dialect.",
    "Keep JSON only. Do not add markdown.",
    "Translate only: name, ingredients, steps, benefits.",
    "Keep unchanged: mealEnglish, nutrition, imageUrl.",
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

  return localized.recipes.map((recipe, index) => ({
    ...safeRecipes[index],
    ...recipe,
    mealEnglish: safeRecipes[index]?.mealEnglish,
    nutrition: safeRecipes[index]?.nutrition,
    imageUrl: safeRecipes[index]?.imageUrl,
  }));
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

      const summary = String(visionParsed?.summary || "").trim() || `المكونات اللي تبينو: ${ingredients.join("، ")}`;
      return res.json({
        success: true,
        result: JSON.stringify({
          summary,
          recipes: localizedRecipes,
        }),
      });
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
