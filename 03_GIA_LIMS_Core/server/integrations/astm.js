const net=require('net');
const crypto=require('crypto');
const ENQ=0x05,ACK=0x06,NAK=0x15,STX=0x02,ETX=0x03,ETB=0x17,CR=0x0d,LF=0x0a,EOT=0x04;
function checksum(payload){let sum=0;for(const b of Buffer.from(payload,'utf8'))sum=(sum+b)&0xff;return sum.toString(16).toUpperCase().padStart(2,'0');}
function frame(record,seq=1,last=true){const body=`${seq}${record}`;const end=last?ETX:ETB;const cs=checksum(String.fromCharCode(STX)+body+String.fromCharCode(end));return Buffer.concat([Buffer.from([STX]),Buffer.from(body),Buffer.from([end]),Buffer.from(cs+'\r\n')]);}
function parseRecord(line){const s=String(line||'');return {type:s[0]||'',fields:s.slice(1).split('|'),raw:s};}
function parseASTM(payload){
 const text=Buffer.isBuffer(payload)?payload.toString('utf8'):String(payload||'');
 const records=text.split(/\r\n|\r|\n/).filter(Boolean).map(parseRecord);
 const h=records.find(r=>r.type==='H'),p=records.find(r=>r.type==='P'),o=records.find(r=>r.type==='O');
 const results=records.filter(r=>r.type==='R').map(r=>({code:(r.fields[2]||'').split('^').filter(Boolean).pop()||'',value:r.fields[3]||'',unit:r.fields[4]||'',raw:r.raw}));
 return {valid:Boolean(h&&o),header:h,patient:p,order:o,results,records,orderExternalId:o?.fields?.[2]||'',patientExternalId:p?.fields?.[1]||'',messageId:crypto.createHash('sha256').update(text).digest('hex'),raw:text};
}
function startASTMEdge({port=5000,host='0.0.0.0',onMessage=()=>{},maxConnections=16,idleTimeoutMs=30000}={}){
 let active=0;
 const server=net.createServer(socket=>{
  if(active>=maxConnections){socket.end();return;}
  active++;socket.setTimeout(idleTimeoutMs);let buf=Buffer.alloc(0),records=[];
  const close=()=>{if(active>0)active--;};socket.once('close',close);socket.once('timeout',()=>socket.destroy());socket.once('error',()=>socket.destroy());
  socket.on('data',chunk=>{
   buf=Buffer.concat([buf,chunk]);
   while(buf.length){
    const b=buf[0];
    if(b===ENQ){socket.write(Buffer.from([ACK]));buf=buf.subarray(1);continue;}
    if(b===EOT){socket.write(Buffer.from([ACK]));buf=buf.subarray(1);if(records.length){const parsed=parseASTM(records.join('\r'));Promise.resolve(onMessage(parsed)).catch(()=>{});records=[];}continue;}
    if(b!==STX){buf=buf.subarray(1);continue;}
    const etx=buf.indexOf(ETX,1),etb=buf.indexOf(ETB,1);let end=-1;
    if(etx>=0&&(etb<0||etx<etb))end=etx;else if(etb>=0)end=etb;
    if(end<0||buf.length<end+5)break;
    const endByte=buf[end],body=buf.subarray(1,end).toString('utf8');
    const received=buf.subarray(end+1,end+3).toString('ascii').toUpperCase(),crlf=buf.subarray(end+3,end+5);
    const expected=checksum(String.fromCharCode(STX)+body+String.fromCharCode(endByte));
    if(received!==expected||crlf[0]!==CR||crlf[1]!==LF){socket.write(Buffer.from([NAK]));buf=buf.subarray(end+5);continue;}
    records.push(body.slice(1));socket.write(Buffer.from([ACK]));buf=buf.subarray(end+5);
   }
  });
 });
 server.listen(port,host);return server;
}
module.exports={checksum,frame,parseASTM,startASTMEdge};
