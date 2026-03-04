const REQUIRED_ENV_VARS = [
  "VITE_API_BASE_URL",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const readEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
};

const missingVars = REQUIRED_ENV_VARS.filter((key) => !readEnv(key));
if (missingVars.length > 0) {
  throw new Error(
    `[Config] Missing required Vite env vars: ${missingVars.join(", ")}`
  );
}

const normalizeUrl = (value, key) => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    throw new Error(`[Config] ${key} cannot be empty`);
  }

  if (trimmed.startsWith("/")) {
    return trimmed.replace(/\/+$/, "") || "/";
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    throw new Error(
      `[Config] ${key} must be an absolute URL (https://...) or a path (/)`
    );
  }
};

const API_BASE_URL = normalizeUrl(readEnv("VITE_API_BASE_URL"), "VITE_API_BASE_URL");
const CHAT_API_URL = normalizeUrl(
  readEnv("VITE_CHAT_API_URL") || `${API_BASE_URL}/chat`,
  "VITE_CHAT_API_URL"
);

export const APP_ENV = {
  API_BASE_URL,
  CHAT_API_URL,
  FIREBASE_API_KEY: readEnv("VITE_FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: readEnv("VITE_FIREBASE_PROJECT_ID"),
  FIREBASE_APP_ID: readEnv("VITE_FIREBASE_APP_ID"),
  FIREBASE_STORAGE_BUCKET:
    readEnv("VITE_FIREBASE_STORAGE_BUCKET") ||
    `${readEnv("VITE_FIREBASE_PROJECT_ID")}.appspot.com`,
};
