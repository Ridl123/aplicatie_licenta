import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  Clock,
  User,
  Activity,
  FileText,
} from "lucide-react";

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

  const fetchLogs = () => {
    fetch(`${API_URL}?t=${new Date().getTime()}`)
      .then((res) => res.json())
      .then((data) => {
        // Sortare descrescatoare pentru a vedea actiunile recente primele
        // Verificam atat timestamp cat si Timestamp (pentru compatibilitate .NET)
        const sortedData = data.sort(
          (a: any, b: any) =>
            new Date(b.timestamp || b.Timestamp).getTime() -
            new Date(a.timestamp || a.Timestamp).getTime(),
        );
        setLogs(sortedData);
      })
      .catch((err) => console.error("Eroare incarcare Audit:", err));
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log: any) => {
    const s = searchTerm.toLowerCase();
    const details = (log.details || log.Details || "").toLowerCase();
    const action = (log.action || log.Action || "").toLowerCase();
    const opId = (log.operatorId || log.OperatorId || "").toLowerCase();
    return details.includes(s) || action.includes(s) || opId.includes(s);
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ShieldCheck size={32} color="#10b981" />
          <h1 style={styles.title}>Jurnal Audit Sistem</h1>
        </div>
        <div style={styles.searchBox}>
          <Search size={18} color="#64748b" />
          <input
            placeholder="Cauta in log-uri (Operator, Actiune...)"
            style={styles.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <Clock size={14} style={styles.iconInline} /> Data / Ora
              </th>
              <th style={styles.th}>
                <User size={14} style={styles.iconInline} /> Operator
              </th>
              <th style={styles.th}>
                <Activity size={14} style={styles.iconInline} /> Actiune
              </th>
              <th style={styles.th}>
                <FileText size={14} style={styles.iconInline} /> Detalii
                Suplimentare
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log: any) => (
              <tr key={log.id || log.Id} style={styles.tr}>
                <td style={styles.td}>
                  {new Date(log.timestamp || log.Timestamp).toLocaleString(
                    "ro-RO",
                  )}
                </td>
                <td style={styles.td}>
                  <span style={styles.opBadge}>
                    {log.operatorId || log.OperatorId}
                  </span>
                </td>
                <td style={styles.td}>
                  <strong style={{ color: "#34d399" }}>
                    {(log.action || log.Action || "").toUpperCase()}
                  </strong>
                </td>
                <td style={styles.td}>{log.details || log.Details}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div style={styles.emptyState}>
            Nu exista inregistrari in jurnalul de audit care sa corespunda
            cautarii.
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "30px",
    color: "#f8fafc",
    background: "#0f172a",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.5px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#1e293b",
    padding: "8px 15px",
    borderRadius: "10px",
    border: "1px solid #334155",
  },
  input: {
    background: "transparent",
    border: "none",
    color: "#fff",
    outline: "none",
    width: "280px",
    fontSize: "14px",
  },
  tableWrapper: {
    background: "#111827",
    borderRadius: "12px",
    border: "1px solid #334155",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: {
    padding: "15px",
    background: "#1f2937",
    color: "#94a3b8",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "15px",
    borderBottom: "1px solid #1f2937",
    fontSize: "13px",
    color: "#cbd5e1",
  },
  tr: {
    transition: "background 0.2s",
    cursor: "default",
  },
  opBadge: {
    background: "#064e3b",
    color: "#34d399",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "monospace",
    border: "1px solid rgba(52, 211, 153, 0.2)",
  },
  iconInline: { marginBottom: "-2px", marginRight: "6px", opacity: 0.7 },
  emptyState: {
    padding: "60px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    background: "#111827",
  },
};
