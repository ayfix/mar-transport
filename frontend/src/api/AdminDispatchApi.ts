import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchPendingDispatches = async () => {
  // Matches: router.get('/admin/dispatches/pending', ...)
  const response = await axios.get(`${API_URL}/dispatches/pending`, getAuthHeader());
  return response.data.shipments;
};

export const fetchActiveDispatches = async () => {
  // Matches: router.get('/admin/dispatches/active', ...)
  const response = await axios.get(`${API_URL}/dispatches/active`, getAuthHeader());
  return response.data.dispatches;
};

export const assignFleet = async (shipmentId: string, truckData: any) => {
  // Matches: router.put('/admin/shipments/:id/assign', ...)
  const response = await axios.put(`${API_URL}/shipments/${shipmentId}/assign`, truckData, getAuthHeader());
  return response.data.shipment;
};

export const updateDispatchStatus = async (shipmentId: string, status: string) => {
  // Matches: router.put('/admin/shipments/:id/status', ...)
  const response = await axios.put(`${API_URL}/shipments/${shipmentId}/status`, { status }, getAuthHeader());
  return response.data.shipment;
};