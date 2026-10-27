const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const dns = require('node:dns').promises;
const https = require('node:https');
const {FEATURES} = require('./featureRegistry');
const {upsertPlatformRecord,listPlatformRecords,getPlatformRecord,nextSequence,createTenant,updateApiKeyLastUsed,storeIdempotency} = require('../db/postgres');
const {sendWebhook:sendSecureWebhook,normalizeOrigin,isPublicAddress}=require('./services/webhookEgress');
const {evaluate,validate:validateFormula,deriveCalculatedTests,calculateEGFR,calculateLipidFractions,calculateFIB4} = require('./services/formulaEngine');
const {evaluateCopilot, generateDictationDraft} = require('./services/geminiCopilot');
const {verifyWebhook,verifyMetaSignature,handleIncomingMessage,sendWhatsAppCloudMessage} = require('./services/whatsappBot');
const {patientToFHIR,diagnosticReport,observation} = require('./services/fhir');
const {sendWhatsApp,sendMessage,razorpayCreateSubscription,razorpayVerifyWebhook,webhookSignature} = require('./services/integrations');
const {money,normalizeAge,calculatePricing,calculateDue,normalizePhone,buildUpiUri,makeLabelData,code128BSvg} = require('./services/opdService');
const QRCode = require('qrcode');
const {buildORU,buildORM} = require('./integrations/hl7');

