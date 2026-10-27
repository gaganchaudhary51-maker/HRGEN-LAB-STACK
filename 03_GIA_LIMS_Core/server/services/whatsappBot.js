/**
 * HRGen GIA LIMS — Interactive 2-Way Meta WhatsApp Cloud API Bot
 * Standard: 2026 Patient Self-Service & Conversational Diagnostics
 */

const VERIFY_TOKEN_DEFAULT = 'HRGEN_GIA_WA_VERIFY_TOKEN';
function verifyMetaSignature(rawBody,signature,appSecret){
  if(!rawBody||!signature||!appSecret)return false;
  const expected=`sha256=${require('node:crypto').createHmac('sha256',String(appSecret)).update(rawBody).digest('hex')}`;
  const a=Buffer.from(expected),b=Buffer.from(String(signature));return a.length===b.length&&require('node:crypto').timingSafeEqual(a,b);
}

function verifyWebhook(mode, token, challenge){
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || VERIFY_TOKEN_DEFAULT;
  if(mode === 'subscribe' && token === expectedToken){
    return { valid: true, challenge };
  }
  return { valid: false };
}

function normalizeWaPhone(phone){
  return String(phone||'').replace(/\D/g,'');
}

function handleIncomingMessage(payload = {}, { orders = [], patients = [], branding = {} } = {}){
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if(!message){
    return { handled: false, reason: 'No message in webhook payload' };
  }

  const from = normalizeWaPhone(message.from);
  const rawText = String(message.text?.body || '').trim().toUpperCase();
  const labName = branding.name || 'HRGen Diagnostic Laboratory';

  // Find matching patient by phone
  const patient = patients.find(p => {
    const pPhone = normalizeWaPhone(p.phone);
    return pPhone.endsWith(from.slice(-10)) || from.endsWith(pPhone.slice(-10));
  });

  const patientOrders = patient ? orders.filter(o => o.patientId === patient.id) : [];
  const latestOrder = patientOrders[0] || null;

  let replyText = '';
  let actionType = 'MENU';

  if(rawText === '1' || rawText.includes('REPORT')){
    actionType = 'REPORT';
    if(!latestOrder){
      replyText = `Hello! No active patient orders found for phone +${from}. Please verify your registered number with laboratory reception.`;
    } else {
      const isReleased = latestOrder.pipelineStatus === 'RELEASED';
      const token = latestOrder.verificationToken || 'PENDING';
      const verifyUrl = `${process.env.APP_BASE_URL || 'https://lims.hrgen.in'}/verify/${token}`;
      if(isReleased){
        replyText = `✅ *${labName}* - Lab Report Ready\n\nPatient: ${patient?.name}\nAccession: ${latestOrder.invoiceNumber || latestOrder.id}\nStatus: Digitally Signed & Released\n\n📄 *Download / Verify Authenticity:* \n${verifyUrl}\n\nTamper-proof digital record verified by SHA-256 HMAC ledger.`;
      } else {
        replyText = `⏳ *${labName}* - Processing Status\n\nPatient: ${patient?.name}\nAccession: ${latestOrder.invoiceNumber || latestOrder.id}\nStatus: ${latestOrder.pipelineStatus} (Under Pathologist Review)\n\nYou will receive a notification the moment your report is signed and released.`;
      }
    }
  } else if(rawText === '2' || rawText.includes('BILL') || rawText.includes('PAY')){
    actionType = 'BILLING';
    if(!latestOrder){
      replyText = `No pending invoices found for phone +${from}.`;
    } else {
      const due = Number(latestOrder.balanceDue || 0);
      const paid = Number(latestOrder.paidAmount || 0);
      if(due <= 0){
        replyText = `💳 *${labName}* - Invoice Receipt\n\nInvoice: ${latestOrder.invoiceNumber || latestOrder.id}\nAmount: ₹${latestOrder.netPayable}\nPaid: ₹${paid}\nBalance Due: ₹0.00 (PAID IN FULL)\n\nThank you for choosing ${labName}!`;
      } else {
        replyText = `💳 *${labName}* - Outstanding Invoice\n\nInvoice: ${latestOrder.invoiceNumber || latestOrder.id}\nNet Amount: ₹${latestOrder.netPayable}\nAmount Paid: ₹${paid}\n*Balance Due: ₹${due.toFixed(2)}*\n\nPlease settle balance at lab counter or ask reception for instant UPI QR code.`;
      }
    }
  } else {
    // Default interactive menu
    actionType = 'MENU';
    replyText = `🏥 *Welcome to ${labName} Self-Service Bot*\n\n` +
      `Hello ${patient?.name || 'Valued Patient'}!\n` +
      `Please reply with a number to proceed:\n\n` +
      `1️⃣ *Download Latest Lab Report*\n` +
      `2️⃣ *Check Invoice & Payment Balance*\n` +
      `3️⃣ *Connect with Laboratory Reception*\n\n` +
      `_24×7 Automated Diagnostic Assistance_`;
  }

  return {
    handled: true,
    actionType,
    recipient: from,
    orderId: latestOrder?.id || null,
    patientId: patient?.id || null,
    replyText
  };
}

/**
 * Dispatch message via Meta Cloud API or mock fallback
 */
async function sendWhatsAppCloudMessage({ to, text, token, phoneNumberId }){
  const cleanTo = normalizeWaPhone(to);
  const waToken = token || process.env.WHATSAPP_TOKEN;
  const waPhoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if(!waToken || !waPhoneId){
    return {
      status: 'MOCK_DISPATCHED',
      to: cleanTo,
      text,
      mode: 'OFFLINE_MOCK_SANDBOX',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const resp = await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'text',
        text: { body: text }
      })
    });
    const data = await resp.json();
    return { status: resp.ok ? 'DELIVERED' : 'FAILED', response: data };
  } catch(err){
    return { status: 'NETWORK_ERROR', error: err.message };
  }
}

module.exports = {
  verifyWebhook,
  verifyMetaSignature,
  handleIncomingMessage,
  sendWhatsAppCloudMessage,
  VERIFY_TOKEN_DEFAULT
};
