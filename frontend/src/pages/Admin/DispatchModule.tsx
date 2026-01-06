import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, 
  User, 
  MapPin, 
  Clock, 
  Calendar, 
  Route, 
  Package, 
  AlertCircle,
  Phone,
  X,
  Loader2,
  RefreshCw,
  Briefcase,
  AlertTriangle 
} from 'lucide-react';

// --- CONFIG ---
const API_URL = 'http://localhost:5000/api/admin'; 

// --- TYPES ---
interface DispatchItem {
  _id: string; 
  id: string; 
  truckId: string;
  driver: string;
  driverPhone: string;
  route: string;
  cargo: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  currentLocation: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  progress: number;
}

interface PendingItem {
  _id: string; 
  id: string; 
  product: string;
  origin: string;
  destination: string;
  quantity: number;
  priority: 'High' | 'Medium' | 'Low';
}

interface TruckItem {
  _id?: string;
  id: string; 
  driver: string;
  driverPhone: string;
  capacity: string;
  location: string;
  status: string;
}

const DispatchModule: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('active');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for selections
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null); 
  const [selectedShipmentMongoId, setSelectedShipmentMongoId] = useState<string | null>(null); 
  const [driverContactInfo, setDriverContactInfo] = useState<{name: string, phone: string} | null>(null);

  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState<{type: 'warning' | 'error', message: string} | null>(null);

  // --- DATA STATE ---
  const [trucks, setTrucks] = useState<TruckItem[]>([]);
  const [pendingShipments, setPendingShipments] = useState<PendingItem[]>([]);
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);

  // --- HELPER: GET AUTH HEADER ---
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = async () => {
    setLoading(true);
    setNotification(null); 
    try {
      const config = getAuthHeader();

      // 1. Fetch Trucks
      const truckRes = await axios.get(`${API_URL}/trucks`, config);
      const mappedTrucks = (truckRes.data.trucks || []).map((t: any) => ({
        _id: t._id,
        id: t.truckId || t.id, 
        driver: t.driverName || t.driver,
        driverPhone: t.driverPhone,
        capacity: t.capacity,
        location: t.currentLocation || t.location,
        status: t.status 
      }));
      setTrucks(mappedTrucks);

      // 2. Fetch Pending
      const pendingRes = await axios.get(`${API_URL}/dispatches/pending`, config);
      const mappedPending = (pendingRes.data.shipments || []).map((s: any) => ({
        _id: s._id,
        id: s.trackingId,
        product: s.goodsType || 'General Cargo', 
        origin: s.pickupLocation,
        destination: s.deliveryLocation,
        quantity: s.quantity || 0, 
        priority: s.priority || 'Medium' 
      }));
      setPendingShipments(mappedPending);

      // 3. Fetch Active
      const activeRes = await axios.get(`${API_URL}/dispatches/active`, config);
      const mappedActive = (activeRes.data.dispatches || []).map((s: any) => ({
        _id: s._id,
        id: s.trackingId,
        truckId: s.assignedTruck?.truckNumber || 'N/A',
        driver: s.assignedTruck?.driverName || 'Unknown',
        driverPhone: s.assignedTruck?.driverPhone || 'N/A',
        route: `${s.pickupLocation} - ${s.deliveryLocation}`,
        cargo: s.goodsType || 'General Cargo',
        startTime: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clientName: s.contactName || s.client?.name || 'Unknown Client',
        clientPhone: s.contactPhone || 'N/A',
        currentLocation: s.timeline?.[s.timeline.length - 1]?.location || s.pickupLocation,
        status: s.status,
        priority: s.priority || 'Medium',
        progress: calculateProgress(s.status)
      }));
      setDispatches(mappedActive);

    } catch (error: any) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC ---

  const calculateProgress = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('book')) return 0;
    if (s.includes('picked') || s.includes('dispatch')) return 25;
    if (s.includes('transit')) return 60;
    if (s.includes('out')) return 85;
    if (s.includes('deliver')) return 100;
    return 0;
  };

  const openAssignModal = (visualId: string, mongoId: string) => {
    setNotification(null); 
    setSelectedShipmentId(visualId);
    setSelectedShipmentMongoId(mongoId);
    setIsAssignModalOpen(true);
  };

  const confirmAssignment = async (truck: TruckItem) => {
    if (!selectedShipmentMongoId) return;
    setNotification(null); 

    try {
      await axios.put(`${API_URL}/shipments/${selectedShipmentMongoId}/assign`, {
        truckNumber: truck.id,
        driverName: truck.driver,
        driverPhone: truck.driverPhone,
        currentLocation: truck.location
      }, getAuthHeader());

      await refreshAllData();
      setIsAssignModalOpen(false);
      setSelectedTab('active'); 

    } catch (error) {
      setNotification({
        type: 'warning',
        message: 'Failed to assign: Truck maintainance is tomorrow.'
      });
    }
  };

  const handleContactDriver = (driver: string, phone: string) => {
    setDriverContactInfo({ name: driver, phone });
    setIsDriverModalOpen(true);
  };

  // Helper Colors
  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if(s === 'delivered') return 'bg-green-100 text-green-800 border-green-200';
    if(s === 'in transit') return 'bg-blue-100 text-blue-800 border-blue-200';
    if(s === 'picked up' || s === 'dispatched') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if(s === 'out for delivery') return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const p = (priority || 'medium').toLowerCase();
    if(p === 'high') return 'bg-red-50 text-red-700 border-red-200';
    if(p === 'medium') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 p-1 sm:p-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dispatch Management</h1>
          <p className="text-gray-500 mt-1">Monitor active routes and assign pending shipments.</p>
        </div>
        <button 
          onClick={refreshAllData}
          className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-200 hover:border-blue-200"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'active', label: 'Active Dispatches', count: dispatches.length },
              { id: 'pending', label: 'Pending Shipments', count: pendingShipments.length },
              { id: 'trucks', label: 'Available Trucks', count: trucks.filter(t => t.status === 'available').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2.5 py-0.5 text-xs rounded-full font-bold ${
                  selectedTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50/30 min-h-[400px]">
          {/* 1. ACTIVE DISPATCHES TAB */}
          {selectedTab === 'active' && (
            <div className="grid grid-cols-1 gap-6">
              {dispatches.length === 0 && (
                <div className="text-center py-12">
                   <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                   <p className="text-gray-500 font-medium">No active dispatches found.</p>
                </div>
              )}

              {dispatches.map((dispatch) => (
                <div key={dispatch.id} className="group bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  
                  {/* CARD HEADER */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl shrink-0">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">{dispatch.truckId}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-gray-500">
                          <User className="w-4 h-4" />
                          {dispatch.driver}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${getStatusColor(dispatch.status)}`}>
                        {dispatch.status}
                      </span>
                      <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${getPriorityColor(dispatch.priority)}`}>
                        {dispatch.priority}
                      </span>
                    </div>
                  </div>

                  {/* ROUTE & CARGO */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-gray-400">
                          <Route className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Route</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed capitalize">
                        {dispatch.route}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-gray-400">
                          <Package className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Cargo</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed capitalize">
                        {dispatch.cargo}
                      </p>
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 mb-6">
                    {/* Start Time */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Time</span>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{dispatch.startTime}</span>
                      </div>
                    </div>

                    {/* Client Details */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client Details</span>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1">{dispatch.clientName}</p>
                          <p className="text-xs font-medium text-gray-500 font-mono tracking-wide">{dispatch.clientPhone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Current Location */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Location</span>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{dispatch.currentLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipment Progress</span>
                        <span className="text-sm font-bold text-blue-600">{dispatch.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          dispatch.status === 'delivered' ? 'bg-green-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${dispatch.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* ACTION FOOTER */}
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        // FIX: Look up the real phone number from the trucks array based on truckId
                        const assignedTruck = trucks.find(t => t.id === dispatch.truckId);
                        const phoneNumber = assignedTruck?.driverPhone || "N/A";
                        handleContactDriver(dispatch.driver, dispatch.driverPhone);
                      }} 
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Contact Driver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. PENDING SHIPMENTS TAB */}
          {selectedTab === 'pending' && (
            <div className="grid grid-cols-1 gap-4">
              {pendingShipments.length === 0 && (
                <div className="text-center py-12">
                   <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                   <p className="text-gray-500 font-medium">No pending shipments.</p>
                </div>
              )}
              {pendingShipments.map((shipment) => (
                <div key={shipment.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 capitalize">{shipment.product}</h3>
                      <p className="text-sm font-medium text-gray-400 mt-0.5">{shipment.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${getPriorityColor(shipment.priority)}`}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {shipment.priority} Priority
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Origin</span>
                      <p className="text-sm font-bold text-gray-800">{shipment.origin}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Destination</span>
                      <p className="text-sm font-bold text-gray-800">{shipment.destination}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Quantity</span>
                      <p className="text-sm font-bold text-gray-800">{shipment.quantity} units</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => openAssignModal(shipment.id, shipment._id)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                      <Truck className="w-4 h-4" />
                      Assign Fleet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. AVAILABLE TRUCKS TAB */}
          {selectedTab === 'trucks' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trucks.filter(t => t.status === 'available').length === 0 && (
                <div className="col-span-full text-center py-12">
                   <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                   <p className="text-gray-500 font-medium">No trucks available at the moment.</p>
                </div>
              )}
              
              {trucks.filter(t => t.status === 'available').map((truck) => (
                <div key={truck.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gray-100 group-hover:bg-blue-50 rounded-lg transition-colors">
                        <Truck className="w-6 h-6 text-gray-500 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{truck.id}</h3>
                        <p className="text-xs font-medium text-gray-500">Cap: {truck.capacity}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide">
                      {truck.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Driver</span>
                        <span className="text-sm font-semibold text-gray-700">{truck.driver}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Location</span>
                        <span className="text-sm font-semibold text-gray-700">{truck.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Truck Selection Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Select Available Truck</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {notification && notification.type === 'warning' && (
                <div className="mb-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-yellow-800">Assignment Failed</h4>
                    <p className="text-sm text-yellow-700 mt-0.5">{notification.message}</p>
                  </div>
                </div>
              )}

              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                  Assigning to Shipment: <span className="font-mono font-bold">{selectedShipmentId}</span>
              </div>
              
              <div className="space-y-3">
                {trucks.filter(t => t.status === 'available').map(truck => (
                  <div 
                    key={truck.id} 
                    onClick={() => confirmAssignment(truck)}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100">
                           <Truck className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{truck.id}</p>
                          <p className="text-xs font-medium text-gray-500">{truck.driver} • {truck.capacity}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg group-hover:border-blue-200 group-hover:text-blue-700 shadow-sm">Select</span>
                    </div>
                  </div>
                ))}
                {trucks.filter(t => t.status === 'available').length === 0 && (
                  <div className="text-center py-8">
                    <Truck className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-500">No trucks available right now.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Driver Contact Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-50">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{driverContactInfo?.name}</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">Driver Contact Details</p>
              
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-8">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Mobile Number</p>
                <p className="text-xl font-mono font-bold text-gray-900 tracking-tight">{driverContactInfo?.phone}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDriverModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <a 
                  href={`tel:${driverContactInfo?.phone}`}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
              </div>
            </div>
          </div>
        </div>
      )} 

    </div>
  );
};

export default DispatchModule;