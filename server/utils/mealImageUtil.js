/**
 * Utility to fetch meal images from Unsplash API
 * Falls back to a local placeholder pattern if API fails
 */

async function fetchMealImage(mealName) {
  try {
    // Using Unsplash API - free tier allows 50 requests per hour
    const query = encodeURIComponent(mealName.trim())
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${query}+food&per_page=1&page=1&client_id=${process.env.UNSPLASH_ACCESS_KEY || 'your_key'}&orientation=landscape`

    // Only fetch if we have a valid API key
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return generateFallbackImageUrl(mealName)
    }

    const response = await fetch(unsplashUrl)
    if (!response.ok) {
      return generateFallbackImageUrl(mealName)
    }

    const data = await response.json()
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular
    }

    return generateFallbackImageUrl(mealName)
  } catch (error) {
    console.error('Error fetching meal image:', error)
    return generateFallbackImageUrl(mealName)
  }
}

function generateFallbackImageUrl(mealName) {
  const seed = encodeURIComponent(String(mealName || 'meal').trim().toLowerCase())
  // picsum is generally more reliable than placeholder services in some regions/networks.
  return `https://picsum.photos/seed/${seed}/640/420`
}

async function fetchMealImagesForRecipes(recipes) {
  // recipes should be an array with mealEnglish property
  const recipesWithImages = await Promise.all(
    recipes.map(async (recipe) => {
      const imageUrl = await fetchMealImage(recipe.mealEnglish || recipe.name)
      return {
        ...recipe,
        imageUrl,
      }
    })
  )
  return recipesWithImages
}

module.exports = {
  fetchMealImage,
  fetchMealImagesForRecipes,
}
