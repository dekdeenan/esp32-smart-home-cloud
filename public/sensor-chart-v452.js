(() => {
  const fmt=(epoch)=>new Date(epoch*1000).toLocaleString('th-TH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  window.drawSensorHistory=function(data){
    sensorChartData=data;const latest=data.latest||data.points?.at(-1)||{};
    const validReading=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
    $('#adminTemp').innerHTML=`${validReading(latest.temperature)?Number(latest.temperature).toFixed(1):'--'} <span>°C</span>`;
    $('#adminHumidity').innerHTML=`${validReading(latest.humidity)?Number(latest.humidity).toFixed(1):'--'} <span>%</span>`;
    const stale=latest.recordedAt&&Date.now()/1000-Number(latest.recordedAt)>600;
    $('#sensorUpdated').textContent=latest.recordedAt?`${stale?'ข้อมูลล่าสุดเก่า · ':''}อัปเดต ${date(latest.recordedAt)}`:'รอข้อมูลจากอุปกรณ์';
    const points=data.points||[],canvas=$('#sensorChart'),empty=$('#sensorEmpty'),mode=$('#sensorChartMode').value;empty.classList.toggle('hidden',points.length>1);
    empty.textContent=points.length===1?'มีข้อมูล 1 จุด กำลังรอจุดถัดไป':stale?'ข้อมูลล่าสุดเก่า · ไม่มีข้อมูลในช่วงนี้ เลือก 30 หรือ 90 วันเพื่อดูย้อนหลัง':'ยังไม่มีข้อมูลในช่วงเวลาที่เลือก';
    $('#sensorSummary').textContent=points.length?`${points.length} จุดข้อมูล · แกนซ้าย °C · แกนขวา %RH`:'';
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(320,Math.floor(rect.width)),h=Math.max(260,Math.floor(rect.height));canvas.width=w*dpr;canvas.height=h*dpr;
    const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);if(points.length<2)return;
    const pad={l:56,r:56,t:25,b:52},iw=w-pad.l-pad.r,ih=h-pad.t-pad.b,temps=points.map(x=>Number(x.temperature)),hums=points.map(x=>Number(x.humidity));
    const rawMin=Math.min(...temps),rawMax=Math.max(...temps),rawRange=Math.max(.1,rawMax-rawMin),targetTicks=w<500?4:6,rawStep=rawRange/Math.max(1,targetTicks-1),steps=[.1,.2,.5,1,2,5,10,20],tickStep=steps.find(step=>step>=rawStep)||20,tMin=Math.floor((rawMin-tickStep*.15)/tickStep)*tickStep,tMax=Math.ceil((rawMax+tickStep*.15)/tickStep)*tickStep,tRange=Math.max(tickStep,tMax-tMin),ticks=Math.max(1,Math.round(tRange/tickStep)),precision=tickStep<1?1:0,toX=i=>pad.l+i*iw/(points.length-1),toY=(v,min,max)=>pad.t+(max-v)*ih/Math.max(.1,max-min);
    canvas._sensorGeometry={points,pad,iw,w,h,toX,tMin,tMax};c.font='10px Tahoma';c.lineWidth=1;
    for(let i=0;i<=ticks;i++){const v=tMin+i*tickStep,y=toY(v,tMin,tMax),rh=i*100/ticks;c.strokeStyle=i===0||i===ticks?'#28536f':'#17344c';c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke();c.fillStyle='#9bb5cc';c.textAlign='right';c.fillText(`${v.toFixed(precision)}°`,pad.l-7,y+3);c.textAlign='left';c.fillText(`${rh.toFixed(Number.isInteger(rh)?0:1)}%`,w-pad.r+7,y+3);}
    const xCount=Math.min(points.length,w<500?5:9);for(let n=0;n<xCount;n++){const i=Math.round(n*(points.length-1)/Math.max(1,xCount-1)),x=toX(i);c.strokeStyle='#17344c';c.beginPath();c.moveTo(x,pad.t);c.lineTo(x,h-pad.b);c.stroke();c.save();c.translate(x,h-pad.b+13);c.rotate(-Math.PI/7);c.fillStyle='#9bb5cc';c.textAlign='right';c.fillText(fmt(points[i].recordedAt),0,0);c.restore();}
    function series(values,min,max,color){if(mode==='bar'){const bw=Math.max(1,iw/points.length*.3);values.forEach((v,i)=>{c.fillStyle=color+'aa';c.fillRect(toX(i)-bw/2,toY(v,min,max),bw,pad.t+ih-toY(v,min,max));});return}c.beginPath();values.forEach((v,i)=>i?c.lineTo(toX(i),toY(v,min,max)):c.moveTo(toX(i),toY(v,min,max)));if(mode==='area'){c.lineTo(toX(values.length-1),pad.t+ih);c.lineTo(toX(0),pad.t+ih);c.closePath();const g=c.createLinearGradient(0,pad.t,0,pad.t+ih);g.addColorStop(0,color+'55');g.addColorStop(1,color+'05');c.fillStyle=g;c.fill();c.beginPath();values.forEach((v,i)=>i?c.lineTo(toX(i),toY(v,min,max)):c.moveTo(toX(i),toY(v,min,max)));}c.strokeStyle=color;c.lineWidth=2.5;c.shadowColor=color;c.shadowBlur=8;c.stroke();c.shadowBlur=0;}
    series(temps,tMin,tMax,'#25d4ff');series(hums,0,100,'#29dc79');c.fillStyle='#b8cce0';c.textAlign='left';c.fillText('อุณหภูมิ (°C)',4,12);c.textAlign='right';c.fillText('ความชื้น (%RH)',w-4,12);
  };
  const chart=$('#sensorChart');if(chart)new ResizeObserver(()=>{if(sensorChartData)drawSensorHistory(sensorChartData);}).observe(chart.parentElement);
})();
