// routes/registrations.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");

// POST /api/registrations
router.post(
  "/",
  [
    body("name").isLength({ min: 2 }).withMessage("Name is required"),
    body("parish").notEmpty().withMessage("Parish is required"),
    body("partYouSing").notEmpty().withMessage("Part you sing is required"),
    body("phoneNumber")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^\+?\d{7,15}$/)
      .withMessage(
        "Phone number must contain only digits and optional leading +"
      ),
    body("whereYouLive").notEmpty().withMessage("Where you live is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { name, parish, partYouSing, phoneNumber, whereYouLive, email } =
        req.body;

      // Optional: normalize phone (remove spaces etc.)
      const normalizedPhone = phoneNumber.replace(/\s+/g, "");

      const newReg = new Registration({
        name,
        parish,
        partYouSing,
        phoneNumber: normalizedPhone,
        whereYouLive,
        email,
      });

      await newReg.save();
      return res
        .status(201)
        .json({
          message: "Registration created successfully",
          registration: newReg,
        });
    } catch (err) {
      console.error("Error creating registration:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/registrations - list (for admin/testing)
router.get("/", async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
