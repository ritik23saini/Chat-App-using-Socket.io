import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:8000/api" : `${import.meta.env.BACKEND_URL}/api`,
  withCredentials: true,
});
