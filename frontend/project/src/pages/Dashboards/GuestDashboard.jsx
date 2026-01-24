import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../js/firebase";

import "../../styles/guest-dashboard.css";

export default function GuestDashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const snap = await getDocs(collection(db, "stocks"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStocks(data);
      } catch {
        setError("Unable to load market data.");
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, []);

  const vegetables = new Set(stocks.map((s) => s.vegetable)).size;
  const markets = new Set(stocks.map((s) => s.market)).size;

  return (
    <div className="dashboard-container guest-dashboard">
      {/* ================= HEADER ================= */}
      <header>
        <h1 className="dashboard-title">Market Overview</h1>
        <p className="dashboard-subtitle">
          Public view of available produce across markets
        </p>
      </header>

      {/* ================= KPI ================= */}
      <section className="guest-stats">
        <div className="guest-stat-card liquid-glass">
          <h3>{stocks.length}</h3>
          <p>Active Listings</p>
        </div>

        <div className="guest-stat-card liquid-glass">
          <h3>{vegetables}</h3>
          <p>Vegetables</p>
        </div>

        <div className="guest-stat-card liquid-glass">
          <h3>{markets}</h3>
          <p>Markets</p>
        </div>
      </section>

      {/* ================= TABLE ================= */}
      <section className="guest-table-card liquid-glass">
        <h2>Available Stock</h2>

        {loading && <p>Loading market data…</p>}

        {!loading && error && (
          <p className="guest-empty">{error}</p>
        )}

        {!loading && !error && stocks.length === 0 && (
          <p className="guest-empty">No stock available</p>
        )}

        {!loading && !error && stocks.length > 0 && (
          <div className="guest-table-wrapper">
            <table className="guest-stock-table">
              <thead>
                <tr>
                  <th>Vegetable</th>
                  <th>Market</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <tr key={s.id}>
                    <td>{s.vegetable}</td>
                    <td>{s.market}</td>
                    <td>{s.quantity} kg</td>
                    <td>LKR {s.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
