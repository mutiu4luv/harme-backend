const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
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
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(422).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { name, parish, partYouSing, phoneNumber, whereYouLive, email } =
        req.body;

      const exists = await Registration.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const newReg = new Registration({
        name,
        parish,
        partYouSing,
        phoneNumber, // already digits only
        whereYouLive,
        email,
      });

      await newReg.save();

      res.status(201).json({
        message: "Registration successful",
        user: newReg,
      });
    } catch (err) {
      console.error("❌ Server error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ---------- OTHER ROUTES ---------- */

router.get("/", async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

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
