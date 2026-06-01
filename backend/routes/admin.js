const express = require("express");
const router  = express.Router();
const { User, University, Certificate } = require("../models");
const { protect, isAdmin }              = require("../middleware/errorHandler");
const { approveUniversityOnChain }      = require("../utils/blockchain");

router.use(protect, isAdmin);

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res, next) => {
  try {
    const [totalUnis, approvedUnis, pendingUnis, totalCerts, totalUsers] = await Promise.all([
      University.countDocuments(),
      University.countDocuments({ isApproved: true }),
      University.countDocuments({ isApproved: false, rejectedAt: { $exists: false } }),
      Certificate.countDocuments({ status: "issued" }),
      User.countDocuments(),
    ]);

    const recentCerts   = await Certificate.find({ status: "issued" })
      .sort("-createdAt").limit(5).populate("university", "name shortName");
    const pendingUniList = await University.find({
      isApproved: false, rejectedAt: { $exists: false }
    }).sort("-createdAt").limit(10);

    res.json({
      stats: { totalUnis, approvedUnis, pendingUnis, totalCerts, totalUsers },
      recentCerts,
      pendingUniList
    });
  } catch (err) { next(err); }
});

// GET /api/admin/universities
router.get("/universities", async (req, res, next) => {
  try {
    const { approved, search } = req.query;
    const filter = {};
    if (approved !== undefined) filter.isApproved = approved === "true";
    if (search) filter.name = { $regex: search, $options: "i" };
    const universities = await University.find(filter).sort("-createdAt");
    res.json({ universities });
  } catch (err) { next(err); }
});

// PATCH /api/admin/universities/:id/approve
router.patch("/universities/:id/approve", async (req, res, next) => {
  try {
    const uni = await University.findByIdAndUpdate(req.params.id,
      { isApproved: true, approvedAt: new Date(), approvedBy: req.user._id, $unset: { rejectedAt: 1, rejectReason: 1 } },
      { new: true }
    );
    if (!uni) return res.status(404).json({ error: "University not found" });

    // Link user with matching email
    const linkResult = await User.updateMany(
      { email: uni.email, role: "university" },
      { $set: { universityId: uni._id } }
    );
    console.log(`✅ Approved: ${uni.name} | Linked ${linkResult.modifiedCount} user(s)`);

    try { await approveUniversityOnChain(uni.walletAddress, uni.name); }
    catch (e) { console.warn("Blockchain skipped:", e.message); }

    res.json({
      university: uni,
      linkedUsers: linkResult.modifiedCount,
      message: `"${uni.name}" approved. ${linkResult.modifiedCount} user(s) can now issue certificates.`
    });
  } catch (err) { next(err); }
});

// PATCH /api/admin/universities/:id/reject
router.patch("/universities/:id/reject", async (req, res, next) => {
  try {
    const { reason } = req.body;
    const uni = await University.findByIdAndUpdate(req.params.id,
      { isApproved: false, rejectedAt: new Date(), rejectReason: reason || "Declined by admin" },
      { new: true }
    );
    if (!uni) return res.status(404).json({ error: "University not found" });
    res.json({ university: uni, message: `"${uni.name}" declined.` });
  } catch (err) { next(err); }
});

// PATCH /api/admin/universities/:id/revoke
router.patch("/universities/:id/revoke", async (req, res, next) => {
  try {
    const uni = await University.findByIdAndUpdate(
      req.params.id, { isApproved: false }, { new: true }
    );
    if (!uni) return res.status(404).json({ error: "University not found" });
    res.json({ university: uni, message: "Approval revoked" });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().sort("-createdAt").populate("universityId", "name isApproved");
    res.json({ users });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/toggle
router.patch("/users/:id/toggle", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user, message: `User ${user.isActive ? "activated" : "deactivated"}` });
  } catch (err) { next(err); }
});

