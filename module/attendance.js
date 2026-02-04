const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    present: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ member: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
