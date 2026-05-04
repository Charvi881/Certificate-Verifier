const jwt  = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "securedtrust_secret_change_in_production";

// ─── Generate Tokens ─────────────────────────────────────────────────────────
const generateToken  = (user) => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
const generateRefresh = (user) => jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

// ─── Protect Middleware ──────────────────────────────────────────────────────


const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FETCH FULL USER FROM DB
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user; // ✅ now includes universityId

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
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
