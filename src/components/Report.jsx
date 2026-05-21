import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol, DAYS_SHORT, MONTHS } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';
import History from './History';
import Budget from './Budget';
import Study from './Study';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{background: 'rgba(17,17,17,0.95)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow)', backdropFilter: 'blur(10px)'}}>
        <p style={{color: 'var(--text)', margin: '0 0 5px 0', fontSize: '12px'}}>{payload[0].payload.date}</p>
        <p style={{color: payload[0].color, margin: 0, fontWeight: 'bold'}}>
          {payload[0].name}: {payload[0].value.toLocaleString()}
          {payload[0].name === 'Volume' ? ' kg' : payload[0].name === 'Time' ? ' mins' : 'g'}
        </p>
      </div>
    );
  }
  return null;
};

export default function Report({ DB, NAMES, META, FOOD, SCHEDULE, BUDGET, BUDGET_SETTINGS, syncBudget, STUDY, STUDY_SETTINGS, syncStudy }) {
  const [activeSection, setActiveSection] = useState('gym');
  const [timeRange, setTimeRange] = useState('Today');
  const [budgetRange, setBudgetRange] = useState('Monthly');
  const [studyRange, setStudyRange] = useState('Weekly');

  // ResizeObserver-based chart width — avoids ResponsiveContainer infinite loop
  const chartAreaRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);
  useEffect(() => {
    if (!chartAreaRef.current) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && Math.abs(w - chartWidth) > 2) setChartWidth(Math.floor(w));
    });
    observer.observe(chartAreaRef.current);
    setChartWidth(Math.floor(chartAreaRef.current.getBoundingClientRect().width) || 300);
    return () => observer.disconnect();
  }, []);

  const now = new Date();
  let daysToLookBack = 1;
  if(timeRange === 'Weekly') daysToLookBack = 7;
  if(timeRange === 'Monthly') daysToLookBack = 30;
  if(timeRange === 'Yearly') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    daysToLookBack = Math.max(1, Math.ceil(Math.abs(now - startOfYear) / (1000 * 60 * 60 * 24)));
  }
  
  let totalVol = 0, totalDaysAttended = 0, totalPossibleDays = 0;
  let totalProtein = 0, habitWater = 0, habitSleep = 0, habitJunk = 0;
  let totalMinutesSpent = 0;
  
  const chartData = [];
  const monthlyDataMap = {};
  const prs = {};
  const allExercises = {
    'Abs_0': 'Crunches',
    'Abs_1': 'Leg Raises',
    'Abs_2': 'Plank',
    'Progressive_0': 'Back Squat (Heavy)',
    'Progressive_1': 'Deadlift (Heavy)',
    'Progressive_2': 'Overhead Press (Heavy)',
    'Progressive_3': 'Weighted Pull-ups',
    'Progressive_4': 'Barbell Row (Heavy)',
  };

  const gymMonthsData = [];
  const todayKey = dateKey(now);
  for (let m = 0; m < 12; m++) {
    const monthDays = [];
    const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dk = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const entry = DB[dk] || {};
      const vol = getDayVol(entry);
      const meta = META[dk] || {};
      const status = meta.status || '';
      monthDays.push({ dk, vol, status });
    }
    gymMonthsData.push({ name: MONTHS[m].slice(0, 3), days: monthDays });
  }
  Object.values(DEFAULT_PLAN).forEach(p => p.muscles.forEach(m => m.exercises.forEach((ex, i) => {
    allExercises[`${m.name}_${i}`] = ex;
  })));
  
  Object.keys(DB).forEach(k => {
    const e = DB[k] || {};
    Object.keys(e).filter(ek => !['meta', 'customName', 'done'].includes(ek)).forEach(ek => {
      const v = e[ek];
      if(v.s && v.r && v.w) {
        const weight = parseFloat(v.w) || 0;
        if(!prs[ek] || weight > prs[ek].w) prs[ek] = { w: weight, date: k };
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
      if (m.absEnabled || Object.keys(entry).some(key => key.startsWith('Abs_'))) {
        ['Crunches', 'Leg Raises', 'Plank'].forEach((ex, idx) => {
          todayTotalExercises++;
          const ek = `Abs_${idx}`;
          if(entry[ek] && (entry[ek].done || (entry[ek].s && entry[ek].r && entry[ek].w))) {
            todayDoneExercises++;
          }
        });
      }
      if (m.progressiveEnabled || Object.keys(entry).some(key => key.startsWith('Progressive_'))) {
        ['Back Squat (Heavy)', 'Deadlift (Heavy)', 'Overhead Press (Heavy)', 'Weighted Pull-ups', 'Barbell Row (Heavy)'].forEach((ex, idx) => {
          todayTotalExercises++;
          const ek = `Progressive_${idx}`;
          if(entry[ek] && (entry[ek].done || (entry[ek].s && entry[ek].r && entry[ek].w))) {
            todayDoneExercises++;
          }
        });
      }
    }

    if(vol > 0 || m.status === 'Completed' || m.status === 'Partial') {
      totalDaysAttended++;
    }
    
    let mins = 0;
    if (m.start && m.end) {
      const [sh, sm] = m.start.split(':').map(Number);
      const [eh, em] = m.end.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        mins = (eh * 60 + em) - (sh * 60 + sm);
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
        monthlyDataMap[monthKey] = { name: MONTHS[d.getMonth()].substring(0,3), date: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, Volume: 0, Protein: 0, Time: 0 };
      }
      monthlyDataMap[monthKey].Volume += vol;
      monthlyDataMap[monthKey].Protein += p;
      monthlyDataMap[monthKey].Time += mins;
    } else {
      chartData.push({
        name: timeRange === 'Weekly' ? DAYS_SHORT[d.getDay()] : `${d.getDate()}/${d.getMonth()+1}`,
        date: formatFull(d),
        Volume: vol,
        Protein: p,
        Time: mins
      });
    }
  }
  
  const finalChartData = timeRange === 'Yearly' ? Object.values(monthlyDataMap) : chartData;
  const avgP = totalPossibleDays ? Math.round(totalProtein / totalPossibleDays) : 0;
  const pctWater = totalPossibleDays ? Math.round((habitWater / totalPossibleDays) * 100) : 0;
  const pctSleep = totalPossibleDays ? Math.round((habitSleep / totalPossibleDays) * 100) : 0;
  const pctJunk = totalPossibleDays ? Math.round((habitJunk / totalPossibleDays) * 100) : 0;
  const missedDays = totalPossibleDays - totalDaysAttended;
  const pieData = [
    { name: 'Attended', value: totalDaysAttended, color: 'var(--accent)' },
    { name: 'Missed', value: missedDays, color: 'var(--red)' }
  ];

  const muscleCounts = {};
  const bwData = [];

  for(let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dateKey(d);
    const day = DB[k] || {};
    const meta = META[k] || {};

    Object.keys(day).filter(ek => !['meta', 'customName', 'done'].includes(ek)).forEach(ek => {
      const muscle = ek.split('_')[0];
      muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
    });

    if (meta.bw) {
      bwData.push({ date: k, bw: parseFloat(meta.bw) });
    }
  }

  const muscleData = Object.entries(muscleCounts).map(([name, value]) => ({ 
    name, 
    value, 
    color: `hsl(${(Object.keys(muscleCounts).indexOf(name) * 137.5) % 360}, 70%, 60%)` 
  }));
  
  const formatTime = (totalMins) => {
    if (totalMins === 0) return '0 hrs';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hrs`;
    return `${h}h ${m}m`;
  };
  
  const pct = totalPossibleDays ? Math.round((totalDaysAttended / totalPossibleDays) * 100) : 0;
  const pctColor = (timeRange === 'Today') ? (totalDaysAttended > 0 ? 'var(--accent)' : 'var(--red)') : (pct >= 50 ? 'var(--accent)' : 'var(--red)');

  return (
    <div id="report-content" style={{padding:'20px 0'}}>
      <div style={{padding:'0 10px 16px', display:'flex', justifyContent:'flex-end'}}>
        
      </div>

      <div style={{padding:'0 10px 4px'}}>
        <div className="ai-title" style={{marginBottom:'16px', fontSize:'32px'}}>Reports</div>
        <div style={{display:'flex', gap:'10px', marginBottom:'24px'}}>
          {['gym', 'budget', 'study'].map(id => (
            <div key={id} onClick={() => setActiveSection(id)}
              style={{ flex:1, textAlign:'center', padding:'12px 4px', borderRadius:'14px', cursor:'pointer', fontSize:'13px', fontWeight: activeSection === id ? 700 : 400,
                background: activeSection === id ? 'var(--accent)' : 'var(--bg3)',
                color: activeSection === id ? '#000' : 'var(--text2)',
                border: '1px solid var(--border2)', transition:'all 0.2s' }}>
              {id === 'gym' ? '🏋️ Gym & Diet' : id === 'budget' ? '💰 Budget' : '📚 Study'}
            </div>
          ))}
        </div>
      </div>

      {/* BUDGET SECTION IN REPORT */}
      {activeSection === 'budget' && (
        <div style={{ padding: '0 10px' }}>
          <Budget BUDGET={BUDGET} syncBudget={syncBudget} BUDGET_SETTINGS={BUDGET_SETTINGS} isReport={true} activeRange={budgetRange} />
        </div>
      )}

      {/* STUDY SECTION IN REPORT */}
      {activeSection === 'study' && (
        <div style={{ padding: '0 10px' }}>
          <Study STUDY={STUDY} syncStudy={syncStudy} STUDY_SETTINGS={STUDY_SETTINGS} isReport={true} activeRange={studyRange} />
        </div>
      )}

      {activeSection === 'gym' && (
        <div style={{padding:'0 10px'}}>
          <div className="ai-dash-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom:'20px'}}>
            <div>
              <div className="greeting">Performance</div>
              <div className="ai-title">Gym & Diet</div>
            </div>
            <div style={{display: 'flex', background: 'var(--bg3)', borderRadius: '20px', padding: '4px'}}>
              {['Today', 'Weekly', 'Monthly', 'Yearly'].map(tr => (
                <div key={tr} onClick={() => setTimeRange(tr)}
                  style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '16px', cursor: 'pointer',
                    background: timeRange === tr ? 'var(--accent)' : 'transparent',
                    color: timeRange === tr ? '#000' : 'var(--text2)',
                    fontWeight: timeRange === tr ? 'bold' : 'normal', transition: 'all 0.2s' }}>
                  {tr}
                </div>
              ))}
            </div>
          </div>
          
          <div className="dash-grid" style={{marginBottom:'24px'}}>
            <div className="dash-card" style={{background: 'linear-gradient(135deg, var(--bg3), var(--bg2))'}}>
              <div className="dash-glow accent"></div>
              <div className="dash-val" style={{color: pctColor}}>{pct}%</div>
              <div className="dash-label">Consistency Score</div>
              <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                {totalDaysAttended} days finished / {totalPossibleDays} total
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-val">{(totalVol/1000).toFixed(1)}t</div>
              <div className="dash-label">Total Volume</div>
              <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                Avg: {(totalVol / (totalDaysAttended || 1) / 1000).toFixed(1)}t per session
              </div>
            </div>
            {timeRange === 'Today' && (
              <div className="dash-card">
                <div className="dash-val" style={{color: todayDoneExercises >= todayTotalExercises ? 'var(--accent)' : 'var(--orange)'}}>
                  {todayDoneExercises}<span style={{fontSize:'12px', color:'var(--text3)'}}>/{todayTotalExercises}</span>
                </div>
                <div className="dash-label">Exercises Done</div>
                <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                  {Math.round((todayDoneExercises / (todayTotalExercises || 1)) * 100)}% completion
                </div>
              </div>
            )}
            <div className="dash-card">
              <div className="dash-val" style={{color: 'var(--blue)'}}>{formatTime(totalMinutesSpent)}</div>
              <div className="dash-label">Time Invested</div>
              <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                {timeRange} cumulative duration
              </div>
            </div>
          </div>

          {/* Gym Activity Heatmap Card */}
          <div className="dash-card full" style={{ margin: '0 0 24px 0', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>Gym Activity Heatmap</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{now.getFullYear()} Calendar</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', background: 'var(--bg3)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border2)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {gymMonthsData.map(m => (
                <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 'fit-content' }}>
                  <div style={{ fontSize: '8px', color: 'var(--text3)', textAlign: 'center' }}>{m.name}</div>
                  <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '2.5px' }}>
                    {m.days.map(d => {
                      let bgColor = 'rgba(255,255,255,0.05)';
                      if (d.status === 'Skipped') {
                        bgColor = 'rgba(255, 77, 77, 0.4)'; // Red for skipped
                      } else if (d.status === 'Completed' || d.status === 'Partial' || d.vol > 0) {
                        bgColor = `rgba(200, 241, 53, ${Math.min(1, 0.3 + (d.vol / 5000))})`; // Green/accent for completed
                      }
                      return (
                        <div key={d.dk} style={{ 
                          width: '7px', height: '7px', borderRadius: '1px', 
                          background: bgColor,
                          border: d.dk === todayKey ? '1px solid var(--accent)' : 'none'
                        }} title={`${d.dk}: ${d.vol > 0 ? d.vol.toLocaleString() + ' kg' : d.status || 'No session'}`} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '10px', color: 'var(--text3)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'rgba(255,255,255,0.05)' }}></div> Empty/Rest</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'rgba(255, 77, 77, 0.4)' }}></div> Skipped</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'rgba(200, 241, 53, 0.5)' }}></div> Active</div>
            </div>
          </div>

          <div className="dash-grid">
            <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', borderColor: 'var(--border2)'}}>
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div><div className="dash-val" style={{fontSize: '18px'}}>Consistency</div><div className="dash-label">{timeRange} Attendance</div></div>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: pctColor}}>{pct}%</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px'}}>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)'}}><CheckCircle2 size={16} color="var(--accent)"/> {totalDaysAttended} Present</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2)'}}><XCircle size={16} color="var(--red)"/> {missedDays} Absent</div>
                  </div>
                  {timeRange !== 'Today' && (
                    <div style={{width: '90px', height: '90px'}}>
                      <PieChart width={90} height={90}>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={45} stroke="none" cornerRadius={10} paddingAngle={5}>
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', position: 'relative'}}>
                <div className="dash-glow" style={{background: 'var(--orange)', opacity: 0.05, top: 0, right: 0}}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div><div className="dash-val" style={{fontSize: '18px', color: 'var(--orange)'}}>Workout Time</div><div className="dash-label">{timeRange} Timing Trend</div></div>
                  <div style={{textAlign:'right'}}><div className="dash-val" style={{fontSize:'18px', color: 'var(--orange)'}}>{formatTime(totalDaysAttended > 0 ? Math.round(totalMinutesSpent / totalDaysAttended) : 0)}</div><div className="dash-label">Avg Session</div></div>
                </div>
                {timeRange !== 'Today' ? (
                  <div ref={chartAreaRef} style={{width: '100%', height: '100px', marginTop: '16px'}}>
                    <AreaChart width={chartWidth} height={100} data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--orange)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--orange)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Time" stroke="var(--orange)" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" activeDot={{r: 6, fill: 'var(--orange)', stroke: '#000', strokeWidth: 2}} />
                    </AreaChart>
                  </div>
                ) : (
                  <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--orange)', marginTop:'24px', textAlign:'center'}}>{formatTime(totalMinutesSpent)}</div>
                )}
              </div>
            </div>
 
            {timeRange !== 'Today' && (
              <>
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block'}}>
                  <div className="dash-val" style={{fontSize: '18px'}}>Progressive Overload</div>
                  <div className="dash-label">{timeRange} Volume Trend</div>
                  <div style={{width: '100%', height: '220px', marginTop:'20px'}}>
                    <BarChart width={chartWidth} height={220} data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--border2)', opacity: 0.4}} />
                      <Bar dataKey="Volume" fill="var(--accent)" radius={[8, 8, 8, 8]} maxBarSize={timeRange === 'Monthly' ? 8 : 30} />
                    </BarChart>
                  </div>
                </div>
 
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block'}}>
                  <div className="dash-val" style={{fontSize: '18px', color: 'var(--blue)'}}>Nutrition Tracking</div>
                  <div className="dash-label">{timeRange} Protein Intake (g)</div>
                  <div style={{width: '100%', height: '180px', marginTop: '20px'}}>
                    <AreaChart width={chartWidth} height={180} data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
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
                  </div>
                </div>

                {/* Muscle Focus and Bodyweight Trend removed as requested */}
              </>
            )}

            {timeRange === 'Today' && (
              <>
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block', borderColor: 'var(--accent)'}}>
                  <div className="dash-glow accent" style={{opacity: 0.1}}></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div><div className="dash-val" style={{fontSize: '18px'}}>Workout Progress</div><div className="dash-label">Completed Exercises</div></div>
                    <div style={{textAlign:'right'}}><div className="dash-val" style={{fontSize:'24px', color:'var(--accent)'}}>{todayDoneExercises} <span style={{fontSize:'16px', color:'var(--text2)'}}>/ {todayTotalExercises}</span></div></div>
                  </div>
                  <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden', marginTop: '16px'}}>
                    <div style={{width: `${todayTotalExercises > 0 ? Math.round((todayDoneExercises/todayTotalExercises)*100) : 0}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
                  </div>
                </div>
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block', borderColor: 'rgba(77,159,255,0.2)'}}>
                  <div className="dash-glow blue" style={{opacity: 0.1}}></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div><div className="dash-val" style={{fontSize: '18px', color: 'var(--blue)'}}>Protein Goal</div><div className="dash-label">Consumed Today</div></div>
                    <div style={{textAlign:'right'}}><div className="dash-val" style={{fontSize:'24px', color:'var(--blue)'}}>{totalProtein}g <span style={{fontSize:'16px', color:'var(--text2)'}}>/ 100g</span></div></div>
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
                {[
                  { label: '💧 Water Habit', color: 'var(--blue)', pct: pctWater },
                  { label: '😴 Sleep Habit', color: 'var(--accent)', pct: pctSleep },
                  { label: '🚫 No Junk Habit', color: 'var(--red)', pct: pctJunk },
                ].map(h => (
                  <div key={h.label}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                      <span>{h.label}</span><span style={{color:h.color,fontWeight:'bold'}}>{h.pct}%</span>
                    </div>
                    <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                      <div style={{width: `${h.pct}%`, height: '100%', background: h.color, transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{marginTop: '40px'}}>
            <div className="dash-val" style={{fontSize: '18px', marginBottom: '16px'}}>🏆 Hall of Fame</div>
            <div className="dash-card full" style={{background: 'linear-gradient(145deg, var(--bg3), var(--bg2))', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', display:'block'}}>
              <div className="dash-glow accent" style={{opacity: 0.15}}></div>
              <div className="dash-label" style={{marginBottom: '16px'}}>Top 3 All-Time Heaviest Lifts</div>
              <div className="pr-list" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {prEntries.length ? prEntries.map(([ek, v], idx) => {
                  const name = NAMES[Object.keys(NAMES).find(k => k.endsWith('_' + ek))] || (allExercises[ek] || ek);
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
          </div>

          <div style={{marginTop: '40px'}}>
            <div className="dash-val" style={{fontSize: '18px', marginBottom: '16px'}}>Workout History</div>
            <History DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} SCHEDULE={SCHEDULE} />
          </div>
          <div style={{height:'40px'}}></div>
        </div>
      )}
    </div>
  );
}
