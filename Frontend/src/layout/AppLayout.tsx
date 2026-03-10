import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Radio, Map, History } from "lucide-react";

export default function AppLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Închidem meniul automat când schimbăm pagina pe mobil
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <div style={styles.shell}>
      {/* Overlay pentru mobil când meniul e deschis - Z-INDEX 999 */}
      {isMobile && menuOpen && (
        <div style={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar - Z-INDEX 1000 */}
      <aside
        style={{
          ...styles.sidebar,
          transform:
            isMobile && !menuOpen ? "translateX(-100%)" : "translateX(0)",
          position: isMobile ? "fixed" : "relative",
        }}
      >
        <div style={styles.brand}>
          <div style={styles.brandTitle}>112 DISPECERAT</div>
          <div style={styles.brandSubtitle}>Operator Console</div>
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
              <div style={styles.userName}>Operator</div>
              {!isMobile && <div style={styles.userRole}>ROLE: OPERATOR</div>}
            </div>
          </div>
        </header>

        <main style={styles.main}>
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
        pointerEvents: "auto", // Asigură capturarea click-ului
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
    zIndex: 1000, // Deasupra hărții
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
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
  },
  brandSubtitle: {
    fontSize: 11,
    opacity: 0.5,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    position: "relative",
    zIndex: 1001, // Peste sidebar pentru click-uri curate
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
  },
  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 15,
  },
  menuBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: 5,
    zIndex: 1002, // Peste tot
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
  },
  pill: {
    display: "inline-block",
    padding: "4px 12px",
    background: "rgba(34,197,94,0.1)",
    color: "#4ade80",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 800,
  },
};
