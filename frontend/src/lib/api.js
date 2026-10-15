import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  ),
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mf_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      localStorage.getItem("mf_access_token")
    ) {
      localStorage.removeItem("mf_access_token");
      localStorage.removeItem("mf_user");
      window.dispatchEvent(new Event("mf:session-expired"));
    }
    return Promise.reject(error);
  },
);

export const getApiError = (
  error,
  fallback = "Something went wrong. Please try again.",
) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem("mf_user") || "null");
  } catch {
    return null;
  }
};
export const saveSession = (data) => {
  if (data?.access_token)
    localStorage.setItem("mf_access_token", data.access_token);
  if (data?.user) localStorage.setItem("mf_user", JSON.stringify(data.user));
};
export const clearSession = () => {
  localStorage.removeItem("mf_access_token");
  localStorage.removeItem("mf_user");
};
export default api;
