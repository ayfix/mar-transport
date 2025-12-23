import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  MapPin,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle
} from "lucide-react";
import { fetchDashboardReports } from "../../api/reportApi";

// 1. Define Interfaces for your data structure
interface OverviewData {
  totalShipments: number;
  completedShipments: number;
  avgDeliveryTime: string;
  onTimeDelivery: string;
  totalRevenue: number;
}

interface RouteData {
  route: string;
  shipments: number;
  revenue: number;
  avgTime: string;
}

interface CategoryItem {
  category: string;
  shipments: number;
  percentage: string | number;
}

// Main Interface for the API response
interface ReportData {
  overview: OverviewData;
  topRoutes: RouteData[];
  categoryData: CategoryItem[];
}

const Reports: React.FC = () => {
  // 2. Add the Generic Type <ReportData | null> to useState
  const [data, setData] = useState<ReportData | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // You might need to cast the response if your API function isn't typed yet
        const reportData = await fetchDashboardReports();
        setData(reportData as ReportData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load reports:", err);
        setError("Failed to load report data. Please try again.");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper to assign colors
  const getCategoryColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-gray-500",
      "bg-red-500",
      "bg-indigo-500"
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  // 3. Safety check: ensure data exists before destructuring
  if (!data) {
    return null; 
  }

  // Now TypeScript knows 'data' is of type ReportData
  const { overview, topRoutes, categoryData } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Performance insights and business analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Total Shipments */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Shipments</h3>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.totalShipments}
          </p>
        </div>

        {/* Completed Shipments */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Completed Shipments</h3>
            <Package className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.completedShipments}
          </p>
        </div>

        {/* Avg Delivery Time */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Avg Delivery Time</h3>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {overview.avgDeliveryTime}
          </p>
        </div>

     

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(overview.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Shipment Distribution by Category
        </h3>
        <div className="space-y-4">
          {categoryData && categoryData.length > 0 ? (
            categoryData.map((cat, index) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${getCategoryColor(index)}`} />
                  <span className="font-medium text-gray-900 capitalize">
                    {cat.category}
                  </span>
                </div>
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>{cat.shipments} shipments</span>
                  <span className="font-semibold text-gray-900">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No category data available</p>
          )}
        </div>
      </div>

      {/* Top Routes Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Routes Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Shipments</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {topRoutes && topRoutes.length > 0 ? (
                topRoutes.map((route, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{route.route}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{route.shipments}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatCurrency(route.revenue)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{route.avgTime}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No route data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;