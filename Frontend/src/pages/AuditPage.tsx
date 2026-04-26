import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { History, ShieldCheck, Clock, User } from 'lucide-react';

type AuditLog = {
    id: number;
    operatorId: string;
    action: string;
    details: string;
    timestamp: string;
};

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/Audit');
            setLogs(response.data);
        } catch (error) {
            console.error("Eroare la încărcarea auditului:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Refresh la 10 secunde
        return () => clearInterval(interval);
    }, []);

    const getActionColor = (action: string) => {
        if (action.includes("CREARE")) return "#3b82f6"; // Albastru
        if (action.includes("INCHIDERE")) return "#22c55e"; // Verde
        if (action.includes("APEL_NOU")) return "#ef4444"; // Roșu
        return "#94a3b8"; // Gri
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}><History style={{marginRight: 10}} /> Jurnal Audit Sistem</h1>
                    <p style={styles.subtitle}>Trasabilitatea acțiunilor efectuate de operatori</p>
                </div>
                <div style={styles.badge}>
                    <ShieldCheck size={16} style={{marginRight: 5}} /> SECURIZAT
                </div>
            </header>

            <div style={styles.tableWrapper}>
                {loading ? (
                    <div style={{padding: 20, color: '#94a3b8'}}>Se încarcă logurile...</div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}><Clock size={14} /> TIMP</th>
                                <th style={styles.th}><User size={14} /> OPERATOR</th>
                                <th style={styles.th}>ACȚIUNE</th>
                                <th style={styles.th}>DETALII EVENIMENT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        {new Date(log.timestamp).toLocaleString('ro-RO', { 
                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                                        })}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.operatorBadge}>{log.operatorId}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.actionBadge, 
                                            backgroundColor: `${getActionColor(log.action)}22`,
                                            color: getActionColor(log.action),
                                            borderColor: `${getActionColor(log.action)}44`
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{...styles.td, color: '#cbd5e1'}}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "30px",
    color: "white",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
  },

  title: {
    fontSize: "24px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    margin: 0,
  },

  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "5px",
  },

  badge: {
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    background: "rgba(34,197,94,0.1)",
    color: "#4ade80",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    border: "1px solid rgba(34,197,94,0.2)",
  },

  tableWrapper: {
    background: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "14px",
  },

  th: {
    padding: "15px 20px",
    background: "#0f172a",
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  tr: {
    borderBottom: "1px solid #334155",
    transition: "background 0.2s",
  },

  td: {
    padding: "15px 20px",
    verticalAlign: "middle",
  },

  operatorBadge: {
    background: "#334155",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#e2e8f0",
  },

  actionBadge: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
    border: "1px solid",
  },
};