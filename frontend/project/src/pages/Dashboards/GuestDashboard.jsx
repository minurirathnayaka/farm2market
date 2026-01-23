import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../js/firebase";

import "../../styles/layout.css";
import "../../styles/buyer-dashboard.css";

export default function DashboardHome() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const snap = await getDocs(collection(db, "stocks"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStocks(data);
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, []);

  const vegetables = new Set(stocks.map((s) => s.vegetable)).size;
  const markets = new Set(stocks.map((s) => s.market)).size;

  return (
    <div className="dashboard-container buyer-dashboard">
      <div>
        <h1 className="dashboard-title">Market Overview</h1>
        <p className="dashboard-subtitle">
          Live supply and pricing information
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="buyer-stats">
        <div className="buyer-stat-card liquid-glass">
          <h3>{stocks.length}</h3>
          <p>Active Listings</p>
        </div>

        <div className="buyer-stat-card liquid-glass">
          <h3>{vegetables}</h3>
          <p>Vegetables</p>
        </div>

        <div className="buyer-stat-card liquid-glass">
          <h3>{markets}</h3>
          <p>Markets</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="buyer-table-card liquid-glass">
        <div className="buyer-table-header">
          <h2>Available Stock</h2>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : stocks.length === 0 ? (
          <p className="buyer-empty">No stock available</p>
        ) : (
          <table className="buyer-stock-table">
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
        )}
      </div>
    </div>
  );
}
