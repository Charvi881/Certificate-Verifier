const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ─── User Model ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true, minlength: 8 },
  role:         { type: String, enum: ["admin", "university", "verifier"], required: true },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: "University" },
  isActive:     { type: Boolean, default: true },
  lastLogin:    Date,
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function (plain) { return bcrypt.compare(plain, this.password); };
userSchema.methods.toJSON = function () { const obj = this.toObject(); delete obj.password; return obj; };

// ─── University Model ─────────────────────────────────────────────────────────
const universitySchema = new mongoose.Schema({
  name:          { type: String, required: true, unique: true },
  shortName:     { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  location:      String,
  website:       String,
  logo:          String,
  isApproved:    { type: Boolean, default: false },
  approvedAt:    Date,
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectedAt:    Date,       // ← NEW
  rejectReason:  String,     // ← NEW
  totalIssued:   { type: Number, default: 0 },
}, { timestamps: true });

// ─── Certificate Model ────────────────────────────────────────────────────────
const certificateSchema = new mongoose.Schema({
  certId:         { type: String, required: true, unique: true },
  recipientName:  { type: String, required: true },
  recipientEmail: { type: String, required: true },
  courseName:     { type: String, required: true },
  grade:          { type: String, required: true },
  issueDate:      { type: Date,   required: true },
  expiryDate:     Date,
  university:     { type: mongoose.Schema.Types.ObjectId, ref: "University", required: true },
  issuedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User",       required: true },
  certHash:       { type: String, required: true },
  txHash:         String,
  blockNumber:    Number,
  ipfsHash:       String,
  metadataURI:    String,
  network:        { type: String, default: "polygon_mumbai" },
  status:         { type: String, enum: ["pending", "issued", "revoked"], default: "pending" },
  revokedAt:      Date,
  revokedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  revokeReason:   String,
  skills:         [String],
  verifications:  { type: Number, default: 0 },
}, { timestamps: true });

const User        = mongoose.model("User",        userSchema);
const University  = mongoose.model("University",  universitySchema);
const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = { User, University, Certificate };