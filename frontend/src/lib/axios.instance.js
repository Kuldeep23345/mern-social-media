
import axios from "axios"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const instance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  // timeout: 1000,  
  headers: {
    "Content-Type": "application/json", 
  },
  withCredentials: true,
});

// Global 401 handler: if token is invalid (e.g., user deleted), clear persisted state and redirect to login.
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem("persist:root");
      } catch (e) {
        // ignore storage errors
      }
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
