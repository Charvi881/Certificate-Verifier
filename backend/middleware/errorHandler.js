const jwt   = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET || "securedtrust_secret_change_in_production";

// ─── Generate Tokens ──────────────────────────────────────────────────────────
const generateToken   = (user) => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
const generateRefresh = (user) => jwt.sign({ id: user._id },                  JWT_SECRET, { expiresIn: "7d"  });

// ─── Protect Middleware ───────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("🔐 No token found in Authorization header");
      return res.status(401).json({ error: "Not authorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user) {
      console.log("🔐 User not found for id:", decoded.id);
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log("🔐 JWT Error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ─── Role Guards ──────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    console.log("🔐 Role check failed. User role:", req.user?.role, "Required:", roles);
    return res.status(403).json({ error: "Insufficient privileges" });
  }
  next();
};

const isAdmin      = requireRole("admin");
const isUniversity = requireRole("admin", "university");

// ─── Error Handler ────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // ✅ Log the full error so we can see what's actually going wrong
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  console.error(`[ERROR] Stack:`, err.stack);

  // ✅ Multer errors (file upload issues) — give a proper 400 not 500
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Max 10MB allowed." });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ error: "Unexpected file field. Use field name 'certificate'." });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { protect, isAdmin, isUniversity, generateToken, generateRefresh, errorHandler };