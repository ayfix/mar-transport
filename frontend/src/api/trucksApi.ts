import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

// Helper to get the token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// --- TRUCKS API (Individual Exports) ---

export const fetchTrucks = async () => {
  const response = await axios.get(`${API_URL}/trucks`, getAuthHeader());
  // Backend returns { count: n, trucks: [...] }
  return response.data.trucks;
};

export const createTruck = async (truckData: any) => {
  const response = await axios.post(`${API_URL}/trucks`, truckData, getAuthHeader());
  // Returns { message: "...", truck: {...} }
  return response.data.truck;
};

export const updateTruck = async (mongoId: string, truckData: any) => {
  const response = await axios.put(`${API_URL}/trucks/${mongoId}`, truckData, getAuthHeader());
  return response.data.truck;
};

export const deleteTruck = async (mongoId: string) => {
  const response = await axios.delete(`${API_URL}/trucks/${mongoId}`, getAuthHeader());
  return response.data;
};