import React, { useMemo, useState, useEffect } from "react";
import { useAudit } from "../audit/AuditStore";

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
  const { log } = useAudit();

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
  }, []);

  // --- LOGICĂ AUDIT ---
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

  const handleTakeCall = async () => {
    if (!selected) return;

    try {
      // PASUL 1: Actualizăm statusul apelului în baza de date Azure
      const response = await fetch(`${API_URL}/${selected.id}`, {
        method: "PATCH", // sau PUT, depinde cum ai în .NET
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (response.ok) {
        // PASUL 2: Dacă statusul s-a schimbat, logăm în Audit
        await logAuditAction(
          "PRELUARE_APEL",
          `Operatorul a preluat apelul ${selected.id.substring(0, 8)} de la ${selected.callerNumber}`,
        );

        alert(
          `Apelul de la ${selected.callerNumber} a fost marcat ca 'ÎN LUCRU'.`,
        );

        // PASUL 3: Reîncărcăm lista pentru a vedea schimbarea (va apărea verde/albastru în loc de roșu)
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
      `Intervenție lansată pentru ${selected.emergencyType} la coordonatele ${selected.latitude}, ${selected.longitude}`,
    );
    alert("Intervenția a fost înregistrată și trimisă echipajelor din teren.");
  };

  // --- REVERSE GEOCODING (Transformă GPS în Adresă Reală) ---
  const getAddressFromGPS = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      );
      const data = await response.json();
      // Extragem doar strada și numărul dacă există, altfel returnăm locația completă
      return data.display_name.split(",").slice(0, 2).join(",");
    } catch (error) {
      return "Adresă detectată prin satelit";
    }
  };

  // --- GENERATORUL DE URGENȚE INTELIGENT ---
  const simulateIncomingCall = async () => {
    setIsSimulating(true);

    const locations = [
      {
        name: "Piața Universității",
        lat: 44.4355,
        lng: 26.1025,
        landmarks: "lângă Statui / Facultatea de Istorie",
      },
      {
        name: "Piața Unirii",
        lat: 44.4273,
        lng: 26.1042,
        landmarks: "zona Fântâni / Magazinul Unirea",
      },
      {
        name: "Piața Victoriei",
        lat: 44.4517,
        lng: 26.0859,
        landmarks: "lângă Guvernul României / Muzeul Antipa",
      },
      {
        name: "Arcul de Triumf",
        lat: 44.4673,
        lng: 26.0784,
        landmarks: "intersecția Kiseleff cu Prezan",
      },
      {
        name: "Piața Romană",
        lat: 44.4473,
        lng: 26.0967,
        landmarks: "lângă coloane / ASE",
      },
    ];

    const scenarios = [
      {
        type: "MEDICAL" as EmergencyType,
        desc: "Persoană inconștientă, posibil stop cardio-respirator",
      },
      {
        type: "FIRE" as EmergencyType,
        desc: "Incendiu la un etaj superior, se vede fum dens",
      },
      {
        type: "POLICE" as EmergencyType,
        desc: "Conflict agresiv între mai multe persoane",
      },
      {
        type: "FIRE" as EmergencyType,
        desc: "Accident rutier, victimă încarcerată, scurgeri de combustibil",
      },
    ];

    const spot = locations[Math.floor(Math.random() * locations.length)];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomPhone =
      "07" + Math.floor(20000000 + Math.random() * 70000000).toString();

    // Obținem adresa poștală reală
    const realAddress = await getAddressFromGPS(spot.lat, spot.lng);

    const payload = {
      callerNumber: randomPhone,
      description: `[AML] Adresă: ${realAddress}. Repere: ${spot.name} (${spot.landmarks}). Incident: ${scenario.desc}.`,
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

  const selected = useMemo(
    () => calls.find((c) => c.id === selectedId) ?? null,
    [calls, selectedId],
  );

  // --- MOTORUL DE CĂUTARE ÎMBUNĂTĂȚIT (Fuzzy Search) ---
  const filtered = useMemo(() => {
    const searchTerm = q.trim().toLowerCase();

    return calls
      .filter((c) => {
        if (!searchTerm) return true;
        return (
          c.callerNumber.toLowerCase().includes(searchTerm) ||
          c.emergencyType.toLowerCase().includes(searchTerm) ||
          c.status.toLowerCase().includes(searchTerm) ||
          (c.description || "").toLowerCase().includes(searchTerm)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [calls, q]);

  if (isLoading)
    return (
      <div style={{ padding: 40, color: "white" }}>Sistemul pornește...</div>
    );

  return (
    <div style={styles.page}>
      <header
        style={{
          ...styles.header,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: 15,
        }}
      >
        <div>
          <div style={styles.title}>Dispecerat 112</div>
          <div style={styles.subtitle}>
            Sistem Integrat cu Reverse Geocoding & Audit
          </div>
        </div>
        <button
          onClick={simulateIncomingCall}
          disabled={isSimulating}
          style={{ ...styles.primaryBtn, width: isMobile ? "100%" : "auto" }}
        >
          {isSimulating ? "Se preiau date..." : "SIMULEAZĂ APEL"}
        </button>
      </header>

      <main
        style={{
          ...styles.mainGrid,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr",
        }}
      >
        <section
          style={{ ...styles.panel, minHeight: isMobile ? "auto" : "600px" }}
        >
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Coadă Apeluri (Live)</div>
            <input
              placeholder="Caută număr, tip, stradă..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ ...styles.search, width: isMobile ? "150px" : "200px" }}
            />
          </div>

          <div style={styles.list}>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  ...styles.listItem,
                  ...(c.id === selectedId ? styles.listItemSelected : null),
                  borderLeft:
                    c.status === "PENDING"
                      ? "4px solid #e11d48"
                      : "1px solid rgba(255,255,255,0.1)",
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
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 5 }}>
                  {c.emergencyType} • {c.status}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section
          style={{ ...styles.panel, minHeight: isMobile ? "auto" : "600px" }}
        >
          {selected ? (
            <div style={styles.details}>
              <div style={styles.panelTitle}>
                Fișă Incident:{" "}
                <span style={{ opacity: 0.5 }}>
                  {selected.id.substring(0, 8)}
                </span>
              </div>

              <div
                style={{
                  ...styles.detailsGrid,
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                }}
              >
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>NUMĂR APELANT</div>
                  <div style={styles.detailValue}>{selected.callerNumber}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>TIP URGENȚĂ</div>
                  <div style={styles.detailValue}>{selected.emergencyType}</div>
                </div>
              </div>

              <div style={styles.detailBlockFull}>
                <div style={styles.detailLabel}>COORDONATE GPS (AML)</div>
                <div style={styles.detailValue}>
                  {selected.latitude}, {selected.longitude}
                </div>
              </div>

              <div style={styles.detailBlockFull}>
                <div style={styles.detailLabel}>
                  DATE CONTEXTUALE (ADRESĂ, REPERE & DESCRIERE)
                </div>
                <div
                  style={{
                    ...styles.detailValue,
                    lineHeight: "1.5",
                    fontWeight: "400",
                  }}
                >
                  {selected.description}
                </div>
              </div>

              <div
                style={{
                  ...styles.actions,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <button
                  style={{ ...styles.primaryBtn, flex: 1 }}
                  onClick={handleTakeCall}
                >
                  PREIA CAZUL
                </button>
                <button
                  style={{ ...styles.secondaryBtn, flex: 1 }}
                  onClick={handleCreateIntervention}
                >
                  CREEAZĂ INTERVENȚIE
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.empty}>Selectează un apel din listă.</div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    color: "#fff",
    fontFamily: "system-ui",
    padding: "10px",
    maxWidth: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  title: { fontSize: "22px", fontWeight: "bold" },
  subtitle: { opacity: 0.6, fontSize: "13px" },
  mainGrid: { display: "grid", gap: "15px" },
  panel: {
    background: "#1a1a1a",
    borderRadius: "12px",
    border: "1px solid #333",
    overflowY: "auto",
  },
  panelHeader: {
    padding: "12px",
    borderBottom: "1px solid #333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    fontWeight: "bold",
    fontSize: "13px",
    textTransform: "uppercase",
  },
  list: { padding: "8px" },
  listItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px",
    background: "#222",
    borderRadius: "8px",
    color: "#fff",
    marginBottom: "8px",
    cursor: "pointer",
    borderStyle: "solid",
    borderWidth: "1px 1px 1px 4px", // Sus, Dreapta, Jos, Stânga
  },
  listItemSelected: { background: "#333", borderColor: "#e11d48" },
  listTopRow: { display: "flex", justifyContent: "space-between" },
  callId: { fontWeight: "bold", fontSize: "14px" },
  time: { fontSize: "11px", opacity: 0.5 },
  details: { padding: "15px" },
  detailsGrid: { display: "grid", gap: "10px", marginTop: "15px" },
  detailBlock: {
    padding: "12px",
    background: "#222",
    borderRadius: "8px",
    border: "1px solid #333",
  },
  detailBlockFull: {
    padding: "12px",
    background: "#222",
    borderRadius: "8px",
    border: "1px solid #333",
    marginTop: "10px",
  },
  detailLabel: { fontSize: "9px", opacity: 0.5, marginBottom: "3px" },
  detailValue: { fontWeight: "bold", fontSize: "13px" },
  actions: { marginTop: "20px", display: "flex", gap: "10px" },
  primaryBtn: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e11d48",
    background: "#e11d48",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "#333",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  search: {
    background: "#000",
    border: "1px solid #444",
    color: "#fff",
    borderRadius: "8px",
    padding: "8px 12px",
    outline: "none",
  },
  empty: {
    padding: "50px",
    textAlign: "center",
    opacity: 0.3,
    fontSize: "13px",
  },
};
