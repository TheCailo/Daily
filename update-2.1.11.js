/* Daily 2.1.11: additions kept separate so existing entry formats remain unchanged. */
let profile211=null, admin211=false, budgetData211={months:{},weeks:{}}, budgetReady211=false, budgetConflict211=false;
let budgetWrite211=Promise.resolve();
const monthKey211=()=>{const j=toJalali(cursor.getFullYear(),cursor.getMonth()+1,cursor.getDate());return j[0]+'-'+pad(j[1])};
const weekKey211=()=>key(startOfWeek(cursor));
const budgetKey211=()=>currentUser?'daily-budget-211-'+currentUser.id:null;
function items211(){return budgetData211.months[monthKey211()]||[]}
function total211(){return items211().reduce((sum,item)=>sum+(Number(item.amount)||0),0)}
function refreshBudgetValues211(){budgets.weekly=Number(budgetData211.weeks[weekKey211()])||0;budgets.monthly=total211()}
async function load211(user){
  profile211=null;admin211=false;budgetReady211=false;
  const [profile,admin,cloud]=await Promise.all([
    supabaseClient.from('profiles').select('*').eq('id',user.id).maybeSingle(),
    supabaseClient.rpc('daily_is_admin'),
    supabaseClient.from('daily_budget_settings').select('budgets').eq('user_id',user.id).maybeSingle()
  ]);
  if(!currentUser||currentUser.id!==user.id)return;
  profile211=profile.data||{username:user.user_metadata?.username||'کاربر'};
  admin211=!admin.error&&admin.data===true;
  let local=null;try{local=JSON.parse(localStorage.getItem(budgetKey211())||'null')}catch{}
  const pending=localStorage.getItem(budgetKey211()+'-pending')==='1';
  budgetConflict211=!!(pending&&local&&cloud.data);
  budgetData211=(budgetConflict211?local:cloud.data?.budgets)||local||{months:{},weeks:{}};
  budgetData211.months=budgetData211.months||{};budgetData211.weeks=budgetData211.weeks||{};
  if(!cloud.data&&!local&&String(profile211.username||'').toLowerCase()==='cailo'){
    const old=(()=>{try{return JSON.parse(localStorage.getItem('daily-budget-v1')||'{}')}catch{return {}}})();
    if(Number(old.weekly)>0)budgetData211.weeks[weekKey211()]=Number(old.weekly);
    if(Number(old.monthly)>0)budgetData211.months[monthKey211()]=[{label:'بودجهٔ قبلی',amount:Number(old.monthly)}];
  }
  budgetReady211=!cloud.error&&!budgetConflict211;
  if(budgetReady211&&!cloud.data&&(local||Object.keys(budgetData211.months).length||Object.keys(budgetData211.weeks).length))persist211();
  refreshBudgetValues211();
}
function persist211(){
  if(!currentUser)return;
  const userId=currentUser.id,snapshot=JSON.parse(JSON.stringify(budgetData211));
  localStorage.setItem(budgetKey211(),JSON.stringify(snapshot));localStorage.setItem(budgetKey211()+'-pending','1');
  if(!budgetReady211)return;
  budgetWrite211=budgetWrite211.then(async()=>{const {error}=await supabaseClient.from('daily_budget_settings').upsert({user_id:userId,budgets:snapshot,updated_at:new Date().toISOString()});if(error){budgetReady211=false;alert('بودجه روی این دستگاه ذخیره شد، اما همگام‌سازی با دیتابیس انجام نشد. اتصال و تنظیمات دیتابیس را بررسی کنید.')}else if(localStorage.getItem('daily-budget-211-'+userId)===JSON.stringify(snapshot)){localStorage.removeItem('daily-budget-211-'+userId+'-pending')}}).catch(()=>{budgetReady211=false;alert('بودجه روی دستگاه ذخیره شد اما اتصال به دیتابیس برقرار نشد.')});
}
const beginOriginal211=beginUserSession;
beginUserSession=async function(user){await beginOriginal211(user);if(currentUser?.id===user.id){await load211(user);if(currentUser?.id===user.id&&page==='home')renderHome()}};
const outOriginal211=signOut;
signOut=async function(){await budgetWrite211;await outOriginal211();profile211=null;admin211=false;budgetData211={months:{},weeks:{}};budgetReady211=false};
const refreshOriginal211=refreshCloud;
refreshCloud=async function(){await budgetWrite211;await refreshOriginal211();if(currentUser){await load211(currentUser);if(page==='home')renderHome()}};
saveBudgets=function(){budgetData211.weeks[weekKey211()]=Math.max(0,Number(budgets.weekly)||0);persist211()};
const budgetMarkupOriginal211=budgetMarkup;
budgetMarkup=function(week,month){refreshBudgetValues211();return budgetMarkupOriginal211(week,month).replace('</section>','<div class="budget-more"><button id="budgetDetails211" class="soft-btn">ریز بودجهٔ ماه ✎</button>'+(budgetConflict211?'<small>بودجهٔ ذخیره‌نشدهٔ این دستگاه با نسخهٔ ابری تداخل دارد.</small><button id="resolveBudget211" class="soft-btn">ارسال بودجهٔ این دستگاه</button>':budgetReady211?'':'<small>بودجه فعلاً فقط در این دستگاه ذخیره می‌شود؛ تنظیمات دیتابیس را فعال کنید.</small>')+'</div></section>')};
const bindBudgetsOriginal211=bindBudgets;
bindBudgets=function(){bindBudgetsOriginal211();const monthly=$('#monthlyBudget');if(monthly){monthly.readOnly=true;monthly.title='از بخش ریز بودجه ویرایش کنید';monthly.onclick=openBudget211}const button=$('#budgetDetails211');if(button)button.onclick=openBudget211;const resolve=$('#resolveBudget211');if(resolve)resolve.onclick=()=>{if(confirm('بودجهٔ این دستگاه جایگزین بودجهٔ ذخیره‌شده در فضای ابری می‌شود. ادامه می‌دهید؟')){budgetConflict211=false;budgetReady211=true;persist211();renderHome()}}};
function modal211(title,content){
  document.querySelector('#modal211')?.remove();const el=document.createElement('div');el.id='modal211';el.className='modal modal-211';
  el.innerHTML='<div class="modal-card modal-card-211"><div class="modal-head"><h2>'+escapeHtml(title)+'</h2><button class="close-btn" aria-label="بستن">×</button></div>'+content+'</div>';
  document.body.appendChild(el);el.querySelector('.close-btn').onclick=()=>el.remove();el.onclick=e=>{if(e.target===el)el.remove()};return el;
}
function openBudget211(){
  const mk=monthKey211(),rows=items211();const modal=modal211('ریز بودجهٔ ماه '+mk,'<p class="muted">مجموع این موارد، بودجهٔ ماه انتخاب‌شده است.</p><div id="budgetRows211"></div><form id="budgetForm211" class="form-211"><label>عنوان<input name="label" maxlength="80" required placeholder="مثلاً اجاره"></label><label>مبلغ (تومان)<input name="amount" inputmode="numeric" required placeholder="مثلاً ۱۰٬۰۰۰٬۰۰۰"></label><button class="back-btn">افزودن به بودجه</button></form><div class="budget-total-211">جمع بودجهٔ ماه: <strong id="budgetTotal211"></strong></div>');
  function paint(){modal.querySelector('#budgetRows211').innerHTML=rows.map((row,i)=>'<div class="budget-row-211"><span>'+escapeHtml(row.label)+'</span><strong>'+money(row.amount)+'</strong><button type="button" data-edit="'+i+'">ویرایش</button><button type="button" data-delete="'+i+'" aria-label="حذف">×</button></div>').join('')||'<p class="muted">هنوز موردی ثبت نشده است.</p>';modal.querySelector('#budgetTotal211').textContent=money(total211());
    modal.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{rows.splice(Number(b.dataset.delete),1);budgetData211.months[mk]=rows;persist211();paint()});
    modal.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.edit),form=modal.querySelector('form');form.elements.namedItem('label').value=rows[i].label;form.elements.namedItem('amount').value=rows[i].amount;form.dataset.edit=i;form.querySelector('button').textContent='ذخیره تغییرات';form.elements.namedItem('label').focus()});}
  modal.querySelector('form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,label=f.elements.namedItem('label').value.trim(),amount=Number(normalizeDigits(f.elements.namedItem('amount').value));if(!label||!Number.isFinite(amount)||amount<=0){alert('عنوان و مبلغ معتبر وارد کنید.');return}const item={label,amount};if(f.dataset.edit!==undefined){rows[Number(f.dataset.edit)]=item;delete f.dataset.edit}else rows.push(item);budgetData211.months[mk]=rows;persist211();f.reset();f.querySelector('button').textContent='افزودن به بودجه';paint()};
  const close=modal.querySelector('.close-btn');close.onclick=()=>{modal.remove();renderHome()};modal.onclick=e=>{if(e.target===modal){modal.remove();renderHome()}};paint();
}
const headerOriginal211=header;
header=function(){const name=profile211?.display_name||profile211?.username||currentUser?.user_metadata?.username||'کاربر';return headerOriginal211().replace(/(id="updatesBtn"[^>]*>ⓘ)(?:<i><\/i>)?/,(_,prefix)=>prefix+(localStorage.getItem('daily-last-update')==='۲.۱.۱۱'?'':'<i></i>')).replace("Cailo's To Do List",escapeHtml(name)+"'s To Do List").replace('تقویم دیجیتال کایلو','تقویم دیجیتال '+escapeHtml(name)).replace('<div class="top-actions">','<div class="top-actions"><button id="profile211" class="tool-btn profile-button-211" aria-label="پروفایل" title="پروفایل"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3-7 8-7s8 3 8 7"/></svg></button>'+(admin211?'<button id="admin211" class="soft-btn">پنل مدیریت</button>':''))};
const bindHeaderOriginal211=bindHeader;
bindHeader=function(){bindHeaderOriginal211();document.querySelector('.account-chip')?.remove();$('#changePasswordBtn')?.remove();$('#signOutBtn')?.remove();$('#profile211').onclick=profileMenu211;if($('#admin211'))$('#admin211').onclick=adminPanel211;
  $('#prevMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);buildCalendar()};$('#nextMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);buildCalendar()};
};
function profileMenu211(){const name=profile211?.display_name||profile211?.username||'کاربر';const modal=modal211('پروفایل','<div class="profile-intro-211"><span>◉</span><div><strong>'+escapeHtml(name)+'</strong><small>نام ورود: '+escapeHtml(profile211?.username||'')+'</small></div></div><div class="profile-menu-211"><button data-action="info">اطلاعات کاربری <span>‹</span></button><button data-action="password">تغییر رمز عبور <span>‹</span></button><button data-action="theme">تغییر حالت روشن / تاریک <span>‹</span></button><button data-action="logout" class="danger-211">خروج از حساب <span>‹</span></button></div>');modal.querySelector('[data-action="info"]').onclick=profileForm211;modal.querySelector('[data-action="password"]').onclick=passwordForm211;modal.querySelector('[data-action="theme"]').onclick=()=>{toggleTheme();modal.remove()};modal.querySelector('[data-action="logout"]').onclick=()=>{modal.remove();signOut()}}
function profileForm211(){const p=profile211||{};const modal=modal211('اطلاعات کاربری','<form class="form-211"><label>نام نمایشی<input name="display" maxlength="60" value="'+escapeHtml(p.display_name||'')+'" placeholder="نام دلخواه"></label><label>شماره تلفن<input name="phone" maxlength="30" value="'+escapeHtml(p.phone||'')+'" required></label><label>دربارهٔ من (اختیاری)<input name="bio" maxlength="200" value="'+escapeHtml(p.bio||'')+'"></label><p class="muted">نام ورود تغییر نمی‌کند: '+escapeHtml(p.username||'')+'</p><p class="error-211"></p><button class="back-btn">ذخیره اطلاعات</button></form>');modal.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button');btn.disabled=true;const {error}=await supabaseClient.rpc('daily_update_profile',{p_display_name:f.display.value.trim(),p_phone:f.phone.value.trim(),p_bio:f.bio.value.trim()});btn.disabled=false;if(error){f.querySelector('.error-211').textContent='ذخیره نشد؛ تنظیمات دیتابیس و اتصال اینترنت را بررسی کنید.';return}profile211={...p,display_name:f.display.value.trim(),phone:f.phone.value.trim(),bio:f.bio.value.trim()};modal.remove();renderHome()}}
function passwordForm211(){const modal=modal211('تغییر رمز عبور','<form class="form-211"><label>رمز جدید<input name="password" type="password" minlength="8" required autocomplete="new-password"></label><label>تکرار رمز جدید<input name="confirm" type="password" minlength="8" required autocomplete="new-password"></label><p class="error-211"></p><button class="back-btn">تغییر رمز عبور</button></form>');modal.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;if(f.password.value!==f.confirm.value){f.querySelector('.error-211').textContent='رمزها یکسان نیستند.';return}const btn=f.querySelector('button');btn.disabled=true;const {error}=await supabaseClient.auth.updateUser({password:f.password.value});btn.disabled=false;if(error){f.querySelector('.error-211').textContent='تغییر رمز انجام نشد: '+error.message;return}modal.remove();alert('رمز عبور با موفقیت تغییر کرد.')}}
async function adminPanel211(){const modal=modal211('پنل مدیریت Daily','<p class="muted">در حال دریافت اطلاعات…</p>');const {data,error}=await supabaseClient.rpc('daily_admin_overview');if(!modal.isConnected)return;if(error){modal.querySelector('.muted').textContent='دسترسی یا دریافت اطلاعات ممکن نیست.';return}const metrics=[['کاربران',data.users],['کاربران فعال ۳۰ روز اخیر',data.active_users],['روزهای ثبت‌شده',data.days],['کارها',data.tasks],['هزینه‌ها',data.expenses]];modal.querySelector('.muted').outerHTML='<div class="admin-metrics-211">'+metrics.map(x=>'<div><span>'+x[0]+'</span><strong>'+new Intl.NumberFormat('fa-IR').format(x[1])+'</strong></div>').join('')+'</div><h3>حساب‌ها</h3><div class="admin-list-211">'+data.accounts.map(a=>'<div><strong>'+escapeHtml(a.display_name||a.username)+'</strong><span>'+escapeHtml(a.username)+' · آخرین فعالیت: '+(a.last_entry?new Date(a.last_entry).toLocaleDateString('fa-IR'):'—')+'</span></div>').join('')+'</div><p class="muted">رمزها و محتوای خصوصی کاربران در این پنل نمایش داده نمی‌شوند.</p>'}
const calendarOriginal211=buildCalendar;
buildCalendar=function(){calendarOriginal211();const grid=$('#calendarGrid');const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();grid.querySelectorAll('button.cal-cell').forEach((cell,i)=>{cell.querySelector('small').textContent=fmtG(new Date(y,m,i+1))});const first=toJalali(y,m+1,1),last=toJalali(y,m+1,new Date(y,m+1,0).getDate());$('#calendarMonth').textContent=first[0]+'/'+pad(first[1])+(first[1]!==last[1]?' – '+last[0]+'/'+pad(last[1]):'')+' · '+y+'/'+pad(m+1);grid.classList.remove('calendar-animate-211');void grid.offsetWidth;grid.classList.add('calendar-animate-211')};
function budgetReportRows211(){const month=monthKey211(),weeks=Object.entries(budgetData211.weeks).filter(([date])=>{const [y,m,d]=date.split('-').map(Number),start=new Date(y,m-1,d);return Array.from({length:7},(_,i)=>{const day=new Date(start);day.setDate(day.getDate()+i);const j=toJalali(day.getFullYear(),day.getMonth()+1,day.getDate());return j[0]+'-'+pad(j[1])}).includes(month)}).sort(([a],[b])=>a.localeCompare(b));return [['بودجهٔ ماه '+month,total211()],...weeks.map(([date,value])=>['بودجهٔ هفته از '+fmtJ(new Date(...date.split('-').map((v,i)=>Number(v)-(i===1?1:0)))),Number(value)||0]),...items211().map(x=>['ریز بودجه: '+x.label,Number(x.amount)||0])]}
function budgetReportHtml211(){return '<h2>بودجه‌بندی هفته و ماه</h2><table><thead><tr><th>عنوان</th><th>مبلغ</th></tr></thead><tbody>'+budgetReportRows211().map(x=>'<tr><td>'+escapeHtml(x[0])+'</td><td>'+money(x[1])+'</td></tr>').join('')+'</tbody></table>'}
const professionalOriginal211=professionalReport;
professionalReport=function(title,items){return professionalOriginal211(title,items).replace('<footer class="foot">',budgetReportHtml211()+'<footer class="foot">')};
const downloadOriginal211=downloadFile;
downloadFile=function(content,type,name){if(name==='Daily-detailed-report.xls')content=content.replace('</Workbook>',excelSheet('بودجه',['عنوان','مبلغ'],budgetReportRows211())+'</Workbook>');return downloadOriginal211(content,type,name)};
const reportOriginal211=renderReport;
renderReport=function(){reportOriginal211();const panel=document.createElement('section');panel.className='report-panel budget-report-211';panel.innerHTML='<h3>بودجه‌بندی هفته و ماه</h3>'+budgetReportRows211().map(row=>'<div class="budget-row-211"><span>'+escapeHtml(row[0])+'</span><strong>'+money(row[1])+'</strong></div>').join('');$('#reportContent').after(panel)};
updates.unshift({version:'۲.۱.۱۱',title:'پروفایل و بودجه‌بندی پیشرفته',details:['افزودن پنل مدیریت امن برای مدیر برنامه.','امکان ثبت ریز بودجهٔ ماهانه و نمایش بودجه در گزارش‌ها و خروجی‌ها.','افزودن منوی پروفایل و ویرایش اطلاعات کاربری.','بهبود تقویم و نمایش تاریخ میلادی.','بهبود حرکت و انیمیشن رابط کاربری.']});
const showUpdatesOriginal211=showUpdates;
showUpdates=function(){showUpdatesOriginal211();localStorage.setItem('daily-last-update','۲.۱.۱۱')};
if(currentUser){load211(currentUser).then(()=>{if(currentUser&&page==='home')renderHome()})}
