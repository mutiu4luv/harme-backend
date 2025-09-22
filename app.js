// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const registrationsRoute = require("./routes/userRoute");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI not set in .env");
    }
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    app.use("/api/registrations", registrationsRoute);

    app.get("/", (req, res) => res.send("Choir registration API is running"));

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
