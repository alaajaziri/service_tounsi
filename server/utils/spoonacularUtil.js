const axios = require("axios");

const SPOON_BASE_URL = "https://api.spoonacular.com";

function stripHtml(input) {
  return String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNutrientValue(nutrients, name) {
  if (!Array.isArray(nutrients)) return 0;
  const found = nutrients.find((item) => String(item?.name || "").toLowerCase() === name.toLowerCase());
  if (!found) return 0;
  const value = Number(found.amount);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function buildBenefits(nutrition) {
  const benefits = [];

  if (nutrition.protein_g >= 20) benefits.push("بروتين عالي يساعد على الشبع وبناء العضلات.");
  if (nutrition.fiber_g >= 5) benefits.push("غني بالألياف وعاون على الهضم.");
  if (nutrition.carbs_g >= 30 && nutrition.fats_g <= 20) benefits.push("يعطي طاقة متوازنة خلال النهار.");
  if (nutrition.calories > 0 && nutrition.calories <= 450) benefits.push("سعرات معتدلة ومناسبة لوجبة خفيفة أو عشاء.");

  if (!benefits.length) {
    benefits.push("وجبة متوازنة فيها عناصر غذائية متنوعة.");
  }

  return benefits;
}

function formatInstructionSteps(recipeInfo) {
  const steps = recipeInfo?.analyzedInstructions?.[0]?.steps;
  if (Array.isArray(steps) && steps.length) {
    return steps.map((step) => `${step.number}. ${step.step}`).join("\n");
  }

  const summary = stripHtml(recipeInfo?.summary);
  if (summary) return summary;

  return "حضّر المكونات واتبّع طريقة الطهي المناسبة لهذه الوصفة.";
}

function formatIngredients(recipeInfo) {
  if (!Array.isArray(recipeInfo?.extendedIngredients)) {
    return "المكونات غير متوفرة.";
  }

  const lines = recipeInfo.extendedIngredients
    .map((item) => String(item?.original || "").trim())
    .filter(Boolean);

  return lines.length ? lines.join("\n") : "المكونات غير متوفرة.";
}

function fallbackImageForTitle(title) {
  const seed = encodeURIComponent(String(title || "meal").trim().toLowerCase());
  return `https://picsum.photos/seed/${seed}/640/420`;
}

async function fetchRecipeInformation(recipeId, apiKey) {
  const { data } = await axios.get(`${SPOON_BASE_URL}/recipes/${recipeId}/information`, {
    params: {
      apiKey,
      includeNutrition: true,
    },
    timeout: 15000,
  });

  return data;
}

async function fetchRecipesFromSpoonacular(ingredients, number = 3) {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SPOONACULAR_API_KEY.");
  }

  const ingredientList = Array.isArray(ingredients)
    ? ingredients.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
    : [];

  if (!ingredientList.length) {
    return [];
  }

  const { data: matches } = await axios.get(`${SPOON_BASE_URL}/recipes/findByIngredients`, {
    params: {
      apiKey,
      ingredients: ingredientList.join(","),
      number,
      ranking: 2,
      ignorePantry: true,
    },
    timeout: 15000,
  });

  if (!Array.isArray(matches) || !matches.length) {
    return [];
  }

  const details = await Promise.all(
    matches.slice(0, number).map(async (match) => {
      try {
        return await fetchRecipeInformation(match.id, apiKey);
      } catch (error) {
        return {
          title: match.title,
          image: match.image,
          extendedIngredients: [],
          analyzedInstructions: [],
          summary: "",
          nutrition: { nutrients: [] },
        };
      }
    })
  );

  return details.map((recipeInfo) => {
    const nutrients = recipeInfo?.nutrition?.nutrients || [];
    const nutrition = {
      calories: getNutrientValue(nutrients, "Calories"),
      protein_g: getNutrientValue(nutrients, "Protein"),
      carbs_g: getNutrientValue(nutrients, "Carbohydrates"),
      fats_g: getNutrientValue(nutrients, "Fat"),
      fiber_g: getNutrientValue(nutrients, "Fiber"),
    };

    const title = String(recipeInfo?.title || "Recipe").trim();

    return {
      name: title,
      ingredients: formatIngredients(recipeInfo),
      steps: formatInstructionSteps(recipeInfo),
      mealEnglish: title,
      nutrition,
      benefits: buildBenefits(nutrition),
      imageUrl: recipeInfo?.image || fallbackImageForTitle(title),
    };
  });
}

module.exports = {
  fetchRecipesFromSpoonacular,
};
