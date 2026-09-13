// WhatsApp Bill Sending — Twilio API se
// Install: npm install twilio

import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// ── Types ──────────────────────────────────────────────────────────────────
interface BillItem {
  name: string;
  qty: number;
  price: number;
  gstRate: number;
}

interface BillData {
  invoiceNo: string;
  date: string;
  restaurantName: string;
  restaurantAddress: string;
  gstin: string;
  customerPhone: string;
  customerName?: string;
  items: BillItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  paymentMode: string;
  fssai?: string;
}

// ── Format bill as WhatsApp text message ──────────────────────────────────
function formatBillText(bill: BillData): string {
  const line = "─".repeat(28);
  const dline = "═".repeat(28);

  // Items list
  const itemsText = bill.items
    .map((item) => {
      const total = (item.qty * item.price).toFixed(2);
      return `  ${item.name}\n  ${item.qty} × ₹${item.price} = *₹${total}*`;
    })
    .join("\n");

  // Discount line
  const discountLine =
    bill.discountAmount > 0
      ? `\n🏷️ Discount (${bill.discountCode || "Applied"}): *-₹${bill.discountAmount.toFixed(2)}*`
      : "";

  const message = `
🍽️ *${bill.restaurantName.toUpperCase()}*
📍 ${bill.restaurantAddress}
${bill.gstin ? `GSTIN: ${bill.gstin}` : ""}${bill.fssai ? `\nFSSAI: ${bill.fssai}` : ""}
${dline}

📄 *Bill No:* ${bill.invoiceNo}
📅 *Date:* ${bill.date}
${bill.customerName ? `👤 *Customer:* ${bill.customerName}` : ""}
${line}

*ITEMS:*
${itemsText}
${line}

💰 Subtotal: ₹${bill.subtotal.toFixed(2)}${discountLine}
📊 Taxable: ₹${bill.taxableAmount.toFixed(2)}
🏛️ CGST: ₹${bill.cgst.toFixed(2)}
🏛️ SGST: ₹${bill.sgst.toFixed(2)}
${dline}

✅ *TOTAL: ₹${bill.grandTotal.toFixed(2)}*
💳 Payment: ${bill.paymentMode}
${dline}

🙏 *Thank you for visiting!*
Aapka swagat phir se hai।
`.trim();

  return message;
}

// ── Send WhatsApp message ──────────────────────────────────────────────────
export async function sendWhatsAppBill(bill: BillData): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  try {
    // Phone format: Indian numbers ko +91 se start karna hoga
    const phone = bill.customerPhone.startsWith("+")
      ? bill.customerPhone
      : `+91${bill.customerPhone.replace(/^0/, "")}`;

    const messageText = formatBillText(bill);

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM!.startsWith("whatsapp:") 
      ? process.env.TWILIO_WHATSAPP_FROM! 
      : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    console.log("==== WhatsApp Debug ====");
    console.log("FROM:", fromNumber);
    console.log("TO:", `whatsapp:${phone}`);
    console.log("SID:", process.env.TWILIO_ACCOUNT_SID?.slice(0, 10) + "...");

    const message = await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${phone}`,
      body: messageText,
    });

    console.log(`✅ WhatsApp bill sent: ${message.sid}`);

    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.error("❌ TWILIO ERROR FULL:", error);
    console.error("❌ ERROR MESSAGE:", error.message);
    console.error("❌ ERROR CODE:", error.code);
    console.error("❌ MORE INFO:", error.moreInfo);
    
    return { success: false, error: error.message || "Unknown error" };
  }
}

// ── Optional: Send PDF attachment (for Twilio Media) ──────────────────────
export async function sendWhatsAppBillWithPDF(
  bill: BillData,
  pdfUrl: string // publicly accessible URL of the PDF
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const phone = bill.customerPhone.startsWith("+")
      ? bill.customerPhone
      : `+91${bill.customerPhone.replace(/^0/, "")}`;

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM!.startsWith("whatsapp:") 
      ? process.env.TWILIO_WHATSAPP_FROM! 
      : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    const message = await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${phone}`,
      body: `🧾 *${bill.restaurantName}* ka bill\nBill No: ${bill.invoiceNo}\nTotal: ₹${bill.grandTotal.toFixed(2)}\n\nThank you! 🙏`,
      mediaUrl: [pdfUrl], // PDF publicly accessible URL
    });

    return { success: true, messageSid: message.sid };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errMsg };
  }
}
// ── Send WhatsApp OTP ──────────────────────────────────────────────────────
export async function sendWhatsAppOTP(
  name: string,
  phone: string,
  otp: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+91${phone.replace(/^0/, "")}`;

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM!.startsWith("whatsapp:") 
      ? process.env.TWILIO_WHATSAPP_FROM! 
      : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    const message = await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${formattedPhone}`,
      body: `🔐 *Kravy POS Verification*\n\nHello ${name},\n\nYour 6-digit verification code is: *${otp}*\n\nThis code will expire in 10 minutes.\n\n🙏 Thank you for joining Kravy!`,
    });

    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.error("❌ TWILIO OTP ERROR:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
