const crypto = require('crypto');
async function postJson(url, body, headers={}){
  if(!url) throw Object.assign(new Error('Provider URL is not configured'),{code:'NOT_CONFIGURED'});
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
  const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={raw:text}};
  if(!r.ok) throw Object.assign(new Error(`Provider returned HTTP ${r.status}`),{code:'PROVIDER_ERROR',status:r.status,data}); return data;
}
function webhookSignature(secret,payload){return crypto.createHmac('sha256',secret).update(payload).digest('hex');}
async function sendWhatsApp(message){const url=process.env.WHATSAPP_PROVIDER_URL; if(!url) return {status:'NOT_CONFIGURED'}; return {status:'SENT',provider:await postJson(url,message,{authorization:`Bearer ${process.env.WHATSAPP_PROVIDER_TOKEN||''}`})};}
async function sendMessage(kind,message){const url=kind==='sms'?process.env.SMS_PROVIDER_URL:process.env.EMAIL_PROVIDER_URL; if(!url) return {status:'NOT_CONFIGURED'}; return {status:'SENT',provider:await postJson(url,message,{authorization:`Bearer ${process.env[`${kind.toUpperCase()}_PROVIDER_TOKEN`]||''}`})};}
async function razorpayCreateSubscription(plan){if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)return {status:'NOT_CONFIGURED'};const auth=Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');return {status:'CREATED',subscription:await postJson('https://api.razorpay.com/v1/subscriptions',plan,{authorization:`Basic ${auth}`})};}
async function razorpayVerifyWebhook(raw,signature){const secret=process.env.RAZORPAY_WEBHOOK_SECRET;if(!secret)return false;const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');const got=Buffer.from(String(signature||''));const want=Buffer.from(expected);return got.length===want.length&&crypto.timingSafeEqual(want,got);}
module.exports={sendWhatsApp,sendMessage,razorpayCreateSubscription,razorpayVerifyWebhook,webhookSignature,postJson};
