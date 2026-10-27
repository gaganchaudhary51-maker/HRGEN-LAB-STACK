'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {isPublicAddress,resolvePinned,sendWebhook}=require('../server/services/webhookEgress');
const {samlStrategy}=require('../server/platformRoutes');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
async function listen(handler){const server=http.createServer(handler);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});return {server,origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};}
async function main(){
  process.env.APP_BASE_URL='https://lims.example.test';
  assert.equal(isPublicAddress('8.8.8.8'),true);assert.equal(isPublicAddress('127.0.0.1'),false);assert.equal(isPublicAddress('169.254.10.2'),false);assert.equal(isPublicAddress('::1'),false);
  await assert.rejects(resolvePinned(new URL('https://rebind.example/'),null,async()=>[{address:'93.184.216.34',family:4},{address:'10.0.0.4',family:4}]),/private or reserved/);
  const pinned=await resolvePinned(new URL('https://pin.example/'),null,async()=>[{address:'93.184.216.34',family:4}]);
  await new Promise((resolve,reject)=>pinned('pin.example',{},(error,address,family)=>error?reject(error):(assert.equal(address,'93.184.216.34'),assert.equal(family,4),resolve())));

  const ok=await listen((req,res)=>{res.writeHead(204);res.end()});
  try{
    await assert.rejects(sendWebhook(ok.origin,{body:'{}',secret:'test'}),/HTTPS|private|allowlisted/);
    const result=await sendWebhook(`${ok.origin}/hook`,{body:'{}',secret:'test',allowlist:[{origin:ok.origin,addresses:['127.0.0.1'],allowHttp:true}]});
    assert.deepEqual(result,{status:'SENT',http:204});assert.equal(Object.hasOwn(result,'response'),false);
  }finally{await ok.close();}

  let redirectHits=0;const destination=await listen((req,res)=>{redirectHits++;res.writeHead(204);res.end()});
  const redirect=await listen((req,res)=>{res.writeHead(302,{location:`${destination.origin}/private`});res.end()});
  try{await assert.rejects(sendWebhook(`${redirect.origin}/start`,{body:'{}',secret:'test',allowlist:[{origin:redirect.origin,addresses:['127.0.0.1'],allowHttp:true}]}),/private|allowlist|destination/);assert.equal(redirectHits,0);}finally{await redirect.close();await destination.close();}

  const huge=await listen((req,res)=>{res.writeHead(200,{'content-type':'text/plain'});res.end('x'.repeat(9000))});
  try{await assert.rejects(sendWebhook(huge.origin,{body:'{}',secret:'test',allowlist:[{origin:huge.origin,addresses:['127.0.0.1'],allowHttp:true}]}),/size limit/);}finally{await huge.close();}
  const slow=await listen((req,res)=>{setTimeout(()=>{if(!res.destroyed){res.writeHead(204);res.end()}},6000)});
  try{await assert.rejects(sendWebhook(slow.origin,{body:'{}',secret:'test',allowlist:[{origin:slow.origin,addresses:['127.0.0.1'],allowHttp:true}]}),/timed out|maximum duration/);}finally{await slow.close();}
  const drip=await listen((req,res)=>{res.writeHead(200,{'content-type':'text/plain'});const timer=setInterval(()=>{if(res.destroyed){clearInterval(timer);return}res.write('x')},2500);res.once('close',()=>clearInterval(timer))});
  try{await assert.rejects(sendWebhook(drip.origin,{body:'{}',secret:'test',allowlist:[{origin:drip.origin,addresses:['127.0.0.1'],allowHttp:true}]}),/maximum duration|timed out/);}finally{await drip.close();}

  const fakeDeps={saveSsoArtifactOnce:async()=>true,consumeSsoArtifact:async()=>null,removeSsoArtifact:async()=>{}};
  const strategy=samlStrategy({entryPoint:'https://idp.example/sso',entityId:'https://lims.example/saml',idpIssuer:'https://idp.example',idpCert:'-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----',audience:'https://lims.example/saml'},'TEN-A',fakeDeps);
  assert.equal(strategy.options.validateInResponseTo,'always');assert.equal(strategy.options.wantAssertionsSigned,true);assert.equal(strategy.options.wantAuthnResponseSigned,true);assert.equal(strategy.options.audience,'https://lims.example/saml');

  const server=read('server.js'),routes=read('server/platformRoutes.js'),offline=read('public/index.html'),db=read('db/postgres.js');
  assert.match(server,/createAuthSession/);assert.match(server,/commitOnError/);assert.match(server,/findPublicReleasedReport/);assert.doesNotMatch(server,/acquireSingleWriterLease|releaseSingleWriterLease/);
  assert.match(db,/tenant_runtime_hardening/);assert.match(db,/auth_sessions/);assert.match(db,/request_idempotency/);assert.match(db,/auth_sessions_user_tenant_fk/);assert.match(db,/consumeSsoArtifact/);
  assert.match(routes,/authorizationCodeGrant\(clientConfig,currentUrl,\{pkceCodeVerifier:stored\.artifact\.value\.codeVerifier,expectedState:state,expectedNonce:stored\.artifact\.value\.nonce\}\)/);
  assert.match(routes,/validatePostResponseAsync\(req\.body\)/);assert.match(routes,/response\.\$\.Destination!==callback/);assert.match(routes,/Recipient===callback/);assert.match(routes,/saml-assertion:/);assert.match(routes,/sso_identity/);
  assert.match(routes,/enableNonRepudiationChecks/);assert.match(routes,/browserBindingHash/);assert.match(routes,/getSsoArtifact\(tenantId,`saml-request:/);
  assert.doesNotMatch(routes,/req\.body\?\.host|req\.body\?\.port/);
  assert.match(routes,/sendSecureWebhook\(w\.data\.url/);assert.doesNotMatch(routes,/fetch\(w\.data\.url/);assert.match(routes,/webhook_egress_allowlist/);
  assert.match(offline,/OFFLINE_WRITE_ALLOWLIST=new Set\(\['\/api\/patients','\/api\/orders','\/api\/collection\/jobs','\/api\/opd\/register'\]\)/);assert.match(offline,/OfflinePendingError/);assert.match(offline,/X-Idempotency-Key/);assert.match(offline,/sso_ticket/);
  console.log('PASS webhook private address, DNS pinning, allowlist, redirect, response-size, idle-timeout and total-deadline checks');
  console.log('PASS SAML library request correlation and signature-required configuration');
  console.log('PASS source guards for tenant persistence, durable replay, SSO verification and pending offline UX');
}
main().catch(error=>{console.error(error);process.exitCode=1});
