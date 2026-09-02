import axios from 'axios';
import Cookies from "js-cookie";

let baseURL = 'http://localhost:8000/api/';

const httpClient = axios.create({ baseURL });

// Inside httpClient.interceptors.request.use:
httpClient.interceptors.request.use((config) => {
  const storedUser = Cookies.get("user");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      const token = parsed?.access || parsed?.token;
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Failed to parse auth cookie", e);
    }
  }
  return config;
});

export default httpClient;



