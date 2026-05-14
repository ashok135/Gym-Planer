import React from 'react';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol, DAYS_SHORT } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Report({ DB, NAMES, META, FOOD }) {
  let totalVol = 0, totalDays = 0, totalMins = 0;
  let latestBw = null, latestBwDate = '';
  
  let totalProteinAllTime = 0, daysWithProtein = 0;
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
    Object.keys(e).filter(ek => !['meta', 'customName', 'done'].includes(ek)).forEach(ek => {
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
    }
    if(f.water || f.sleep || f.junk) {
      habitDays++;
      if(f.water) habitWater++;
      if(f.sleep) habitSleep++;
      if(f.junk) habitJunk++;
    }
  });

  const hours = Math.floor(totalMins / 60);
  const avgP = daysWithProtein ? Math.round(totalProteinAllTime / daysWithProtein) : 0;
  
  const pctWater = habitDays ? Math.round((habitWater / habitDays) * 100) : 0;
  const pctSleep = habitDays ? Math.round((habitSleep / habitDays) * 100) : 0;
  const pctJunk = habitDays ? Math.round((habitJunk / habitDays) * 100) : 0;
  
  const prEntries = Object.entries(prs).sort((a,b) => b[1].w - a[1].w).slice(0, 3);
  
  // Prepare last 14 days data for Recharts
  const now = new Date();
  const chartData = [];
  for(let i=13; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dateKey(d);
    
    const entry = DB[k] || {};
    const vol = getDayVol(entry);
    
    const f = FOOD[k] || {};
    let p = 0;
    if(f.items) {
      const dietPlan = DEFAULT_DIET_PLAN[d.getDay()] || DEFAULT_DIET_PLAN[1];
      dietPlan.forEach(meal => meal.items.forEach(i => {
        if(f.items[i.id]) p += i.p;
      }));
    }
    
    chartData.push({
      name: DAYS_SHORT[d.getDay()],
      date: formatFull(d),
      Volume: vol,
      Protein: p
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{background: 'rgba(17,17,17,0.95)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow)', backdropFilter: 'blur(10px)'}}>
          <p style={{color: 'var(--text)', margin: '0 0 5px 0', fontSize: '12px'}}>{payload[0].payload.date}</p>
          <p style={{color: payload[0].color, margin: 0, fontWeight: 'bold'}}>{payload[0].name}: {payload[0].value.toLocaleString()} {payload[0].name === 'Volume' ? 'kg' : 'g'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="report-content" style={{padding:'20px 0'}}>
      <div className="ai-dash-header">
        <div>
          <div className="greeting">Analytics</div>
          <div className="ai-title">Performance Dashboard</div>
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
            <div className="dash-label">Workouts</div>
          </div>
        </div>

        {/* RECHARTS VOLUME GRAPH */}
        <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'block'}}>
          <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div className="dash-val" style={{fontSize: '18px'}}>Progressive Overload</div>
              <div className="dash-label">14-Day Trailing Volume</div>
            </div>
          </div>
          <div style={{width: '100%', height: '220px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--border2)', opacity: 0.4}} />
                <Bar dataKey="Volume" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECHARTS PROTEIN GRAPH */}
        <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'block', borderColor: 'rgba(77,159,255,0.2)'}}>
          <div className="dash-glow blue"></div>
          <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div className="dash-val" style={{fontSize: '18px', color: 'var(--blue)'}}>Protein Intake</div>
              <div className="dash-label">14-Day Macro Trend</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="dash-val" style={{fontSize:'16px'}}>{avgP}g</div>
              <div className="dash-label">Avg Daily</div>
            </div>
          </div>
          <div style={{width: '100%', height: '180px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Protein" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorProtein)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="dash-card full" style={{display: 'block'}}>
          <div className="dash-val" style={{fontSize:'18px', marginBottom: '16px'}}>Habit Consistency</div>
          
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                <span>💧 Water Habit</span><span style={{color:'var(--blue)',fontWeight:'bold'}}>{pctWater}%</span>
              </div>
              <div style={{width: '100%', height: '6px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{width: `${pctWater}%`, height: '100%', background: 'var(--blue)', transition: 'width 1s ease-out'}}></div>
              </div>
            </div>
            
            <div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                <span>😴 Sleep Habit</span><span style={{color:'var(--accent)',fontWeight:'bold'}}>{pctSleep}%</span>
              </div>
              <div style={{width: '100%', height: '6px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{width: `${pctSleep}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s ease-out'}}></div>
              </div>
            </div>
            
            <div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                <span>🚫 No Junk Habit</span><span style={{color:'var(--red)',fontWeight:'bold'}}>{pctJunk}%</span>
              </div>
              <div style={{width: '100%', height: '6px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{width: `${pctJunk}%`, height: '100%', background: 'var(--red)', transition: 'width 1s ease-out'}}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dash-card full">
          <div className="dash-glow"></div>
          <div>
            <div className="dash-icon">🏆</div>
            <div className="dash-val" style={{fontSize:'18px'}}>All-Time Records</div>
            <div className="dash-label">Top 3 Heaviest Lifts</div>
          </div>
          <div className="pr-list" style={{marginTop: '16px'}}>
            {prEntries.length ? prEntries.map(([ek, v]) => {
              const customKey = Object.keys(NAMES).find(k => k.endsWith('_' + ek));
              const name = customKey ? NAMES[customKey] : (allExercises[ek] || ek);
              return (
                <div className="pr-item" key={ek}>
                  <span className="pr-ex">{name}</span>
                  <span className="pr-w" style={{fontWeight: 600}}>{v.w} kg</span>
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
