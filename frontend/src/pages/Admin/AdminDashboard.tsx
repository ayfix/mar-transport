import React, { useState, useEffect } from "react";
import {
  Menu,
  Package,
  Truck,
  Clock,
  TrendingUp,
  Bell,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCheck,
  X,
  UserCog,
  FileText,
  Search,
  Calendar,
  ChevronRight,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Wrench,
  Info
} from "lucide-react";

// --- COMPONENT IMPORTS ---
import Sidebar from "../../components/admin/SideBar"; 
import ShipmentsModule from "./ShipmentsModule";
import DispatchModule from "./DispatchModule";
import TruckModule from "./TruckModule";
import Reports from "./Reports";
import Profile from "./AdminProfile";

// --- API IMPORTS ---
// Make sure this path matches where you created the file from the previous step
import { AdminApi } from "../../api/adminApi"; 

import { 
  fetchAdminNotifications, 
  clearAllNotifications, 
  deleteNotification 
} from "../../api/adminNotificationsApi";
import { 
  fetchActiveDispatches, 
  fetchPendingDispatches 
} from "../../api/AdminDispatchApi";
import { fetchTrucks } from "../../api/trucksApi";
import { fetchActivityLogs } from "../../api/adminActivityApi"; 

// --- TYPES & INTERFACES ---
export type TabKey = 
  | "overview" 
  | "inventory" 
  | "dispatch" 
  | "trucks" 
  | "reports" 
  | "profile" 
  | string;

export interface NotificationItem {
  id: string;
  type: "urgent" | "warning" | "info";
  message: string;
  time: string;
}

export interface ActivityLogItem {
  _id: string;
  adminName: string;
  action: string; 
  details: string;
  createdAt: string;
}

export interface DashboardProps {
  activeTab: TabKey;
  userName?: string;
  setActiveTab?: (tab: TabKey) => void;
}

// --- HELPER: LOGIC FOR ACTIVITY CARDS ---
const getActivityConfig = (action: string) => {
  const act = action.toUpperCase();

  if (act.includes("CANCEL") || act.includes("DELETE") || act.includes("REMOVED")) {
    return {
      bg: "bg-red-50",
      border: "border-l-4 border-red-500",
      text: "text-red-700",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      icon: XCircle,
      label: "Critical Action"
    };
  }
  if (act.includes("DELIVER") || act.includes("COMPLETE") || act.includes("SUCCESS")) {
    return {
      bg: "bg-green-50",
      border: "border-l-4 border-green-500",
      text: "text-green-700",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      icon: CheckCircle2,
      label: "Success"
    };
  }
  if (act.includes("DISPATCH") || act.includes("ASSIGN")) {
    return {
      bg: "bg-blue-50",
      border: "border-l-4 border-blue-500",
      text: "text-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: Truck,
      label: "Operation"
    };
  }
  if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("STATUS")) {
    return {
      bg: "bg-amber-50",
      border: "border-l-4 border-amber-400",
      text: "text-amber-800",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      icon: RefreshCw,
      label: "Update"
    };
  }
  if (act.includes("FLEET") || act.includes("TRUCK") || act.includes("MAINTENANCE")) {
    return {
      bg: "bg-purple-50",
      border: "border-l-4 border-purple-500",
      text: "text-purple-700",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      icon: Wrench,
      label: "Fleet Ops"
    };
  }

  // Default / Info
  return {
    bg: "bg-gray-50",
    border: "border-l-4 border-gray-400",
    text: "text-gray-700",
    iconBg: "bg-gray-200",
    iconColor: "text-gray-600",
    icon: Info,
    label: "General"
  };
};

