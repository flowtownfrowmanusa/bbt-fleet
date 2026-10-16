/* BBT Fleet - starter prototype. Requires Supabase setup; see README.md. */
let sb=null, user=null, assets=[], schedules=[], services=[], readings=[];
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
function show(id,on=true){$(id).classList.toggle('hidden',!on)}
function message(text,error=false){$('msg').textContent=text;$('msg').classList.remove('hidden');$('msg').classList.toggle('error',error);setTimeout(()=>$('msg').classList.add('hidden'),5000)}
function num(v){return v===''||v==null?null:Number(v)}
function val(id){return $(id).value}
function setVal(id,v){$(id).value=v??''}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v){return v==null||v===''?'—':Number(v).toLocaleString()}
function assetName(id){return assets.find(a=>a.id===id)?.name||'Unknown asset'}
function dueInfo(s){
 const a=assets.find(x=>x.id===s.asset_id); if(!a)return {state:'unknown',text:'Asset missing'};
 if(s.interval_type==='mileage'){if(s.interval_value==null)return {state:'unknown',text:'No interval set'};let due=Number(s.last_mileage||0)+Number(s.interval_value),remain=due-Number(a.current_mileage||0);return {state:remain<0?'overdue':remain<=Number(s.alert_lead||0)?'soon':'ok',text:remain<0?`${fmt(-remain)} miles overdue`:remain===0?'Due now':`${fmt(remain)} miles remaining`}}
 if(s.interval_type==='hours'){if(s.interval_value==null)return {state:'unknown',text:'No interval set'};let due=Number(s.last_hours||0)+Number(s.interval_value),remain=due-Number(a.current_hours||0);return {state:remain<0?'overdue':remain<=Number(s.alert_lead||0)?'soon':'ok',text:remain<0?`${fmt(-remain)} hours overdue`:remain===0?'Due now':`${fmt(remain)} hours remaining`}}
 if(s.interval_type==='days'){if(!s.last_date||!s.interval_value)return {state:'unknown',text:'Set last service date and interval'};let due=new Date(s.last_date+'T00:00:00');due.setDate(due.getDate()+Number(s.interval_value));let remain=Math.ceil((due-new Date(today()+'T00:00:00'))/86400000);return {state:remain<0?'overdue':remain<=Number(s.alert_lead||7)?'soon':'ok',text:remain<0?`${-remain} days overdue`:remain===0?'Due today':`${remain} days remaining`,due:due.toISOString().slice(0,10)}}
 return {state:'soon',text:'One-time / inspection'}
}
async function load(){
 const [ar,sr,hr,rr]=await Promise.all([
 sb.from('assets').select('*').order('name'),
 sb.from('service_schedules').select('*').order('service_name'),
 sb.from('service_records').select('*').order('service_date',{ascending:false}),
 sb.from('meter_readings').select('*').order('recorded_at',{ascending:false})
 ]);
 for(const r of [ar,sr,hr,rr])if(r.error)throw r.error;
 assets=ar.data||[];schedules=sr.data||[];services=hr.data||[];readings=rr.data||[];
 render(); 
}
function render(){
 $('assetCount').textContent=assets.length;
 let due=schedules.map(s=>({...s,info:dueInfo(s)})).filter(s=>['overdue','soon'].includes(s.info.state));
 $('overdueCount').textContent=due.filter(s=>s.info.state==='overdue').length;
 $('soonCount').textContent=due.filter(s=>s.info.state==='soon').length;
 const month=today().slice(0,7);$('monthCount').textContent=services.filter(s=>(s.service_date||'').startsWith(month)).length;
 $('dueList').innerHTML=due.length?due.map(s=>`<div class="item"><div><h3>${escapeHtml(s.service_name)}</h3><p class="muted">${escapeHtml(assetName(s.asset_id))}</p><p>${escapeHtml(s.info.text)}</p></div><span class="pill ${s.info.state}">${s.info.state==='overdue'?'OVERDUE':'DUE SOON'}</span></div>`).join(''):'<div class="empty">No services currently due based on entered readings.</div>';
 $('assetList').innerHTML=assets.length?assets.map(a=>`<div class="item"><div><h3>${escapeHtml(a.name)} <span class="pill">${escapeHtml(a.asset_type||'Equipment')}</span></h3><p class="muted">${escapeHtml([a.year,a.make,a.model,a.unit_tag].filter(Boolean).join(' · '))}</p><p>${a.current_mileage!=null?`Mileage: ${fmt(a.current_mileage)} mi`:'Mileage: —'} &nbsp; ${a.current_hours!=null?`Hours: ${fmt(a.current_hours)}`:'Hours: —'}</p>${a.notes?`<p class="muted">${escapeHtml(a.notes)}</p>`:''}</div><button class="secondary" onclick="deleteAsset('${a.id}')">Delete</button></div>`).join(''):'<div class="empty">Add your first vehicle or machine.</div>';
 for(const id of ['readingAsset','sAsset','hAsset'])$(id).innerHTML='<option value="">Choose asset…</option>'+assets.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
 $('scheduleList').innerHTML=schedules.length?schedules.map(s=>{let d=dueInfo(s);return `<div class="item"><div><h3>${escapeHtml(s.service_name)} <span class="pill ${d.state}">${escapeHtml(s.interval_type)}</span></h3><p class="muted">${escapeHtml(assetName(s.asset_id))}</p><p>${escapeHtml(d.text)}${s.interval_value?` · Every ${fmt(s.interval_value)} ${s.interval_type}`:''}</p>${s.notes?`<p class="muted">${escapeHtml(s.notes)}</p>`:''}</div><button class="secondary" onclick="deleteSchedule('${s.id}')">Delete</button></div>`}).join(''):'<div class="empty">No service schedules yet.</div>';
 $('historyList').innerHTML=services.length?services.map(s=>`<div class="item"><div><h3>${escapeHtml(s.service_name)} <span class="pill">${escapeHtml(s.service_date||'')}</span></h3><p class="muted">${escapeHtml(assetName(s.asset_id))} · ${s.mileage!=null?fmt(s.mileage)+' mi':'—'} · ${s.engine_hours!=null?fmt(s.engine_hours)+' hrs':'—'}</p><p>${escapeHtml(s.notes||'')}</p><p class="muted">Parts $${fmt(s.parts_cost||0)} · Labor $${fmt(s.labor_cost||0)} · By ${escapeHtml(s.performed_by||'—')}</p></div></div>`).join(''):'<div class="empty">No completed services logged yet.</div>';
}
async function deleteAsset(id){if(!confirm('Delete this asset? Related records may be restricted by database rules.'))return;const r=await sb.from('assets').delete().eq('id',id);if(r.error)message(r.error.message,true);else{message('Asset deleted.');await load()}}
async function deleteSchedule(id){if(!confirm('Delete this service schedule?'))return;const r=await sb.from('service_schedules').delete().eq('id',id);if(r.error)message(r.error.message,true);else{message('Schedule deleted.');await load()}}
function initConfig(){
 let url=localStorage.getItem('bbfc_url'),key=localStorage.getItem('bbfc_key');
 if(!url||!key){show('setup');return}
 try{sb=window.supabase.createClient(url,key);startAuth()}catch(e){show('setup');message('Could not initialize database settings.',true)}
}
async function startAuth(){
 show('setup',false);show('login');const {data}=await sb.auth.getSession();
 if(data.session){user=data.session.user;await enterApp()}else{show('app',false);show('logout',false)}
 sb.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;if(user)enterApp().catch(e=>message(e.message,true));else{show('app',false);show('login');show('logout',false)}})
}
async function enterApp(){show('login',false);show('app');show('logout');try{await load();checkNotifications()}catch(e){message(e.message||String(e),true)}}
$('configForm').addEventListener('submit',e=>{e.preventDefault();localStorage.setItem('bbfc_url',val('sbUrl').trim());localStorage.setItem('bbfc_key',val('sbKey').trim());location.reload()});
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:val('email'),password:val('password')});$('loginMsg').textContent=error?.message||'Signed in.';show('loginMsg');if(error)$('loginMsg').classList.add('error')});
$('signup').addEventListener('click',async()=>{const {data,error}=await sb.auth.signUp({email:val('email'),password:val('password')});$('loginMsg').textContent=error?.message||(data.user?'Account created. Check email if confirmation is enabled, then sign in.':'Account request sent.');show('loginMsg');});
$('logout').addEventListener('click',()=>sb.auth.signOut());
$('refresh').addEventListener('click',()=>load().then(()=>message('Data refreshed.')).catch(e=>message(e.message,true)));
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));['dashboard','assets','schedules','history'].forEach(id=>show(id,id===b.dataset.tab))}));
$('newAsset').onclick=()=>show('assetFormWrap');$('cancelAsset').onclick=()=>show('assetFormWrap',false);
$('newSchedule').onclick=()=>show('scheduleFormWrap');$('cancelSchedule').onclick=()=>show('scheduleFormWrap',false);
$('newService').onclick=()=>{setVal('hDate',today());show('serviceFormWrap')};$('cancelService').onclick=()=>show('serviceFormWrap',false);
$('assetForm').addEventListener('submit',async e=>{e.preventDefault();let obj={name:val('aName'),asset_type:val('aType'),year:num(val('aYear')),make:val('aMake'),model:val('aModel'),unit_tag:val('aTag'),tracking_method:val('aTracking'),current_mileage:num(val('aMileage')),current_hours:num(val('aHours')),notes:val('aNotes')};let r=await sb.from('assets').insert(obj);if(r.error)message(r.error.message,true);else{e.target.reset();show('assetFormWrap',false);message('Asset saved.');await load()}});
$('readingForm').addEventListener('submit',async e=>{e.preventDefault();let id=val('readingAsset'),a=assets.find(x=>x.id===id);if(!a)return;let mileage=num(val('readingMileage')),hours=num(val('readingHours'));if(mileage!=null&&a.current_mileage!=null&&mileage<a.current_mileage)return message('Mileage cannot be lower than the current reading.',true);if(hours!=null&&a.current_hours!=null&&hours<a.current_hours)return message('Engine hours cannot be lower than the current reading.',true);let r=await sb.from('meter_readings').insert({asset_id:id,mileage,engine_hours:hours,notes:val('readingNotes')});if(r.error)return message(r.error.message,true);let patch={};if(mileage!=null)patch.current_mileage=mileage;if(hours!=null)patch.current_hours=hours;let u=await sb.from('assets').update(patch).eq('id',id);if(u.error)return message(u.error.message,true);e.target.reset();message('Reading saved.');await load()});
$('scheduleForm').addEventListener('submit',async e=>{e.preventDefault();let r=await sb.from('service_schedules').insert({asset_id:val('sAsset'),service_name:val('sName'),interval_type:val('sType'),interval_value:num(val('sInterval')),last_mileage:num(val('sLastMileage')),last_hours:num(val('sLastHours')),last_date:val('sLastDate')||null,alert_lead:num(val('sLead'))??0,notes:val('sNotes')});if(r.error)message(r.error.message,true);else{e.target.reset();show('scheduleFormWrap',false);message('Schedule saved.');await load()}});
$('serviceForm').addEventListener('submit',async e=>{e.preventDefault();let id=val('hAsset'),mileage=num(val('hMileage')),hours=num(val('hHours'));let r=await sb.from('service_records').insert({asset_id:id,service_name:val('hName'),service_date:val('hDate'),mileage,engine_hours:hours,parts_cost:num(val('hParts'))||0,labor_cost:num(val('hLabor'))||0,performed_by:val('hBy'),notes:val('hNotes')});if(r.error)return message(r.error.message,true);
 // Update matching schedule baselines so the next interval starts at the completed reading/date.
 let matches=schedules.filter(s=>s.asset_id===id&&s.service_name.toLowerCase()===val('hName').toLowerCase());
 for(const s of matches){let patch={last_date:val('hDate')};if(mileage!=null)patch.last_mileage=mileage;if(hours!=null)patch.last_hours=hours;await sb.from('service_schedules').update(patch).eq('id',s.id)}
 e.target.reset();show('serviceFormWrap',false);message('Service record saved.');await load()});
function checkNotifications(){
 // Browser notifications work only while the app is open/installed and permission is granted.
 if(!('Notification'in window)||Notification.permission!=='granted')return;
 const due=schedules.map(s=>({...s,info:dueInfo(s)})).filter(s=>['overdue','soon'].includes(s.info.state));
 if(due.length){new Notification('BBT Fleet',{body:`${due.length} service item(s) due or overdue. Open the dashboard for details.`})}
}
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
initConfig();
