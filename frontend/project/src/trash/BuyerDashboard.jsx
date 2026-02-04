import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../js/firebase";
import { useNavigate } from "react-router-dom";

/* chart */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

/* styles */
import "../../styles/buyer-dashboard.css";

/* images */
import tomatoImg from "../../assets/pics/tomatoes.jpg";
import onionImg from "../../assets/pics/Onion.jpg";
import carrotImg from "../../assets/pics/carrot.jpg";
import chilliImg from "../../assets/pics/chilli.jpg";
import limeImg from "../../assets/pics/lime.jpg";
import snakeGourdImg from "../../assets/pics/snake-gourd.jpg";
import potatoLocalImg from "../../assets/pics/local potatoes.jpg";
import potatoImportedImg from "../../assets/pics/imported_potatoes.jpg";
import defaultImg from "../../assets/hero.png";

/* constants */
const VEGETABLES = [
  "Tomato",
  "Carrot",
  "Green Chilli",
  "Lime",
  "Snake Gourd",
  "Potato (Local)",
  "Potato (Imported)",
  "Big Onion (Local)",
  "Big Onion (Imported)",
  "Red Onion (Imported)",
];

const MARKETS = ["All", "Pettah", "Narahenpita"];

const VEG_IMAGE_MAP = {
  Tomato: tomatoImg,
  Carrot: carrotImg,
  "Green Chilli": chilliImg,
  Lime: limeImg,
  "Snake Gourd": snakeGourdImg,
  "Potato (Local)": potatoLocalImg,
  "Potato (Imported)": potatoImportedImg,
  "Big Onion (Local)": onionImg,
  "Big Onion (Imported)": onionImg,
  "Red Onion (Imported)": onionImg,
};

const getVegImage = (veg) =>
  VEG_IMAGE_MAP[veg] || defaultImg;

export default function CommonDashboard() {
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);

  const [selectedVeg, setSelectedVeg] = useState(VEGETABLES[0]);
  const [selectedMarket, setSelectedMarket] = useState("All");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "stocks"),
      (snap) => {
        setStocks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setError("Unable to load stock listings.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const chartData = useMemo(() => {
    const filtered = stocks.filter(
      (s) =>
        s.vegetable === selectedVeg &&
        (selectedMarket === "All" || s.market === selectedMarket)
    );

    if (!filtered.length) return { labels: [], datasets: [] };

    return {
      labels: filtered.map((_, i) => `#${i + 1}`),
      datasets: [{ data: filtered.map((s) => s.price), tension: 0.35 }],
    };
  }, [stocks, selectedVeg, selectedMarket]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="dashboard-container buyer-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Markets Overview</h1>
          <p className="dashboard-subtitle">
            Live stock availability and prices
          </p>
        </div>
        <button className="btn secondary" onClick={() => navigate("/")}>
          ← Home
        </button>
      </header>

      {/* KPI */}
      <div className="buyer-stats">
        <div className="buyer-stat-card liquid-glass">
          <h3>{stocks.length}</h3>
          <p>Active Listings</p>
        </div>
        <div className="buyer-stat-card liquid-glass">
          <h3>{new Set(stocks.map((s) => s.vegetable)).size}</h3>
          <p>Vegetables</p>
        </div>
        <div className="buyer-stat-card liquid-glass">
          <h3>{new Set(stocks.map((s) => s.market)).size}</h3>
          <p>Markets</p>
        </div>
      </div>

      {/* CHART */}
      <div className="price-chart liquid-glass">
        <div className="price-chart-header">
          <h3>Live Prices</h3>
          <div className="price-chart-controls">
            <select value={selectedVeg} onChange={(e) => setSelectedVeg(e.target.value)}>
              {VEGETABLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)}>
              {MARKETS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="price-chart-canvas">
          {chartData.datasets.length ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p className="buyer-empty">No price data</p>
          )}
        </div>
      </div>

      {/* STOCK GRID */}
      <div className="stock-grid">
        {loading && <p>Loading…</p>}
        {!loading && error && <p className="buyer-empty">{error}</p>}

        {!loading &&
          !error &&
          stocks.map((s) => (
            <div key={s.id} className="stock-card liquid-glass">
              <div className="stock-image">
                <img src={getVegImage(s.vegetable)} alt={s.vegetable} />
              </div>

              <div className="stock-card-body">
                <div className="stock-card-header">
                  <h3>{s.vegetable}</h3>
                  <span className="stock-price">Rs. {s.price}/kg</span>
                </div>

                <div className="stock-meta">
                  <p>{s.market}</p>
                  <p>{s.quantity} kg</p>
                </div>

                <div className="stock-actions">
                  <button
                    className="btn primary"
                    onClick={() => setSelectedStock(s)}
                  >
                    Contact Farmer
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL */}
      {selectedStock && (
        <div className="buyer-modal-overlay" onClick={() => setSelectedStock(null)}>
          <div className="buyer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedStock.vegetable}</h3>
            <p><strong>Market:</strong> {selectedStock.market}</p>
            <p><strong>Phone:</strong> {selectedStock.phone || "Not available"}</p>
            <button className="btn" onClick={() => setSelectedStock(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
