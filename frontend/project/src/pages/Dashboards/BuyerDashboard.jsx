import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../js/firebase";
import { useNavigate } from "react-router-dom";

import "../../styles/layout.css";
import "../../styles/buyer-dashboard.css";
import "../../styles/loginsignup.css";

/* ================= IMAGE HELPER ================= */

const getVegImage = (veg) => {
  if (!veg) {
    return "https://source.unsplash.com/600x400/?vegetable,market";
  }

  return `https://source.unsplash.com/600x400/?${encodeURIComponent(
    veg
  )},vegetable,market`;
};

export default function BuyerDashboard() {
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);

  /* ================= REALTIME STOCKS ================= */

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "stocks"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStocks(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const vegetables = new Set(stocks.map((s) => s.vegetable)).size;
  const markets = new Set(stocks.map((s) => s.market)).size;

  const goToPrediction = (veg, market) => {
    navigate(
      `/dashboard/predictions?veg=${encodeURIComponent(
        veg
      )}&market=${encodeURIComponent(market)}`
    );
  };

  return (
    <div className="dashboard-container buyer-dashboard">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="dashboard-title">Market Overview</h1>
        <p className="dashboard-subtitle">
          Live supply and pricing information
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
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

      {/* ================= STOCK CARDS ================= */}
      <div className="stock-grid">
        {loading ? (
          <p>Loading...</p>
        ) : stocks.length === 0 ? (
          <p className="buyer-empty">No stock available</p>
        ) : (
          stocks.map((s) => (
            <div key={s.id} className="stock-card liquid-glass">
              {/* IMAGE */}
              <div className="stock-image">
                <img
                  src={getVegImage(s.vegetable)}
                  alt={s.vegetable}
                  loading="lazy"
                />
              </div>

              {/* CONTENT */}
              <div className="stock-card-body">
                <div className="stock-card-header">
                  <h3>{s.vegetable}</h3>
                  <span className="stock-price">
                    Rs. {s.price}/kg
                  </span>
                </div>

                <div className="stock-meta">
                  <p>
                    <strong>Quantity:</strong> {s.quantity} kg
                  </p>
                  <p>
                    <strong>Market:</strong> {s.market}
                  </p>
                </div>

                <div className="stock-actions">
                  <button
                    className="btn secondary"
                    onClick={() =>
                      goToPrediction(s.vegetable, s.market)
                    }
                  >
                    View Prediction
                  </button>

                  <button
                    className="btn"
                    onClick={() => setSelectedStock(s)}
                  >
                    Contact Farmer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= CONTACT MODAL ================= */}
      {selectedStock && (
        <div
          className="auth-overlay show"
          onClick={() => setSelectedStock(null)}
        >
          <div
            className="login-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-card">
              <h2>Farmer Contact</h2>

              <p>
                <strong>Vegetable:</strong>{" "}
                {selectedStock.vegetable}
              </p>
              <p>
                <strong>Market:</strong>{" "}
                {selectedStock.market}
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                {selectedStock.phone || "Not available"}
              </p>

              <button
                className="btn"
                onClick={() => setSelectedStock(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
