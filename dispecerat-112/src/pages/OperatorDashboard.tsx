import React, { useMemo, useState } from "react";
import { useAudit } from "../audit/AuditStore";

type CallStatus = "PENDING" | "IN_PROGRESS" | "CLOSED";
type EmergencyType = "MEDICAL" | "FIRE" | "POLICE" | "OTHER";

type Call = {
  id: string;
  receivedAt: string; // ISO
  callerNumber: string;
  emergencyType: EmergencyType;
  status: CallStatus;
  address: string;
  description: string;
  priority: 1 | 2 | 3; // 1 = highest
};

const nowMinus = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const MOCK_CALLS: Call[] = [
  {
    id: "C-10421",
    receivedAt: nowMinus(2),
    callerNumber: "07xx xxx 111",
    emergencyType: "MEDICAL",
    status: "PENDING",
    address: "București, Sector 3, Str. Exemplelor 12",
    description: "Persoană inconștientă, respiră greu.",
    priority: 1,
  },
  {
    id: "C-10420",
    receivedAt: nowMinus(7),
    callerNumber: "07xx xxx 222",
    emergencyType: "FIRE",
    status: "IN_PROGRESS",
    address: "București, Sector 6, Bd. Demo 45",
    description: "Fum dens într-un apartament, posibil incendiu.",
    priority: 1,
  },
  {
    id: "C-10419",
    receivedAt: nowMinus(12),
    callerNumber: "07xx xxx 333",
    emergencyType: "POLICE",
    status: "PENDING",
    address: "București, Sector 1, Piața Test 1",
    description: "Agresiune în desfășurare, 2 persoane implicate.",
    priority: 2,
  },
  {
    id: "C-10418",
    receivedAt: nowMinus(25),
    callerNumber: "07xx xxx 444",
    emergencyType: "OTHER",
    status: "CLOSED",
    address: "București, Sector 2, Str. Mock 9",
    description: "Zgomot puternic, s-a confirmat alarmă falsă.",
    priority: 3,
  },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function typeLabel(t: EmergencyType) {
  switch (t) {
    case "MEDICAL":
      return "Medical";
    case "FIRE":
      return "Incendiu";
    case "POLICE":
      return "Poliție";
    case "OTHER":
      return "Altele";
  }
}

function statusLabel(s: CallStatus) {
  switch (s) {
    case "PENDING":
      return "În așteptare";
    case "IN_PROGRESS":
      return "În lucru";
    case "CLOSED":
      return "Închis";
  }
}

function priorityLabel(p: 1 | 2 | 3) {
  return p === 1 ? "P1" : p === 2 ? "P2" : "P3";
}

function badgeBaseStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
  } as const;
}