module.exports = router;
// ─── GET /api/admin/ledger ────────────────────────────────────────────────────
router.get("/ledger", async (req, res, next) => {
  try {
    const certs = await Certificate.find()
      .sort("createdAt")
      .populate("university", "name shortName walletAddress")
      .populate("issuedBy", "name email")
      .lean();

    const NETWORK = process.env.POLYGON_NETWORK || "mumbai";
    const EXPLORER = NETWORK === "mainnet"
      ? "https://polygonscan.com"
      : "https://mumbai.polygonscan.com";

    const blocks = [
      {
        blockIndex:    0,
        type:          "GENESIS",
        hash:          "0000000000000000000000000000000000000000",
        prevHash:      "0000000000000000",
        createdAt:     certs[0]?.createdAt || new Date(),
        txHash:        null,
        blockNumber:   null,
        walletAddress: null,
        network:       NETWORK,
        txStatus:      null,
        explorerUrl:   null,
        recipientName: null,
        courseName:    null,
        university:    null,
      },
    ];

    certs.forEach((c, idx) => {
      const explorerUrl = c.txHash ? `${EXPLORER}/tx/${c.txHash}` : null;
      const base = {
        blockIndex:    idx + 1,
        prevHash:      blocks[idx].hash,
        hash:          c.certHash || c.txHash || `block_${c._id}`,
        recipientName: c.recipientName,
        courseName:    c.courseName,
        university:    c.university?.name || c.university?.shortName || "—",
        walletAddress: c.university?.walletAddress || null,
        year:          c.issueDate ? new Date(c.issueDate).getFullYear() : "—",
        createdAt:     c.createdAt,
        txHash:        c.txHash || null,
        blockNumber:   c.blockNumber || null,
        network:       c.network || NETWORK,
        txStatus:      c.txHash ? "confirmed" : "off-chain",
        explorerUrl,
        issuedBy:      c.issuedBy?.name || null,
        _id:           c._id,
      };

      if (c.status === "revoked") {
        blocks.push({
          ...base,
          type:       "REVOKED",
          revokedAt:  c.revokedAt,
          revokeReason: c.revokeReason,
        });
      } else {
        blocks.push({ ...base, type: "ISSUED" });
      }

      if (c.verifications > 0) {
        blocks.push({
          ...base,
          blockIndex:  blocks.length,
          type:        "VERIFIED",
          prevHash:    base.hash,
          hash:        `verify_${c._id}`,
          createdAt:   c.updatedAt,
          txHash:      null,
          blockNumber: null,
          txStatus:    "read-only",
          explorerUrl: null,
        });
      }
    });

    res.json({ blocks, connected: true, total: blocks.length });
  } catch (err) { next(err); }
});

// ─── GET /api/admin/network ───────────────────────────────────────────────────
// Returns nodes (universities + admin) and recent activity
router.get("/network", async (req, res, next) => {
  try {
    const [unis, recentCerts] = await Promise.all([
      University.find().lean(),
      Certificate.find()
        .sort("-createdAt")
        .limit(20)
        .populate("university", "name shortName")
        .lean(),
    ]);

    // Build node list
    const nodes = [
      {
        _id: "admin-node",
        nodeId: "node-admin-01",
        name: "Admin Node",
        type: "admin",
        status: "online",
        synced: true,
        blockHeight: recentCerts.length + 1,
        certsIssued: recentCerts.length,
        lastPing: new Date(),
        endpoint: "internal",
      },
      ...unis.map((u, i) => ({
        _id: u._id,
        nodeId: `node-univ-${String(i + 2).padStart(2, "0")}`,
        name: u.shortName || u.name,
        type: "university",
        status: u.isApproved ? "online" : "offline",
        synced: u.isApproved,
        blockHeight: u.isApproved ? recentCerts.length + 1 : Math.max(0, recentCerts.length - 2),
        certsIssued: u.totalIssued || 0,
        lastPing: u.updatedAt,
        endpoint: u.walletAddress
          ? u.walletAddress.slice(0, 10) + "…"
          : "pending",
      })),
    ];

    // Build activity feed from recent certs
    const activity = recentCerts.map((c) => ({
      type: c.status === "revoked" ? "REVOKED" : "ISSUED",
      actor: c.university?.name || c.university?.shortName || "System",
      recipientName: c.recipientName,
      hash: c.certHash || c.txHash || String(c._id),
      createdAt: c.createdAt,
    }));

    res.json({ nodes, activity, connected: true });
  } catch (err) { next(err); }
});


// ─── GET /api/admin/certificates ─────────────────────────────────────────────
router.get("/certificates", async (req, res, next) => {
  try {
    const certificates = await Certificate.find()
      .sort("-createdAt")
      .populate("university", "name shortName")
      .populate("issuedBy", "name email")
      .lean();
    res.json({ certificates });
  } catch (err) { next(err); }
});

// ─── PATCH /api/admin/certificates/:id/revoke ─────────────────────────────────
router.patch("/certificates/:id/revoke", async (req, res, next) => {
  try {
    const { reason } = req.body;
    const cert = await Certificate.findByIdAndUpdate(
      req.params.id,
      {
        status: "revoked",
        revokedAt: new Date(),
        revokedBy: req.user._id,
        revokeReason: reason || "Revoked by admin",
      },
      { new: true }
    ).populate("university", "name shortName");
    if (!cert) return res.status(404).json({ error: "Certificate not found" });
    res.json({ certificate: cert, message: "Certificate revoked successfully" });
  } catch (err) { next(err); }
});