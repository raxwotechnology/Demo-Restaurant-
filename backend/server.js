const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db"); // Import db.js
const authRoute = require("./routes/authRoute");
const path = require("path");
const app = express();
// Serve static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

dotenv.config();


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://demo-restaurant-v6g2.onrender.com",
  "https://demo-restaurant-8ntz.onrender.com",
  /\.netlify\.app$/,         // any Netlify subdomain
  /\.netlify\.live$/,        // Netlify live previews
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Connect to DB
connectDB();

app.use("/api/auth", authRoute);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));