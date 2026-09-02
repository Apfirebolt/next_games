import Cookies from "js-cookie";
import httpClient from "../../plugins/interceptor";
import { toast } from "react-toastify";

const COOKIE_NAME = "user";
const COOKIE_OPTIONS = {
  expires: 7, // days
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  path: "/",
};

const handleServiceError = (err) => {
  let errorMessage = "Something went wrong";
  if (err.response) {
    const { status, data } = err.response;
    if (status === 401) {
      errorMessage = "Unauthorized access, please login again.";
      logout();
    } else if (data?.detail) {
      errorMessage = data.detail;
    } else if (data?.message) {
      errorMessage = data.message;
    }
  }
  toast.error(errorMessage);
  throw err;
};

const register = async (userData) => {
  try {
    const response = await httpClient.post("register", userData);
    if (response.data) {
      Cookies.set(COOKIE_NAME, JSON.stringify(response.data), COOKIE_OPTIONS);
      toast.success("Registered successfully");
    }
    return response.data;
  } catch (err) {
    handleServiceError(err);
  }
};

const login = async (userData) => {
  try {
    const response = await httpClient.post("login", userData);
    if (response.data) {
      Cookies.set(COOKIE_NAME, JSON.stringify(response.data), COOKIE_OPTIONS);
      toast.success("Logged in successfully");
    }
    return response.data;
  } catch (err) {
    handleServiceError(err);
  }
};

const logout = () => {
  Cookies.remove(COOKIE_NAME, { path: "/" });
};

const updateProfile = async (userData) => {
  try {
    const response = await httpClient.put(`users/${userData.id}`, userData);
    if (response.data) {
      const stored = Cookies.get(COOKIE_NAME);
      const currentUser = stored ? JSON.parse(stored) : {};
      Cookies.set(
        COOKIE_NAME,
        JSON.stringify({ ...currentUser, ...response.data }),
        COOKIE_OPTIONS
      );
      toast.success("Profile updated successfully");
      return response.data;
    }
  } catch (err) {
    handleServiceError(err);
  }
};

const authService = { register, login, logout, updateProfile };
export default authService;