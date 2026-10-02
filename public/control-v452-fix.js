(() => {
  const openNativePicker = input => {
    if (!input || input.disabled) return;
    try { input.focus({preventScroll:true}); if (typeof input.showPicker === 'function') input.showPicker(); else input.click(); }
    catch (_) { input.focus(); }
  };
  const bindPickerFields = root => root.querySelectorAll('.pickerShell').forEach(shell => {
    if (shell.dataset.fullPicker === '1') return;
    const input = shell.querySelector('input[type="date"],input[type="time"]'); if (!input) return;
    shell.dataset.fullPicker = '1'; shell.tabIndex = 0; shell.title = input.type === 'date' ? 'เลือกวันที่' : 'เลือกเวลา';
    const menu = input.type === 'time' ? shell.querySelector('.timeMenu') : null;
    if (menu) {
      menu.addEventListener('click', e => e.stopPropagation());
      menu.addEventListener('keydown', e => e.stopPropagation());
    }
    shell.addEventListener('click', e => {
      if (input.disabled || e.target.closest('.timeMenu') || e.target.closest('.timeHit')) return;
      e.preventDefault();
      if (menu) menu.classList.toggle('open'); else openNativePicker(input);
    });
    shell.addEventListener('keydown', e => {
      if (e.target.closest('.timeMenu') || e.target.closest('.timeHit')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!input.disabled) { if (menu) menu.classList.toggle('open'); else openNativePicker(input); }
      }
    });
  });
  const originalDraw = window.draw;
  window.draw = function(){
    const drafts=[];
    document.querySelectorAll('.relay').forEach(card=>{
      const counter=card.querySelector('[id^="count-"]');
      const zone=Number(counter?.id.slice(6));
      if (!counter || !openSchedules.has(zone) || !card.querySelector('.schedulePanel')?.classList.contains('open')) return;
      card.querySelectorAll('.onDate,.onTime,.offDate,.offTime').forEach(input=>{
        const name=['onDate','onTime','offDate','offTime'].find(c=>input.classList.contains(c));
        drafts.push({zone,name,value:input.value,hour24:input.dataset.hour24||''});
      });
    });
    originalDraw();
    drafts.forEach(draft=>{
      if (!openSchedules.has(draft.zone)) return;
      const input=document.querySelector(`#count-${draft.zone}`)?.closest('.relay')?.querySelector('.'+draft.name);
      if (!input) return;
      input.value=draft.value; input.dataset.hour24=draft.hour24;
      if (input.type==='date') input.dispatchEvent(new Event('change',{bubbles:true}));
      else {
        const shell=input.parentElement,parts=(draft.value||'01:00').split(':'),hour=draft.hour24==='1'?'24':parts[0];
        const display=shell.querySelector('.pickerDisplay');
        if (display) display.textContent=draft.value?`${hour}.${parts[1]} น.`:'เลือกเวลา';
        const hours=shell.querySelector('select[title="ชั่วโมง"]'),minutes=shell.querySelector('select[title="นาที"]');
        if (hours) hours.value=hour; if (minutes) minutes.value=parts[1];
      }
    });
    bindPickerFields(document);
  };
  window.updateCountdowns = function(){
    const now=Date.now()/1000;
    schedules.forEach((x,i)=>{const e=document.querySelector(`#count-${i} span`);if(!e)return;const expired=x&&now>=x.stop;e.textContent=!x?'ยังไม่ได้ตั้งเวลา':now<x.start?`เปิดใน ${duration(x.start-now)}`:now<x.stop?`กำลังเปิด • ปิดใน ${duration(x.stop-now)}`:'สิ้นสุดตารางเวลาแล้ว';const card=e.closest('.relay');if(card)card.classList.toggle('activeSchedule',Boolean(x&&!expired));const toggle=card?.querySelector('.scheduleToggle');if(toggle)toggle.classList.toggle('active',Boolean(x&&!expired));});
  };
  bindPickerFields(document); window.draw();
})();
