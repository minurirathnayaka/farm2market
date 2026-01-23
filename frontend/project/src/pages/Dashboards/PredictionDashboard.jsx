import { useEffect, useMemo, useState } from "react";
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
import "../../styles/selectors.css";

import "../../styles/layout.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const MODELS_URL = "https://farm2market.org/models";
const PREDICT_URL = "https://farm2market.org/predict";

const STATUS_MESSAGES = [
  "Establishing secure edge connection",
  "Request routed through CDN",
  "Reverse proxy handshake successful",
  "Model artifact located on compute node",
  "Initializing forecasting pipeline",
  "Evaluating seasonal components",
  "Generating confidence intervals",
  "Finalizing response payload",
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

export default function PredictionDashboard() {
  const [searchParams] = useSearchParams();

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

  useEffect(() => {
    fetch(MODELS_URL)
      .then((r) => r.json())
      .then((d) => setModels(d.models || []));
  }, []);

  const parsed = useMemo(() => {
    return models.map((m) => {
      const parts = m.split("_");
      const market = parts.pop();
      const veg = parts.join("_");
      return { veg, market };
    });
  }, [models]);

  const vegetables = [...new Set(parsed.map((p) => p.veg))];
  const markets = [...new Set(parsed.map((p) => p.market))];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const fetchWithRetry = async (url, attempts = 2) => {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        if (i === attempts - 1) throw new Error();
        await sleep(800);
      }
    }
  };

  const runPrediction = async () => {
    if (!veg || !market) return;

    setForecast(null);
    setError("");
    setLoading(true);
    setProgress(0);

    const totalTime = 4000;
    const stepTime = totalTime / STATUS_MESSAGES.length;
    let idx = 0;

    const statusTimer = setInterval(() => {
      setStatus(STATUS_MESSAGES[idx]);
      setProgress((p) =>
        Math.min(p + 100 / STATUS_MESSAGES.length, 96)
      );
      idx++;
      if (idx >= STATUS_MESSAGES.length) clearInterval(statusTimer);
    }, stepTime);

    try {
      const data = await fetchWithRetry(
        `${PREDICT_URL}?veg=${veg}&market=${market}&start=${startDate}&end=${endDate}`,
        2
      );

      await sleep(totalTime);
      setForecast(data);
    } catch {
      setError("Prediction service is temporarily unavailable.");
    } finally {
      setLoading(false);
      setProgress(0);
      clearInterval(statusTimer);
    }
  };

  const chartData = useMemo(() => {
    if (!forecast) return null;

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
          pointRadius: 4,
        },
        {
          label: "Confidence Range",
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

  return (
    <div className="dashboard-container">
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
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button className="predict-btn" onClick={runPrediction}>
          Filter
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
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {chartData && !loading && !error && (
          <div className="chart-wrapper">
            <Line data={chartData} options={{ responsive: true }} />
          </div>
        )}
      </div>
    </div>
  );
}