// --- MAIN DASHBOARD COMPONENT ---
const AdminDashboard: React.FC<DashboardProps> = ({
  activeTab,
  userName,
}) => {
  // --- UI STATE ---
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  
  // --- DATA STATE ---
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  
  // Admin Name State
  const [adminName, setAdminName] = useState(userName || "Loading...");

  const [statsData, setStatsData] = useState({
    activeShipments: 0,
    availableTrucks: 0,
    pendingDispatches: 0
  });
  
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // --- FETCH ADMIN PROFILE ---
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const data = await AdminApi.getProfile();
        
        // Handle variations in backend response structure
        if (data.user && data.user.name) {
          setAdminName(data.user.name);
        } else if (data.name) {
          setAdminName(data.name);
        } else {
            // Fallback to local storage
            const stored = localStorage.getItem("user");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.name) setAdminName(parsed.name);
            }
        }
      } catch (error) {
        console.error("Failed to fetch admin profile", error);
        // Fallback to local storage on error
        const stored = localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.name) setAdminName(parsed.name);
            else setAdminName("Admin");
        } else {
            setAdminName("Admin");
        }
      }
    };

    fetchAdminDetails();
  }, []);

  // --- DATA FETCHING (DASHBOARD) ---
  const loadDashboardData = async () => {
    setLoadingNotifs(true);
    try {
      // Parallel Fetching for Performance
      const [active, pending, trucks, logs, notifs] = await Promise.all([
        fetchActiveDispatches(),
        fetchPendingDispatches(),
        fetchTrucks(),
        fetchActivityLogs(),
        fetchAdminNotifications()
      ]);

      // Process Stats
      const availableTrucksCount = (trucks || []).filter((t: any) => t.status === 'available').length;
      setStatsData({
        activeShipments: (active || []).length,
        pendingDispatches: (pending || []).length,
        availableTrucks: availableTrucksCount
      });

      // Process Logs
      setActivityLogs(logs || []);

      // Process Notifications
      const contactMessages: NotificationItem[] = (notifs.newMessages || []).map((msg: any) => ({
        id: msg._id,
        type: 'info', 
        message: `New Message from ${msg.name}: ${msg.subject || 'No Subject'}`,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      const shipmentAlerts: NotificationItem[] = (notifs.pendingShipments || []).map((ship: any) => ({
        id: ship._id,
        type: 'urgent',
        message: `New Booking #${ship.trackingId} needs approval`,
        time: new Date(ship.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      const allNotifications = [...shipmentAlerts, ...contactMessages];
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
      setLastRefreshed(new Date());

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // --- LIFECYCLE ---
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // 30s Polling
    return () => clearInterval(interval);
  }, []);


  // --- HANDLERS ---
  const handleNotificationClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoadingNotifs(true);
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setIsNotifOpen(false);
    } catch (error) {
      console.error("Failed to clear notifications", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setIsDesktopOpen(!isDesktopOpen);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  // --- STATS CONFIGURATION ---
  const statsConfig = [
    { 
      title: 'Active Shipments', 
      value: statsData.activeShipments, 
      icon: Package, 
      bg: 'bg-blue-600',
      subText: 'In Transit'
    },
    { 
      title: 'Fleet Availability', 
      value: statsData.availableTrucks, 
      icon: Truck, 
      bg: 'bg-emerald-500', 
      subText: 'Ready for Dispatch'
    },
    { 
      title: 'Pending Orders', 
      value: statsData.pendingDispatches, 
      icon: Clock, 
      bg: 'bg-orange-500', 
      subText: 'Action Required'
    },
  ];

  // --- CONTENT RENDERER ---
  const renderContent = () => {
    switch (activeTab) {
      case "inventory":
      case "shipments": return <ShipmentsModule />;
      case "dispatch": return <DispatchModule />;
      case "fleet": return <TruckModule />;
      case "reports": return <Reports />;
      case "profile": return <Profile />;
      case "overview":
      default:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            
            {/* 1. STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statsConfig.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                        {stat.value}
                      </h3>
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                        <span className="text-gray-500 font-medium">{stat.subText}</span>
                      </div>
                    </div>
                    <div className={`${stat.bg} p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* 2. ACTIVITY LOG WIDGET (ENTERPRISE UI) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px] overflow-hidden">
                 {/* Header */}
                 <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                       <div className="bg-indigo-100 p-2 rounded-lg">
                          <UserCog className="w-5 h-5 text-indigo-600" />
                       </div>
                       <div>
                          <h2 className="text-lg font-bold text-gray-900">System Activity Log</h2>
                          <p className="text-xs text-gray-500">Real-time administrative actions</p>
                       </div>
                    </div>
                   
                 </div>
                 
                 {/* List Body */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/30">
                    {activityLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                           <div className="bg-gray-100 p-4 rounded-full mb-3">
                              <FileText className="w-8 h-8 opacity-40"/>
                           </div>
                           <p className="font-medium">No activity recorded</p>
                           <p className="text-xs">Actions performed by admins will appear here</p>
                        </div>
                    ) : (
                        activityLogs.map((log) => {
                           const style = getActivityConfig(log.action);
                           const Icon = style.icon;

                           return (
                             <div 
                               key={log._id} 
                               className={`relative flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm border border-gray-100 ${style.border} hover:shadow-md transition-shadow duration-200 group`}
                             >
                                {/* Left Icon Box */}
                                <div className={`shrink-0 p-2 rounded-full ${style.iconBg} ${style.iconColor} mt-1`}>
                                   <Icon className="w-5 h-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center justify-between mb-1">
                                      <h4 className={`text-sm font-bold ${style.text} truncate`}>
                                         {log.action}
                                      </h4>
                                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 whitespace-nowrap">
                                         {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                   </div>
                                   
                                   <p className="text-sm text-gray-600 leading-snug break-words">
                                      {log.details}
                                   </p>

                                   {/* Footer Meta */}
                                   <div className="mt-2 flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 ring-2 ring-white">
                                         {log.adminName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-xs text-gray-500 font-medium">
                                         {log.adminName}
                                      </span>
                                   </div>
                                </div>
                             </div>
                           );
                        })
                    )}
                 </div>
              </div>

              {/* 3. NOTIFICATIONS WIDGET (ENTERPRISE UI) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                     <div className="bg-orange-100 p-2 rounded-lg">
                        <Bell className="w-5 h-5 text-orange-600" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                        <p className="text-xs text-gray-500">Alerts & Messages</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                        {unreadCount} NEW
                      </span>
                    )}
                    <button onClick={loadDashboardData} className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-gray-100">
                      <RefreshCw className={`w-4 h-4 ${loadingNotifs ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                       <div className="bg-gray-100 p-4 rounded-full mb-3">
                          <CheckCheck className="w-8 h-8 opacity-40 text-green-500"/>
                       </div>
                       <p className="font-medium">All caught up!</p>
                       <p className="text-xs">No pending notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={(e) => handleNotificationClick(n.id, e)}
                        className="group flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-0 relative"
                      >
                        {/* Status Dot */}
                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${n.type === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                        
                        {/* Icon Box */}
                        <div className={`p-2 rounded-lg shrink-0 ${n.type === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {n.type === 'urgent' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-blue-700 transition-colors">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium">{n.time}</span>
                          </div>
                        </div>

                        {/* Dismiss Action */}
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-red-100 rounded-full text-gray-300 hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button 
                      onClick={handleMarkAllRead}
                      className="w-full py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-hidden font-sans text-gray-900 selection:bg-blue-100">
      
      {/* 1. MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="relative z-50 w-64 h-full bg-slate-900 shadow-2xl transition-transform duration-300">
            <Sidebar onClose={() => setIsMobileOpen(false)} />
          </div>
          <div className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* 2. DESKTOP SIDEBAR */}
      <div className={`hidden md:block h-screen bg-slate-900 transition-all duration-300 ease-in-out shrink-0 overflow-hidden shadow-xl z-20 ${isDesktopOpen ? "w-72" : "w-0"}`}>
        <Sidebar />
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 backdrop-blur-md px-8 py-4 shadow-sm border-b border-gray-200">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleSidebar} 
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 capitalize tracking-tight">
                {activeTab === 'overview' ? 'Admin Dashboard' : activeTab}
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                 System Operational
                 <span className="text-gray-300">|</span>
                 Last updated: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            
          

            <div className="flex items-center gap-3 relative">
              {/* NOTIFICATION BELL */}
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="relative p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition-all hover:text-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {isNotifOpen && (
                <div className="absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-black/5">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/80 flex justify-between items-center backdrop-blur-sm">
                    <div>
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <p className="text-xs text-gray-500">{unreadCount} unread messages</p>
                    </div>
                    <button onClick={loadDashboardData} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-white rounded-full transition-all shadow-sm">
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingNotifs ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                         <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                           <ShieldCheck className="w-6 h-6 text-blue-500" />
                         </div>
                         <p className="text-sm font-medium text-gray-900">All caught up</p>
                         <p className="text-xs text-gray-500 mt-1">No new alerts at this time.</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={(e) => handleNotificationClick(n.id, e)}
                          className="group p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 relative flex gap-3"
                        >
                          <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${n.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                          <div className="flex-1">
                             <p className="text-sm text-gray-800 font-semibold leading-snug group-hover:text-blue-600 transition-colors">
                               {n.message}
                             </p>
                             <p className="text-xs text-gray-400 mt-1.5 font-medium flex items-center gap-1">
                               <Calendar className="w-3 h-3" /> {n.time}
                             </p>
                          </div>
                          <button className="text-gray-300 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all absolute right-4 top-4">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <button 
                        onClick={handleMarkAllRead}
                        className="w-full py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* USER PROFILE SNIPPET (UPDATED) */}
              <div className="hidden sm:flex items-center gap-3 border-l border-gray-200 pl-6 ml-2">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Administrator</p>
                  <p className="text-sm font-bold text-gray-900 leading-none">{adminName}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-gray-100 cursor-pointer hover:ring-blue-200 transition-all">
                  {(adminName?.charAt(0) || "A").toUpperCase()}
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50 scroll-smooth">
          {activeTab === 'overview' && (
            <div className="mb-8 flex items-end justify-between">
              <div>
                 <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
                 <p className="text-gray-500 mt-2 font-medium">Welcome back! Here is what’s happening with your fleet today.</p>
              </div>
             
            </div>
          )}
          {renderContent()}
        </main>

      </div>
    </div>
  );
};

export default AdminDashboard;