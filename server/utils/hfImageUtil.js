const axios = require("axios");

const DEFAULT_HF_MODELS = [
  "black-forest-labs/FLUX.1-schnell",
  "stabilityai/stable-diffusion-2-1",
  "runwayml/stable-diffusion-v1-5",
  "stabilityai/stable-diffusion-xl-base-1.0",
];

const HF_BASE_URLS = [
  "https://router.huggingface.co/hf-inference/models",
];

function getCandidateModels() {
  const fromList = String(process.env.HF_IMAGE_MODELS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const single = String(process.env.HF_IMAGE_MODEL || "").trim();
  const merged = [...fromList, ...(single ? [single] : []), ...DEFAULT_HF_MODELS];
  return [...new Set(merged)];
}

function toBase64DataUrl(buffer, contentType) {
  const mime = String(contentType || "image/png").toLowerCase();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mime};base64,${base64}`;
}

async function generateImageWithHuggingFace(prompt) {
  const token = process.env.HF_API_TOKEN;
  if (!token) return null;

  const candidates = getCandidateModels();
  const failures = [];
  let permissionBlocked = false;

  for (const modelId of candidates) {
    for (const baseUrl of HF_BASE_URLS) {
      try {
        const response = await axios.post(
          `${baseUrl}/${modelId}`,
          {
            inputs: prompt,
            options: {
              wait_for_model: true,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "image/png",
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
            timeout: 60000,
            validateStatus: () => true,
          }
        );

        const contentType = String(response.headers["content-type"] || "");
        if (response.status >= 200 && response.status < 300 && contentType.startsWith("image/")) {
          return toBase64DataUrl(response.data, contentType);
        }

        if (response.status === 401 || response.status === 403) {
          permissionBlocked = true;
        }

        failures.push(`${modelId} @ ${baseUrl} -> ${response.status}`);
      } catch (error) {
        failures.push(`${modelId} @ ${baseUrl} -> ${error?.message || "request failed"}`);
      }

      if (permissionBlocked) break;
    }

    if (permissionBlocked) break;
  }

  if (permissionBlocked) {
    console.warn(
      "⚠️ HuggingFace image generation blocked (401/403). Check HF_API_TOKEN permissions for Inference Providers/billing and model access."
    );
  } else if (failures.length) {
    console.warn("⚠️ HuggingFace image generation failed on all candidates:", failures.join(" | "));
  }

  return null;
}

module.exports = {
  generateImageWithHuggingFace,
};
