
// PWA SETUP
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const DEFAULT_PLAN={
  1:{label:'Chest & Triceps',muscles:[
    {name:'Chest',exercises:['Barbell Bench Press','Incline Dumbbell Press','Cable Chest Fly','Decline Bench Press','Dumbbell Pullover']},
    {name:'Triceps',exercises:['Tricep Pushdown','Skull Crushers','Overhead Tricep Extension','Close Grip Bench Press','Diamond Push-ups']}
  ]},
  2:{label:'Back & Biceps',muscles:[
    {name:'Back',exercises:['Deadlift','Lat Pulldown','Bent Over Barbell Row','Seated Cable Row','Single Arm Dumbbell Row']},
    {name:'Biceps',exercises:['Barbell Curl','Incline Dumbbell Curl','Hammer Curl','Concentration Curl','Cable Curl']}
  ]},
  3:{label:'Legs & Shoulders',muscles:[
    {name:'Legs',exercises:['Barbell Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raises']},
    {name:'Shoulders',exercises:['Overhead Press','Dumbbell Lateral Raise','Front Raise','Face Pulls','Arnold Press']}
  ]},
  4:{label:'Chest & Triceps',muscles:[
    {name:'Chest',exercises:['Barbell Bench Press','Incline Dumbbell Press','Cable Chest Fly','Decline Bench Press','Dumbbell Pullover']},
    {name:'Triceps',exercises:['Tricep Pushdown','Skull Crushers','Overhead Tricep Extension','Close Grip Bench Press','Diamond Push-ups']}
  ]},
  5:{label:'Back & Biceps',muscles:[
    {name:'Back',exercises:['Deadlift','Lat Pulldown','Bent Over Barbell Row','Seated Cable Row','Single Arm Dumbbell Row']},
    {name:'Biceps',exercises:['Barbell Curl','Incline Dumbbell Curl','Hammer Curl','Concentration Curl','Cable Curl']}
  ]},
  6:{label:'Progressive Overload',muscles:[
    {name:'Progressive',exercises:['Back Squat (Heavy)','Deadlift (Heavy)','Overhead Press (Heavy)','Weighted Pull-ups','Barbell Row (Heavy)']}
  ]},
  0:{label:'Rest Day',muscles:[]}
};

let DB = {}, NAMES = {}, META = {}, FOOD = {};
let isLoginMode = true;
const today = new Date();

// DATA SYNC
async function syncFromCloud() {
  try {
    const docSnap = await window.fbGetDoc(window.fbDoc(window.fbDB, "users", window.currentUser.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      DB = data.workouts || {};
      NAMES = data.names || {};
      META = data.meta || {};
      FOOD = data.food || {};
    }
  } catch(e) {
    console.error("Cloud fetch failed, using local", e);
    DB = JSON.parse(localStorage.getItem('gdb')||'{}');
    NAMES = JSON.parse(localStorage.getItem('gnames')||'{}');
    META = JSON.parse(localStorage.getItem('gmeta')||'{}');
    FOOD = JSON.parse(localStorage.getItem('gfood')||'{}');
  }
}

async function syncToCloud() {
  localStorage.setItem('gdb', JSON.stringify(DB));
  localStorage.setItem('gnames', JSON.stringify(NAMES));
  localStorage.setItem('gmeta', JSON.stringify(META));
  localStorage.setItem('gfood', JSON.stringify(FOOD));
  
  if(window.currentUser) {
    try {
      await window.fbSetDoc(window.fbDoc(window.fbDB, "users", window.currentUser.uid), {
        workouts: DB,
        names: NAMES,
        meta: META,
        food: FOOD
      });
    } catch(e) { console.error("Save to cloud failed", e); }
  }
}

// AUTH
function showAuth() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-auth').classList.add('active');
  document.getElementById('bottom-nav').style.display = 'none';
}

function showApp() {
  document.getElementById('screen-auth').classList.remove('active');
  document.getElementById('bottom-nav').style.display = 'flex';
  goTo('today', document.querySelector('.nav-btn'));
}

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById('auth-submit-btn').textContent = isLoginMode ? 'Login' : 'Sign Up';
  document.getElementById('auth-toggle-txt').textContent = isLoginMode ? 'Need an account? Sign up' : 'Have an account? Login';
  document.getElementById('auth-error').textContent = '';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value;
  const pass = document.getElementById('auth-pass').value;
  const err = document.getElementById('auth-error');
  err.textContent = '';
  
  if(!email || !pass) { err.textContent = 'Enter email and password'; return; }
  
  try {
    if(isLoginMode) {
      await window.fbSignIn(window.fbAuth, email, pass);
    } else {
      await window.fbSignUp(window.fbAuth, email, pass);
    }
  } catch(error) {
    err.textContent = error.message.replace('Firebase: ', '');
  }
}

