import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Setup Directory Handling (To find your logo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Create the Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- HELPER: GENERATE ENTERPRISE PDF INVOICE ---
const createInvoicePDF = (shipment, userName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // --- 1. HEADER SECTION ---
    const logoPath = path.join(__dirname, '../assets/logo.png');
    
    // Attempt to load logo, fallback to text if missing
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
    } else {
        doc.fillColor('#D9534F').fontSize(20).text('MAR', 50, 50);
    }

    // Company Details (Right Aligned)
    doc.fillColor('#444444')
       .fontSize(20)
       .text('INVOICE', 0, 50, { align: 'right' })
       .fontSize(10)
       .text('MAR Transport', 0, 80, { align: 'right' })
       .text('3, Baker Street, Periyamedu, Choolai', 0, 95, { align: 'right' })
       .text('Chennai, Tamil Nadu 600003', 0, 110, { align: 'right' })
       .text('Phone: +91 9444032677', 0, 125, { align: 'right' })
       .text('Email: support@martransports.com', 0, 140, { align: 'right' })
       .moveDown();

    // Divider
    doc.moveTo(50, 165).lineTo(550, 165).strokeColor('#aaaaaa').lineWidth(1).stroke();

    // --- 2. BILLING INFO ---
    const customerTop = 180;
    
    // Left: Bill To
    doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold')
       .text('BILL TO:', 50, customerTop);
    
    doc.font('Helvetica').fillColor('#555555')
       .text(userName, 50, customerTop + 15)
       .text(`Phone: ${shipment.contactPhone}`, 50, customerTop + 30)
       .text(`Pickup: ${shipment.pickupLocation}`, 50, customerTop + 45)
       .text(`Drop: ${shipment.deliveryLocation}`, 50, customerTop + 60);

    // Right: Invoice Metadata
    doc.font('Helvetica-Bold').fillColor('#000000')
       .text('Invoice Details:', 350, customerTop);
    
    doc.font('Helvetica').fillColor('#555555')
       .text(`Invoice No:`, 350, customerTop + 15)
       .text(`INV-${shipment.trackingId}`, 450, customerTop + 15, { align: 'right' })
       
       .text(`Date:`, 350, customerTop + 30)
       .text(`${new Date().toLocaleDateString('en-IN')}`, 450, customerTop + 30, { align: 'right' })
       
       .text(`Tracking ID:`, 350, customerTop + 45)
       .text(`${shipment.trackingId}`, 450, customerTop + 45, { align: 'right' })

       .text(`Status:`, 350, customerTop + 60)
       .text(`Unpaid`, 450, customerTop + 60, { align: 'right', color: 'red' });


    // --- 3. TABLE HEADER ---
    const tableTop = 270;
    const itemCodeX = 50;
    const descX = 120;
    const qtyX = 350;
    const amountX = 450;

    // Table Header Background
    doc.rect(50, tableTop, 500, 20).fill('#f0f0f0').stroke('#cccccc');
    
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text('#', itemCodeX + 5, tableTop + 5);
    doc.text('Description', descX, tableTop + 5);
    doc.text('Qty / Wt', qtyX, tableTop + 5);
    doc.text('Amount', amountX, tableTop + 5, { align: 'right' });

    // --- 4. TABLE ROWS ---
    let position = tableTop + 30;
    doc.font('Helvetica').fontSize(10).fillColor('#444444');

    // Row 1: Freight Charges
    doc.text('1', itemCodeX + 5, position);
    
    // Description combining Goods Type and Locations
    doc.text(`Freight Charges: ${shipment.goodsType || 'General'}`, descX, position, { width: 220 });
    doc.text(`${shipment.quantity} Qty / ${shipment.weight} Kg`, qtyX, position);
    
    // ✅ FIX 1: Changed `₹` to `Rs.` so it prints correctly
    doc.text(`Rs. ${Number(shipment.price).toFixed(2)}`, amountX, position, { align: 'right' });
    
    // Line below row
    doc.moveTo(50, position + 20).lineTo(550, position + 20).strokeColor('#eeeeee').lineWidth(1).stroke();

    // --- 5. CALCULATIONS ---
    const basePrice = Number(shipment.price);
    const sgst = basePrice * 0.09;
    const cgst = basePrice * 0.09;
    const total = basePrice + sgst + cgst;

    const subtotalPosition = position + 40;

    // Subtotal
    doc.font('Helvetica-Bold');
    doc.text('Sub Total', 350, subtotalPosition);
    // ✅ FIX 1: Changed `₹` to `Rs.`
    doc.text(`Rs. ${basePrice.toFixed(2)}`, amountX, subtotalPosition, { align: 'right' });

    // SGST
    doc.font('Helvetica');
    doc.text('SGST (9%)', 350, subtotalPosition + 15);
    // ✅ FIX 1: Changed `₹` to `Rs.`
    doc.text(`Rs. ${sgst.toFixed(2)}`, amountX, subtotalPosition + 15, { align: 'right' });

    // CGST
    doc.text('CGST (9%)', 350, subtotalPosition + 30);
    // ✅ FIX 1: Changed `₹` to `Rs.`
    doc.text(`Rs. ${cgst.toFixed(2)}`, amountX, subtotalPosition + 30, { align: 'right' });

    // Total Background
    doc.rect(340, subtotalPosition + 50, 210, 25).fill('#003366');
    
    // Grand Total
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
    doc.text('Total Amount', 350, subtotalPosition + 57);
    // ✅ FIX 1: Changed `₹` to `Rs.`
    doc.text(`Rs. ${total.toFixed(2)}`, amountX, subtotalPosition + 57, { align: 'right' });

    // --- 6. FOOTER ---
    const footerTop = 700;
    doc.fillColor('#777777').fontSize(10).font('Helvetica');
    
    doc.moveTo(50, footerTop).lineTo(550, footerTop).strokeColor('#aaaaaa').lineWidth(1).stroke();
    
    doc.text('Payment is required within 15 days of invoice date.', 50, footerTop + 15, { align: 'center' });
    doc.text('Thank you for your business!', 50, footerTop + 30, { align: 'center' });
    
    // ✅ FIX 2: Changed from dynamic date to hardcoded 1960
    doc.font('Helvetica-Bold').text('MAR Transport © 1960', 50, footerTop + 45, { align: 'center' });

    doc.end();
  });
};

