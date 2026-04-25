const express = require("express");
const router  = express.Router();
const { User, University, Certificate } = require("../models");
const { protect, isAdmin }              = require("../middleware/errorHandler");
const { approveUniversityOnChain }      = require("../utils/blockchain");

// All admin routes are protected
router.use(protect, isAdmin);

// GET /api/admin/dashboard — stats overview
router.get("/dashboard", async (req, res, next) => {
  try {
    const [totalUnis, approvedUnis, totalCerts, totalUsers] = await Promise.all([
      University.countDocuments(),
      University.countDocuments({ isApproved: true }),
      Certificate.countDocuments({ status: "issued" }),
      User.countDocuments(),
    ]);
    const recentCerts = await Certificate.find({ status: "issued" })
      .sort("-createdAt").limit(5)
      .populate("university", "name shortName");
    res.json({ stats: { totalUnis, approvedUnis, totalCerts, totalUsers }, recentCerts });
  } catch (err) { next(err); }
});

// GET /api/admin/universities — list all
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

// POST /api/admin/universities — create and approve a university
router.post("/universities", async (req, res, next) => {
  try {
    const { name, shortName, email, walletAddress, location, website } = req.body;
    if (!name || !email || !walletAddress) return res.status(400).json({ error: "name, email, walletAddress required" });

    const uni = await University.create({ name, shortName, email, walletAddress, location, website });

    // Optionally approve on-chain
    try { await approveUniversityOnChain(walletAddress, name); } catch (e) { console.warn("Blockchain approval skipped:", e.message); }

    res.status(201).json({ university: uni });
  } catch (err) { next(err); }
});

// PATCH /api/admin/universities/:id/approve
router.patch("/universities/:id/approve", async (req, res, next) => {
  try {
    const uni = await University.findByIdAndUpdate(req.params.id,
      { isApproved: true, approvedAt: new Date(), approvedBy: req.user._id },
      { new: true }
    );
    if (!uni) return res.status(404).json({ error: "University not found" });

    try { await approveUniversityOnChain(uni.walletAddress, uni.name); } catch (e) { console.warn("Blockchain:", e.message); }

    res.json({ university: uni, message: "University approved" });
  } catch (err) { next(err); }
});

// PATCH /api/admin/universities/:id/revoke
router.patch("/universities/:id/revoke", async (req, res, next) => {
  try {
    const uni = await University.findByIdAndUpdate(req.params.id, { isApproved: false }, { new: true });
    if (!uni) return res.status(404).json({ error: "University not found" });
    res.json({ university: uni, message: "University approval revoked" });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().sort("-createdAt");
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
