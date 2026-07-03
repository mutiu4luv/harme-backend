const express = require("express");
const { body, validationResult } = require("express-validator");
const FormSubmission = require("../module/formModel");

const router = express.Router();

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("placeOfResidenceInOwerri")
      .trim()
      .notEmpty()
      .withMessage("Place of residence is required"),
    body("partBelongInChoir")
      .trim()
      .notEmpty()
      .withMessage("Choir part is required"),
    body("contactAddress")
      .trim()
      .notEmpty()
      .withMessage("Contact address is required"),
    body("phoneNumber")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[0-9+()\-\s]{10,20}$/)
      .withMessage("Phone number must be valid"),
    body("emailAddress").trim().isEmail().withMessage("Valid email is required"),
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
      const form = await FormSubmission.create({
        name: req.body.name,
        placeOfResidenceInOwerri: req.body.placeOfResidenceInOwerri,
        partBelongInChoir: req.body.partBelongInChoir,
        contactAddress: req.body.contactAddress,
        phoneNumber: req.body.phoneNumber,
        emailAddress: req.body.emailAddress,
      });

      res.status(201).json({
        message: "Form submitted successfully",
        form,
      });
    } catch (err) {
      console.error("❌ Create form error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const forms = await FormSubmission.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (err) {
    console.error("❌ Fetch form submissions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
