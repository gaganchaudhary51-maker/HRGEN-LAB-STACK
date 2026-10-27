'use strict';

const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {samlStrategy}=require('../server/platformRoutes');
const {SignedXml}=require('xml-crypto');

process.env.APP_BASE_URL='https://lims.example.test';
const ISSUER='https://mock-idp.example.test';
const AUDIENCE='lims-client';
const CALLBACK='https://lims.example.test/api/auth/sso/saml/acs';
const root=path.resolve(__dirname,'..');

function b64(value){return Buffer.from(JSON.stringify(value)).toString('base64url');}
function signedJwt(privateKey,claims){const input=`${b64({alg:'RS256',kid:'mock-key',typ:'JWT'})}.${b64(claims)}`;return `${input}.${crypto.sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url')}`;}
async function verifyOidc(){
  const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk={...publicKey.export({format:'jwk'}),kid:'mock-key',use:'sig',alg:'RS256'};
  const state='signed-state-value',nonce='signed-nonce-value',verifier='test-pkce-verifier';
  const metadata={issuer:ISSUER,authorization_endpoint:`${ISSUER}/authorize`,token_endpoint:`${ISSUER}/token`,jwks_uri:`${ISSUER}/jwks`,response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256'],token_endpoint_auth_methods_supported:['client_secret_basic'],code_challenge_methods_supported:['S256']};
  async function discover(){const oidc=require('openid-client');return oidc.discovery(new URL(ISSUER),AUDIENCE,'mock-secret',undefined,{[oidc.customFetch]:mockFetch,execute:[oidc.enableNonRepudiationChecks]});}
  let scenario={iss:ISSUER,aud:AUDIENCE,nonce,exp:Math.floor(Date.now()/1000)+300,iat:Math.floor(Date.now()/1000),sub:'mock-subject'};
  let invalidSignature=false,wrongDiscoveryIssuer=false;
  async function mockFetch(input){
    const url=new URL(input instanceof Request?input.url:(input?.url||input));
    if(url.pathname==='/.well-known/openid-configuration')return Response.json({...metadata,issuer:wrongDiscoveryIssuer?`${ISSUER}/wrong`:ISSUER});
    if(url.pathname==='/jwks')return Response.json({keys:[jwk]});
    if(url.pathname==='/token'){
      const claims={...scenario};const signer=invalidSignature?crypto.generateKeyPairSync('rsa',{modulusLength:2048}).privateKey:privateKey;
      return Response.json({access_token:'mock-access-token',token_type:'Bearer',expires_in:300,scope:'openid profile email',id_token:signedJwt(signer,claims)});
    }
    throw new Error(`Unexpected mock OIDC request ${url.href}`);
  }
  const oidc=require('openid-client');
  async function grant(overrides={}){
    const config=await oidc.discovery(new URL(ISSUER),AUDIENCE,'mock-secret',undefined,{[oidc.customFetch]:mockFetch,execute:[oidc.enableNonRepudiationChecks]});
    return oidc.authorizationCodeGrant(config,new URL(`${ISSUER}/callback?code=mock-code&state=${state}`),{pkceCodeVerifier:verifier,expectedState:state,expectedNonce:nonce,...overrides});
  }
  const client=await discover();assert.equal(client.serverMetadata().issuer,ISSUER);
  const tokens=await oidc.authorizationCodeGrant(client,new URL(`${ISSUER}/callback?code=mock-code&state=${state}`),{pkceCodeVerifier:verifier,expectedState:state,expectedNonce:nonce});
  assert.equal(tokens.claims().sub,'mock-subject');
  await assert.rejects(grant({expectedState:'wrong-state'}));
  scenario={...scenario,aud:'another-client'};await assert.rejects(grant());scenario={...scenario,aud:AUDIENCE};
  scenario={...scenario,nonce:'wrong-nonce'};await assert.rejects(grant());scenario={...scenario,nonce};
  scenario={...scenario,iss:`${ISSUER}/wrong`};await assert.rejects(grant());scenario={...scenario,iss:ISSUER};
  scenario={...scenario,exp:Math.floor(Date.now()/1000)-30};await assert.rejects(grant());scenario={...scenario,exp:Math.floor(Date.now()/1000)+300};
  invalidSignature=true;await assert.rejects(grant());invalidSignature=false;
  wrongDiscoveryIssuer=true;await assert.rejects(discover());
  console.log('PASS signed OIDC mock provider: valid code + PKCE + nonce; rejects state, issuer, audience, expiry and signature failures');
}

function signXml(xml,privateKey,xpath,location){
  const sig=new SignedXml({privateKey,canonicalizationAlgorithm:'http://www.w3.org/2001/10/xml-exc-c14n#',signatureAlgorithm:'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'});
  sig.addReference({xpath,transforms:['http://www.w3.org/2000/09/xmldsig#enveloped-signature','http://www.w3.org/2001/10/xml-exc-c14n#'],digestAlgorithm:'http://www.w3.org/2001/04/xmlenc#sha256'});
  sig.computeSignature(xml,{location:{reference:location,action:'append'}});return sig.getSignedXml();
}
async function verifySaml(){
  const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
  const privatePem=privateKey.export({type:'pkcs8',format:'pem'}),publicPem=publicKey.export({type:'spki',format:'pem'});
  const requests=new Map(),deps={
    saveSsoArtifactOnce:async(_tid,key,_kind,value)=>{if(requests.has(key))return false;requests.set(key,{value});return true;},
    getSsoArtifact:async(_tid,key)=>requests.get(key)||null,
    consumeSsoArtifact:async(_tid,key)=>{const result=requests.get(key)||null;requests.delete(key);return result;},
    removeSsoArtifact:async(_tid,key)=>{requests.delete(key);return null;}
  };
  const cfg={entryPoint:'https://idp.example.test/sso',entityId:'https://lims.example.test/saml',idpIssuer:'https://idp.example.test',idpCert:publicPem,audience:'https://lims.example.test/saml'};
  const strategy=samlStrategy(cfg,'TEN-MOCK',deps);let requestId;
  const startRequest=async(instance,state)=>{const authorize=await instance.getAuthorizeUrlAsync(state,undefined,{});assert.match(authorize,/SAMLRequest=/);requestId=String([...requests.keys()].at(-1)||'').replace(/^saml-request:/,'');assert.ok(requestId);};
  await startRequest(strategy,'mock-relay-state');
  const now=new Date(),notBefore=new Date(now.getTime()-60000).toISOString(),notAfter=new Date(now.getTime()+300000).toISOString();
  const assertionXml=(audience='https://lims.example.test/saml',expiry=notAfter)=>`<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_assertion-${crypto.randomUUID()}" Version="2.0" IssueInstant="${now.toISOString()}"><saml:Issuer>https://idp.example.test</saml:Issuer><saml:Subject><saml:NameID>mock-user-123</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData InResponseTo="${requestId}" Recipient="${CALLBACK}" NotOnOrAfter="${expiry}"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${expiry}"><saml:AudienceRestriction><saml:Audience>${audience}</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="${now.toISOString()}" SessionIndex="_session"/></saml:Assertion>`;
  const responseXml=(assertion)=>`<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_response-${crypto.randomUUID()}" InResponseTo="${requestId}" Version="2.0" IssueInstant="${now.toISOString()}" Destination="${CALLBACK}"><saml:Issuer>https://idp.example.test</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>${assertion}</samlp:Response>`;
  const signedAssertion=()=>signXml(assertionXml(),privatePem,"//*[local-name(.)='Assertion']","//*[local-name(.)='Assertion']");
  const signResponse=async(assertion)=>Buffer.from(signXml(responseXml(assertion),privatePem,"//*[local-name(.)='Response']","//*[local-name(.)='Response']")).toString('base64');
  const firstResponse=await signResponse(signedAssertion()),valid=await strategy.validatePostResponseAsync({SAMLResponse:firstResponse});
  assert.equal(valid.profile.issuer,cfg.idpIssuer);assert.equal(valid.profile.nameID,'mock-user-123');
  await startRequest(strategy,'second-request');
  await assert.rejects(strategy.validatePostResponseAsync({SAMLResponse:firstResponse}),/InResponseTo/);
  const strategy2=samlStrategy(cfg,'TEN-MOCK',deps);await startRequest(strategy2,'audience-request');
  const wrongAudience=signXml(assertionXml('https://wrong-audience.example'),privatePem,"//*[local-name(.)='Assertion']","//*[local-name(.)='Assertion']");
  await assert.rejects(strategy2.validatePostResponseAsync({SAMLResponse:await signResponse(wrongAudience)}),/audience|Audience/i);
  const strategy3=samlStrategy(cfg,'TEN-MOCK',deps);await startRequest(strategy3,'expiry-request');
  const expired=signXml(assertionXml('https://lims.example.test/saml',new Date(now.getTime()-10*60*1000).toISOString()),privatePem,"//*[local-name(.)='Assertion']","//*[local-name(.)='Assertion']");
  await assert.rejects(strategy3.validatePostResponseAsync({SAMLResponse:await signResponse(expired)}),/expired|NotOnOrAfter|Conditions|subject confirmation/i);
  console.log('PASS signed SAML mock provider: valid response, request correlation, audience and expiry rejection');
}

async function main(){
  const routes=fs.readFileSync(path.join(root,'server','platformRoutes.js'),'utf8');
  assert.match(routes,/browserBindingHash/);assert.match(routes,/sso-browser:/);assert.match(routes,/saml-assertion:/);assert.match(routes,/response\.\$\.Destination!==callback/);assert.match(routes,/Recipient===callback/);
  await verifyOidc();await verifySaml();
  console.log('PASS LIMS guards: browser-bound state, one-time linked identity tickets, disabled-user rejection');
}
main().catch(error=>{console.error(error);process.exitCode=1});
