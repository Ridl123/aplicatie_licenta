import React, { useMemo, useState, useEffect } from "react";
import { useAudit } from "../audit/AuditStore";
import {
  Phone,
  MapPin,
  ClipboardList,
  ShieldAlert,
  Activity,
  Flame,
  Search,
  PlusCircle,
} from "lucide-react";

type CallStatus = "PENDING" | "IN_PROGRESS" | "CLOSED";
type EmergencyType = "MEDICAL" | "FIRE" | "POLICE" | "OTHER";

type Call = {
  id: string;
  createdAt: string;
  callerNumber: string;
  emergencyType: EmergencyType;
  status: CallStatus;
  description: string;
  latitude: number;
  longitude: number;
};

const API_URL = "http://localhost:5023/api/Calls";
const AUDIT_URL = "http://localhost:5023/api/Audit";

export default function OperatorDashboard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [q, setQ] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchCalls = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error("Eroare API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const logAuditAction = async (action: string, details: string) => {
    try {
      await fetch(AUDIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: "OP-452",
          action: action,
          details: details,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Audit log failed", e);
    }
  };

  const selected = useMemo(
    () => calls.find((c) => c.id === selectedId) ?? null,
    [calls, selectedId],
  );

  const handleTakeCall = async () => {
    if (!selected) return;
    try {
      const response = await fetch(`${API_URL}/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (response.ok) {
        // --- REPARARE: REINTRODUCERE ALERTĂ CONFIRMARE ---
        alert(
          `Apelul de la ${selected.callerNumber} a fost marcat ca 'ÎN LUCRU'.`,
        );

        await logAuditAction(
          "PRELUARE_APEL",
          `Operatorul a preluat apelul ${selected.id.substring(0, 8)} de la ${selected.callerNumber}`,
        );
        await fetchCalls();
      } else {
        alert("Eroare la actualizarea statusului în baza de date.");
      }
    } catch (error) {
      console.error("Eroare la preluarea apelului:", error);
    }
  };

  const handleCreateIntervention = async () => {
    if (!selected) return;

    await logAuditAction(
      "CREARE_INTERVENTIE",
      `Interventie lansata pentru ${selected.emergencyType} la locatia detectata.`,
    );

    // --- REPARARE: REINTRODUCERE ALERTĂ CONFIRMARE ---
    alert("Interventia a fost inregistrata.");
  };

  const getAddressFromGPS = async (lat: number, lng: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "ro" } },
      );
      if (response.status === 429)
        return "Identificare in curs (limitare server)...";
      const data = await response.json();
      return data.display_name.split(",").slice(0, 2).join(",");
    } catch (error) {
      return "Identificare...";
    }
  };

  const simulateIncomingCall = async () => {
    setIsSimulating(true);
    const locations = [
      {
        name: "Piata Universitatii",
        lat: 44.43552,
        lng: 26.10251,
        landmarks: "langa Statui",
      },
      {
        name: "Piata Unirii",
        lat: 44.42735,
        lng: 26.10424,
        landmarks: "zona Fantani",
      },
      {
        name: "Piata Victoriei",
        lat: 44.45171,
        lng: 26.08592,
        landmarks: "langa Guvern",
      },
      {
        name: "Arcul de Triumf",
        lat: 44.46733,
        lng: 26.07845,
        landmarks: "intersectia Kiseleff",
      },
    ];

    const scenarios = [
      { type: "MEDICAL", desc: "Persoana inconstienta" },
      { type: "FIRE", desc: "Incendiu etaj superior" },
      { type: "POLICE", desc: "Conflict agresiv" },
    ];

    const spot = locations[Math.floor(Math.random() * locations.length)];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomPhone =
      "07" + Math.floor(20000000 + Math.random() * 70000000).toString();

    const realAddress = await getAddressFromGPS(spot.lat, spot.lng);

    const payload = {
      callerNumber: randomPhone,
      description: `[AML] Adresa: ${realAddress}. Repere: ${spot.name} (${spot.landmarks}). Incident: ${scenario.desc}.`,
      emergencyType: scenario.type,
      latitude: spot.lat,
      longitude: spot.lng,
      status: "PENDING",
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await logAuditAction(
          "SISTEM_APEL_NOU",
          `Apel automat receptionat de la ${randomPhone}`,
        );
        await fetchCalls();
        new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
          .play()
          .catch(() => {});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  const filtered = useMemo(() => {
    const st = q.toLowerCase();
    return calls
      .filter(
        (c) =>
          c.callerNumber.includes(st) ||
          c.emergencyType.toLowerCase().includes(st) ||
          (c.description || "").toLowerCase().includes(st),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [calls, q]);

  if (isLoading)
    return (
      <div style={{ padding: 40, color: "white" }}>Sistemul porneste...</div>
    );

  return (
    <div style={styles.page}>
      <header
        style={{ ...styles.header, flexDirection: isMobile ? "column" : "row" }}
      >
        <div>
          <div style={styles.title}>Dispecerat 112</div>
          <div style={styles.subtitle}>
            Consola Operator v3.0 - Monitorizare Live
          </div>
        </div>
        <button
          onClick={simulateIncomingCall}
          disabled={isSimulating}
          style={styles.primaryBtn}
        >
          <PlusCircle size={18} style={{ marginRight: 8 }} />
          {isSimulating ? "Se preiau date..." : "SIMULEAZA APEL"}
        </button>
      </header>

      <main
        style={{
          ...styles.mainGrid,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr",
        }}
      >
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>
              <Phone size={14} style={{ marginRight: 6 }} /> Coada Apeluri
            </div>
            <div style={styles.searchWrapper}>
              <Search size={14} color="#666" />
              <input
                placeholder="Cauta..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={styles.search}
              />
            </div>
          </div>

          <div style={styles.list}>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  ...styles.listItem,
                  ...(c.id === selectedId ? styles.listItemSelected : {}),
                  borderLeftColor:
                    c.status === "PENDING" ? "#e11d48" : "#3b82f6",
                }}
              >
                <div style={styles.listTopRow}>
                  <div style={styles.callId}>{c.callerNumber}</div>
                  <div style={styles.time}>
                    {new Date(c.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                  {c.emergencyType} • {c.status}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          {selected ? (
            <div style={styles.details}>
              <div style={styles.panelTitle}>
                <ClipboardList size={16} style={{ marginRight: 8 }} /> Fisa
                Incident: {selected.id.substring(0, 8)}
              </div>

              <div
                style={{
                  ...styles.detailsGrid,
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                }}
              >
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>NUMAR APELANT</div>
                  <div style={styles.detailValue}>{selected.callerNumber}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>TIP URGENTA</div>
                  <div style={styles.detailValue}>{selected.emergencyType}</div>
                </div>
              </div>

              <div style={styles.detailBlockFull}>
                <div style={styles.detailLabel}>
                  <MapPin size={12} style={{ marginRight: 4 }} /> COORDONATE GPS
                  (AML)
                </div>
                <div style={styles.detailValue}>
                  {selected.latitude}, {selected.longitude}
                </div>
              </div>

              <div style={styles.detailBlockFull}>
                <div style={styles.detailLabel}>DATE CONTEXTUALE</div>
                <div
                  style={{
                    ...styles.detailValue,
                    fontWeight: "400",
                    lineHeight: "1.6",
                  }}
                >
                  {selected.description}
                </div>
              </div>

              <div style={styles.actions}>
                <button style={styles.takeCallBtn} onClick={handleTakeCall}>
                  PREIA CAZUL
                </button>
                <button
                  style={styles.createIntBtn}
                  onClick={handleCreateIntervention}
                >
                  CREEAZA INTERVENTIE
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.empty}>
              Selectati un apel din lista pentru detalii.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    color: "#fff",
    padding: "20px",
    background: "#0f172a",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    alignItems: "center",
  },
  title: { fontSize: "24px", fontWeight: "bold", letterSpacing: "-0.5px" },
  subtitle: { opacity: 0.5, fontSize: "13px" },
  mainGrid: { display: "grid", gap: "20px" },
  panel: {
    background: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
  },
  panelHeader: {
    padding: "15px",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    fontWeight: "bold",
    fontSize: "12px",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    color: "#94a3b8",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#0f172a",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  search: {
    background: "transparent",
    border: "none",
    color: "#fff",
    marginLeft: "8px",
    outline: "none",
    fontSize: "13px",
  },
  list: { padding: "10px", overflowY: "auto", maxHeight: "70vh" },
  listItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    background: "#334155",
    borderRadius: "8px",
    color: "#fff",
    marginBottom: "8px",
    cursor: "pointer",
    border: "1px solid transparent",
    borderLeftWidth: "4px",
    transition: "all 0.2s",
  },
  listItemSelected: {
    background: "#475569",
    borderColor: "rgba(255,255,255,0.1)",
  },
  listTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  callId: { fontWeight: "bold", fontSize: "14px" },
  time: { fontSize: "11px", opacity: 0.5 },
  details: { padding: "20px" },
  detailsGrid: { display: "grid", gap: "12px", marginTop: "20px" },
  detailBlock: {
    padding: "12px",
    background: "#0f172a",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  detailBlockFull: {
    padding: "12px",
    background: "#0f172a",
    borderRadius: "8px",
    border: "1px solid #334155",
    marginTop: "12px",
  },
  detailLabel: {
    fontSize: "10px",
    color: "#64748b",
    marginBottom: "6px",
    fontWeight: "bold",
  },
  detailValue: { fontWeight: "bold", fontSize: "14px" },
  actions: { marginTop: "30px", display: "flex", gap: "12px" },
  primaryBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
  },
  takeCallBtn: {
    flex: 1,
    padding: "14px",
    borderRadius: "8px",
    background: "#e11d48",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    border: "none",
  },
  createIntBtn: {
    flex: 1,
    padding: "14px",
    borderRadius: "8px",
    background: "#334155",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    border: "1px solid #475569",
  },
  empty: {
    padding: "100px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
};
