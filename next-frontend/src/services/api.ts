import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Add request interceptor for tokens if using JWT, or stick with Sanctum cookies
apiClient.interceptors.request.use((config) => {
  // config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;

