const express = require("express");
const router  = express.Router();
const crypto  = require("crypto");
const { Certificate, University } = require("../models");
const { protect, isUniversity }   = require("../middleware/errorHandler");
const upload                      = require("../middleware/upload");
const { hashBuffer, uploadToIPFS, uploadMetadataToIPFS } = require("../utils/ipfs");
const { issueCertificateOnChain, revokeCertificateOnChain } = require("../utils/blockchain");

router.use(protect, isUniversity);

// GET /api/university/certificates — all certs issued by this university
router.get("/certificates", async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = { issuedBy: req.user._id };
    if (status)  filter.status = status;
    if (search)  filter.$or = [
      { recipientName: { $regex: search, $options: "i" } },
      { courseName:    { $regex: search, $options: "i" } },
      { certId:        { $regex: search, $options: "i" } },
    ];
    const skip  = (page - 1) * limit;
    const [certs, total] = await Promise.all([
      Certificate.find(filter).sort("-createdAt").skip(skip).limit(+limit).populate("university", "name shortName"),
      Certificate.countDocuments(filter),
    ]);
    res.json({ certificates: certs, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/university/certificates/issue — issue a new certificate
router.post("/certificates/issue", upload.single("certificate"), async (req, res, next) => {
  try {
    const { recipientName, recipientEmail, courseName, grade, issueDate, expiryDate, skills } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Certificate PDF required" });
    if (!recipientName || !recipientEmail || !courseName || !grade || !issueDate)
      return res.status(400).json({ error: "Missing required fields" });

    // Check university approved
  if (!req.user.universityId) {
  return res.status(403).json({ error: "User not linked to any university" });
}

const uni = await University.findOne({
  _id: req.user.universityId,
  isApproved: true,
});

if (!uni) {
  return res.status(403).json({ error: "University not approved to issue certificates" });
}
    if (!uni) return res.status(403).json({ error: "University not approved to issue certificates" });

    // Generate SHA-256 hash of the PDF
    const certHash = hashBuffer(file.buffer);

    // Generate unique certId
    const certId = `SC-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Upload PDF to IPFS
    const { ipfsHash, ipfsUrl } = await uploadToIPFS(file.buffer, `${certId}.pdf`, { certId, recipientName });

    // Upload metadata to IPFS
    const metadata = { certId, recipientName, recipientEmail, courseName, grade, issueDate, expiryDate, university: uni.name, ipfsHash, certHash, issuedAt: new Date().toISOString() };
    const { ipfsHash: metaHash } = await uploadMetadataToIPFS(metadata);
    const metadataURI = `ipfs://${metaHash}`;

    // Issue on blockchain
    let txHash, blockNumber;
    try {
      const result = await issueCertificateOnChain({ certId, certHash, ipfsHash, metadataURI });
      txHash = result.txHash;
      blockNumber = result.blockNumber;
    } catch (e) { console.warn("Blockchain issue skipped:", e.message); }

    // Save to MongoDB
    const cert = await Certificate.create({
      certId, recipientName, recipientEmail, courseName, grade,
      issueDate: new Date(issueDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      university: uni._id, issuedBy: req.user._id,
      certHash, txHash, blockNumber, ipfsHash, metadataURI,
      skills: skills ? JSON.parse(skills) : [],
      status: "issued",
    });

    // Update university total
    await University.findByIdAndUpdate(uni._id, { $inc: { totalIssued: 1 } });

    res.status(201).json({ certificate: cert, ipfsUrl, message: "Certificate issued successfully" });
  } catch (err) { next(err); }
});

// PATCH /api/university/certificates/:certId/revoke
router.patch("/certificates/:certId/revoke", async (req, res, next) => {
  try {
    const { reason } = req.body;
    const cert = await Certificate.findOne({ certId: req.params.certId, issuedBy: req.user._id });
    if (!cert) return res.status(404).json({ error: "Certificate not found" });
    if (cert.status === "revoked") return res.status(400).json({ error: "Already revoked" });

    try { await revokeCertificateOnChain(cert.certId); } catch (e) { console.warn("Blockchain revoke:", e.message); }

    cert.status = "revoked"; cert.revokedAt = new Date(); cert.revokedBy = req.user._id; cert.revokeReason = reason;
    await cert.save();

    res.json({ certificate: cert, message: "Certificate revoked" });
  } catch (err) { next(err); }
});

// GET /api/university/stats
router.get("/stats", async (req, res, next) => {
  try {
    const [issued, revoked, pending] = await Promise.all([
      Certificate.countDocuments({ issuedBy: req.user._id, status: "issued" }),
      Certificate.countDocuments({ issuedBy: req.user._id, status: "revoked" }),
      Certificate.countDocuments({ issuedBy: req.user._id, status: "pending" }),
    ]);
    res.json({ stats: { issued, revoked, pending, total: issued + revoked + pending } });
  } catch (err) { next(err); }
});

module.exports = router;
