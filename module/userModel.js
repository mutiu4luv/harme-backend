const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const RegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    parish: {
      type: String,
      required: true,
      trim: true,
    },

    partYouSing: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    whereYouLive: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔒 hide password by default
    },

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
  },
  { timestamps: true }
);

// 🔐 HASH PASSWORD BEFORE SAVING
RegistrationSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("Registration", RegistrationSchema);
