import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../js/firebase";
import { useAuth } from "../../../state/authStore";
import { useNavigate } from "react-router-dom";

import "../../../styles/stock-dashboard.css";

export default function StockDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vegetable, setVegetable] = useState("");
  const [market, setMarket] = useState("");
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
      !vegetable.trim() ||
      !market.trim() ||
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

      await addDoc(collection(db, "stocks"), {
        vegetable: vegetable.trim(),
        market: market.trim(),
        quantity: qty,
        price: pr,
        farmerId: user.uid,
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard/farmer");
    } catch {
      setError("Failed to submit stock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container stock-dashboard">
      {/* ================= HEADER ================= */}
      <div className="stock-header">
        <div>
          <h1 className="dashboard-title">Submit Stock</h1>
          <p className="dashboard-subtitle">
            Add new produce to the market
          </p>
        </div>

        <button
          className="btn"
          onClick={() => navigate("/dashboard/farmer")}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* ================= FORM ================= */}
      <div className="stock-card liquid-glass">
        <form className="stock-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Vegetable</label>
            <input
              type="text"
              value={vegetable}
              onChange={(e) => setVegetable(e.target.value)}
              placeholder="e.g. Tomato"
            />
          </div>

          <div className="form-row">
            <label>Market</label>
            <input
              type="text"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              placeholder="e.g. Manning Market"
            />
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
    </div>
  );
}
