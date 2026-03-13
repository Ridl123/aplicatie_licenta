import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Activity,
  Flame,
  ShieldAlert,
  HelpCircle,
  ZoomOut,
  Search,
  MapPin,
  Clock,
} from "lucide-react";
import MarkerClusterGroup from "react-leaflet-cluster";

type Call = {
  id: string;
  callerNumber: string;
  emergencyType: string;
  latitude: number;
  longitude: number;
  description: string;
  status: string;
  createdAt: string;
};

function MapController({
  center,
  resetTrigger,
}: {
  center: [number, number] | null;
  resetTrigger: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 17, { animate: true, duration: 1 });
  }, [center, map]);

  useEffect(() => {
    if (resetTrigger > 0)
      map.flyTo([44.4355, 26.1025], 12, { animate: true, duration: 1 });
  }, [resetTrigger, map]);

  return null;
}

const createLucideIcon = (type: string, isHighlighted: boolean) => {
  let IconComponent;
  let color;
  switch (type?.toUpperCase()) {
    case "MEDICAL":
      IconComponent = Activity;
      color = "#ef4444";
      break;
    case "FIRE":
      IconComponent = Flame;
      color = "#f97316";
      break;
    case "POLICE":
      IconComponent = ShieldAlert;
      color = "#3b82f6";
      break;
    default:
      IconComponent = HelpCircle;
      color = "#94a3b8";
  }

  const iconHTML = renderToStaticMarkup(
    <div
      style={{
        color: "white",
        background: color,
        padding: "8px",
        borderRadius: "50%",
        border: isHighlighted ? "4px solid #facc15" : "2px solid white",
        display: "flex",
        boxShadow: isHighlighted
          ? "0 0 20px #facc15"
          : "0 2px 5px rgba(0,0,0,0.4)",
        transform: isHighlighted ? "scale(1.25)" : "scale(1)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <IconComponent size={20} />
    </div>,
  );

  return L.divIcon({
    html: iconHTML,
    className: "custom-div-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function InterventionsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [addressMap, setAddressMap] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const API_URL = "http://localhost:5023/api/Calls";

  const fetchAddress = useCallback(
    async (lat: number, lon: number, id: string, force: boolean = false) => {
      if (!force && addressMap[id] && addressMap[id] !== "Identificare...")
        return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16`,
          { headers: { "Accept-Language": "ro" } },
        );
        if (res.status === 429) return;
        const data = await res.json();
        const landmark =
          data.address.amenity ||
          data.address.landmark ||
          data.address.building ||
          data.address.road ||
          "București";
        setAddressMap((prev) => ({ ...prev, [id]: landmark }));
      } catch (err) {
        console.error("Eroare Nominatim:", err);
      }
    },
    [addressMap],
  );

  const fetchCalls = useCallback(() => {
    fetch(`${API_URL}?t=${new Date().getTime()}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setCalls(sorted.filter((c: any) => c.status !== "CLOSED").slice(0, 25));
      });
  }, []);

  useEffect(() => {
    let timeoutId: any;
    const processQueue = async () => {
      const pendingCall = calls.find(
        (call) =>
          !addressMap[call.id] || addressMap[call.id] === "Identificare...",
      );
      if (pendingCall) {
        await fetchAddress(
          pendingCall.latitude,
          pendingCall.longitude,
          pendingCall.id,
        );
      }
    };
    if (calls.length > 0) {
      timeoutId = setTimeout(processQueue, 1500);
    }
    return () => clearTimeout(timeoutId);
  }, [calls, addressMap, fetchAddress]);

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 10000);
    return () => clearInterval(interval);
  }, [fetchCalls]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;
    const found = calls.find(
      (c) =>
        (addressMap[c.id] || "").toLowerCase().includes(query) ||
        c.emergencyType.toLowerCase().includes(query),
    );
    if (found) setSelectedPos([found.latitude, found.longitude]);
  };

  const stats = {
    FIRE: calls.filter((c) => c.emergencyType === "FIRE").length,
    MEDICAL: calls.filter((c) => c.emergencyType === "MEDICAL").length,
    POLICE: calls.filter((c) => c.emergencyType === "POLICE").length,
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "#0f172a",
        overflow: "hidden",
      }}
    >
      <div style={styles.headerContainer}>
        <div style={styles.controlsRow}>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <Search size={18} color="#64748b" />
            <input
              placeholder="Căutare după tip sau reper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </form>
          <button
            onClick={() => {
              setSelectedPos(null);
              setResetTrigger((p) => p + 1);
              setSearchQuery("");
            }}
            style={styles.resetButton}
          >
            <ZoomOut size={18} /> <span className="hide-mobile">Reset</span>
          </button>
        </div>
        <div style={styles.statsRow}>
          <div style={{ ...styles.statBadge, borderLeft: "4px solid #f97316" }}>
            <Flame size={16} color="#f97316" style={{ marginRight: 6 }} />{" "}
            <strong>{stats.FIRE}</strong>{" "}
            <span className="hide-text-mobile" style={{ marginLeft: 4 }}>
              Incendii
            </span>
          </div>
          <div style={{ ...styles.statBadge, borderLeft: "4px solid #ef4444" }}>
            <Activity size={16} color="#ef4444" style={{ marginRight: 6 }} />{" "}
            <strong>{stats.MEDICAL}</strong>{" "}
            <span className="hide-text-mobile" style={{ marginLeft: 4 }}>
              Medicale
            </span>
          </div>
          <div style={{ ...styles.statBadge, borderLeft: "4px solid #3b82f6" }}>
            <ShieldAlert size={16} color="#3b82f6" style={{ marginRight: 6 }} />{" "}
            <strong>{stats.POLICE}</strong>{" "}
            <span className="hide-text-mobile" style={{ marginLeft: 4 }}>
              Poliție
            </span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[44.4355, 26.1025]}
        zoom={12}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ZoomControl position="bottomright" />
        <MapController center={selectedPos} resetTrigger={resetTrigger} />

        {calls.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {calls.map((call) => (
              <Marker
                key={call.id}
                position={[call.latitude, call.longitude]}
                icon={createLucideIcon(call.emergencyType, false)}
              >
                <Tooltip direction="top" offset={[0, -25]} opacity={1}>
                  <div style={{ padding: "4px", minWidth: "140px" }}>
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        marginBottom: "5px",
                        fontWeight: "bold",
                        color: "#1e293b",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{call.emergencyType}</span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>
                        {new Date(call.createdAt).toLocaleTimeString("ro-RO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MapPin size={12} />{" "}
                      {addressMap[call.id] || "Identificare..."}
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: "180px" }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        color: "#ef4444",
                        fontSize: "16px",
                      }}
                    >
                      {call.emergencyType}
                    </h3>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      <strong>Locație:</strong>{" "}
                      {addressMap[call.id] || "Identificare..."}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      <Clock
                        size={12}
                        style={{ display: "inline", marginRight: "4px" }}
                      />
                      <strong>Ora:</strong>{" "}
                      {new Date(call.createdAt).toLocaleTimeString("ro-RO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      <strong>Contact:</strong> {call.callerNumber}
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "12px",
                        color: "#64748b",
                        fontStyle: "italic",
                      }}
                    >
                      {call.description}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      <style>{`
        @media (max-width: 600px) { .hide-mobile { display: none; } .hide-text-mobile { display: none; } }
        .leaflet-bottom.leaflet-right { margin-bottom: 85px !important; margin-right: 12px !important; }
        .leaflet-control-attribution { background: rgba(255, 255, 255, 0.8) !important; padding: 2px 8px !important; font-size: 10px !important; }
        .marker-cluster-small, .marker-cluster-medium { background-color: rgba(181, 226, 140, 0.6); }
        .marker-cluster div { width: 30px; height: 30px; margin-left: 5px; margin-top: 5px; text-align: center; border-radius: 15px; font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif; }
        .marker-cluster span { line-height: 30px; font-weight: bold; color: black; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerContainer: {
    position: "absolute",
    top: "15px",
    left: "15px",
    right: "15px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    pointerEvents: "none",
  },
  controlsRow: {
    display: "flex",
    gap: "10px",
    width: "100%",
    pointerEvents: "auto",
  },
  searchForm: {
    display: "flex",
    background: "white",
    padding: "0 15px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    alignItems: "center",
    flex: 1,
    maxWidth: "500px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    padding: "10px",
    width: "100%",
    fontSize: "14px",
  },
  resetButton: {
    background: "white",
    border: "none",
    padding: "0 15px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#1e293b",
  },
  statsRow: {
    display: "flex",
    gap: "8px",
    pointerEvents: "auto",
    flexWrap: "wrap",
  },
  statBadge: {
    background: "rgba(15, 23, 42, 0.9)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    backdropFilter: "blur(5px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
  },
};
