import React, { useState } from 'react';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol, DAYS_SHORT, MONTHS } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

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
  
  const chartData = [];
  const monthlyDataMap = {}; // For Yearly aggregation
  
  for(let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dateKey(d);
    
    totalPossibleDays++;
    
    const entry = DB[k] || {};
    const vol = getDayVol(entry);
    const m = META[k] || {};
    let attended = false;
    
    if(vol > 0 || m.status === 'Completed' || m.status === 'Partial') {
      totalDaysAttended++;
      attended = true;
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
      <div className="ai-dash-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
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
        <div className="dash-card">
          <div className="dash-glow"></div>
          <div className="dash-icon">🏋️</div>
          <div>
            <div className="dash-val accent">{Math.round(totalVol).toLocaleString()} <span style={{fontSize:'14px'}}>kg</span></div>
            <div className="dash-label">Volume ({timeRange})</div>
          </div>
        </div>
        
        <div className="dash-card">
          <div className="dash-glow blue"></div>
          <div className="dash-icon">🔥</div>
          <div>
            <div className="dash-val">{totalDaysAttended} <span style={{fontSize:'14px', color:'var(--text2)'}}>/ {totalPossibleDays}</span></div>
            <div className="dash-label">Days Trained</div>
          </div>
        </div>

        {/* ATTENDANCE DONUT CHART */}
        <div className="dash-card full" style={{background: 'var(--bg3)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <div className="dash-val" style={{fontSize: '18px'}}>Consistency</div>
            <div className="dash-label">{timeRange} Attendance</div>
            <div style={{marginTop: '8px', fontSize: '24px', fontWeight: 'bold', color: pctColor}}>
              {pct}%
            </div>
          </div>
          <div style={{width: '100px', height: '100px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={50} stroke="none" cornerRadius={10} paddingAngle={5}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

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
