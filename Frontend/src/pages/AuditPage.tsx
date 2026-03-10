import React, { useEffect, useState } from "react";
import { ClipboardList, ShieldCheck, Search } from "lucide-react";

type AuditLog = {
  id: number;
  operatorId: string;
  action: string;
  details: string;
  timestamp: string;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const API_URL = "http://localhost:5023/api/Audit";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) =>
        setLogs(
          data.sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
        ),
      )
      .catch((err) => console.error("Eroare Audit:", err));
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ShieldCheck size={32} color="#10b981" />
          <h1 style={styles.title}>Jurnal Audit Sistem</h1>
        </div>
        <div style={styles.searchBox}>
          <Search size={18} style={{ opacity: 0.5 }} />
          <input
            placeholder="Caută în log-uri..."
            style={styles.input}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Data / Ora</th>
              <th style={styles.th}>Operator</th>
              <th style={styles.th}>Acțiune</th>
              <th style={styles.th}>Detalii</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={styles.tr}>
                <td style={styles.td}>
                  {new Date(log.timestamp).toLocaleString("ro-RO")}
                </td>
                <td style={styles.td}>
                  <span style={styles.opBadge}>{log.operatorId}</span>
                </td>
                <td style={styles.td}>
                  <strong>{log.action}</strong>
                </td>
                <td style={styles.td}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "20px", color: "#fff" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: { fontSize: "24px", fontWeight: 800, margin: 0 },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#1e293b",
    padding: "10px 15px",
    borderRadius: "10px",
    border: "1px solid #334155",
  },
  input: {
    background: "transparent",
    border: "none",
    color: "#fff",
    outline: "none",
    width: "200px",
  },
  tableWrapper: {
    background: "#111827",
    borderRadius: "15px",
    border: "1px solid #334155",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: {
    padding: "15px",
    background: "#1f2937",
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  td: { padding: "15px", borderBottom: "1px solid #1f2937", fontSize: "14px" },
  tr: { transition: "background 0.2s", cursor: "default" },
  opBadge: {
    background: "#064e3b",
    color: "#34d399",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
  },
};
