require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const registrationsRoute = require("./routes/userRoute");

const app = express();

// ✅ Allow only your frontend + local dev
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "http://localhost:3000", // CRA local dev
  "https://de-harmelodic-ensemble.vercel.app", // deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS: " + origin));
      }
    },
    credentials: true, // allow cookies/auth headers if you ever need them
  })
);
// app.use(
//   cors({
//     origin: "*",
//     credentials: true, // you can remove this if you don't need cookies/auth headers
//   })
// );
// app.use(express.json());

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI not set in .env");
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Routes
    app.use("/api/registrations", registrationsRoute);

    // Health check
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
