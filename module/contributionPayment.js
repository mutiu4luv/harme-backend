// models/ContributionPayment.js
const mongoose = require("mongoose");

const ContributionPaymentSchema = new mongoose.Schema(
  {
    contribution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contribution",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidOn: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ContributionPayment",
  ContributionPaymentSchema
);
