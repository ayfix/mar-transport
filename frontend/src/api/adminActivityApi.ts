import axios from 'axios';

// Adjust this if your port is different
const API_URL = 'http://localhost:5000/api/admin'; 

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchActivityLogs = async () => {
  try {
    const response = await axios.get(`${API_URL}/logs`, getAuthHeader());
    return response.data; // Assumes backend returns array of logs
  } catch (error) {
    console.error("Fetch activity logs failed", error);
    return [];
  }
};