export default function OperatorDashboard() {
  const [calls, setCalls] = useState<Call[]>(MOCK_CALLS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_CALLS[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<CallStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<EmergencyType | "ALL">("ALL");
  const { log } = useAudit();

  const selected = useMemo(
    () => calls.find((c) => c.id === selectedId) ?? null,
    [calls, selectedId]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return calls
      .filter((c) => (statusFilter === "ALL" ? true : c.status === statusFilter))
      .filter((c) => (typeFilter === "ALL" ? true : c.emergencyType === typeFilter))
      .filter((c) => {
        if (!qq) return true;
        return (
          c.id.toLowerCase().includes(qq) ||
          c.callerNumber.toLowerCase().includes(qq) ||
          c.address.toLowerCase().includes(qq) ||
          c.description.toLowerCase().includes(qq)
        );
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      });
  }, [calls, q, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const pending = calls.filter((c) => c.status === "PENDING").length;
    const inProgress = calls.filter((c) => c.status === "IN_PROGRESS").length;
    const closed = calls.filter((c) => c.status === "CLOSED").length;
    return { pending, inProgress, closed };
  }, [calls]);

  function updateStatus(id: string, status: CallStatus) {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function handleTakeCall() {
  if (!selected) return;
  if (selected.status === "CLOSED") return;

  updateStatus(selected.id, "IN_PROGRESS");

  void log({
    action: "CALL_TAKEN",
    message: `Apel preluat: ${selected.id}`,
    entityType: "CALL",
    entityId: selected.id,
  });
}

  function handleCloseCall() {
  if (!selected) return;
  if (selected.status === "CLOSED") return;

  updateStatus(selected.id, "CLOSED");

  void log({
    severity: "WARN",
    action: "CALL_CLOSED",
    message: `Apel închis: ${selected.id}`,
    entityType: "CALL",
    entityId: selected.id,
  });
}


  function handleCreateIntervention() {
  if (!selected) return;

  alert(`Intervenție creată pentru ${selected.id} (mock).`);
  updateStatus(selected.id, "IN_PROGRESS");

  const interventionId = `I-${selected.id.replace("C-", "")}`;

  void log({
    action: "INTERVENTION_CREATED",
    message: `Intervenție creată din apel: ${selected.id}`,
    entityType: "INTERVENTION",
    entityId: interventionId,
    meta: { sourceCallId: selected.id },
});

}


  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>Dispecerat 112 — Operator Dashboard</div>
          <div style={styles.subtitle}>Queue apeluri + detalii + acțiuni (mock)</div>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>În așteptare</div>
            <div style={styles.statValue}>{stats.pending}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>În lucru</div>
            <div style={styles.statValue}>{stats.inProgress}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Închis</div>
            <div style={styles.statValue}>{stats.closed}</div>
          </div>
        </div>
      </header>

      <main style={styles.mainGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Apeluri</div>
            <div style={styles.panelHint}>Selectează un apel pentru detalii</div>
          </div>

          <div style={styles.filters}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Caută: ID, număr, adresă, descriere..."
              style={styles.search}
            />

            <div style={styles.filterRow}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={styles.select}
              >
                <option value="ALL">Toate statusurile</option>
                <option value="PENDING">În așteptare</option>
                <option value="IN_PROGRESS">În lucru</option>
                <option value="CLOSED">Închis</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                style={styles.select}
              >
                <option value="ALL">Toate tipurile</option>
                <option value="MEDICAL">Medical</option>
                <option value="FIRE">Incendiu</option>
                <option value="POLICE">Poliție</option>
                <option value="OTHER">Altele</option>
              </select>
            </div>
          </div>

          <div style={styles.list}>
            {filtered.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    ...styles.listItem,
                    ...(isSelected ? styles.listItemSelected : null),
                  }}
                >
                  <div style={styles.listTopRow}>
                    <div style={styles.callId}>{c.id}</div>
                    <div style={styles.time}>{formatTime(c.receivedAt)}</div>
                  </div>

                  <div style={styles.listMidRow}>
                    <span style={badgeBaseStyle()}>{typeLabel(c.emergencyType)}</span>
                    <span style={badgeBaseStyle()}>{statusLabel(c.status)}</span>
                    <span style={badgeBaseStyle()}>{priorityLabel(c.priority)}</span>
                  </div>

                  <div style={styles.listBottomRow}>
                    <div style={styles.address}>{c.address}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Detalii apel</div>
            <div style={styles.panelHint}>În viitor: update live via SignalR</div>
          </div>

          {!selected ? (
            <div style={styles.empty}>Selectează un apel din stânga.</div>
          ) : (
            <div style={styles.details}>
              <div style={styles.detailsGrid}>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>ID apel</div>
                  <div style={styles.detailValue}>{selected.id}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Ora</div>
                  <div style={styles.detailValue}>{formatTime(selected.receivedAt)}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Număr apelant</div>
                  <div style={styles.detailValue}>{selected.callerNumber}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Tip urgență</div>
                  <div style={styles.detailValue}>{typeLabel(selected.emergencyType)}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Status</div>
                  <div style={styles.detailValue}>{statusLabel(selected.status)}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Prioritate</div>
                  <div style={styles.detailValue}>{priorityLabel(selected.priority)}</div>
                </div>
              </div>

              <div style={styles.detailBlockFull}>
                <div style={styles.detailLabel}>Adresă</div>
                <div style={styles.detailValue}>{selected.address}</div>
              </div>

              <div style={styles.detailBlockFull}>
                <div style={styles.detailLabel}>Descriere</div>
                <div style={styles.detailValue}>{selected.description}</div>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={handleTakeCall}
                  disabled={selected.status === "CLOSED"}
                  style={styles.primaryBtn}
                >
                  Preia apel
                </button>

                <button
                  onClick={handleCreateIntervention}
                  disabled={selected.status === "CLOSED"}
                  style={styles.secondaryBtn}
                >
                  Creează intervenție
                </button>

                <button onClick={handleCloseCall} style={styles.dangerBtn}>
                  Închide apel
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
  color: "rgba(255,255,255,0.92)",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
},
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 13, opacity: 0.75, marginTop: 6 },

  statsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  statCard: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    minWidth: 120,
  },
  statLabel: { fontSize: 12, opacity: 0.75 },
  statValue: { fontSize: 18, fontWeight: 700, marginTop: 4 },

  mainGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1.2fr",
  gap: 14,
  minWidth: 0,
},

  panel: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    overflow: "hidden",
    minHeight: 520,
  },

  panelHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  panelTitle: { fontSize: 14, fontWeight: 700 },
  panelHint: { fontSize: 12, opacity: 0.7 },

  filters: { padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  search: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    outline: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
  },
  filterRow: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" },
  select: {
    padding: "9px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    flex: "1 1 180px",
  },

  list: { padding: 10, display: "flex", flexDirection: "column", gap: 10 },
  listItem: {
    textAlign: "left",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
  },
  listItemSelected: {
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.07)",
  },
  listTopRow: { display: "flex", justifyContent: "space-between", gap: 10 },
  callId: { fontSize: 13, fontWeight: 700 },
  time: { fontSize: 12, opacity: 0.75 },

  listMidRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  listBottomRow: { marginTop: 8 },
  address: { fontSize: 12, opacity: 0.85, lineHeight: 1.35 },

  empty: { padding: 16, opacity: 0.75, fontSize: 13 },

  details: { padding: 16 },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  detailBlock: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
  detailBlockFull: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
  detailLabel: { fontSize: 12, opacity: 0.7 },
  detailValue: { fontSize: 13, marginTop: 6, lineHeight: 1.4 },

  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerBtn: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,80,80,0.18)",
    color: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    fontWeight: 700,
  },
};
