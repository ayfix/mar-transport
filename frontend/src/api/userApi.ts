import axios from "axios";
import type { LoginResponse } from "../types";

const API_URL = "http://localhost:5000/api";

// 🔹 Axios instance
export const api = axios.create({
  baseURL: API_URL,
});

// 🔹 Login
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  // FIX: Send plain password. The backend handles security/hashing.
  const res = await api.post<LoginResponse>("/user/login", {
    email,
    password,
  });

  return res.data;
};

// 🔹 Signup
export const signupUser = async (userData: {
  name: string;
  company: string;
  email: string;
  phone: string;
  password: string;
}): Promise<LoginResponse> => {
  // FIX: Send plain password.
  const res = await api.post<LoginResponse>("/user/signup", {
    ...userData,
  });

  return res.data;
};

export default api;