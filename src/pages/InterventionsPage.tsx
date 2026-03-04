import React, { useMemo, useState } from "react";
import { useAudit } from "../audit/AuditStore";

type InterventionStatus = "DISPATCHED" | "EN_ROUTE" | "ON_SCENE" | "COMPLETED";

type ResourceType = "AMBULANCE" | "FIRETRUCK" | "POLICE_CAR";

type Intervention = {
  id: string;
  callId: string;
  createdAt: string; // ISO
  type: "MEDICAL" | "FIRE" | "POLICE" | "OTHER";
  priority: 1 | 2 | 3;

  address: string;
  notes: string;

  status: InterventionStatus;

  unit: {
    type: ResourceType;
    code: string; // ex: SMURD-01
    crew: string; // ex: "Echipaj Alpha"
  } | null;

  timeline: Array<{
    at: string; // ISO
    title: string;
    details?: string;
  }>;
};

const nowMinus = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const MOCK: Intervention[] = [
  {
    id: "I-90012",
    callId: "C-10421",
    createdAt: nowMinus(9),
    type: "MEDICAL",
    priority: 1,
    address: "București, Sector 3, Str. Exemplelor 12",
    notes: "Persoană inconștientă. Suspiciune AVC. Necesită evaluare rapidă.",
    status: "EN_ROUTE",
    unit: { type: "AMBULANCE", code: "SMURD-01", crew: "Echipaj Alpha" },
    timeline: [
      { at: nowMinus(9), title: "Intervenție creată", details: "Din apel C-10421" },
      { at: nowMinus(8), title: "Echipaj alocat", details: "SMURD-01 • Echipaj Alpha" },
      { at: nowMinus(6), title: "Trimis", details: "Dispecerat → SMURD-01" },
      { at: nowMinus(2), title: "În drum", details: "ETA ~ 4 min" },
    ],
  },
  {
    id: "I-90011",
    callId: "C-10420",
    createdAt: nowMinus(18),
    type: "FIRE",
    priority: 1,
    address: "București, Sector 6, Bd. Demo 45",
    notes: "Fum dens, posibil incendiu. Verificare rapidă + evacuare.",
    status: "ON_SCENE",
    unit: { type: "FIRETRUCK", code: "ISU-07", crew: "Echipaj Bravo" },
    timeline: [
      { at: nowMinus(18), title: "Intervenție creată", details: "Din apel C-10420" },
      { at: nowMinus(16), title: "Echipaj alocat", details: "ISU-07 • Echipaj Bravo" },
      { at: nowMinus(15), title: "Trimis", details: "Dispecerat → ISU-07" },
      { at: nowMinus(9), title: "În drum", details: "ETA ~ 7 min" },
      { at: nowMinus(3), title: "La fața locului", details: "Confirmare vizuală fum" },
    ],
  },
  {
    id: "I-90010",
    callId: "C-10419",
    createdAt: nowMinus(28),
    type: "POLICE",
    priority: 2,
    address: "București, Sector 1, Piața Test 1",
    notes: "Agresiune în desfășurare. Prioritate P2.",
    status: "DISPATCHED",
    unit: null,
    timeline: [{ at: nowMinus(28), title: "Intervenție creată", details: "Din apel C-10419" }],
  },
  {
    id: "I-90009",
    callId: "C-10418",
    createdAt: nowMinus(55),
    type: "OTHER",
    priority: 3,
    address: "București, Sector 2, Str. Mock 9",
    notes: "Alarmă falsă confirmată.",
    status: "COMPLETED",
    unit: { type: "POLICE_CAR", code: "POL-12", crew: "Echipaj Delta" },
    timeline: [
      { at: nowMinus(55), title: "Intervenție creată", details: "Din apel C-10418" },
      { at: nowMinus(52), title: "Echipaj alocat", details: "POL-12 • Echipaj Delta" },
      { at: nowMinus(49), title: "Trimis" },
      { at: nowMinus(40), title: "În drum" },
      { at: nowMinus(33), title: "La fața locului" },
      { at: nowMinus(20), title: "Finalizat", details: "Alarmă falsă / fără acțiuni" },
    ],
  },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function minutesAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  return Math.round(diff / 60_000);
}
function typeLabel(t: Intervention["type"]) {
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
function statusLabel(s: InterventionStatus) {
  switch (s) {
    case "DISPATCHED":
      return "Trimis";
    case "EN_ROUTE":
      return "În drum";
    case "ON_SCENE":
      return "La fața locului";
    case "COMPLETED":
      return "Finalizat";
  }
}
function unitLabel(rt: ResourceType) {
  switch (rt) {
    case "AMBULANCE":
      return "Ambulanță";
    case "FIRETRUCK":
      return "Autospecială";
    case "POLICE_CAR":
      return "Autospecială poliție";
  }
}

function badgeStyle() {
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

const STATUS_FLOW: InterventionStatus[] = ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "COMPLETED"];

export default function InterventionsPage() {
  const [items, setItems] = useState<Intervention[]>(MOCK);
  const [selectedId, setSelectedId] = useState<string>(MOCK[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<InterventionStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<Intervention["type"] | "ALL">("ALL");
  
  const { log } = useAudit();

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items
      .filter((x) => (statusFilter === "ALL" ? true : x.status === statusFilter))
      .filter((x) => (typeFilter === "ALL" ? true : x.type === typeFilter))
      .filter((x) => {
        if (!qq) return true;
        return (
          x.id.toLowerCase().includes(qq) ||
          x.callId.toLowerCase().includes(qq) ||
          x.address.toLowerCase().includes(qq) ||
          x.notes.toLowerCase().includes(qq) ||
          (x.unit?.code.toLowerCase().includes(qq) ?? false)
        );
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, q, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const dispatched = items.filter((x) => x.status === "DISPATCHED").length;
    const enRoute = items.filter((x) => x.status === "EN_ROUTE").length;
    const onScene = items.filter((x) => x.status === "ON_SCENE").length;
    const completed = items.filter((x) => x.status === "COMPLETED").length;
    return { dispatched, enRoute, onScene, completed };
  }, [items]);

  function appendTimeline(id: string, title: string, details?: string) {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, timeline: [...x.timeline, { at: new Date().toISOString(), title, details }] }
          : x
      )
    );
  }

  function setStatus(id: string, status: InterventionStatus) {
  setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  appendTimeline(id, statusLabel(status));

  log({
    action: "INTERVENTION_STATUS_CHANGED",
    message: `Status → ${statusLabel(status)} pentru ${id}`,
    entityType: "INTERVENTION",
    entityId: id,
    meta: { status },
  });
}

  function moveNextStatus() {
    if (!selected) return;
    const idx = STATUS_FLOW.indexOf(selected.status);
    const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
    if (next !== selected.status) setStatus(selected.id, next);
  }

  function assignUnit() {
    if (!selected) return;
    if (selected.unit) return;

    // mock assign (în viitor: POST /assign + event)
    const unit =
      selected.type === "FIRE"
        ? { type: "FIRETRUCK" as const, code: "ISU-03", crew: "Echipaj Echo" }
        : selected.type === "POLICE"
        ? { type: "POLICE_CAR" as const, code: "POL-05", crew: "Echipaj Foxtrot" }
        : { type: "AMBULANCE" as const, code: "SMURD-06", crew: "Echipaj Golf" };

    setItems((prev) => prev.map((x) => (x.id === selected.id ? { ...x, unit } : x)));
    appendTimeline(selected.id, "Echipaj alocat", `${unit.code} • ${unit.crew}`);

    log({
      action: "UNIT_ASSIGNED",
      message: `Echipaj alocat pentru ${selected.id}`,
      entityType: "INTERVENTION",
      entityId: selected.id,
      meta: { unit: unit.code, crew: unit.crew },
    });
  }

  function unassignUnit() {
    if (!selected) return;
    if (!selected.unit) return;
    const old = selected.unit;
    setItems((prev) => prev.map((x) => (x.id === selected.id ? { ...x, unit: null } : x)));
    appendTimeline(selected.id, "Echipaj de-alocat", `${old.code} • ${old.crew}`);

    log({
      severity: "WARN",
      action: "UNIT_UNASSIGNED",
      message: `Echipaj de-alocat pentru ${selected.id}`,
      entityType: "INTERVENTION",
      entityId: selected.id,
      meta: { unit: old.code, crew: old.crew },
    });
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>Intervenții active</div>
          <div style={styles.subtitle}>
            Listă + detalii + timeline + status flow (mock, pregătit pentru SignalR)
          </div>
        </div>

        <div style={styles.statsRow}>
          <Stat label="Trimis" value={stats.dispatched} />
          <Stat label="În drum" value={stats.enRoute} />
          <Stat label="La fața locului" value={stats.onScene} />
          <Stat label="Finalizat" value={stats.completed} />
        </div>
      </header>

      <main style={styles.grid}>
        {/* Left: list */}
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Intervenții</div>
            <div style={styles.panelHint}>Selectează pentru detalii</div>
          </div>

          <div style={styles.filters}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Caută: ID, CallID, unitate, adresă..."
              style={styles.search}
            />
            <div style={styles.filterRow}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={styles.select}
              >
                <option value="ALL">Toate statusurile</option>
                <option value="DISPATCHED">Trimis</option>
                <option value="EN_ROUTE">În drum</option>
                <option value="ON_SCENE">La fața locului</option>
                <option value="COMPLETED">Finalizat</option>
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
            {filtered.map((x) => {
              const isSelected = x.id === selectedId;
              return (
                <button
                  key={x.id}
                  onClick={() => setSelectedId(x.id)}
                  style={{ ...styles.listItem, ...(isSelected ? styles.listItemSelected : null) }}
                >
                  <div style={styles.listTopRow}>
                    <div style={styles.itemTitle}>{x.id}</div>
                    <div style={styles.time}>{formatTime(x.createdAt)}</div>
                  </div>

                  <div style={styles.listMidRow}>
                    <span style={badgeStyle()}>{typeLabel(x.type)}</span>
                    <span style={badgeStyle()}>{statusLabel(x.status)}</span>
                    <span style={badgeStyle()}>P{x.priority}</span>
                    <span style={badgeStyle()}>{minutesAgo(x.createdAt)} min</span>
                  </div>

                  <div style={styles.listBottomRow}>
                    <div style={styles.address}>{x.address}</div>
                    <div style={styles.muted}>
                      {x.unit ? `${x.unit.code} • ${x.unit.crew}` : "Fără echipaj alocat"}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <div style={styles.empty}>Niciun rezultat.</div>}
          </div>
        </section>

        {/* Right: details */}
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Detalii intervenție</div>
            <div style={styles.panelHint}>În viitor: update live via SignalR</div>
          </div>

          {!selected ? (
            <div style={styles.empty}>Selectează o intervenție.</div>
          ) : (
            <div style={styles.details}>
              <div style={styles.detailsGrid}>
                <Info label="ID" value={selected.id} />
                <Info label="CallID" value={selected.callId} />
                <Info label="Tip" value={typeLabel(selected.type)} />
                <Info label="Status" value={statusLabel(selected.status)} />
                <Info label="Prioritate" value={`P${selected.priority}`} />
                <Info label="Creat la" value={formatTime(selected.createdAt)} />
              </div>

              <div style={styles.block}>
                <div style={styles.blockLabel}>Adresă</div>
                <div style={styles.blockValue}>{selected.address}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.blockLabel}>Note</div>
                <div style={styles.blockValue}>{selected.notes}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.blockLabel}>Echipaj / unitate</div>
                <div style={styles.blockValue}>
                  {selected.unit ? (
                    <>
                      <b>{selected.unit.code}</b> • {unitLabel(selected.unit.type)} •{" "}
                      {selected.unit.crew}
                    </>
                  ) : (
                    <span style={{ opacity: 0.8 }}>Nicio unitate alocată.</span>
                  )}
                </div>

                <div style={styles.actionsRow}>
                  <button
                    onClick={assignUnit}
                    disabled={!!selected.unit}
                    style={styles.secondaryBtn}
                  >
                    Alocă echipaj
                  </button>
                  <button
                    onClick={unassignUnit}
                    disabled={!selected.unit}
                    style={styles.secondaryBtn}
                  >
                    De-alocă
                  </button>
                  <button
                    onClick={moveNextStatus}
                    disabled={selected.status === "COMPLETED"}
                    style={styles.primaryBtn}
                  >
                    Următorul status
                  </button>
                </div>
              </div>

              <div style={styles.block}>
                <div style={styles.blockLabel}>Timeline</div>
                <div style={styles.timeline}>
                  {selected.timeline
                    .slice()
                    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                    .map((t, idx) => (
                      <div key={`${t.at}-${idx}`} style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineBody}>
                          <div style={styles.timelineTop}>
                            <div style={styles.timelineTitle}>{t.title}</div>
                            <div style={styles.timelineTime}>{formatTime(t.at)}</div>
                          </div>
                          {t.details && <div style={styles.timelineDetails}>{t.details}</div>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div style={styles.note}>
                *Mock logic: alocare echipaj + schimbare status adaugă evenimente în timeline.
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.info}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    color: "rgba(255,255,255,0.92)",
    minWidth: 0,
  },

  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  title: { fontSize: 18, fontWeight: 800 },
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
  statValue: { fontSize: 18, fontWeight: 800, marginTop: 4 },

  grid: {
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
  panelTitle: { fontSize: 14, fontWeight: 800 },
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
  itemTitle: { fontSize: 13, fontWeight: 800 },
  time: { fontSize: 12, opacity: 0.75 },
  listMidRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  listBottomRow: { marginTop: 8 },
  address: { fontSize: 12, opacity: 0.9, lineHeight: 1.35 },
  muted: { fontSize: 12, opacity: 0.7, marginTop: 6 },

  empty: { padding: 16, opacity: 0.75, fontSize: 13 },

  details: { padding: 16 },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  info: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
  infoLabel: { fontSize: 12, opacity: 0.7 },
  infoValue: { fontSize: 13, marginTop: 6, lineHeight: 1.3, fontWeight: 700 },

  block: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
  blockLabel: { fontSize: 12, opacity: 0.7 },
  blockValue: { fontSize: 13, marginTop: 6, lineHeight: 1.45 },

  actionsRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },

  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    fontWeight: 800,
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    fontWeight: 800,
  },

  timeline: { marginTop: 12, display: "flex", flexDirection: "column", gap: 10 },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "14px 1fr",
    gap: 10,
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 10,
    height: 10,
    marginTop: 4,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.10)",
  },
  timelineBody: {
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
  },
  timelineTop: { display: "flex", justifyContent: "space-between", gap: 10 },
  timelineTitle: { fontWeight: 800, fontSize: 13 },
  timelineTime: { fontSize: 12, opacity: 0.75 },
  timelineDetails: { marginTop: 6, fontSize: 12, opacity: 0.85, lineHeight: 1.35 },

  note: { marginTop: 12, fontSize: 12, opacity: 0.7 },
};