function rid(prefix='ID'){return `${prefix}-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;}
function tenantOf(req){return req.auth?.tenantId||'default';}
function text(v,max=500){return String(v??'').trim().slice(0,max);}
function bool(v){return v===true || v==='true' || v===1 || v==='1';}
function hmac(secret,value){return crypto.createHmac('sha256',secret).update(value).digest('hex');}
function json(res,status,payload){return res.status(status).json(payload);}
function xmlAttribute(value){return String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
const OPD_IDEMPOTENCY_LOCKS=new Set();

function appBaseUrl(){
  const raw=String(process.env.APP_BASE_URL||'').trim();if(!raw)throw new Error('APP_BASE_URL is required for browser SSO.');
  const url=new URL(raw);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('APP_BASE_URL must be an HTTP(S) origin without credentials.');
  if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('Production SSO requires HTTPS.');
  return url.origin;
}
function ssoRedirect(kind){
  const path=kind==='OIDC'?'/api/auth/sso/oidc/callback':'/api/auth/sso/saml/acs';
  const raw=(kind==='OIDC'?process.env.OIDC_REDIRECT_URI:process.env.SAML_ACS_URL)||new URL(path,appBaseUrl()).href;
  const url=new URL(raw);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error(`${kind} redirect URL is invalid.`);
  if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error(`${kind} production redirect URL must use HTTPS.`);
  return url.href;
}
function safeFrontendRedirect(ticket,error){
  const url=new URL('/',appBaseUrl());if(ticket)url.searchParams.set('sso_ticket',ticket);if(error)url.searchParams.set('sso_error',error);return url.href;
}
function sealSecret(value){
  const key=crypto.createHash('sha256').update(String(process.env.AUTH_SECRET||'')).digest();const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}
function unsealSecret(value){
  if(!value)return '';try{const [iv,tag,encrypted]=String(value).split('.');const decipher=crypto.createDecipheriv('aes-256-gcm',crypto.createHash('sha256').update(String(process.env.AUTH_SECRET||'')).digest(),Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(encrypted,'base64url')),decipher.final()]).toString('utf8');}catch{throw new Error('Stored SSO client secret cannot be decrypted with the current AUTH_SECRET.');}
}
function identityKey(issuer,subject){return crypto.createHash('sha256').update(`${String(issuer)}\0${String(subject)}`).digest('hex');}
function ssoBindingCookieName(kind,state){return `hrgen_sso_${String(kind).toLowerCase()}_${crypto.createHash('sha256').update(String(state)).digest('hex').slice(0,20)}`;}
function readCookie(req,name){const header=String(req.get('cookie')||'');for(const part of header.split(';')){const i=part.indexOf('=');if(i<0)continue;if(part.slice(0,i).trim()===name)return decodeURIComponent(part.slice(i+1).trim());}return '';}
function setSsoBindingCookie(req,res,kind,state,value,maxAge=300){const uri=ssoRedirect(kind),path=kind==='OIDC'?'/api/auth/sso/oidc/callback':'/api/auth/sso/saml/acs',secure=new URL(uri).protocol==='https:',sameSite=kind==='SAML'?'None':'Lax';res.append('Set-Cookie',`${ssoBindingCookieName(kind,state)}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${secure?'; Secure':''}`);}
function onlyHttps(raw,label){const u=new URL(String(raw));if(u.protocol!=='https:'||u.username||u.password)throw new Error(`${label} must be an HTTPS URL without credentials.`);return u;}
async function pinnedHttpsFetch(input,init={}){
  const url=onlyHttps(input instanceof URL?input.href:(input?.url||input),'OIDC endpoint');
  const host=url.hostname.replace(/^\[|\]$/g,'').split('%')[0];
  const records=net.isIP(host)?[{address:host,family:net.isIP(host)}]:await dns.lookup(host,{all:true,verbatim:true});
  if(!records.length||records.some(x=>!isPublicAddress(x.address)))throw new Error('OIDC endpoint resolves to a private or reserved address.');
  const selected=records[0];
  const headers=new Headers(init.headers||input?.headers||{});const body=init.body??null;
  if(body!=null&&!headers.has('content-length'))headers.set('content-length',String(Buffer.byteLength(typeof body==='string'?body:body instanceof URLSearchParams?body.toString():Buffer.from(body))));
  const response=await new Promise((resolve,reject)=>{
    let deadline;
    const fail=error=>{clearTimeout(deadline);reject(error);};
    const req=https.request(url,{method:init.method||'GET',headers:Object.fromEntries(headers.entries()),lookup:(hostname,options,callback)=>{if(typeof options==='function'){callback=options;options={};}if(hostname.toLowerCase()!==host.toLowerCase())return callback(new Error('Unexpected OIDC DNS lookup.'));if(options?.all)return callback(null,[selected]);callback(null,selected.address,selected.family);},timeout:5000,maxHeaderSize:16*1024},res=>{
      const chunks=[];let bytes=0;res.on('data',chunk=>{bytes+=chunk.length;if(bytes>1024*1024){res.destroy(new Error('OIDC response exceeded size limit.'));return;}chunks.push(chunk);});
      res.on('end',()=>{clearTimeout(deadline);if(res.statusCode>=300&&res.statusCode<400)return reject(new Error('OIDC endpoint redirects are not allowed.'));const rh=new Headers();for(const [k,v] of Object.entries(res.headers))if(v!==undefined)rh.set(k,Array.isArray(v)?v.join(', '):String(v));resolve(new Response(Buffer.concat(chunks),{status:res.statusCode||502,headers:rh}));});res.on('error',fail);
    });
    req.on('timeout',()=>req.destroy(new Error('OIDC endpoint request timed out.')));deadline=setTimeout(()=>req.destroy(new Error('OIDC endpoint request exceeded its maximum duration.')),5000);req.on('error',fail);
    if(init.signal){if(init.signal.aborted){req.destroy(new Error('OIDC request aborted.'));return;}init.signal.addEventListener('abort',()=>req.destroy(new Error('OIDC request aborted.')),{once:true});}
    req.end(body==null?undefined:(body instanceof URLSearchParams?body.toString():body));
  });
  return response;
}
function samlStrategy(config,tenantId,deps){
  const {SAML,ValidateInResponseTo}=require('@node-saml/node-saml');
  const callbackUrl=ssoRedirect('SAML');
  if(new URL(callbackUrl).protocol!=='https:')throw new Error('SAML assertion consumer URL must use HTTPS.');
  const cacheProvider={
    saveAsync:async(key,value)=>{const ok=await deps.saveSsoArtifactOnce(tenantId,`saml-request:${key}`,'saml_request_cache',{value},new Date(Date.now()+8*60*60*1000));return ok?{value,createdAt:Date.now()}:null;},
    getAsync:async key=>{const x=await deps.getSsoArtifact(tenantId,`saml-request:${key}`,'saml_request_cache');return x?.value?.value||null;},
    removeAsync:async key=>{if(key)await deps.consumeSsoArtifact(tenantId,`saml-request:${key}`,'saml_request_cache');return null;}
  };
  return new SAML({entryPoint:String(config.entryPoint||''),issuer:String(config.entityId||''),callbackUrl,idpCert:String(config.idpCert||''),idpIssuer:String(config.idpIssuer||''),audience:String(config.audience||config.entityId||''),validateInResponseTo:ValidateInResponseTo.always,requestIdExpirationPeriodMs:8*60*60*1000,maxAssertionAgeMs:5*60*1000,acceptedClockSkewMs:120000,wantAssertionsSigned:true,wantAuthnResponseSigned:true,cacheProvider});
}
function validInternalAddress(value){return net.isIP(String(value))!==0&&!isPublicAddress(String(value));}
async function validateWebhookUrl(rawUrl,allowlist){
  const url=new URL(String(rawUrl));if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('Webhook destination must be HTTP(S) without embedded credentials.');
  const origin=normalizeOrigin(url.href),rule=(allowlist||[]).find(x=>normalizeOrigin(x.origin)===origin);
  if(url.protocol!=='https:'&&!(rule?.allowHttp===true&&url.protocol==='http:'))throw new Error('Webhook destination must use HTTPS unless an allowlisted internal origin explicitly permits HTTP.');
  const hostname=url.hostname.replace(/^\[|\]$/g,'').split('%')[0],records=net.isIP(hostname)?[{address:hostname}]:await dns.lookup(hostname,{all:true,verbatim:true});
  if(!records.length)throw new Error('Webhook destination did not resolve.');const allowed=new Set(rule?.addresses||[]);
  if(records.some(x=>!isPublicAddress(x.address)&&!allowed.has(x.address)))throw new Error('Webhook destination resolves to an unapproved private or reserved address.');
  if(rule?.addresses?.length&&records.some(x=>!rule.addresses.includes(x.address)))throw new Error('Webhook destination DNS does not match its exact allowlisted addresses.');
  return true;
}

const PLAN_CATALOG={
  STARTER:{name:'Starter',monthlyPaise:199900,maxSeats:5,maxBranches:1,maxReports:500,features:['PATIENT','BILLING','RESULTS','REPORTS','WHATSAPP_LINK','ENTITLEMENTS']},
  NABL_PRO:{name:'NABL Pro',monthlyPaise:599900,maxSeats:15,maxBranches:3,maxReports:3000,features:['PATIENT','BILLING','RESULTS','REPORTS','WHATSAPP_LINK','ENTITLEMENTS','NABL_PACK','QC','INVENTORY','MIS','PATIENT_PORTAL','COLLECTION','COMMISSIONS']},
  CHAIN:{name:'Chain',monthlyPaise:1499900,maxSeats:100,maxBranches:50,maxReports:25000,features:['*']},
  ENTERPRISE:{name:'Enterprise',monthlyPaise:0,maxSeats:1000,maxBranches:500,maxReports:1000000,features:['*']}
};
const MODULE_CATALOG=[
  ['dashboard','Command Center','CORE'],['opd','OPD Reception','PATIENT'],['patients','Patients','PATIENT'],['billing','Billing POS','BILLING'],['collection','Sample Collection','COLLECTION'],['barcode','Tube & Barcode','PATIENT'],['worklist','Result Workbench','RESULTS'],['analyzer','Analyzer Edge','ANALYZER'],['qc','QC / Westgard','QC'],['reports','Reports','REPORTS'],['pathologist','Pathologist','REPORTS'],['doctors','Doctor & Referral','COMMISSIONS'],['inventory','Inventory','INVENTORY'],['home','Home Collection','COLLECTION'],['b2b','B2B Network','B2B'],['finance','Finance & Closing','COMMISSIONS'],['analytics','MIS / Analytics','MIS'],['compliance','Compliance','NABL_PACK'],['audit','Audit Trail','CORE'],['integrations','Integrations','API'],['gia','GIA AI','AI'],['users','Users & Roles','ROLE_EDITOR'],['features','Feature Packs','ENTITLEMENTS'],['settings','Settings','CORE']
].map(([id,name,feature])=>({id,name,feature}));

function apiKeyAuthFactory(tenantRequest,lookup){return async(req,res,next)=>{const raw=text(req.get('x-api-key'),120);if(!raw)return res.status(401).json({error:'X-API-Key required'});const keyHash=hmac(process.env.AUTH_SECRET,raw);const key=await lookup(keyHash);if(!key)return res.status(401).json({error:'Invalid API key'});return tenantRequest(req,res,next,key.tenant_id,async()=>{req.auth={userId:null,username:key.name,role:'integration',tenantId:key.tenant_id,token:null,apiKeyId:key.id};await updateApiKeyLastUsed(key.tenant_id,keyHash);next();});};}

function registerPlatformRoutes(app,deps){
  const {auth,requireRole,requirePermission,actorOf,getDB,saveDB,appendAudit}=deps;
  const apiKeyAuth=apiKeyAuthFactory(deps.withTenantRequest,deps.findApiKeyByHash);
  const roles=['admin','pathologist','tech','phlebotomist'];
  const db=()=>getDB();
  async function tenantPlan(req){const sub=(await listPlatformRecords(tenantOf(req),'subscription'))[0];return PLAN_CATALOG[sub?.data?.plan||'STARTER'];}
  const FEATURE_ALIASES={
    'Employee login':'AUTH', 'Server-side RBAC':'RBAC', 'Employee lifecycle disable/revoke':'USER_LIFECYCLE', 'Patient CRUD':'PATIENT', 'Patient history':'PATIENT', 'Order/accession creation':'BILLING', 'Barcode generation':'PATIENT', 'Basic billing/payment capture':'BILLING', 'Result entry':'RESULTS', 'Analyzer result import':'ANALYZER', 'IQC':'QC', 'Westgard rules':'QC', 'Reagent lot':'INVENTORY', 'Calibration':'QC', 'Delta check':'AI', 'Critical result communication':'WHATSAPP_LINK', 'Technical validation gate':'RESULTS', 'Electronic sign-off':'REPORTS', 'Report release gate':'REPORTS', 'QR verification':'QR', 'Report amendment/versioning':'REPORTS', 'Immutable audit trail':'AUDIT', 'Backup/restore control':'BACKUP', 'Validation evidence store':'AUDIT', 'PWA cached shell':'OFFLINE', 'A4 report print':'REPORTS', 'WhatsApp report link':'WHATSAPP_LINK', 'Server test catalog':'PATIENT', 'Exact test-code matching':'PATIENT', 'Unit-aware panic limits':'RESULTS', 'PostgreSQL persistence':'CORE', 'Docker deployment':'CORE', 'Production fail-closed secrets':'CORE',

    'Multi-tenant + RLS':'TENANT', 'Compliance mode NABL/STANDARD':'NABL_PACK', 'Entitlements engine':'ENTITLEMENTS',
    'Hosted subscription/Razorpay':'SUBSCRIPTION', 'Offline signed on-prem license':'LICENSE', 'Tenant onboarding wizard':'ONBOARDING', 'Controlled data export':'EXPORT',
    'Workflow designer':'WORKFLOW', 'Report template designer':'REPORT_TEMPLATES', 'Custom test/panel/formula builder':'CUSTOM_TESTS', 'Role/permission editor':'ROLE_EDITOR', 'Custom fields':'CUSTOM_FIELDS',
    'DPDP consent/erasure/breach flow':'DPDP', 'ABDM/ABHA FHIR R4':'FHIR', 'NABL support pack ULR/MU/doc control/NC-CAPA':'NABL_PACK', 'GST-ready sequential invoicing':'BILLING',
    'ASTM/MLLP edge agent':'ANALYZER', 'Bidirectional analyzer worklist':'ANALYZER', 'Analyzer mapping UI':'ANALYZER', 'Validated auto-verification rules':'AUTO_VERIFY',
    'OTP patient portal':'PATIENT_PORTAL', 'WhatsApp provider templates + delivery status':'WHATSAPP', 'SMS/email delivery':'MESSAGING', 'Phlebotomist PWA + live GPS':'COLLECTION',
    'B2B collection-centre portal':'B2B', 'Hub-and-spoke branches':'BRANCHES', 'Franchise rate cards':'RATE_CARDS', 'Doctor commission + UPI payout':'COMMISSIONS', 'Inventory/PO/expiry':'INVENTORY',
    'MIS/TAT dashboards':'MIS', 'HL7 v2 ORM/ORU + FHIR bridge':'FHIR', 'OIDC/SAML SSO':'SSO', 'Public API + webhooks':'API', 'White-label/custom domains':'WHITE_LABEL',
    'SLA monitoring':'SLA', 'hi-IN voice scribe':'AI', 'LLM report summary human-in-loop':'AI', 'Delta/trend clinical alerts':'AI', 'True offline-first PWA':'OFFLINE',
    'Predictive reagent ordering':'AI'
  };
  function featureKey(name){return FEATURE_ALIASES[name]||String(name).toUpperCase().replace(/[^A-Z0-9]+/g,'_');}
  function requireFeature(name){return async(req,res,next)=>{const plan=await tenantPlan(req);if(plan.features.includes('*')||plan.features.includes(featureKey(name)))return next();return res.status(402).json({error:'Feature not enabled for plan',feature:name,requiredFeature:featureKey(name)});};}

  // 0/33 + registry proof surface
  app.get('/api/features',auth,async(req,res)=>json(res,200,{build:'v6.0.0-77BUILD',features:FEATURES.map(f=>({...f,status:'REGISTERED'})),count:FEATURES.length}));
  app.get('/api/dashboard/summary',auth,async(req,res)=>{
    const D=db(), tid=tenantOf(req), orders=(D.orders||[]).filter(x=>(x.tenantId||'default')===tid), patients=(D.patients||[]).filter(x=>(x.tenantId||'default')===tid);
    const today=new Date().toISOString().slice(0,10); const todayOrders=orders.filter(o=>String(o.createdAt||'').slice(0,10)===today);
    const pipeline={}; for(const o of orders)pipeline[o.pipelineStatus]=(pipeline[o.pipelineStatus]||0)+1;
    const critical=orders.reduce((n,o)=>n+(o.tests||[]).filter(t=>t.isPanic||t.status==='Critical').length,0);
    const revenue=todayOrders.reduce((n,o)=>n+Number(o.netPayable||0),0);
    const tat=todayOrders.filter(o=>o.releasedAt).map(o=>(new Date(o.releasedAt)-new Date(o.createdAt))/3600000).filter(Number.isFinite);
    res.json({tenantId:tid,patients:patients.length,orders:orders.length,todayOrders:todayOrders.length,todayRevenue:Number(revenue.toFixed(2)),critical,pipeline,avgTatHours:tat.length?Number((tat.reduce((a,b)=>a+b,0)/tat.length).toFixed(2)):null,alerts:{validationPending:pipeline.QC_APPROVED||0,tatBreaches:0,qcFailures:0,reagentExpiring:0}});
  });

  // 1.0 Multi-tenant + onboarding + compliance + entitlements + subscription + export
  app.post('/api/tenants',auth,requireRole('admin'),async(req,res)=>{
    const slug=text(req.body?.slug,63).toLowerCase().replace(/[^a-z0-9-]/g,'-'); const name=text(req.body?.name,120); const mode=String(req.body?.mode||'STANDARD').toUpperCase();
    if(!slug||!name||!['STANDARD','NABL'].includes(mode)) return json(res,400,{error:'slug,name,mode required'});
    if(await deps.resolveTenantBySlug(slug))return json(res,409,{error:'Tenant slug already exists'});
    const id=rid('TEN'),parentTenantId=tenantOf(req); await createTenant({id,slug,name,mode,data:{parentTenantId,createdBy:req.auth.userId}});
    await deps.withTenantTransaction(id,async()=>upsertPlatformRecord(id,'onboarding',`ONB-${id}`,{completed:false,steps:['identity','compliance','catalog','users','branding']}));
    appendAudit('TENANT_CREATED',null,actorOf(req),req.auth.role,`Tenant ${id} created`);await saveDB();res.status(201).json({id,slug,name,mode});
  });
  app.post('/api/tenants/:id/admin-invite',auth,requireRole('admin'),async(req,res)=>{
    const tid=text(req.params.id,80),parentTenantId=tenantOf(req),target=await deps.getTenantById(tid);if(!target||!(tid===parentTenantId||target.data?.parentTenantId===parentTenantId))return json(res,404,{error:'Tenant not found'});
    const username=text(req.body?.username,100),password=String(req.body?.password||'');if(!username||password.length<12)return json(res,400,{error:'username and 12+ character password required'});
    const create=async()=>{if((db().users||[]).some(u=>(u.tenantId||'default')===tid&&u.username===username))return null;const u={id:rid('USR'),tenantId:tid,username,role:'admin',status:'ACTIVE',passwordHash:await require('bcryptjs').hash(password,12),displayName:text(req.body?.displayName,120)||username,createdAt:new Date().toISOString()};db().users.push(u);appendAudit('TENANT_ADMIN_INVITED',null,actorOf(req),req.auth.role,`Admin ${username} provisioned for child tenant ${tid}`);await saveDB();return u;};
    const user=tid===parentTenantId?await create():await deps.withTenantTransaction(tid,create);if(!user)return json(res,409,{error:'User exists'});res.status(201).json({...user,passwordHash:undefined});
  });
  app.get('/api/tenants/current',auth,async(req,res)=>{const tid=tenantOf(req);const D=db();const t=(D.tenants||[]).find(x=>x.id===tid)||{id:tid,slug:tid,name:'Current Tenant',mode:'STANDARD',status:'ACTIVE'};const cfg=(await getPlatformRecord(tid,'compliance','CURRENT'))?.data||{};res.json({...t,compliance:cfg});});
  app.put('/api/tenants/current/compliance',auth,requireRole('admin'),async(req,res)=>{const tid=tenantOf(req);const mode=String(req.body?.mode||'STANDARD').toUpperCase();if(!['STANDARD','NABL'].includes(mode))return json(res,400,{error:'mode must be STANDARD or NABL'});const t=(db().tenants||[]).find(x=>x.id===tid);if(t)t.mode=mode;await upsertPlatformRecord(tid,'compliance','CURRENT',{mode,mandatory:['NABL'].includes(mode)?['ULR','MU','DOC_CONTROL','NC_CAPA','PATHOLOGIST_SIGNOFF','AUDIT']:[]});await saveDB();appendAudit('COMPLIANCE_MODE_CHANGED',null,actorOf(req),req.auth.role,`Tenant mode ${mode}`);res.json({mode});});
  app.post('/api/onboarding/complete',auth,requireRole('admin'),async(req,res)=>{const tid=tenantOf(req);const d={completed:true,completedAt:new Date().toISOString(),steps:req.body?.steps||[]};await upsertPlatformRecord(tid,'onboarding','CURRENT',d);appendAudit('ONBOARDING_COMPLETED',null,actorOf(req),req.auth.role,'Tenant onboarding marked complete');res.json(d);});
  app.get('/api/plans',auth,async(req,res)=>res.json({plans:PLAN_CATALOG}));
  app.get('/api/entitlements',auth,async(req,res)=>{const sub=(await listPlatformRecords(tenantOf(req),'subscription'))[0];const planKey=sub?.data?.plan||'STARTER';const plan=PLAN_CATALOG[planKey];const has=f=>plan.features.includes('*')||plan.features.includes(f);res.json({plan:planKey,features:FEATURES.map(f=>({id:f.id,name:f.name,phase:f.phase,key:featureKey(f.name),enabled:has(featureKey(f.name))})),modules:MODULE_CATALOG.map(m=>({...m,enabled:has(m.feature)})),limits:{seats:plan.maxSeats,branches:plan.maxBranches,reports:plan.maxReports}});});
  app.post('/api/subscriptions',auth,requireRole('admin'),async(req,res)=>{const plan=String(req.body?.plan||'STARTER').toUpperCase();if(!PLAN_CATALOG[plan])return json(res,400,{error:'Unknown plan'});if(!req.body?.razorpayPlanId && process.env.RAZORPAY_KEY_ID)return json(res,400,{error:'razorpayPlanId required when Razorpay is configured'});const rp=await razorpayCreateSubscription({plan_id:req.body?.razorpayPlanId||null,total_count:120,quantity:1,customer_notify:1,notes:{tenantId:tenantOf(req),plan}});const s={id:rid('SUB'),plan,status:rp.status==='NOT_CONFIGURED'?'PENDING_PROVIDER':'CREATED',provider:rp.status,payment:rp.subscription||null,graceUntil:req.body?.graceUntil||null,dunningStage:0,updatedAt:new Date().toISOString()};await upsertPlatformRecord(tenantOf(req),'subscription','CURRENT',s);appendAudit('SUBSCRIPTION_CHANGED',null,actorOf(req),req.auth.role,`Subscription ${plan} ${s.status}`);res.status(201).json(s);});
  app.put('/api/subscriptions/current',auth,requireRole('admin'),async(req,res)=>{const current=(await listPlatformRecords(tenantOf(req),'subscription'))[0];if(!current)return json(res,404,{error:'Subscription not found'});const next={...current.data,status:text(req.body?.status,40)||current.data.status,graceUntil:req.body?.graceUntil||current.data.graceUntil||null,dunningStage:Number(req.body?.dunningStage??current.data.dunningStage??0),updatedAt:new Date().toISOString()};const out=await upsertPlatformRecord(tenantOf(req),'subscription','CURRENT',next);appendAudit('SUBSCRIPTION_UPDATED',null,actorOf(req),req.auth.role,`Subscription status ${next.status}, dunning ${next.dunningStage}`);res.json(out);});
  app.get('/api/metering',auth,async(req,res)=>{const D=db(),tid=tenantOf(req),users=(D.users||[]).filter(u=>(u.tenantId||'default')===tid&&u.status!=='DISABLED').length,branches=(await listPlatformRecords(tid,'branch')).length,month=new Date().toISOString().slice(0,7),reports=(D.orders||[]).filter(o=>(o.tenantId||'default')===tid&&o.pipelineStatus==='RELEASED'&&String(o.releasedAt||'').slice(0,7)===month).length;const plan=await tenantPlan(req);res.json({month,usage:{seats:users,branches,reports},limits:{seats:plan.maxSeats,branches:plan.maxBranches,reports:plan.maxReports}});});
  app.post('/api/subscriptions/webhook',async(req,res)=>{const raw=req.bodyRaw||JSON.stringify(req.body||{});const sig=req.get('x-razorpay-signature');const ok=await razorpayVerifyWebhook(raw,sig);if(!ok)return json(res,401,{error:'Invalid webhook signature'});res.json({received:true});});
  app.get('/api/license',auth,async(req,res)=>{const d=(await getPlatformRecord(tenantOf(req),'license','CURRENT'))?.data||null;res.json({configured:!!d,license:d});});
  app.post('/api/license/verify',auth,async(req,res)=>{const license=req.body?.license||req.body;const pub=process.env.LICENSE_PUBLIC_KEY||'';if(!pub)return json(res,503,{status:'NOT_CONFIGURED',error:'LICENSE_PUBLIC_KEY required'});const payload=Buffer.from(JSON.stringify(license.payload||{}));const sig=Buffer.from(String(license.signature||''),'base64url');let valid=false;try{valid=crypto.verify(null,payload,{key:pub,format:'pem',type:'spki'},sig);}catch{}const now=new Date(); const expiry=license.payload?.expiresAt?new Date(license.payload.expiresAt):null; const amc=license.payload?.amcUntil?new Date(license.payload.amcUntil):null; const validTime=(!expiry||expiry>=now)&&(!amc||amc>=now); valid=valid&&validTime; if(valid)await upsertPlatformRecord(tenantOf(req),'license','CURRENT',license.payload,'ACTIVE');res.json({valid,expiresAt:license.payload?.expiresAt||null,amcUntil:license.payload?.amcUntil||null});});
  app.get('/api/export',auth,requireRole('admin'),async(req,res)=>{const D=db(),tid=tenantOf(req);const payload={exportedAt:new Date().toISOString(),tenantId:tid,patients:(D.patients||[]).filter(x=>(x.tenantId||'default')===tid),orders:(D.orders||[]).filter(x=>(x.tenantId||'default')===tid),catalog:(D.testCatalog||[]).filter(x=>(x.tenantId||'default')===tid)};appendAudit('DATA_EXPORT',null,actorOf(req),req.auth.role,'Tenant data export generated');res.json(payload);});

  app.get('/api/users',auth,requireRole('admin'),async(req,res)=>{const D=db();res.json({users:(D.users||[]).filter(u=>(u.tenantId||'default')===tenantOf(req)).map(u=>({id:u.id,username:u.username,role:u.role,status:u.status,displayName:u.displayName,createdAt:u.createdAt}))});});

  // 1.5 customization
  app.get('/api/workflows',auth,async(req,res)=>res.json({workflows:await listPlatformRecords(tenantOf(req),'workflow')}));
  app.post('/api/workflows',auth,requireRole('admin'),async(req,res)=>{const id=rid('WF');const data={name:text(req.body?.name,120)||'Default',version:1,steps:req.body?.steps||['DRAFT','RESULTS_ENTERED','QC_APPROVED','VALIDATED','SIGNOFF','RELEASED'],roles:req.body?.roles||roles,requiredFields:req.body?.requiredFields||[]};const mandatory=['QC_APPROVED','VALIDATED','SIGNOFF','RELEASED'];if(String((await getPlatformRecord(tenantOf(req),'compliance','CURRENT'))?.data?.mode||'STANDARD')==='NABL' && mandatory.some(x=>data.steps.includes(x)===false))return json(res,409,{error:'NABL mandatory workflow gates cannot be removed'});res.status(201).json(await upsertPlatformRecord(tenantOf(req),'workflow',id,data));});
  app.get('/api/report-templates',auth,async(req,res)=>res.json({templates:await listPlatformRecords(tenantOf(req),'report_template')}));
  app.post('/api/report-templates',auth,requireRole('admin','pathologist'),async(req,res)=>{const id=rid('TPL');const data={name:text(req.body?.name,120)||'Default',version:1,html:text(req.body?.html,20000),css:text(req.body?.css,20000),fields:req.body?.fields||['patient','tests','signoff','qr']};res.status(201).json(await upsertPlatformRecord(tenantOf(req),'report_template',id,data));});
  app.get('/api/panels',auth,async(req,res)=>res.json({panels:await listPlatformRecords(tenantOf(req),'panel')}));
  app.post('/api/panels',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'panel',rid('PANEL'),{name:text(req.body?.name,160),codes:Array.isArray(req.body?.codes)?req.body.codes:[],price:Number(req.body?.price||0),active:true})));
  app.post('/api/custom-tests',auth,requireRole('admin'),async(req,res)=>{const code=text(req.body?.code,40).toUpperCase();const expr=text(req.body?.formula,500);const variables=Array.isArray(req.body?.variables)?req.body.variables:[];if(!code||!text(req.body?.name,160))return json(res,400,{error:'code and name required'});if(expr&&!validateFormula(expr,variables).valid)return json(res,400,{error:'Invalid formula'});const item={code,name:text(req.body.name,160),department:text(req.body.department,80),unit:text(req.body.unit,40),reference:text(req.body.reference,200),price:Number(req.body.price||0),active:true,formula:expr||null,formulaVariables:variables};const D=db();if(D.testCatalog.some(x=>(x.tenantId||tenantOf(req))===tenantOf(req)&&x.code===code))return json(res,409,{error:'Test code exists'});item.tenantId=tenantOf(req);D.testCatalog.push(item);await saveDB();appendAudit('CUSTOM_TEST_CREATED',null,actorOf(req),req.auth.role,`Custom test ${code}`);res.status(201).json(item);});
  app.post('/api/formulas/evaluate',auth,requireRole('admin','tech','pathologist'),async(req,res)=>{try{res.json({value:evaluate(req.body?.formula,req.body?.variables||{})})}catch(e){json(res,400,{error:e.message})}});
  const BUILTIN_ROLES=new Set(['admin','pathologist','tech','phlebotomist']);
  const PROTECTED_PERMISSIONS=new Set(['REPORT_SIGNOFF','REPORT_RELEASE','QC_APPROVE','AUDIT_VERIFY','USER_ADMIN','ROLE_ADMIN','TENANT_ADMIN']);
  function validateRolePermissionPayload(body){
    const role=text(body?.role,40).toLowerCase();
    const allow=Array.isArray(body?.allow)?body.allow:(Array.isArray(body?.permissions)?body.permissions:[]);
    const deny=Array.isArray(body?.deny)?body.deny:[];
    const inherits=Array.isArray(body?.inherits)?body.inherits.map(x=>String(x).trim().toLowerCase()).filter(Boolean):[];
    if(!/^[a-z][a-z0-9_-]{1,39}$/.test(role)) return {error:'Invalid role identifier'};
    if(inherits.includes(role)) return {error:'Role cannot inherit itself'};
    if(inherits.some(x=>!BUILTIN_ROLES.has(x)&&!/^custom[-_a-z0-9]{0,32}$/.test(x))) return {error:'Invalid inherited role identifier'};
    const A=[...new Set(allow.map(x=>String(x).trim().toUpperCase()).filter(Boolean))];
    const D=[...new Set(deny.map(x=>String(x).trim().toUpperCase()).filter(Boolean))];
    if(A.some(x=>x.length>80)||D.some(x=>x.length>80)) return {error:'Permission key too long'};
    if(A.includes('*') && role!=='admin') return {error:'Wildcard permission is reserved for admin'};
    return {value:{role,allow:A,deny:D,inherits,permissions:A}};
  }
  app.get('/api/permissions',auth,requireRole('admin'),async(req,res)=>res.json({permissions:await listPlatformRecords(tenantOf(req),'role_permission')}));
  app.get('/api/permissions/effective/:role',auth,requireRole('admin'),async(req,res)=>{
    const role=text(req.params.role,40).toLowerCase(), records=await listPlatformRecords(tenantOf(req),'role_permission');
    const by=new Map(records.map(r=>[String(r.data?.role||'').toLowerCase(),r.data||{}])); const seen=new Set(),chain=[],allow=new Set(),deny=new Set();
    const walk=r=>{if(seen.has(r))return;seen.add(r);const d=by.get(r);if(!d)return;chain.push(r);for(const x of (d.allow||d.permissions||[]))allow.add(String(x).toUpperCase());for(const x of (d.deny||[]))deny.add(String(x).toUpperCase());for(const x of (d.inherits||[]))walk(String(x).toLowerCase());}; walk(role);
    res.json({role,tenantId:tenantOf(req),chain,allow:[...allow],deny:[...deny],effectiveAllow:[...allow].filter(x=>!deny.has(x))});
  });
  app.post('/api/permissions',auth,requireRole('admin'),async(req,res)=>{
    const parsed=validateRolePermissionPayload(req.body); if(parsed.error)return json(res,400,{error:parsed.error}); const d=parsed.value;
    if(BUILTIN_ROLES.has(d.role) && d.role==='admin' && d.deny.some(x=>PROTECTED_PERMISSIONS.has(x))) return json(res,409,{error:'Protected admin permissions cannot be denied'});
    const existing=await getPlatformRecord(tenantOf(req),'role_permission',`RP-${d.role}`);
    const old=existing?.data||{}; const changed=JSON.stringify(old)!==JSON.stringify(d);
    if(existing && !changed)return res.json(existing);
    const out=await upsertPlatformRecord(tenantOf(req),'role_permission',`RP-${d.role}`,{...d,changedBy:actorOf(req),changedAt:new Date().toISOString()});
    appendAudit('ROLE_PERMISSION_CHANGED',null,actorOf(req),req.auth.role,`role=${d.role}; allow=${d.allow.join(',')}; deny=${d.deny.join(',')}; inherits=${d.inherits.join(',')}`);
    res.status(existing?200:201).json(out);
  });
  app.get('/api/custom-fields',auth,async(req,res)=>res.json({fields:await listPlatformRecords(tenantOf(req),'custom_field')}));
  app.post('/api/custom-fields',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'custom_field',rid('CF'),{entity:text(req.body?.entity,40),key:text(req.body?.key,64),label:text(req.body?.label,120),type:text(req.body?.type,30)||'text',required:bool(req.body?.required)})));

  app.post('/api/billing/payments',auth,requireRole('admin','tech'),async(req,res)=>{const invoiceId=text(req.body?.invoiceId,100),amount=Math.max(0,Number(req.body?.amount||0));if(!invoiceId||!amount)return json(res,400,{error:'invoiceId and positive amount required'});const inv=await getPlatformRecord(tenantOf(req),'invoice',invoiceId);if(!inv)return json(res,404,{error:'Invoice not found'});const paid=Number(inv.data.paid||0)+amount;const net=Number(inv.data.net||0);inv.data={...inv.data,paid,balance:Math.max(0,net-paid),paymentMode:text(req.body?.paymentMode,30)||'Cash',lastPaymentAt:new Date().toISOString()};const out=await upsertPlatformRecord(tenantOf(req),'invoice',inv.id,inv.data);appendAudit('PAYMENT_CAPTURED',inv.data.orderId,actorOf(req),req.auth.role,`${invoiceId} amount ${amount}`);res.status(201).json(out);});
  app.post('/api/billing/refunds',auth,requireRole('admin'),async(req,res)=>{const invoiceId=text(req.body?.invoiceId,100),amount=Math.max(0,Number(req.body?.amount||0));const inv=await getPlatformRecord(tenantOf(req),'invoice',invoiceId);if(!inv)return json(res,404,{error:'Invoice not found'});const refunded=Number(inv.data.refunded||0)+amount;inv.data={...inv.data,refunded,balance:Number(inv.data.balance||0)+amount};const out=await upsertPlatformRecord(tenantOf(req),'invoice',inv.id,inv.data);appendAudit('REFUND_RECORDED',inv.data.orderId,actorOf(req),req.auth.role,`${invoiceId} amount ${amount}`);res.status(201).json(out);});
  app.get('/api/billing/outstanding',auth,requireRole('admin','tech'),async(req,res)=>{const inv=await listPlatformRecords(tenantOf(req),'invoice');res.json({outstanding:inv.filter(x=>Number(x.data.balance||0)>0)});});
  app.get('/api/billing/receipt/:invoiceId',auth,requireRole('admin','tech','pathologist'),async(req,res)=>{const inv=await getPlatformRecord(tenantOf(req),'invoice',req.params.invoiceId);if(!inv)return json(res,404,{error:'Invoice not found'});res.json({receipt:inv.data});});

  // 2.0 compliance / data / FHIR / NABL / GST
  app.post('/api/dpdp/consent',auth,requireRole('admin','pathologist','phlebotomist'),async(req,res)=>{const d={patientId:text(req.body?.patientId,80),purpose:text(req.body?.purpose,160),basis:text(req.body?.basis,80),status:bool(req.body?.granted)?'GRANTED':'REVOKED',capturedAt:new Date().toISOString(),version:text(req.body?.version,30)||'1.0'};const r=await upsertPlatformRecord(tenantOf(req),'dpdp_consent',rid('CONS'),d);appendAudit('DPDP_CONSENT',d.patientId,actorOf(req),req.auth.role,d.status);res.status(201).json(r);});
  app.post('/api/dpdp/erasure-request',auth,requireRole('admin'),async(req,res)=>{const d={patientId:text(req.body?.patientId,80),reason:text(req.body?.reason,500),status:'REQUESTED',requestedAt:new Date().toISOString()};const r=await upsertPlatformRecord(tenantOf(req),'dpdp_erasure',rid('ERASE'),d);appendAudit('DPDP_ERASURE_REQUEST',d.patientId,actorOf(req),req.auth.role,'Erasure requested; regulatory retention must be assessed');res.status(201).json(r);});
  app.post('/api/dpdp/breach',auth,requireRole('admin'),async(req,res)=>{const r=await upsertPlatformRecord(tenantOf(req),'dpdp_breach',rid('BREACH'),{severity:text(req.body?.severity,30),summary:text(req.body?.summary,1000),detectedAt:new Date().toISOString(),status:'OPEN'});appendAudit('DPDP_BREACH_RECORDED',null,actorOf(req),req.auth.role,'Data breach record created');res.status(201).json(r);});
  app.get('/api/fhir/patient/:id',auth,requireRole('admin','pathologist','tech','phlebotomist'),async(req,res)=>{const p=db().patients.find(x=>x.id===req.params.id&&(x.tenantId||tenantOf(req))===tenantOf(req));if(!p)return json(res,404,{error:'Patient not found'});res.json(patientToFHIR(p));});
  app.get('/api/fhir/DiagnosticReport/:id',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{const D=db(),o=D.orders.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tenantOf(req)&&x.pipelineStatus==='RELEASED');if(!o)return json(res,404,{error:'Released report not found'});const p=D.patients.find(x=>x.id===o.patientId&&(x.tenantId||'default')===tenantOf(req));if(!p)return json(res,404,{error:'Patient not found'});res.json(diagnosticReport(o,p,process.env.LAB_NAME||'Configured Laboratory'));});
  app.get('/api/fhir/Observation/:orderId',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{const D=db(),o=D.orders.find(x=>x.id===req.params.orderId&&(x.tenantId||'default')===tenantOf(req)&&x.pipelineStatus==='RELEASED');if(!o)return json(res,404,{error:'Released report not found'});const p=D.patients.find(x=>x.id===o.patientId&&(x.tenantId||'default')===tenantOf(req));if(!p)return json(res,404,{error:'Patient not found'});res.json((o.tests||[]).map((t,i)=>observation(o,t,i,p)));});
  app.post('/api/nabl/ulr',auth,requireRole('admin','pathologist'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'nabl_ulr',rid('ULR'),{reportId:text(req.body?.reportId,80),ulr:text(req.body?.ulr,120),issuedAt:new Date().toISOString()})));
  app.post('/api/nabl/mu',auth,requireRole('admin','pathologist'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'nabl_mu',rid('MU'),{testCode:text(req.body?.testCode,40),value:req.body?.value,unit:text(req.body?.unit,40),uncertainty:req.body?.uncertainty,coverageFactor:req.body?.coverageFactor,method:text(req.body?.method,200),evidenceRef:text(req.body?.evidenceRef,200)})));
  app.post('/api/nabl/documents',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'nabl_document',rid('DOC'),{title:text(req.body?.title,160),version:text(req.body?.version,30),status:text(req.body?.status,30)||'DRAFT',effectiveFrom:req.body?.effectiveFrom||null,reviewDue:req.body?.reviewDue||null,owner:text(req.body?.owner,100)})));
  app.post('/api/nabl/nc-capa',auth,requireRole('admin','pathologist'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'nabl_nc_capa',rid('NC'),{type:text(req.body?.type,30),severity:text(req.body?.severity,30),summary:text(req.body?.summary,1000),rootCause:text(req.body?.rootCause,1000),correctiveAction:text(req.body?.correctiveAction,1000),status:'OPEN'})));
  app.post('/api/billing/invoice',auth,requireRole('admin','tech','pathologist'),async(req,res)=>{const invoiceNumber=await nextSequence(tenantOf(req),'INVOICE','INV');const d={invoiceNumber,orderId:text(req.body?.orderId,80),gross:Number(req.body?.gross||0),discount:Number(req.body?.discount||0),tax: req.body?.tax||{cgst:0,sgst:0,igst:0},net:Number(req.body?.net||0),status:text(req.body?.status,30)||'ISSUED',issuedAt:new Date().toISOString()};const r=await upsertPlatformRecord(tenantOf(req),'invoice',invoiceNumber,d);appendAudit('INVOICE_ISSUED',d.orderId,actorOf(req),req.auth.role,invoiceNumber);res.status(201).json(r);});

  // 2.5 instruments / mappings / auto-verification
  app.get('/api/analyzer/mappings',auth,async(req,res)=>res.json({mappings:await listPlatformRecords(tenantOf(req),'analyzer_mapping')}));
  app.post('/api/analyzer/mappings',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'analyzer_mapping',rid('MAP'),{instrumentId:text(req.body?.instrumentId,80),analyzerCode:text(req.body?.analyzerCode,80),testCode:text(req.body?.testCode,40),unit:text(req.body?.unit,40),method:text(req.body?.method,120),active:true})));
  app.get('/api/analyzer/worklist/:orderId',auth,requireRole('admin','tech'),async(req,res)=>{const D=db(),o=D.orders.find(x=>x.id===req.params.orderId&&(x.tenantId||tenantOf(req))===tenantOf(req));if(!o)return json(res,404,{error:'Order not found'});res.json({message:buildORM({controlId:rid('ORM'),patientId:o.patientId,orderId:o.id,tests:o.tests||[]}),protocol:'HL7v2 ORM^O01'});});
  app.post('/api/analyzer/worklist/send',auth,requireRole('admin','tech'),async(req,res)=>{const D=db(),o=D.orders.find(x=>x.id===text(req.body?.orderId,80)&&(x.tenantId||'default')===tenantOf(req));if(!o)return json(res,404,{error:'Order not found'});const host=String(process.env.ANALYZER_MLLP_HOST||'').trim();const port=Number(process.env.ANALYZER_MLLP_PORT||2575);if(!host)return json(res,503,{status:'NOT_CONFIGURED',message:'Analyzer MLLP destination is not configured by the server operator.'});if(!Number.isInteger(port)||port<1||port>65535)return json(res,503,{status:'NOT_CONFIGURED',message:'Analyzer MLLP port is invalid.'});const message=buildORM({controlId:rid('ORM'),patientId:o.patientId,orderId:o.id,tests:o.tests||[]});const framed=Buffer.concat([Buffer.from([0x0b]),Buffer.from(message),Buffer.from([0x1c,0x0d])]);await new Promise((resolve,reject)=>{let settled=false;const done=error=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve();};const socket=net.createConnection({host,port});const timer=setTimeout(()=>{socket.destroy(new Error('Analyzer connection timed out.'));done(new Error('Analyzer connection timed out.'));},5000);socket.once('connect',()=>{socket.write(framed,error=>{if(error)return done(error);socket.end();done();});});socket.once('error',done);});appendAudit('ANALYZER_WORKLIST_SENT',o.id,actorOf(req),req.auth.role,`ORM sent to configured analyzer ${host}:${port}`);res.json({status:'SENT',host,port});});
  app.post('/api/analyzer/auto-verify/:orderId',auth,requireRole('admin','tech','pathologist'),async(req,res)=>{const o=db().orders.find(x=>x.id===req.params.orderId&&(x.tenantId||tenantOf(req))===tenantOf(req));if(!o)return json(res,404,{error:'Order not found'});const reasons=[];if(!(o.qc?.westgardStatus==='PASS'))reasons.push('QC not PASS');if((o.tests||[]).some(t=>!t.value||t.value==='Pending'||t.isPanic))reasons.push('Result/critical exception');const deltas=(o.deltaChecks||[]).filter(x=>x.result?.status==='REVIEW');if(deltas.length)reasons.push('Delta REVIEW');const eligible=!reasons.length;await upsertPlatformRecord(tenantOf(req),'auto_verify_run',rid('AV'),{orderId:o.id,eligible,reasons,executedAt:new Date().toISOString(),policyVersion:'AUTO-VERIFY-v1'});if(eligible)o.autoVerifiedAt=new Date().toISOString();await saveDB();res.json({eligible,reasons,orderId:o.id});});

  // 3.0 patient/communication/collection/B2B
  const signPortalGrant=(kind,tid,nonce)=>{const body=`p1.${kind}.${Buffer.from(`${tid}\n${nonce}`).toString('base64url')}`;return `${body}.${hmac(process.env.AUTH_SECRET,`portal:${body}`)}`;};
  const verifyPortalGrant=(kind,token)=>{const parts=String(token||'').split('.');if(parts.length!==4||parts[0]!=='p1'||parts[1]!==kind)return null;const body=`${parts[0]}.${parts[1]}.${parts[2]}`;if(!sameSecret(hmac(process.env.AUTH_SECRET,`portal:${body}`),parts[3]))return null;try{const [tenantId,nonce]=Buffer.from(parts[2],'base64url').toString('utf8').split('\n');return tenantId&&nonce?{tenantId,nonce}:null;}catch{return null;}};
  app.post('/api/portal/otp/request',async(req,res)=>{
    const tenant=await deps.resolveTenantBySlug(text(req.body?.tenantSlug,80).toLowerCase());if(!tenant)return json(res,404,{error:'Patient or tenant not found'});const phone=text(req.body?.phone,32),otp=String(crypto.randomInt(100000,1000000));
    const challenge=await deps.withTenantTransaction(tenant.id,async()=>{const patient=(db().patients||[]).find(x=>x.phone===phone&&x.active!==false&&(x.tenantId||'default')===tenant.id);if(!patient)return null;const id=rid('OTP'),data={id,patientId:patient.id,otpHash:hmac(process.env.AUTH_SECRET,otp),expiresAt:new Date(Date.now()+5*60000).toISOString(),attempts:0};await upsertPlatformRecord(tenant.id,'portal_otp',id,data);return {id,phone:patient.phone};});
    if(!challenge)return json(res,404,{error:'Patient or tenant not found'});const delivery=await sendMessage('sms',{to:challenge.phone,template:'portal_otp',variables:{otp}});const challengeId=signPortalGrant('otp',tenant.id,challenge.id);if(process.env.NODE_ENV!=='production'&&process.env.DEV_OTP_MODE==='true')return res.json({challengeId,delivery,devOtp:otp});return res.json({challengeId,delivery});
  });
  app.post('/api/portal/otp/verify',async(req,res)=>{
    const grant=verifyPortalGrant('otp',text(req.body?.challengeId,2000));if(!grant)return json(res,401,{error:'OTP challenge is invalid or expired.'});
    const result=await deps.withTenantTransaction(grant.tenantId,async()=>{const r=await getPlatformRecord(grant.tenantId,'portal_otp',grant.nonce);if(!r||r.status==='USED')return {status:'missing'};const d=r.data;if(new Date(d.expiresAt)<new Date()||d.attempts>=5)return {status:'expired'};d.attempts++;if(!sameSecret(d.otpHash,hmac(process.env.AUTH_SECRET,String(req.body?.otp||'')))){await upsertPlatformRecord(grant.tenantId,'portal_otp',r.id,d);return {status:'invalid'};}await upsertPlatformRecord(grant.tenantId,'portal_otp',r.id,{...d,usedAt:new Date().toISOString()},'USED');const nonce=crypto.randomBytes(32).toString('base64url'),token=signPortalGrant('session',grant.tenantId,nonce);await upsertPlatformRecord(grant.tenantId,'portal_session',nonce,{patientId:d.patientId,tokenHash:hmac(process.env.AUTH_SECRET,token),expiresAt:new Date(Date.now()+30*60000).toISOString()});return {status:'ok',token};});
    if(result.status==='missing')return json(res,404,{error:'OTP challenge not found.'});if(result.status==='expired')return json(res,401,{error:'OTP expired.'});if(result.status!=='ok')return json(res,401,{error:'Invalid OTP.'});return res.json({token:result.token});
  });
  app.get('/api/portal/me/orders',async(req,res)=>{
    const authz=req.get('authorization')||'',raw=authz.startsWith('Bearer ')?authz.slice(7):'',grant=verifyPortalGrant('session',raw);if(!grant)return json(res,401,{error:'Portal session is invalid or expired.'});
    return deps.withTenantRequest(req,res,()=>{},grant.tenantId,async()=>{const sess=await getPlatformRecord(grant.tenantId,'portal_session',grant.nonce);if(!sess||sess.data?.tokenHash!==hmac(process.env.AUTH_SECRET,raw)||new Date(sess.data.expiresAt)<=new Date())return json(res,401,{error:'Portal session is invalid or expired.'});const orders=(db().orders||[]).filter(o=>o.patientId===sess.data.patientId&&(o.tenantId||'default')===grant.tenantId&&o.pipelineStatus==='RELEASED');return res.json({orders:orders.map(o=>({id:o.id,barcode:o.barcode,releasedAt:o.releasedAt,verificationToken:o.verificationToken,tests:(o.tests||[]).map(t=>({code:t.code,name:t.name,value:t.value,unit:t.unit,status:t.status}))}))});});
  });
  app.get('/api/communications/templates',auth,async(req,res)=>res.json({templates:await listPlatformRecords(tenantOf(req),'message_template')}));
  app.post('/api/communications/templates',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'message_template',rid('TPLMSG'),{channel:text(req.body?.channel,20),name:text(req.body?.name,100),body:text(req.body?.body,4000),active:true})));
  app.post('/api/communications/send',auth,requireRole('admin','tech','pathologist','phlebotomist'),async(req,res)=>{const channel=text(req.body?.channel,20).toLowerCase();const msg={to:text(req.body?.to,100),template:text(req.body?.template,120),variables:req.body?.variables||{},createdAt:new Date().toISOString()};let result={status:'NOT_CONFIGURED'};if(channel==='whatsapp')result=await sendWhatsApp(msg);else if(channel==='sms'||channel==='email')result=await sendMessage(channel,msg);const r=await upsertPlatformRecord(tenantOf(req),'communication',rid('COM'),{...msg,channel,status:result.status,provider:result});appendAudit('COMMUNICATION',null,actorOf(req),req.auth.role,`${channel} ${result.status}`);res.status(result.status==='SENT'?201:503).json(r);});
  app.post('/api/collection/jobs',auth,requireRole('admin','tech','phlebotomist'),requireFeature('Phlebotomist PWA + live GPS'),async(req,res)=>{const r=await upsertPlatformRecord(tenantOf(req),'collection_job',rid('JOB'),{patientId:text(req.body?.patientId,80),address:text(req.body?.address,500),collectorId:text(req.body?.collectorId,80),status:'ASSIGNED',scheduledAt:req.body?.scheduledAt||null,createdAt:new Date().toISOString(),latitude:req.body?.latitude??null,longitude:req.body?.longitude??null});res.status(201).json(r);});
  app.patch('/api/collection/jobs/:id',auth,requireRole('admin','phlebotomist'),async(req,res)=>{const r=await getPlatformRecord(tenantOf(req),'collection_job',req.params.id);if(!r)return json(res,404,{error:'Job not found'});r.data={...r.data,status:text(req.body?.status,30)||r.data.status,latitude:req.body?.latitude??r.data.latitude,longitude:req.body?.longitude??r.data.longitude,updatedAt:new Date().toISOString()};const out=await upsertPlatformRecord(tenantOf(req),'collection_job',r.id,r.data,r.status);res.json(out);});
  app.get('/api/collection/jobs',auth,requireFeature('Phlebotomist PWA + live GPS'),async(req,res)=>res.json({jobs:await listPlatformRecords(tenantOf(req),'collection_job')}));
  app.post('/api/b2b/clients',auth,requireRole('admin'),requireFeature('B2B collection-centre portal'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'b2b_client',rid('B2B'),{name:text(req.body?.name,160),code:text(req.body?.code,50),phone:text(req.body?.phone,32),email:text(req.body?.email,120),status:'ACTIVE',rateCardId:text(req.body?.rateCardId,80)})));
  app.post('/api/b2b/orders',auth,requireRole('admin','tech'),requireFeature('B2B collection-centre portal'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'b2b_order',rid('B2O'),{clientId:text(req.body?.clientId,80),externalRef:text(req.body?.externalRef,120),patientId:text(req.body?.patientId,80),orderId:text(req.body?.orderId,80),status:'RECEIVED',receivedAt:new Date().toISOString()})));

  // LEVEL 1 — ADMIN CUSTOMIZATION / EFFECTIVE POLICY
  const POLICY_DEFAULTS={
    workflow:{enabled:true,mode:'STANDARD',steps:['REGISTRATION','BILLING','COLLECTION','ACCESSION','RESULT','QC','TECH_VERIFY','PATH_SIGNOFF','RELEASE'],skipAllowed:[],mandatorySteps:['REGISTRATION','BILLING','COLLECTION','RESULT','RELEASE']},
    barcode:{enabled:true,required:false,format:'CODE128',prefix:'LAB',widthMm:50,heightMm:25,includePatientName:true,includeUHID:true,includeTests:true},
    accession:{enabled:true,required:false,format:'SEQUENTIAL',prefix:'ACC',allowManual:false},
    labels:{enabled:true,required:false,widthMm:50,heightMm:25,showBarcode:true,showTubeType:true,showPatient:true,showTests:true},
    print:{report:'A4',invoice:'A4',label:'THERMAL_50X25',autoPrint:false,allowReprint:true},
    rights:{roles:{admin:['*'],pathologist:['PATIENT_VIEW','RESULT_VIEW','RESULT_VERIFY','REPORT_SIGNOFF','REPORT_RELEASE'],tech:['PATIENT_VIEW','ORDER_CREATE','RESULT_ENTRY','QC_RUN','TECH_VERIFY'],phlebotomist:['PATIENT_VIEW','COLLECTION','LABEL_PRINT']},customRoles:[]}
  };
  const POLICY_KEYS=Object.keys(POLICY_DEFAULTS);
  function mergePolicy(base,patch){
    const out=JSON.parse(JSON.stringify(base));
    for(const k of POLICY_KEYS){if(patch&&patch[k]&&typeof patch[k]==='object'&&!Array.isArray(patch[k]))out[k]={...out[k],...patch[k]};}
    return out;
  }
  function validatePolicy(policy,mode){
    const errors=[]; const p=policy||{};
    if(!p.workflow||!Array.isArray(p.workflow.steps))errors.push('workflow.steps required');
    if(!p.barcode||!['CODE128'].includes(String(p.barcode.format||'')))errors.push('barcode.format must be CODE128');
    for(const k of ['widthMm','heightMm'])if(!Number.isFinite(Number(p.barcode?.[k]))||Number(p.barcode[k])<=0)errors.push(`barcode.${k} invalid`);
    if(!p.labels||!Number.isFinite(Number(p.labels.widthMm))||!Number.isFinite(Number(p.labels.heightMm)))errors.push('labels dimensions required');
    if(p.labels?.required && p.labels?.enabled===false)errors.push('labels.required cannot be true when labels are disabled');
    if(p.barcode?.required && p.barcode?.enabled===false)errors.push('barcode.required cannot be true when barcode is disabled');
    if(!p.print||!['A4','A5','THERMAL_50X25','THERMAL_80'].includes(String(p.print.report)) && !p.print.report)errors.push('print.report invalid');
    const mandatory=['REGISTRATION','BILLING','RESULT','RELEASE'];
    if(String(mode).toUpperCase()==='NABL')mandatory.push('COLLECTION','QC','TECH_VERIFY','PATH_SIGNOFF','ACCESSION');
    const steps=new Set(p.workflow?.steps||[]), skipped=new Set(p.workflow?.skipAllowed||[]);
    for(const x of mandatory){if(!steps.has(x)||skipped.has(x))errors.push(`mandatory workflow step cannot be skipped: ${x}`);}
    return {valid:errors.length===0,errors};
  }
  async function effectivePolicy(req){
    const tid=tenantOf(req); const mode=String((db().tenants||[]).find(t=>t.id===tid)?.mode||'STANDARD').toUpperCase();
    const r=await getPlatformRecord(tid,'admin_policy','CURRENT'); return {tenantId:tid,mode,version:r?.version||0,policy:mergePolicy(POLICY_DEFAULTS,r?.data||{})};
  }
  app.get('/api/admin/policy',auth,requireRole('admin'),async(req,res)=>res.json(await effectivePolicy(req)));
  app.get('/api/admin/policy/history',auth,requireRole('admin'),async(req,res)=>res.json({history:await listPlatformRecords(tenantOf(req),'admin_policy_history')}));
  app.put('/api/admin/policy',auth,requireRole('admin'),async(req,res)=>{
    const tid=tenantOf(req); const current=await effectivePolicy(req); const mode=current.mode; const next=mergePolicy(current.policy,req.body||{}); const check=validatePolicy(next,mode);
    if(!check.valid)return json(res,400,{error:'Invalid policy',errors:check.errors});
    const now=new Date().toISOString(); const version=(current.version||0)+1;
    const saved=await upsertPlatformRecord(tid,'admin_policy','CURRENT',{...next,policyVersion:version,updatedAt:now,updatedBy:actorOf(req)});
    await upsertPlatformRecord(tid,'admin_policy_history',`V${version}`,{...next,policyVersion:version,changedAt:now,changedBy:actorOf(req),reason:text(req.body?.changeReason,300)||'Admin configuration change'});
    appendAudit('ADMIN_POLICY_CHANGED',null,actorOf(req),req.auth.role,`policyVersion=${version}`); await saveDB(); res.json({tenantId:tid,mode,version:saved.version,policy:saved.data});
  });
  app.post('/api/admin/policy/validate',auth,requireRole('admin'),async(req,res)=>{const current=await effectivePolicy(req);const candidate=mergePolicy(current.policy,req.body||{});res.json({...validatePolicy(candidate,current.mode),mode:current.mode,policy:candidate});});

  // PHASE B — OPD / PRE-ANALYTICAL: registration, basket, referral, payment, labels
  app.get('/api/opd/catalog',auth,requireRole('admin','pathologist','tech','phlebotomist'),async(req,res)=>{
    const tid=tenantOf(req), q=String(req.query?.q||'').trim().toUpperCase(), limit=Math.min(100,Math.max(1,Number(req.query?.limit||50)));
    const catalog=db().testCatalog.filter(x=>(x.tenantId||'default')===tid&&x.active!==false);
    const rows=(q?catalog.filter(x=>String(x.code).toUpperCase().includes(q)||String(x.name).toUpperCase().includes(q)||String(x.department||'').toUpperCase().includes(q)):catalog).slice(0,limit).map(x=>({code:x.code,name:x.name,department:x.department||'',unit:x.unit||'',reference:x.reference||'',price:money(x.price)}));
    res.json({catalog:rows,count:rows.length});
  });
  app.get('/api/opd/doctors',auth,requireRole('admin','pathologist','tech','phlebotomist'),async(req,res)=>res.json({doctors:await listPlatformRecords(tenantOf(req),'opd_doctor')}));
  app.post('/api/opd/doctors',auth,requireRole('admin','tech'),async(req,res)=>{
    const name=text(req.body?.name,160); if(!name)return json(res,400,{error:'Doctor name required'});
    const commissionType=String(req.body?.commissionType||'PERCENTAGE').toUpperCase(); const commissionValue=money(req.body?.commissionValue||0);
    if(!['PERCENTAGE','FIXED'].includes(commissionType)||commissionValue<0||(commissionType==='PERCENTAGE'&&commissionValue>100))return json(res,400,{error:'Invalid commission configuration'});
    const data={name,registrationNo:text(req.body?.registrationNo,80),specialty:text(req.body?.specialty,100),phone:text(req.body?.phone,32),commissionType,commissionValue,upiId:text(req.body?.upiId,120),active:true,createdAt:new Date().toISOString()};
    res.status(201).json(await upsertPlatformRecord(tenantOf(req),'opd_doctor',rid('DOC'),data));
  });
  app.post('/api/opd/register',auth,requireRole('admin','tech','pathologist','phlebotomist'),async(req,res)=>{
    const tid=tenantOf(req), b=req.body||{}, idem=text(req.get('x-idempotency-key'),120);
    const lockKey=idem?`${tid}:${idem}`:null;
    if(lockKey&&OPD_IDEMPOTENCY_LOCKS.has(lockKey))return json(res,409,{error:'Duplicate OPD request in progress',idempotencyKey:idem});
    if(idem){const prior=await getPlatformRecord(tid,'opd_idempotency',crypto.createHash('sha256').update(idem).digest('hex'));if(prior?.data?.response)return res.status(200).json({...prior.data.response,replayed:true});OPD_IDEMPOTENCY_LOCKS.add(lockKey);}
    try {
    const name=text(b.name,128); if(!name)return json(res,400,{error:'Patient name required'});
    const phone=normalizePhone(b.phone), ageExact=normalizeAge(b.age||b), gender=text(b.gender,20)||'Unspecified';
    if(!['Male','Female','Other','Unspecified'].includes(gender))return json(res,400,{error:'Invalid gender'});
    const codes=Array.isArray(b.tests)?b.tests.map(x=>String(typeof x==='string'?x:x.code||'').trim().toUpperCase()).filter(Boolean):[];
    if(!codes.length||codes.length>100)return json(res,400,{error:'At least one test is required (maximum 100)'});
    const unique=[...new Set(codes)]; if(unique.length!==codes.length)return json(res,409,{error:'Duplicate test in basket'});
    const catalog=db().testCatalog.filter(x=>(x.tenantId||'default')===tid&&x.active!==false); const missing=unique.filter(c=>!catalog.some(x=>x.code===c)); if(missing.length)return json(res,400,{error:'Unknown test code',codes:missing});
    const items=unique.map(c=>{const x=catalog.find(t=>t.code===c);return {code:x.code,name:x.name,price:money(x.price),department:x.department||'',unit:x.unit||'',reference:x.reference||''};});
    const pricing=calculatePricing(items,b.discountType||'NONE',b.discountValue||0); const payment=calculateDue(pricing.net,b.paidAmount||0);
    let doctor=null,commission=0;
    if(b.doctorId){doctor=await getPlatformRecord(tid,'opd_doctor',text(b.doctorId,80));if(!doctor)return json(res,404,{error:'Referral doctor not found'});const d=doctor.data||{};commission=d.commissionType==='FIXED'?Math.min(pricing.net,money(d.commissionValue)):money(pricing.net*Math.min(Number(d.commissionValue||0),100)/100);}
    let patient;
    if(b.patientId){patient=db().patients.find(p=>p.id===String(b.patientId)&& (p.tenantId||'default')===tid&&p.active!==false);if(!patient)return json(res,404,{error:'Patient not found'});}
    else {
      const tokenNo=db().patients.filter(p=>(p.tenantId||'default')===tid).reduce((m,p)=>Math.max(m,Number(p.tokenNo)||0),0)+1;
      patient={id:rid('PT'),tenantId:tid,tokenNo,uhid:`APX-${new Date().getFullYear()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,title:text(b.title,10)||'Mr.',name,age:ageExact.years,ageUnit:'Years',ageExact,gender,phone,referredBy:doctor?.data?.name||'Self / Direct OPD',sampleLocation:text(b.sampleLocation,32)||'In-Lab',type:'OPD',createdAt:new Date().toISOString()};
    }
    const policy=await effectivePolicy(req);
    const invoiceNumber=await nextSequence(tid,'INVOICE','INV');
    const accessionNumber=policy.policy.accession?.enabled===false?null:await nextSequence(tid,'ACCESSION',policy.policy.accession?.prefix||'ACC');
    const barcode=policy.policy.barcode?.enabled===false?null:`${policy.policy.barcode?.prefix||'LAB'}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const order={id:rid('ORD'),tenantId:tid,patientId:patient.id,barcode,accessionNumber,invoiceNumber,grossAmount:pricing.gross,discountType:pricing.discountType,discountValue:pricing.discountValue,discountAmount:pricing.discount,netPayable:pricing.net,paidAmount:payment.paid,balanceDue:payment.balanceDue,paymentStatus:payment.paymentStatus,paymentMode:text(b.paymentMode,30)||'Cash',referral:doctor?{doctorId:doctor.id,name:doctor.data.name,commissionType:doctor.data.commissionType,commissionValue:doctor.data.commissionValue,commissionAmount:commission}:null,pipelineStatus:'DRAFT',qcPassed:false,qc:null,validation:null,releasedAt:null,verificationToken:null,reportHash:null,tests:items.map(x=>({...x,value:'Pending',status:'Pending',method:'Pending Collection',isPanic:false})),createdAt:new Date().toISOString(),opd:{registeredBy:actorOf(req),registeredAt:new Date().toISOString(),ageExact:patient.ageExact||ageExact}};
    if(!Array.isArray(db().platformRecords))db().platformRecords=[];
    const now=new Date().toISOString();
    db().patients = db().patients || []; db().orders = db().orders || [];
    if(!b.patientId)db().patients.unshift(patient); else Object.assign(patient,{name,phone,gender,age:ageExact.years,ageUnit:'Years',ageExact,referredBy:doctor?.data?.name||patient.referredBy||'Self / Direct OPD'});
    db().orders.unshift(order);
    db().platformRecords.push({id:invoiceNumber,tenantId:tid,entityType:'invoice',version:1,status:'ACTIVE',createdAt:now,updatedAt:now,data:{invoiceNumber,orderId:order.id,gross:pricing.gross,discount:pricing.discount,net:pricing.net,paid:payment.paid,balance:payment.balanceDue,paymentMode:order.paymentMode,status:payment.paymentStatus,issuedAt:now,source:'OPD'}});
    if(doctor&&commission>0)db().platformRecords.push({id:rid('DC'),tenantId:tid,entityType:'doctor_commission',version:1,status:'ACTIVE',createdAt:now,updatedAt:now,data:{doctorId:doctor.id,doctorName:doctor.data.name,orderId:order.id,amount:commission,status:'PENDING',basisNet:pricing.net,createdAt:now}});
    appendAudit('OPD_REGISTRATION_CREATED',order.id,actorOf(req),req.auth.role,`OPD ${order.invoiceNumber}; ${patient.uhid}; tests=${unique.length}`);
    await saveDB();
    let upi={status:'NOT_CONFIGURED'}; const upiId=text(process.env.OPD_UPI_ID,120);
    if(order.balanceDue>0&&upiId){try{const uri=buildUpiUri({upiId,payeeName:text(process.env.OPD_UPI_NAME,100)||'HRGen Laboratory',amount:order.balanceDue,invoiceNumber,note:`Lab ${invoiceNumber}`});upi={status:'READY',upiId,amount:order.balanceDue,uri,qrDataUrl:await QRCode.toDataURL(uri,{errorCorrectionLevel:'M',margin:1,width:240})};}catch(e){upi={status:'INVALID_CONFIG',error:e.message};}}
    const labels=policy.policy.labels?.enabled===false?[]:makeLabelData(order,patient,catalog).map(l=>({...l,widthMm:Number(policy.policy.labels?.widthMm||50),heightMm:Number(policy.policy.labels?.heightMm||25),code128Svg:code128BSvg(l.barcode)}));
    const response={success:true,patient,order,pricing,payment,referral:order.referral,upi,labels,policy:{version:policy.version,barcodeEnabled:policy.policy.barcode?.enabled!==false,labelsEnabled:policy.policy.labels?.enabled!==false,accessionEnabled:policy.policy.accession?.enabled!==false}};
    if(idem){const idemId=crypto.createHash('sha256').update(idem).digest('hex');db().platformRecords.push({id:idemId,tenantId:tid,entityType:'opd_idempotency',version:1,status:'ACTIVE',createdAt:now,updatedAt:new Date().toISOString(),data:{response,orderId:order.id}});await saveDB();}
    res.status(201).json(response);
    } finally { if(lockKey)OPD_IDEMPOTENCY_LOCKS.delete(lockKey); }
  });
  app.post('/api/opd/orders/:id/payment',auth,requireRole('admin','tech','pathologist','phlebotomist'),async(req,res)=>{
    const tid=tenantOf(req),o=db().orders.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tid);if(!o)return json(res,404,{error:'Order not found'});const amount=money(req.body?.amount);if(amount<=0)return json(res,400,{error:'Positive payment amount required'});if(amount>money(o.balanceDue))return json(res,409,{error:'Payment exceeds balance due'});
    o.paidAmount=money(Number(o.paidAmount||0)+amount);o.balanceDue=money(Number(o.netPayable||0)-o.paidAmount);o.paymentStatus=o.balanceDue===0?'PAID':'PARTIAL';o.paymentMode=text(req.body?.paymentMode,30)||o.paymentMode||'Cash';o.lastPaymentAt=new Date().toISOString();
    const inv=await getPlatformRecord(tid,'invoice',o.invoiceNumber);if(inv){inv.data={...inv.data,paid:o.paidAmount,balance:o.balanceDue,paymentMode:o.paymentMode,status:o.paymentStatus,lastPaymentAt:o.lastPaymentAt};await upsertPlatformRecord(tid,'invoice',inv.id,inv.data);}
    appendAudit('OPD_PAYMENT_CAPTURED',o.id,actorOf(req),req.auth.role,`${o.invoiceNumber} amount=${amount} balance=${o.balanceDue}`);await saveDB();res.status(201).json({order:o,payment:{amount,paid:o.paidAmount,balanceDue:o.balanceDue,status:o.paymentStatus}});
  });
  app.get('/api/opd/orders/:id/labels',auth,requireRole('admin','pathologist','tech','phlebotomist'),async(req,res)=>{const tid=tenantOf(req),o=db().orders.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tid);if(!o)return json(res,404,{error:'Order not found'});const pol=await effectivePolicy(req);if(pol.policy.labels?.enabled===false)return res.json({enabled:false,page:{widthMm:Number(pol.policy.labels?.widthMm||50),heightMm:Number(pol.policy.labels?.heightMm||25)},labels:[]});if(pol.policy.barcode?.enabled===false)return json(res,409,{error:'Barcode is disabled by lab policy'});const p=db().patients.find(x=>x.id===o.patientId&&(x.tenantId||'default')===tid);const catalog=db().testCatalog.filter(x=>(x.tenantId||'default')===tid);const labels=makeLabelData(o,p,catalog).map(l=>({...l,widthMm:Number(pol.policy.labels?.widthMm||50),heightMm:Number(pol.policy.labels?.heightMm||25),code128Svg:code128BSvg(l.barcode)}));res.json({enabled:true,page:{widthMm:Number(pol.policy.labels?.widthMm||50),heightMm:Number(pol.policy.labels?.heightMm||25)},labels});});
  app.get('/api/opd/orders/:id/upi',auth,requireRole('admin','pathologist','tech','phlebotomist'),async(req,res)=>{const tid=tenantOf(req),o=db().orders.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tid);if(!o)return json(res,404,{error:'Order not found'});const upiId=text(process.env.OPD_UPI_ID,120);if(!upiId)return json(res,503,{status:'NOT_CONFIGURED',error:'OPD_UPI_ID is not configured'});if(Number(o.balanceDue||0)<=0)return json(res,409,{status:'NO_DUE'});const uri=buildUpiUri({upiId,payeeName:text(process.env.OPD_UPI_NAME,100)||'HRGen Laboratory',amount:o.balanceDue,invoiceNumber:o.invoiceNumber,note:`Lab ${o.invoiceNumber}`});res.json({status:'READY',upiId,amount:o.balanceDue,uri,qrDataUrl:await QRCode.toDataURL(uri,{errorCorrectionLevel:'M',margin:1,width:240})});
  });

  // PRE-ANALYTICAL BENCH: specimen accept/reject, quality rejection criteria & audit
  app.get('/api/specimens/queue',auth,requireRole('admin','tech','phlebotomist','pathologist'),async(req,res)=>{
    const tid=tenantOf(req), orders=(db().orders||[]).filter(x=>(x.tenantId||'default')===tid&&!['RELEASED'].includes(x.pipelineStatus));
    const catalog=db().testCatalog.filter(x=>(x.tenantId||'default')===tid);
    const rows=orders.map(o=>{
      const p=db().patients.find(pt=>pt.id===o.patientId&&(pt.tenantId||'default')===tenantOf(req));
      const tubes=makeLabelData(o,p,catalog);
      return {id:o.id,invoiceNumber:o.invoiceNumber,barcode:o.barcode,patient:p?{name:p.name,uhid:p.uhid,age:p.ageExact?.display||p.age,gender:p.gender}:null,tests:o.tests||[],pipelineStatus:o.pipelineStatus,specimenStatus:o.specimenStatus||'PENDING_COLLECTION',specimen:o.specimen||null,recollectionRequired:!!o.recollectionRequired,tubes:tubes.map(t=>({tubeCode:t.tubeCode,tubeColor:t.tubeColor,sampleType:t.sampleType,testCodes:t.testCodes}))};
    });
    res.json({count:rows.length,queue:rows});
  });
  app.post('/api/specimens/accept',auth,requireRole('admin','tech','phlebotomist','pathologist'),async(req,res)=>{
    const tid=tenantOf(req), D=db(), o=D.orders.find(x=>x.id===text(req.body?.orderId,80)&&(x.tenantId||'default')===tid);
    if(!o)return json(res,404,{error:'Order not found'});
    if(['VALIDATED','RELEASED'].includes(o.pipelineStatus))return json(res,409,{error:'Specimen state is immutable after validation; use the controlled amendment/recollection workflow.'});
    if(o.specimenStatus==='ACCEPTED')return json(res,409,{error:'Specimen has already been accepted'});
    const requestedTube=text(req.body?.tubeCode,40)||'ALL';
    const patient=D.patients.find(p=>p.id===o.patientId&&(p.tenantId||'default')===tid);
    const expectedTubes=makeLabelData(o,patient,D.testCatalog.filter(t=>(t.tenantId||'default')===tid)).map(t=>String(t.tubeCode||'').toUpperCase()).filter(Boolean);
    if(requestedTube!=='ALL'&&!expectedTubes.includes(requestedTube.toUpperCase()))return json(res,400,{error:'Tube code does not match the accession test requirements',allowedTubeCodes:[...new Set(expectedTubes)]});
    const now=new Date().toISOString();
    o.specimenHistory=Array.isArray(o.specimenHistory)?o.specimenHistory:[];
    if(o.specimen)o.specimenHistory.push({...o.specimen,archivedAt:now});
    o.specimenStatus='ACCEPTED'; o.recollectionRequired=false; o.receivedAt=o.receivedAt||now;
    o.specimen={status:'ACCEPTED',receivedAt:o.receivedAt,acceptedAt:now,acceptedBy:actorOf(req),tubeCode:requestedTube,centrifuged:bool(req.body?.centrifuged),notes:text(req.body?.notes,300)};
    appendAudit('SPECIMEN_ACCEPTED',o.id,actorOf(req),req.auth.role,`Tube: ${o.specimen.tubeCode}; Centrifuged: ${o.specimen.centrifuged}; Notes: ${o.specimen.notes}`);
    await saveDB();
    res.json({success:true,orderId:o.id,specimen:o.specimen});
  });
  app.post('/api/specimens/reject',auth,requireRole('admin','tech','phlebotomist','pathologist'),async(req,res)=>{
    const tid=tenantOf(req), o=db().orders.find(x=>x.id===text(req.body?.orderId,80)&&(x.tenantId||'default')===tid);
    if(!o)return json(res,404,{error:'Order not found'});
    if(['VALIDATED','RELEASED'].includes(o.pipelineStatus))return json(res,409,{error:'Specimen state is immutable after validation; use the controlled amendment/recollection workflow.'});
    const validReasons=['HEMOLYSIS','ICTERIC','LIPEMIA','CLOTTED','QNS','MISLABELED','CONTAINER_LEAK','OTHER'];
    const rawReason=text(req.body?.reason,60).toUpperCase();
    if(!validReasons.includes(rawReason))return json(res,400,{error:'A valid specimen rejection reason is required',allowedReasons:validReasons});
    const reason=rawReason, now=new Date().toISOString();
    o.specimenHistory=Array.isArray(o.specimenHistory)?o.specimenHistory:[];
    if(o.specimen)o.specimenHistory.push({...o.specimen,archivedAt:now});
    o.specimenStatus='REJECTED'; o.recollectionRequired=bool(req.body?.requestRecollection!==false);
    o.specimen={status:'REJECTED',rejectedAt:now,rejectedBy:actorOf(req),reason,tubeCode:text(req.body?.tubeCode,40)||'ALL',recollectionRequired:o.recollectionRequired,notes:text(req.body?.notes,500)};
    appendAudit('SPECIMEN_REJECTED',o.id,actorOf(req),req.auth.role,`Reason: ${reason}; RecollectionRequired: ${o.recollectionRequired}; Tube: ${o.specimen.tubeCode}`);
    await saveDB();
    res.json({success:true,orderId:o.id,specimen:o.specimen});
  });
  // NON-NABL ADMIN DATE/TIME MODIFICATION WITH FULL AUDIT TRACEABILITY
  app.put('/api/orders/:id/timestamps',auth,requireRole('admin'),async(req,res)=>{
    const tid=tenantOf(req);
    const tenantMode=String((db().tenants||[]).find(t=>t.id===tid)?.mode||'STANDARD').toUpperCase();
    if(tenantMode==='NABL')return json(res,403,{error:'Timestamp modification is strictly prohibited under NABL / ISO 15189 compliance mode'});
    const o=db().orders.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tid);
    if(!o)return json(res,404,{error:'Order not found'});
    if(['VALIDATED','RELEASED'].includes(o.pipelineStatus))return json(res,409,{error:'Timestamp modification is prohibited on validated or released orders'});
    const reason=text(req.body?.reason,300);
    if(!reason||reason.length<5)return json(res,400,{error:'Detailed modification reason (minimum 5 characters) required for audit traceability'});
    const oldCreated=o.createdAt;
    if(req.body?.createdAt&&!isNaN(new Date(req.body.createdAt).getTime()))o.createdAt=new Date(req.body.createdAt).toISOString();
    if(req.body?.collectedAt&&!isNaN(new Date(req.body.collectedAt).getTime()))o.collectedAt=new Date(req.body.collectedAt).toISOString();
    if(req.body?.receivedAt&&!isNaN(new Date(req.body.receivedAt).getTime()))o.receivedAt=new Date(req.body.receivedAt).toISOString();
    appendAudit('ORDER_TIMESTAMP_MODIFIED',o.id,actorOf(req),req.auth.role,`oldCreated=${oldCreated}; newCreated=${o.createdAt}; reason=${reason}`);
    await saveDB();
    res.json({success:true,orderId:o.id,createdAt:o.createdAt,collectedAt:o.collectedAt,receivedAt:o.receivedAt,reason});
  });

  // 3.5 business ops
  app.get('/api/branches',auth,async(req,res)=>res.json({branches:await listPlatformRecords(tenantOf(req),'branch')}));
  app.post('/api/branches',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'branch',rid('BR'),{name:text(req.body?.name,160),code:text(req.body?.code,50),type:text(req.body?.type,40)||'SPOKE',parentBranchId:text(req.body?.parentBranchId,80)||null,status:'ACTIVE'})));
  app.get('/api/rate-cards',auth,async(req,res)=>res.json({rateCards:await listPlatformRecords(tenantOf(req),'rate_card')}));
  app.post('/api/rate-cards',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'rate_card',rid('RC'),{name:text(req.body?.name,160),rules:req.body?.rules||{},validFrom:req.body?.validFrom||new Date().toISOString(),validTo:req.body?.validTo||null} )));
  app.get('/api/doctor-commissions',auth,requireRole('admin'),async(req,res)=>res.json({commissions:await listPlatformRecords(tenantOf(req),'doctor_commission')}));
  app.post('/api/doctor-commissions',auth,requireRole('admin'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'doctor_commission',rid('DC'),{doctorId:text(req.body?.doctorId,80),orderId:text(req.body?.orderId,80),amount:Number(req.body?.amount||0),status:'PENDING',createdAt:new Date().toISOString()})));
  app.post('/api/doctor-commissions/:id/payout',auth,requireRole('admin'),async(req,res)=>{const r=await getPlatformRecord(tenantOf(req),'doctor_commission',req.params.id);if(!r)return json(res,404,{error:'Commission not found'});r.data={...r.data,status:'PAYOUT_REQUESTED',payoutMethod:'UPI',upiId:text(req.body?.upiId,120),requestedAt:new Date().toISOString()};res.json(await upsertPlatformRecord(tenantOf(req),'doctor_commission',r.id,r.data));});
  app.get('/api/inventory/items',auth,requireFeature('Inventory/PO/expiry'),async(req,res)=>res.json({items:await listPlatformRecords(tenantOf(req),'inventory_item')}));
  app.post('/api/inventory/items',auth,requireRole('admin','tech'),requireFeature('Inventory/PO/expiry'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'inventory_item',rid('SKU'),{sku:text(req.body?.sku,60),name:text(req.body?.name,160),uom:text(req.body?.uom,30),qty:Number(req.body?.qty||0),reorderLevel:Number(req.body?.reorderLevel||0),expiryDate:req.body?.expiryDate||null,status:'ACTIVE'})));
  app.post('/api/inventory/stock',auth,requireRole('admin','tech'),requireFeature('Inventory/PO/expiry'),async(req,res)=>{const r=await getPlatformRecord(tenantOf(req),'inventory_item',text(req.body?.id,80));if(!r)return json(res,404,{error:'Inventory item not found'});const delta=Number(req.body?.delta||0);r.data.qty=Number(r.data.qty||0)+delta;r.data.lastMovement=new Date().toISOString();appendAudit('INVENTORY_MOVEMENT',null,actorOf(req),req.auth.role,`${r.id} ${delta}`);res.json(await upsertPlatformRecord(tenantOf(req),'inventory_item',r.id,r.data));});
  app.post('/api/inventory/refresh-expiry',auth,requireRole('admin','tech'),requireFeature('Inventory/PO/expiry'),async(req,res)=>{const items=await listPlatformRecords(tenantOf(req),'inventory_item');const now=new Date();let expired=0;for(const x of items){if(x.data.expiryDate && new Date(String(x.data.expiryDate)+'T23:59:59Z')<now && x.data.status!=='EXPIRED'){x.data.status='EXPIRED';await upsertPlatformRecord(tenantOf(req),'inventory_item',x.id,x.data,'EXPIRED');expired++;}}res.json({expired,checked:items.length});});
  app.post('/api/purchase-orders',auth,requireRole('admin','tech'),requireFeature('Inventory/PO/expiry'),async(req,res)=>res.status(201).json(await upsertPlatformRecord(tenantOf(req),'purchase_order',rid('PO'),{vendor:text(req.body?.vendor,160),items:req.body?.items||[],status:'DRAFT',createdAt:new Date().toISOString()})));
  app.get('/api/mis/metrics',auth,async(req,res)=>{const D=db(),tid=tenantOf(req),orders=(D.orders||[]).filter(o=>(o.tenantId||'default')===tid);const byTest={};for(const o of orders)for(const t of o.tests||[]){byTest[t.code]=(byTest[t.code]||0)+1;}const revenue=orders.reduce((n,o)=>n+Number(o.netPayable||0),0);res.json({orders:orders.length,revenue:Number(revenue.toFixed(2)),byTest,topTests:Object.entries(byTest).sort((a,b)=>b[1]-a[1]).slice(0,10)});});

  // 4.0 enterprise integrations
  app.get('/api/hl7/orm/:orderId',auth,async(req,res)=>{const o=db().orders.find(x=>x.id===req.params.orderId&&(x.tenantId||'default')===tenantOf(req));if(!o)return json(res,404,{error:'Order not found'});res.type('text/plain').send(buildORM({controlId:rid('ORM'),patientId:o.patientId,orderId:o.id,tests:o.tests||[]}));});
  app.get('/api/hl7/oru/:orderId',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{const o=db().orders.find(x=>x.id===req.params.orderId&&(x.tenantId||'default')===tenantOf(req)&&x.pipelineStatus==='RELEASED');if(!o)return json(res,404,{error:'Released report not found'});res.type('text/plain').send(buildORU({controlId:rid('ORU'),patientId:o.patientId,orderId:o.id,results:o.tests||[]}));});
  const ssoConfig=async(tid,kind)=>deps.withTenantTransaction(tid,async()=>((await getPlatformRecord(tid,'sso',kind))?.data||null));
  const ssoTicketInContext=async(tid,issuer,subject,provider)=>{
    const link=await getPlatformRecord(tid,'sso_identity',identityKey(issuer,subject));if(!link||link.status==='DISABLED')return null;
    const user=(db().users||[]).find(x=>x.id===link.data?.userId&&(x.tenantId||'default')===tid);if(!user||user.status==='DISABLED')return null;
    const ticket=deps.createSsoTicket(tid,user.id);await deps.saveSsoArtifact(tid,`sso-ticket:${ticket.nonce}`,'sso_ticket',{userId:user.id,provider},new Date(Date.now()+60000));
    appendAudit('SSO_IDENTITY_AUTHENTICATED',null,user.username,user.role,`${provider} identity authenticated; linked account ${user.id}`);
    await saveDB();
    return ticket.ticket;
  };
  const ssoTicket=(tid,issuer,subject,provider)=>deps.withTenantTransaction(tid,()=>ssoTicketInContext(tid,issuer,subject,provider));
  const ssoFailure=(res,code='login_failed')=>{try{return res.redirect(303,safeFrontendRedirect(null,code));}catch{return res.status(503).json({error:'SSO is not configured for browser login.'});}};
  const safeConfigView=(kind,d)=>kind==='OIDC'?{issuer:d?.issuer||'',clientId:d?.clientId||'',enabled:d?.enabled===true,clientSecretConfigured:Boolean(d?.clientSecretEnc)}:{entryPoint:d?.entryPoint||'',idpIssuer:d?.idpIssuer||'',idpCert:d?.idpCert||'',entityId:d?.entityId||'',audience:d?.audience||'',enabled:d?.enabled===true};
  const whatsappProvider=async tid=>{
    const stored=(await getPlatformRecord(tid,'whatsapp_provider','CURRENT'))?.data;
    if(stored)return {...stored,verifyToken:unsealSecret(stored.verifyTokenEnc),appSecret:unsealSecret(stored.appSecretEnc),accessToken:unsealSecret(stored.accessTokenEnc)};
    if(String(process.env.WHATSAPP_TENANT_ID||'')===String(tid))return {phoneNumberId:process.env.WHATSAPP_PHONE_NUMBER_ID||'',verifyToken:process.env.WHATSAPP_VERIFY_TOKEN||'',appSecret:process.env.WHATSAPP_APP_SECRET||'',accessToken:process.env.WHATSAPP_ACCESS_TOKEN||''};
    return null;
  };
  const sameSecret=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length>0&&x.length===y.length&&crypto.timingSafeEqual(x,y);};
  app.get('/api/sso/config',auth,requireRole('admin'),async(req,res)=>{const tid=tenantOf(req),oidc=(await getPlatformRecord(tid,'sso','OIDC'))?.data||{},saml=(await getPlatformRecord(tid,'sso','SAML'))?.data||{};res.json({oidc:safeConfigView('OIDC',oidc),saml:safeConfigView('SAML',saml)});});
  app.put('/api/sso/config/:kind',auth,requireRole('admin'),async(req,res)=>{
    const kind=String(req.params.kind).toUpperCase();if(!['OIDC','SAML'].includes(kind))return json(res,400,{error:'OIDC or SAML'});const tid=tenantOf(req),old=(await getPlatformRecord(tid,'sso',kind))?.data||{};let data;
    try{
      if(kind==='OIDC'){
        const issuer=text(req.body?.issuer,500),clientId=text(req.body?.clientId,200),secret=text(req.body?.clientSecret,2000);
        if(issuer)onlyHttps(issuer,'OIDC issuer');if(bool(req.body?.enabled)&&(!issuer||!clientId||(!secret&&!old.clientSecretEnc)))return json(res,400,{error:'Enabled OIDC requires an HTTPS issuer, client id and client secret.'});
        data={issuer,clientId,enabled:bool(req.body?.enabled),clientSecretEnc:secret?sealSecret(secret):(req.body?.clearClientSecret===true?'':old.clientSecretEnc||'')};
      }else{
        const entryPoint=text(req.body?.entryPoint,1000),idpIssuer=text(req.body?.idpIssuer,500),idpCert=text(req.body?.idpCert,12000),entityId=text(req.body?.entityId,500),audience=text(req.body?.audience,500)||entityId;
        if(entryPoint)onlyHttps(entryPoint,'SAML IdP entry point');if(bool(req.body?.enabled)&&(!entryPoint||!idpIssuer||!idpCert||!entityId||!audience))return json(res,400,{error:'Enabled SAML requires an HTTPS entry point, IdP issuer and certificate, SP entity id and audience.'});
        data={entryPoint,idpIssuer,idpCert,entityId,audience,enabled:bool(req.body?.enabled)};
      }
      return res.json(await upsertPlatformRecord(tid,'sso',kind,data));
    }catch(e){return json(res,400,{error:e.message});}
  });
  app.get('/api/sso/identities',auth,requireRole('admin'),async(req,res)=>{const tid=tenantOf(req);const users=new Map((db().users||[]).filter(u=>(u.tenantId||'default')===tid).map(u=>[u.id,u]));const identities=await listPlatformRecords(tid,'sso_identity');res.json({identities:identities.map(x=>({id:x.id,issuer:x.data.issuer,subject:x.data.subject,userId:x.data.userId,username:users.get(x.data.userId)?.username||null,status:x.status,createdAt:x.created_at}))});});
  app.post('/api/sso/identities',auth,requireRole('admin'),async(req,res)=>{const tid=tenantOf(req),issuer=text(req.body?.issuer,500),subject=text(req.body?.subject,1000),userId=text(req.body?.userId,100);if(!issuer||!subject||!userId)return json(res,400,{error:'issuer, subject and existing tenant userId are required'});const user=(db().users||[]).find(x=>x.id===userId&&(x.tenantId||'default')===tid);if(!user)return json(res,404,{error:'User must already exist in this tenant.'});const id=identityKey(issuer,subject),record=await upsertPlatformRecord(tid,'sso_identity',id,{issuer,subject,userId:user.id,linkedBy:req.auth.userId,linkedAt:new Date().toISOString()},'ACTIVE');appendAudit('SSO_IDENTITY_LINKED',null,actorOf(req),req.auth.role,`Provider identity linked to existing user ${user.id}`);res.status(201).json({id,issuer,subject,userId:user.id,status:record.status});});
  app.delete('/api/sso/identities/:id',auth,requireRole('admin'),async(req,res)=>{const tid=tenantOf(req),old=await getPlatformRecord(tid,'sso_identity',req.params.id);if(!old)return json(res,404,{error:'Identity link not found'});await upsertPlatformRecord(tid,'sso_identity',req.params.id,old.data,'DISABLED');appendAudit('SSO_IDENTITY_UNLINKED',null,actorOf(req),req.auth.role,`Provider identity link disabled for user ${old.data.userId}`);res.json({success:true,id:req.params.id,status:'DISABLED'});});
  app.get('/api/auth/sso/oidc/start',async(req,res)=>{
    try{
      const tenant=await deps.resolveTenantBySlug(text(req.query?.tenant,80).toLowerCase());if(!tenant)return ssoFailure(res,'tenant_unavailable');const cfg=await ssoConfig(tenant.id,'OIDC');if(!cfg?.enabled)return ssoFailure(res,'oidc_unavailable');
      const issuer=onlyHttps(cfg.issuer,'OIDC issuer'),redirectUri=ssoRedirect('OIDC'),secret=unsealSecret(cfg.clientSecretEnc);if(!secret||!cfg.clientId)return ssoFailure(res,'oidc_unavailable');
      const oidc=await import('openid-client');const clientConfig=await oidc.discovery(issuer,cfg.clientId,secret,undefined,{[oidc.customFetch]:pinnedHttpsFetch,execute:[oidc.enableNonRepudiationChecks]});
      if(clientConfig.serverMetadata().issuer!==issuer.href)return ssoFailure(res,'oidc_unavailable');
      const state=deps.signSsoState(tenant.id,oidc.randomState()),nonce=oidc.randomNonce(),codeVerifier=oidc.randomPKCECodeVerifier(),codeChallenge=await oidc.calculatePKCECodeChallenge(codeVerifier),browserBinding=crypto.randomBytes(32).toString('base64url');
      const authorization=oidc.buildAuthorizationUrl(clientConfig,{redirect_uri:redirectUri,scope:'openid profile email',response_type:'code',code_challenge:codeChallenge,code_challenge_method:'S256',state,nonce});
      return deps.withTenantRequest(req,res,()=>{},tenant.id,async()=>{await deps.saveSsoArtifact(tenant.id,`oidc:${state}`,'oidc_state',{codeVerifier,nonce,issuer:clientConfig.serverMetadata().issuer,browserBindingHash:hmac(process.env.AUTH_SECRET,`sso-browser:${browserBinding}`)},new Date(Date.now()+5*60*1000));setSsoBindingCookie(req,res,'OIDC',state,browserBinding);res.redirect(302,authorization.href);});
    }catch(e){console.error('OIDC start failed:',e.message);return ssoFailure(res,'oidc_unavailable');}
  });
  app.get('/api/auth/sso/oidc/callback',async(req,res)=>{
    const state=text(req.query?.state,2000),claims=deps.verifySsoState(state);if(!claims)return ssoFailure(res,'invalid_state');
    let stored;try{stored=await deps.withTenantTransaction(claims.tenantId,async()=>{const before=await deps.getSsoArtifact(claims.tenantId,`oidc:${state}`,'oidc_state'),cookie=readCookie(req,ssoBindingCookieName('OIDC',state));if(!before||!cookie||!sameSecret(before.value?.browserBindingHash,hmac(process.env.AUTH_SECRET,`sso-browser:${cookie}`)))return {artifact:null,config:null};return {artifact:await deps.consumeSsoArtifact(claims.tenantId,`oidc:${state}`,'oidc_state'),config:(await getPlatformRecord(claims.tenantId,'sso','OIDC'))?.data||null};});}catch{return ssoFailure(res,'invalid_state');}
    if(!stored.artifact||!stored.config?.enabled)return ssoFailure(res,'invalid_state');
    setSsoBindingCookie(req,res,'OIDC',state,'',0);
    try{
      if(req.query?.error||!req.query?.code)return ssoFailure(res,'provider_denied');const oidc=await import('openid-client'),cfg=stored.config,issuer=onlyHttps(cfg.issuer,'OIDC issuer'),secret=unsealSecret(cfg.clientSecretEnc),redirectUri=ssoRedirect('OIDC');
      const clientConfig=await oidc.discovery(issuer,cfg.clientId,secret,undefined,{[oidc.customFetch]:pinnedHttpsFetch,execute:[oidc.enableNonRepudiationChecks]});
      const currentUrl=new URL(req.originalUrl,redirectUri);const tokens=await oidc.authorizationCodeGrant(clientConfig,currentUrl,{pkceCodeVerifier:stored.artifact.value.codeVerifier,expectedState:state,expectedNonce:stored.artifact.value.nonce});
      const idClaims=tokens.claims();if(!idClaims?.sub||!idClaims?.iss||idClaims.iss!==stored.artifact.value.issuer)return ssoFailure(res,'invalid_identity');
      const ticket=await ssoTicket(claims.tenantId,idClaims.iss,idClaims.sub,'OIDC');if(!ticket)return ssoFailure(res,'identity_not_linked');return res.redirect(303,safeFrontendRedirect(ticket));
    }catch(e){console.error('OIDC callback rejected:',e.message);return ssoFailure(res,'login_failed');}
  });
  app.get('/api/auth/sso/saml/start',async(req,res)=>{
    try{
      const tenant=await deps.resolveTenantBySlug(text(req.query?.tenant,80).toLowerCase());if(!tenant)return ssoFailure(res,'tenant_unavailable');const cfg=await ssoConfig(tenant.id,'SAML');if(!cfg?.enabled)return ssoFailure(res,'saml_unavailable');onlyHttps(cfg.entryPoint,'SAML IdP entry point');const state=deps.signSsoState(tenant.id,crypto.randomBytes(32).toString('base64url')),browserBinding=crypto.randomBytes(32).toString('base64url');
      return deps.withTenantRequest(req,res,()=>{},tenant.id,async()=>{await deps.saveSsoArtifact(tenant.id,`saml-state:${state}`,'saml_state',{createdAt:Date.now(),browserBindingHash:hmac(process.env.AUTH_SECRET,`sso-browser:${browserBinding}`)},new Date(Date.now()+5*60*1000));const target=await samlStrategy(cfg,tenant.id,deps).getAuthorizeUrlAsync(state,undefined,{});setSsoBindingCookie(req,res,'SAML',state,browserBinding);res.redirect(302,target);});
    }catch(e){console.error('SAML start failed:',e.message);return ssoFailure(res,'saml_unavailable');}
  });
  app.get('/api/auth/sso/saml/metadata',async(req,res)=>{
    try{const tenant=await deps.resolveTenantBySlug(text(req.query?.tenant,80).toLowerCase());if(!tenant)return json(res,404,{error:'Tenant not found'});const cfg=await ssoConfig(tenant.id,'SAML');if(!cfg?.enabled)return json(res,404,{error:'SAML is not configured'});const xml=samlStrategy(cfg,tenant.id,deps).generateServiceProviderMetadata(null);res.type('application/xml').send(xml);}catch{return json(res,503,{error:'SAML metadata is unavailable'});}
  });
  app.post('/api/auth/sso/saml/acs',async(req,res)=>{
    const state=text(req.body?.RelayState,2000),claims=deps.verifySsoState(state);if(!claims)return ssoFailure(res,'invalid_state');let result;
    try{result=await deps.withTenantTransaction(claims.tenantId,async()=>{
      const before=await deps.getSsoArtifact(claims.tenantId,`saml-state:${state}`,'saml_state'),cookie=readCookie(req,ssoBindingCookieName('SAML',state));if(!before||!cookie||!sameSecret(before.value?.browserBindingHash,hmac(process.env.AUTH_SECRET,`sso-browser:${cookie}`)))return {error:'invalid_state'};const stateArtifact=await deps.consumeSsoArtifact(claims.tenantId,`saml-state:${state}`,'saml_state');if(!stateArtifact)return {error:'invalid_state'};setSsoBindingCookie(req,res,'SAML',state,'',0);
      const cfg=(await getPlatformRecord(claims.tenantId,'sso','SAML'))?.data;if(!cfg?.enabled)return {error:'saml_unavailable'};
      try{
        if(typeof req.body?.SAMLResponse!=='string'||req.body.SAMLResponse.length>350000)return {error:'invalid_assertion'};
        const checked=await samlStrategy(cfg,claims.tenantId,deps).validatePostResponseAsync(req.body),profile=checked.profile;if(checked.loggedOut||!profile?.issuer||!profile?.nameID||profile.issuer!==cfg.idpIssuer)return {error:'invalid_assertion'};
        const callback=ssoRedirect('SAML'),xml=Buffer.from(req.body.SAMLResponse,'base64').toString('utf8'),parsed=await require('xml2js').parseStringPromise(xml,{explicitArray:true,attrkey:'$'}),response=parsed['samlp:Response']||parsed.Response,assertion=(response?.['saml:Assertion']||response?.Assertion)?.[0];
        if(!response?.$||response.$.Destination!==callback)return {error:'invalid_destination'};
        const confirmations=assertion?.Subject?.[0]?.SubjectConfirmation||[],recipientOk=confirmations.some(x=>x.SubjectConfirmationData?.[0]?.$?.Recipient===callback);if(!recipientOk)return {error:'invalid_recipient'};
        const assertionId=assertion?.$?.ID||crypto.createHash('sha256').update(profile.getAssertionXml?.()||xml).digest('hex');
        const fresh=await deps.saveSsoArtifactOnce(claims.tenantId,`saml-assertion:${crypto.createHash('sha256').update(String(assertionId)).digest('hex')}`,'saml_assertion_replay',{issuer:profile.issuer},new Date(Date.now()+10*60*1000));if(!fresh)return {error:'replayed_assertion'};
        const ticket=await ssoTicketInContext(claims.tenantId,profile.issuer,profile.nameID,'SAML');return ticket?{ticket}:{error:'identity_not_linked'};
      }catch(e){console.warn('SAML response rejected:',e.message);return {error:'invalid_assertion'};}
    });}catch(e){console.error('SAML callback failed:',e.message);return ssoFailure(res,'login_failed');}
    if(!result?.ticket)return ssoFailure(res,result?.error||'login_failed');return res.redirect(303,safeFrontendRedirect(result.ticket));
  });
  app.post('/api/auth/sso/exchange',async(req,res)=>{
    const parsed=deps.verifySsoState(text(req.body?.ticket,2000));if(!parsed)return json(res,401,{error:'SSO ticket is invalid or expired.'});
    return deps.withTenantRequest(req,res,()=>{},parsed.tenantId,async context=>{
      const artifact=await deps.consumeSsoArtifact(parsed.tenantId,`sso-ticket:${parsed.nonce}`,'sso_ticket');context.commitOnError=true;
      const userId=artifact?.value?.userId,user=(db().users||[]).find(x=>x.id===userId&&(x.tenantId||'default')===parsed.tenantId);
      if(!user||user.status==='DISABLED')return json(res,401,{error:'SSO ticket is invalid or the linked user is disabled.'});
      const token=await deps.issueToken(user.role,user.id,user.username,parsed.tenantId);appendAudit('SSO_LOGIN',null,user.username,user.role,`User authenticated using ${artifact.value.provider} SSO`);await saveDB();
      return res.json({success:true,token,role:user.role,userId:user.id,username:user.username,tenantId:parsed.tenantId,expiresIn:8*60*60});
    });
  });
  app.post('/api/api-keys',auth,requireRole('admin'),requireFeature('Public API + webhooks'),async(req,res)=>{const raw=`hg_${crypto.randomBytes(28).toString('base64url')}`;const keyHash=hmac(process.env.AUTH_SECRET,raw);const r=await deps.createApiKey(tenantOf(req),rid('KEY'),text(req.body?.name,100)||'Integration',keyHash);res.status(201).json({...r,apiKey:raw});});
  app.get('/api/public/v1/orders/:id',apiKeyAuth,async(req,res)=>{const D=db(),o=D.orders.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tenantOf(req));if(!o)return json(res,404,{error:'Order not found'});if(o.pipelineStatus!=='RELEASED')return json(res,409,{error:'Report is not released'});res.json({id:o.id,barcode:o.barcode,status:o.pipelineStatus,patientId:o.patientId,tests:o.tests||[],releasedAt:o.releasedAt,verificationUrl:o.verificationUrl||null});});
  app.get('/api/webhooks/egress-allowlist',auth,requireRole('admin'),async(req,res)=>{const rules=(await getPlatformRecord(tenantOf(req),'webhook_egress_allowlist','CURRENT'))?.data?.rules||[];res.json({rules});});
  app.put('/api/webhooks/egress-allowlist',auth,requireRole('admin'),async(req,res)=>{
    const input=req.body?.rules;if(!Array.isArray(input)||input.length>100)return json(res,400,{error:'rules must be an array with at most 100 entries'});const rules=[],seen=new Set();
    try{for(const item of input){const origin=normalizeOrigin(text(item?.origin,1000)),url=new URL(origin),addresses=Array.isArray(item?.addresses)?[...new Set(item.addresses.map(String))]:[];if(seen.has(origin))return json(res,400,{error:'Duplicate egress origin'});seen.add(origin);if(addresses.some(a=>!validInternalAddress(a)))return json(res,400,{error:'Allowlisted addresses must be exact private or reserved IP addresses'});const allowHttp=item?.allowHttp===true;if(allowHttp&&(url.protocol!=='http:'||!addresses.length))return json(res,400,{error:'HTTP is allowed only for an origin with explicitly listed internal IP addresses'});rules.push({origin,addresses,allowHttp});}}catch(e){return json(res,400,{error:e.message});}
    await upsertPlatformRecord(tenantOf(req),'webhook_egress_allowlist','CURRENT',{rules,updatedAt:new Date().toISOString()});appendAudit('WEBHOOK_EGRESS_ALLOWLIST_UPDATED',null,actorOf(req),req.auth.role,`Updated ${rules.length} webhook egress origin allow rule(s)`);res.json({rules});
  });
  // Signs outgoing payload with HMAC-SHA256 in x-hrgen-signature header
  app.post('/api/webhooks/:id/test',auth,requireRole('admin'),requireFeature('Public API + webhooks'),async(req,res)=>{
    const tid=tenantOf(req),w=await getPlatformRecord(tid,'webhook',req.params.id);if(!w)return json(res,404,{error:'Webhook not found'});if(!w.data?.url)return json(res,400,{error:'Webhook URL missing'});if(w.data.active!==true)return json(res,409,{status:'DISABLED',error:'Webhook is disabled. Validate its destination and enable it before testing.'});
    const allowlist=(await getPlatformRecord(tid,'webhook_egress_allowlist','CURRENT'))?.data?.rules||[];
    try{await validateWebhookUrl(w.data.url,allowlist);const body=JSON.stringify(req.body||{event:'TEST',at:new Date().toISOString()});return res.json(await sendSecureWebhook(w.data.url,{body,secret:w.data.secret,allowlist}));}
    catch(e){if(/private|allowlist|HTTPS|destination|DNS/i.test(e.message)){await upsertPlatformRecord(tid,'webhook',w.id,{...w.data,active:false},'DISABLED');return json(res,403,{status:'BLOCKED',error:'Webhook destination failed the tenant egress policy and has been disabled.'});}return json(res,502,{status:'FAILED',error:'Webhook delivery failed within the configured egress limits.'});}
  });
  app.post('/api/webhooks',auth,requireRole('admin'),requireFeature('Public API + webhooks'),async(req,res)=>{
    const tid=tenantOf(req),url=text(req.body?.url,1000),allowlist=(await getPlatformRecord(tid,'webhook_egress_allowlist','CURRENT'))?.data?.rules||[];
    try{await validateWebhookUrl(url,allowlist);}catch(e){return json(res,400,{error:e.message});}
    const id=rid('WH'),record=await upsertPlatformRecord(tid,'webhook',id,{url,events:Array.isArray(req.body?.events)?req.body.events.map(x=>text(x,100)).filter(Boolean):[],secret:crypto.randomBytes(32).toString('hex'),active:true});
    const {secret,...safeData}=record.data;res.status(201).json({...record,data:safeData});
  });
  app.put('/api/webhooks/:id',auth,requireRole('admin'),async(req,res)=>{
    const tid=tenantOf(req),current=await getPlatformRecord(tid,'webhook',req.params.id);if(!current)return json(res,404,{error:'Webhook not found'});const url=text(req.body?.url,1000)||current.data.url,allowlist=(await getPlatformRecord(tid,'webhook_egress_allowlist','CURRENT'))?.data?.rules||[];
    try{await validateWebhookUrl(url,allowlist);}catch(e){await upsertPlatformRecord(tid,'webhook',current.id,{...current.data,url,active:false},'DISABLED');return json(res,400,{error:e.message});}
    const data={...current.data,url,events:Array.isArray(req.body?.events)?req.body.events.map(x=>text(x,100)).filter(Boolean):current.data.events||[],active:req.body?.active===true?true:(req.body?.active===false?false:current.data.active===true)};const record=await upsertPlatformRecord(tid,'webhook',current.id,data,data.active?'ACTIVE':'DISABLED');const {secret,...safeData}=record.data;res.json({...record,data:safeData});
  });
  app.get('/api/webhooks',auth,requireRole('admin'),async(req,res)=>{const webhooks=await listPlatformRecords(tenantOf(req),'webhook');res.json({webhooks:webhooks.map(x=>{const {secret,...data}=x.data||{};return {...x,data}})});});
  app.put('/api/branding',auth,requireRole('admin'),async(req,res)=>res.json(await upsertPlatformRecord(tenantOf(req),'branding','CURRENT',{
    name:text(req.body?.name,160),
    logoUrl:text(req.body?.logoUrl,1000),
    logoDataUrl:typeof req.body?.logoDataUrl==='string'&&req.body.logoDataUrl.startsWith('data:image/')?req.body.logoDataUrl.slice(0,500000):undefined,
    signatureDataUrl:typeof req.body?.signatureDataUrl==='string'&&req.body.signatureDataUrl.startsWith('data:image/')?req.body.signatureDataUrl.slice(0,500000):undefined,
    primary:text(req.body?.primary,30)||'#8172ff',
    accent:text(req.body?.accent,30)||'#E91E63',
    domain:text(req.body?.domain,240),
    address:text(req.body?.address,500),
    phone:text(req.body?.phone,40),
    email:text(req.body?.email,160),
    nablReg:text(req.body?.nablReg,100),
    pathologistName:text(req.body?.pathologistName,160),
    pathologistQualification:text(req.body?.pathologistQualification,160),
    pathologistRegistration:text(req.body?.pathologistRegistration,100),
    signatureName:text(req.body?.signatureName,160),
    printMode:['FULL_LETTERHEAD','PRE_PRINTED'].includes(req.body?.printMode)?req.body.printMode:'FULL_LETTERHEAD',
    headerMarginMm:Number(req.body?.headerMarginMm||0),
    footerMarginMm:Number(req.body?.footerMarginMm||0),
    updatedAt:new Date().toISOString()
  })));
  app.get('/api/branding',auth,async(req,res)=>res.json({branding:(await getPlatformRecord(tenantOf(req),'branding','CURRENT'))?.data||{}}));
  app.get('/api/sla',auth,async(req,res)=>{const D=db(),tid=tenantOf(req),orders=(D.orders||[]).filter(o=>(o.tenantId||'default')===tid);const cfg=(await getPlatformRecord(tid,'sla','CURRENT'))?.data||{targetHours:24};const breaches=orders.filter(o=>{if(o.pipelineStatus==='RELEASED')return (new Date(o.releasedAt)-new Date(o.createdAt))/3600000>cfg.targetHours;return (Date.now()-new Date(o.createdAt).getTime())/3600000>cfg.targetHours;}).map(o=>o.id);res.json({targetHours:cfg.targetHours,breaches,count:breaches.length});});
  app.put('/api/sla',auth,requireRole('admin'),async(req,res)=>res.json(await upsertPlatformRecord(tenantOf(req),'sla','CURRENT',{targetHours:Number(req.body?.targetHours||24),channels:req.body?.channels||['dashboard']})));

  // 4.5 AI / offline / UI capabilities
  app.post('/api/ai/report-summary',auth,requireRole('pathologist','admin'),requireFeature('LLM report summary human-in-loop'),async(req,res)=>{const D=db(),tid=tenantOf(req),o=D.orders.find(x=>x.id===text(req.body?.orderId,80)&&(x.tenantId||'default')===tid);if(!o)return json(res,404,{error:'Order not found'});const prompt={instruction:'Summarize the released/validated laboratory report without diagnosing; human review required.',report:{tests:o.tests||[],status:o.pipelineStatus}};if(!process.env.LLM_API_URL||!process.env.LLM_API_KEY)return res.status(503).json({status:'NOT_CONFIGURED',prompt});const result=await fetch(process.env.LLM_API_URL,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${process.env.LLM_API_KEY}`},body:JSON.stringify({model:process.env.LLM_MODEL||'configured-model',messages:[{role:'system',content:prompt.instruction},{role:'user',content:JSON.stringify(prompt.report)}]})});const data=await result.json();const summary=data?.choices?.[0]?.message?.content||data?.output_text||'';const r=await upsertPlatformRecord(tenantOf(req),'ai_summary',rid('AIS'),{orderId:o.id,summary,model:process.env.LLM_MODEL||'configured-model',humanReviewRequired:true,createdAt:new Date().toISOString()});res.json(r);});
  app.get('/api/ai/trend/:patientId',auth,async(req,res)=>{const D=db(),orders=(D.orders||[]).filter(o=>o.patientId===req.params.patientId&&(o.tenantId||tenantOf(req))===tenantOf(req)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));const code=text(req.query.code,40).toUpperCase();const points=[];for(const o of orders){const t=(o.tests||[]).find(x=>String(x.code||'').toUpperCase()===code);if(t&&Number.isFinite(Number(t.value)))points.push({date:o.createdAt,value:Number(t.value),orderId:o.id});}res.json({code,points,trend:points.length>=2?points.at(-1).value-points[0].value:0});});
  app.post('/api/ai/predict-reagent',auth,requireRole('admin','tech'),requireFeature('Predictive reagent ordering'),async(req,res)=>{const D=db(),tid=tenantOf(req),windowDays=Math.max(7,Number(req.body?.windowDays||30));const cutoff=Date.now()-windowDays*86400000;const usage={};for(const o of D.orders||[]){if((o.tenantId||'default')!==tid||new Date(o.createdAt).getTime()<cutoff)continue;for(const t of o.tests||[])usage[t.code]=(usage[t.code]||0)+1;}const inventory=await listPlatformRecords(tid,'inventory_item');const suggestions=inventory.map(x=>{const perDay=(usage[x.data.sku]||0)/windowDays;const days=perDay>0?Number(x.data.qty||0)/perDay:null;return {...x.data,id:x.id,usagePerDay:Number(perDay.toFixed(2)),estimatedDaysToStockout:days===null?null:Number(days.toFixed(1)),suggestReorder:days!==null&&days<Number(req.body?.thresholdDays||14)}});res.json({windowDays,suggestions});});
  app.post('/api/ai/voice-dictation',auth,requireRole('admin','tech','pathologist'),async(req,res)=>{
    const transcript=text(req.body?.transcript,2000);
    const D=db();
    const catalog=D.testCatalog.filter(x=>(x.tenantId||'default')===tenantOf(req));
    const aliases={'HEMOGLOBIN':'HB','HAEMOGLOBIN':'HB','HB':'HB','SUGAR':'FBS','GLUCOSE':'FBS','FASTING SUGAR':'FBS','TLC':'WBC','TOTAL LEUKOCYTE':'WBC','WBC':'WBC','PLATELET':'PLT','PLATELETS':'PLT','PLT':'PLT','CREATININE':'CREAT','CREAT':'CREAT','UREA':'UREA','BUN':'BUN','URIC ACID':'URIC_ACID','BILIRUBIN':'BILI_TOTAL','TOTAL BILIRUBIN':'BILI_TOTAL','CHOLESTEROL':'CHOL','LIPID':'CHOL'};
    let norm=transcript.toLowerCase().replace(/\b(point|dashamlav)\b/g,'.').replace(/\bshunya\b/g,'0').replace(/\bek\b/g,'1').replace(/\bdo\b/g,'2').replace(/\bteen\b/g,'3').replace(/\bchar\b/g,'4').replace(/\bpaanch\b/g,'5').replace(/\bchhe\b/g,'6').replace(/\bsaat\b/g,'7').replace(/\baath\b/g,'8').replace(/\bnau\b/g,'9').replace(/\bdas\b/g,'10').replace(/\bgyarah\b/g,'11').replace(/\bbaarah\b/g,'12').replace(/\bterah\b/g,'13').replace(/\bchaudah\b/g,'14').replace(/\bpandrah\b/g,'15');
    const values=[];
    for(const m of norm.matchAll(/([A-Za-z][A-Za-z0-9_-]{0,20})\s*[:=]?\s*(-?\d+(?:\.\d+)?)/g)){
      const raw=m[1].toUpperCase(), n=Number(m[2]);
      const mappedCode=aliases[raw]||raw;
      const item=catalog.find(x=>x.code===mappedCode||x.code===raw||x.name.toUpperCase().startsWith(raw));
      if(item) values.push({code:item.code,name:item.name,value:String(n),unit:item.unit,reference:item.reference});
    }
    res.json({transcript,normalized:norm,results:values,requiresReview:true});
  });
  app.post('/api/ai/voice-command',auth,async(req,res)=>{const transcript=text(req.body?.transcript,1000);const t=transcript.toLowerCase();let intent='UNKNOWN';if(t.includes('patient'))intent='OPEN_PATIENTS';else if(t.includes('billing')||t.includes('bill'))intent='OPEN_BILLING';else if(t.includes('result'))intent='OPEN_RESULTS';else if(t.includes('qc'))intent='OPEN_QC';else if(t.includes('inventory')||t.includes('reagent'))intent='OPEN_INVENTORY';else if(t.includes('collection'))intent='OPEN_COLLECTION';else if(t.includes('revenue')||t.includes('analytics'))intent='OPEN_ANALYTICS';res.json({transcript,intent,requiresConfirmation:!intent.startsWith('OPEN_')});});
  app.post('/api/offline/sync',auth,requireFeature('True offline-first PWA'),(req,res)=>json(res,501,{status:'NOT_IMPLEMENTED',error:'This endpoint does not replay queued actions. Submit queued requests through their original API routes.'}));
  app.get('/api/ui/config',auth,async(req,res)=>{res.json({i18n:{locales:['en-IN','hi-IN'],default:'en-IN'},accessibility:{wcag:'AA',keyboard:true},theme:{modes:['dark','light'],densities:['comfortable','compact'],defaultMode:'dark',defaultDensity:'comfortable'},commandPalette:['Dashboard','Patients','Billing','Results','QC','Reports','Inventory','Collection','B2B','Analytics','Settings','Audit','GIA AI'],voice:{locale:'hi-IN',pushToTalk:'F2'}});});
  // 4.6 2026 AI CLINICAL COPILOT & FORMULA AUTO-DERIVATION
  app.post('/api/ai/copilot/evaluate',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{
    const tid=tenantOf(req), o=db().orders.find(x=>x.id===text(req.body?.orderId,80)&&(x.tenantId||'default')===tid);
    if(!o)return json(res,404,{error:'Order not found'});
    const p=db().patients.find(pt=>pt.id===o.patientId&&(pt.tenantId||'default')===tenantOf(req));
    const evaluation=await evaluateCopilot(o,p||{});
    await upsertPlatformRecord(tid,'copilot_insight',`COP-${o.id}`,{...evaluation,evaluatedAt:new Date().toISOString()});
    appendAudit('AI_COPILOT_EVALUATION',o.id,actorOf(req),req.auth.role,`Anomalies=${evaluation.anomaliesCount}; Model=${evaluation.aiModel}`);
    res.json(evaluation);
  });
  app.get('/api/ai/copilot/:orderId',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{
    const tid=tenantOf(req), record=await getPlatformRecord(tid,'copilot_insight',`COP-${req.params.orderId}`);
    if(!record)return json(res,404,{error:'No AI copilot findings for this accession'});
    res.json(record.data);
  });
  // Phase 4: Non-Clinical AI Sandbox Endpoints (Strict Human-in-the-Loop, No Clinical Override)
  app.post('/api/ai/sandbox/bilingual-summary',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{
    const tid=tenantOf(req), o=db().orders.find(x=>x.id===text(req.body?.orderId,80)&&(x.tenantId||'default')===tid);
    if(!o) return json(res,404,{error:'Order not found'});
    const p=db().patients.find(pt=>pt.id===o.patientId&&(pt.tenantId||'default')===tenantOf(req));
    const evaluation=await evaluateCopilot(o,p||{});
    res.json({
      sandboxMode: 'NON_CLINICAL_DRAFT',
      humanReviewRequired: true,
      canApproveQC: false,
      canReleaseReport: false,
      evaluation
    });
  });
  app.post('/api/ai/sandbox/dictation-draft',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{
    const transcript=text(req.body?.transcript,2000);
    const catalog=db().testCatalog.filter(x=>(x.tenantId||'default')===tenantOf(req));
    const draft=await generateDictationDraft(transcript,catalog);
    res.json({
      sandboxMode: 'NON_CLINICAL_DRAFT',
      humanReviewRequired: true,
      confirmationRequiredBeforeSave: true,
      canApproveQC: false,
      canReleaseReport: false,
      ...draft
    });
  });
  app.post('/api/ai/sandbox/clinical-gate-check',auth,async(req,res)=>{
    const action=String(req.body?.action||'').toUpperCase();
    if(['APPROVE_QC','RELEASE_REPORT','OVERRIDE_PANIC','VALIDATE_RESULTS'].includes(action)){
      return res.status(403).json({
        error: `AI cannot perform clinical action: ${action}. Human pathologist sign-off and clinical validation gates strictly required.`,
        allowed: false,
        gatePolicy: 'FAIL_CLOSED'
      });
    }
    res.json({ allowed: true, sandboxMode: 'NON_CLINICAL_INFORMATIONAL_ONLY' });
  });
  app.post('/api/orders/:id/auto-derive',auth,requireRole('admin','tech','pathologist'),async(req,res)=>{
    const tid=tenantOf(req), o=db().orders.find(x=>x.id===req.params.id&&(x.tenantId||'default')===tid);
    if(!o)return json(res,404,{error:'Order not found'});
    if(o.specimenStatus !== 'ACCEPTED') return json(res,409,{error:'Pre-analytical gate blocked: specimen must be ACCEPTED before auto-deriving results.'});
    if(['VALIDATED','RELEASED'].includes(o.pipelineStatus)) return json(res,409,{error:'Auto-derive is prohibited on validated or released orders'});
    const p=db().patients.find(pt=>pt.id===o.patientId&&(pt.tenantId||'default')===tenantOf(req))||{};
    o.tests=deriveCalculatedTests(o.tests||[],p);
    appendAudit('TESTS_AUTO_DERIVED',o.id,actorOf(req),req.auth.role,`Derived formula evaluation on ${o.barcode}`);
    await saveDB();
    res.json({success:true,orderId:o.id,tests:o.tests});
  });

  // 4.7 INTERACTIVE 2-WAY WHATSAPP CLOUD API WEBHOOKS
  app.get('/api/whatsapp/provider',auth,requireRole('admin'),async(req,res)=>{const c=await whatsappProvider(tenantOf(req))||{};res.json({phoneNumberId:c.phoneNumberId||'',configured:Boolean(c.phoneNumberId&&c.verifyToken&&c.appSecret&&c.accessToken)});});
  app.put('/api/whatsapp/provider',auth,requireRole('admin'),async(req,res)=>{const tid=tenantOf(req),old=await whatsappProvider(tid)||{},phoneNumberId=text(req.body?.phoneNumberId,120),verifyToken=text(req.body?.verifyToken,500),appSecret=text(req.body?.appSecret,1000),accessToken=text(req.body?.accessToken,4000);if(!phoneNumberId||(!verifyToken&&!old.verifyToken)||(!appSecret&&!old.appSecret)||(!accessToken&&!old.accessToken))return json(res,400,{error:'Phone number id and all provider credentials are required when first configuring WhatsApp.'});const data={phoneNumberId,verifyTokenEnc:verifyToken?sealSecret(verifyToken):(old.verifyTokenEnc||sealSecret(old.verifyToken)),appSecretEnc:appSecret?sealSecret(appSecret):(old.appSecretEnc||sealSecret(old.appSecret)),accessTokenEnc:accessToken?sealSecret(accessToken):(old.accessTokenEnc||sealSecret(old.accessToken))};await upsertPlatformRecord(tid,'whatsapp_provider','CURRENT',data);appendAudit('WHATSAPP_PROVIDER_CONFIGURED',null,actorOf(req),req.auth.role,`WhatsApp provider configured for phone-number id ${phoneNumberId}`);res.json({phoneNumberId,configured:true});});
  app.get('/api/whatsapp/webhook',async(req,res)=>{
    const mode=req.query?.['hub.mode'],token=String(req.query?.['hub.verify_token']||''),challenge=req.query?.['hub.challenge'];if(mode!=='subscribe'||!token||!challenge)return res.status(403).send('Forbidden');
    for(const tenant of await deps.listActiveTenants()){const c=await whatsappProvider(tenant.id);if(c?.verifyToken&&sameSecret(c.verifyToken,token))return res.status(200).send(String(challenge));}
    return res.status(403).send('Forbidden');
  });
  app.post('/api/whatsapp/webhook',async(req,res)=>{
    const value=req.body?.entry?.[0]?.changes?.[0]?.value,phoneNumberId=String(value?.metadata?.phone_number_id||'');if(!phoneNumberId)return json(res,400,{error:'WhatsApp provider phone-number id is required.'});
    let found=null;for(const tenant of await deps.listActiveTenants()){const cfg=await whatsappProvider(tenant.id);if(cfg?.phoneNumberId===phoneNumberId){found={tenantId:tenant.id,cfg};break;}}
    if(!found||!verifyMetaSignature(req.bodyRaw,req.get('x-hub-signature-256'),found.cfg.appSecret))return json(res,401,{error:'WhatsApp webhook signature is invalid.'});
    const message=value?.messages?.[0];let result;
    try{result=await deps.withTenantTransaction(found.tenantId,async()=>{
      if(message?.id){const fresh=await deps.saveSsoArtifactOnce(found.tenantId,`whatsapp:${message.id}`,'whatsapp_message',{receivedAt:new Date().toISOString()},new Date(Date.now()+30*86400000));if(!fresh)return {handled:false,duplicate:true};}
      const branding=(await getPlatformRecord(found.tenantId,'branding','CURRENT'))?.data||{},D=db(),tenantOrders=(D.orders||[]).filter(o=>(o.tenantId||'default')===found.tenantId),tenantPatients=(D.patients||[]).filter(p=>(p.tenantId||'default')===found.tenantId);
      const output=handleIncomingMessage(req.body,{orders:tenantOrders,patients:tenantPatients,branding});
      if(output.handled&&output.replyText&&output.recipient){appendAudit('WHATSAPP_BOT_INTERACTION',output.orderId||null,'WHATSAPP_BOT','system',`Action=${output.actionType}; To=${output.recipient}`);await saveDB();}
      return output;
    });}catch(e){console.error('WhatsApp webhook processing failed:',e.message);return json(res,500,{error:'WhatsApp webhook processing failed.'});}
    if(result.handled&&result.replyText&&result.recipient){const dispatch=await sendWhatsAppCloudMessage({to:result.recipient,text:result.replyText,token:found.cfg.accessToken,phoneNumberId:found.cfg.phoneNumberId});if(dispatch.status!=='SENT')console.warn('WhatsApp automatic reply was not delivered:',dispatch.status);}
    return res.status(200).json({status:result.duplicate?'DUPLICATE':'PROCESSED',...result});
  });
  app.post('/api/whatsapp/dispatch/:orderId',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{
    const tid=tenantOf(req), o=db().orders.find(x=>x.id===req.params.orderId&&(x.tenantId||'default')===tid);
    if(!o)return json(res,404,{error:'Order not found'});
    const p=db().patients.find(pt=>pt.id===o.patientId&&(pt.tenantId||'default')===tid)||{};
    if(!p.phone)return json(res,400,{error:'Patient phone number unavailable'});
    const branding=(await getPlatformRecord(tid,'branding','CURRENT'))?.data||{};
    const labName=branding.name||'HRGen Laboratory';
    const verifyUrl=`${process.env.APP_BASE_URL||'https://lims.hrgen.in'}/verify/${o.verificationToken||'DRAFT'}`;
    const msg=`Hello ${p.name}! Your diagnostic test report from *${labName}* is authorized. Accession: ${o.invoiceNumber||o.barcode}. Download / Verify: ${verifyUrl}`;
    const provider=await whatsappProvider(tid);if(!provider?.accessToken||!provider?.phoneNumberId)return json(res,503,{status:'NOT_CONFIGURED',error:'WhatsApp credentials are not configured for this tenant.'});
    const dispatch=await sendWhatsAppCloudMessage({to:p.phone,text:msg,token:provider.accessToken,phoneNumberId:provider.phoneNumberId});
    appendAudit('WHATSAPP_REPORT_DISPATCHED',o.id,actorOf(req),req.auth.role,`To=${p.phone}; Status=${dispatch.status}`);
    res.json({success:true,dispatch,message:msg});
  });

  // Batch validation is disabled until it can invoke the exact same canonical validation service as single-order validation.
  app.post('/api/orders/batch-validate-normal',auth,requireRole('admin','pathologist'),async(req,res)=>{
    return json(res,409,{error:'Batch validation is temporarily disabled. Validate each QC_APPROVED order through /api/orders/:id/validate so all clinical, panic-limit and provenance gates run.'});
  });

  // Direct release is disabled: this endpoint previously fabricated QC, calibration and sign-off evidence.
  app.post('/api/orders/:id/fast-track',auth,requireRole('admin','pathologist','tech'),async(req,res)=>{
    const tid=tenantOf(req), order=db().orders.find(o=>o.id===req.params.id&&(o.tenantId||'default')===tid);
    if(!order)return json(res,404,{error:'Order not found'});
    return json(res,409,{error:'Direct fast-track release is disabled. Use specimen acceptance, analyzer/QC verification, standard validation and authorized pathologist sign-off.'});
  });

  // Machine Analyzer Simulator (ASTM / HL7 MLLP)
  app.post('/api/integrations/simulate-analyzer',auth,requireRole('admin','tech','pathologist'),async(req,res)=>{
    if(String(process.env.NODE_ENV||'').toLowerCase()==='production')return json(res,403,{error:'Analyzer simulator is disabled in production'});
    const tid=tenantOf(req), D=db();
    const barcode=text(req.body?.barcode,80);
    const instrumentId=text(req.body?.instrumentId,80);
    const protocol=String(req.body?.protocol||'ASTM').toUpperCase();
    const incomingResults=Array.isArray(req.body?.results)?req.body.results:[];
    const instrument=D.instruments.find(x=>x.id===instrumentId&&(x.tenantId||'default')===tid&&x.active!==false);
    if(!instrument)return json(res,409,{error:'Active instrument registered to this tenant is required'});
    const order=D.orders.find(o=>(o.barcode===barcode||o.id===barcode)&&(o.tenantId||'default')===tid);
    if(!order) return json(res,404,{error:'Order with barcode not found',barcode});
    if(order.specimenStatus !== 'ACCEPTED') return json(res,409,{error:'Pre-analytical gate blocked: specimen must be ACCEPTED before analyzer result import.'});
    if(['VALIDATED','RELEASED'].includes(order.pipelineStatus)) return json(res,409,{error:'Order is already validated or released'});
    let updated=0;
    const testMap=new Map(incomingResults.map(r=>[String(r.code||'').toUpperCase(), String(r.value)]));
    for(const t of order.tests||[]){
      const code=String(t.code||'').toUpperCase();
      if(testMap.has(code)){
        t.value=testMap.get(code);
        t.method=`Automated Analyzer (${instrumentId} - ${protocol})`;
        t.status='UNREVIEWED';
        updated++;
      }
    }
    if(updated>0 && order.pipelineStatus==='PENDING'){
      order.pipelineStatus='RESULTS_ENTERED';
    }
    appendAudit('INSTRUMENT_RESULT_INGESTED',order.id,actorOf(req),req.auth.role,`Ingested ${updated} results via ${protocol} from ${instrumentId}`);
    await saveDB();
    res.json({success:true,orderId:order.id,barcode:order.barcode,instrumentId,protocol,updatedCount:updated,pipelineStatus:order.pipelineStatus});
  });

  
  function getSystemPublicKey(){
    const candidates=[
      process.env.LICENSE_PUBLIC_KEY,
      path.join(process.cwd(),'license-public.pem'),
      path.join(__dirname,'..','license-public.pem')
    ];
    for(const c of candidates){
      if(!c) continue;
      if(c.includes('BEGIN PUBLIC KEY')) return c;
      if(fs.existsSync(c)) {
        try { return fs.readFileSync(c,'utf8'); } catch(e){}
      }
    }
    return '';
  }

  function readDiskLicense(){
    const candidates = [
      path.join(process.cwd(), 'license.json'),
      path.join(__dirname, '..', 'license.json')
    ];
    for(const p of candidates){
      if(fs.existsSync(p)){
        try {
          const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
          if(raw.payload && raw.signature) return raw;
        } catch(e){}
      }
    }
    return null;
  }

  app.get('/api/license/status',auth,async(req,res)=>{
    let d=(await getPlatformRecord(tenantOf(req),'license','CURRENT'))?.data||null;
    if(!d){
      const diskLic = readDiskLicense();
      if(diskLic){
        const pub = getSystemPublicKey();
        if(pub){
          try {
            const ok = crypto.verify(null, Buffer.from(JSON.stringify(diskLic.payload)), {key:pub,format:'pem',type:'spki'}, Buffer.from(diskLic.signature, 'base64url'));
            if(ok){
              await upsertPlatformRecord(tenantOf(req),'license','CURRENT',diskLic.payload,'ACTIVE');
              d = diskLic.payload;
            }
          } catch(e){}
        }
      }
    }
    res.json({
      configured: !!d,
      active: !!d,
      tier: d?.tier || d?.plan || 'ENTERPRISE_LIMS_L99N30',
      issuedTo: d?.issuedTo || d?.customerName || 'HRGen Enterprise Customer',
      expiresAt: d?.expiresAt || 'PERPETUAL',
      amcUntil: d?.amcUntil || 'ACTIVE',
      perpetual: d?.perpetual !== false,
      features: d?.features || ['ALL_77_FEATURES'],
      license: d
    });
  });

  app.post('/api/license/activate',auth,requireRole('admin'),async(req,res)=>{
    const payload = req.body?.payload;
    const signature = req.body?.signature;
    if(!payload || !signature) return res.status(400).json({error:'Payload and signature required'});
    const pub = getSystemPublicKey();
    if(!pub) return res.status(503).json({error:'System public key not configured'});
    try {
      const ok = crypto.verify(null, Buffer.from(JSON.stringify(payload)), {key:pub,format:'pem',type:'spki'}, Buffer.from(signature, 'base64url'));
      if(!ok) return res.status(400).json({error:'Invalid cryptographic signature'});
      await upsertPlatformRecord(tenantOf(req),'license','CURRENT',payload,'ACTIVE');
      res.json({success:true,message:'License activated successfully',license:payload});
    } catch(err) {
      res.status(400).json({error:'License verification failed: ' + err.message});
    }
  });

  // Center KYC & Onboarding Setup Module
  app.get('/api/onboarding/kyc',auth,async(req,res)=>{
    const tid=tenantOf(req);
    const rec=await getPlatformRecord(tid,'kyc','CURRENT');
    const branding=(await getPlatformRecord(tid,'branding','CURRENT'))?.data||{};
    const tenant=(db().tenants||[]).find(t=>t.id===tid)||{id:tid,name:'GIA Clinical Reference Laboratories'};
    const defaults = {
      labName: branding.labName || tenant.name || 'GIA Clinical Reference Laboratories',
      centerType: 'DIAGNOSTIC_PATHOLOGY',
      registrationNumber: 'CEA/REG/DL/2026/8841',
      gstin: '07AABCH1234F1Z5',
      pan: 'AABCH1234F',
      phone: branding.phone || '+91 98765 43210',
      email: branding.email || 'info@gialabs.in',
      address: branding.address || 'Plot 42, Healthcare Corridor, New Delhi - 110001',
      directorName: branding.signatureName || 'Dr. Consultant Pathologist, MD',
      directorRegNo: 'MCI-XXXXX',
      directorDesignation: 'Chief Consultant Pathologist',
      accessionPrefix: 'LAB',
      sampleBarcodeFormat: 'CODE128',
      currency: 'INR',
      onboardingCompleted: true
    };
    const data = Object.assign({}, defaults, rec?.data || {});
    res.json(data);
  });

  app.put('/api/onboarding/kyc',auth,requireRole('admin'),async(req,res)=>{
    const tid=tenantOf(req);
    const body=req.body||{};
    const data={
      labName: text(body.labName,150) || 'GIA Clinical Reference Laboratories',
      centerType: text(body.centerType,60) || 'DIAGNOSTIC_PATHOLOGY',
      registrationNumber: text(body.registrationNumber,80) || '',
      gstin: text(body.gstin,30) || '',
      pan: text(body.pan,30) || '',
      phone: text(body.phone,50) || '',
      email: text(body.email,100) || '',
      address: text(body.address,250) || '',
      directorName: text(body.directorName,120) || '',
      directorRegNo: text(body.directorRegNo,60) || '',
      directorDesignation: text(body.directorDesignation,100) || '',
      accessionPrefix: (text(body.accessionPrefix,10)||'LAB').toUpperCase(),
      sampleBarcodeFormat: text(body.sampleBarcodeFormat,20) || 'CODE128',
      currency: text(body.currency,10) || 'INR',
      updatedAt: new Date().toISOString()
    };
    await upsertPlatformRecord(tid,'kyc','CURRENT',data);
    res.json({success:true,kyc:data});
  });

  // Clinical Interpretation Engine Route
  app.get('/api/clinical-interpretations',auth,async(req,res)=>{
    const { CLINICAL_INTERPRETATIONS } = require('./services/clinicalInterpretation');
    res.json(CLINICAL_INTERPRETATIONS);
  });

  app.get('/api/validation/77',auth,requireRole('admin','pathologist'),async(req,res)=>{const proof=FEATURES.map(f=>({id:f.id,name:f.name,phase:f.phase,server:null,ui:null,evidence:null,status:'NOT_VERIFIED'}));res.json({count:FEATURES.length,ready:null,status:'VALIDATION_REQUIRED',proof,note:'This endpoint reports the capability registry only. It does not assert runtime, UI, clinical, or release validation.'});});
}
module.exports={registerPlatformRoutes,PLAN_CATALOG,xmlAttribute,samlStrategy,pinnedHttpsFetch,validateWebhookUrl,identityKey};
