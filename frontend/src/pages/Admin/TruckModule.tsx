import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import {
  Truck,
  User,
  Phone,
  MapPin,
  Calendar,
  Fuel,
  Search,
  Plus,
  CheckCircle,
  Wrench,
  ArrowLeft,
  Save,
  X,
  Info,
  Trash2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  MoreVertical,
  Filter,
  ChevronRight,
  AlertCircle
} from "lucide-react";

// ==========================================
// 1. CONFIGURATION & UTILITIES
// ==========================================

const API_URL = 'http://localhost:5000/api/admin';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Date Utilities
const getTodayDate = () => new Date().toISOString().split('T')[0];

const getTomorrowDate = () => {
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  return tmr.toISOString().split('T')[0];
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// ==========================================
// 2. TYPES & INTERFACES
// ==========================================

type ViewMode = "list" | "view" | "edit";
type TruckStatus = "active" | "available" | "maintenance";

interface TruckType {
  _id?: string;
  id: string; // The visual ID (e.g., TRK-001)
  driver: string;
  phone: string;
  capacity: string;
  status: TruckStatus;
  location: string;
  nextMaintenance: string; // YYYY-MM-DD
  fuel: number;
  trips: number;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ==========================================
// 3. API SERVICE LAYER
// ==========================================

const TruckService = {
  fetchAll: async () => {
    const response = await axios.get(`${API_URL}/trucks`, getAuthHeader());
    return response.data.trucks;
  },
  create: async (data: any) => {
    const response = await axios.post(`${API_URL}/trucks`, data, getAuthHeader());
    return response.data.truck;
  },
  update: async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/trucks/${id}`, data, getAuthHeader());
    return response.data.truck;
  },
  delete: async (id: string) => {
    const response = await axios.delete(`${API_URL}/trucks/${id}`, getAuthHeader());
    return response.data;
  }
};

// ==========================================
// 4. REUSABLE UI COMPONENTS
// ==========================================

// -- Status Badge --
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    available: "bg-blue-100 text-blue-700 border-blue-200",
    maintenance: "bg-red-100 text-red-700 border-red-200",
  };
  
  const icon = {
    active: <Truck className="w-3 h-3 mr-1" />,
    available: <CheckCircle className="w-3 h-3 mr-1" />,
    maintenance: <Wrench className="w-3 h-3 mr-1" />,
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border flex items-center w-fit ${(styles as any)[status] || "bg-gray-100 text-gray-700"}`}>
      {(icon as any)[status]}
      {status}
    </span>
  );
};

// -- Stat Card --
const StatCard = ({ title, value, icon: Icon, color, loading }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color.replace('text-', 'text-')}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

