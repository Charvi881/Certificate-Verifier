const express = require("express");
const router  = express.Router();
const { Certificate } = require("../models");
const upload  = require("../middleware/upload");
const { hashBuffer } = require("../utils/ipfs");
const { verifyCertificateOnChain } = require("../utils/blockchain");

// POST /api/verifier/verify/upload — verify by uploading the original PDF
router.post("/verify/upload", upload.single("certificate"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "PDF file required" });

    const uploadedHash = hashBuffer(req.file.buffer);

    // Find in DB by hash
    const cert = await Certificate.findOne({ certHash: uploadedHash })
      .populate("university", "name shortName website location logo");

    if (!cert) {
      return res.json({
        status: "NOT_FOUND",
        valid:  false,
        message: "No matching certificate found. This document may be tampered or never registered.",
        uploadedHash,
      });
    }

    // Cross-check with blockchain
    let blockchainResult = null;
    try { blockchainResult = await verifyCertificateOnChain(cert.certId, uploadedHash); } catch (e) {}

    // Increment verification count
    await Certificate.findByIdAndUpdate(cert._id, { $inc: { verifications: 1 } });

    const expired = cert.expiryDate && new Date(cert.expiryDate) < new Date();

    res.json({
      status:      cert.status === "revoked" ? "REVOKED" : expired ? "EXPIRED" : "VERIFIED",
      valid:       cert.status === "issued" && !expired,
      certificate: cert,
      blockchain:  blockchainResult,
      uploadedHash,
      verifiedAt:  new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

// GET /api/verifier/verify/:certId — verify by certificate ID
router.get("/verify/:certId", async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certId: req.params.certId })
      .populate("university", "name shortName website location logo");

    if (!cert) return res.json({ status: "NOT_FOUND", valid: false, message: "Certificate ID not found" });

    const expired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
    await Certificate.findByIdAndUpdate(cert._id, { $inc: { verifications: 1 } });

    res.json({
      status:      cert.status === "revoked" ? "REVOKED" : expired ? "EXPIRED" : "VERIFIED",
      valid:       cert.status === "issued" && !expired,
      certificate: cert,
      verifiedAt:  new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

// GET /api/verifier/search — search public certificates
router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) return res.status(400).json({ error: "Search query too short" });
    const certs = await Certificate.find({
      status: "issued",
      $or: [
        { recipientName: { $regex: q, $options: "i" } },
        { certId:        { $regex: q, $options: "i" } },
        { courseName:    { $regex: q, $options: "i" } },
      ]
    }).limit(10).populate("university", "name shortName");
    res.json({ results: certs });
  } catch (err) { next(err); }
});

module.exports = router;
