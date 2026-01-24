const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://18.139.192.254"; // fallback EC2 IP

const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_RETRIES = 2;

/**
 * Core fetch wrapper with:
 * - timeout
 * - retries
 * - safe JSON parsing
 */
async function request(path, options = {}, retries = DEFAULT_RETRIES) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text}`);
    }

    return await res.json();
  } catch (err) {
    if (retries > 0) {
      return request(path, options, retries - 1);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/* =========================
   API METHODS
========================= */

export function fetchModels() {
  return request("/models");
}

export function fetchPrediction({ veg, market, start, end }) {
  const params = new URLSearchParams({
    veg,
    market,
    start,
    end,
  });

  return request(`/predict?${params.toString()}`);
}
