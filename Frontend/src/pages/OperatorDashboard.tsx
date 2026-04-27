import React, { useMemo, useState, useEffect } from "react";
import api from "../api/axiosConfig";
import * as signalR from "@microsoft/signalr";
import {
  Phone,
  MapPin,
  ClipboardList,
  Search,
  PlusCircle,
  Truck,
  BrainCircuit,
} from "lucide-react";

type CallStatus = "PENDING" | "ACTIVE" | "IN_PROGRESS" | "CLOSED";
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

type Unit = {
  id: number;
  name: string;
  type: string;
  isAvailable: boolean;
};

// --- CONFIGURARE REGULI ASISTENT INTELIGENT (AI) ---
const aiRules = [
  {
    keywords: ["incendiu", "foc", "fum", "explozie", "arde"],
    suggest: "ISU: POMPIERI",
    type: "FIRE",
    color: "#ef4444",
  },
  {
    keywords: [
      "inconstient",
      "lesin",
      "infarct",
      "durere piept",
      "nu respira",
      "sange",
      "hemoragie",
    ],
    suggest: "SMURD / AMBULANȚĂ",
    type: "MEDICAL",
    color: "#f87171",
  },
  {
    keywords: ["accident", "lovit", "masina", "impact", "strivit", "blocat"],
    suggest: "DESCARCERARE",
    type: "FIRE",
    color: "#fbbf24",
  },
  {
    keywords: [
      "bataie",
      "scandal",
      "furt",
      "arma",
      "agresiv",
      "jaf",
      "protest",
    ],
    suggest: "POLIȚIE / JANDARMERIE",
    type: "POLICE",
    color: "#3b82f6",
  },
  {
    keywords: ["copil", "bebe", "nastere", "pediatrie"],
    suggest: "ECHIPAJ PEDIATRIE",
    type: "MEDICAL",
    color: "#60a5fa",
  },
];

