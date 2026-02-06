const express = require("express");
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");
const Contribution = require("../module/financialContribution");
const Attendance = require("../module/attendance");
const mongoose = require("mongoose");

const router = express.Router();

/* ===============================
   💰 CREATE CONTRIBUTION
=============================== */

router.post(
  "/contributions",
  [
    body("title").notEmpty(),
    body("description").optional(),
    body("targetAmount").optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const contribution = await Contribution.create(req.body);

      res.status(201).json({
        message: "Contribution created",
        contribution,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// router.post(
//   "/contributions",
//   [
//     body("memberId").notEmpty().withMessage("Member is required"),
//     body("amount").isNumeric().withMessage("Amount must be a number"),
//     body("purpose").trim().notEmpty().withMessage("Purpose is required"),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(422).json({ errors: errors.array() });
//     }

//     try {
//       const { memberId, amount, purpose } = req.body;

//       const member = await Registration.findById(memberId);
//       if (!member) {
//         return res.status(404).json({ error: "Member not found" });
//       }

//       const contribution = await Contribution.create({
//         member: memberId,
//         amount,
//         purpose,
//       });

//       res.status(201).json({
//         message: "Contribution recorded",
//         contribution,
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Server error" });
//     }
//   }
// );

// GET all contributions
router.get("/contributions", async (req, res) => {
  try {
    const contributions = await Contribution.find().sort({ createdAt: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Record a payment for a contribution
router.post(
  "/contributions/:id/pay",
  [
    body("memberId").notEmpty(),
    body("amount").isNumeric(),
    body("paidOn").isISO8601(),
  ],
  async (req, res) => {
    try {
      const { memberId, amount, paidOn } = req.body;
      const contributionId = req.params.id;

      const payment = await ContributionPayment.create({
        contribution: contributionId,
        member: memberId,
        amount,
        paidOn,
      });

      res.status(201).json({
        message: "Payment recorded",
        payment,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ===============================
   ✅ create attendance record
=============================== */

router.post("/attendance", async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!records || !records.length) {
      return res.status(400).json({ error: "Attendance records are required" });
    }

    const attendanceDate = new Date(date);

    const operations = records.map((r) => ({
      updateOne: {
        filter: {
          member: new mongoose.Types.ObjectId(r.memberId),
          date: attendanceDate,
        },
        update: { present: r.present },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);

    res.json({ message: "Attendance saved successfully" });
  } catch (err) {
    console.error("Attendance save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

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
  console.log("Request received for member:", req.params.memberId);
  try {
    const { memberId } = req.params;

    // Convert memberId to ObjectId correctly
    const objectMemberId = new mongoose.Types.ObjectId(memberId);

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
