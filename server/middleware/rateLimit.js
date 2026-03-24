const rateLimit = require("express-rate-limit");

const analyzeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again in a minute.",
  },
});

module.exports = analyzeRateLimit;