// --- HELPER: HTML WRAPPER (For Email Body) ---
const wrapContent = (content) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
      .header { background-color: #003366; padding: 30px; text-align: center; }
      .content { padding: 30px; color: #555555; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="color:white;">MAR Transport</h1>
      </div>
      <div class="content">${content}</div>
      <div class="footer"><p>&copy; 1960 MAR Transport. All rights reserved.</p></div>
    </div>
  </body>
  </html>
`;

/**
 * SCENARIO 1: Booking Confirmation + PDF ATTACHMENT
 */
export const sendBookingConfirmation = async (userEmail, userName, shipment) => {
  try {
    // 1. Generate PDF
    const pdfBuffer = await createInvoicePDF(shipment, userName);

    // 2. Prepare HTML Email
    const basePrice = Number(shipment.price);
    const totalAmount = (basePrice * 1.18).toFixed(2);
    
    const invoiceHtml = `
      <h2>Booking Confirmed!</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for booking with MAR Transport. Your shipment <strong>#${shipment.trackingId}</strong> has been received.</p>
      
      <p style="text-align:center;">
        <span style="display:inline-block; padding:10px 20px; background-color:#eef; border-radius:4px; font-weight:bold; color:#003366;">
           Total to Pay: Rs. ${totalAmount}
        </span>
      </p>

      <p><strong>Please find your Official Tax Invoice attached to this email.</strong></p>
      <p>You can download it for your records.</p>
    `;

    // 3. Send Email with Attachment
    await transporter.sendMail({
      from: '"MAR Transport" <no-reply@martransport.com>',
      to: userEmail,
      subject: `Booking Confirmed - #${shipment.trackingId}`,
      html: wrapContent(invoiceHtml),
      attachments: [
        {
          filename: `Invoice-${shipment.trackingId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    console.log(`✅ Invoice Email sent to ${userEmail}`);
  } catch (error) {
    console.error("❌ Error generating/sending invoice:", error);
  }
};

/**
 * SCENARIO 2: Fleet Assignment (Updated for iOS Click Fix)
 */
export const sendFleetDetails = async (userEmail, userName, trackingId, driverName, truckNumber, driverPhone) => {
  
  // Clean the phone number
  const cleanPhone = driverPhone ? driverPhone.toString().replace(/\D/g, '') : '';

  const content = `
    <h2>Fleet Assigned</h2>
    <p>Dear ${userName},</p>
    <p>Good news! A vehicle has been assigned to your shipment <strong>#${trackingId}</strong>.</p>
    
    <div style="background-color: #f9f9f9; border-left: 4px solid #003366; padding: 15px; margin: 20px 0;">
      <p style="margin:5px 0;"><strong>Truck Number:</strong> ${truckNumber}</p>
      <p style="margin:5px 0;"><strong>Driver Name:</strong> ${driverName}</p>
      <p style="margin:5px 0;"><strong>Driver Contact:</strong> +91 ${driverPhone}</p>
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="tel:+91${cleanPhone}" target="_blank" style="background-color: #003366; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
        📞 Call Driver
      </a>
    </div>

    <p style="margin-top:20px;">The driver will contact you shortly upon arrival.</p>
  `;

  await transporter.sendMail({
    from: '"MAR Transport" <no-reply@martransport.com>',
    to: userEmail,
    subject: `Fleet Assigned - #${trackingId}`,
    html: wrapContent(content),
  });
};

/**
 * SCENARIO 3: Delivery Confirmation
 */
export const sendDeliveryConfirmation = async (userEmail, userName, trackingId) => {
  const content = `
    <h2>Shipment Delivered</h2>
    <p>Dear ${userName},</p>
    <p>Your shipment #${trackingId} has been successfully delivered.</p>
  `;
  await transporter.sendMail({
    from: '"MAR Transport" <no-reply@martransport.com>',
    to: userEmail,
    subject: `Delivered - #${trackingId}`,
    html: wrapContent(content),
  });
};

/**
 * SCENARIO 4: Cancellation Email
 */
export const sendCancellationEmail = async (userEmail, userName, trackingId) => {
  const content = `
    <h2 style="color: #d9534f;">Shipment Cancelled</h2>
    <p>Dear ${userName},</p>
    <p>Your shipment #${trackingId} has been cancelled.</p>
  `;
  await transporter.sendMail({
    from: '"MAR Transport" <no-reply@martransport.com>',
    to: userEmail,
    subject: `Shipment Cancelled - #${trackingId}`,
    html: wrapContent(content),
  });
};