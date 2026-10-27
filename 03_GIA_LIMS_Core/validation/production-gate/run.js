#!/usr/bin/env node
const fs=require('fs'),cp=require('child_process'),http=require('http'),path=require('path');
const root=path.resolve(__dirname,'../..'); const out=[];
function rec(name,status,detail=''){out.push({name,status,detail}); console.log(`${status.padEnd(9)} ${name}${detail?' — '+detail:''}`)}
function cmd(c){try{return cp.execSync(c,{stdio:['ignore','pipe','pipe'],timeout:15000}).toString().trim()}catch(e){return null}}
rec('node-runtime',process.version>='v20'?'PASS':'FAIL',process.version);
rec('docker-runtime',cmd('docker version --format "{{.Server.Version}}"')?'PASS':'BLOCKED','Docker daemon unavailable');
rec('postgres-runtime',cmd('pg_isready')?'PASS':'BLOCKED','PostgreSQL runtime unavailable');
const gate=path.join(root,'supply-chain','PRODUCTION_SECURITY_LOAD_DR_GATE.json');
if(fs.existsSync(gate)) rec('static-production-gates','PASS','gate manifest present'); else rec('static-production-gates','FAIL','gate manifest missing');
let serverReady=false;
try{require.resolve('express'); serverReady=true}catch{}
rec('node-dependencies',serverReady?'PASS':'BLOCKED','dependencies are not bundled; run npm ci in target runtime');
if(serverReady){rec('network-load-test','PENDING','runtime available; execute dedicated load profile');}else rec('network-load-test','BLOCKED','Node dependencies unavailable');
if(cmd('pg_isready')) rec('postgres-backup-restore','PENDING','execute DR dataset/backup/restore procedure'); else rec('postgres-backup-restore','BLOCKED','PostgreSQL runtime unavailable');
if(cmd('docker version --format "{{.Server.Version}}"')) rec('chaos-failover','PENDING','execute API/DB restart and recovery scenarios'); else rec('chaos-failover','BLOCKED','Docker runtime unavailable');
const report={timestamp:new Date().toISOString(),protocol:'HRGen Production Validation Harness v1',checks:out};fs.writeFileSync(path.join(root,'validation','production-gate','RESULT.json'),JSON.stringify(report,null,2));
