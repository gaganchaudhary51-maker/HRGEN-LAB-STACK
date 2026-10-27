function fields(seg){const [name,...rest]=String(seg).split('|');return {name,values:rest};}
function parseHL7Message(message){
  const raw=String(message||'').replace(/\0/g,'');
  const segments=raw.split(/\r?\n|\r/).filter(Boolean).map(fields);
  const msh=segments.find(s=>s.name==='MSH');
  if(!msh) return {valid:false,error:'MSH segment missing',raw};
  const pid=segments.find(s=>s.name==='PID');
  const obr=segments.find(s=>s.name==='OBR');
  const obx=segments.filter(s=>s.name==='OBX');
  const messageType=String(msh.values?.[7]||'');
  const control=String(msh.values?.[8]||'').trim();
  const sending=String(msh.values?.[1]||'').trim();
  const results=obx.map(x=>({code:String(x.values?.[2]||'').split('^')[0].trim(),value:String(x.values?.[4]||''),unit:String(x.values?.[5]||'')}));
  const ackCode=control?'AA':'AE';
  const ack=`MSH|^~\\&|HRGEN|LIS||||${new Date().toISOString()}||ACK^${messageType.split('^')[0]||'UNKNOWN'}|${control||`ACK-${Date.now()}`}|P|2.5\rMSA|${ackCode}|${control||''}\r`;
  return {valid:Boolean(control),error:control?'': 'MSH-10 message control ID missing',sending,messageType,control,patientExternalId:String(pid?.values?.[2]||''),orderExternalId:String(obr?.values?.[2]||''),results,ack,raw};
}
function buildORU({controlId,patientId,orderId,results}){const dt=new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);const lines=[`MSH|^~\\&|HRGEN|LIS|||${dt}||ORU^R01|${controlId}|P|2.5`,`PID|1||${patientId}||`,`OBR|1|${orderId}|${orderId}|||${dt}`];results.forEach((r,i)=>lines.push(`OBX|${i+1}|ST|${r.code}^${String(r.name||'')}||${r.value}|${r.unit||''}||||F`));return lines.join('\r')+'\r';}
function buildORM({controlId,patientId,orderId,tests}){const dt=new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);const lines=[`MSH|^~\\&|HRGEN|LIS|||${dt}||ORM^O01|${controlId}|P|2.5`,`PID|1||${patientId}||`,`ORC|NW|${orderId}`,`OBR|1|${orderId}|${orderId}|||${dt}`];tests.forEach((t,i)=>lines.push(`OBX|${i+1}|ST|${t.code}^${t.name}||||||||O`));return lines.join('\r')+'\r';}
module.exports={parseHL7Message,buildORU,buildORM};
