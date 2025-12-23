import Shipment from "../models/Shipment.js";

/* ======================================
   GET DASHBOARD REPORTS
   ====================================== */
export const getDashboardReports = async (req, res) => {
  try {
    // 1. OVERVIEW KPIS
    // We run parallel queries for performance
    const [totalShipments, completedShipments, revenueResult] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: "delivered" }),
      Shipment.aggregate([
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. CATEGORY DISTRIBUTION
    // Group by goodsType and count
    const categoryStats = await Shipment.aggregate([
      {
        $group: {
          _id: "$goodsType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } }, // Highest first
    ]);

    // Calculate percentages for categories
    const categoryData = categoryStats.map((cat) => ({
      category: cat._id, // e.g., "leather products"
      shipments: cat.count,
      percentage: ((cat.count / totalShipments) * 100).toFixed(1),
    }));

    // 3. TOP ROUTES PERFORMANCE
    // Group by unique Pickup -> Delivery pairs
    const routeStats = await Shipment.aggregate([
      {
        $group: {
          _id: { pickup: "$pickupLocation", delivery: "$deliveryLocation" },
          count: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
          // Calculate average time only for delivered items (approximate using createdAt vs updatedAt)
          avgDuration: { 
            $avg: { 
              $cond: [
                { $eq: ["$status", "delivered"] },
                { $subtract: ["$updatedAt", "$createdAt"] }, // Result in milliseconds
                null 
              ]
            }
          }
        },
      },
      { $sort: { count: -1 } }, // Sort by most popular route
      { $limit: 5 },
    ]);

    // Format Routes Data
    const topRoutes = routeStats.map((route) => {
      // Convert ms to hours
      const hours = route.avgDuration 
        ? (route.avgDuration / (1000 * 60 * 60)).toFixed(1) 
        : "N/A";

      return {
        route: `${capitalize(route._id.pickup)} → ${capitalize(route._id.delivery)}`,
        shipments: route.count,
        revenue: route.totalRevenue,
        avgTime: hours !== "N/A" ? `${hours} hrs` : "Pending",
      };
    });

    // 4. AVG DELIVERY TIME & ON-TIME (Global)
    // Simple logic: delivered items average time
    const deliveryStats = await Shipment.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ["$updatedAt", "$createdAt"] } },
        },
      },
    ]);
    
    const avgDeliveryHours = deliveryStats[0]?.avgTime 
      ? (deliveryStats[0].avgTime / (1000 * 60 * 60)).toFixed(1) 
      : 0;

    // Final Response Structure matching your Frontend needs
    res.json({
      success: true,
      overview: {
        totalShipments,
        completedShipments,
        avgDeliveryTime: `${avgDeliveryHours} hours`,
        totalRevenue,
      },
      topRoutes,
      categoryData,
    });

  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ message: "Failed to generate reports" });
  }
};

// Helper to capitalize words (e.g. "ambur" -> "Ambur")
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};