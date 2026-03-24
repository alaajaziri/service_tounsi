const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Single source of truth for env vars.
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const analyzeRouter = require("./routes/analyze");
const paymentRouter = require("./routes/payment");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = path.resolve(__dirname, "..");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/analyze", analyzeRouter);
app.use("/api/payment", paymentRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    services: ["/beard", "/haircut", "/car", "/fridge", "/outfit", "/premium"],
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

// Serve React app in production
const clientDistPath = path.join(ROOT_DIR, "client", "dist");
app.use(express.static(clientDistPath));

// For React Router, serve index.html for all non-API routes
app.get("*", (req, res) => {
  const indexPath = path.join(clientDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      if (req.path === "/" || req.path === "") {
        return res.json({
          success: false,
          error: "React build not found. Run: cd client && npm run build",
        });
      }
      return res.status(404).json({ success: false, error: "Not found" });
    }
  });
});

app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err && err.message) {
    return res.status(400).json({ success: false, error: err.message });
  }

  return res.status(500).json({ success: false, error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`SERVICE_TOUNSI server running on http://localhost:${PORT}`);
});
