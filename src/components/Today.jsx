import React, { useState } from 'react';
import { DEFAULT_PLAN, dateKey, DAYS_SHORT, DAYS_FULL, MONTHS } from '../data';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Today({ DB, NAMES, META, syncData, FOOD, SCHEDULE }) {
  const today = new Date();
  const dow = today.getDay();
  const key = dateKey(today);
  
  const saved = DB[key] || {};
  const meta = META[key] || { mood: '', energy: 0, status: 'Completed', bw: '', start: '06:30', end: '08:10', notes: '' };
  const isSkipped = meta.status === 'Skipped';
  
  let currentPlanId = dow;
  if (SCHEDULE?.fullTime && SCHEDULE.fullTime[dow] !== undefined) currentPlanId = SCHEDULE.fullTime[dow];
  if (SCHEDULE?.thisWeek && SCHEDULE.thisWeek[key] !== undefined) currentPlanId = SCHEDULE.thisWeek[key];

  // Create deep copy of plan
  const plan = JSON.parse(JSON.stringify(DEFAULT_PLAN[currentPlanId] || DEFAULT_PLAN[0]));
  plan.muscles.push({
    name: 'Abs',
    exercises: ['Crunches', 'Leg Raises', 'Plank']
  });
  plan.muscles.push({
    name: 'Progressive',
    exercises: ['Back Squat (Heavy)', 'Deadlift (Heavy)', 'Overhead Press (Heavy)', 'Weighted Pull-ups', 'Barbell Row (Heavy)']
  });

  plan.muscles.forEach(m => {
    m.exercises = m.exercises.map((ex, i) => {
      const k = `${currentPlanId}_${m.name}_${i}`;
      const ek = `${m.name}_${i}`;
      return (saved[ek] && saved[ek].customName) ? saved[ek].customName : (NAMES[k] || ex);
    });
  });

  const [renameBox, setRenameBox] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [saveMsg, setSaveMsg] = useState(false);
  const [showAbs, setShowAbs] = useState(() => {
    return meta.absEnabled || Object.keys(saved).some(k => k.startsWith('Abs_'));
  });
  const [showProgressive, setShowProgressive] = useState(() => {
    return meta.progressiveEnabled || Object.keys(saved).some(k => k.startsWith('Progressive_'));
  });

  const activeMuscles = plan.muscles.filter(m => {
    if (m.name === 'Abs') return showAbs;
    if (m.name === 'Progressive') return showProgressive;
    return true;
  });

  const addAbs = () => {
    setShowAbs(true);
    handleMetaChange('absEnabled', true);
  };

  const addProgressive = () => {
    setShowProgressive(true);
    handleMetaChange('progressiveEnabled', true);
  };

  const removeAbs = () => {
    setShowAbs(false);
    handleMetaChange('absEnabled', false);
    const newDB = { ...DB };
    if (newDB[key]) {
      Object.keys(newDB[key]).forEach(k => {
        if (k.startsWith('Abs_')) delete newDB[key][k];
      });
    }
    syncData(newDB, NAMES, META, FOOD, SCHEDULE);
  };

  const removeProgressive = () => {
    setShowProgressive(false);
    handleMetaChange('progressiveEnabled', false);
    const newDB = { ...DB };
    if (newDB[key]) {
      Object.keys(newDB[key]).forEach(k => {
        if (k.startsWith('Progressive_')) delete newDB[key][k];
      });
    }
    syncData(newDB, NAMES, META, FOOD, SCHEDULE);
  };

  const getPrevStats = (ek) => {
    const keys = Object.keys(DB).filter(k => k < key && DB[k][ek] && DB[k][ek].w).sort();
    if(keys.length === 0) return null;
    return DB[keys[keys.length - 1]][ek];
  };

  const toggleRename = (ek, currentName) => {
    if(renameBox === ek) setRenameBox(null);
    else {
      setRenameBox(ek);
      setRenameInput(currentName);
    }
  };

  const saveRename = (ek) => {
    if(!renameInput.trim()) return;
    const newDB = { ...DB };
    if(!newDB[key]) newDB[key] = {};
    if(!newDB[key][ek]) newDB[key][ek] = {};
    newDB[key][ek].customName = renameInput.trim();
    syncData(newDB, NAMES, META, FOOD);
    setRenameBox(null);
  };

  const handleInputChange = (ek, field, value) => {
    const newDB = { ...DB };
    if(!newDB[key]) newDB[key] = {};
    if(!newDB[key][ek]) newDB[key][ek] = {};
    if(field === 'done') {
      newDB[key][ek][field] = value;
    } else {
      newDB[key][ek][field] = parseFloat(value) || 0;
      if (newDB[key][ek].done === undefined || newDB[key][ek].done === null) {
        newDB[key][ek].done = true;
      }
    }
    syncData(newDB, NAMES, META, FOOD, SCHEDULE);
  };

  const handleMetaChange = (field, value) => {
    const newMeta = { ...META };
    if(!newMeta[key]) newMeta[key] = { ...meta };
    newMeta[key][field] = value;
    if (field === 'status' && value === 'Skipped') {
      newMeta[key].start = '';
      newMeta[key].end = '';
    }
    syncData(DB, NAMES, newMeta, FOOD);
  };

  const saveToday = () => {
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  };

  if(!plan.muscles.length) {
    return (
      <div id="today-content">
        <div className="rest-card">
          <div className="rest-icon">🛌</div>
          <div className="rest-title">Rest day</div>
          <div className="rest-sub">Recovery is part of the process. Come back tomorrow.</div>
        </div>
      </div>
    );
  }

  return (
    <div id="today-content" style={{padding:'20px 0'}}>
      <div className="workout-hero">
        <div className="workout-type">{DAYS_FULL[dow]}</div>
        <div className="workout-name">{plan.label}{showAbs ? ' & Abs' : ''}{showProgressive ? ' & Progressive' : ''}</div>
        <div className="workout-meta">
          <span><strong>{activeMuscles.reduce((s,m)=>s+m.exercises.length,0)}</strong> exercises</span>
          <span><strong>{activeMuscles.length}</strong> muscle groups</span>
        </div>
      </div>

      <div className="session-meta">
        <div className="meta-grid">
          <div className="meta-group"><div className="meta-label">Status</div>
            <select className="meta-input" value={meta.status || 'Completed'} onChange={e => handleMetaChange('status', e.target.value)}>
              <option value="Completed">Completed</option>
              <option value="Partial">Partial</option>
              <option value="Skipped">Skipped</option>
            </select>
          </div>
          <div className="meta-group"><div className="meta-label">Body Weight (kg)</div>
            <input type="number" step="0.1" className="meta-input" value={meta.bw || ''} onChange={e => handleMetaChange('bw', e.target.value)} placeholder="e.g. 75.5" disabled={isSkipped} />
          </div>
          <div className="meta-group"><div className="meta-label">Start Time</div>
            <input type="time" className="meta-input" value={meta.start || ''} onChange={e => handleMetaChange('start', e.target.value)} disabled={isSkipped} />
          </div>
          <div className="meta-group"><div className="meta-label">End Time</div>
            <input type="time" className="meta-input" value={meta.end || ''} onChange={e => handleMetaChange('end', e.target.value)} disabled={isSkipped} />
          </div>
        </div>
        
        <div className="meta-grid" style={{ opacity: isSkipped ? 0.5 : 1 }}>
          <div className="meta-group"><div className="meta-label" style={{color:'#ddd'}}>Mood</div>
            <div className="mood-group">
              {['😴','😐','🙂','🔥','💪'].map(m => (
                <button key={m} className={`mood-btn ${meta.mood === m ? 'active' : ''}`} onClick={() => !isSkipped && handleMetaChange('mood', m)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer' }}>{m}</button>
              ))}
            </div>
          </div>
          <div className="meta-group"><div className="meta-label" style={{color:'#ddd'}}>Energy</div>
            <div className="energy-group">
              {[1,2,3,4,5].map(e => (
                <span key={e} className={`energy-star ${meta.energy >= e ? 'active' : ''}`} onClick={() => !isSkipped && handleMetaChange('energy', e)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer' }}>★</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="meta-group" style={{marginTop:'12px'}}><div className="meta-label">Notes</div>
          <textarea className="notes-input" value={meta.notes || ''} onChange={e => handleMetaChange('notes', e.target.value)} placeholder="How did it feel?"></textarea>
        </div>
      </div>

      {plan.muscles.map(m => {
        if(m.name === 'Abs' && !showAbs) {
          return (
            <div className="muscle-block" key={m.name} onClick={() => !isSkipped && addAbs()} style={{cursor: isSkipped ? 'not-allowed' : 'pointer', opacity: isSkipped ? 0.4 : 0.8, textAlign: 'center', padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px dashed var(--border2)'}}>
              <div style={{fontSize: '12px', fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.1em'}}>+ ADD ABS WORKOUT</div>
            </div>
          );
        }

        if(m.name === 'Progressive' && !showProgressive) {
          return (
            <div className="muscle-block" key={m.name} onClick={() => !isSkipped && addProgressive()} style={{cursor: isSkipped ? 'not-allowed' : 'pointer', opacity: isSkipped ? 0.4 : 0.8, textAlign: 'center', padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px dashed var(--border2)', marginTop: '8px'}}>
              <div style={{fontSize: '12px', fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.1em'}}>+ ADD PROGRESSIVE WORKOUT</div>
            </div>
          );
        }

        return (
        <div className="muscle-block" key={m.name} style={{ opacity: isSkipped ? 0.5 : 1 }}>
          <div className="muscle-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center'}}><div className="muscle-dot"></div><div className="muscle-name">{m.name}</div></div>
            {(m.name === 'Abs' || m.name === 'Progressive') && (
              <button onClick={() => !isSkipped && (m.name === 'Abs' ? removeAbs() : removeProgressive())} disabled={isSkipped} style={{background:'transparent', border:'none', color:'var(--red)', fontSize:'12px', fontWeight:'bold', cursor: isSkipped ? 'not-allowed' : 'pointer', padding:'4px 8px'}}>REMOVE</button>
            )}
          </div>
          {m.exercises.map((ex, i) => {
            const ek = `${m.name}_${i}`;
            const sv = saved[ek] || {};
            const prev = getPrevStats(ek) || {};
            const vol = (sv.s && sv.r && sv.w) ? Math.round(sv.s * sv.r * sv.w) : '';
            const isDone = sv.done; // true, false, or undefined
            return (
              <div className={`exercise-card ${isDone === true ? 'done' : ''}`} key={ek} style={{opacity: isDone === false ? 0.4 : (isDone === true ? 0.7 : 1), transition:'opacity 0.2s'}}>
                <div className="exercise-name-row">
                  <div className="exercise-name-wrap" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
                      <div onClick={() => !isSkipped && handleInputChange(ek, 'done', isDone === true ? null : true)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                        <CheckCircle2 size={22} color={isDone === true ? "var(--accent)" : "rgba(200, 241, 53, 0.2)"} />
                      </div>
                      <div onClick={() => !isSkipped && handleInputChange(ek, 'done', isDone === false ? null : false)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                        <XCircle size={22} color={isDone === false ? "var(--red)" : "rgba(255, 77, 77, 0.2)"} />
                      </div>
                    </div>
                    <div className="exercise-name" style={{textDecoration: isDone === false ? 'line-through' : 'none', color: isDone === true ? 'var(--accent)' : 'var(--text)', flex: 1}}>{ex}</div>
                    <button className="rename-today-btn" onClick={() => !isSkipped && toggleRename(ek, ex)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer' }}>✏️</button>
                  </div>
                </div>
                {renameBox === ek && (
                  <div className="rename-input-box open">
                    <input type="text" className="rename-input" value={renameInput} onChange={e => setRenameInput(e.target.value)} placeholder="Rename for today only" disabled={isSkipped} />
                    <button className="rename-save" onClick={() => saveRename(ek)} disabled={isSkipped}>Apply</button>
                  </div>
                )}
                <div className="exercise-inputs">
                  <div className="input-group"><div className="input-label">SETS</div><input type="number" min="0" placeholder={prev.s || "0"} value={sv.s || ''} onChange={e => handleInputChange(ek, 's', e.target.value)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'text' }} /></div>
                  <div className="input-group"><div className="input-label">{ex.toLowerCase().includes('plank') || ex.toLowerCase().includes('hold') || ex.toLowerCase().includes('cardio') ? 'TIME (s)' : 'REPS'}</div><input type="number" min="0" placeholder={prev.r || "0"} value={sv.r || ''} onChange={e => handleInputChange(ek, 'r', e.target.value)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'text' }} /></div>
                  <div className="input-group"><div className="input-label">{ex.toLowerCase().includes('plank') || ex.toLowerCase().includes('hold') || ex.toLowerCase().includes('cardio') ? 'LEVEL' : 'KG'}</div><input type="number" min="0" step="0.5" placeholder={prev.w || "0"} value={sv.w || ''} onChange={e => handleInputChange(ek, 'w', e.target.value)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'text' }} /></div>
                </div>
                <div className="vol-row"><span className="vol-label">Volume</span><span className="vol-val">{vol ? vol+' kg' : '—'}</span></div>
              </div>
            );
          })}
        </div>
        );
      })}

      <div className="save-area">
        <button className="save-btn" onClick={saveToday}>Save workout</button>
        <span className="save-ok" style={{opacity: saveMsg ? 1 : 0}}>Saved ✓</span>
      </div>
    </div>
  );
}
