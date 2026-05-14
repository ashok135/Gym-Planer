import React from 'react';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol } from '../data';

export default function Report({ DB, NAMES, META, FOOD }) {
  let totalVol = 0, totalDays = 0, totalMins = 0;
  let energySum = 0, energyCount = 0;
  let latestBw = null, latestBwDate = '';
  
  let totalProteinAllTime = 0, daysWithProtein = 0;
  let total100gDays = 0;
  let habitWater = 0, habitSleep = 0, habitJunk = 0, habitDays = 0;
  
  const prs = {};
  const allExercises = {};
  Object.values(DEFAULT_PLAN).forEach(p => p.muscles.forEach(m => m.exercises.forEach((ex, i) => {
    allExercises[`${m.name}_${i}`] = ex;
  })));

  const allKeys = Array.from(new Set([...Object.keys(DB), ...Object.keys(FOOD), ...Object.keys(META)])).sort();
  
  allKeys.forEach(k => {
    const e = DB[k] || {};
    let dayVol = 0;
    Object.keys(e).filter(ek => !['meta', 'customName'].includes(ek)).forEach(ek => {
      const v = e[ek];
      if(v.s && v.r && v.w) {
        dayVol += v.s * v.r * v.w;
        if(!prs[ek] || v.w > prs[ek].w) prs[ek] = { w: v.w, date: k };
      }
    });
    totalVol += dayVol;
    
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
    
    const f = FOOD[k] || {};
    let dayP = 0;
    if(f.items) {
      const kd = new Date(k);
      const kdow = kd.getDay();
      const dietPlan = DEFAULT_DIET_PLAN[kdow] || DEFAULT_DIET_PLAN[1];
      dietPlan.forEach(meal => meal.items.forEach(i => {
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
  
  const prEntries = Object.entries(prs).sort((a,b) => b[1].w - a[1].w).slice(0, 3);
  
  const now = new Date();
  const heatmapDays = [];
  for(let i=27; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dk = dateKey(d);
    const vol = getDayVol(DB[dk]);
    const m = META[dk] || {};
    let c = 'hm-day';
    if(vol > 0 || m.status === 'Completed' || m.status === 'Partial') c += ' active';
    else if(m.status === 'Skipped') c += ' skipped';
    heatmapDays.push(<div key={i} className={c} title={formatFull(d)}></div>);
  }

  return (
    <div id="report-content" style={{padding:'20px 0'}}>
      <div className="ai-dash-header">
        <div>
          <div className="greeting">Analytics</div>
          <div className="ai-title">Dashboard</div>
        </div>
      </div>
      
      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-glow"></div>
          <div className="dash-icon">🏋️</div>
          <div>
            <div className="dash-val accent">{Math.round(totalVol).toLocaleString()} <span style={{fontSize:'14px'}}>kg</span></div>
            <div className="dash-label">Lifetime Volume</div>
          </div>
        </div>
        
        <div className="dash-card">
          <div className="dash-glow blue"></div>
          <div className="dash-icon">🔥</div>
          <div>
            <div className="dash-val">{totalDays}</div>
            <div className="dash-label">Workouts Completed</div>
          </div>
        </div>
        
        <div className="dash-card full">
          <div>
            <div className="dash-val" style={{fontSize:'16px'}}>28-Day Consistency</div>
            <div className="dash-label">Recent Activity Heatmap</div>
          </div>
          <div className="heatmap">{heatmapDays}</div>
        </div>
        
        <div className="dash-card">
          <div className="dash-icon">⏱️</div>
          <div>
            <div className="dash-val">{hours} <span style={{fontSize:'14px'}}>hrs</span></div>
            <div className="dash-label">Total Time</div>
          </div>
        </div>
        
        <div className="dash-card">
          <div className="dash-icon">🧬</div>
          <div style={{display:'flex', flexDirection:'column', gap:'4px', marginTop:'8px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
              <div className="dash-label" style={{margin:0}}>Weight</div>
              <div className="dash-val" style={{fontSize:'14px'}}>{latestBw ? latestBw+'kg' : '—'}</div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
              <div className="dash-label" style={{margin:0}}>Avg Energy</div>
              <div className="dash-val accent" style={{fontSize:'14px'}}>{avgEnergy} ★</div>
            </div>
          </div>
        </div>
        
        <div className="dash-card full" style={{borderColor: 'rgba(77,159,255,0.3)'}}>
          <div className="dash-glow blue"></div>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
            <div>
              <div className="dash-icon">🥗</div>
              <div className="dash-val" style={{fontSize:'18px'}}>Nutrition & Habits</div>
              <div className="dash-label">Diet Consistency</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="dash-val" style={{fontSize:'20px',color:'var(--blue)'}}>{avgP}g</div>
              <div className="dash-label">Avg Daily Protein</div>
            </div>
          </div>
          
          <div style={{marginTop:'16px', display:'flex', flexDirection:'column', gap:'8px'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text2)'}}>
              <span>100g Protein Goal Hit</span><span style={{color:'var(--text)',fontWeight:'bold'}}>{total100gDays} days</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text2)'}}>
              <span>💧 Water Habit</span><span style={{color:'var(--blue)',fontWeight:'bold'}}>{pctWater}%</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text2)'}}>
              <span>😴 Sleep Habit</span><span style={{color:'var(--accent)',fontWeight:'bold'}}>{pctSleep}%</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text2)'}}>
              <span>🚫 No Junk Habit</span><span style={{color:'var(--red)',fontWeight:'bold'}}>{pctJunk}%</span>
            </div>
          </div>
        </div>
        
        <div className="dash-card full" style={{borderColor: 'rgba(200,241,53,0.3)'}}>
          <div className="dash-glow"></div>
          <div>
            <div className="dash-icon">🏆</div>
            <div className="dash-val" style={{fontSize:'18px'}}>All-Time Records</div>
            <div className="dash-label">Top 3 Heaviest Lifts</div>
          </div>
          <div className="pr-list">
            {prEntries.length ? prEntries.map(([ek, v]) => {
              const customKey = Object.keys(NAMES).find(k => k.endsWith('_' + ek));
              const name = customKey ? NAMES[customKey] : (allExercises[ek] || ek);
              return (
                <div className="pr-item" key={ek}>
                  <span className="pr-ex">{name}</span>
                  <span className="pr-w">{v.w} kg</span>
                </div>
              );
            }) : <div className="pr-item" style={{justifyContent:'center'}}><span className="pr-ex">Log workouts to see PRs</span></div>}
          </div>
        </div>
      </div>
      <div style={{height:'20px'}}></div>
    </div>
  );
}
