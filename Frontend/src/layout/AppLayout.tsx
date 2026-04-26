import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Radio,
  Map,
  History,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export default function AppLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role") || "Necunoscut";
  // Dacă e GUEST afișăm "Vizitator", altfel "Operator/Admin"
  const userName = userRole === "GUEST" ? "Vizitator" : "Operator Principal";

  // --- BARIERA DE SECURITATE ---
  // Dacă utilizatorul nu are token, îl trimitem imediat la Login
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  // Dacă nu e logat, nu randăm interfața (va fi redirecționat de useEffect)
  if (!token) return null;

  return (
    <div style={styles.shell}>
      {isMobile && menuOpen && (
        <div style={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}

      <aside
        style={{
          ...styles.sidebar,
          transform:
            isMobile && !menuOpen ? "translateX(-100%)" : "translateX(0)",
          position: isMobile ? "fixed" : "relative",
        }}
      >
        <div style={styles.brand}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={28} color="#ef4444" />
            <div>
              <div style={styles.brandTitle}>S.I.U.</div>
              <div style={styles.brandSubtitle}>Platformă Operativă</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavItem to="/" label="Dashboard" icon={<Radio size={18} />} />
          <NavItem
            to="/interventii"
            label="Intervenții"
            icon={<Map size={18} />}
          />
          <NavItem to="/audit" label="Audit" icon={<History size={18} />} />
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.smallLabel}>Status sistem</div>
          <div style={styles.pill}>ONLINE</div>
        </div>
      </aside>

      <div style={styles.content}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            {isMobile && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={styles.menuBtn}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
            <div>
              <div style={styles.topbarTitle}>Dispecerat 112</div>
              {!isMobile && (
                <div style={styles.topbarHint}>Sistem Integrat de Urgență</div>
              )}
            </div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.userBox}>
              <div style={{ textAlign: "right" }}>
                <div style={styles.userName}>{userName}</div>
                {!isMobile && (
                  <div
                    style={{
                      ...styles.userRole,
                      color: userRole === "GUEST" ? "#facc15" : "#94a3b8",
                    }}
                  >
                    ROLE: {userRole.toUpperCase()}
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
                title="Deconectare"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main style={{ ...styles.main, zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        ...styles.navItem,
        background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
        borderColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
        pointerEvents: "auto",
      })}
    >
      <span style={{ marginRight: 12, display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    background: "#0b1220",
    overflow: "hidden",
  },

  sidebar: {
    width: 260,
    height: "100%",
    background: "#0f172a",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    transition: "transform 0.3s ease",
    zIndex: 9999,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 9998,
  },

  brand: {
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
  },

  brandTitle: {
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: 1,
    color: "#fff",
  },

  brandSubtitle: {
    fontSize: 11,
    opacity: 0.5,
    color: "#fff",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    position: "relative",
    zIndex: 10,
  },

  navItem: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    border: "1px solid transparent",
    cursor: "pointer",
    position: "relative",
  },

  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  topbar: {
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
  },

  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 15,
  },

  topbarTitle: {
    fontWeight: "bold",
    fontSize: "1.1rem",
  },

  topbarHint: {
    fontSize: "0.8rem",
    opacity: 0.7,
  },

  menuBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: 5,
    zIndex: 10000,
  },

  topbarRight: {
    display: "flex",
    alignItems: "center",
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  userName: {
    fontWeight: 600,
    fontSize: "0.9rem",
  },

  userRole: {
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
  },

  logoutBtn: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },

  main: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
  },

  sidebarFooter: {
    marginTop: "auto",
  },

  smallLabel: {
    fontSize: 12,
    opacity: 0.7,
    color: "#fff",
  },

  pill: {
    display: "inline-block",
    padding: "4px 12px",
    background: "rgba(34,197,94,0.1)",
    color: "#4ade80",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 800,
    marginTop: 5,
  },
};
