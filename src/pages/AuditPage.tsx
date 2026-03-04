// import React, { useMemo, useState } from "react";
// import { useAudit } from "../audit/AuditStore";
// import type { AuditEntityType, AuditSeverity } from "../audit/auditTypes";

// function formatTime(iso: string) {
//   const d = new Date(iso);
//   return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
// }

// export default function AuditPage() {
//   const { events, clear } = useAudit();

//   const [q, setQ] = useState("");
//   const [severity, setSeverity] = useState<AuditSeverity | "ALL">("ALL");
//   const [entityType, setEntityType] = useState<AuditEntityType | "ALL">("ALL");

//   const filtered = useMemo(() => {
//     const qq = q.trim().toLowerCase();
//     return events
//       .filter((e) => (severity === "ALL" ? true : e.severity === severity))
//       .filter((e) => (entityType === "ALL" ? true : e.entityType === entityType))
//       .filter((e) => {
//         if (!qq) return true;
//         return (
//           e.action.toLowerCase().includes(qq) ||
//           e.message.toLowerCase().includes(qq) ||
//           (e.entityId?.toLowerCase().includes(qq) ?? false) ||
//           e.entityType.toLowerCase().includes(qq) ||
//           e.actor.name.toLowerCase().includes(qq) ||
//           e.actor.role.toLowerCase().includes(qq)
//         );
//       });
//   }, [events, q, severity, entityType]);

//   return (
//     <div style={styles.page}>
//       <header style={styles.header}>
//         <div>
//           <div style={styles.title}>Audit log</div>
//           <div style={styles.subtitle}>Evenimente generate automat din acțiuni (mock)</div>
//         </div>

//         <div style={styles.headerRight}>
//           <button onClick={clear} style={styles.dangerBtn}>
//             Clear
//           </button>
//         </div>
//       </header>

//       <div style={styles.panel}>
//         <div style={styles.filters}>
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Caută: acțiune, mesaj, entityId..."
//             style={styles.search}
//           />

//           <div style={styles.filterRow}>
//             <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} style={styles.select}>
//               <option value="ALL">Toate severitățile</option>
//               <option value="INFO">INFO</option>
//               <option value="WARN">WARN</option>
//               <option value="CRITICAL">CRITICAL</option>
//             </select>

//             <select value={entityType} onChange={(e) => setEntityType(e.target.value as any)} style={styles.select}>
//               <option value="ALL">Toate entitățile</option>
//               <option value="CALL">CALL</option>
//               <option value="INTERVENTION">INTERVENTION</option>
//               <option value="SYSTEM">SYSTEM</option>
//             </select>
//           </div>
//         </div>

//         <div style={styles.tableWrap}>
//           <table style={styles.table}>
//             <thead>
//               <tr>
//                 <th style={styles.th}>Timp</th>
//                 <th style={styles.th}>Sev</th>
//                 <th style={styles.th}>Acțiune</th>
//                 <th style={styles.th}>Entitate</th>
//                 <th style={styles.th}>Mesaj</th>
//                 <th style={styles.th}>Actor</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((e) => (
//                 <tr key={e.id}>
//                   <td style={styles.td}>{formatTime(e.at)}</td>
//                   <td style={styles.td}>
//                     <span style={{ ...styles.badge, ...(e.severity === "CRITICAL" ? styles.badgeCritical : null) }}>
//                       {e.severity}
//                     </span>
//                   </td>
//                   <td style={styles.td}><b>{e.action}</b></td>
//                   <td style={styles.td}>
//                     {e.entityType}
//                     {e.entityId ? ` • ${e.entityId}` : ""}
//                   </td>
//                   <td style={styles.td}>{e.message}</td>
//                   <td style={styles.td}>
//                     {e.actor.name} • {e.actor.role}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {filtered.length === 0 && <div style={styles.empty}>Niciun eveniment.</div>}
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles: Record<string, React.CSSProperties> = {
//   page: { color: "rgba(255,255,255,0.92)", minWidth: 0 },
//   header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 16, flexWrap: "wrap" },
//   title: { fontSize: 18, fontWeight: 800 },
//   subtitle: { fontSize: 13, opacity: 0.75, marginTop: 6 },
//   headerRight: { display: "flex", gap: 10 },

//   panel: { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", overflow: "hidden" },
//   filters: { padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" },
//   search: {
//     width: "100%", padding: "10px 12px", borderRadius: 12, outline: "none",
//     border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)",
//     color: "rgba(255,255,255,0.92)", fontSize: 13,
//   },
//   filterRow: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" },
//   select: {
//     padding: "9px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
//     background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.92)", fontSize: 13, flex: "1 1 220px",
//   },

//   tableWrap: { padding: 12, overflowX: "auto" },
//   table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
//   th: { textAlign: "left", fontSize: 12, opacity: 0.75, padding: "10px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)" },
//   td: { padding: "10px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13, verticalAlign: "top" },

//   badge: {
//     display: "inline-flex", padding: "4px 8px", borderRadius: 999,
//     border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)",
//     fontSize: 12, fontWeight: 800,
//   },
//   badgeCritical: { background: "rgba(255,80,80,0.18)" },

//   dangerBtn: {
//     padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)",
//     background: "rgba(255,80,80,0.18)", color: "rgba(255,255,255,0.95)", cursor: "pointer", fontWeight: 800,
//   },
//   empty: { padding: 12, opacity: 0.75, fontSize: 13 },
// };

import React from "react";
import { useAudit } from "../audit/AuditStore";

export default function AuditPage() {
  const { events, clear, verifyAll, exportJson } = useAudit();

  return (
    <div style={{ padding: 16, color: "rgba(255,255,255,0.92)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Audit log</h2>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Evenimente generate automat din acțiuni (signed + chained)</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={async () => {
              const res = await verifyAll();
              alert(res.ok ? "Integrity OK ✅" : `Integrity FAILED ❌\n${res.reason}`);
            }}
          >
            Verify
          </button>

          <button onClick={exportJson}>Export JSON</button>
          <button onClick={clear}>Clear</button>
        </div>
      </div>

      <div style={{ marginTop: 16, opacity: 0.85 }}>
        Total events: <b>{events.length}</b>
      </div>

      <div style={{ marginTop: 12 }}>
        {events.map((e) => (
          <div
            key={e.seq}
            style={{
              padding: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              marginBottom: 10,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <b>#{e.seq}</b> • {e.payload.severity} • <b>{e.payload.action}</b>
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{new Date(e.serverTime).toLocaleString()}</div>
            </div>

            <div style={{ marginTop: 6, opacity: 0.9 }}>{e.payload.message}</div>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              {e.payload.entityType}
              {e.payload.entityId ? ` • ${e.payload.entityId}` : ""}
              {" • "}
              actor: {e.payload.actor.name} ({e.payload.actor.role})
            </div>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              prevHash: {e.prevHash ? e.prevHash.slice(0, 18) + "…" : "null"} | hash: {e.hash.slice(0, 18) + "…"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}