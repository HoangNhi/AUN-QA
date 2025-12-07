import axios from "axios";

// Create an Axios instance
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", // Fallback to localhost if not set
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
http.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed, e.g.:
    // const token = localStorage.getItem("token");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors here (e.g., 401 Unauthorized, 500 Server Error)
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default http;
