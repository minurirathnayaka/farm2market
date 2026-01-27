import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../js/firebase";
import { useAuth } from "../../../state/authStore";
import { useNavigate } from "react-router-dom";

import "../../../styles/farmer-dashboard.css";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= REALTIME STOCKS ================= */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const q = query(
      collection(db, "stocks"),
      where("farmerId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStocks(data);
        setLoading(false);
      },
      () => {
        setError("Unable to load your stock listings.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const totalQuantity = stocks.reduce(
    (sum, s) => sum + Number(s.quantity || 0),
    0
  );

  const marketsCovered = new Set(stocks.map((s) => s.market)).size;

  const goToPrediction = (veg, market) => {
    navigate(
      `/dashboard/predictions?veg=${encodeURIComponent(
        veg
      )}&market=${encodeURIComponent(market)}`
    );
  };

  return (
    <div className="dashboard-container farmer-dashboard">
      {/* ================= HEADER ================= */}
      <div className="farmer-header">
        <div>
          <h1 className="dashboard-title">Farmer Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your stock and track your market presence
          </p>
        </div>

        <button
          className="btn secondary"
          onClick={() => navigate("/")}
        >
          ← Home
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="farmer-stats">
        <div className="farmer-stat-card liquid-glass">
          <h3>{stocks.length}</h3>
          <p>Active Listings</p>
        </div>

        <div className="farmer-stat-card liquid-glass">
          <h3>{totalQuantity} kg</h3>
          <p>Total Quantity</p>
        </div>

        <div className="farmer-stat-card liquid-glass">
          <h3>{marketsCovered}</h3>
          <p>Markets Covered</p>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="farmer-table-card liquid-glass">
        <div className="farmer-table-header">
          <h2>Your Stock Listings</h2>

          <button
            className="btn"
            onClick={() => navigate("/dashboard/stock")}
          >
            + Submit Stock
          </button>
        </div>

        {loading && <p>Loading your stock…</p>}

        {!loading && error && (
          <p className="farmer-empty">{error}</p>
        )}

        {!loading && !error && stocks.length === 0 && (
          <p className="farmer-empty">
            No stock submitted yet
          </p>
        )}

        {!loading && !error && stocks.length > 0 && (
          <div className="farmer-table-wrapper">
            <table className="farmer-stock-table">
              <thead>
                <tr>
                  <th>Vegetable</th>
                  <th>Market</th>
                  <th>Pickup Location</th>
                  <th>Quality</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <tr
                    key={s.id}
                    className="clickable-row"
                    onClick={() =>
                      goToPrediction(s.vegetable, s.market)
                    }
                    title="View price prediction"
                  >
                    <td>{s.vegetable}</td>
                    <td>{s.market}</td>
                    <td>{s.pickupLocation || "-"}</td>
                    <td className={`quality ${s.quality}`}>
                      {s.quality || "-"}
                    </td>
                    <td>{s.quantity} kg</td>
                    <td>LKR {s.price}</td>
                    <td>
                      {s.createdAt?.toDate
                        ? s.createdAt
                            .toDate()
                            .toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
