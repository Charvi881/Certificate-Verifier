const express = require("express");
const router  = express.Router();
const { User, University } = require("../models");
const { generateToken, generateRefresh, protect } = require("../middleware/errorHandler");

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, universityName, shortName, location, website } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "All fields required" });
    if (!["university", "verifier"].includes(role))
      return res.status(400).json({ error: "Invalid role" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    let universityId = null;

    if (role === "university") {
      if (!universityName?.trim())
        return res.status(400).json({ error: "University name is required" });

      // Check duplicate university name
      const existingUni = await University.findOne({
        name: { $regex: `^${universityName.trim()}$`, $options: "i" }
      });
      if (existingUni)
        return res.status(409).json({ error: "A university with this name is already registered." });

      // Auto shortName from initials
      const generatedShortName = shortName?.trim() ||
        universityName.trim().split(" ").map(w => w[0]).join("").toUpperCase();

      // Create university as PENDING
      const uni = await University.create({
        name:          universityName.trim(),
        shortName:     generatedShortName,
        email:         email.toLowerCase(),
        walletAddress: `PENDING_${Date.now()}`,
        location:      location?.trim() || "",
        website:       website?.trim() || "",
        isApproved:    false,
      });

      universityId = uni._id;
      console.log(`🎓 University registered (pending): ${universityName}`);
    }

    const user    = await User.create({ name, email, password, role, universityId });
    const token   = generateToken(user);
    const refresh = generateRefresh(user);

    res.status(201).json({
      user, token, refresh,
      message: role === "university"
        ? "University registered! Pending admin approval."
        : "Registration successful!"
    });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() }).populate("universityId");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isActive)
      return res.status(403).json({ error: "Account deactivated" });

    user.lastLogin = new Date();
    await user.save();

    const token   = generateToken(user);
    const refresh = generateRefresh(user);
    res.json({ user, token, refresh });
  } catch (err) { next(err); }
});

// GET /api/auth/me — returns user with populated university
router.get("/me", protect, async (req, res) => {
  const user = await require("../models").User
    .findById(req.user._id)
    .populate("universityId");
  res.json({ user });
});

module.exports = router;