import "../../../styles/transporter-dashboard.css";

export default function TransporterDashboard() {
  return (
    <div className="dashboard-container transporter-dashboard">
      {/* ================= HEADER ================= */}
      <header className="transporter-header">
        <div>
          <h1 className="dashboard-title">Transporter Dashboard</h1>
          <p className="dashboard-subtitle">
            Logistics, routing, and delivery coordination
          </p>
        </div>
      </header>

      {/* ================= KPI PREVIEW ================= */}
      <section className="transporter-stats">
        <div className="transporter-stat-card liquid-glass">
          <h3>0</h3>
          <p>Active Deliveries</p>
        </div>

        <div className="transporter-stat-card liquid-glass">
          <h3>0</h3>
          <p>Assigned Routes</p>
        </div>

        <div className="transporter-stat-card liquid-glass">
          <h3>—</h3>
          <p>Status</p>
        </div>
      </section>

      {/* ================= MAIN CARD ================= */}
      <section className="transporter-main liquid-glass">
        <h2>Logistics Module Coming Soon</h2>

        <p className="transporter-description">
          The transporter role will manage pickup scheduling, route
          optimization, and delivery tracking between farmers and buyers.
        </p>

        <ul className="transporter-roadmap">
          <li>📦 View assigned delivery requests</li>
          <li>🗺️ Optimized route planning</li>
          <li>⏱️ Pickup & delivery time tracking</li>
          <li>📞 Direct coordination with farmers</li>
        </ul>

        <div className="transporter-note">
          This module will unlock once logistics workflows are finalized.
        </div>
      </section>
    </div>
  );
}
