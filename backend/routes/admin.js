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