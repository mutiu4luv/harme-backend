const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");
const bcrypt = require("bcrypt");
// User registration route
router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),

    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),

    body("parish").trim().notEmpty().withMessage("Parish is required"),

    body("partYouSing")
      .trim()
      .notEmpty()
      .withMessage("Part you sing is required"),

    body("phoneNumber")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^\d{10,15}$/)
      .withMessage("Phone number must be 10–15 digits"),

    body("whereYouLive")
      .trim()
      .notEmpty()
      .withMessage("Where you live is required"),

    body("email").trim().isEmail().withMessage("Valid email is required"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const {
        name,
        username,
        parish,
        partYouSing,
        phoneNumber,
        whereYouLive,
        email,
        password,
      } = req.body;

      // 🔎 Check email or username
      const exists = await Registration.findOne({
        $or: [{ email }, { username }],
      });

      if (exists) {
        return res
          .status(409)
          .json({ error: "Email or username already registered" });
      }

      // 🔐 Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newReg = new Registration({
        name,
        username,
        parish,
        partYouSing,
        phoneNumber,
        whereYouLive,
        email,
        password: hashedPassword, // 👈 stored securely
      });

      await newReg.save();

      res.status(201).json({
        message: "Registration successful",
        user: {
          id: newReg._id,
          name: newReg.name,
          username: newReg.username,
          email: newReg.email,
          role: newReg.role,
        },
      });
    } catch (err) {
      console.error("❌ Server error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

//get all registrated users
router.get("/", async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Promote user to admin
router.patch("/:id/make-admin", async (req, res) => {
  try {
    const user = await Registration.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = "admin";
    await user.save();

    res.json({ message: "User promoted to admin", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Delete a registrated user
router.delete("/:id", async (req, res) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ error: "Registration not found" });

    res.json({ message: "Registration deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
