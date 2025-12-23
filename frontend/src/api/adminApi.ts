import axios from 'axios';

// Adjust port if needed (e.g. 5000)
const API_URL = 'http://localhost:5000/api/admin'; 

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const AdminApi = {
  // ✅ YOU MUST HAVE THIS FUNCTION
  getProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`, getAuthHeader());
      return response.data; 
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to fetch profile';
    }
  },

  updateProfile: async (data: { name: string; email: string; phone: string }) => {
    try {
      const response = await axios.put(`${API_URL}/profile`, data, getAuthHeader());
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to update profile';
    }
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await axios.put(`${API_URL}/profile/password`, data, getAuthHeader());
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to update password';
    }
  },
};