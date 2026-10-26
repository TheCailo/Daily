/* Local intent-based assistant. No model API, keys, or external chat requests. */
const DailyChatbot=(()=>{
  const normalize=value=>String(value??'').replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200e\u200f]/g,' ').replace(/\s+/g,' ').trim();
  const canon=value=>normalize(value).toLowerCase().replace(/[؟?!.،,:：]/g,' ').replace(/\s+/g,' ').trim();
  // 25 supported intents, eight natural-language examples each = 200 examples.
  // Responses are computed from the signed-in user's data, never canned amounts.
  const training=[
    ['greeting',['سلام','درود','سلام دیلی','سلام خوبی','هی دیلی','سلام رفیق','صبح بخیر','شب بخیر']],
    ['help',['راهنما','چه کارهایی بلدی','کمکم کن','قابلیت های دستیار چیست','چطور از چت استفاده کنم','چه چیزی می توانم بپرسم','دستیار چه کاری انجام می دهد','نمونه دستورها را بگو']],
    ['date',['امروز چندمه','تاریخ امروز چیست','تاریخ شمسی امروز','امروز چه روزیه','تاریخ میلادی امروز','تقویم امروز را بگو','تاریخ روز انتخاب شده','فردا چندمه']],
    ['expense_day',['امروز چقدر خرج کردم','خرج امروز چقدره','هزینه امروز را بگو','مجموع مخارج امروز','دیروز چقدر خرج کردم','فردا چقدر هزینه ثبت شده','هزینه روز انتخاب شده چقدر است','جمع هزینه روز']],
    ['expense_week',['این هفته چقدر خرج کردم','خرج هفته چقدره','هزینه های هفتگی من','جمع مخارج هفته','گزارش هزینه هفته','مجموع هزینه این هفته','خرج این هفته را بگو','چقدر این هفته هزینه داشتم']],
    ['expense_month',['این ماه چقدر خرج کردم','خرج ماه چقدره','هزینه های ماهانه من','جمع مخارج ماه','گزارش هزینه ماه','مجموع هزینه این ماه','خرج این ماه را بگو','چقدر این ماه هزینه داشتم']],
    ['top_category',['این ماه بیشترین خرجم چی بوده','بیشتر کجا خرج کردم','بیشترین دسته هزینه ماه','پرهزینه ترین دسته چیست','کدام دسته بیشترین هزینه را دارد','بیشترین مخارجم برای چی بوده','این هفته بیشترین دسته هزینه','امروز بیشتر کجا خرج کردم']],
    ['categories',['هزینه ها به تفکیک دسته','گزارش دسته بندی ها','ریز دسته های این ماه','مجموع هر دسته چقدره','خرج رستوران این ماه','خرج قهوه این هفته','هزینه سوپرمارکت امروز','تفکیک مخارج ماه']],
    ['top_expense',['گران ترین هزینه این ماه','بزرگ ترین خرید امروز','بیشترین مبلغ یک هزینه','گران ترین خرید هفته','بالاترین هزینه کدام است','بزرگ ترین خرج ماه','کدام خرید گران تر بوده','بیشترین تک هزینه']],
    ['remaining_tasks',['کارهای انجام نشده امروز','چه کارهایی باقی مانده','کارهای باقی مانده را بگو','کارهای باز امروز','هنوز چه کاری انجام ندادم','فهرست کارهای ناتمام','فردا چه کار ناتمامی دارم','کارهای ناقص روز انتخاب شده']],
    ['completed_tasks',['کارهای انجام شده امروز','چه کارهایی تمام شده','کارهای تکمیل شده را بگو','امروز چه کارهایی کردم','تسک های انجام شده','فهرست کارهای تمام شده','دیروز چه کاری انجام دادم','چند کار را تمام کردم']],
    ['all_tasks',['کارهای امروز چیست','امروز چه کار دارم','برنامه امروز من','فهرست کارهای روز','تمام کارها را بگو','فردا چه کارهایی دارم','برنامه دیروز من','کارهای روز انتخاب شده']],
    ['important_tasks',['کارهای مهم امروز','تسک های ستاره دار','کارهای اولویت دار من','کدام کارها مهم هستند','فهرست کارهای مهم','کارهای مهم فردا','تسک های مهم روز انتخاب شده','ستاره های امروز را بگو']],
    ['duration',['امروز چقدر زمان لازم دارم','مجموع زمان کارها','کارهای باقی مانده چند دقیقه است','چند ساعت کار دارم','زمان لازم برای فردا','مدت کارهای ناتمام','زمان کارهای امروز را بگو','چقدر کار انجام نشده به ساعت دارم']],
    ['budget_month',['بودجه ماه چقدره','بودجه ماهانه من','سقف بودجه این ماه','مجموع بودجه ماه','چقدر برای ماه بودجه دارم','بودجه ماه را بگو','جمع بودجه ماهانه','بودجه کل ماه چیست']],
    ['budget_week',['بودجه هفته چقدره','بودجه هفتگی من','سقف بودجه این هفته','مجموع بودجه هفته','چقدر برای هفته بودجه دارم','بودجه هفته را بگو','جمع بودجه هفتگی','بودجه کل هفته چیست']],
    ['budget_remaining',['چقدر از بودجه مانده','مانده بودجه ماه','باقی مانده بودجه هفته','از بودجه رد شدم','چقدر دیگر می توانم خرج کنم','بودجه ماه چقدر باقی مانده','بودجه هفته چقدر باقی مانده','کسری بودجه من چقدره']],
    ['budget_items',['ریز بودجه ماه','جزئیات بودجه بندی','بودجه اجاره چقدر است','فهرست ریز بودجه','بودجه چه مواردی دارد','ریز بودجه بندی ماهانه','جزئیات سقف ماهانه','اقلام بودجه را بگو']],
    ['profile_help',['چطور رمز عوض کنم','پروفایل کجاست','چطور نام نمایشی عوض کنم','شماره تلفن را چطور ویرایش کنم','چگونه از حساب خارج شوم','رمز عبورم را نشان بده','اطلاعات کاربری کجاست','پنل مدیریت کجاست']],
    ['report_help',['چطور خروجی بگیرم','گزارش پی دی اف می خواهم','خروجی اکسل کجاست','گزارش ورد چطور بگیرم','تقویم را چطور باز کنم','تم تاریک کجاست','چطور بودجه اضافه کنم','چطور کارها را جابه جا کنم']],
    ['add_expense',['۲۳۹ قهوه','ثبت هزینه ۵۰ هزار تومان نان','۱۲۰۰۰۰ تومان اسنپ','قهوه ۸۵','اضافه کن هزینه ۲۰۰ هزار تومان پیتزا','دیروز ۹۰ قهوه','فردا ۴۰۰ هزار تومان خرید','ثبت هزینه: دارو ۲۵۰ هزار تومان']],
    ['add_task',['کار: مطالعه ۲ ساعت','تسک: ورزش ۳۰ دقیقه','برای فردا کار: خرید','ثبت کار: تماس با علی','کار جدید: پیاده روی ۱ ساعت و ۱۵ دقیقه','افزودن کار: نوشتن گزارش','امروز کار: تمرین ۴۵ دقیقه','دیروز کار: مطالعه']],
    ['complete_task',['انجام کن: مطالعه','تکمیل کن: ورزش','تمام کن: خرید','کار مطالعه را انجام شده کن','تسک ورزش را تکمیل کن','انجام کن: تماس با علی','فردا انجام کن: خرید','دیروز تکمیل کن: مطالعه']],
    ['star_task',['ستاره دار کن: مطالعه','مهم کن: ورزش','کار خرید را مهم کن','تسک مطالعه را ستاره دار کن','برای فردا مهم کن: تماس','اولویت بده: گزارش','ستاره دار کن: پیاده روی','کار تمرین را مهم کن']],
    ['add_note',['یادداشت: روز خوبی بود','ثبت یادداشت: تماس با پزشک','برای فردا یادداشت: مدارک را بردار','افزودن یادداشت: خرید کتاب','امروز یادداشت: مرور برنامه','دیروز یادداشت: جلسه برگزار شد','یادداشت جدید: ایده های پروژه','یادداشت: پرداخت اجاره را بررسی کن']]
  ];
  const examples=training.flatMap(([intent,questions])=>questions.map(question=>({question,intent})));
  const exact=new Map(examples.map(x=>[canon(x.question),x.intent]));
  function dateFor(text,selected){const d=new Date(/امروز|فردا|دیروز/.test(text)?new Date():selected);d.setHours(0,0,0,0);if(/فردا/.test(text))d.setDate(d.getDate()+1);else if(/دیروز/.test(text))d.setDate(d.getDate()-1);return d}
  function entriesFor(scope,date){const week=startOfWeek(date),end=new Date(week);end.setDate(end.getDate()+7);const j=toJalali(date.getFullYear(),date.getMonth()+1,date.getDate());return Object.entries(state).filter(([k])=>{const [y,m,d]=k.split('-').map(Number),day=new Date(y,m-1,d);if(scope==='week')return day>=week&&day<end;if(scope==='month'){const jd=toJalali(y,m,d);return jd[0]===j[0]&&jd[1]===j[1]}return k===key(date)})}
  function infer(text){const c=canon(text);if(exact.has(c))return exact.get(c);
    if(/^(?:برای\s+)?(?:امروز|فردا|دیروز)?\s*(?:ثبت |افزودن |اضافه کردن )?یادداشت(?: جدید)?\s*[:：]/.test(text))return 'add_note';
    if(/(?:کار|تسک)(?: جدید)?\s*[:：]|(?:ثبت|افزودن|اضافه کن)\s+(?:کار|تسک)\s/.test(text))return 'add_task';
    if(/(?:انجام کن|تکمیل کن|تمام کن)\s*[:：]|(?:را )?(?:انجام شده کن|تکمیل کن)$/.test(text))return 'complete_task';
    if(/(?:ستاره دار کن|مهم کن|اولویت بده)\s*[:：]|(?:را )?(?:ستاره دار کن|مهم کن)$/.test(text))return 'star_task';
    if(/چطور|چگونه|کجاست|از کجا|رمز|پروفایل|تلفن|پنل مدیریت/.test(c))return /رمز|پروفایل|تلفن|نام نمایشی|حساب|پنل مدیریت/.test(c)?'profile_help':'report_help';
    if(/راهنما|کمک|قابلیت|چه کارهایی بلدی/.test(c))return 'help';
    if(/تاریخ|چندمه|چه روزیه/.test(c))return 'date';
    if(/بودجه/.test(c)){if(/باقی|مانده|رد شد|کسری|می توانم خرج/.test(c))return 'budget_remaining';if(/ریز|جزئیات|اقلام|اجاره/.test(c))return 'budget_items';return /هفته/.test(c)?'budget_week':'budget_month'}
    if(/زمان|چند ساعت|چند دقیقه/.test(c))return 'duration';
    if(/کار|تسک|برنامه/.test(c)){if(/انجام نشده|ناتمام|باقی|باز |ناقص/.test(c))return 'remaining_tasks';if(/انجام شده|تمام شده|تکمیل شده|انجام دادم/.test(c))return 'completed_tasks';if(/مهم|ستاره|اولویت/.test(c))return 'important_tasks';if(/چیست|چی|چه|فهرست|لیست|دارم|برنامه امروز/.test(c))return 'all_tasks'}
    if(/خرج|هزینه|مخارج|خرید/.test(c)&&/چقدر|چند|مجموع|جمع|گزارش|بیشترین|بیشتر|گران|بزرگ|تفکیک|دسته|بالاترین/.test(c)){if(/بیشتر.*کجا|بیشترین.*دسته|پرهزینه.*دسته|بیشترین.*چی|بیشترین.*برای/.test(c))return 'top_category';if(/گران|بزرگ ترین|بالاترین|تک هزینه/.test(c))return 'top_expense';if(/دسته|تفکیک|رستوران|قهوه|سوپر/.test(c))return 'categories';return /ماه/.test(c)?'expense_month':/هفته/.test(c)?'expense_week':'expense_day'}
    if(/^(?:سلام|درود|صبح بخیر|شب بخیر)/.test(c))return 'greeting';
    if(/\d/.test(text)&&!/[?؟]/.test(text)&&!/(?:چند|چقدر|حذف|بودجه|یادداشت|کار|تسک|اگر|مثال|مثلا|نکن|نمی|نشود|آیا)/.test(text)&&(/(?:ثبت|اضافه).*هزینه|(?:قهوه|اسنپ|تپسی|نان|میوه|خرید|دارو|پیتزا|رستوران|قبض)/.test(text)||/^\d[\d٬,،.]*\s+\S/.test(text)))return 'add_expense';
    return 'unknown';
  }
  const help='می‌توانم هزینه و کار ثبت کنم، کار را انجام‌شده یا مهم کنم، یادداشت اضافه کنم و از هزینه‌ها، زمان کارها و بودجه گزارش بدهم. نمونه: «۲۳۹ قهوه»، «کار: مطالعه ۳۰ دقیقه»، «انجام کن: مطالعه»، «این ماه بیشتر کجا خرج کردم؟». تغییرات فقط بعد از تأیید شما ذخیره می‌شوند.';
  function taskTarget(text){return text.replace(/^(?:برای\s+)?(?:امروز|فردا|دیروز)\s*/,'').replace(/^(?:انجام کن|تکمیل کن|تمام کن|ستاره دار کن|مهم کن|اولویت بده)\s*[:：]?\s*/,'').replace(/^(?:کار|تسک)\s+/,'').replace(/\s+(?:را\s+)?(?:انجام شده کن|تکمیل کن|ستاره دار کن|مهم کن)$/,'').trim()}
  function parse(message,selected=cursor){
    const text=normalize(message),intent=infer(text),date=dateFor(text,selected),dateKey=key(date),day=state[dateKey]||{tasks:[],expenses:[],note:''},stamp=fmtJ(date);
    const result=(reply,action=null)=>({intent,reply,action});
    if(text.length>1200)return result('پیام خیلی طولانی است؛ لطفاً درخواست را در کمتر از ۱۲۰۰ حرف بنویسید.');
    if(/حذف|پاک کن|پاکش کن/.test(text))return result('برای جلوگیری از حذف اشتباه، حذف را از دکمهٔ ضربدر کنار کار یا هزینه در صفحهٔ ویرایش روز انجام بده.');
    if(/نکن|نمی خواهم|ثبت نشود|اضافه نشود|نخر|نزن|ثبت نکن|نباید|اگر|مثلا|مثال|آیا|[؟?]/.test(text)&&/^(?:add_|complete_task|star_task)/.test(intent))return result('تغییری اعمال نکردم. اگر فقط سؤال داری، آن را بدون دستور ثبت بنویس.');
    if(/(?:\d{4}[/\-]\d|پس فردا|هفته (?:بعد|قبل|گذشته)|ماه (?:بعد|قبل|گذشته))/.test(text))return result('برای این بازه، ابتدا روز یا هفتهٔ موردنظر را در تقویم انتخاب کن و بعد بنویس «روز انتخاب‌شده»، «این هفته» یا «این ماه».');
    if(intent==='add_expense'){
      const matches=[...text.matchAll(/\d[\d,٬،]*(?:\.\d+)?/g)];if(matches.length!==1)return result('برای هر پیام فقط یک هزینه بنویس؛ مثلاً «۲۳۹ قهوه» یا «قهوه ۲۳۹ هزار تومان».');
      if(/-\s*\d|منفی/.test(text))return result('مبلغ منفی قابل ثبت نیست.');
      const token=matches[0][0],raw=Number(token.replace(/[,٬،]/g,'')),unit=/میلیون/.test(text)?1000000:/هزار/.test(text)?1000:/تومان|ریال/.test(text)?1:raw<10000?1000:1;
      const amount=raw*unit/(/ریال/.test(text)?10:1);if(!Number.isSafeInteger(amount)||amount<1||amount>1000000000)return result('مبلغ باید عدد صحیح بین ۱ تا ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان باشد.');
      const ignored=new Set(['امروز','دیروز','فردا','برای','ثبت','کن','اضافه','افزودن','هزینه','خرج','مبلغ','جدید','میلیون','هزار','تومان','ریال','پرداخت','کردم']);const desc=text.replace(token,' ').replace(/[:：]/g,' ').split(/\s+/).filter(word=>word&&!ignored.has(word)).join(' ');
      if(!/[a-zA-Zآ-ی]/.test(desc))return result('شرح هزینه را هم بنویس؛ مثلاً «۵۰ هزار تومان نان».');
      const category=classifyExpense(desc);return result('ثبت هزینهٔ «'+desc+'» — '+money(amount)+' — '+category+' — '+stamp+'؛ تأیید می‌کنی؟',{type:'expense',date:dateKey,desc,amount,category});
    }
    if(intent==='add_task'){
      let body=text.replace(/^(?:برای\s+)?(?:امروز|فردا|دیروز)\s*/,'').replace(/^(?:(?:ثبت|افزودن|اضافه کن)\s+)?(?:کار|تسک)(?: جدید)?\s*[:：]?\s*/,'');
      if(/-\s*\d|منفی/.test(body))return result('زمان منفی قابل ثبت نیست.');
      const times=[...body.matchAll(/\d+(?:\.\d+)?\s*(?:ساعت|دقیقه)/g)],duration=times.map(x=>x[0]).join(' و '),task=body.replace(/\d+(?:\.\d+)?\s*(?:ساعت|دقیقه)/g,'').replace(/\s+و\s*$/,'').trim();
      if(!task||task===text)return result('عنوان کار را بنویس؛ مثلاً «کار: مطالعه ۱ ساعت و ۲۰ دقیقه».');
      return result('افزودن کار «'+task+'»'+(duration?' با زمان '+duration:'')+' برای '+stamp+'؛ تأیید می‌کنی؟',{type:'task',date:dateKey,text:task,duration,done:false,starred:false});
    }
    if(intent==='complete_task'||intent==='star_task'){
      const query=taskTarget(text),tasks=(day.tasks||[]).filter(t=>t.text),exactTasks=tasks.filter(t=>canon(t.text)===canon(query)),found=exactTasks.length?exactTasks:tasks.filter(t=>canon(t.text).includes(canon(query)));
      if(!query||found.length!==1)return result(found.length>1?'چند کار مشابه پیدا شد؛ عنوان کامل کار را بنویس.':'کار مشخصی با این عنوان در '+stamp+' پیدا نکردم. عنوان کامل را وارد کن.');
      const task=found[0];if(intent==='complete_task'&&task.done)return result('این کار قبلاً انجام‌شده است.');if(intent==='star_task'&&task.starred)return result('این کار از قبل مهم است.');
      return result('کار «'+task.text+'» در '+stamp+(intent==='complete_task'?' انجام‌شده':' مهم')+' شود؟',{type:intent,date:dateKey,index:day.tasks.indexOf(task),expected:JSON.stringify(task)});
    }
    if(intent==='add_note'){const note=text.replace(/^(?:برای\s+)?(?:امروز|فردا|دیروز)\s*/,'').replace(/^(?:ثبت |افزودن )?یادداشت(?: جدید)?\s*[:：]\s*/,'').trim();if(!note)return result('متن یادداشت را بعد از «یادداشت:» بنویس.');return result('این متن به یادداشت '+stamp+' اضافه شود؟ «'+note+'»',{type:'note',date:dateKey,note,expected:day.note||''})}
    if(intent==='greeting')return result('سلام! من دستیار داخلی Daily هستم. '+help);
    if(intent==='help')return result(help);
    if(intent==='date')return result(new Intl.DateTimeFormat('fa-IR',{weekday:'long'}).format(date)+'، '+stamp+' برابر با '+fmtG(date));
    const scope=/هفته/.test(text)||intent==='expense_week'?'week':/ماه/.test(text)||intent==='expense_month'?'month':/امروز|دیروز|فردا|روز/.test(text)||intent==='expense_day'?'day':'month';
    const expenses=entriesFor(scope,date).flatMap(([k,d])=>(d.expenses||[]).map(e=>({...e,date:k}))),sum=expenses.reduce((n,e)=>n+(Number(e.amount)||0),0),scopeLabel=scope==='month'?'ماه شمسی انتخاب‌شده':scope==='week'?'هفتهٔ انتخاب‌شده (شنبه تا جمعه)':stamp;
    if(/^expense_/.test(intent))return result('جمع هزینهٔ '+scopeLabel+': '+money(sum));
    const groups={};expenses.forEach(e=>{const c=e.category||'سایر';groups[c]=(groups[c]||0)+(Number(e.amount)||0)});const ranked=Object.entries(groups).sort((a,b)=>b[1]-a[1]);
    if(intent==='top_category')return result(ranked.length?'بیشترین هزینهٔ '+scopeLabel+' در دستهٔ «'+ranked[0][0]+'» بوده: '+money(ranked[0][1]):'برای '+scopeLabel+' هزینه‌ای ثبت نشده است.');
    if(intent==='categories'){const category=classifyExpense(text),specific=category!=='سایر'&&!/دسته|تفکیک/.test(text);return result(specific?'هزینهٔ دستهٔ «'+category+'» در '+scopeLabel+': '+money(groups[category]||0):ranked.length?'تفکیک هزینهٔ '+scopeLabel+':\n'+ranked.map(([c,n])=>c+': '+money(n)).join('\n'):'هزینه‌ای ثبت نشده است.')}
    if(intent==='top_expense'){const e=expenses.slice().sort((a,b)=>Number(b.amount)-Number(a.amount))[0];return result(e?'بزرگ‌ترین هزینهٔ '+scopeLabel+': «'+e.desc+'» — '+money(e.amount)+' — '+fmtJ(new Date(e.date+'T12:00:00')):'هزینه‌ای ثبت نشده است.')}
    if(['all_tasks','remaining_tasks','completed_tasks','important_tasks'].includes(intent)){const ts=(day.tasks||[]).filter(t=>t.text).filter(t=>intent==='remaining_tasks'?!t.done:intent==='completed_tasks'?t.done:intent==='important_tasks'?t.starred:true);return result(ts.length?'کارهای '+stamp+' ('+ts.length+' مورد):\n'+ts.map(t=>(t.done?'✓ ':'○ ')+(t.starred?'★ ':'')+t.text+(t.duration?' — '+t.duration:'')).join('\n'):'کاری مطابق این درخواست در '+stamp+' ثبت نشده است.')}
    if(intent==='duration')return result('زمان کارهای انجام‌نشدهٔ '+stamp+': '+hoursLabel(dayTaskHours(day)));
    if(/^budget_/.test(intent)){
      const j=toJalali(date.getFullYear(),date.getMonth()+1,date.getDate()),mk=j[0]+'-'+pad(j[1]),has=typeof budgetData211!=='undefined',items=has?(budgetData211.months[mk]||[]):[],monthly=items.reduce((n,x)=>n+Number(x.amount||0),0),weekly=has?Number(budgetData211.weeks[key(startOfWeek(date))]||0):0;
      if(intent==='budget_items')return result(items.length?'ریز بودجهٔ '+mk+':\n'+items.map(x=>x.label+': '+money(x.amount)).join('\n')+'\nجمع: '+money(monthly):'ریز بودجهٔ این ماه ثبت نشده؛ از دکمهٔ «ریز بودجهٔ ماه» استفاده کن.');
      const isWeek=intent==='budget_week'||/هفته/.test(text),budget=isWeek?weekly:monthly,label=isWeek?'هفته':'ماه';
      if(intent==='budget_remaining'){const spent=entriesFor(isWeek?'week':'month',date).reduce((n,[,d])=>n+(d.expenses||[]).reduce((a,e)=>a+Number(e.amount||0),0),0);return result(budget?budget>=spent?'ماندهٔ بودجهٔ '+label+': '+money(budget-spent):'هزینه‌ها '+money(spent-budget)+' بیشتر از بودجهٔ '+label+' هستند.':'بودجهٔ '+label+' تعیین نشده است.')}
      return result(budget?'بودجهٔ '+label+': '+money(budget):'بودجهٔ '+label+' تعیین نشده است.');
    }
    if(intent==='profile_help')return result(/رمز/.test(text)?'رمز فعلی قابل نمایش نیست. از آیکون پروفایل بالای صفحه ← «تغییر رمز عبور» رمز جدید تعیین کن.':/مدیریت/.test(text)?'پنل مدیریت فقط برای حساب مدیر و پس از فعال‌شدن تنظیمات دسترسی دیتابیس دیده می‌شود.':'از آیکون پروفایل بالای صفحه، «اطلاعات کاربری» را برای ویرایش نام نمایشی و تلفن باز کن. خروج از حساب هم در همان منو است.');
    if(intent==='report_help')return result(/تقویم/.test(text)?'دکمهٔ تقویم بالای صفحه را بزن؛ تاریخ شمسی و میلادی در آن نمایش داده می‌شود.':/تم|تاریک|روشن/.test(text)?'کلید خورشید و ماه در بالای صفحه، حالت روشن و تاریک را تغییر می‌دهد.':/بودجه/.test(text)?'در بخش بودجه‌بندی، سقف هفتگی را وارد کن. برای ماه، «ریز بودجهٔ ماه» را باز کن؛ مجموع اقلام، بودجهٔ ماه می‌شود.':/جابه|جا به|اولویت/.test(text)?'صفحهٔ ویرایش روز را باز کن و از دستگیرهٔ کنار کار، آن را به جای دلخواه بکش.':'از دکمهٔ گزارش در بالای صفحه وارد گزارش‌ها شو، بازه را انتخاب کن و PDF، Word یا Excel را بزن. برای PDF از پنجرهٔ چاپ، ذخیره به صورت PDF را انتخاب کن.');
    return result('این درخواست را با اطمینان متوجه نشدم و هیچ داده‌ای تغییر نکرد. '+help+' من چت‌بات تخصصی برنامه هستم، نه مدل گفت‌وگوی عمومی.');
  }
  function apply(action){
    if(!action||!currentUser)return 'برای ثبت تغییرات باید وارد حساب خودت باشی.';
    const data=state[action.date]||{tasks:[],expenses:[],note:''};
    if(action.type==='expense')data.expenses.push({desc:action.desc,amount:action.amount,category:action.category});
    else if(action.type==='task')data.tasks.push({text:action.text,duration:action.duration,done:false,starred:false});
    else if(action.type==='note'){if((data.note||'')!==action.expected)return 'یادداشت تغییر کرده؛ دوباره درخواست بده تا چیزی از دست نرود.';data.note=(data.note?data.note+'\n':'')+action.note}
    else if(['complete_task','star_task'].includes(action.type)){const task=data.tasks[action.index];if(!task||JSON.stringify(task)!==action.expected)return 'این کار تغییر کرده؛ لطفاً دوباره درخواست بده.';if(action.type==='complete_task'){if(typeof DailyTasks!=='undefined')DailyTasks.setDone(task,true);else task.done=true}else task.starred=true}
    else return 'این عملیات پشتیبانی نمی‌شود.';
    state[action.date]=data;save();return 'با موفقیت در '+fmtJ(new Date(action.date+'T12:00:00'))+' ثبت شد. همگام‌سازی با حساب، به اتصال دیتابیس نیاز دارد.';
  }
  return {normalize,examples,parse,apply};
})();

