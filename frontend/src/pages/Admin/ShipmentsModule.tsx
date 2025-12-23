import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MapPin,
  Save, 
  X,    
  Loader2,
  AlertCircle // Imported for the error banner
} from 'lucide-react';

// --- Types ---
interface Shipment {
  id: string; 
  _id: string; 
  product: string;
  category: string;
  quantity: number;
  origin: string;
  destination: string;
  priority: string;
  status: string;
  description: string;
  hasFleet: boolean; 
}

// --- ENTERPRISE LOGIC: Status Workflow ---
const STATUS_SEQUENCE = [
  'booked', 
  'picked up', 
  'in transit', 
  'out for delivery', 
  'delivered'
];

const ShipmentsModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inventory, setInventory] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);

  // --- EDITING STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');

  // --- ERROR STATE (New) ---
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'leather products', label: 'Leather Products' },
    { value: 'chemicals', label: 'Chemicals' },
    { value: 'groceries', label: 'Grocery Items' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'steel items', label: 'Steel Items' }
  ];

  // --- API CONFIG ---
  const API_URL = 'http://localhost:5000/api/admin';
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // --- 1. FETCH DATA ---
  const fetchShipments = async () => {
    setLoading(true);
    setError(null); // Clear errors on refresh
    try {
      const [activeRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/dispatches/active`, getAuthHeader()),
        axios.get(`${API_URL}/dispatches/pending`, getAuthHeader())
      ]);

      const allData = [...(activeRes.data.dispatches || []), ...(pendingRes.data.shipments || [])];

      const mappedData = allData.map((item: any) => ({
        id: item.trackingId || item._id,
        _id: item._id,
        product: item.goodsType || 'Unknown Package',
        category: item.goodsType || 'other',
        quantity: item.quantity || 1,
        origin: item.pickupLocation,
        destination: item.deliveryLocation,
        priority: item.priority || 'low',
        status: item.status,
        description: item.description || `Shipment to ${item.deliveryLocation}`,
        hasFleet: !!item.assignedTruck 
      }));

      setInventory(mappedData.reverse());
    } catch (err) {
      console.error("Failed to fetch inventory", err);
      setError("Failed to retrieve shipment data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // --- 2. DELETE (CANCEL) SHIPMENT LOGIC ---
  const handleDeleteShipment = async (mongoId: string) => {
    setError(null);
    if(!window.confirm("Are you sure you want to cancel this shipment? This will remove it from the tracking system.")) return;

    try {
      await axios.delete(`${API_URL}/shipments/${mongoId}`, getAuthHeader());
      
      setInventory(prev => prev.map(item => 
        item._id === mongoId ? { ...item, status: 'cancelled' } : item
      ));
      
      setEditingId(null);
    } catch (err) {
      console.error("Failed to cancel shipment", err);
      setError("Failed to cancel the shipment. Please verify your connection and try again.");
    }
  };

  // --- 3. UPDATE STATUS (With Fleet Validation) ---
  const handleSaveStatus = async (mongoId: string) => {
    setError(null); // Clear previous errors

    // A. Find the shipment being edited
    const currentShipment = inventory.find(item => item._id === mongoId);
    if (!currentShipment) return;

    // B. Check if user is trying to Cancel (Allowed regardless of fleet)
    if (editStatus === 'cancelled') {
        await handleDeleteShipment(mongoId);
        return;
    }

    // C. Check Fleet Assignment Logic
    // If user tries to change status to anything active but no fleet is assigned
    if (!currentShipment.hasFleet) {
        // --- NEW: Set Error State instead of Alert ---
        setError("Action Blocked: Fleet Not Assigned\n\nYou cannot progress the shipment status (e.g., to 'In Transit' or 'Picked Up') because no vehicle has been assigned to this order yet.\n\nPlease assign a fleet from the Dispatch Board first.");
        
        // Cancel the edit mode to revert UI
        setEditingId(null);
        return;
    }

    // D. Normal workflow 
    try {
      await axios.put(
        `${API_URL}/shipments/${mongoId}/status`, 
        { status: editStatus }, 
        getAuthHeader()
      );
      
      setInventory(prev => prev.map(item => 
        item._id === mongoId ? { ...item, status: editStatus } : item
      ));
      
      setEditingId(null);
    } catch (err) {
      setError("Failed to update status. Please try again.");
    }
  };

  // --- 4. FILTERING ---
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // --- HELPER: Get Valid Next Statuses ---
  const getAllowedStatuses = (currentStatus: string) => {
    const normalizedCurrent = currentStatus.toLowerCase();
    
    if (normalizedCurrent === 'cancelled' || normalizedCurrent === 'delivered') {
        return [normalizedCurrent];
    }

    const currentIndex = STATUS_SEQUENCE.indexOf(normalizedCurrent);
    if (currentIndex === -1) return [normalizedCurrent, 'cancelled'];

    const validOptions = [normalizedCurrent]; 
    
    if (currentIndex < STATUS_SEQUENCE.length - 1) {
        validOptions.push(STATUS_SEQUENCE[currentIndex + 1]);
    }

    validOptions.push('cancelled');

    return validOptions;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'in transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out for delivery': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'picked up': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'booked': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipments Inventory</h1>
            <p className="text-gray-600 mt-1">Manage products and track active shipments</p>
          </div>
          <button 
            onClick={fetchShipments} 
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Refresh Data"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Refresh"}
          </button>
        </div>
      </div>

      {/* --- ERROR ALERT SECTION (NEW) --- */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Action Required</h3>
            <div className="mt-1 text-sm text-red-700 whitespace-pre-line">
              {error}
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, IDs or descriptions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white capitalize"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {loading ? "Loading shipments..." : "No shipments found matching your search."}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* Product */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-50 rounded-lg mr-3">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 capitalize">{item.product}</div>
                          <div className="text-xs text-gray-500">{item.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200">
                        {item.category}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.quantity} units
                    </td>

                    {/* Route */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 capitalize">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1.5" />
                        {item.origin} <span className="mx-1">→</span> {item.destination}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize border ${getPriorityColor(item.priority).replace('bg-', 'border-').replace('text-', 'bg-').replace('800', '50')} ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>

                    {/* Status Column - EDITABLE WITH STRICT WORKFLOW */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === item._id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="text-sm border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200 bg-white min-w-[140px]"
                          autoFocus
                        >
                          {/* DYNAMIC OPTIONS: Only show allowed next steps + cancelled */}
                          {getAllowedStatuses(item.status).map(status => (
                            <option 
                              key={status} 
                              value={status} 
                              className="capitalize"
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {editingId === item._id ? (
                          <>
                            <button 
                              onClick={() => handleSaveStatus(item._id)}
                              className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-50 rounded"
                              title="Save Changes"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(null);
                                setError(null); // Clear error if they cancel editing
                              }}
                              className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setEditingId(item._id);
                                setEditStatus(item.status);
                                setError(null); // Clear old errors when starting new edit
                              }}
                              className={`text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded ${
                                (item.status === 'cancelled' || item.status === 'delivered') ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Edit Status"
                              disabled={item.status === 'cancelled' || item.status === 'delivered'} 
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteShipment(item._id)}
                              className={`text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded ${
                                item.status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Cancel Shipment"
                              disabled={item.status === 'cancelled'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShipmentsModule;