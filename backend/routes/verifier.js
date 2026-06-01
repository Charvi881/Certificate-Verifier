const express = require("express");
const router  = express.Router();
const { Certificate } = require("../models");
const upload  = require("../middleware/upload");
const { hashBuffer } = require("../utils/ipfs");
const { verifyCertificateOnChain } = require("../utils/blockchain");

// ─── Helper: build a safe public cert object ─────────────────────────────────
// For revoked certs we deliberately omit sensitive on-chain proof fields
// so the response can't be repurposed to fake a "verified" display.
function buildCertResponse(cert, status) {
  const isRevoked = status === "REVOKED";
  return {
    // Always include identity fields
    certId:        cert.certId,
    recipientName: cert.recipientName,
    courseName:    cert.courseName,
    university:    cert.university,
    issueDate:     cert.issueDate,
    grade:         isRevoked ? undefined : cert.grade,
    network:       cert.network,
    skills:        isRevoked ? undefined : cert.skills,
    // Revocation info — only present when revoked
    revokedAt:     isRevoked ? cert.revokedAt     : undefined,
    revokeReason:  isRevoked ? cert.revokeReason  : undefined,
    // On-chain proof — omit for revoked so UI can't render a "valid-looking" card
    txHash:        isRevoked ? undefined : cert.txHash,
    ipfsHash:      isRevoked ? undefined : cert.ipfsHash,
    blockNumber:   isRevoked ? undefined : cert.blockNumber,
    certHash:      isRevoked ? undefined : cert.certHash,
    expiryDate:    cert.expiryDate,
    verifications: cert.verifications,
  };
}

// POST /api/verifier/verify/upload — verify by uploading the original PDF
router.post("/verify/upload", upload.single("certificate"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "PDF file required" });

    const uploadedHash = hashBuffer(req.file.buffer);

    const cert = await Certificate.findOne({ certHash: uploadedHash })
      .populate("university", "name shortName website location logo");

    if (!cert) {
      return res.json({
        status:  "NOT_FOUND",
        valid:   false,
        message: "No matching certificate found. This document may be tampered or never registered.",
        uploadedHash,
      });
    }

    const expired  = cert.expiryDate && new Date(cert.expiryDate) < new Date();
    const status   = cert.status === "revoked" ? "REVOKED" : expired ? "EXPIRED" : "VERIFIED";
    const isValid  = status === "VERIFIED";

    // Only increment verification counter for valid certs
    if (isValid) {
      await Certificate.findByIdAndUpdate(cert._id, { $inc: { verifications: 1 } });
    }

    // Only attempt blockchain cross-check for valid certs
    let blockchainResult = null;
    if (isValid) {
      try { blockchainResult = await verifyCertificateOnChain(cert.certId, uploadedHash); } catch (e) {}
    }

    res.json({
      status,
      valid:       isValid,
      certificate: buildCertResponse(cert, status),
      blockchain:  isValid ? blockchainResult : null,
      uploadedHash: isValid ? uploadedHash : undefined,
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
    const status  = cert.status === "revoked" ? "REVOKED" : expired ? "EXPIRED" : "VERIFIED";
    const isValid = status === "VERIFIED";

    // Only increment verification counter for valid certs
    if (isValid) {
      await Certificate.findByIdAndUpdate(cert._id, { $inc: { verifications: 1 } });
    }

    res.json({
      status,
      valid:       isValid,
      certificate: buildCertResponse(cert, status),
      verifiedAt:  new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

// GET /api/verifier/search — search public certificates (issued only)
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