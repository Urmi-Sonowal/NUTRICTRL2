// mainn.js - Node.js Backend with Barcode and Image-to-Text Support

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const tesseract = require("tesseract.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Analyze ingredients endpoint
app.post("/analyze", async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients) return res.status(400).json({ error: "No ingredients provided" });

    const prompt = `Analyze these food ingredients: ${ingredients}. Classify them strictly as 'Good', 'Neutral', or 'Bad' for health. Reply only with one of these words.`;
    const result = await model.generateContent(prompt);
    const analysis = await result.response.text();

    if (["Good", "Neutral", "Bad"].includes(analysis.trim())) {
      res.json({ result: analysis.trim() });
    } else {
      res.json({ result: "Neutral" }); // default fallback
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Barcode scan -> ingredients from OpenFoodFacts
app.get("/barcode/:code", async (req, res) => {
  try {
    const barcode = req.params.code;
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

    if (response.data.status === 1) {
      const ingredientsText = response.data.product.ingredients_text || "";
      res.json({ ingredients: ingredientsText });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

// OCR endpoint for image-to-ingredients
app.post("/ocr", upload.single("image"), async (req, res) => {
  try {
    const imagePath = path.join(__dirname, req.file.path);
    const { data: { text } } = await tesseract.recognize(imagePath, "eng");
    fs.unlinkSync(imagePath); // clean up uploaded image

    res.json({ ingredients: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to extract text from image" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
