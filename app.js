require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const registrationsRoute = require("./routes/userRoute");

const app = express();

// ✅ Configure allowed origins
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://de-harmelodic-ensemble.vercel.app", // your deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allow cookies/auth headers if needed
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI not set in .env");
    }
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    app.use("/api/registrations", registrationsRoute);

    app.get("/", (req, res) => res.send("Choir registration API is running"));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
