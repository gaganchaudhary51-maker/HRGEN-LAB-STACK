'use strict';

const dns = require('node:dns').promises;
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const crypto = require('node:crypto');

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 8192;
const REQUEST_TIMEOUT_MS = 5000;

function ipv4Number(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(x => !Number.isInteger(x) || x < 0 || x > 255)) return null;
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]) >>> 0;
}

function inV4(address, network, bits) {
  const a = ipv4Number(address), n = ipv4Number(network);
  if (a === null || n === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (a & mask) === (n & mask);
}

function isPublicAddress(address) {
  const family = net.isIP(address);
  if (family === 4) {
    const blocked = [
      ['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],
      ['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],
      ['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]
    ];
    return !blocked.some(([network,bits]) => inV4(address,network,bits));
  }
  if (family === 6) {
    const a = address.toLowerCase().split('%')[0];
    if (a.startsWith('::ffff:')) {
      const mapped = a.slice(7);
      return net.isIP(mapped) === 4 && isPublicAddress(mapped);
    }
    // Only globally allocated unicast 2000::/3 is eligible. Exclude documentation,
    // benchmarking, ORCHID, and special-purpose space from outbound webhook targets.
    if (!/^2[0-9a-f]{3}:/.test(a)) return false;
    if (/^2001:(?:db8|0|2|10|20|30|4[0-9a-f]|5[0-9a-f]|6[0-9a-f]|7[0-9a-f]|8[0-9a-f]|9[0-9a-f]|a[0-9a-f]|b[0-9a-f]|c[0-9a-f]|d[0-9a-f]|e[0-9a-f]|f[0-9a-f]):/.test(a)) return false;
    return true;
  }
  return false;
}

function normalizeOrigin(raw) {
  const url = new URL(String(raw));
  if (!['https:','http:'].includes(url.protocol) || url.username || url.password || !url.hostname) {
    throw new Error('Webhook destination must be an HTTP(S) origin without embedded credentials.');
  }
  return url.origin;
}

function findAllowRule(url, rules = []) {
  const origin = url.origin;
  return (Array.isArray(rules) ? rules : []).find(rule => {
    try { return normalizeOrigin(rule.origin) === origin; } catch { return false; }
  }) || null;
}

async function resolvePinned(url, rule, resolver = dns.lookup) {
  const host = url.hostname.replace(/^\[|\]$/g,'').split('%')[0];
  const literal = net.isIP(host) ? [{address:host,family:net.isIP(host)}] : await resolver(host,{all:true,verbatim:true});
  if (!literal.length) throw new Error('Webhook destination did not resolve.');
  const allowedIps = new Set((rule?.addresses || []).map(String));
  for (const entry of literal) {
    if (!isPublicAddress(entry.address) && !allowedIps.has(entry.address)) {
      throw new Error('Webhook destination resolves to a private or reserved address that is not allowlisted.');
    }
    if (rule && !isPublicAddress(entry.address) && !allowedIps.has(entry.address)) {
      throw new Error('Webhook destination address is not explicitly allowlisted.');
    }
  }
  if (rule && rule.addresses?.length && literal.some(x => !rule.addresses.includes(x.address))) {
    throw new Error('Webhook destination DNS changed outside its allowlisted addresses.');
  }
  const selected = literal[0];
  return (hostname, options, callback) => {
    if (typeof options === 'function') { callback = options; options = {}; }
    if (hostname.toLowerCase() !== host.toLowerCase()) return callback(new Error('Unexpected webhook DNS lookup.'));
    if (options && typeof options === 'object' && options.all) callback(null,[selected]);
    else callback(null,selected.address,selected.family);
  };
}

function requestOnce(url, {method, body, signature, lookup}) {
  return new Promise((resolve,reject) => {
    let deadline;
    const fail=error=>{clearTimeout(deadline);reject(error);};
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(url,{
      method,
      headers:{'content-type':'application/json','content-length':Buffer.byteLength(body),'x-hrgen-signature':signature,'user-agent':'HRGen-LIMS-Webhook/1'},
      lookup,
      timeout:REQUEST_TIMEOUT_MS,
      maxHeaderSize:16*1024
    },res => {
      let size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>MAX_RESPONSE_BYTES)res.destroy(new Error('Webhook response exceeded size limit.'));});
      res.on('end',()=>{clearTimeout(deadline);resolve({status:res.statusCode||0,location:res.headers.location||null});});
      res.on('error',fail);
    });
    req.on('timeout',()=>req.destroy(new Error('Webhook request timed out.')));
    deadline=setTimeout(()=>req.destroy(new Error('Webhook request exceeded its maximum duration.')),REQUEST_TIMEOUT_MS);
    req.on('error',fail);
    req.end(body);
  });
}

async function sendWebhook(rawUrl, {body, secret, allowlist = []}) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new Error('Webhook URL is invalid.'); }
  let response;
  for (let redirects=0; redirects<=MAX_REDIRECTS; redirects++) {
    if (!['https:','http:'].includes(url.protocol) || url.username || url.password) throw new Error('Webhook redirect has an unsupported URL.');
    const rule=findAllowRule(url,allowlist);
    if (url.protocol!=='https:' && !(rule?.allowHttp===true && url.protocol==='http:')) throw new Error('Webhook destinations must use HTTPS unless an allowlisted internal origin explicitly permits HTTP.');
    const lookup=await resolvePinned(url,rule);
    const signature=crypto.createHmac('sha256',String(secret||'')).update(body).digest('hex');
    response=await requestOnce(url,{method:'POST',body,signature,lookup});
    if (![301,302,303,307,308].includes(response.status)) return {status:response.status>=200&&response.status<300?'SENT':'FAILED',http:response.status};
    if (!response.location) throw new Error('Webhook redirect omitted its destination.');
    if (redirects===MAX_REDIRECTS) throw new Error('Webhook redirect limit exceeded.');
    url=new URL(response.location,url);
  }
  throw new Error('Webhook delivery failed.');
}

module.exports={isPublicAddress,normalizeOrigin,resolvePinned,sendWebhook};
