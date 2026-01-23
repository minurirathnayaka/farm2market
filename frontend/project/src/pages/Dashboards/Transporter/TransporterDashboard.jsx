import "../../../styles/layout.css";
import "../../../styles/transporter-dashboard.css";

export default function TransporterDashboard() {
  return (
    <div className="dashboard-container transporter-dashboard">
      <div>
        <h1 className="dashboard-title">Transporter Dashboard</h1>
        <p className="dashboard-subtitle">
          Logistics and delivery operations
        </p>
      </div>

      <div className="transporter-empty liquid-glass">
        <h2>Coming Soon</h2>
        <p>
          Transporter features will be enabled once logistics workflows
          are finalized.
        </p>
      </div>
    </div>
  );
}
