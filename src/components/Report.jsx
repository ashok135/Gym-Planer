import React, { useState } from 'react';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol, DAYS_SHORT, MONTHS } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Report({ DB, NAMES, META, FOOD }) {
  const [timeRange, setTimeRange] = useState('Today'); // 'Today', 'Weekly', 'Monthly', 'Yearly'
  
  // Aggregate data based on time range
  const now = new Date();
  let daysToLookBack = 1;
  if(timeRange === 'Weekly') daysToLookBack = 7;
  if(timeRange === 'Monthly') daysToLookBack = 30;
  if(timeRange === 'Yearly') daysToLookBack = 365;
  
  let totalVol = 0, totalDaysAttended = 0, totalPossibleDays = 0;
  let totalProtein = 0, habitWater = 0, habitSleep = 0, habitJunk = 0;
  let totalMinutesSpent = 0;
  
  const chartData = [];
  const monthlyDataMap = {}; // For Yearly aggregation

  // PR calculation over all time (independent of time range)
  const prs = {};
  const allExercises = {};
  Object.values(DEFAULT_PLAN).forEach(p => p.muscles.forEach(m => m.exercises.forEach((ex, i) => {
    allExercises[`${m.name}_${i}`] = ex;
  })));
  
  const allKeys = Array.from(new Set([...Object.keys(DB), ...Object.keys(FOOD), ...Object.keys(META)])).sort();
  allKeys.forEach(k => {
    const e = DB[k] || {};
    Object.keys(e).filter(ek => !['meta', 'customName', 'done'].includes(ek)).forEach(ek => {
      const v = e[ek];
      if(v.s && v.r && v.w) {
        if(!prs[ek] || v.w > prs[ek].w) prs[ek] = { w: v.w, date: k };
      }
    });
  });
  
  const prEntries = Object.entries(prs).sort((a,b) => b[1].w - a[1].w).slice(0, 3);
  
  let todayTotalExercises = 0;
  let todayDoneExercises = 0;

  for(let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dateKey(d);
    
    totalPossibleDays++;
    
    const entry = DB[k] || {};
    const vol = getDayVol(entry);
    const m = META[k] || {};
    let attended = false;
    
    if(timeRange === 'Today') {
      const plan = DEFAULT_PLAN[d.getDay()] || DEFAULT_PLAN[0];
      plan.muscles.forEach(mu => {
        mu.exercises.forEach((ex, idx) => {
          todayTotalExercises++;
          const ek = `${mu.name}_${idx}`;
          if(entry[ek] && (entry[ek].done || (entry[ek].s && entry[ek].r && entry[ek].w))) {
            todayDoneExercises++;
          }
        });
      });
    }

    if(vol > 0 || m.status === 'Completed' || m.status === 'Partial') {
      totalDaysAttended++;
      attended = true;
    }
    
    if (m.start && m.end) {
      const [sh, sm] = m.start.split(':').map(Number);
      const [eh, em] = m.end.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        totalMinutesSpent += mins;
      }
    }
    
    totalVol += vol;
    
    const f = FOOD[k] || {};
    let p = 0;
    if(f.items) {
      const dietPlan = DEFAULT_DIET_PLAN[d.getDay()] || DEFAULT_DIET_PLAN[1];
      dietPlan.forEach(meal => meal.items.forEach(item => {
        if(f.items[item.id]) p += item.p;
      }));
    }
    totalProtein += p;
    
    if(f.water) habitWater++;
    if(f.sleep) habitSleep++;
    if(f.junk) habitJunk++;
    
    if(timeRange === 'Yearly') {
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if(!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { name: MONTHS[d.getMonth()].substring(0,3), date: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, Volume: 0, Protein: 0 };
      }
      monthlyDataMap[monthKey].Volume += vol;
      monthlyDataMap[monthKey].Protein += p;
    } else {
      chartData.push({
        name: timeRange === 'Monthly' ? `${d.getDate()}` : DAYS_SHORT[d.getDay()],
        date: formatFull(d),
        Volume: vol,
        Protein: p
      });
    }
  }
  
  const finalChartData = timeRange === 'Yearly' ? Object.values(monthlyDataMap) : chartData;
  const avgP = totalPossibleDays ? Math.round(totalProtein / totalPossibleDays) : 0;
  
  const pctWater = totalPossibleDays ? Math.round((habitWater / totalPossibleDays) * 100) : 0;
  const pctSleep = totalPossibleDays ? Math.round((habitSleep / totalPossibleDays) * 100) : 0;
  const pctJunk = totalPossibleDays ? Math.round((habitJunk / totalPossibleDays) * 100) : 0;

  // Pie Chart Data
  const missedDays = totalPossibleDays - totalDaysAttended;
  const pieData = [
    { name: 'Attended', value: totalDaysAttended, color: 'var(--accent)' },
    { name: 'Missed', value: missedDays, color: 'var(--red)' }
  ];
  
  const formatTime = (totalMins) => {
    if (totalMins === 0) return '0 hrs';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hrs`;
    return `${h}h ${m}m`;
  };
  
  const pct = totalPossibleDays ? Math.round((totalDaysAttended / totalPossibleDays) * 100) : 0;
  let pctColor = 'var(--text)';
  if (timeRange === 'Today') {
    pctColor = totalDaysAttended > 0 ? 'var(--accent)' : 'var(--red)';
  } else {
    pctColor = pct >= 50 ? 'var(--accent)' : 'var(--red)';
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
      <div className="ai-dash-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'}}>
        <div>
          <div className="greeting">Analytics</div>
          <div className="ai-title">Performance</div>
        </div>
        
        {/* TIME FILTER */}
        <div style={{display: 'flex', background: 'var(--bg3)', borderRadius: '20px', padding: '4px'}}>
          {['Today', 'Weekly', 'Monthly', 'Yearly'].map(tr => (
            <div 
              key={tr}
              onClick={() => setTimeRange(tr)}
              style={{
                padding: '4px 12px', fontSize: '11px', borderRadius: '16px', cursor: 'pointer',
                background: timeRange === tr ? 'var(--accent)' : 'transparent',
                color: timeRange === tr ? '#000' : 'var(--text2)',
                fontWeight: timeRange === tr ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tr}
            </div>
          ))}
        </div>
      </div>
      
      <div className="dash-grid">
        <div className="dash-card full" style={{background: 'linear-gradient(145deg, var(--bg3), var(--bg2))', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden'}}>
          <div className="dash-glow accent" style={{opacity: 0.15}}></div>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
              <span style={{fontSize: '20px'}}>🏆</span>
              <div className="dash-val" style={{fontSize:'18px'}}>Hall of Fame</div>
            </div>
            <div className="dash-label">Top 3 All-Time Heaviest Lifts</div>
          </div>
          <div className="pr-list" style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {prEntries.length ? prEntries.map(([ek, v], idx) => {
              const customKey = Object.keys(NAMES).find(k => k.endsWith('_' + ek));
              const name = customKey ? NAMES[customKey] : (allExercises[ek] || ek);
              return (
                <div key={ek} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? 'rgba(200, 241, 53, 0.2)' : 'var(--bg)', color: idx === 0 ? 'var(--accent)' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'}}>{idx + 1}</div>
                    <span style={{color: 'var(--text)', fontSize: '14px', fontWeight: 500}}>{name}</span>
                  </div>
                  <span style={{fontWeight: 700, color: 'var(--accent)', fontSize: '16px'}}>{v.w} kg</span>
                </div>
              );
            }) : <div style={{textAlign: 'center', color: 'var(--text2)', fontSize: '13px', padding: '20px 0'}}>Log workouts to build your Hall of Fame!</div>}
          </div>
        </div>

        {/* ATTENDANCE DONUT CHART */}
        <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'}}>
          <div>
            <div className="dash-val" style={{fontSize: '18px'}}>Consistency</div>
            <div className="dash-label">{timeRange} Attendance</div>
            <div style={{marginTop: '8px', fontSize: '24px', fontWeight: 'bold', color: pctColor}}>
              {pct}%
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)'}}><CheckCircle2 size={16} color="var(--accent)"/> {totalDaysAttended} Present</div>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text2)'}}><XCircle size={16} color="var(--red)"/> {missedDays} Absent</div>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--blue)', marginTop: '4px'}}><span style={{fontSize: '16px'}}>⏱️</span> {formatTime(totalMinutesSpent)} Spent</div>
            </div>
            <div style={{width: '90px', height: '90px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={45} stroke="none" cornerRadius={10} paddingAngle={5}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {timeRange !== 'Today' && (
          <>
            {/* RECHARTS VOLUME GRAPH */}
            <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'block'}}>
          <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div className="dash-val" style={{fontSize: '18px'}}>Progressive Overload</div>
              <div className="dash-label">{timeRange} Volume Trend</div>
            </div>
          </div>
          <div style={{width: '100%', height: '220px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--border2)', opacity: 0.4}} />
                {/* Fully rounded bars */}
                <Bar dataKey="Volume" fill="var(--accent)" radius={[8, 8, 8, 8]} maxBarSize={timeRange === 'Monthly' ? 8 : 30} />
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
              <div className="dash-label">{timeRange} Macro Trend</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="dash-val" style={{fontSize:'16px'}}>{avgP}g</div>
              <div className="dash-label">Avg Daily</div>
            </div>
          </div>
          <div style={{width: '100%', height: '180px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
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
        </>
        )}

        {timeRange === 'Today' && (
          <>
            {todayTotalExercises > 0 ? (
              <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'block', borderColor: 'var(--accent)'}}>
                <div className="dash-glow accent" style={{opacity: 0.1}}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div className="dash-val" style={{fontSize: '18px'}}>Workout Progress</div>
                    <div className="dash-label">Completed Exercises</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="dash-val" style={{fontSize:'24px', color:'var(--accent)'}}>{todayDoneExercises} <span style={{fontSize:'16px', color:'var(--text2)'}}>/ {todayTotalExercises}</span></div>
                  </div>
                </div>
                <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden', marginTop: '16px'}}>
                  <div style={{width: `${Math.round((todayDoneExercises/todayTotalExercises)*100)}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
                </div>
              </div>
            ) : (
              <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'block', textAlign: 'center'}}>
                <div className="dash-val" style={{fontSize: '18px', color:'var(--text2)'}}>Rest Day</div>
                <div className="dash-label">No exercises scheduled for today</div>
              </div>
            )}
            
            <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'block', borderColor: 'rgba(77,159,255,0.2)'}}>
              <div className="dash-glow blue" style={{opacity: 0.1}}></div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <div className="dash-val" style={{fontSize: '18px', color: 'var(--blue)'}}>Protein Goal</div>
                  <div className="dash-label">Consumed Today</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="dash-val" style={{fontSize:'24px', color:'var(--blue)'}}>{totalProtein}g <span style={{fontSize:'16px', color:'var(--text2)'}}>/ 100g</span></div>
                </div>
              </div>
              <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden', marginTop: '16px'}}>
                <div style={{width: `${Math.min(100, Math.round((totalProtein/100)*100))}%`, height: '100%', background: 'var(--blue)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
              </div>
            </div>
          </>
        )}
        
        <div className="dash-card full" style={{display: 'block'}}>
          <div className="dash-val" style={{fontSize:'18px', marginBottom: '16px'}}>Habit Consistency</div>
          
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                <span>💧 Water Habit</span><span style={{color:'var(--blue)',fontWeight:'bold'}}>{pctWater}%</span>
              </div>
              <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{width: `${pctWater}%`, height: '100%', background: 'var(--blue)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
              </div>
            </div>
            
            <div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                <span>😴 Sleep Habit</span><span style={{color:'var(--accent)',fontWeight:'bold'}}>{pctSleep}%</span>
              </div>
              <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{width: `${pctSleep}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
              </div>
            </div>
            
            <div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                <span>🚫 No Junk Habit</span><span style={{color:'var(--red)',fontWeight:'bold'}}>{pctJunk}%</span>
              </div>
              <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{width: `${pctJunk}%`, height: '100%', background: 'var(--red)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      <div style={{height:'20px'}}></div>
    </div>
  );
}
