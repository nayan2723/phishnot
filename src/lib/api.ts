/**
 * Backend API base URL for ML phishing detection.
 * Set VITE_API_URL in .env for production (e.g. Render backend URL).
 * Default: http://127.0.0.1:8000 for local development.
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export const api = {
  health: () => `${API_BASE_URL}/health`,
  predict: () => `${API_BASE_URL}/predict`,
};
