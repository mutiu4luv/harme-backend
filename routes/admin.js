const express = require("express");
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");
const Contribution = require("../module/financialContribution");
const Attendance = require("../module/attendance");

const router = express.Router();

/* ===============================
   💰 CREATE CONTRIBUTION
================================ */
router.post(
  "/contributions",
  [
    body("memberId").notEmpty().withMessage("Member is required"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("purpose").trim().notEmpty().withMessage("Purpose is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { memberId, amount, purpose } = req.body;

      const member = await Registration.findById(memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const contribution = await Contribution.create({
        member: memberId,
        amount,
        purpose,
      });

      res.status(201).json({
        message: "Contribution recorded",
        contribution,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ===============================
   ✅ create attendance record
================================ */
router.post(
  "/attendance",
  [
    body("date").notEmpty().withMessage("Date is required"),
    body("records").isArray().withMessage("Attendance records required"),
  ],
  async (req, res) => {
    try {
      const { date, records } = req.body;

      const operations = records.map((r) => ({
        updateOne: {
          filter: { member: r.memberId, date },
          update: { present: r.present },
          upsert: true,
        },
      }));

      await Attendance.bulkWrite(operations);

      res.json({ message: "Attendance saved successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ===============================
   👥 GET ALL MEMBERS
================================ */
router.get("/members", async (req, res) => {
  try {
    const members = await Registration.find().sort({ name: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET api for each chiorist to see their attendance records
router.get("/my/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;

    // Convert memberId to ObjectId
    const objectMemberId = mongoose.Types.ObjectId(memberId);

    const attendance = await Attendance.find({ member: objectMemberId })
      .sort({ date: -1 })
      .lean();

    res.json({ attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
