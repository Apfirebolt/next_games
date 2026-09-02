import axios from 'axios';
import Cookies from "js-cookie";

// for dev
// let baseURL = 'http://localhost:3000/api/';

// for prod
let baseURL = 'https://www.codelean.in/api/';

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



