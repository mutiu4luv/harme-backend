// // routes/registrations.js
// const express = require("express");
// const router = express.Router();
// const { body, validationResult } = require("express-validator");
// const Registration = require("../module/userModel");

// // POST /api/registrations
// router.post(
//   "/",
//   [
//     body("name").isLength({ min: 2 }).withMessage("Name is required"),
//     body("parish").notEmpty().withMessage("Parish is required"),
//     body("partYouSing").notEmpty().withMessage("Part you sing is required"),
//     body("phoneNumber")
//       .notEmpty()
//       .withMessage("Phone number is required")
//       .matches(/^\+?\d{7,15}$/)
//       .withMessage(
//         "Phone number must contain only digits and optional leading +"
//       ),
//     body("whereYouLive").notEmpty().withMessage("Where you live is required"),
//     body("email").isEmail().withMessage("Valid email is required"),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(422).json({ errors: errors.array() });
//     }

//     try {
//       const { name, parish, partYouSing, phoneNumber, whereYouLive, email } =
//         req.body;

//       // Optional: normalize phone (remove spaces etc.)
//       const normalizedPhone = phoneNumber.replace(/\s+/g, "");

//       const newReg = new Registration({
//         name,
//         parish,
//         partYouSing,
//         phoneNumber: normalizedPhone,
//         whereYouLive,
//         email,
//       });

//       await newReg.save();
//       return res.status(201).json({
//         message: "Registration created successfully",
//         registration: newReg,
//       });
//     } catch (err) {
//       console.error("Error creating registration:", err);
//       return res.status(500).json({ error: "Server error" });
//     }
//   }
// );

// // GET /api/registrations - list (for admin/testing)
// router.get("/", async (req, res) => {
//   try {
//     const regs = await Registration.find().sort({ createdAt: -1 });
//     res.json(regs);
//   } catch (err) {
//     console.error("Error fetching registrations:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // ✅ DELETE /api/registrations/:id
// router.delete("/:id", async (req, res) => {
//   try {
//     const reg = await Registration.findByIdAndDelete(req.params.id);
//     if (!reg) {
//       return res.status(404).json({ error: "Registration not found" });
//     }
//     res.json({ message: "Registration deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting registration:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");
router.post(
  "/",
  [
    body("name").isLength({ min: 2 }).withMessage("Name is required"),
    body("parish").notEmpty().withMessage("Parish is required"),
    body("partYouSing").notEmpty().withMessage("Part you sing is required"),
    body("phoneNumber")
      .notEmpty()
      .matches(/^\d{10,15}$/)
      .withMessage("Phone number must be 10–15 digits"),

    body("whereYouLive").notEmpty().withMessage("Where you live is required"),
    body("email").isEmail().withMessage("Valid email is required"),
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
        phoneNumber: phoneNumber.replace(/\s+/g, ""),
        whereYouLive,
        email,
        // role: "member",
      });

      await newReg.save();

      res.status(201).json({
        message: "Registration successful",
        user: newReg,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);
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
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.role = "admin";
    await user.save();

    res.json({
      message: "User promoted to admin successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) {
      return res.status(404).json({ error: "Registration not found" });
    }
    res.json({ message: "Registration deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
