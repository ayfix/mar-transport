import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

/* Attach token automatically */
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

/* CREATE SHIPMENT */
export const createShipment = async (shipmentData: any) => {
  const response = await API.post("/client/shipments", shipmentData);
  return response.data;
};

/* TRACK SHIPMENT (PUBLIC) */
export const trackShipment = async (trackingId: string) => {
  const response = await API.get(`/client/shipments/track/${trackingId}`);
  return response.data;
};

export default API;
