import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../../js/firebase";
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
const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

export default function StockDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vegetable, setVegetable] = useState("");
  const [market, setMarket] = useState("");
  const [location, setLocation] = useState("");
  const [quality, setQuality] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");

  const [photoFiles, setPhotoFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const photoPreviewUrls = useMemo(
    () => photoFiles.map((file) => URL.createObjectURL(file)),
    [photoFiles]
  );

  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviewUrls]);

  if (!user) {
    return (
      <div className="dashboard-container stock-dashboard">
        <p>You must be logged in to submit stock.</p>
      </div>
    );
  }

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      setPhotoFiles([]);
      return;
    }

    if (files.length > MAX_PHOTOS) {
      setError(`You can upload up to ${MAX_PHOTOS} photos.`);
      event.target.value = "";
      return;
    }

    const invalidType = files.find((file) => !ALLOWED_PHOTO_TYPES.has(file.type));
    if (invalidType) {
      setError("Only JPG, PNG, and WEBP photos are allowed.");
      event.target.value = "";
      return;
    }

    const oversize = files.find((file) => file.size > MAX_PHOTO_SIZE_BYTES);
    if (oversize) {
      setError("Each photo must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setPhotoFiles(files);
  };

  const uploadStockPhotos = async () => {
    if (photoFiles.length === 0) {
      return [];
    }

    const uploadedUrls = [];
    for (const [index, file] of photoFiles.entries()) {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `stock_photos/${user.uid}/${Date.now()}-${index}-${sanitizeFileName(file.name)}.${ext}`;
      const storageRef = ref(storage, filePath);

      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      uploadedUrls.push(downloadUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError("");

    const qty = Number(quantity);
    const pr = Number(price);

    if (
      !vegetable ||
      !market ||
      !location.trim() ||
      !quality ||
      !phone.trim() ||
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

      const photoUrls = await uploadStockPhotos();

      const stockRef = await addDoc(collection(db, "stocks"), {
        vegetable,
        market,
        pickupLocation: location.trim(),
        quality,
        quantity: qty,
        price: pr,
        phone: phone.trim(),
        photoUrls,
        photoUrl: photoUrls[0] || null,
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
              <select value={vegetable} onChange={(e) => setVegetable(e.target.value)}>
                <option value="">Select vegetable</option>
                {VEGETABLES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Market</label>
              <select value={market} onChange={(e) => setMarket(e.target.value)}>
                <option value="">Select market</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>{m}</option>
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
              <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0771234567"
              />
            </div>

            <div className="form-row">
              <label>Stock Photos (optional, up to 3)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoChange}
              />
              <small className="photo-help">JPG/PNG/WEBP, max 5MB each</small>

              {photoPreviewUrls.length > 0 && (
                <div className="photo-preview-grid">
                  {photoPreviewUrls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Stock preview ${index + 1}`}
                      className="photo-preview-item"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Quality</label>
              <select value={quality} onChange={(e) => setQuality(e.target.value)}>
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
              {loading ? "Submitting..." : "Submit Stock"}
            </button>
          </form>
        </div>

        <div className="stock-info liquid-glass">
          <h3>Posting Tips</h3>
          <ul>
            <li><strong>Photos:</strong> Clear images increase buyer trust.</li>
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
