import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../utils/api";
import { timeAgo, fmtDate, copyText } from "../../utils/helpers";
import toast from "react-hot-toast";

// ─── Shared tiny helpers ──────────────────────────────────────────────────────
function MonoSpan({ children, color = "rgba(255,255,255,0.5)", size = 11 }) {
  return (
    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: size, color }}>
      {children}
    </span>
  );
}

function shortHash(h = "") {
  return h.length > 16 ? h.slice(0, 8) + "…" + h.slice(-6) : h;
}

function TxTypeBadge({ type }) {
  const map = {
    ISSUED:   { bg: "rgba(0,230,180,0.1)",  color: "#00e6b4", border: "rgba(0,230,180,0.25)",  label: "ISSUED"   },
    REVOKED:  { bg: "rgba(255,77,109,0.1)", color: "#ff4d6d", border: "rgba(255,77,109,0.25)", label: "REVOKED"  },
    VERIFIED: { bg: "rgba(0,120,255,0.1)",  color: "#4da6ff", border: "rgba(0,120,255,0.25)",  label: "VERIFIED" },
    GENESIS:  { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.25)", label: "GENESIS"  },
  };
  const s = map[type] || map.ISSUED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 10, color: s.color, fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em"
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

// ─── Connection status badge ──────────────────────────────────────────────────
function ConnectionBadge({ connected, lastFetched }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "5px 12px", borderRadius: 20,
      background: connected ? "rgba(0,230,180,0.08)" : "rgba(245,166,35,0.08)",
      border: `1px solid ${connected ? "rgba(0,230,180,0.2)" : "rgba(245,166,35,0.25)"}`,
      fontSize: 11, fontFamily: "'DM Mono',monospace",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: connected ? "#00e6b4" : "#f5a623",
        boxShadow: connected ? "0 0 6px #00e6b4" : "0 0 6px #f5a623",
        animation: "blink 1.5s infinite",
      }} />
      <span style={{ color: connected ? "#00e6b4" : "#f5a623" }}>
        {connected ? "LIVE" : "DEMO"}
      </span>
      {lastFetched && (
        <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 2 }}>
          · updated {timeAgo(lastFetched)}
        </span>
      )}
    </div>
  );
}

