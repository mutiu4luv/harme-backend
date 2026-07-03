const mongoose = require("mongoose");

const FormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    placeOfResidenceInOwerri: {
      type: String,
      required: true,
      trim: true,
    },
    partBelongInChoir: {
      type: String,
      required: true,
      trim: true,
    },
    contactAddress: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    emailAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormSubmission", FormSchema);
