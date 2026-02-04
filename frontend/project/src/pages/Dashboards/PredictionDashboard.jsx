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

import "../../styles/pages/prediction-dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const STATUS_MESSAGES = [
  "Establishing secure connection",
  "Routing request",
  "Loading model",
  "Running forecast",
  "Finalizing results",
];

const LOADER_MIN = 6000;
const LOADER_MAX_EXTRA = 2000;

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

const MAX_MODEL_RETRIES = 5;
const retryDelay = (attempt) =>
  new Promise((res) => setTimeout(res, 800 * attempt));

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

  /* ================= LOAD MODELS ================= */
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;

    const loadModels = async () => {
      for (let attempt = 1; attempt <= MAX_MODEL_RETRIES; attempt++) {
        try {
          const res = await fetch(`${API_BASE}/models`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error();

          const data = await res.json();
          if (!cancelled) {
            setModels(data.models || []);
            setError("");
          }
          return;
        } catch {
          if (attempt === MAX_MODEL_RETRIES && !cancelled) {
            setError(
              "Price prediction service is currently offline. This is expected during development hours."
            );
          } else {
            await retryDelay(attempt);
          }
        }
      }
    };

    loadModels();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  /* ================= PARSE MODELS ================= */
  const parsed = useMemo(
    () =>
      models.map((m) => {
        const parts = m.split("_");
        const market = parts.pop();
        const veg = parts.join("_");
        return { veg, market };
      }),
    [models]
  );

  const vegetables = useMemo(
    () => [...new Set(parsed.map((p) => p.veg))],
    [parsed]
  );

  const markets = useMemo(
    () => [...new Set(parsed.map((p) => p.market))],
    [parsed]
  );

  /* ================= RUN PREDICTION ================= */
  const runPrediction = async () => {
    if (!veg || !market || loading) return;

    setForecast(null);
    setError("");
    setLoading(true);
    setProgress(0);
    setStatus("");

    const controller = new AbortController();
    abortRef.current = controller;

    const startTime = Date.now();
    const totalDuration = LOADER_MIN + Math.random() * LOADER_MAX_EXTRA;
    const stepDuration = totalDuration / STATUS_MESSAGES.length;

    let idx = 0;
    statusTimerRef.current = setInterval(() => {
      setStatus(STATUS_MESSAGES[idx]);
      setProgress(Math.min(((idx + 1) / STATUS_MESSAGES.length) * 95, 95));
      idx++;
      if (idx >= STATUS_MESSAGES.length) {
        clearInterval(statusTimerRef.current);
      }
    }, stepDuration);

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
      setError("Unable to generate forecast right now.");
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalDuration - elapsed);

      setTimeout(() => {
        setProgress(100);
        setTimeout(() => setLoading(false), 700);
      }, remaining);
    }
  };

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearInterval(statusTimerRef.current);
    };
  }, []);

  /* ================= CHART DATA ================= */
  const chartData = useMemo(() => {
    if (!forecast?.predictions) return null;
    return {
      labels: forecast.predictions.map((p) =>
        new Date(p.ds).toLocaleDateString()
      ),
      datasets: [
        {
          label: "Predicted Price per Kg",
          data: forecast.predictions.map((p) => p.yhat),
          borderColor: "#22c55e",
          borderWidth: 4,
          tension: 0.35,
          pointRadius: 5,
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

  const latest = forecast?.predictions?.slice(-1)[0];

  /* ================= RENDER ================= */
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
        {latest && !loading && !error && (
          <div className="price-kpi">
            <div className="price-label">Predicted Price per Kg</div>
            <div className="price-value">
              Rs. {Math.round(latest.yhat).toLocaleString()}
            </div>
            <div className="price-range">
              Range: {Math.round(latest.yhat_lower)} – {Math.round(latest.yhat_upper)}
            </div>
          </div>
        )}

        {!forecast && !loading && !error && (
          <div className="chart-placeholder">Select inputs and run forecast</div>
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
          <Line
  data={chartData}
  options={{
    responsive: true,
    plugins: {
      legend: {
        labels: {
          font: {
            size: 14,
            weight: "600",
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
          },
        },
        title: {
          display: true,
          text: "Date",
          font: {
            size: 16,
            weight: "600",
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 14,
          },
        },
        title: {
          display: true,
          text: "Price",
          font: {
            size: 16,
            weight: "600",
          },
        },
      },
    },
  }}
/>

        )}
      </div>
    </div>
  );
}