// Replace the old online handler entirely; Supabase remains only for account/data sync.
assistantReply=message=>DailyChatbot.parse(message).reply;
bindAssistant=function(){
  const modal=$('#assistantModal'),input=$('#assistantInput'),messages=$('#assistantMessages');let changed=false;
  const subtitle=modal.querySelector('.modal-head .muted');if(subtitle)subtitle.textContent='دستیار داخلی؛ بدون Gemini · ثبت تغییرات با تأیید شما';
  const welcome=messages.querySelector('.bot');if(welcome)welcome.textContent='سلام! دربارهٔ کارها، هزینه‌ها و بودجه بپرس یا بنویس «۲۳۹ قهوه». برای هر تغییر اول تأیید می‌گیرم.';
  function close(){modal.classList.add('hidden');if(changed)renderHome()}
  $('#assistantOpen').onclick=()=>{modal.classList.remove('hidden');input.focus()};modal.querySelector('[data-close]').onclick=close;
  const initialUser=currentUser?.id;
  $('#assistantForm').onsubmit=event=>{event.preventDefault();const text=input.value.trim();if(!text)return;input.value='';
    const user=document.createElement('div');user.className='assistant-bubble user';user.textContent=text;messages.appendChild(user);
    const bot=document.createElement('div');bot.className='assistant-bubble bot';bot.style.whiteSpace='pre-wrap';messages.appendChild(bot);
    try{const answer=DailyChatbot.parse(text);bot.textContent=answer.reply;
      if(answer.action){const controls=document.createElement('div');controls.className='chat-confirm-controls';const yes=document.createElement('button'),no=document.createElement('button');yes.type=no.type='button';yes.textContent='تأیید و ثبت';no.textContent='لغو';controls.append(yes,no);bot.appendChild(controls);
        yes.onclick=()=>{yes.disabled=no.disabled=true;if(currentUser?.id!==initialUser){bot.textContent='حساب کاربری تغییر کرده؛ درخواست را دوباره وارد کن.';return}const reply=DailyChatbot.apply(answer.action);bot.textContent=reply;changed=true};no.onclick=()=>{bot.textContent='لغو شد؛ هیچ تغییری انجام نشد.'};
      }
    }catch{bot.textContent='در پردازش این پیام مشکلی پیش آمد؛ لطفاً آن را ساده‌تر بنویس.'}
    messages.scrollTop=messages.scrollHeight;input.focus();
  };
};
// A very fast restored session may have painted before this script finished loading.
if(document.querySelector('#assistantModal'))bindAssistant();
