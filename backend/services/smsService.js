const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendBookingSMS = async (phoneNumber, clientName, trackingId) => {
  try {
    const message = await client.messages.create({
      body: `Hello ${clientName}! Your MAR Transportation shipment is booked. Tracking ID: ${trackingId}. Track at: http://yourapp.com/track/${trackingId}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log(`Booking SMS sent to ${phoneNumber}: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
};

const sendTrackingSMS = async (phoneNumber, trackingId, status, driverName = null) => {
  try {
    let message = `Your shipment ${trackingId} is now ${status}.`;
    if (driverName) {
      message += ` Assigned driver: ${driverName}.`;
    }
    message += ` Track: http://yourapp.com/track/${trackingId}`;

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log(`Tracking SMS sent to ${phoneNumber}: ${sms.sid}`);
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
};

module.exports = {
  sendBookingSMS,
  sendTrackingSMS
};