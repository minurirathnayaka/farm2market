import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../js/firebase";
import { useAuth } from "../../../state/authStore";
import { useNavigate } from "react-router-dom";

import "../../../styles/stock-dashboard.css";

const VEGETABLES = [
  "Big Onion (Local)",
  "Big Onion (Imported)",
  "Red Onion (Imported)",
  "Carrot",
  "Potato (Local)",
  "Potato (Imported)",
  "Green Chilli",
  "Tomato",
  "Lime",
  "Snake Gourd",
];

const MARKETS = ["Pettah", "Narahenpita"];

export default function StockDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vegetable, setVegetable] = useState("");
  const [market, setMarket] = useState("");
  const [location, setLocation] = useState("");
  const [quality, setQuality] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="dashboard-container stock-dashboard">
        <p>You must be logged in to submit stock.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    const qty = Number(quantity);
    const pr = Number(price);

    if (
      !vegetable ||
      !market ||
      !location.trim() ||
      !quality ||
      !Number.isFinite(qty) ||
      !Number.isFinite(pr) ||
      qty <= 0 ||
      pr <= 0
    ) {
      setError("Please enter valid values for all fields.");
      return;
    }

    try {
      setLoading(true);

      const stockRef = await addDoc(collection(db, "stocks"), {
        vegetable,
        market,
        pickupLocation: location.trim(),
        quality,
        quantity: qty,
        price: pr,
        farmerId: user.uid,
        transportStatus: "available",
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "transport_requests"), {
        stockId: stockRef.id,
        vegetable,
        market,
        pickupLocation: location.trim(),
        farmerId: user.uid,
        transporterId: null,
        status: "open",
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard/farmer");
    } catch (err) {
      console.error(err);
      setError("Failed to submit stock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container stock-dashboard">
      <div className="stock-header">
        <div>
          <h1 className="dashboard-title">Submit Stock</h1>
          <p className="dashboard-subtitle">Add new produce to the market</p>
        </div>

        <button className="btn" onClick={() => navigate("/dashboard/farmer")}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="stock-content">
        <div className="stock-card liquid-glass">
          <form className="stock-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Vegetable</label>
              <select
                value={vegetable}
                onChange={(e) => setVegetable(e.target.value)}
              >
                <option value="">Select vegetable</option>
                {VEGETABLES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Market</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
              >
                <option value="">Select market</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Pickup Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Farm gate, Kurunegala"
              />
            </div>

            <div className="form-row">
              <label>Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="">Select quality</option>
                <option value="good">Good</option>
                <option value="bad">Bad</option>
              </select>
            </div>

            <div className="form-row">
              <label>Quantity (kg)</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Price (LKR per kg)</label>
              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Stock"}
            </button>
          </form>
        </div>

        <div className="stock-info liquid-glass">
          <h3>Posting Tips</h3>
          <ul>
            <li><strong>Pricing:</strong> Competitive prices sell faster.</li>
            <li><strong>Quality:</strong> Be honest to avoid disputes.</li>
            <li><strong>Pickup:</strong> Clear locations reduce delays.</li>
            <li><strong>Market:</strong> Pettah and Narahenpita move fast.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
