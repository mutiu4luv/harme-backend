const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
        password: hashedPassword,
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
    const regs = await Registration.find({ isDeleted: false }).sort({
      createdAt: -1,
    });

    res.json(regs);
  } catch (err) {
    console.error("❌ Fetch registrations error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update member role
router.patch("/:id/role", async (req, res) => {
  try {
    const user = await Registration.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Member not found" });
    }

    // 🔁 Toggle role
    user.role = user.role === "admin" ? "member" : "admin";
    await user.save();

    res.json({
      message: `User role changed to ${user.role}`,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Role update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
// Promote user to admin
router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await Registration.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role}`,
      user,
    });
  } catch (err) {
    console.error("❌ Update role error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a registrated user
router.delete("/:id", async (req, res) => {
  try {
    // 🔎 Find member first
    const reg = await Registration.findById(req.params.id);

    if (!reg) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // 🚫 Prevent deleting admins
    if (reg.role === "admin") {
      return res.status(403).json({ error: "Admins cannot be deleted" });
    }

    // ✅ Soft delete
    reg.isDeleted = true;
    await reg.save();

    res.json({
      message: "Registration deleted successfully",
    });
  } catch (err) {
    console.error("❌ Soft delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
// User login route
router.post(
  "/login",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
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
      const { username, password } = req.body;

      // 🔍 Find user + include password
      const user = await Registration.findOne({ username }).select("+password");

      // ❌ Specific Check: Username not found
      if (!user) {
        return res.status(401).json({
          error: "Invalid username",
        });
      }

      // 🚫 BLOCK soft-deleted users
      if (user.isDeleted) {
        return res.status(403).json({
          error: "Your account has been deactivated. Contact admin.",
        });
      }

      // 🔐 Specific Check: Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          error: "Invalid password",
        });
      }

      // 🎟️ GENERATE TOKEN
      const token = jwt.sign(
        { id: user._id, role: user.role }, // Payload
        process.env.JWT_SECRET, // Secret Key
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } // Expiry
      );

      // ✅ Login successful
      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("❌ Login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