// ─── LEDGER PAGE ─────────────────────────────────────────────────────────────
export function LedgerPage() {
  const [blocks,     setBlocks]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("ALL");
  const [search,     setSearch]     = useState("");
  const [expanded,   setExpanded]   = useState(null);
  const [page,       setPage]       = useState(1);
  const [connected,  setConnected]  = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [newHashes,  setNewHashes]  = useState(new Set()); // for "new entry" animation
  const prevHashesRef = useRef(new Set());
  const PER_PAGE = 10;
  const POLL_MS  = 15000;

  const load = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const { data } = await api.get("/admin/ledger");
      const incoming = data.blocks || data.transactions || [];

      // Detect newly-added blocks on polls
      if (isPolling) {
        const freshHashes = new Set(
          incoming.map(b => b.hash || b._id).filter(Boolean)
        );
        const newOnes = new Set(
          [...freshHashes].filter(h => !prevHashesRef.current.has(h))
        );
        if (newOnes.size > 0) {
          setNewHashes(newOnes);
          toast.success(`${newOnes.size} new block${newOnes.size > 1 ? "s" : ""} added`);
          setTimeout(() => setNewHashes(new Set()), 3000);
        }
        prevHashesRef.current = freshHashes;
      } else {
        prevHashesRef.current = new Set(
          incoming.map(b => b.hash || b._id).filter(Boolean)
        );
      }

      setBlocks(incoming);
      setConnected(data.connected === true);
      setLastFetched(new Date());
    } catch {
      if (!isPolling) {
        setBlocks(DEMO_BLOCKS);
        setConnected(false);
        setLastFetched(new Date());
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = blocks.filter(b => {
    const matchType   = filter === "ALL" || b.type === filter;
    const matchSearch = !search ||
      b.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      b.hash?.toLowerCase().includes(search.toLowerCase()) ||
      b.university?.toLowerCase().includes(search.toLowerCase()) ||
      b.courseName?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    ALL:      blocks.length,
    ISSUED:   blocks.filter(b => b.type === "ISSUED").length,
    REVOKED:  blocks.filter(b => b.type === "REVOKED").length,
    VERIFIED: blocks.filter(b => b.type === "VERIFIED").length,
  };

  const handleCopy = (hash) => {
    copyText?.(hash) ?? navigator.clipboard.writeText(hash);
    toast.success("Hash copied!");
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100vh" }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .new-block { animation: slideIn 0.4s ease forwards; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(0,230,180,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>◈ Admin</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
            Blockchain Ledger
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            Immutable record of every certificate transaction on the chain
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 8 }}>
          <ConnectionBadge connected={connected} lastFetched={lastFetched} />
          {!connected && (
            <span style={{ fontSize: 11, color: "rgba(245,166,35,0.6)", fontFamily: "'DM Mono',monospace" }}>
              (showing demo data)
            </span>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Blocks",      value: counts.ALL,      color: "#fff" },
          { label: "Issued",            value: counts.ISSUED,   color: "#00e6b4" },
          { label: "Verified queries",  value: counts.VERIFIED, color: "#4da6ff" },
          { label: "Revoked",           value: counts.REVOKED,  color: "#ff4d6d" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {["ALL","ISSUED","VERIFIED","REVOKED"].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 11, fontFamily: "'DM Mono',monospace", transition: "all 0.15s",
            background: filter === f ? (f === "ISSUED" ? "rgba(0,230,180,0.12)" : f === "REVOKED" ? "rgba(255,77,109,0.12)" : f === "VERIFIED" ? "rgba(0,120,255,0.12)" : "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.04)",
            color: filter === f ? (f === "ISSUED" ? "#00e6b4" : f === "REVOKED" ? "#ff4d6d" : f === "VERIFIED" ? "#4da6ff" : "#fff") : "rgba(255,255,255,0.4)",
            borderWidth: 1, borderStyle: "solid",
            borderColor: filter === f ? "rgba(255,255,255,0.12)" : "transparent"
          }}>
            {f} <span style={{ opacity: 0.5 }}>({counts[f] ?? blocks.length})</span>
          </button>
        ))}
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, hash, university…"
          style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe", fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none", width: 240 }}
        />
        <button onClick={() => load(false)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(0,230,180,0.2)", background: "rgba(0,230,180,0.06)", color: "#00e6b4", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Chain indicator bar */}
      <div style={{ background: connected ? "rgba(0,230,180,0.04)" : "rgba(245,166,35,0.04)", border: `1px solid ${connected ? "rgba(0,230,180,0.1)" : "rgba(245,166,35,0.1)"}`, borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#00e6b4" : "#f5a623", display: "inline-block", boxShadow: connected ? "0 0 6px #00e6b4" : "0 0 6px #f5a623" }} />
        <MonoSpan color={connected ? "rgba(0,230,180,0.7)" : "rgba(245,166,35,0.7)"} size={11}>
          {connected
            ? `Chain intact — all ${blocks.length} blocks verified · auto-refreshing every ${POLL_MS / 1000}s`
            : `Demo mode — connect your backend to see live chain data`}
        </MonoSpan>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          Genesis → Block #{blocks.length - 1}
        </span>
      </div>

      {/* Block list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 30, marginBottom: 12 }}>⛓</div>
          Loading blockchain…
        </div>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>No transactions found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {paginated.map((b, i) => {
            const isOpen = expanded === b._id || expanded === b.hash;
            const key    = b._id || b.hash || i;
            const isNew  = newHashes.has(b.hash) || newHashes.has(b._id);
            return (
              <div key={key} className={isNew ? "new-block" : ""}>
                {/* Chain link line */}
                {i > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 28, height: 18 }}>
                    <div style={{ width: 1, background: "rgba(0,230,180,0.15)", height: "100%" }} />
                  </div>
                )}

                <div
                  onClick={() => setExpanded(isOpen ? null : (b._id || b.hash))}
                  style={{
                    background: isNew ? "rgba(0,230,180,0.05)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isNew ? "rgba(0,230,180,0.3)" : isOpen ? "rgba(0,230,180,0.2)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 12, padding: "14px 18px", cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: isOpen ? "0 0 0 1px rgba(0,230,180,0.06) inset" : isNew ? "0 0 12px rgba(0,230,180,0.08)" : "none"
                  }}
                  onMouseEnter={e => !isOpen && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => !isOpen && (e.currentTarget.style.background = isNew ? "rgba(0,230,180,0.05)" : "rgba(255,255,255,0.02)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    {/* Block index dot */}
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,230,180,0.08)", border: "1px solid rgba(0,230,180,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MonoSpan color="#00e6b4" size={10}>#{b.blockIndex ?? i}</MonoSpan>
                    </div>

                    <TxTypeBadge type={b.type || "ISSUED"} />

                    {isNew && (
                      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontFamily: "'DM Mono',monospace", background: "rgba(0,230,180,0.15)", color: "#00e6b4", border: "1px solid rgba(0,230,180,0.3)" }}>
                        NEW
                      </span>
                    )}

                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                        {b.type === "GENESIS" ? "Genesis Block" : (b.recipientName || b.name || "—")}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        {b.courseName || b.course || ""}{b.university ? ` · ${b.university}` : ""}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <MonoSpan color="rgba(0,230,180,0.6)" size={10}>{shortHash(b.hash)}</MonoSpan>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{timeAgo(b.createdAt || b.timestamp)}</div>
                    </div>

                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                      {isOpen ? "▲" : "▼"}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 14 }}>
                        {[
                          ["Block Index",   `#${b.blockIndex ?? i}`],
                          ["Timestamp",     fmtDate ? fmtDate(b.createdAt || b.timestamp) : (b.createdAt || b.timestamp || "—")],
                          ["Recipient",     b.recipientName || b.name || "—"],
                          ["Course",        b.courseName || b.course || "—"],
                          ["University",    b.university || "—"],
                          ["Issued Year",   b.year || "—"],
                        ].map(([k, v]) => (
                          <div key={k} style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{k}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Hashes */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          ["Prev Hash", b.prevHash, "rgba(168,85,247,0.6)"],
                          ["This Hash", b.hash,     "#00e6b4"],
                        ].map(([label, hash, color]) => (
                          <div key={label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, width: 70 }}>{label}</div>
                            <code style={{ flex: 1, fontSize: 11, fontFamily: "'DM Mono',monospace", color, wordBreak: "break-all" }}>{hash || "0000000000000000"}</code>
                            <button
                              onClick={e => { e.stopPropagation(); handleCopy(hash); }}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", fontFamily: "'DM Mono',monospace", flexShrink: 0 }}
                            >
                              copy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: page === 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12 }}>← Prev</button>
          <span style={{ padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: page === totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 12 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── NETWORK PAGE ─────────────────────────────────────────────────────────────
export function NetworkPage() {
  const [nodes,      setNodes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activity,   setActivity]   = useState([]);
  const [connected,  setConnected]  = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [newActivity, setNewActivity] = useState(new Set());
  const prevActivityRef = useRef(new Set());
  const POLL_MS = 15000;

  const load = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const { data } = await api.get("/admin/network");
      const incomingActivity = data.activity || [];

      // Detect new activity entries on polls
      if (isPolling) {
        const freshKeys = new Set(
          incomingActivity.map(a => a.hash || JSON.stringify(a)).filter(Boolean)
        );
        const newOnes = new Set(
          [...freshKeys].filter(k => !prevActivityRef.current.has(k))
        );
        if (newOnes.size > 0) {
          setNewActivity(newOnes);
          setTimeout(() => setNewActivity(new Set()), 3000);
        }
        prevActivityRef.current = freshKeys;
      } else {
        prevActivityRef.current = new Set(
          incomingActivity.map(a => a.hash || JSON.stringify(a)).filter(Boolean)
        );
      }

      setNodes(data.nodes || []);
      setActivity(incomingActivity);
      setConnected(data.connected === true);
      setLastFetched(new Date());
    } catch {
      if (!isPolling) {
        setNodes(DEMO_NODES);
        setActivity(DEMO_ACTIVITY);
        setConnected(false);
        setLastFetched(new Date());
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const onlineCount  = nodes.filter(n => n.status === "online").length;
  const syncedCount  = nodes.filter(n => n.synced).length;
  const totalBlocks  = nodes[0]?.blockHeight || 0;

  return (
    <div style={{ padding: "32px 36px", minHeight: "100vh" }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .new-item { animation: slideIn 0.4s ease forwards; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(0,230,180,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>◈ Admin</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>Network</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
            Blockchain nodes, sync status, and real-time activity
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 8 }}>
          <ConnectionBadge connected={connected} lastFetched={lastFetched} />
          {!connected && (
            <span style={{ fontSize: 11, color: "rgba(245,166,35,0.6)", fontFamily: "'DM Mono',monospace" }}>
              (showing demo data)
            </span>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Nodes online",   value: `${onlineCount}/${nodes.length}`, color: "#00e6b4", alert: onlineCount < nodes.length },
          { label: "Nodes in sync",  value: `${syncedCount}/${nodes.length}`, color: syncedCount === nodes.length ? "#00e6b4" : "#f5a623" },
          { label: "Chain height",   value: totalBlocks,   color: "#4da6ff" },
          { label: "Network health", value: nodes.length === 0 ? "—" : onlineCount === nodes.length ? "Healthy" : "Degraded", color: onlineCount === nodes.length ? "#00e6b4" : "#f5a623" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.alert ? "rgba(255,77,109,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Auto-refresh notice */}
      <div style={{ background: connected ? "rgba(0,230,180,0.03)" : "rgba(245,166,35,0.03)", border: `1px solid ${connected ? "rgba(0,230,180,0.08)" : "rgba(245,166,35,0.08)"}`, borderRadius: 10, padding: "9px 14px", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#00e6b4" : "#f5a623", animation: "blink 1.5s infinite" }} />
        <MonoSpan color={connected ? "rgba(0,230,180,0.6)" : "rgba(245,166,35,0.6)"} size={11}>
          {connected
            ? `Live data · polling every ${POLL_MS / 1000}s`
            : `Demo mode · backend not reachable — showing simulated network`}
        </MonoSpan>
        <button onClick={() => load(false)} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 7, border: `1px solid ${connected ? "rgba(0,230,180,0.2)" : "rgba(245,166,35,0.2)"}`, background: "transparent", color: connected ? "#00e6b4" : "#f5a623", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>
          ↻ Refresh now
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Left: nodes list */}
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 14 }}>
            ⬡ Nodes
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Loading nodes…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nodes.map((node, i) => (
                <div key={node._id || i} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${node.status === "online" ? "rgba(0,230,180,0.1)" : "rgba(255,77,109,0.1)"}`,
                  borderRadius: 14, padding: "18px 20px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    {/* Node identity */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: node.status === "online" ? "rgba(0,230,180,0.1)" : "rgba(255,77,109,0.08)", border: `1px solid ${node.status === "online" ? "rgba(0,230,180,0.2)" : "rgba(255,77,109,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {node.type === "university" ? "🏛" : node.type === "admin" ? "🔐" : "🔍"}
                        </div>
                        {/* Online dot */}
                        <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: node.status === "online" ? "#00e6b4" : "#ff4d6d", border: "2px solid #060b14", boxShadow: node.status === "online" ? "0 0 6px #00e6b4" : "none", animation: node.status === "online" ? "blink 2s infinite" : "none" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{node.name}</div>
                        <MonoSpan color="rgba(255,255,255,0.3)" size={11}>{node.nodeId || `node-${i+1}`} · {node.type}</MonoSpan>
                      </div>
                    </div>

                    {/* Right side badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Mono',monospace", background: node.status === "online" ? "rgba(0,230,180,0.08)" : "rgba(255,77,109,0.08)", color: node.status === "online" ? "#00e6b4" : "#ff4d6d", border: `1px solid ${node.status === "online" ? "rgba(0,230,180,0.2)" : "rgba(255,77,109,0.2)"}` }}>
                        {node.status === "online" ? "● ONLINE" : "● OFFLINE"}
                      </span>
                      <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Mono',monospace", background: node.synced ? "rgba(0,120,255,0.08)" : "rgba(245,166,35,0.08)", color: node.synced ? "#4da6ff" : "#f5a623", border: `1px solid ${node.synced ? "rgba(0,120,255,0.2)" : "rgba(245,166,35,0.2)"}` }}>
                        {node.synced ? "✓ SYNCED" : "⟳ SYNCING"}
                      </span>
                    </div>
                  </div>

                  {/* Node metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 14 }}>
                    {[
                      ["Block height",   node.blockHeight ?? "—"],
                      ["Certs issued",   node.certsIssued ?? "—"],
                      ["Last ping",      node.lastPing ? timeAgo(node.lastPing) : "—"],
                      ["IP / Endpoint",  node.endpoint || "internal"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 7, padding: "7px 10px" }}>
                        <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", wordBreak: "break-all" }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sync progress bar */}
                  {!node.synced && totalBlocks > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <MonoSpan color="rgba(245,166,35,0.7)" size={10}>Syncing blocks…</MonoSpan>
                        <MonoSpan color="rgba(245,166,35,0.5)" size={10}>{node.blockHeight}/{totalBlocks}</MonoSpan>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${Math.min(100, ((node.blockHeight || 0) / totalBlocks) * 100)}%`, background: "linear-gradient(90deg,#f5a623,#00e6b4)", borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Visual topology */}
          <div style={{ marginTop: 24, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 14 }}>Network topology</div>
            <NetworkTopology nodes={nodes} />
          </div>
        </div>

        {/* Right: activity feed */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 20px", position: "sticky", top: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#00e6b4" : "#f5a623", boxShadow: connected ? "0 0 6px #00e6b4" : "0 0 6px #f5a623", animation: "blink 1.5s infinite" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Live Activity</div>
            {!connected && <span style={{ fontSize: 10, color: "rgba(245,166,35,0.5)", fontFamily: "'DM Mono',monospace" }}>DEMO</span>}
            <button onClick={() => load(false)} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(0,230,180,0.2)", background: "rgba(0,230,180,0.06)", color: "#00e6b4", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>↻</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {activity.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No recent activity</div>
            ) : (
              activity.slice(0, 20).map((a, i) => {
                const aKey = a.hash || JSON.stringify(a);
                const isNew = newActivity.has(aKey);
                return (
                  <div key={i} className={isNew ? "new-item" : ""} style={{
                    padding: "10px 0",
                    borderBottom: i < activity.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    display: "flex", gap: 10, alignItems: "flex-start",
                    background: isNew ? "rgba(0,230,180,0.03)" : "transparent",
                    borderRadius: isNew ? 6 : 0,
                    paddingLeft: isNew ? 6 : 0,
                    transition: "background 1s"
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: a.type === "ISSUED" ? "rgba(0,230,180,0.1)" : a.type === "REVOKED" ? "rgba(255,77,109,0.1)" : "rgba(0,120,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                      {a.type === "ISSUED" ? "📜" : a.type === "REVOKED" ? "❌" : "🔍"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{a.actor || a.university || "System"}</span>
                        {" "}{a.type === "ISSUED" ? "issued cert for" : a.type === "REVOKED" ? "revoked cert of" : "verified cert of"}{" "}
                        <span style={{ color: "#00e6b4" }}>{a.recipientName || a.name || "—"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <MonoSpan color="rgba(0,230,180,0.4)" size={10}>{shortHash(a.hash)}</MonoSpan>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{timeAgo(a.createdAt || a.timestamp)}</span>
                        {isNew && <span style={{ fontSize: 9, color: "#00e6b4", fontFamily: "'DM Mono',monospace" }}>NEW</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simple SVG topology diagram ──────────────────────────────────────────────
function NetworkTopology({ nodes }) {
  if (nodes.length === 0) {
    return <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No nodes to display</div>;
  }

  const cx = 200, cy = 110, r = 80;
  const positions = nodes.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
  }));

  const typeIcon = { university: "🏛", admin: "🔐", verifier: "🔍" };

  return (
    <svg viewBox="0 0 400 220" style={{ width: "100%", height: 200 }}>
      {/* Connection lines */}
      {nodes.map((n, i) =>
        nodes.map((m, j) => j > i ? (
          <line key={`${i}-${j}`}
            x1={positions[i].x} y1={positions[i].y}
            x2={positions[j].x} y2={positions[j].y}
            stroke={n.status === "online" && m.status === "online" ? "rgba(0,230,180,0.15)" : "rgba(255,77,109,0.08)"}
            strokeWidth={1} strokeDasharray="3,4"
          />
        ) : null)
      )}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={i} transform={`translate(${positions[i].x},${positions[i].y})`}>
          <circle r={22} fill={node.status === "online" ? "rgba(0,230,180,0.1)" : "rgba(255,77,109,0.08)"} stroke={node.status === "online" ? "rgba(0,230,180,0.3)" : "rgba(255,77,109,0.25)"} strokeWidth={1} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={14}>{typeIcon[node.type] || "🔗"}</text>
          {/* Status dot */}
          <circle cx={16} cy={-16} r={5} fill={node.status === "online" ? "#00e6b4" : "#ff4d6d"} />
          <text y={34} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)" fontFamily="monospace">
            {(node.name || "").slice(0, 12)}
          </text>
        </g>
      ))}

      {/* Center label */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="rgba(0,230,180,0.3)" fontFamily="monospace">
        P2P
      </text>
    </svg>
  );
}

// ─── Demo data (used when API is unavailable) ─────────────────────────────────
const now = new Date().toISOString();
const DEMO_BLOCKS = [
  { blockIndex: 0, type: "GENESIS", hash: "0000abc123def456", prevHash: "0000000000000000", createdAt: now, recipientName: null, courseName: null, university: null },
  { blockIndex: 1, type: "ISSUED",  hash: "a1b2c3d4e5f67890abcd1234", prevHash: "0000abc123def456", createdAt: now, recipientName: "Priya Sharma",  courseName: "B.Tech CSE",     university: "IIT Delhi",  year: "2024" },
  { blockIndex: 2, type: "ISSUED",  hash: "b2c3d4e5f6789012cdef3456", prevHash: "a1b2c3d4e5f67890abcd1234", createdAt: now, recipientName: "Rohan Verma",   courseName: "MBA Finance",     university: "IIM Bangalore", year: "2024" },
  { blockIndex: 3, type: "VERIFIED",hash: "c3d4e5f67890123defab5678", prevHash: "b2c3d4e5f6789012cdef3456", createdAt: now, recipientName: "Priya Sharma",  courseName: "B.Tech CSE",     university: "IIT Delhi",  year: "2024" },
  { blockIndex: 4, type: "ISSUED",  hash: "d4e5f678901234abcdef6789", prevHash: "c3d4e5f67890123defab5678", createdAt: now, recipientName: "Anjali Singh",  courseName: "M.Sc Physics",   university: "DU North Campus", year: "2023" },
  { blockIndex: 5, type: "REVOKED", hash: "e5f67890123456abcdef7890", prevHash: "d4e5f678901234abcdef6789", createdAt: now, recipientName: "Rohan Verma",   courseName: "MBA Finance",     university: "IIM Bangalore", year: "2024" },
];

const DEMO_NODES = [
  { name: "Admin Node",     type: "admin",      status: "online",  synced: true,  blockHeight: 5, certsIssued: 3, lastPing: now, nodeId: "node-admin-01", endpoint: "internal" },
  { name: "IIT Delhi",      type: "university", status: "online",  synced: true,  blockHeight: 5, certsIssued: 2, lastPing: now, nodeId: "node-univ-02", endpoint: "192.168.1.10" },
  { name: "IIM Bangalore",  type: "university", status: "online",  synced: false, blockHeight: 4, certsIssued: 1, lastPing: now, nodeId: "node-univ-03", endpoint: "192.168.1.11" },
  { name: "Verifier Node",  type: "verifier",   status: "offline", synced: false, blockHeight: 3, certsIssued: 0, lastPing: now, nodeId: "node-verif-04", endpoint: "192.168.1.20" },
];

const DEMO_ACTIVITY = [
  { type: "ISSUED",   actor: "IIT Delhi",     recipientName: "Priya Sharma",  hash: "a1b2c3d4e5f67890abcd1234", createdAt: now },
  { type: "ISSUED",   actor: "IIM Bangalore", recipientName: "Rohan Verma",   hash: "b2c3d4e5f6789012cdef3456", createdAt: now },
  { type: "VERIFIED", actor: "Verifier Node", recipientName: "Priya Sharma",  hash: "c3d4e5f67890123defab5678", createdAt: now },
  { type: "ISSUED",   actor: "DU North",      recipientName: "Anjali Singh",  hash: "d4e5f678901234abcdef6789", createdAt: now },
  { type: "REVOKED",  actor: "Admin",         recipientName: "Rohan Verma",   hash: "e5f67890123456abcdef7890", createdAt: now },
];