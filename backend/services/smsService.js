import twilio from 'twilio';

// Initialize Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Safety Check: Prevent app crash if keys are missing
const client = (accountSid && authToken) 
  ? twilio(accountSid, authToken) 
  : null;

/**
 * Helper: Ensure number is in E.164 format for India
 * Input: "9876543210" -> Output: "+919876543210"
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove spaces, dashes, parentheses (keep only digits)
  const cleanPhone = phone.toString().replace(/\D/g, ''); 
  
  // CASE 1: 10-digit number (Standard Indian Mobile) -> Add +91
  if (cleanPhone.length === 10) {
    return `+91${cleanPhone}`;
  }
  
  // CASE 2: 12-digit number starting with 91 -> Add +
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return `+${cleanPhone}`;
  }

  // CASE 3: Already has +, just return it (assuming logic handles it elsewhere) or fallback
  if (phone.toString().startsWith('+')) {
    return phone;
  }

  // Fallback: Return with + just in case
  return `+${cleanPhone}`;
};

export const sendSMS = async (to, body) => {
  // 1. Check if Twilio is initialized
  if (!client) {
    console.error('❌ Twilio keys missing in .env. SMS skipped.');
    return null;
  }

  // 2. Format the number
  const formattedNumber = formatPhoneNumber(to);
  
  if (!formattedNumber) {
    console.error(`❌ Invalid phone number: ${to}`);
    return null;
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log(`✅ SMS sent to ${formattedNumber}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`❌ SMS Failed to ${formattedNumber}:`, error.message);
    // Return null so the controller continues without crashing
    return null;
  }
};