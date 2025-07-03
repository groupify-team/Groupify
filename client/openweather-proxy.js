// openweather-proxy.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 3001;
const API_KEY = "8d871b818eadcd877d1ab93f50196ef6";

app.use(cors());

app.get("/api/city-search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch(
      `http://api.openweathermap.org/geo/
      1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );

    const data = await response.json();
    console.log("🔍 API Response:", data);

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "Unexpected API response", data });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error calling OpenWeather:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`OpenWeather proxy running at http://localhost:${PORT}`);
});
