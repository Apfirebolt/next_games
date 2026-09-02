import httpClient from "../../plugins/interceptor";
import { toast } from "react-toastify";

// Register user
const register = async (userData) => {
  try {
    const response = await httpClient.post("register", userData);

    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      toast.success("Registered successfully");
    }
    return response.data;
  } catch (err) {
    let errorMessage = "Something went wrong";
    if (err.response.status === 401) {
      errorMessage = "Unauthorized access, please login again.";
    }
    if (err.response.status === 400) {
      errorMessage = err.response.data.detail;
    }
    toast.error(errorMessage);
  }
};

// Login user
const login = async (userData) => {
  try {
    const response = await httpClient.post("login", userData);

    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      toast.success("Logged in successfully");
    }
    return response.data;
  } catch (err) {
    let errorMessage = "Something went wrong";
    if (err.response.status === 400) {
      errorMessage = err.response.data.detail;
    }
    if (err.response.status === 404) {
      errorMessage = err.response.data.detail;
    }
    toast.error(errorMessage);
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem("user")
};

// update user profile details put request 'users/id'
const updateProfile = async (userData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await httpClient.put(`users/${userData.id}`, userData, config);
    if (response.status === 200) {
      toast.success("Profile updated successfully");
      return response.data;
    }
  } catch (err) {
    let errorMessage = "Something went wrong";
    if (err.response.status === 401) {
      errorMessage = "Unauthorized access, please login again.";
      logout();
    }
    toast.error(errorMessage);
  }
}

const authService = {
  register,
  logout,
  login,
  updateProfile
};

export default authService;