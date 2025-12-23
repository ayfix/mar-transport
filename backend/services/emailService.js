const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBookingConfirmation = async (clientEmail, clientName, shipmentDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: 'Shipment Booking Confirmation - MAR Transportation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">MAR Transportation</h2>
          <h3>Hello ${clientName},</h3>
          <p>Your shipment has been booked successfully!</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>Shipment Details:</h4>
            <p><strong>Tracking ID:</strong> ${shipmentDetails.trackingId}</p>
            <p><strong>Goods Type:</strong> ${shipmentDetails.goodsType}</p>
            <p><strong>Route:</strong> ${shipmentDetails.pickupLocation} to ${shipmentDetails.deliveryLocation}</p>
            <p><strong>Total Amount:</strong> ₹${shipmentDetails.price}</p>
            <p><strong>Status:</strong> ${shipmentDetails.status}</p>
          </div>
          
          <p>You can track your shipment using this tracking ID: <strong>${shipmentDetails.trackingId}</strong></p>
          <p>Thank you for choosing MAR Transportation!</p>
          
          <hr>
          <p style="color: #6b7280; font-size: 12px;">
            MAR Transportation<br>
            Contact: +91-XXXXXXXXXX<br>
            Email: info@martransport.com
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${clientEmail}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

const sendTrackingUpdate = async (clientEmail, clientName, trackingId, status, driverDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: `Shipment Update - ${trackingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">MAR Transportation</h2>
          <h3>Hello ${clientName},</h3>
          <p>Your shipment status has been updated!</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>Update Details:</h4>
            <p><strong>Tracking ID:</strong> ${trackingId}</p>
            <p><strong>New Status:</strong> ${status}</p>
            ${driverDetails ? `
            <p><strong>Driver:</strong> ${driverDetails.driverName}</p>
            <p><strong>Truck Number:</strong> ${driverDetails.truckNumber}</p>
            <p><strong>Driver Contact:</strong> ${driverDetails.driverPhone}</p>
            ` : ''}
          </div>
          
          <p>Track your shipment: http://yourapp.com/track/${trackingId}</p>
          
          <hr>
          <p style="color: #6b7280; font-size: 12px;">MAR Transportation</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Tracking update email sent to ${clientEmail}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

module.exports = {
  sendBookingConfirmation,
  sendTrackingUpdate
};