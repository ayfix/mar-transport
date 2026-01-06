// 1. Booking Confirmation (Updated to match Enterprise Invoice with GST)
export const smsBookingConfirmation = (clientName, trackingId, baseAmount) => {
  // Calculate Total (Base + 18% GST) to match the Email Invoice
  const totalAmount = (Number(baseAmount) * 1.18).toFixed(2);

  return `Hi ${clientName}, Booking Confirmed! 📦
Tracking ID: ${trackingId}
Total Invoice: ₹${totalAmount} (inc. GST)
You will receive driver details shortly.
- MAR Transport`;
};

// 2. Fleet Assigned (Perfect - No changes needed)
export const smsFleetAssigned = (clientName, truckModel, plateNumber, driverName, driverPhone) => {
  return `Hello ${clientName}, a driver has been assigned! 🚚
Truck: ${truckModel} (${plateNumber})
Driver: ${driverName}
Contact: ${driverPhone}
- MAR Transport`;
};

// 3. Delivery Confirmation (Perfect - No changes needed)
export const smsDeliveryConfirmation = (clientName, trackingId) => {
  return `Good news ${clientName}! 🎉
Your shipment (ID: ${trackingId}) has been successfully delivered.
Thanks for choosing MAR Transport.`;
};

// 4. Cancellation Alert (Perfect - No changes needed)
export const smsCancellation = (clientName, trackingId) => {
  return `Alert: Shipment Cancelled ❌
ID: ${trackingId}
Refunds (if applicable) are processed within 5-7 days.
- MAR Transport`;
};