function logout() {
  if(window.fbAuth) window.fbSignOut(window.fbAuth);
}

// HELPERS
function dateKey(d){return d.toISOString().slice(0,10)}
function formatFull(d){return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`}
function getDayVol(key){
  const e=DB[key];if(!e)return 0;
  return Math.round(Object.keys(e).filter(k=>!['meta'].includes(k)).reduce((s,k)=>{
    const v=e[k]; return s+(v.s||0)*(v.r||0)*(v.w||0);
  },0));
}

function getPlan(dow, dKey){
  const p=JSON.parse(JSON.stringify(DEFAULT_PLAN[dow]||DEFAULT_PLAN[0]));
  const saved = DB[dKey] || {};
  p.muscles.forEach(m=>m.exercises=m.exercises.map((ex,i)=>{
    const k=`${dow}_${m.name}_${i}`;
    const ek=`${m.name}_${i}`;
    // Use today's override name, or settings name, or default
    return (saved[ek] && saved[ek].customName) ? saved[ek].customName : (NAMES[k]||ex);
  }));
  return p;
}

// TODAY SCREEN
function buildToday(){
  const dow=today.getDay();
  const key=dateKey(today);
  const plan=getPlan(dow, key);
  const saved=DB[key]||{};
  const meta=META[key]||{ mood: '', energy: 0 };
  
  document.getElementById('hdr-date').textContent=`${DAYS_SHORT[dow]}, ${today.getDate()} ${MONTHS[today.getMonth()].slice(0,3)}`;

  if(!plan.muscles.length){
    document.getElementById('today-content').innerHTML=`
      <div class="rest-card">
        <div class="rest-icon">🛌</div>
        <div class="rest-title">Rest day</div>
        <div class="rest-sub">Recovery is part of the process. Come back tomorrow.</div>
      </div>`;
    return;
  }

  let html=`<div class="workout-hero">
    <div class="workout-type">${DAYS_FULL[dow]}</div>
    <div class="workout-name">${plan.label}</div>
    <div class="workout-meta">
      <span><strong>${plan.muscles.reduce((s,m)=>s+m.exercises.length,0)}</strong> exercises</span>
      <span><strong>${plan.muscles.length}</strong> muscle groups</span>
    </div>
  </div>`;

  // Meta Section
  html+=`<div class="session-meta">
    <div class="meta-grid">
      <div class="meta-group"><div class="meta-label">Status</div>
        <select class="meta-input" id="meta-status">
          <option value="Completed" ${meta.status==='Completed'?'selected':''}>Completed</option>
          <option value="Partial" ${meta.status==='Partial'?'selected':''}>Partial</option>
          <option value="Skipped" ${meta.status==='Skipped'?'selected':''}>Skipped</option>
        </select>
      </div>
      <div class="meta-group"><div class="meta-label">Body Weight (kg)</div>
        <input type="number" step="0.1" class="meta-input" id="meta-bw" value="${meta.bw||''}" placeholder="e.g. 75.5">
      </div>
      <div class="meta-group"><div class="meta-label">Start Time</div>
        <input type="time" class="meta-input" id="meta-start" value="${meta.start||''}">
      </div>
      <div class="meta-group"><div class="meta-label">End Time</div>
        <input type="time" class="meta-input" id="meta-end" value="${meta.end||''}">
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-group"><div class="meta-label">Mood</div>
        <div class="mood-group">
          ${['😴','😐','🙂','🔥','💪'].map(m=>`<button class="mood-btn ${meta.mood===m?'active':''}" onclick="setMood(this, '${m}')">${m}</button>`).join('')}
        </div>
      </div>
      <div class="meta-group"><div class="meta-label">Energy</div>
        <div class="energy-group">
          ${[1,2,3,4,5].map(e=>`<span class="energy-star ${meta.energy>=e?'active':''}" onclick="setEnergy(${e})">★</span>`).join('')}
        </div>
      </div>
    </div>
    
    <div class="meta-group" style="margin-top:12px;"><div class="meta-label">Notes</div>
      <textarea class="notes-input" id="meta-notes" placeholder="How did it feel?">${meta.notes||''}</textarea>
    </div>
  </div>`;

  plan.muscles.forEach(m=>{
    html+=`<div class="muscle-block"><div class="muscle-header"><div class="muscle-dot"></div><div class="muscle-name">${m.name}</div></div>`;
    m.exercises.forEach((ex,i)=>{
      const ek=`${m.name}_${i}`;
      const sv=saved[ek]||{};
      const vol=(sv.s&&sv.r&&sv.w)?Math.round(sv.s*sv.r*sv.w):'';
      
      html+=`<div class="exercise-card">
        <div class="exercise-name-row">
          <div class="exercise-name-wrap">
            <div class="exercise-name" id="exname_${ek}">${ex}</div>
            <button class="rename-today-btn" onclick="toggleRename('${ek}')">✏️</button>
          </div>
        </div>
        <div class="rename-input-box" id="renamebox_${ek}">
          <input type="text" class="rename-input" id="renameinp_${ek}" value="${ex}" placeholder="Rename for today only">
          <button class="rename-save" onclick="saveRenameToday('${ek}')">Apply</button>
        </div>
        <div class="exercise-inputs">
          <div class="input-group"><div class="input-label">SETS</div><input type="number" min="0" placeholder="0" value="${sv.s||''}" data-ek="${ek}" data-f="s" onchange="calcVol('${ek}')" /></div>
          <div class="input-group"><div class="input-label">REPS</div><input type="number" min="0" placeholder="0" value="${sv.r||''}" data-ek="${ek}" data-f="r" onchange="calcVol('${ek}')" /></div>
          <div class="input-group"><div class="input-label">KG</div><input type="number" min="0" step="0.5" placeholder="0" value="${sv.w||''}" data-ek="${ek}" data-f="w" onchange="calcVol('${ek}')" /></div>
        </div>
        <div class="vol-row"><span class="vol-label">Volume</span><span class="vol-val" id="vol_${ek}">${vol?vol+' kg':'—'}</span></div>
      </div>`;
    });
    html+='</div>';
  });

  html+=`<div class="save-area"><button class="save-btn" onclick="saveToday()">Save workout</button><span class="save-ok" id="save-ok">Saved ✓</span></div>`;
  document.getElementById('today-content').innerHTML=html;
}

let tempMood = '';
let tempEnergy = 0;

function setMood(btn, m) {
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  tempMood = m;
}

function setEnergy(val) {
  tempEnergy = val;
  document.querySelectorAll('.energy-star').forEach((el, idx) => {
    el.classList.toggle('active', idx < val);
  });
}

function toggleRename(ek) {
  const box = document.getElementById('renamebox_'+ek);
  box.classList.toggle('open');
}

function saveRenameToday(ek) {
  const inp = document.getElementById('renameinp_'+ek).value.trim();
  if(!inp) return;
  document.getElementById('exname_'+ek).textContent = inp;
  document.getElementById('renamebox_'+ek).classList.remove('open');
  
  const key=dateKey(today);
  if(!DB[key]) DB[key] = {};
  if(!DB[key][ek]) DB[key][ek] = {};
  DB[key][ek].customName = inp;
  syncToCloud();
}

function calcVol(ek){
  const inputs=document.querySelectorAll(`[data-ek="${ek}"]`);
  let s=0,r=0,w=0;
  inputs.forEach(inp=>{if(inp.dataset.f==='s')s=+inp.value;if(inp.dataset.f==='r')r=+inp.value;if(inp.dataset.f==='w')w=+inp.value;});
  const el=document.getElementById('vol_'+ek);
  if(el)el.textContent=(s&&r&&w)?Math.round(s*r*w)+' kg':'—';
}

function saveToday(){
  const key=dateKey(today);
  const entry=DB[key]||{};
  document.querySelectorAll('#today-content input[data-ek]').forEach(inp=>{
    const ek=inp.dataset.ek,f=inp.dataset.f;
    if(!ek)return;
    if(!entry[ek])entry[ek]={};
    entry[ek][f]=parseFloat(inp.value)||0;
  });
  DB[key]=entry;
  
  // Save Meta
  META[key] = {
    status: document.getElementById('meta-status').value,
    bw: document.getElementById('meta-bw').value,
    start: document.getElementById('meta-start').value,
    end: document.getElementById('meta-end').value,
    notes: document.getElementById('meta-notes').value,
    mood: tempMood || (META[key]?META[key].mood:''),
    energy: tempEnergy || (META[key]?META[key].energy:0)
  };
  
  syncToCloud();
  const ok=document.getElementById('save-ok');
  if(ok){ok.style.opacity='1';setTimeout(()=>ok.style.opacity='0',2000);}
}

const DEFAULT_DIET = [
  { meal: 'Morning', items: [
    { id: 'm1', name: '3 Eggs (Boiled/Omelette)', p: 18 },
    { id: 'm2', name: '2 Bananas', p: 2 },
    { id: 'm3', name: 'Tea/Coffee (Less sugar)', p: 0 }
  ]},
  { meal: 'Mid-Morning', items: [
    { id: 'mm1', name: 'Peanuts or Boiled Green Gram', p: 12 }
  ]},
  { meal: 'Lunch', items: [
    { id: 'l1', name: '300g Cooked Rice', p: 8 },
    { id: 'l2', name: '100g Chicken OR 2 Eggs', p: 25 },
    { id: 'l3', name: 'Dal / Sambar', p: 6 },
    { id: 'l4', name: 'Veg Poriyal (Bottle gourd/Peerkangai)', p: 2 },
    { id: 'l5', name: '1 Cup Curd', p: 5 }
  ]},
  { meal: 'Pre-Workout', items: [
    { id: 'pw1', name: '1 Banana', p: 1 },
    { id: 'pw2', name: 'Black Coffee', p: 0 }
  ]},
  { meal: 'Post-Workout (Recovery)', items: [
    { id: 'po1', name: '100g Chicken OR 4 Eggs OR 50g Soya Chunks', p: 25 }
  ]},
  { meal: 'Dinner', items: [
    { id: 'd1', name: 'Rice or Chapati', p: 6 },
    { id: 'd2', name: 'Dal/Sambar + Veg', p: 4 },
    { id: 'd3', name: '2 Eggs', p: 12 }
  ]}
];

function buildFood() {
  const key = dateKey(today);
  const saved = FOOD[key] || { items: {}, water: false, sleep: false, junk: false, custom: {} };
  
  let totalP = 0;
  let html = '';
  
  DEFAULT_DIET.forEach(meal => {
    html += `<div class="meal-block"><div class="meal-header">${meal.meal}</div>`;
    meal.items.forEach(item => {
      const isChecked = saved.items && saved.items[item.id];
      if (isChecked) totalP += item.p;
      
      const customName = (saved.custom && saved.custom[item.id]) ? saved.custom[item.id] : item.name;
      
      html += `
      <div class="food-item">
        <input type="checkbox" class="food-check" data-id="${item.id}" ${isChecked ? 'checked' : ''} onchange="saveFood()">
        <div class="food-name-wrap">
          <div class="food-name" id="fname_${item.id}">${customName}</div>
          <button class="rename-today-btn" onclick="toggleFoodRename('${item.id}')">✏️</button>
        </div>
        <div class="food-macros">${item.p > 0 ? item.p+'g P' : ''}</div>
      </div>
      <div class="rename-input-box" id="f_renamebox_${item.id}">
        <input type="text" class="rename-input" id="f_renameinp_${item.id}" value="${customName}" placeholder="Rename for today">
        <button class="rename-save" onclick="saveFoodRenameToday('${item.id}')">Apply</button>
      </div>`;
    });
    html += `</div>`;
  });
  
  const pct = Math.min(100, Math.round((totalP / 100) * 100));
  
  let topHtml = `
    <div class="food-ring-container">
      <div class="food-ring" style="background: conic-gradient(var(--accent) ${pct}%, var(--bg3) 0%);">
        <div class="food-ring-inner">
          <div class="food-ring-val">${totalP}g</div>
          <div class="food-ring-label">of 100g Protein</div>
        </div>
      </div>
    </div>
    
    <div class="habit-grid">
      <div class="habit-card">
        <div class="habit-icon">💧</div>
        <div class="habit-label">3-4L Water</div>
        <input type="checkbox" class="food-check" id="habit-water" ${saved.water ? 'checked' : ''} onchange="saveFood()">
      </div>
      <div class="habit-card">
        <div class="habit-icon">😴</div>
        <div class="habit-label">7-8h Sleep</div>
        <input type="checkbox" class="food-check" id="habit-sleep" ${saved.sleep ? 'checked' : ''} onchange="saveFood()">
      </div>
      <div class="habit-card" style="grid-column: 1 / -1; flex-direction:row; justify-content:space-between; padding:16px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="habit-icon">🚫</div>
          <div style="text-align:left;">
            <div class="habit-label" style="margin:0">No Junk & Reels</div>
            <div style="font-size:10px; color:var(--text3); margin-top:2px;">Stay focused today</div>
          </div>
        </div>
        <input type="checkbox" class="food-check" id="habit-junk" ${saved.junk ? 'checked' : ''} onchange="saveFood()">
      </div>
    </div>
  `;
  
  let bottomHtml = `
    <div class="budget-guide">
      <div class="bg-title">Budget Protein Cheat Sheet</div>
      <div class="bg-list">
        • <strong>Soya Chunks:</strong> 52g P per 100g (Very cheap!)<br>
        • <strong>Eggs:</strong> 6g P per egg<br>
        • <strong>Green Gram (Moong):</strong> 24g P per 100g<br>
        • <strong>Roasted Channa:</strong> 18g P per 100g<br>
        • <strong>Peanuts:</strong> 25g P per 100g
      </div>
    </div>
    <div style="height:20px"></div>
  `;
  
  document.getElementById('food-content').innerHTML = topHtml + html + bottomHtml;
}

function toggleFoodRename(id) {
  document.getElementById('f_renamebox_'+id).classList.toggle('open');
}

function saveFoodRenameToday(id) {
  const inp = document.getElementById('f_renameinp_'+id).value.trim();
  if(!inp) return;
  const key = dateKey(today);
  if(!FOOD[key]) FOOD[key] = { items: {}, water: false, sleep: false, junk: false, custom: {} };
  if(!FOOD[key].custom) FOOD[key].custom = {};
  FOOD[key].custom[id] = inp;
  syncToCloud();
  buildFood();
}

function saveFood() {
  const key = dateKey(today);
  if(!FOOD[key]) FOOD[key] = { items: {}, water: false, sleep: false, junk: false, custom: {} };
  
  document.querySelectorAll('#food-content .food-item .food-check').forEach(cb => {
    FOOD[key].items[cb.dataset.id] = cb.checked;
  });
  
  FOOD[key].water = document.getElementById('habit-water').checked;
  FOOD[key].sleep = document.getElementById('habit-sleep').checked;
  FOOD[key].junk = document.getElementById('habit-junk').checked;
  
  syncToCloud();
  buildFood();
}

// HISTORY
function buildHistory(){
  const now=new Date();
  let html='';
  for(let m=0;m<2;m++){
    const ref=new Date(now.getFullYear(),now.getMonth()-m,1);
    const yr=ref.getFullYear(),mo=ref.getMonth();
    const daysInMonth=new Date(yr,mo+1,0).getDate();
    html+=`<div class="month-label">${MONTHS[mo]} ${yr}</div>`;
    for(let d=daysInMonth;d>=1;d--){
      const dd=new Date(yr,mo,d);
      if(dd>now)continue;
      const dk=dateKey(dd);
      const dow=dd.getDay();
      const plan=DEFAULT_PLAN[dow];
      const vol=getDayVol(dk);
      const isToday=dk===dateKey(now);
      const meta = META[dk] || {};
      const statusBadge = meta.status && meta.status!=='Skipped' ? `<span class="hday-status">${meta.status} ${meta.mood||''}</span>` : '';
      
      const savedF = FOOD[dk] || { items: {} };
      let dayP = 0;
      DEFAULT_DIET.forEach(meal => meal.items.forEach(i => {
        if(savedF.items && savedF.items[i.id]) dayP += i.p;
      }));
      const hasFood = dayP > 0 || savedF.water || savedF.sleep || savedF.junk;
      const hasData = vol > 0 || hasFood || (meta.status && meta.status !== 'Skipped');
      
      html+=`<div class="history-day${hasData?' has-data':''}" onclick="openModal('${dk}')">
        <div class="hday-top">
          <div class="hday-date">${isToday?'Today — ':''}${DAYS_SHORT[dow]}, ${d} ${MONTHS[mo].slice(0,3)} ${statusBadge}</div>
          <div style="text-align:right">
            ${vol>0?`<div class="hday-vol">${vol.toLocaleString()} kg</div>`:''}
            ${dayP>0?`<div class="hday-vol" style="color:var(--text);font-size:11px;margin-top:2px;">${dayP}g Protein</div>`:''}
          </div>
        </div>
        ${plan.label!=='Rest Day'?`<div class="hday-focus">${plan.label}</div>`:''}
        ${!hasData?`<div class="hday-empty">No data logged</div>`:''}
      </div>`;
    }
  }
  document.getElementById('history-content').innerHTML=html;
}

function openModal(dk){
  const d=new Date(dk);
  const dow=d.getDay();
  const plan=getPlan(dow, dk);
  const entry=DB[dk]||{};
  const meta=META[dk]||{};
  const vol=getDayVol(dk);
  
  const savedF = FOOD[dk] || { items: {} };
  let dayP = 0;
  const foodHtmlRows = [];
  DEFAULT_DIET.forEach(m => m.items.forEach(i => {
    if(savedF.items && savedF.items[i.id]) {
      dayP += i.p;
      const customName = (savedF.custom && savedF.custom[i.id]) ? savedF.custom[i.id] : i.name;
      foodHtmlRows.push(`<tr><td>${customName}</td><td style="text-align:right;color:var(--accent)">${i.p}g</td></tr>`);
    }
  }));
  const hasFood = dayP > 0 || savedF.water || savedF.sleep || savedF.junk;
  
  let html=`<div class="modal-title">${DAYS_FULL[dow]}, ${formatFull(d)}</div>
  <div class="modal-sub">${plan.label} · ${vol?vol.toLocaleString()+' kg total':'No volume logged'}</div>`;
  
  if(meta.notes || meta.bw || meta.start) {
    html+=`<div style="background:var(--bg3);padding:12px;border-radius:8px;margin-bottom:16px;font-size:12px;color:var(--text2)">
      ${meta.start?`<div>⏱️ Time: ${meta.start} - ${meta.end||'?'}</div>`:''}
      ${meta.bw?`<div>⚖️ Bodyweight: ${meta.bw} kg</div>`:''}
      ${meta.energy?`<div>⚡ Energy: ${meta.energy}/5</div>`:''}
      ${meta.notes?`<div style="margin-top:6px;color:var(--text)">"${meta.notes}"</div>`:''}
    </div>`;
  }

  if(!Object.keys(entry).length && !hasFood){
    html+=`<div style="color:var(--text2);font-size:13px;text-align:center;padding:20px 0">No data logged for this day.</div>`;
  } else {
    if(Object.keys(entry).length) {
      plan.muscles.forEach(m=>{
        let mHtml = '';
        m.exercises.forEach((ex,i)=>{
          const ek=`${m.name}_${i}`;
          const sv=entry[ek]||{};
          if(!sv.s && !sv.r && !sv.w) return;
          const v=(sv.s&&sv.r&&sv.w)?Math.round(sv.s*sv.r*sv.w):'—';
          mHtml+=`<tr><td>${ex}</td><td>${sv.s||'—'}</td><td>${sv.r||'—'}</td><td>${sv.w||'—'}</td><td style="color:var(--accent)">${v!=='—'?v+'kg':'—'}</td></tr>`;
        });
        if(mHtml) {
          html+=`<div class="mini-section">${m.name}</div>
          <table class="mini-table"><thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Kg</th><th>Vol</th></tr></thead><tbody>
          ${mHtml}</tbody></table>`;
        }
      });
    }
    
    if(hasFood) {
      html+=`<div class="mini-section" style="color:var(--blue);margin-top:20px;">Diet & Habits</div>`;
      if(foodHtmlRows.length) {
        html+=`<table class="mini-table"><thead><tr><th>Food Logged</th><th style="text-align:right">Protein</th></tr></thead><tbody>
        ${foodHtmlRows.join('')}
        <tr><td style="font-weight:bold;color:var(--text)">Total</td><td style="text-align:right;font-weight:bold;color:var(--accent)">${dayP}g</td></tr>
        </tbody></table>`;
      }
      if(savedF.water || savedF.sleep || savedF.junk) {
        html+=`<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
          ${savedF.water?`<span class="hday-status" style="background:rgba(77,159,255,0.1);color:var(--blue);margin:0">💧 3-4L Water</span>`:''}
          ${savedF.sleep?`<span class="hday-status" style="background:rgba(200,241,53,0.1);color:var(--accent);margin:0">😴 7-8h Sleep</span>`:''}
          ${savedF.junk?`<span class="hday-status" style="background:rgba(255,77,77,0.1);color:var(--red);margin:0">🚫 No Junk</span>`:''}
        </div>`;
      }
    }
  }
  document.getElementById('modal-content').innerHTML=html;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(e){if(e.target===document.getElementById('modal-overlay'))document.getElementById('modal-overlay').classList.remove('open');}
function closeModalBtn(){document.getElementById('modal-overlay').classList.remove('open');}

function buildReport(){
  let totalVol = 0, totalDays = 0, totalMins = 0;
  let energySum = 0, energyCount = 0;
  let latestBw = null, latestBwDate = '';
  
  let totalProteinAllTime = 0, daysWithProtein = 0;
  let total100gDays = 0;
  let habitWater = 0, habitSleep = 0, habitJunk = 0, habitDays = 0;
  
  const prs = {};
  const allExercises = {};
  Object.values(DEFAULT_PLAN).forEach(p=>p.muscles.forEach(m=>m.exercises.forEach((ex,i)=>{
    allExercises[`${m.name}_${i}`] = ex;
  })));

  const allKeys = new Set([...Object.keys(DB), ...Object.keys(FOOD), ...Object.keys(META)]);
  const dates = Array.from(allKeys).sort();
  
  dates.forEach(k => {
    // GYM
    const e = DB[k] || {};
    let dayVol = 0;
    Object.keys(e).filter(ek => !['meta', 'customName'].includes(ek)).forEach(ek => {
      const v = e[ek];
      if(v.s && v.r && v.w) {
        dayVol += v.s * v.r * v.w;
        if(!prs[ek] || v.w > prs[ek].w) prs[ek] = {w: v.w, date: k};
      }
    });
    totalVol += dayVol;
    
    // META
    const m = META[k] || {};
    if(dayVol > 0 || m.status === 'Completed' || m.status === 'Partial') totalDays++;
    
    if(m.start && m.end) {
      const [sH, sM] = m.start.split(':').map(Number);
      const [eH, eM] = m.end.split(':').map(Number);
      let mins = (eH*60 + eM) - (sH*60 + sM);
      if(mins < 0) mins += 24*60;
      totalMins += mins;
    }
    
    if(m.energy) { energySum += m.energy; energyCount++; }
    if(m.bw && k >= latestBwDate) { latestBw = m.bw; latestBwDate = k; }
    
    // FOOD
    const f = FOOD[k] || {};
    let dayP = 0;
    if(f.items) {
      DEFAULT_DIET.forEach(meal => meal.items.forEach(i => {
        if(f.items[i.id]) dayP += i.p;
      }));
    }
    if(dayP > 0) {
      totalProteinAllTime += dayP;
      daysWithProtein++;
      if(dayP >= 100) total100gDays++;
    }
    if(f.water || f.sleep || f.junk) {
      habitDays++;
      if(f.water) habitWater++;
      if(f.sleep) habitSleep++;
      if(f.junk) habitJunk++;
    }
  });

  const avgEnergy = energyCount ? (energySum / energyCount).toFixed(1) : '—';
  const hours = Math.floor(totalMins / 60);
  const avgP = daysWithProtein ? Math.round(totalProteinAllTime / daysWithProtein) : 0;
  
  const pctWater = habitDays ? Math.round((habitWater / habitDays) * 100) : 0;
  const pctSleep = habitDays ? Math.round((habitSleep / habitDays) * 100) : 0;
  const pctJunk = habitDays ? Math.round((habitJunk / habitDays) * 100) : 0;
  
  const prEntries = Object.entries(prs).sort((a,b)=>b[1].w - a[1].w).slice(0, 3);
  
  const now = new Date();
  let heatmapHtml = '<div class="heatmap">';
  for(let i=27; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dk = dateKey(d);
    const vol = getDayVol(dk);
    const m = META[dk] || {};
    let c = 'hm-day';
    if(vol > 0 || m.status === 'Completed' || m.status === 'Partial') c += ' active';
    else if(m.status === 'Skipped') c += ' skipped';
    heatmapHtml += `<div class="${c}" title="${formatFull(d)}"></div>`;
  }
  heatmapHtml += '</div>';

  let html = `
    <div class="ai-dash-header">
      <div>
        <div class="greeting">Analytics</div>
        <div class="ai-title">Dashboard</div>
      </div>
    </div>
    
    <div class="dash-grid">
      <div class="dash-card">
        <div class="dash-glow"></div>
        <div class="dash-icon">🏋️</div>
        <div>
          <div class="dash-val accent">${Math.round(totalVol).toLocaleString()} <span style="font-size:14px">kg</span></div>
          <div class="dash-label">Lifetime Volume</div>
        </div>
      </div>
      
      <div class="dash-card">
        <div class="dash-glow blue"></div>
        <div class="dash-icon">🔥</div>
        <div>
          <div class="dash-val">${totalDays}</div>
          <div class="dash-label">Workouts Completed</div>
        </div>
      </div>
      
      <div class="dash-card full">
        <div>
          <div class="dash-val" style="font-size:16px;">28-Day Consistency</div>
          <div class="dash-label">Recent Activity Heatmap</div>
        </div>
        ${heatmapHtml}
      </div>
      
      <div class="dash-card">
        <div class="dash-icon">⏱️</div>
        <div>
          <div class="dash-val">${hours} <span style="font-size:14px">hrs</span></div>
          <div class="dash-label">Total Time</div>
        </div>
      </div>
      
      <div class="dash-card">
        <div class="dash-icon">🧬</div>
        <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div class="dash-label" style="margin:0">Weight</div>
            <div class="dash-val" style="font-size:14px">${latestBw ? latestBw+'kg' : '—'}</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div class="dash-label" style="margin:0">Avg Energy</div>
            <div class="dash-val accent" style="font-size:14px">${avgEnergy} ★</div>
          </div>
        </div>
      </div>
      
      <!-- NUTRITION & HABITS -->
      <div class="dash-card full" style="border-color: rgba(77,159,255,0.3)">
        <div class="dash-glow blue"></div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between;">
          <div>
            <div class="dash-icon">🥗</div>
            <div class="dash-val" style="font-size:18px;">Nutrition & Habits</div>
            <div class="dash-label">Diet Consistency</div>
          </div>
          <div style="text-align:right;">
            <div class="dash-val" style="font-size:20px;color:var(--blue)">${avgP}g</div>
            <div class="dash-label">Avg Daily Protein</div>
          </div>
        </div>
        
        <div style="margin-top:16px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text2)">
            <span>100g Protein Goal Hit</span><span style="color:var(--text);font-weight:bold">${total100gDays} days</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text2)">
            <span>💧 Water Habit</span><span style="color:var(--blue);font-weight:bold">${pctWater}%</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text2)">
            <span>😴 Sleep Habit</span><span style="color:var(--accent);font-weight:bold">${pctSleep}%</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text2)">
            <span>🚫 No Junk Habit</span><span style="color:var(--red);font-weight:bold">${pctJunk}%</span>
          </div>
        </div>
      </div>
      
      <div class="dash-card full" style="border-color: rgba(200,241,53,0.3)">
        <div class="dash-glow"></div>
        <div>
          <div class="dash-icon">🏆</div>
          <div class="dash-val" style="font-size:18px;">All-Time Records</div>
          <div class="dash-label">Top 3 Heaviest Lifts</div>
        </div>
        <div class="pr-list">
          ${prEntries.length ? prEntries.map(([ek, v]) => {
            const customKey = Object.keys(NAMES).find(k => k.endsWith('_' + ek));
            const name = customKey ? NAMES[customKey] : (allExercises[ek] || ek);
            return `<div class="pr-item">
              <span class="pr-ex">${name}</span>
              <span class="pr-w">${v.w} kg</span>
            </div>`;
          }).join('') : '<div class="pr-item" style="justify-content:center"><span class="pr-ex">Log workouts to see PRs</span></div>'}
        </div>
      </div>
    </div>
    <div style="height:20px"></div>
  `;
  document.getElementById('report-content').innerHTML = html;
}

function buildSettings(){
  let html='';
  [1,2,3].forEach(dow=>{
    const p=DEFAULT_PLAN[dow];
    html+=`<div class="settings-section"><div class="settings-label">${p.label} — ${DAYS_FULL[dow]}</div>`;
    p.muscles.forEach(m=>{
      html+=`<div style="font-size:11px;color:var(--text3);margin:8px 0 6px;letter-spacing:.05em">${m.name}</div>`;
      m.exercises.forEach((ex,i)=>{
        const k=`${dow}_${m.name}_${i}`;
        const val=NAMES[k]||ex;
        html+=`<div class="exercise-edit-row">
          <div class="exercise-idx">${i+1}</div>
          <input type="text" value="${val}" data-k="${k}" placeholder="${ex}" />
        </div>`;
      });
    });
    html+='</div>';
  });
  
  html += `
  <div class="settings-section">
    <div class="settings-label">Data Export</div>
    <button class="settings-save" style="width:calc(100% - 40px); background:var(--blue); color:#fff; margin:0 20px;" onclick="exportCSV()">Export to Excel (CSV)</button>
    <div style="font-size:11px; color:var(--text3); margin:12px 20px 0; text-align:center;">Instantly download all your workout data</div>
  </div>`;
  
  document.getElementById('settings-content').innerHTML=html;
}

function exportCSV() {
  let csv = "Date,Day,Status,Start,End,Duration(Mins),Bodyweight,Energy,Mood,Total Volume(kg),Notes\n";
  Object.keys(DB).sort().forEach(k => {
    const d = new Date(k);
    const m = META[k] || {};
    const vol = getDayVol(k);
    let mins = '';
    if(m.start && m.end) {
      const [sH, sM] = m.start.split(':').map(Number);
      const [eH, eM] = m.end.split(':').map(Number);
      let diff = (eH*60 + eM) - (sH*60 + sM);
      if(diff < 0) diff += 24*60;
      mins = diff;
    }
    const notes = m.notes ? '"' + m.notes.replace(/"/g, '""') + '"' : '';
    csv += `${k},${DAYS_SHORT[d.getDay()]},${m.status||''},${m.start||''},${m.end||''},${mins},${m.bw||''},${m.energy||''},${m.mood||''},${vol},${notes}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'GymTracker_Data.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function saveExerciseNames(){
  document.querySelectorAll('#settings-content input').forEach(inp=>{
    const k=inp.dataset.k;
    const v=inp.value.trim();
    if(v)NAMES[k]=v;else delete NAMES[k];
  });
  syncToCloud();
  buildToday();
  alert('Default exercise names updated!');
}

function goTo(screen,btn){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+screen).classList.add('active');
  btn.classList.add('active');
  if(screen==='today')buildToday();
  if(screen==='food')buildFood();
  if(screen==='history')buildHistory();
  if(screen==='report')buildReport();
  if(screen==='settings')buildSettings();
}

