const express = require("express");
const { body, validationResult } = require("express-validator");
const Registration = require("../module/userModel");
const Contribution = require("../module/financialContribution");
const Attendance = require("../module/attendance");
const mongoose = require("mongoose");
const financialContribution = require("../module/financialContribution");
const contributionPayment = require("../module/contributionPayment");

const router = express.Router();

/* ===============================
   💰 CREATE CONTRIBUTION
=============================== */

router.post(
  "/contributions",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").optional(),
    body("targetAmount").optional().isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const contribution = await financialContribution.create({
        title: req.body.title,
        description: req.body.description,
        targetAmount: req.body.targetAmount || 0,
      });

      res.status(201).json({
        message: "Contribution created",
        contribution,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;

// GET all contributions
router.get("/contributions", async (req, res) => {
  try {
    const contributions = await financialContribution
      .find()
      .sort({ createdAt: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Get all contributions with payment summary per member
router.get("/contributions/summary", async (req, res) => {
  try {
    const members = await financialContribution.find({
      isDeleted: { $ne: true },
    });

    const contributions = await financialContribution.find();

    const result = members.map((member) => {
      let totalOwed = 0;

      const memberContributions = contributions.map((c) => {
        const payment = c.payments.find(
          (p) => p.member.toString() === member._id.toString()
        );

        const paidAmount = payment?.amount || 0;
        const notPaid = Math.max(c.targetAmount - paidAmount, 0);

        totalOwed += notPaid;

        return {
          contributionId: c._id,
          title: c.title,
          targetAmount: c.targetAmount,
          paidAmount,
          notPaid,
          paidMembers: c.payments
            .filter((p) => p.amount > 0)
            .map((p) => ({ _id: p.member, name: p.name, amount: p.amount })),
          unpaidMembers:
            paidAmount === 0 ? [{ _id: member._id, name: member.name }] : [],
        };
      });

      return {
        member,
        totalOwed,
        contributions: memberContributions,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all contributions and payments grouped by member, including unpaid summary
router.get("/contributions/payments-per-member", async (req, res) => {
  try {
    // 1️⃣ Get all active members
    const members = await Registration.find({
      isDeleted: { $ne: true },
    }).lean();

    // 2️⃣ Get all contributions
    const contributions = await financialContribution.find().lean();

    // 3️⃣ Get all payments (populate member + contribution)
    const rawPayments = await contributionPayment
      .find()
      .populate("member", "name")
      .populate("contribution", "title targetAmount description")
      .lean();

    // 4️⃣ Remove orphaned payments
    const payments = rawPayments.filter((p) => p.member && p.contribution);

    const result = [];

    // 5️⃣ Loop per member
    for (const member of members) {
      let totalOwed = 0;

      const memberContributions = contributions.map((c) => {
        // Payments for this contribution
        const contribPayments = payments.filter(
          (p) => String(p.contribution._id) === String(c._id)
        );

        // Payment made by THIS member
        const payment = contribPayments.find(
          (p) => String(p.member._id) === String(member._id)
        );

        // 💰 RAW amount member paid (can exceed target)
        const rawPaidAmount = payment?.amount || 0;

        // 🎯 Target amount
        const targetAmount = c.targetAmount || 0;

        // ✅ Effective paid amount (CAP at target)
        const effectivePaidAmount = Math.min(rawPaidAmount, targetAmount);

        // ❌ Remaining (never negative)
        const notPaid = Math.max(targetAmount - effectivePaidAmount, 0);

        // ➕ Accumulate total owed
        totalOwed += notPaid;

        // 👥 Paid members for this contribution
        const paidMembers = contribPayments.map((p) => ({
          _id: p.member._id,
          name: p.member.name,
          amount: p.amount,
        }));

        // 👥 Unpaid members
        const unpaidMembers = members
          .filter(
            (m) => !paidMembers.some((pm) => String(pm._id) === String(m._id))
          )
          .map((m) => ({
            _id: m._id,
            name: m.name,
          }));

        return {
          contributionId: c._id,
          title: c.title,
          targetAmount,
          description: c.description,

          // 🔹 Show actual amount paid
          paidAmount: rawPaidAmount,

          // 🔹 Safe remaining balance
          notPaid,

          // 🔹 Date paid
          paidOn: payment?.paidOn || null,

          paidMembers,
          unpaidMembers,

          // (optional helper)
          status: rawPaidAmount >= targetAmount ? "paid" : "pending",
        };
      });

      result.push({
        member,
        contributions: memberContributions,
        totalOwed,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Summary Route Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// router.get("/contributions/payments-per-member", async (req, res) => {
//   try {
//     // Get all members
//     const members = await Registration.find().lean();

//     // Get all contributions
//     const contributions = await financialContribution.find().lean();

//     // Get all payments
//     const payments = await contributionPayment
//       .find()
//       .populate("member", "name")
//       .populate("contribution", "title targetAmount")
//       .lean();

//     // Map payments by member
//     const paymentsByMember = {};

//     members.forEach((member) => {
//       let totalOwed = 0; // total not paid

//       const contribs = contributions.map((c) => {
//         // Payments for this contribution
//         const contribPayments = payments.filter(
//           (p) => String(p.contribution._id) === String(c._id)
//         );

//         // Check if this member paid
//         const payment = contribPayments.find(
//           (p) => String(p.member._id) === String(member._id)
//         );

//         const paidAmount = payment ? payment.amount : 0;
//         const notPaid = c.targetAmount - paidAmount;
//         totalOwed += notPaid > 0 ? notPaid : 0;

//         // List of members who paid this contribution
//         const paidMembers = contribPayments.map((p) => ({
//           _id: p.member._id,
//           name: p.member.name,
//           amount: p.amount,
//         }));

//         // Members who haven't paid this contribution
//         const unpaidMembers = members
//           .filter(
//             (m) => !paidMembers.some((pm) => String(pm._id) === String(m._id))
//           )
//           .map((m) => ({ _id: m._id, name: m.name }));

//         return {
//           contributionId: c._id,
//           title: c.title,
//           targetAmount: c.targetAmount,
//           paidAmount,
//           paidOn: payment ? payment.paidOn : null,
//           notPaid: notPaid > 0 ? notPaid : 0,
//           paidMembers,
//           unpaidMembers,
//         };
//       });

//       paymentsByMember[member._id] = {
//         member: member,
//         contributions: contribs,
//         totalOwed,
//       };
//     });

//     res.json(Object.values(paymentsByMember));
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

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

      const payment = await contributionPayment.create({
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

// GET my contributions and payments
router.get("/contributions/my-payments/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;

    // Only fetch the member if not soft-deleted
    const member = await Registration.findOne({
      _id: memberId,
      isDeleted: { $ne: true },
    }).lean();

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Get all contributions
    const contributions = await financialContribution.find().lean();

    // Get all payments for this member
    const payments = await contributionPayment
      .find({ member: memberId })
      .populate("contribution", "title targetAmount")
      .lean();

    // Map contributions to payment status
    const contribStatus = contributions.map((c) => {
      const payment = payments.find(
        (p) => String(p.contribution._id) === String(c._id)
      );

      const paidAmount = payment ? payment.amount : 0;
      const notPaid = c.targetAmount - paidAmount;

      return {
        contributionId: c._id,
        title: c.title,
        targetAmount: c.targetAmount,
        paidAmount,
        paidOn: payment ? payment.paidOn : null,
        notPaid: notPaid > 0 ? notPaid : 0,
        description: c.description,
      };
    });

    // Total amount owed
    const totalOwed = contribStatus.reduce(
      (sum, c) => sum + (c.notPaid || 0),
      0
    );

    res.json({
      member: {
        _id: member._id,
        name: member.name,
        parish: member.parish,
        partYouSing: member.partYouSing,
      },
      contributions: contribStatus,
      totalOwed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all attendance grouped by member
router.get("/attendance/per-member", async (req, res) => {
  try {
    // Only fetch members who are NOT soft-deleted
    const members = await Registration.find({
      isDeleted: { $ne: true },
    }).lean();

    const allAttendance = await Attendance.find()
      .populate("member", "name parish partYouSing")
      .sort({ date: -1 })
      .lean();

    const attendanceByMember = members.map((member) => {
      const records = allAttendance.filter(
        (a) => a.member && String(a.member._id) === String(member._id)
      );

      return {
        member: {
          _id: member._id,
          name: member.name,
          parish: member.parish,
          partYouSing: member.partYouSing,
        },
        attendance: records.map((r) => ({
          _id: r._id,
          date: r.date,
          present: r.present,
        })),
      };
    });

    res.json(attendanceByMember);
  } catch (err) {
    console.error("Failed to fetch attendance per member:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
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
