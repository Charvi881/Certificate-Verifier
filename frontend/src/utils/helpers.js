// SHA-256 hash of an ArrayBuffer (browser-native)
export async function sha256File(file) {
  const buffer = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buffer);
  const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hex;
}

// Truncate long hash strings
export function truncateHash(h, start = 10, end = 8) {
  if (!h) return "";
  return `${h.slice(0, start)}...${h.slice(-end)}`;
}

// Format ISO date to readable
export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Relative time (e.g. "3 days ago")
export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}

// Copy to clipboard
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

// Status helpers
export const STATUS_META = {
  VERIFIED: { label: "Verified",   color: "#00e6b4", bg: "rgba(0,230,180,0.1)",  icon: "✓",  badge: "badge-verified" },
  REVOKED:  { label: "Revoked",    color: "#ff4d6d", bg: "rgba(255,77,109,0.1)", icon: "✕",  badge: "badge-revoked"  },
  EXPIRED:  { label: "Expired",    color: "#f5a623", bg: "rgba(245,166,35,0.1)", icon: "⚠",  badge: "badge-expired"  },
  NOT_FOUND:{ label: "Not Found",  color: "#ff4d6d", bg: "rgba(255,77,109,0.1)", icon: "?",  badge: "badge-revoked"  },
  issued:   { label: "Issued",     color: "#00e6b4", bg: "rgba(0,230,180,0.1)",  icon: "✓",  badge: "badge-verified" },
  revoked:  { label: "Revoked",    color: "#ff4d6d", bg: "rgba(255,77,109,0.1)", icon: "✕",  badge: "badge-revoked"  },
  pending:  { label: "Pending",    color: "#9090c0", bg: "rgba(120,120,180,0.1)",icon: "…",  badge: "badge-pending"  },
};
