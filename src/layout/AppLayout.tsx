import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandTitle}>112 DISPECERAT</div>
          <div style={styles.brandSubtitle}>Operator Console</div>
        </div>

        <nav style={styles.nav}>
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/interventii" label="Intervenții" />
          <NavItem to="/audit" label="Audit" />
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.smallLabel}>Status sistem</div>
          <div style={styles.pill}>ONLINE</div>
        </div>
      </aside>

      <div style={styles.content}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <div style={styles.topbarTitle}>Dispecerat 112</div>
            <div style={styles.topbarHint}>Mock UI • urmează API + SignalR</div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.userBox}>
              <div style={styles.userName}>Operator</div>
              <div style={styles.userRole}>ROLE: OPERATOR</div>
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

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        ...styles.navItem,
        ...(isActive ? styles.navItemActive : null),
      })}
    >
      {label}
    </NavLink>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    height: "100vh",
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    background: "#0b1220",
    color: "rgba(255,255,255,0.92)",
    fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
  },

  sidebar: {
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    overflowY: "auto",
},
  brand: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
  },
  brandTitle: { fontWeight: 800, letterSpacing: 1, fontSize: 13 },
  brandSubtitle: { opacity: 0.7, marginTop: 6, fontSize: 12 },

  nav: { display: "flex", flexDirection: "column", gap: 8 },

  navItem: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.86)",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    fontWeight: 700,
    fontSize: 13,
  },
  navItemActive: {
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.08)",
  },

  sidebarFooter: {
    marginTop: "auto",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
  },
  smallLabel: { fontSize: 12, opacity: 0.7 },
  pill: {
    display: "inline-flex",
    marginTop: 10,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(80,255,160,0.10)",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 0.4,
  },

  content: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
},

  topbar: {
  position: "sticky",
  top: 0,
  zIndex: 10,
  height: 64,
  padding: "0 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(11,18,32,0.85)",
  backdropFilter: "blur(10px)",
},
  topbarLeft: { display: "flex", flexDirection: "column", gap: 2 },
  topbarTitle: { fontSize: 14, fontWeight: 800 },
  topbarHint: { fontSize: 12, opacity: 0.7 },

  topbarRight: { display: "flex", alignItems: "center", gap: 10 },
  userBox: {
    padding: "8px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    textAlign: "right",
  },
  userName: { fontWeight: 800, fontSize: 12 },
  userRole: { fontSize: 11, opacity: 0.7, marginTop: 2 },

  main: {
  padding: 16,
  overflowY: "auto",
  minHeight: 0,
  flex: 1,
},
};