export default function OperatorDashboard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [q, setQ] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);

  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveData, setLiveData] = useState({
    callerNumber: "",
    emergencyType: "MEDICAL" as EmergencyType,
    description: "",
  });

  const userRole = localStorage.getItem("role") || "Necunoscut";
  const isGuest = userRole === "GUEST";
  const currentUserName = isGuest ? "Vizitator" : "Operator Principal";

  const selected = useMemo(
    () => calls.find((c) => c.id === selectedId) ?? null,
    [calls, selectedId],
  );

  // --- LOGICA ANALIZĂ TEXT AI (Pentru Live Form) ---
  const suggestions = useMemo(() => {
    const text = liveData.description.toLowerCase();
    if (text.length < 3) return [];
    return aiRules.filter((rule) =>
      rule.keywords.some((kw) => text.includes(kw)),
    );
  }, [liveData.description]);

  // --- LOGICA ANALIZĂ TEXT AI (Pentru Apelul Selectat) ---
  const selectedSuggestions = useMemo(() => {
    if (!selected?.description) return [];
    const text = selected.description.toLowerCase();
    if (text.length < 3) return [];
    return aiRules.filter((rule) =>
      rule.keywords.some((kw) => text.includes(kw)),
    );
  }, [selected?.description]);

  useEffect(() => {
    if (suggestions.length > 0) {
      const detectedType = suggestions[0].type as EmergencyType;
      if (liveData.emergencyType !== detectedType) {
        setLiveData((prev) => ({ ...prev, emergencyType: detectedType }));
      }
    }
  }, [suggestions]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(
        "https://licenta-dug2g5c4anaxgke3.germanywestcentral-01.azurewebsites.net/callHub",
        {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        },
      )
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        connection.on("UpdateCalls", () => fetchCalls());
      })
      .catch((err) => console.error("SignalR Error: ", err));

    return () => {
      connection.stop();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchCalls = async () => {
    try {
      const response = await api.get("/Calls");
      const data = response.data;
      setCalls(data);
      setSelectedId((prevId) =>
        !prevId && data.length > 0 ? data[0].id : prevId,
      );
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const logAuditAction = async (action: string, details: string) => {
    if (isGuest) return;
    try {
      await api.post("/Audit", {
        operatorId: currentUserName,
        action: action,
        details: details,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTakeCall = async () => {
    if (!selected || isGuest) return;
    try {
      const response = await api.patch(`/Calls/${selected.id}`, {
        status: "IN_PROGRESS",
      });
      if (response.status === 204) {
        await logAuditAction(
          "PRELUARE_APEL",
          `Preluat apel ${selected.id.substring(0, 8)}`,
        );
      }
    } catch (error) {
      alert("Eroare preluare.");
    }
  };

  const handleOpenInterventionModal = async () => {
    if (!selected || isGuest) return;
    try {
      const response = await api.get("/Units");
      setAvailableUnits(response.data.filter((u: Unit) => u.isAvailable));
      setSelectedUnits([]);
      setIsModalOpen(true);
    } catch (error) {
      alert("Eroare unități.");
    }
  };

  const handleConfirmIntervention = async () => {
    if (!selected || isGuest) return;
    if (selectedUnits.length === 0) return alert("Selectați un echipaj!");
    try {
      const response = await api.post("/Interventions", {
        callId: selected.id,
        unitIds: selectedUnits,
      });
      if (response.status === 200 || response.status === 201) {
        await logAuditAction(
          "CREARE_INTERVENTIE",
          `Alocat unități la apel ${selected.id.substring(0, 8)}`,
        );
        setIsModalOpen(false);
      }
    } catch (error) {
      alert("Eroare alocare.");
    }
  };

  const handleCloseCall = async () => {
    if (!selected || isGuest || !window.confirm("Închideți cazul?")) return;
    try {
      await api.post(`/Calls/${selected.id}/close`);
      await logAuditAction(
        "INCHIDERE_CAZ",
        `Finalizat caz ${selected.id.substring(0, 8)}`,
      );
    } catch (error) {
      alert("Eroare închidere.");
    }
  };

  const handleSaveLiveCall = async () => {
    if (isGuest) return;
    if (!liveData.callerNumber || !liveData.description)
      return alert("Completați datele!");
    const payload = {
      ...liveData,
      latitude: 44.43 + Math.random() * 0.05,
      longitude: 26.1 + Math.random() * 0.05,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    try {
      const response = await api.post("/Calls", payload);
      if (response.status === 201) {
        await logAuditAction(
          "APEL_MANUAL",
          `Introdus manual apel: ${liveData.callerNumber}`,
        );
        setIsLiveModalOpen(false);
        setLiveData({
          callerNumber: "",
          emergencyType: "MEDICAL",
          description: "",
        });
      }
    } catch (error) {
      alert("Eroare salvare.");
    }
  };

  const simulateIncomingCall = async () => {
    if (isGuest) return;
    setIsSimulating(true);
    const payload = {
      callerNumber:
        "07" + Math.floor(20000000 + Math.random() * 70000000).toString(),
      description: `[SIMULARE] Incident raportat automat.`,
      emergencyType: ["MEDICAL", "FIRE", "POLICE"][
        Math.floor(Math.random() * 3)
      ] as EmergencyType,
      latitude: 44.43 + Math.random() * 0.1,
      longitude: 26.1 + Math.random() * 0.1,
      status: "PENDING",
    };
    try {
      await api.post("/Calls", payload);
      await logAuditAction(
        "SISTEM_APEL_NOU",
        `Simulat apel: ${payload.callerNumber}`,
      );
      new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
        .play()
        .catch(() => {});
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
      .sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [calls, q]);

  if (isLoading)
    return (
      <div style={{ padding: 40, color: "white" }}>Sistemul pornește...</div>
    );

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes pulseAi {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.03); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
          .ai-suggestion-card {
            animation: pulseAi 2s infinite ease-in-out;
          }
        `}
      </style>

      {/* --- MODAL ALOCARE ECHIPAJE --- */}
      {isModalOpen && selected && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalContent,
              maxWidth: "550px",
              maxHeight: "90vh",
            }}
          >
            <div style={styles.modalHeader}>
              <h3
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Truck size={18} /> Alocare Echipaje
              </h3>
              <span style={{ fontSize: "12px", opacity: 0.7 }}>
                {selected.id.substring(0, 8)}
              </span>
            </div>

            <div
              style={{
                marginBottom: "10px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Bifați unitățile pentru <strong>{selected.emergencyType}</strong>.
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "15px",
                borderLeft: "3px solid #ef4444",
                fontSize: "13px",
                color: "#cbd5e1",
                fontStyle: "italic",
              }}
            >
              <strong>Detalii apel:</strong> {selected.description}
            </div>

            {/* SUGESTII AI IN MODALUL DE ALOCARE */}
            {selectedSuggestions.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "15px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "bold",
                  }}
                >
                  <BrainCircuit size={14} /> AI SUGEREAZĂ:
                </span>
                {selectedSuggestions.map((s, i) => (
                  <span
                    key={i}
                    className="ai-suggestion-card"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: s.color + "15",
                      border: `1px solid ${s.color}`,
                      color: s.color,
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    {s.suggest}
                  </span>
                ))}
              </div>
            )}

            <div style={styles.unitsGrid}>
              {availableUnits.map((unit) => (
                <label
                  key={unit.id}
                  style={{
                    ...styles.unitCard,
                    borderColor: selectedUnits.includes(unit.id)
                      ? "#3b82f6"
                      : "#334155",
                  }}
                >
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      e.target.checked
                        ? setSelectedUnits([...selectedUnits, unit.id])
                        : setSelectedUnits(
                            selectedUnits.filter((id) => id !== unit.id),
                          )
                    }
                  />
                  <div style={{ marginLeft: 10 }}>
                    <strong>{unit.name}</strong>
                    <br />
                    <small>{unit.type}</small>
                  </div>
                </label>
              ))}
            </div>
            <div style={styles.modalActions}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={styles.cancelBtn}
              >
                ANULEAZĂ
              </button>
              <button
                onClick={handleConfirmIntervention}
                style={styles.confirmBtn}
              >
                TRIMITE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL LIVE CU ASISTENT INTELIGENT --- */}
      {isLiveModalOpen && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalContent,
              maxWidth: "700px",
              flexDirection: "row",
              gap: "20px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  color: "white",
                  marginBottom: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Phone size={20} color="#ef4444" /> Preluare Apel Live
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <label style={styles.detailLabel}>NUMĂR APELANT</label>
                <input
                  style={styles.liveInput}
                  value={liveData.callerNumber}
                  onChange={(e) =>
                    setLiveData({ ...liveData, callerNumber: e.target.value })
                  }
                />

                <label style={styles.detailLabel}>
                  TIP URGENȚĂ (Sistemul auto-detectează)
                </label>
                <select
                  style={styles.liveInput}
                  value={liveData.emergencyType}
                  onChange={(e) =>
                    setLiveData({
                      ...liveData,
                      emergencyType: e.target.value as EmergencyType,
                    })
                  }
                >
                  <option value="MEDICAL">MEDICAL</option>
                  <option value="FIRE">INCENDIU / ISU</option>
                  <option value="POLICE">POLIȚIE</option>
                </select>

                <label style={styles.detailLabel}>DESCRIERE INCIDENT</label>
                <textarea
                  style={{
                    ...styles.liveInput,
                    height: 120,
                    border:
                      suggestions.length > 0
                        ? "1px solid #ef4444"
                        : "1px solid #334155",
                  }}
                  placeholder="Ex: A luat foc o mașină pe Bulevardul Magheru..."
                  value={liveData.description}
                  onChange={(e) =>
                    setLiveData({ ...liveData, description: e.target.value })
                  }
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  onClick={() => setIsLiveModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  ANULEAZĂ
                </button>
                <button
                  onClick={handleSaveLiveCall}
                  style={{ ...styles.confirmBtn, background: "#ef4444" }}
                >
                  LANSEAZĂ APEL
                </button>
              </div>
            </div>

            <div
              style={{
                width: "220px",
                background: "#0f172a",
                borderRadius: 8,
                padding: 15,
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "#64748b",
                  marginBottom: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <BrainCircuit size={14} color="#3b82f6" /> ASISTENT DECIZIE AI
              </div>
              {suggestions.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="ai-suggestion-card"
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        background: s.color + "15",
                        border: `1px solid ${s.color}`,
                        color: s.color,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {s.suggest}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontStyle: "italic",
                  }}
                >
                  Analizez descrierea în timp real...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <div>
          <div style={styles.title}>Panou de Control</div>
          <div style={styles.subtitle}>
            Monitorizare și alocare echipaje în timp real
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setIsLiveModalOpen(true)}
            disabled={isGuest}
            style={{
              ...styles.primaryBtn,
              background: "#e11d48",
              opacity: isGuest ? 0.5 : 1,
            }}
          >
            <Phone size={18} style={{ marginRight: 8 }} /> APEL NOU (LIVE)
          </button>
          <button
            onClick={simulateIncomingCall}
            disabled={isSimulating || isGuest}
            style={{ ...styles.primaryBtn, opacity: isGuest ? 0.5 : 1 }}
          >
            <PlusCircle size={18} style={{ marginRight: 8 }} /> SIMULEAZĂ
          </button>
        </div>
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
              <Phone size={14} style={{ marginRight: 6 }} /> APELURI
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
                    c.status === "PENDING" ? "#e11d48" : "#22c55e",
                }}
              >
                <div style={styles.listTopRow}>
                  <strong>{c.callerNumber}</strong>{" "}
                  <small>
                    {new Date(c.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  {c.emergencyType} • {c.status}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          {selected ? (
            <div style={styles.details}>
              <div style={styles.detailBlockFull}>
                <small style={styles.detailLabel}>DESCRIERE</small>
                <div style={styles.detailValue}>{selected.description}</div>
              </div>

              {/* SUGESTII AI IN PANOUL PRINCIPAL */}
              {selectedSuggestions.length > 0 && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "rgba(59, 130, 246, 0.05)",
                    borderRadius: "8px",
                    border: "1px dashed rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#3b82f6",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <BrainCircuit size={14} /> RECOMANDARE ASISTENT AI:
                  </div>
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    {selectedSuggestions.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          background: s.color + "22",
                          border: `1px solid ${s.color}`,
                          color: s.color,
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        {s.suggest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                {selected.status === "PENDING" && (
                  <button
                    style={{ ...styles.actionBtn, background: "#e11d48" }}
                    onClick={handleTakeCall}
                  >
                    PREIA CAZUL
                  </button>
                )}
                {selected.status === "IN_PROGRESS" && (
                  <button
                    style={{ ...styles.actionBtn, background: "#3b82f6" }}
                    onClick={handleOpenInterventionModal}
                  >
                    ALOCĂ ECHIPAJE
                  </button>
                )}
                {selected.status === "ACTIVE" && (
                  <button
                    style={{ ...styles.actionBtn, background: "#22c55e" }}
                    onClick={handleCloseCall}
                  >
                    ÎNCHIDE CAZ
                  </button>
                )}
                {selected.status === "CLOSED" && (
                  <div style={{ textAlign: "center", color: "#64748b" }}>
                    CAZ FINALIZAT
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.empty}>Selectați un apel.</div>
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
    background: "#0b1220",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  title: { fontSize: "22px", fontWeight: "bold" },
  subtitle: { opacity: 0.5, fontSize: "12px" },
  mainGrid: { display: "grid", gap: "20px" },
  panel: {
    background: "#0f172a",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "15px",
    background: "#1e293b22",
    display: "flex",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#64748b",
    letterSpacing: 1,
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#0b1220",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  search: {
    background: "transparent",
    border: "none",
    color: "#fff",
    outline: "none",
    fontSize: "12px",
  },
  list: { padding: "10px", overflowY: "auto", maxHeight: "70vh" },
  listItem: {
    width: "100%",
    padding: "12px",
    background: "#1e293b55",
    borderRadius: "8px",
    color: "#fff",
    marginBottom: "8px",
    border: "1px solid #1e293b",
    borderLeftWidth: "4px",
    textAlign: "left",
    cursor: "pointer",
  },
  listItemSelected: { background: "#1e293b", borderColor: "#3b82f6" },
  listTopRow: { display: "flex", justifyContent: "space-between" },
  details: { padding: "20px" },
  detailBlockFull: {
    padding: "15px",
    background: "#0b1220",
    borderRadius: "8px",
    border: "1px solid #1e293b",
  },
  detailLabel: {
    fontSize: "9px",
    color: "#64748b",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  detailValue: { fontWeight: "500", marginTop: 5 },
  actionBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  empty: { padding: "100px 0", textAlign: "center", color: "#475569" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)",
  },
  modalContent: {
    background: "#1e293b",
    borderRadius: "16px",
    border: "1px solid #334155",
    width: "95%",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  unitsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    maxHeight: "350px",
    overflowY: "auto",
    paddingRight: "5px",
    marginBottom: "15px",
  },
  unitCard: {
    padding: 10,
    background: "#0f172a",
    border: "2px solid",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    padding: "10px 15px",
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: 8,
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },
  liveInput: {
    width: "100%",
    padding: "12px",
    background: "#0b1220",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    outline: "none",
    fontSize: "14px",
  },
};
