/* Task details, a compact action menu, and one level of subtasks.
   Optional JSON fields preserve compatibility with existing daily_entries. */
const DailyTasks=(()=>{
  function setDone(task,done){task.done=!!done;if(done)(task.subtasks||[]).forEach(child=>child.done=true)}
  function addSubtask(task,text){const title=String(text||'').trim();if(!title)return false;if(!Array.isArray(task.subtasks))task.subtasks=[];task.subtasks.push({text:title,done:false});task.done=false;return true}
  function setSubtaskDone(task,index,done){if(!task.subtasks?.[index])return false;task.subtasks[index].done=!!done;if(!done)task.done=false;return true}
  function moveNextDay(data,task,date){const index=data.tasks.indexOf(task);if(index<0)return null;const next=new Date(date);next.setDate(next.getDate()+1);const destination=getData(key(next));data.tasks.splice(index,1);destination.tasks.push(task);return next}
  return {setDone,addSubtask,setSubtaskDone,moveNextDay};
})();

(()=>{
  const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
  const icon=name=>({more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',next:'<rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v4m10-4v4M3 10h18m-12 5h6m-2-2 2 2-2 2"/>',sub:'<path d="M5 4v10a3 3 0 0 0 3 3h11m-3-3 3 3-3 3M11 6h8m-8 4h5"/>',note:'<path d="M8 4H6a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-2M10 14l1-4 7-7 3 3-7 7-4 1Z"/>'}[name]);
  function svg(name){const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('viewBox','0 0 24 24');el.setAttribute('aria-hidden','true');el.innerHTML=icon(name);return el}
  let closeMenu=()=>{};
  function valid(task,data,date,owner){return currentUser?.id===owner&&state[key(date)]===data&&data.tasks.includes(task)}
  function notice(text){document.querySelector('.task-notice')?.remove();const toast=node('div','task-notice',text);toast.setAttribute('role','status');document.body.append(toast);setTimeout(()=>toast.remove(),3300)}
  function dialog(title,trigger){
    closeMenu();document.querySelector('.task-dialog-overlay')?.remove();const overlay=node('div','task-dialog-overlay'),card=node('section','task-dialog');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label',title);
    const head=node('div','task-dialog-head'),heading=node('h2','',title),close=node('button','task-icon-btn','×');close.type='button';close.setAttribute('aria-label','بستن');head.append(heading,close);card.append(head);overlay.append(card);document.body.append(overlay);
    const events=new AbortController();function dismiss(){events.abort();overlay.classList.add('leaving');setTimeout(()=>{overlay.remove();if(trigger?.isConnected)trigger.focus()},160)}
    close.onclick=dismiss;overlay.onclick=e=>{if(e.target===overlay)dismiss()};overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dismiss()}if(e.key==='Tab'){const fields=[...card.querySelectorAll('button,input,textarea')].filter(x=>!x.disabled),first=fields[0],last=fields.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}},{signal:events.signal});
    return {card,dismiss};
  }
  function editDetails(task,data,date,trigger){
    const owner=currentUser?.id,before=JSON.stringify(task),{card,dismiss}=dialog('جزئیات کار',trigger),form=node('form','task-detail-form');
    const titleLabel=node('label','','عنوان کار'),title=node('input');title.type='text';title.value=task.text||'';title.maxLength=500;title.required=true;titleLabel.append(title);
    const label=node('label','','توضیحات'),description=node('textarea');description.rows=5;description.maxLength=5000;description.value=task.description||'';description.placeholder='جزئیات، ایده‌ها یا نکته‌های مربوط به این کار…';label.append(description);
    const help=node('p','task-dialog-hint','توضیحات زیر عنوان این کار نمایش داده می‌شود.'),actions=node('div','task-dialog-actions'),cancel=node('button','task-text-btn','انصراف'),submit=node('button','task-primary-btn','ذخیره');cancel.type='button';cancel.onclick=dismiss;submit.type='submit';actions.append(cancel,submit);form.append(titleLabel,label,help,actions);card.append(form);description.focus();
    form.onsubmit=e=>{e.preventDefault();if(!title.value.trim())return;if(!valid(task,data,date,owner)||JSON.stringify(task)!==before){notice('این کار تغییر کرده؛ آن را دوباره باز کنید.');dismiss();return}task.text=title.value.trim();task.description=description.value.trim();save();dismiss();renderDay()};
  }
  function addSubtask(task,data,date,trigger){
    const owner=currentUser?.id,{card,dismiss}=dialog('افزودن زیرکار',trigger),parent=node('p','task-dialog-hint','زیرمجموعهٔ «'+task.text+'»'),form=node('form','task-detail-form'),label=node('label','','عنوان زیرکار'),input=node('input');input.type='text';input.required=true;input.maxLength=500;input.placeholder='مثلاً آماده‌کردن فایل‌ها';label.append(input);const actions=node('div','task-dialog-actions'),cancel=node('button','task-text-btn','انصراف'),submit=node('button','task-primary-btn','افزودن زیرکار');cancel.type='button';cancel.onclick=dismiss;actions.append(cancel,submit);form.append(label,actions);card.append(parent,form);input.focus();
    form.onsubmit=e=>{e.preventDefault();if(!valid(task,data,date,owner)){notice('این کار تغییر کرده؛ دوباره تلاش کنید.');dismiss();return}if(!DailyTasks.addSubtask(task,input.value))return;save();dismiss();renderDay()};
  }
  function actionMenu(task,data,date,trigger){
    closeMenu();const owner=currentUser?.id,menu=node('div','task-action-menu');menu.setAttribute('role','menu');menu.setAttribute('aria-label','گزینه‌های کار');
    const next=new Date(date);next.setDate(next.getDate()+1);const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
    const entries=[['next',key(next)===key(tomorrow)?'موکول‌کردن به فردا':'موکول‌کردن به روز بعد',fmtJ(next),()=>{const moved=DailyTasks.moveNextDay(data,task,date);if(moved){save();renderDay();notice('کار و زیرکارهای آن به '+fmtJ(moved)+' منتقل شدند.')}}],['sub','افزودن زیرکار','یک مرحلهٔ کوچک برای این کار',()=>addSubtask(task,data,date,trigger)],['note','توضیحات کار','مشاهده و ویرایش جزئیات',()=>editDetails(task,data,date,trigger)]];
    entries.forEach(([symbol,title,hint,run])=>{const button=node('button','task-menu-item');button.type='button';button.setAttribute('role','menuitem');const copy=node('span','task-menu-copy');copy.append(node('span','',title),node('small','',hint));button.append(svg(symbol),copy);button.onclick=()=>{closeMenu();if(!valid(task,data,date,owner)){notice('اطلاعات این کار تغییر کرده؛ دوباره تلاش کنید.');return}run()};menu.append(button)});
    document.body.append(menu);trigger.setAttribute('aria-expanded','true');const events=new AbortController();closeMenu=()=>{events.abort();menu.remove();trigger.setAttribute('aria-expanded','false');closeMenu=()=>{}};
    const rect=trigger.getBoundingClientRect(),bounds=menu.getBoundingClientRect();menu.style.left=Math.max(12,Math.min(rect.right-bounds.width,window.innerWidth-bounds.width-12))+'px';menu.style.top=Math.max(12,Math.min(rect.bottom+7,window.innerHeight-bounds.height-12))+'px';
    document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target)&&!trigger.contains(e.target))closeMenu()},{capture:true,signal:events.signal});window.addEventListener('resize',()=>closeMenu(),{signal:events.signal});window.addEventListener('scroll',()=>closeMenu(),{capture:true,signal:events.signal});
    menu.onkeydown=e=>{const choices=[...menu.querySelectorAll('button')],index=choices.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();closeMenu();trigger.focus()}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const nextIndex=e.key==='Home'?0:e.key==='End'?choices.length-1:(index+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;choices[nextIndex].focus()}else if(e.key==='Tab')closeMenu()};menu.querySelector('button').focus();
  }
  const originalEditor=taskEditor;
  taskEditor=function(task,data,index){
    const row=originalEditor(task,data,index),date=new Date(activeDate||new Date()),owner=currentUser?.id;row.classList.add('task-rich-row');const input=row.querySelector('input[type=text]'),title=node('button','task-title-button',task.text||'کار بدون عنوان');title.type='button';title.setAttribute('aria-label','جزئیات کار: '+(task.text||''));input.replaceWith(title);title.onclick=()=>editDetails(task,data,date,title);
    const more=node('button','task-icon-btn task-more-button');more.type='button';more.setAttribute('aria-label','گزینه‌های کار: '+(task.text||''));more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-expanded','false');more.append(svg('more'));more.onclick=e=>{e.stopPropagation();if(more.getAttribute('aria-expanded')==='true'){closeMenu();return}actionMenu(task,data,date,more)};row.insertBefore(more,row.querySelector('.delete-btn'));
    const checkbox=row.querySelector('input[type=checkbox]'),change=checkbox.onchange;checkbox.onchange=event=>{DailyTasks.setDone(task,checkbox.checked);change(event)};
    if(task.description){const description=node('button','task-inline-description',task.description);description.type='button';description.title='ویرایش توضیحات';description.onclick=()=>editDetails(task,data,date,title);row.append(description)}
    if(Array.isArray(task.subtasks)&&task.subtasks.length){const section=node('div','task-subtasks'),heading=node('div','task-subtasks-heading','زیرکارها · '+new Intl.NumberFormat('fa-IR').format(task.subtasks.filter(x=>x.done).length)+' / '+new Intl.NumberFormat('fa-IR').format(task.subtasks.length));section.append(heading);task.subtasks.forEach((child,i)=>{const item=node('label','task-subtask'+(child.done?' is-done':'')),box=node('input'),text=node('span','',child.text);box.type='checkbox';box.checked=!!child.done;box.setAttribute('aria-label','انجام زیرکار: '+child.text);box.onchange=()=>{if(!valid(task,data,date,owner))return;DailyTasks.setSubtaskDone(task,i,box.checked);save();renderDay()};item.append(box,text);section.append(item)});row.append(section)}
    // Only drag the parent from its grip; text selection and child controls stay usable.
    row.draggable=false;row.querySelector('.drag-grip').onpointerdown=()=>{row.draggable=true};row.addEventListener('dragend',()=>row.draggable=false);row.addEventListener('pointerup',()=>row.draggable=false);
    return row;
  };
  const originalHome=renderHome;
  renderHome=function(){closeMenu();originalHome();const days=visibleDays();document.querySelectorAll('#days .day-card').forEach((card,i)=>{const tasks=(getData(key(days[i])).tasks||[]).filter(t=>t.text).slice(0,4);card.querySelectorAll('.tasks-summary .summary-item').forEach((item,j)=>{const task=tasks[j];if(!task)return;if(task.description)item.append(node('small','task-summary-description',task.description));if(task.subtasks?.length)item.append(node('small','task-summary-subtasks','زیرکارها: '+task.subtasks.filter(x=>x.done).length+' / '+task.subtasks.length))})})};
  const originalPreview=showDayPreview;
  showDayPreview=function(date){originalPreview(date);const tasks=document.querySelector('#previewTasks');tasks.replaceChildren();(getData(key(date)).tasks||[]).filter(t=>t.text).forEach(task=>{const block=node('div','task-preview-block'),line=node('div','preview-row'+(task.done?' done':''));line.append(node('span','',(task.starred?'★ ':'')+(task.done?'✓ ':'○ ')+task.text));if(task.duration)line.append(node('b','preview-task-duration',task.duration));block.append(line);if(task.description)block.append(node('p','task-preview-description',task.description));(task.subtasks||[]).forEach(child=>block.append(node('div','task-preview-subtask'+(child.done?' is-done':''),(child.done?'✓ ':'○ ')+child.text)));tasks.append(block)});if(!tasks.childNodes.length)tasks.append(node('div','preview-row','کاری ثبت نشده'))};
  // Details and menu actions are available only in the editor; previews remain read-only.
  if(typeof updates!=='undefined')updates[0].details.push('افزودن منوی کار، انتقال به روز بعد، توضیحات و زیرکارها با تکمیل خودکار همراه کار اصلی.');
  if(document.querySelector('#taskEditor'))renderDay();
  else if(document.querySelector('#days'))renderHome();
})();
