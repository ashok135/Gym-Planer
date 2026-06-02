import React, { useMemo, useRef, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';
import { MONTHS, DAYS_SHORT } from '../../data';
import { dateKey, monthKey, renderSubjectIcon } from './utils/studyMath';

export const StudyAnalytics = ({
  STUDY,
  activeRange,
  setActiveRange,
  selectedMonth,
  setSelectedMonth,
  subjects,
  dailyTarget,
  isReport
}) => {
  const now = new Date();
  const todayKey = dateKey(now);

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getRangeStats = (range) => {
    let hrs = 0, count = 0;
    Object.entries(STUDY).forEach(([dk, dayData]) => {
      const d = new Date(dk);
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      const mk = monthKey(d);
      const [selY, selM] = selectedMonth.split('-').map(Number);
      
      if (range === 'Today' && dk !== todayKey) return;
      if (range === 'Weekly' && diff > 7) return;
      if (range === 'Monthly' && mk !== selectedMonth) return;
      if (range === 'Yearly' && d.getFullYear() !== selY) return;
      
      const sessions = dayData.sessions || [];
      hrs += sessions.reduce((s, e) => s + Number(e.hours), 0);
      count += sessions.length;
    });
    return { hrs, count };
  };

  const stats = getRangeStats(activeRange);
  const rangeHours = stats.hrs;
  const rangeSessions = stats.count;
  
  const targetHrs = activeRange === 'Today' ? dailyTarget : (activeRange === 'Weekly' ? dailyTarget * 7 : (activeRange === 'Monthly' ? dailyTarget * 30 : dailyTarget * 365));
  const progressPct = Math.min(100, Math.round((rangeHours / targetHrs) * 100));

  const subjectHours = {};
  subjects.forEach(s => { subjectHours[s.id] = 0; });
  
  Object.entries(STUDY).forEach(([dk, dayData]) => {
    const d = new Date(dk);
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    const mk = monthKey(d);
    
    let include = false;
    if (activeRange === 'Today' && dk === todayKey) include = true;
    if (activeRange === 'Weekly' && diff <= 7) include = true;
    if (activeRange === 'Monthly' && mk === selectedMonth) include = true;
    if (activeRange === 'Yearly' && d.getFullYear() === now.getFullYear()) include = true;

    if (include) {
      (dayData.sessions || []).forEach(s => {
        subjectHours[s.subjectId] = (subjectHours[s.subjectId] || 0) + Number(s.hours);
      });
    }
  });

  const statusColor = progressPct >= 100 ? 'var(--accent)' : progressPct >= 50 ? 'var(--orange)' : 'var(--blue)';

  // Activity Heatmap
  const monthsData = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(now.getFullYear(), m, 1);
    const monthDays = [];
    const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dk = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hrs = ((STUDY[dk]?.sessions || []).reduce((s, e) => s + Number(e.hours), 0));
      monthDays.push({ dk, hrs });
    }
    monthsData.push({ name: MONTHS[m].slice(0, 3), days: monthDays });
  }

  // Analytics Chart Data
  const chartData = [];
  if (isReport) {
    const rollingDays = activeRange === 'Today' ? 1 : activeRange === 'Weekly' ? 7 : activeRange === 'Monthly' ? 30 : 365;
    for (let i = rollingDays - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const dk = dateKey(d);
      const dayStats = STUDY[dk] || { sessions: [] };
      const totalHrs = (dayStats.sessions || []).reduce((s, e) => s + Number(e.hours), 0);
      chartData.push({
        name: activeRange === 'Weekly' ? DAYS_SHORT[d.getDay()] : `${d.getDate()}/${d.getMonth()+1}`,
        hours: totalHrs,
        date: dk
      });
    }
  }

  const maxHrs = chartData.length > 0 ? Math.max(...chartData.map(d => d.hours), 0) : 0;
  const yAxisMax = Math.max(dailyTarget, maxHrs, 1);

  const chartMargin = useMemo(() => ({ top: 5, right: 0, left: -25, bottom: 0 }), []);
  const axisTick = useMemo(() => ({ fontSize: 10, fill: 'var(--text2)' }), []);
  const yAxisDomain = useMemo(() => [0, yAxisMax], [yAxisMax]);
  const tooltipStyle = useMemo(() => ({ background: '#111', border: '1px solid var(--border2)', borderRadius: '8px', fontSize: '12px' }), []);
  const refLineLabel = useMemo(() => ({ position: 'right', value: 'GOAL', fill: 'var(--accent)', fontSize: 8 }), []);

  const chartContainerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && Math.abs(w - chartWidth) > 2) setChartWidth(Math.floor(w));
    });
    observer.observe(chartContainerRef.current);
    setChartWidth(Math.floor(chartContainerRef.current.getBoundingClientRect().width) || 300);
    return () => observer.disconnect();
  }, [chartWidth]);

  const pieData = subjects.map(s => ({
    name: s.label,
    value: subjectHours[s.id] || 0,
    color: s.color
  })).filter(d => d.value > 0);

  return (
    <>
      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }} className="hide-scroll">
          {(() => {
            const months = [];
            for (let i = 0; i < 6; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const mk = monthKey(d);
              months.push({ mk, label: `${MONTHS[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}` });
            }
            return months.map(m => (
              <div key={m.mk} onClick={() => { setSelectedMonth(m.mk); setActiveRange('Monthly'); }}
                style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer',
                  background: selectedMonth === m.mk ? 'var(--accent)' : 'var(--bg3)',
                  color: selectedMonth === m.mk ? '#000' : 'var(--text3)',
                  border: '1px solid var(--border2)', fontWeight: selectedMonth === m.mk ? 700 : 400 }}>
                {m.label}
              </div>
            ));
          })()}
        </div>
      </div>

      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '20px', padding: '4px', width: 'fit-content' }}>
          {['Today', 'Weekly', 'Monthly', 'Yearly'].map(tr => (
            <div key={tr} onClick={() => setActiveRange(tr)}
              style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '16px', cursor: 'pointer',
                background: activeRange === tr ? 'var(--accent)' : 'transparent',
                color: activeRange === tr ? '#000' : 'var(--text2)',
                fontWeight: activeRange === tr ? 'bold' : 'normal', transition: 'all 0.2s' }}>
              {tr}
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '0 20px 20px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '8px' }}>{activeRange} Progress</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: statusColor }}>{formatDuration(rangeHours)} <span style={{fontSize:'14px', color:'var(--text3)', fontWeight: 400}}>/ {targetHrs}h</span></div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{rangeSessions} total sessions • {progressPct}% complete</div>
          </div>
          <div style={{ width: '60px', height: '60px', position: 'relative' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={statusColor} strokeWidth="3"
                strokeDasharray={`${progressPct} 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: statusColor }}>{progressPct}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {subjects.map(sub => {
            const hrs = subjectHours[sub.id] || 0;
            const subPct = Math.min(100, Math.round((hrs / (targetHrs / subjects.length || 1)) * 100));
            return (
              <div key={sub.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{renderSubjectIcon(sub.id, sub.emoji, 14)} {sub.label}</span>
                  <span style={{ color: sub.color, fontWeight: 700 }}>{formatDuration(hrs)}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${subPct}%`, height: '100%', background: sub.color, borderRadius: '4px', transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ margin: '0 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>Activity Heatmap</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{now.getFullYear()} Calendar</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', background: 'var(--bg3)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border2)', overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scroll">
          {monthsData.map(m => (
            <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 'fit-content' }}>
              <div style={{ fontSize: '8px', color: 'var(--text3)', textAlign: 'center' }}>{m.name}</div>
              <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '2px' }}>
                {m.days.map(d => (
                  <div key={d.dk} style={{ 
                    width: '6px', height: '6px', borderRadius: '1px', 
                    background: d.hrs > 0 ? `rgba(200, 241, 53, ${Math.min(1, 0.2 + (d.hrs/dailyTarget))})` : 'rgba(255,255,255,0.05)',
                    border: d.dk === todayKey ? '1px solid var(--accent)' : 'none'
                  }} title={`${d.dk}: ${d.hrs}h`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isReport && (
        <div style={{ padding: '0 20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="dash-card full" style={{ background: 'var(--bg3)', padding: '20px', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChartIcon size={18} color="var(--blue)" />
              <div style={{ fontSize: '15px', fontWeight: 700 }}>Study Trend</div>
            </div>
            <div ref={chartContainerRef} style={{ width: '100%', height: '180px' }}>
              <AreaChart width={chartWidth} height={180} data={chartData} margin={chartMargin}>
                <defs>
                  <linearGradient id="colorHrs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis domain={yAxisDomain} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="hours" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorHrs)" isAnimationActive={false} />
                <ReferenceLine y={dailyTarget} label={refLineLabel} stroke="var(--accent)" strokeDasharray="3 3" />
              </AreaChart>
            </div>
          </div>
          <div className="dash-card full" style={{ background: 'var(--bg3)', padding: '20px', display: 'block' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Subject Mix</div>
            <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pieData.length > 0 ? (
                <>
                  <div style={{ width: '50%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PieChart width={140} height={180}>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                  <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '160px' }}>
                    {pieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                        <span style={{ fontSize: '10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{d.name}: {d.value.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>
                  📚 No subject mix logs yet.<br />Add a study session to see analytics!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