// -- Toast Notification Container --
const ToastContainer = ({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: number) => void }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center p-4 rounded-lg shadow-lg text-white min-w-[300px] animate-in slide-in-from-right fade-in duration-300 ${
          t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {t.type === 'success' && <CheckCircle className="w-5 h-5 mr-3" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 mr-3" />}
          {t.type === 'info' && <Info className="w-5 h-5 mr-3" />}
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="ml-4 hover:bg-white/20 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// -- [FIXED] Modal Input Component moved OUTSIDE to prevent re-render focus loss --
const ModalField = ({ label, value, onChange, type = "text", placeholder, required, min, error, suffix }: any) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input 
                type={type}
                placeholder={placeholder}
                value={value}
                min={min}
                onChange={onChange}
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all ${
                    error 
                    ? 'border-red-300 bg-red-50 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`}
            />
            {suffix && <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">{suffix}</span>}
        </div>
        {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
);

// ==========================================
// 5. MAIN COMPONENT
// ==========================================

const TruckModule: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState<ViewMode>("list");
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form State for New Truck
  const [formData, setFormData] = useState<TruckType>({
    id: "", driver: "", phone: "", capacity: "", status: "available",
    location: "", nextMaintenance: "", fuel: 50, trips: 0,
  });

  // Derived Values
  const todayDate = getTodayDate();
  const tomorrowDate = getTomorrowDate();

  // --- HELPERS: TOASTS ---
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // --- DATA NORMALIZATION (Business Logic) ---
  const normalizeTruckData = useCallback((data: any): TruckType => {
    const maintDateRaw = data.nextMaintenanceDate 
      ? data.nextMaintenanceDate.split('T')[0] 
      : (data.nextMaintenance || "");

    // *** LOGIC ENFORCEMENT: Maintenance Today ***
    let derivedStatus = data.status || "available";
    if (maintDateRaw === todayDate && derivedStatus !== 'maintenance') {
        derivedStatus = 'maintenance';
    }

    return {
      _id: data._id,
      id: data.truckId || data.id || "N/A",
      driver: data.driverName || data.driver || "Unassigned",
      phone: data.driverPhone || data.phone || "",
      capacity: data.capacity || "0 tons",
      status: derivedStatus,
      location: data.currentLocation || data.location || "Depot",
      nextMaintenance: maintDateRaw,
      fuel: data.fuelLevel ?? data.fuel ?? 50,
      trips: data.trips ?? 0
    };
  }, [todayDate]);

  // --- API CALLS ---
  const loadTrucks = useCallback(async () => {
    setLoading(true);
    try {
      const rawData = await TruckService.fetchAll();
      const cleanData = Array.isArray(rawData) ? rawData.map(normalizeTruckData) : [];
      setTrucks(cleanData);
    } catch (error) {
      console.error(error);
      addToast('error', 'Failed to load fleet data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [normalizeTruckData]);

  useEffect(() => {
    loadTrucks();
  }, [loadTrucks]);

  // --- HANDLERS ---

  const handleCreate = async () => {
    // Validation
    if (!formData.id || !formData.driver) return addToast('error', 'Please fill in required fields.');
    if (formData.phone.length !== 10) return addToast('error', 'Phone number must be 10 digits.');

    setSubmitting(true);
    try {
        let cap = formData.capacity;
        if (cap && !cap.toLowerCase().includes('tons')) cap += " tons";

        const payload = {
            truckNumber: formData.id,
            driverName: formData.driver,
            driverPhone: formData.phone,
            capacity: cap,
            status: formData.status,
            currentLocation: formData.location,
            nextMaintenanceDate: formData.nextMaintenance,
            fuelLevel: formData.fuel,
            trips: formData.trips
        };

        const response = await TruckService.create(payload);
        setTrucks(prev => [normalizeTruckData(response), ...prev]);
        addToast('success', 'New truck added to fleet successfully.');
        setShowAddModal(false);
        setFormData({ id: "", driver: "", phone: "", capacity: "", status: "available", location: "", nextMaintenance: "", fuel: 50, trips: 0 });
    } catch (error: any) {
        addToast('error', error.response?.data?.message || 'Failed to create truck.');
    } finally {
        setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTruck?._id) return;
    if (selectedTruck.phone.length !== 10) return addToast('error', 'Phone number must be 10 digits.');

    setSubmitting(true);
    try {
        let cap = selectedTruck.capacity;
        if (cap && !cap.toLowerCase().includes('tons')) cap += " tons";

        const payload = {
            driverName: selectedTruck.driver,
            driverPhone: selectedTruck.phone,
            capacity: cap,
            status: selectedTruck.status,
            currentLocation: selectedTruck.location,
            nextMaintenanceDate: selectedTruck.nextMaintenance,
            fuelLevel: selectedTruck.fuel,
            trips: selectedTruck.trips
        };

        const response = await TruckService.update(selectedTruck._id, payload);
        const updated = normalizeTruckData(response);
        
        setTrucks(prev => prev.map(t => t._id === updated._id ? updated : t));
        addToast('success', 'Truck details updated.');
        setView('list');
        setSelectedTruck(null);
    } catch (error) {
        addToast('error', 'Failed to update truck details.');
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTruck?._id) return;
    if (!window.confirm(`Are you sure you want to decommission ${selectedTruck.id}?`)) return;

    setSubmitting(true);
    try {
        await TruckService.delete(selectedTruck._id);
        setTrucks(prev => prev.filter(t => t._id !== selectedTruck._id));
        addToast('success', 'Truck deleted successfully.');
        setView('list');
        setSelectedTruck(null);
    } catch (error) {
        addToast('error', 'Failed to delete truck.');
    } finally {
        setSubmitting(false);
    }
  };

  // --- FILTERING ---
  const filteredTrucks = trucks.filter(t => {
    const matchesSearch = 
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.driver.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // 6. SUB-COMPONENTS
  // ==========================================

  const renderDashboardHeader = () => (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="text-blue-600" />
            Fleet Management
        </h1>
        <p className="text-gray-500 mt-1">Monitor vehicle status, drivers, and maintenance schedules.</p>
      </div>
      <div className="flex gap-3 w-full lg:w-auto">
        <button 
            onClick={loadTrucks} 
            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
            title="Refresh Data"
        >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 lg:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-200"
        >
            <Plus className="w-5 h-5" />
            Add Truck
        </button>
      </div>
    </div>
  );

  const renderStatsRow = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Fleet" value={trucks.length} icon={Truck} color="text-gray-700" loading={loading} />
      <StatCard title="Active Duty" value={trucks.filter(t => t.status === 'active').length} icon={Truck} color="text-emerald-600" loading={loading} />
      <StatCard title="Available" value={trucks.filter(t => t.status === 'available').length} icon={CheckCircle} color="text-blue-600" loading={loading} />
      <StatCard title="Maintenance" value={trucks.filter(t => t.status === 'maintenance').length} icon={Wrench} color="text-red-600" loading={loading} />
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input 
            type="text" 
            placeholder="Search by Truck ID or Driver Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <Filter className="w-4 h-4 text-gray-400" />
        <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 py-2.5 px-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white cursor-pointer"
        >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
        </select>
      </div>
    </div>
  );

  const renderTruckGrid = () => {
    if (loading && trucks.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100"></div>
                ))}
            </div>
        );
    }

    if (filteredTrucks.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                    <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No vehicles found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your filters or add a new truck.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTrucks.map(truck => (
                <div key={truck._id} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col">
                    {/* Card Header */}
                    <div className="p-5 border-b border-gray-50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{truck.id}</h3>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {truck.location}
                                </div>
                            </div>
                            <StatusBadge status={truck.status} />
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="font-medium">{truck.driver}</span>
                            </div>
                            {truck.phone && (
                                <a href={`tel:${truck.phone}`} className="p-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                                    <Phone className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>

                        {/* Maintenance Row with Logic */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Next Service</span>
                                {/* LOGIC: Maintenance Tomorrow Badge */}
                                {truck.nextMaintenance === tomorrowDate && truck.status === 'available' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200 animate-pulse">
                                        <AlertTriangle className="w-3 h-3" /> Due Tomorrow
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center text-sm font-medium text-gray-700">
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                {formatDateDisplay(truck.nextMaintenance)}
                            </div>
                        </div>

                        {/* Fuel Bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-500 font-medium">Fuel Level</span>
                                <span className={`${truck.fuel < 30 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{truck.fuel}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        truck.fuel > 60 ? 'bg-emerald-500' : truck.fuel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} 
                                    style={{ width: `${truck.fuel}%` }} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 border-t border-gray-50 bg-gray-50/50 rounded-b-xl flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">Trips: {truck.trips}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setSelectedTruck(truck); setView('view'); }}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                            >
                                Details
                            </button>
                            <button 
                                onClick={() => { setSelectedTruck(truck); setView('edit'); }}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-blue-600 rounded-md transition-colors shadow-sm"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const renderDetailOrEditView = () => {
    if (!selectedTruck) return null;
    const isEdit = view === 'edit';

    // Shared input renderer to avoid code duplication
    const renderField = (label: string, icon: any, key: keyof TruckType, type: string = "text", required = false) => {
        const value = isEdit ? (selectedTruck as any)[key] : (selectedTruck as any)[key];
        
        return (
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    {icon} {label} {required && isEdit && <span className="text-red-500">*</span>}
                </label>
                {isEdit ? (
                    <div className="relative">
                        <input
                            type={type}
                            min={key === 'nextMaintenance' ? todayDate : undefined}
                            value={value}
                            disabled={submitting}
                            onChange={(e) => {
                                let val = e.target.value;
                                if (key === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
                                if (key === 'capacity') val = val.replace(/\D/g, ''); // Extract number only for edit
                                if (key === 'driver') val = val.replace(/[^a-zA-Z\s]/g, '');
                                
                                setSelectedTruck({ ...selectedTruck, [key]: val });
                            }}
                            className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                                key === 'phone' && value.length !== 10 
                                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                                : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                            }`}
                        />
                        {key === 'capacity' && <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-medium pointer-events-none">tons</span>}
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 font-medium">
                        {key === 'nextMaintenance' ? formatDateDisplay(value) : value}
                    </div>
                )}
                {isEdit && key === 'phone' && value.length !== 10 && (
                    <p className="text-xs text-red-500">Must be exactly 10 digits.</p>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-right duration-300">
            <button 
                onClick={() => setView('list')}
                className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
            >
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-3 group-hover:border-gray-300 shadow-sm">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                Back to Fleet Dashboard
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Detail Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Truck className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedTruck.id}</h2>
                            <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                {selectedTruck.capacity} Capacity
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        {!isEdit && (
                            <button 
                                onClick={() => setView('edit')}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                            >
                                Edit Vehicle
                            </button>
                        )}
                        {isEdit && (
                            <button 
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 border border-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Detail Body */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Driver Information</h3>
                            {renderField("Driver Name", <User className="w-3.5 h-3.5"/>, "driver", "text", true)}
                            {renderField("Contact Phone", <Phone className="w-3.5 h-3.5"/>, "phone", "tel", true)}
                            
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-4">Status & Location</h3>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Status</label>
                                {isEdit ? (
                                    <select 
                                        value={selectedTruck.status}
                                        onChange={(e) => setSelectedTruck({...selectedTruck, status: e.target.value as any})}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white"
                                    >
                                        <option value="active">Active (On Trip)</option>
                                        <option value="available">Available</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                ) : (
                                    <div className="mt-1"><StatusBadge status={selectedTruck.status} /></div>
                                )}
                            </div>
                            {renderField("Current Location", <MapPin className="w-3.5 h-3.5"/>, "location")}
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Vehicle Specs</h3>
                            {renderField("Capacity", <Truck className="w-3.5 h-3.5"/>, "capacity")}
                            
                            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
                                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                                    <Fuel className="w-4 h-4" /> Fuel & Maintenance
                                </h4>
                                
                                {/* Fuel Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Fuel Level</span>
                                        <span className="font-bold text-gray-900">{selectedTruck.fuel}%</span>
                                    </div>
                                    {isEdit ? (
                                        <input 
                                            type="range" min="0" max="100"
                                            value={selectedTruck.fuel}
                                            onChange={(e) => setSelectedTruck({...selectedTruck, fuel: Number(e.target.value)})}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    ) : (
                                        <div className="w-full h-2 bg-gray-200 rounded-lg overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-lg" style={{width: `${selectedTruck.fuel}%`}} />
                                        </div>
                                    )}
                                </div>

                                {/* Maintenance Date */}
                                {renderField("Next Scheduled Service", <Calendar className="w-3.5 h-3.5"/>, "nextMaintenance", "date")}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {isEdit && (
                    <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
                        <button 
                            onClick={() => { setView('view'); /* Reset logic could go here */ }}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel Changes
                        </button>
                        <button 
                            onClick={handleUpdate}
                            disabled={submitting}
                            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {submitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderAddModal = () => {
    if (!showAddModal) return null;
    
    // Handler to keep logic but allow stable input component
    const handleInputChange = (prop: keyof typeof formData, rawValue: string) => {
        let val = rawValue;
        if (prop === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
        if (prop === 'capacity') val = val.replace(/\D/g, '');
        if (prop === 'driver') val = val.replace(/[^a-zA-Z\s]/g, '');
        
        setFormData(prev => ({ ...prev, [prop]: val }));
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Add New Vehicle</h3>
                    <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <ModalField 
                            label="Truck ID" 
                            placeholder="e.g. TRK-001" 
                            value={formData.id} 
                            onChange={(e: any) => handleInputChange('id', e.target.value)}
                            required 
                        />
                        <ModalField 
                            label="Capacity" 
                            placeholder="e.g. 15" 
                            value={formData.capacity} 
                            onChange={(e: any) => handleInputChange('capacity', e.target.value)}
                            suffix="tons"
                        />
                    </div>
                    
                    <ModalField 
                        label="Driver Name" 
                        placeholder="Full Name" 
                        value={formData.driver}
                        onChange={(e: any) => handleInputChange('driver', e.target.value)}
                        required 
                    />
                    
                    <ModalField 
                        label="Phone Number" 
                        placeholder="10-digit number" 
                        value={formData.phone}
                        onChange={(e: any) => handleInputChange('phone', e.target.value)}
                        error={formData.phone && formData.phone.length !== 10 ? "10 digits required" : ""}
                        required 
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</label>
                            <select 
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:border-blue-500 bg-white"
                            >
                                <option value="available">Available</option>
                                <option value="active">Active</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <ModalField 
                            label="Location" 
                            placeholder="Current Hub" 
                            value={formData.location}
                            onChange={(e: any) => handleInputChange('location', e.target.value)}
                        />
                    </div>
                    
                    <ModalField 
                        label="Next Maintenance" 
                        type="date"
                        min={todayDate}
                        value={formData.nextMaintenance}
                        onChange={(e: any) => handleInputChange('nextMaintenance', e.target.value)}
                    />
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={() => setShowAddModal(false)} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreate}
                        disabled={submitting}
                        className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Add to Fleet
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // ==========================================
  // 7. FINAL RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* VIEW CONTROLLER */}
        {view === 'list' ? (
            <div className="animate-in fade-in duration-300">
                {renderDashboardHeader()}
                {renderStatsRow()}
                {renderFilters()}
                {renderTruckGrid()}
            </div>
        ) : (
            renderDetailOrEditView()
        )}

        {/* MODALS & OVERLAYS */}
        {renderAddModal()}
        <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        
      </div>
    </div>
  );
};

export default TruckModule;


// ihghuh