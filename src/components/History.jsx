import React, { useState } from 'react';
import { MONTHS, DAYS_SHORT, DAYS_FULL, DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol } from '../data';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { loadMoodEnergyConfig, DEFAULT_MOOD_STAGES, DEFAULT_ENERGY_STAGES } from './settings/MoodEnergySettings';

function getStageIdx(value) {
  if (typeof value !== 'number') return 2; // middle default
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

function getMoodStage(value, config) {
  const stages = config?.mood || DEFAULT_MOOD_STAGES;
  const MOOD_EMOJI_MAP = { '😴': 0, '😐': 1, '🙂': 2, '🔥': 3, '💪': 4 };
  if (typeof value === 'string' && MOOD_EMOJI_MAP[value] !== undefined) {
    return stages[MOOD_EMOJI_MAP[value]];
  }
  const idx = getStageIdx(typeof value === 'number' ? value : 50);
  return stages[idx];
}

function getEnergyStage(value, config) {
  const stages = config?.energy || DEFAULT_ENERGY_STAGES;
  if (typeof value === 'number' && value <= 5) {
    const idx = Math.max(0, Math.min(4, value - 1));
    return stages[idx];
  }
  const idx = getStageIdx(typeof value === 'number' ? value : 50);
  return stages[idx];
}

export default function History({ DB, NAMES, META, FOOD, SCHEDULE }) {
  const [modalDk, setModalDk] = useState(null);
  const [limit, setLimit] = useState(20);
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');

  const now = new Date();
  
  // Build key set: all days with data + all past Rest Days (last 90 days)
  const baseSet = new Set([...Object.keys(DB), ...Object.keys(META), ...Object.keys(FOOD)]);
  for (let i = 0; i < 90; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dk = dateKey(d);
    const dow = d.getDay();
    let planId = dow;
    if (SCHEDULE?.fullTime && SCHEDULE.fullTime[dow] !== undefined) planId = SCHEDULE.fullTime[dow];
    if (SCHEDULE?.thisWeek && SCHEDULE.thisWeek[dk] !== undefined) planId = SCHEDULE.thisWeek[dk];
    if (DEFAULT_PLAN[planId]?.muscles?.length === 0) baseSet.add(dk);
  }

  const allKeys = Array.from(baseSet)
    .filter(k => k <= dateKey(now))
    .filter(k => {
      if (historyStart || historyEnd) {
        if (historyStart && k < historyStart) return false;
        if (historyEnd && k > historyEnd) return false;
      }
      const d = new Date(k);
      const dow = d.getDay();
      let planId = dow;
      if (SCHEDULE?.fullTime && SCHEDULE.fullTime[dow] !== undefined) planId = SCHEDULE.fullTime[dow];
      if (SCHEDULE?.thisWeek && SCHEDULE.thisWeek[k] !== undefined) planId = SCHEDULE.thisWeek[k];
      // Always include Rest Days
      if (DEFAULT_PLAN[planId]?.muscles?.length === 0) return true;
      // For workout days, only include if has data
      const vol = getDayVol(DB[k] || {});
      const m = META[k] || {};
      const f = FOOD[k] || {};
      let dayP = 0;
      if (f.items) Object.values(f.items).forEach(() => dayP += 1);
      return vol > 0 || m.status || f.water || f.sleep || f.junk || dayP > 0;
    })
    .sort().reverse();

  const visibleKeys = allKeys.slice(0, limit);
  const historyDataMap = {};

  visibleKeys.forEach(dk => {
    const [y, mStr, dStr] = dk.split('-');
    const yr = parseInt(y);
    const mo = parseInt(mStr) - 1;
    const d = parseInt(dStr);
    const dd = new Date(yr, mo, d);
    const dow = dd.getDay();
    
    let currentPlanId = dow;
    if (SCHEDULE?.fullTime && SCHEDULE.fullTime[dow] !== undefined) currentPlanId = SCHEDULE.fullTime[dow];
    if (SCHEDULE?.thisWeek && SCHEDULE.thisWeek[dk] !== undefined) currentPlanId = SCHEDULE.thisWeek[dk];

    const plan = DEFAULT_PLAN[currentPlanId] || DEFAULT_PLAN[0];
    const isRestDay = plan.muscles.length === 0;
    const entry = DB[dk] || {};
    const hasAbs = Object.keys(entry).some(k => k.startsWith('Abs_'));
    const hasProgressive = Object.keys(entry).some(k => k.startsWith('Progressive_'));
    const hasFullBody = Object.keys(entry).some(k => k.startsWith('FullBodyMuscle_'));
    const planLabel = hasFullBody
      ? ('Full Body 💪' + (hasAbs ? ' & Abs' : '') + (hasProgressive ? ' & Progressive' : ''))
      : (plan.label + (hasAbs ? ' & Abs' : '') + (hasProgressive ? ' & Progressive' : ''));
    
    const vol = getDayVol(entry);
    const isToday = dk === dateKey(now);
    const meta = META[dk] || {};
    
    const savedF = FOOD[dk] || { items: {} };
    let dayP = 0;
    const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
    dietPlan.forEach(meal => meal.items.forEach(i => {
      const valRaw = savedF.items && savedF.items[i.id];
      let val = 0;
      if (valRaw === true) val = 3;
      else if (valRaw === false || valRaw === undefined) val = 0;
      else val = Number(valRaw);
      if (val > 0) {
        dayP += (i.p * (val / 3));
      }
    }));
    dayP = Math.round(dayP * 100) / 100;
    
    const monthKey = `${yr}-${mo}`;
    if (!historyDataMap[monthKey]) {
      historyDataMap[monthKey] = { yr, mo, days: [] };
    }
    historyDataMap[monthKey].days.push({
      dk, d, dow, planLabel, vol, isToday, meta, dayP, isRestDay,
      hasData: vol > 0 || meta.status || dayP > 0 || savedF.water || savedF.sleep || savedF.junk
    });
  });

  const historyData = Object.values(historyDataMap).sort((a, b) => (b.yr - a.yr) || (b.mo - a.mo));

  const moodEnergyConfig = loadMoodEnergyConfig();

  const renderModal = () => {
    if(!modalDk) return null;
    const [y, m, day] = modalDk.split('-');
    const d = new Date(y, m - 1, day);
    const dow = d.getDay();
    
    let currentPlanId = dow;
    if (SCHEDULE?.fullTime && SCHEDULE.fullTime[dow] !== undefined) currentPlanId = SCHEDULE.fullTime[dow];
    if (SCHEDULE?.thisWeek && SCHEDULE.thisWeek[modalDk] !== undefined) currentPlanId = SCHEDULE.thisWeek[modalDk];

    const basePlan = DEFAULT_PLAN[currentPlanId] || DEFAULT_PLAN[0];
    const plan = { ...basePlan, muscles: [...basePlan.muscles] };
    const entry = DB[modalDk] || {};
    const meta = META[modalDk] || {};
    const vol = getDayVol(entry);

    const hasFullBody = Object.keys(entry).some(k => k.startsWith('FullBodyMuscle_'));

    // Override plan display for Full Body days
    if (hasFullBody) {
      plan.label = 'Full Body 💪';
      plan.muscles = [
        {name:'Chest',exercises:['Barbell Bench Press','Cable Chest Fly']},
        {name:'Back',exercises:['Lat Pulldown','Bent Over Barbell Row']},
        {name:'Legs',exercises:['Barbell Squat','Leg Press']},
        {name:'Shoulders',exercises:['Overhead Press','Dumbbell Lateral Raise']},
        {name:'Biceps',exercises:['Barbell Curl','Hammer Curl']},
        {name:'Triceps',exercises:['Tricep Pushdown','Diamond Push-ups']}
      ];
      // Remap exercise keys to FullBodyMuscle_ prefix for lookup
      plan.muscles.forEach(m => {
        m._prefix = 'FullBodyMuscle_';
      });
    }

    const hasAbs = Object.keys(entry).some(k => k.startsWith('Abs_'));
    if (hasAbs) {
      plan.muscles.push({ name: 'Abs', exercises: ['Crunches', 'Leg Raises', 'Plank'] });
    }
    const hasProgressive = Object.keys(entry).some(k => k.startsWith('Progressive_'));
    if (hasProgressive) {
      plan.muscles.push({ name: 'Progressive', exercises: ['Back Squat (Heavy)', 'Deadlift (Heavy)', 'Overhead Press (Heavy)', 'Weighted Pull-ups', 'Barbell Row (Heavy)'] });
    }
    
    const savedF = FOOD[modalDk] || { items: {} };
    let dayP = 0;
    const foodHtmlRows = [];
    const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
    dietPlan.forEach(m => m.items.forEach(i => {
      const valRaw = savedF.items && savedF.items[i.id];
      let val = 0;
      if (valRaw === true) val = 3;
      else if (valRaw === false || valRaw === undefined) val = 0;
      else val = Number(valRaw);
      if (val > 0) {
        const portionP = Math.round((i.p * (val / 3)) * 100) / 100;
        dayP += portionP;
        const customName = (savedF.custom && savedF.custom[i.id]) ? savedF.custom[i.id] : i.name;
        foodHtmlRows.push(<tr key={i.id}><td>{customName}</td><td style={{textAlign:'right',color:'var(--accent)'}}>{portionP}g</td></tr>);
      }
    }));
    dayP = Math.round(dayP * 100) / 100;
    const hasFood = dayP > 0 || savedF.water || savedF.sleep || savedF.junk;

    return (
      <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setModalDk(null); }}>
        <div className="modal" style={{position:'relative'}}>
          <button className="modal-close" onClick={() => setModalDk(null)}>×</button>
          
          <div className="modal-title">{DAYS_FULL[dow]}, {formatFull(d)}</div>
          <div className="modal-sub">{plan.label}{hasAbs ? ' & Abs' : ''}{hasProgressive ? ' & Progressive' : ''} · {vol ? vol.toLocaleString()+' kg total' : 'No volume logged'}</div>
          
          <div style={{ flex: '1 1 auto', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', marginTop: '12px', WebkitOverflowScrolling: 'touch' }}>
            {(meta.notes || meta.bw || meta.start || (!isRestDay && (meta.status === 'Skipped' || meta.mood !== undefined || meta.energy !== undefined))) && (
              <div style={{background:'var(--bg3)',padding:'14px',borderRadius:'12px',marginBottom:'16px',fontSize:'12px',color:'var(--text2)', display:'flex', flexDirection:'column', gap:'8px'}}>
                {meta.start && <div>⏱️ Time: {meta.start} - {meta.end||'?'}</div>}
                {meta.bw && <div>⚖️ Bodyweight: {meta.bw} kg</div>}
                {!isRestDay && (meta.status === 'Skipped' || meta.mood !== undefined) && (() => {
                  const moodVal = meta.status === 'Skipped' ? 0 : meta.mood;
                  const stage = getMoodStage(moodVal, moodEnergyConfig);
                  const lvl = meta.status === 'Skipped' ? 1 : getStageIdx(moodVal) + 1;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text3)' }}>Mood:</span>
                      <img 
                        src={stage.img} 
                        alt="" 
                        style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${stage.color}` }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <span style={{ color: stage.color }}>{stage.label} <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 300 }}>({lvl}/5)</span></span>
                    </div>
                  );
                })()}
                {!isRestDay && (meta.status === 'Skipped' || meta.energy !== undefined) && (() => {
                  const energyVal = meta.status === 'Skipped' ? 0 : meta.energy;
                  const stage = getEnergyStage(energyVal, moodEnergyConfig);
                  const lvl = meta.status === 'Skipped' ? 1 : getStageIdx(energyVal) + 1;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text3)' }}>Energy:</span>
                      <img 
                        src={stage.img} 
                        alt="" 
                        style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${stage.color}` }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <span style={{ color: stage.color }}>{stage.label} <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 300 }}>({lvl}/5)</span></span>
                    </div>
                  );
                })()}
                {meta.notes && <div style={{marginTop:'6px',color:'var(--text)', borderTop:'1px solid var(--border2)', paddingTop:'8px', fontStyle:'italic'}}>"{meta.notes}"</div>}
              </div>
            )}

            {!Object.keys(entry).length && !hasFood ? (
              <div style={{color:'var(--text2)',fontSize:'13px',textAlign:'center',padding:'20px 0'}}>No data logged for this day.</div>
            ) : (
              <>
                {plan.muscles.map(m => {
                  const rows = m.exercises.map((ex, i) => {
                    const ek = `${m._prefix || ''}${m.name}_${i}`;
                    const sv = entry[ek] || {};
                    const isDone = sv.done;
                    const hasVol = sv.s && sv.r && sv.w;
                    if(!hasVol && isDone === undefined) return null;
                    
                    const v = hasVol ? Math.round(sv.s * sv.r * sv.w) : '—';
                    const nameStr = NAMES[`${currentPlanId}_${m.name}_${i}`] || ex;
                    const isTimeBased = nameStr.toLowerCase().includes('plank') || nameStr.toLowerCase().includes('hold') || nameStr.toLowerCase().includes('cardio');
                    
                    return (
                      <tr key={ek}>
                        <td>
                          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                            {isDone === true ? <CheckCircle2 size={14} color="var(--accent)" /> : (isDone === false ? <XCircle size={14} color="var(--red)" /> : null)}
                            <span style={{textDecoration: isDone === false ? 'line-through' : 'none', color: isDone === false ? 'var(--text3)' : 'var(--text)'}}>{nameStr}</span>
                          </div>
                        </td>
                        <td>{sv.s || '—'}</td><td>{sv.r ? (sv.r + (isTimeBased ? 's' : '')) : '—'}</td><td>{sv.w || '—'}</td>
                        <td style={{color:'var(--accent)'}}>{v !== '—' ? v+'kg' : '—'}</td>
                      </tr>
                    );
                  }).filter(Boolean);

                  if(!rows.length) return null;
                  return (
                    <div key={m.name}>
                      <div className="mini-section">{m.name}</div>
                      <table className="mini-table">
                        <thead><tr><th>Exercise</th><th>Sets</th><th>Reps/Secs</th><th>Kg/Lvl</th><th>Vol</th></tr></thead>
                        <tbody>{rows}</tbody>
                      </table>
                    </div>
                  );
                })}

                {hasFood && (
                  <>
                    <div className="mini-section" style={{color:'var(--blue)',marginTop:'20px'}}>Diet & Habits</div>
                    {foodHtmlRows.length > 0 && (
                      <table className="mini-table">
                        <thead><tr><th>Food Logged</th><th style={{textAlign:'right'}}>Protein</th></tr></thead>
                        <tbody>
                          {foodHtmlRows}
                          <tr><td style={{fontWeight:'bold',color:'var(--text)'}}>Total</td><td style={{textAlign:'right',fontWeight:'bold',color:'var(--accent)'}}>{dayP}g</td></tr>
                        </tbody>
                      </table>
                    )}
                    <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
                      {savedF.water && <div style={{display:'flex', alignItems:'center', gap:'4px', background:'rgba(77,159,255,0.1)', color:'var(--blue)', padding:'4px 8px', borderRadius:'8px', fontSize:'11px'}}><CheckCircle2 size={12}/> 3-4L Water</div>}
                      {savedF.sleep && <div style={{display:'flex', alignItems:'center', gap:'4px', background:'rgba(200,241,53,0.1)', color:'var(--accent)', padding:'4px 8px', borderRadius:'8px', fontSize:'11px'}}><CheckCircle2 size={12}/> 7-8h Sleep</div>}
                      {savedF.junk && <div style={{display:'flex', alignItems:'center', gap:'4px', background:'rgba(255,77,77,0.1)', color:'var(--red)', padding:'4px 8px', borderRadius:'8px', fontSize:'11px'}}><CheckCircle2 size={12}/> No Junk</div>}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="history-content" style={{padding:'10px 0'}}>

      <div style={{ padding: '0 10px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg3)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border2)' }}>
          <Calendar size={14} color="var(--text3)" />
          <input type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '12px', outline: 'none', flex: 1 }} />
          <span style={{ color: 'var(--text3)', fontSize: '11px' }}>to</span>
          <input type="date" value={historyEnd} onChange={e => setHistoryEnd(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '12px', outline: 'none', flex: 1 }} />
        </div>
      </div>
      {historyData.map(month => (
        <div key={`${month.yr}-${month.mo}`}>
          <div className="month-label" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, marginBottom: '16px' }}>{MONTHS[month.mo]} {month.yr}</div>
          {month.days.map(day => (
            <div key={day.dk}
              className={`history-day ${day.hasData ? 'has-data' : ''}`}
              onClick={() => setModalDk(day.dk)}
              style={{
                padding: '20px', marginBottom: '16px', borderRadius: '20px',
                opacity: (day.isRestDay && !day.hasData) ? 0.6 : 1,
                border: (day.isRestDay && !day.hasData) ? '1px solid rgba(255,255,255,0.06)' : undefined
              }}
            >
              <div className="hday-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div className="hday-date" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '6px', 
                  fontSize: '16px', 
                  fontWeight: 800,
                  flex: 1,
                  minWidth: '200px'
                }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {day.isToday ? 'Today — ' : ''}{DAYS_SHORT[day.dow]}, {day.d} {MONTHS[month.mo].slice(0,3)}
                  </span>
                  {/* Rest Day badge */}
                  {day.isRestDay ? (
                    <span className="hday-status" style={{
                      fontSize: '11px',
                      color: '#A78BFA',
                      background: 'rgba(167, 139, 250, 0.12)',
                      border: '1px solid rgba(167, 139, 250, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '18px',
                      padding: '0 8px',
                      borderRadius: '99px',
                      fontWeight: 400
                    }}>
                      😴 Rest Day
                    </span>
                  ) : (
                    <>
                      {day.meta.status && (
                        <span className="hday-status" style={{ 
                          fontSize: '11px', 
                          color: day.meta.status === 'Skipped' ? 'var(--red)' : 'var(--accent)',
                          background: day.meta.status === 'Skipped' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(200, 241, 53, 0.1)',
                          border: day.meta.status === 'Skipped' ? '1px solid rgba(255, 77, 77, 0.2)' : '1px solid rgba(200, 241, 53, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '18px',
                          padding: '0 8px',
                          borderRadius: '99px',
                          fontWeight: 400
                        }}>
                          {day.meta.status}
                        </span>
                      )}
                      {(day.meta.status === 'Skipped' || day.meta.mood !== undefined) && (() => {
                        const moodVal = day.meta.status === 'Skipped' ? 0 : day.meta.mood;
                        const stage = getMoodStage(moodVal, moodEnergyConfig);
                        const lvl = day.meta.status === 'Skipped' ? 1 : getStageIdx(moodVal) + 1;
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 400 }} title={`${stage.label} (${lvl}/5)`}>
                            <img 
                              src={stage.img} 
                              alt="" 
                              style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${stage.color}`, display: 'block' }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                            <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>{lvl}/5</span>
                          </span>
                        );
                      })()}
                      {(day.meta.status === 'Skipped' || day.meta.energy !== undefined) && (() => {
                        const energyVal = day.meta.status === 'Skipped' ? 0 : day.meta.energy;
                        const stage = getEnergyStage(energyVal, moodEnergyConfig);
                        const lvl = day.meta.status === 'Skipped' ? 1 : getStageIdx(energyVal) + 1;
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 400 }} title={`${stage.label} (${lvl}/5)`}>
                            <img 
                              src={stage.img} 
                              alt="" 
                              style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${stage.color}`, display: 'block' }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                            <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 400 }}>{lvl}/5</span>
                          </span>
                        );
                      })()}
                    </>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {day.vol > 0 && <div className="hday-vol" style={{ fontSize: '18px', fontWeight: 900 }}>{day.vol.toLocaleString()} <span style={{fontSize:'12px', fontWeight: 400}}>kg</span></div>}
                  {day.dayP > 0 && <div className="hday-vol" style={{color:'var(--text)', fontSize:'13px', fontWeight: 700, marginTop:'4px'}}>{day.dayP}g <span style={{fontSize:'10px', fontWeight: 400}}>Protein</span></div>}
                </div>
              </div>
              {/* Plan label — show Rest Day text, hide only if it's a non-rest day label */}
              {day.isRestDay
                ? <div className="hday-focus" style={{ fontSize: '13px', fontWeight: 600, color: '#A78BFA' }}>🛌 Recovery &amp; Rest</div>
                : <div className="hday-focus" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>{day.planLabel}</div>
              }
              {!day.hasData && !day.isRestDay && <div className="hday-empty" style={{ fontSize: '13px' }}>No data logged</div>}
            </div>
          ))}
        </div>
      ))}
      {limit < allKeys.length && (
        <button 
          onClick={() => setLimit(l => l + 20)}
          style={{width: '100%', padding: '14px', marginTop: '12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '0.2s'}}
        >
          Load More
        </button>
      )}
      {renderModal()}
      <div style={{height:'20px'}}></div>
    </div>
  );
}
