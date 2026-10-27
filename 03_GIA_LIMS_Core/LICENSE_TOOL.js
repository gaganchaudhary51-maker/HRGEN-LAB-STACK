#!/usr/bin/env node
const fs=require('fs');const crypto=require('crypto');
const cmd=process.argv[2]||'';
if(cmd==='keygen'){
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');fs.writeFileSync(process.argv[3]||'license-private.pem',privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600});fs.writeFileSync(process.argv[4]||'license-public.pem',publicKey.export({type:'spki',format:'pem'}));console.log('Ed25519 keypair generated');process.exit(0);
}
if(cmd==='sign'){
 const [,, ,payloadFile,privateFile,outFile]=process.argv;const payload=JSON.parse(fs.readFileSync(payloadFile,'utf8'));const privateKey=crypto.createPrivateKey(fs.readFileSync(privateFile));const bytes=Buffer.from(JSON.stringify(payload));const signature=crypto.sign(null,bytes,privateKey).toString('base64url');fs.writeFileSync(outFile||'license.json',JSON.stringify({payload,signature},null,2),{mode:0o600});console.log('License signed');process.exit(0);
}
console.error('Usage: node LICENSE_TOOL.js keygen [private.pem] [public.pem] | sign payload.json private.pem license.json');process.exit(1);
