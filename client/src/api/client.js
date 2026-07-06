import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach the JWT (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pixshare_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn a stored image path into a full URL (uploads are served by the API).
export function resolveImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}

// Normalise API error messages for display.
export function apiError(err, fallback = "Something went wrong.") {
  return err?.response?.data?.error || fallback;
}
