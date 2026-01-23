import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../js/firebase";
import { useAuth } from "../../state/authStore";

import "../../styles/pages.css";

const VEGETABLES = [
  "Carrot",
  "Local Big Onion",
  "Imported Big Onion",
  "Green Chilli",
  "Lime",
  "Local Potato",
  "Snake Gourd",
  "Tomato"
];

export default function TestFarmerStock() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    vegetable: "",
    quantityKg: "",
    pricePerKg: "",
    harvestDate: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "farmer_stocks"), {
        farmerId: user.uid,
        vegetable: form.vegetable,
        quantityKg: Number(form.quantityKg),
        pricePerKg: Number(form.pricePerKg),
        harvestDate: form.harvestDate,
        createdAt: serverTimestamp()
      });

      setForm({
        vegetable: "",
        quantityKg: "",
        pricePerKg: "",
        harvestDate: ""
      });

      alert("Stock added");
    } catch (err) {
      console.error(err);
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="page-hero-bg profile-hero">
    <div className="glass-page">
      <form className="glass-card" onSubmit={handleSubmit}>
        <h2>Farmer Stock Entry</h2>

        <select
          name="vegetable"
          value={form.vegetable}
          onChange={handleChange}
          required
        >
          <option value="">Select vegetable</option>
          {VEGETABLES.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <input
          type="number"
          name="quantityKg"
          placeholder="Quantity (kg)"
          value={form.quantityKg}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="pricePerKg"
          placeholder="Price per kg (LKR)"
          value={form.pricePerKg}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="harvestDate"
          value={form.harvestDate}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Stock"}
        </button>
      </form>
    </div>
  </div>
);

}
