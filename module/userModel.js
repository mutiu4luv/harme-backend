// models/Registration.js
const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    parish: { type: String, required: true, trim: true },
    partYouSing: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    whereYouLive: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Registration", RegistrationSchema);
