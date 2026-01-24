import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

/* styles – will be refactored after */
import "../../styles/pages/prediction-dashboard.css";


/* =========================
   Chart.js setup
========================= */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

/* =========================
   API config
========================= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://farm2market.org";

/* =========================
   UX helpers
========================= */
const STATUS_MESSAGES = [
  "Establishing secure connection",
  "Routing request",
  "Loading model",
  "Running forecast",
  "Finalizing results",
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

/* =========================
   Component
========================= */
export default function PredictionDashboard() {
  const [searchParams] = useSearchParams();
  const abortRef = useRef(null);
  const statusTimerRef = useRef(null);

  const [models, setModels] = useState([]);
  const [veg, setVeg] = useState(searchParams.get("veg") || "");
  const [market, setMarket] = useState(searchParams.get("market") || "");
  const [forecast, setForecast] = useState(null);

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(addDaysISO(30));

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  /* =========================
     Load models (once)
  ========================= */
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`${API_BASE}/models`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Model registry unavailable");
        return r.json();
      })
      .then((d) => setModels(d.models || []))
      .catch(() => {
        setError("Unable to load prediction models.");
      });

    return () => controller.abort();
  }, []);

  /* =========================
     Parse models
  ========================= */
  const parsed = useMemo(() => {
    return models.map((m) => {
      const parts = m.split("_");
      const market = parts.pop();
      const veg = parts.join("_");
      return { veg, market };
    });
  }, [models]);

  const vegetables = useMemo(
    () => [...new Set(parsed.map((p) => p.veg))],
    [parsed]
  );
  const markets = useMemo(
    () => [...new Set(parsed.map((p) => p.market))],
    [parsed]
  );

  /* =========================
     Prediction runner
  ========================= */
  const runPrediction = async () => {
    if (!veg || !market || loading) return;

    setForecast(null);
    setError("");
    setLoading(true);
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    let idx = 0;
    statusTimerRef.current = setInterval(() => {
      setStatus(STATUS_MESSAGES[idx] || "");
      setProgress((p) => Math.min(p + 100 / STATUS_MESSAGES.length, 95));
      idx++;
    }, 700);

    try {
      const params = new URLSearchParams({
        veg,
        market,
        start: startDate,
        end: endDate,
      });

      const res = await fetch(
        `${API_BASE}/predict?${params.toString()}`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setForecast(data);
    } catch {
      setError("Prediction service is temporarily unavailable.");
    } finally {
      clearInterval(statusTimerRef.current);
      setLoading(false);
      setProgress(0);
    }
  };

  /* =========================
     Chart data
  ========================= */
  const chartData = useMemo(() => {
    if (!forecast?.predictions) return null;

    return {
      labels: forecast.predictions.map((p) =>
        new Date(p.ds).toLocaleDateString()
      ),
      datasets: [
        {
          label: "Predicted Price",
          data: forecast.predictions.map((p) => p.yhat),
          borderColor: "#22c55e",
          borderWidth: 3,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: "Upper Bound",
          data: forecast.predictions.map((p) => p.yhat_upper),
          borderWidth: 0,
          pointRadius: 0,
          fill: "-1",
          backgroundColor: "rgba(34,197,94,0.18)",
        },
        {
          label: "Lower Bound",
          data: forecast.predictions.map((p) => p.yhat_lower),
          borderWidth: 0,
          pointRadius: 0,
          fill: true,
          backgroundColor: "rgba(34,197,94,0.18)",
        },
      ],
    };
  }, [forecast]);

  /* =========================
     Cleanup on unmount
  ========================= */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearInterval(statusTimerRef.current);
    };
  }, []);

  /* =========================
     Render
  ========================= */
  return (
    <div className="dashboard-container prediction-dashboard">

      <h1 className="dashboard-title">Market Predictions</h1>
      <p className="dashboard-subtitle">AI-powered price forecasts</p>

      <div className="controls-card liquid-glass">
        <select value={veg} onChange={(e) => setVeg(e.target.value)}>
          <option value="">Select vegetable</option>
          {vegetables.map((v) => (
            <option key={v} value={v}>
              {v.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select value={market} onChange={(e) => setMarket(e.target.value)}>
          <option value="">Select market</option>
          {markets.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <button className="predict-btn" onClick={runPrediction}>
          Run forecast
        </button>
      </div>

      <div className="chart-card liquid-glass">
        {!forecast && !loading && !error && (
          <div className="chart-placeholder">
            Select inputs and run forecast
          </div>
        )}

        {loading && (
          <div className="loading-box">
            <div className="spinner" />
            <div className="loading-status">{status}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {chartData && !loading && !error && (
          <Line data={chartData} options={{ responsive: true }} />
        )}
      </div>
    </div>
  );
}
