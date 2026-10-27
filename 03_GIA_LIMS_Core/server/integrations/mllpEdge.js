const net=require('net');
const crypto=require('crypto');
const {parseHL7Message}=require('./hl7');
const VT=0x0b, FS=0x1c, CR=0x0d;
function frame(message){return Buffer.concat([Buffer.from([VT]),Buffer.from(String(message),'utf8'),Buffer.from([FS,CR])]);}
function startMLLPEdge({port=2575,host='0.0.0.0',onMessage=()=>{},maxFrameBytes=1024*1024,maxConnections=32,idleTimeoutMs=30000}={}){
  let active=0;
  const server=net.createServer(socket=>{
    if(active>=maxConnections){socket.end();return;}
    active++; socket.setTimeout(idleTimeoutMs); let buf=Buffer.alloc(0);
    const close=()=>{if(active>0)active--;};
    socket.once('close',close); socket.once('timeout',()=>socket.destroy()); socket.once('error',()=>socket.destroy());
    socket.on('data',chunk=>{
      if(buf.length+chunk.length>maxFrameBytes){socket.write(frame(`MSH|^~\\&|HRGEN|LIS||||${new Date().toISOString()}||ACK^ERROR|ERR|P|2.5\rMSA|AE|\r`));socket.destroy();return;}
      buf=Buffer.concat([buf,chunk]);
      while(true){
        const start=buf.indexOf(VT); if(start<0){if(buf.length>maxFrameBytes)socket.destroy();return;}
        const end=buf.indexOf(Buffer.from([FS,CR]),start+1); if(end<0){if(buf.length-start-1>maxFrameBytes)socket.destroy();return;}
        const msg=buf.subarray(start+1,end).toString('utf8'); buf=buf.subarray(end+2);
        const parsed=parseHL7Message(msg);
        socket.write(frame(parsed.ack));
        if(!parsed.valid) continue;
        Promise.resolve(onMessage({...parsed,messageId:crypto.createHash('sha256').update(msg).digest('hex')})).catch(()=>{});
      }
    });
  });
  server.maxConnections=maxConnections;
  server.listen(port,host);
  return server;
}
module.exports={frame,startMLLPEdge};
