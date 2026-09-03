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
    } else if (data?.error) {
      errorMessage = data.error;
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
    // Hits /api/profile with Bearer token supplied by httpClient interceptor
    const response = await httpClient.put("profile", userData);
    if (response.data) {
      const stored = Cookies.get(COOKIE_NAME);
      const currentUser = stored ? JSON.parse(stored) : {};

      // Merge updated profile attributes while preserving existing access token & session
      const updatedSession = {
        ...currentUser,
        ...response.data,
        access: currentUser.access,
      };

      Cookies.set(COOKIE_NAME, JSON.stringify(updatedSession), COOKIE_OPTIONS);
      toast.success("Profile updated successfully");
      return response.data;
    }
  } catch (err) {
    handleServiceError(err);
  }
};

const changePassword = async (passwords) => {
  try {
    // Hits /api/change-password with { currentPassword, newPassword }
    const response = await httpClient.put("change-password", passwords);
    if (response.data) {
      toast.success(response.data.message || "Password updated successfully");
    }
    return response.data;
  } catch (err) {
    handleServiceError(err);
  }
};

const authService = {
  register,
  login,
  logout,
  updateProfile,
  changePassword,
};

export default authService;