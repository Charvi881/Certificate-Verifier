const jwt  = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "securedtrust_secret_change_in_production";

// ─── Generate Tokens ─────────────────────────────────────────────────────────
const generateToken  = (user) => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
const generateRefresh = (user) => jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

// ─── Protect Middleware ──────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token provided" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ error: "User not found" });
    if (!req.user.isActive) return res.status(403).json({ error: "Account deactivated" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ─── Role Guards ─────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: "Insufficient privileges" });
  next();
};

const isAdmin      = requireRole("admin");
const isUniversity = requireRole("admin", "university");

// ─── Error Handler ────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error", ...(process.env.NODE_ENV === "development" && { stack: err.stack }) });
};

module.exports = { protect, isAdmin, isUniversity, generateToken, generateRefresh, errorHandler };
