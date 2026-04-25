const express = require("express");
const router  = express.Router();
const { User } = require("../models");
const { generateToken, generateRefresh, protect } = require("../middleware/errorHandler");

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: "All fields required" });
    if (!["university", "verifier"].includes(role)) return res.status(400).json({ error: "Invalid role" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user  = await User.create({ name, email, password, role });
    const token = generateToken(user);
    const refresh = generateRefresh(user);

    res.status(201).json({ user, token, refresh, message: "Registration successful" });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ error: "Account deactivated" });

    user.lastLogin = new Date();
    await user.save();

    const token   = generateToken(user);
    const refresh = generateRefresh(user);
    res.json({ user, token, refresh });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => res.json({ user: req.user }));

module.exports = router;
