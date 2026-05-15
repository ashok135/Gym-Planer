import React, { useState } from 'react';
import { MONTHS, DAYS_SHORT, DAYS_FULL, DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol } from '../data';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function History({ DB, NAMES, META, FOOD }) {
  const [modalDk, setModalDk] = useState(null);

  const [limit, setLimit] = useState(20);

  const now = new Date();
  
  const allKeys = Array.from(new Set([...Object.keys(DB), ...Object.keys(META), ...Object.keys(FOOD)]))
    .filter(k => k <= dateKey(now))
    .filter(k => {
      const vol = getDayVol(DB[k] || {});
      const m = META[k] || {};
      const f = FOOD[k] || {};
      let dayP = 0;
      if (f.items) {
        Object.values(f.items).forEach(val => dayP += 1); // just checking existence
      }
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
    const plan = DEFAULT_PLAN[dow] || DEFAULT_PLAN[0];
    const vol = getDayVol(DB[dk] || {});
    const isToday = dk === dateKey(now);
    const meta = META[dk] || {};
    
    const savedF = FOOD[dk] || { items: {} };
    let dayP = 0;
    const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
    dietPlan.forEach(meal => meal.items.forEach(i => {
      if(savedF.items && savedF.items[i.id]) dayP += i.p;
    }));
    
    const monthKey = `${yr}-${mo}`;
    if (!historyDataMap[monthKey]) {
      historyDataMap[monthKey] = { yr, mo, days: [] };
    }
    historyDataMap[monthKey].days.push({ d, dd, dk, dow, plan, vol, isToday, meta, dayP, hasData: true });
  });

  const historyData = Object.values(historyDataMap).sort((a, b) => (b.yr - a.yr) || (b.mo - a.mo));

  const renderModal = () => {
    if(!modalDk) return null;
    const [y, m, day] = modalDk.split('-');
    const d = new Date(y, m - 1, day);
    const dow = d.getDay();
    const plan = DEFAULT_PLAN[dow] || DEFAULT_PLAN[0];
    const entry = DB[modalDk] || {};
    const meta = META[modalDk] || {};
    const vol = getDayVol(entry);
    
    const savedF = FOOD[modalDk] || { items: {} };
    let dayP = 0;
    const foodHtmlRows = [];
    const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
    dietPlan.forEach(m => m.items.forEach(i => {
      if(savedF.items && savedF.items[i.id]) {
        dayP += i.p;
        const customName = (savedF.custom && savedF.custom[i.id]) ? savedF.custom[i.id] : i.name;
        foodHtmlRows.push(<tr key={i.id}><td>{customName}</td><td style={{textAlign:'right',color:'var(--accent)'}}>{i.p}g</td></tr>);
      }
    }));
    const hasFood = dayP > 0 || savedF.water || savedF.sleep || savedF.junk;

    return (
      <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setModalDk(null); }}>
        <div className="modal" style={{position:'relative'}}>
          <div className="modal-handle"></div>
          <button className="modal-close" onClick={() => setModalDk(null)}>×</button>
          
          <div className="modal-title">{DAYS_FULL[dow]}, {formatFull(d)}</div>
          <div className="modal-sub">{plan.label} · {vol ? vol.toLocaleString()+' kg total' : 'No volume logged'}</div>
          
          {(meta.notes || meta.bw || meta.start) && (
            <div style={{background:'var(--bg3)',padding:'12px',borderRadius:'8px',marginBottom:'16px',fontSize:'12px',color:'var(--text2)'}}>
              {meta.start && <div>⏱️ Time: {meta.start} - {meta.end||'?'}</div>}
              {meta.bw && <div>⚖️ Bodyweight: {meta.bw} kg</div>}
              {meta.energy > 0 && <div>⚡ Energy: {meta.energy}/5</div>}
              {meta.notes && <div style={{marginTop:'6px',color:'var(--text)'}}>"{meta.notes}"</div>}
            </div>
          )}

          {!Object.keys(entry).length && !hasFood ? (
            <div style={{color:'var(--text2)',fontSize:'13px',textAlign:'center',padding:'20px 0'}}>No data logged for this day.</div>
          ) : (
            <>
              {plan.muscles.map(m => {
                const rows = m.exercises.map((ex, i) => {
                  const ek = `${m.name}_${i}`;
                  const sv = entry[ek] || {};
                  const isDone = sv.done;
                  const hasVol = sv.s && sv.r && sv.w;
                  if(!hasVol && isDone === undefined) return null;
                  
                  const v = hasVol ? Math.round(sv.s * sv.r * sv.w) : '—';
                  const nameStr = NAMES[`${dow}_${m.name}_${i}`] || ex;
                  
                  return (
                    <tr key={ek}>
                      <td>
                        <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                          {isDone === true ? <CheckCircle2 size={14} color="var(--accent)" /> : (isDone === false ? <XCircle size={14} color="var(--red)" /> : null)}
                          <span style={{textDecoration: isDone === false ? 'line-through' : 'none', color: isDone === false ? 'var(--text3)' : 'var(--text)'}}>{nameStr}</span>
                        </div>
                      </td>
                      <td>{sv.s || '—'}</td><td>{sv.r || '—'}</td><td>{sv.w || '—'}</td>
                      <td style={{color:'var(--accent)'}}>{v !== '—' ? v+'kg' : '—'}</td>
                    </tr>
                  );
                }).filter(Boolean);

                if(!rows.length) return null;
                return (
                  <div key={m.name}>
                    <div className="mini-section">{m.name}</div>
                    <table className="mini-table">
                      <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Kg</th><th>Vol</th></tr></thead>
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
    );
  };

  return (
    <div id="history-content" style={{padding:'20px 0'}}>
      {historyData.map(month => (
        <div key={`${month.yr}-${month.mo}`}>
          <div className="month-label">{MONTHS[month.mo]} {month.yr}</div>
          {month.days.map(day => (
            <div key={day.dk} className={`history-day ${day.hasData ? 'has-data' : ''}`} onClick={() => setModalDk(day.dk)}>
              <div className="hday-top">
                <div className="hday-date">
                  {day.isToday ? 'Today — ' : ''}{DAYS_SHORT[day.dow]}, {day.d} {MONTHS[month.mo].slice(0,3)}
                  {day.meta.status && day.meta.status !== 'Skipped' && <span className="hday-status">{day.meta.status} {day.meta.mood||''}</span>}
                </div>
                <div style={{textAlign:'right'}}>
                  {day.vol > 0 && <div className="hday-vol">{day.vol.toLocaleString()} kg</div>}
                  {day.dayP > 0 && <div className="hday-vol" style={{color:'var(--text)',fontSize:'11px',marginTop:'2px'}}>{day.dayP}g Protein</div>}
                </div>
              </div>
              {day.plan.label !== 'Rest Day' && <div className="hday-focus">{day.plan.label}</div>}
              {!day.hasData && <div className="hday-empty">No data logged</div>}
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
