import React, { useState } from 'react';
import { DEFAULT_PLAN, DAYS_FULL, DEFAULT_DIET_PLAN, MONTHS, dateKey } from '../data';

export default function Settings({ NAMES, syncData, DB, META, FOOD, handleLogout, SCHEDULE, BUDGET_SETTINGS, syncBudget, STUDY_SETTINGS, syncStudy, BUDGET, STUDY }) {
  const [localNames, setLocalNames] = useState(NAMES);
  const [saveMsg, setSaveMsg] = useState(false);
  
  const [localSchedule, setLocalSchedule] = useState({ ...SCHEDULE?.fullTime });
  const [schedMsg, setSchedMsg] = useState(false);
  const [showSchedModal, setShowSchedModal] = useState(false);

  const [localIncome, setLocalIncome] = useState(BUDGET_SETTINGS?.income || 22400);
  const [budgetMsg, setBudgetMsg] = useState(false);

  const [localDailyTarget, setLocalDailyTarget] = useState(STUDY_SETTINGS?.dailyTarget || 4);
  const [localSubjects, setLocalSubjects] = useState(STUDY_SETTINGS?.subjects || []);
  const [newSubjectLabel, setNewSubjectLabel] = useState('');
  const [studyMsg, setStudyMsg] = useState(false);

  const SUBJECT_COLORS = ['#A78BFA', '#FBBF24', '#4D9FFF', '#34D399', '#FB923C', '#F472B6', '#FF6B6B'];

  const saveBudgetSettings = () => {
    const newSettings = { ...BUDGET_SETTINGS, income: Number(localIncome) };
    syncBudget(BUDGET, newSettings);
    setBudgetMsg(true);
    setTimeout(() => setBudgetMsg(false), 2000);
  };

  const addSubject = () => {
    if (!newSubjectLabel.trim()) return;
    const newSub = { id: Date.now().toString(), label: newSubjectLabel.trim(), emoji: '📖', color: SUBJECT_COLORS[localSubjects.length % SUBJECT_COLORS.length] };
    setLocalSubjects(prev => [...prev, newSub]);
    setNewSubjectLabel('');
  };

  const removeSubject = (id) => setLocalSubjects(prev => prev.filter(s => s.id !== id));

  const saveStudySettings = () => {
    const newSettings = { ...STUDY_SETTINGS, dailyTarget: Number(localDailyTarget), subjects: localSubjects };
    syncStudy(STUDY, newSettings);
    setStudyMsg(true);
    setTimeout(() => setStudyMsg(false), 2000);
  };

  const SPLITS = [
    { id: 0, label: 'Rest Day' },
    { id: 1, label: 'Chest & Triceps' },
    { id: 2, label: 'Back & Biceps' },
    { id: 3, label: 'Legs & Shoulders' },
    { id: 6, label: 'Progressive Overload' },
  ];

  const saveSchedule = (type) => {
    const newSched = { fullTime: { ...(SCHEDULE?.fullTime || {}) }, thisWeek: { ...(SCHEDULE?.thisWeek || {}) } };
    if (type === 'fullTime') {
      newSched.fullTime = { ...localSchedule };
    } else {
      const today = new Date();
      for(let i=0; i<7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dk = dateKey(d);
        const dow = d.getDay();
        newSched.thisWeek[dk] = localSchedule[dow] !== undefined ? localSchedule[dow] : (DEFAULT_PLAN[dow]?.id || dow);
      }
    }
    syncData(DB, NAMES, META, FOOD, newSched);
    setShowSchedModal(false);
    setSchedMsg(true);
    setTimeout(() => setSchedMsg(false), 2000);
  };

  const handleNameChange = (k, val) => {
    setLocalNames(prev => ({ ...prev, [k]: val }));
  };

  const saveNames = () => {
    syncData(DB, localNames, META, FOOD);
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  };

  const exportData = () => {
    const data = { workouts: DB, names: localNames, meta: META, food: FOOD };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LifeTraker_Backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const allKeys = Array.from(new Set([...Object.keys(DB), ...Object.keys(META), ...Object.keys(FOOD)])).sort();
    
    // CSV Header
    let csv = 'Date,Day_Name,Day,Month,Year,Category,Item_Name,Sets,Reps,Weight_kg,Protein_g,Notes_or_Status\n';
    
    const escapeCSV = (str) => {
      if(str === null || str === undefined) return '';
      const s = String(str);
      if(s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    allKeys.forEach(k => {
      const kd = new Date(k);
      const dow = kd.getDay();
      const dayName = DAYS_FULL[dow];
      const dayNum = kd.getDate();
      const monthName = MONTHS[kd.getMonth()];
      const year = kd.getFullYear();
      
      const dateCols = `${k},${dayName},${dayNum},${monthName},${year}`;
      
      // 1. Meta
      const m = META[k];
      if(m) {
        if(m.status) csv += `${dateCols},Meta,Daily Status,,,,,"${m.status}"\n`;
        if(m.bw) csv += `${dateCols},Meta,Bodyweight,,,,,"${m.bw} kg"\n`;
        if(m.energy) csv += `${dateCols},Meta,Energy,,,,,"${m.energy} stars"\n`;
        if(m.notes) csv += `${dateCols},Meta,Notes,,,,,${escapeCSV(m.notes)}\n`;
      }
      
      // 2. Gym
      const entry = DB[k];
      if(entry) {
        Object.keys(entry).filter(ek => !['meta', 'customName'].includes(ek)).forEach(ek => {
          const v = entry[ek];
          if(v.s || v.r || v.w) {
            // Try to find custom name
            const customKey = Object.keys(localNames).find(nameKey => nameKey.endsWith('_' + ek));
            let exName = customKey ? localNames[customKey] : ek;
            if(entry[ek].customName) exName = entry[ek].customName;
            
            csv += `${dateCols},Workout,${escapeCSV(exName)},${v.s||0},${v.r||0},${v.w||0},,\n`;
          }
        });
      }
      
      // 3. Food
      const f = FOOD[k];
      if(f) {
        if(f.water) csv += `${dateCols},Habit,Water 3-4L,,,,,Completed\n`;
        if(f.sleep) csv += `${dateCols},Habit,Sleep 7-8h,,,,,Completed\n`;
        if(f.junk) csv += `${dateCols},Habit,No Junk,,,,,Completed\n`;
        
        if(f.items) {
          const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
          dietPlan.forEach(meal => meal.items.forEach(i => {
            if(f.items[i.id]) {
              const customName = (f.custom && f.custom[i.id]) ? f.custom[i.id] : i.name;
              csv += `${dateCols},Diet,${escapeCSV(customName)},,,,${i.p},\n`;
            }
          }));
        }
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LifeTraker_Full_Export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="settings-content" style={{padding:'20px 0'}}>
      <div className="settings-header">Weekly Schedule Planner</div>
      <div className="settings-sub">Customize your workout split.</div>
      
      <div className="settings-section" style={{display:'flex', flexDirection:'column', gap:'12px'}}>
        {[1,2,3,4,5,6,0].map(dow => {
          const currentSplit = localSchedule[dow] !== undefined ? localSchedule[dow] : (dow === 4 ? 1 : dow === 5 ? 2 : dow);
          return (
            <div key={dow} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{fontWeight:500, color:'var(--text)', width:'100px'}}>{DAYS_FULL[dow]}</div>
              <select 
                style={{flex:1, padding:'10px 12px', borderRadius:'8px', background:'var(--bg)', color:'var(--text)', border:'1px solid var(--border)', outline:'none'}}
                value={currentSplit}
                onChange={e => setLocalSchedule(prev => ({ ...prev, [dow]: parseInt(e.target.value) }))}
              >
                {SPLITS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'16px', marginBottom:'32px'}}>
        <button className="settings-save" onClick={() => setShowSchedModal(true)} style={{flex:1}}>Save Schedule</button>
        <span className="save-ok" style={{opacity: schedMsg ? 1 : 0}}>Saved ✓</span>
      </div>

      <div className="settings-header" style={{marginTop:'32px'}}>Custom Exercises</div>
      <div className="settings-sub">Rename default exercises. Leave blank to reset.</div>
      
      {[1,2,3].map(dow => {
        const p = DEFAULT_PLAN[dow];
        return (
          <div className="settings-section" key={dow}>
            <div className="settings-label">{p.label} — {DAYS_FULL[dow]}</div>
            {p.muscles.map(m => (
              <div key={m.name}>
                <div style={{fontSize:'11px',color:'var(--text3)',margin:'8px 0 6px',letterSpacing:'.05em'}}>{m.name}</div>
                {m.exercises.map((ex, i) => {
                  const k = `${dow}_${m.name}_${i}`;
                  const val = localNames[k] !== undefined ? localNames[k] : ex;
                  return (
                    <div className="exercise-edit-row" key={k}>
                      <div className="exercise-idx">{i+1}</div>
                      <input type="text" value={val} onChange={e => handleNameChange(k, e.target.value)} placeholder={ex} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}

      <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'24px', marginBottom:'16px'}}>
        <button className="settings-save" onClick={saveNames} style={{flex:1}}>Save changes</button>
        <span className="save-ok" style={{opacity: saveMsg ? 1 : 0}}>Saved ✓</span>
      </div>
      
      <button className="settings-save" style={{background:'var(--accent)', color:'#000', marginBottom:'16px'}} onClick={exportCSV}>Download Full Export (CSV / Excel)</button>
      <button className="settings-save" style={{background:'var(--bg3)', color:'var(--text)', marginBottom:'16px'}} onClick={exportData}>Export Backup (JSON)</button>

      {/* BUDGET DEFAULTS */}
      <div className="settings-header" style={{marginTop:'32px'}}>💰 Budget Defaults</div>
      <div className="settings-sub">Set your monthly take-home income.</div>
      <div className="settings-section">
        <div style={{fontSize:'12px', color:'var(--text2)', marginBottom:'6px'}}>Monthly Income (₹)</div>
        <input type="number" value={localIncome} onChange={e => setLocalIncome(e.target.value)}
          style={{width:'100%', padding:'10px 12px', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontSize:'16px', fontWeight:'bold', boxSizing:'border-box'}} />
      </div>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'12px', marginBottom:'24px'}}>
        <button className="settings-save" onClick={saveBudgetSettings} style={{flex:1}}>Save Income</button>
        <span className="save-ok" style={{opacity: budgetMsg ? 1 : 0}}>Saved ✓</span>
      </div>

      {/* STUDY DEFAULTS */}
      <div className="settings-header" style={{marginTop:'8px'}}>📚 Study Defaults</div>
      <div className="settings-sub">Set daily target and manage subjects.</div>
      <div className="settings-section">
        <div style={{fontSize:'12px', color:'var(--text2)', marginBottom:'6px'}}>Daily Target (hours)</div>
        <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px'}}>
          {[2, 3, 4, 5, 6, 8].map(h => (
            <div key={h} onClick={() => setLocalDailyTarget(h)}
              style={{padding:'6px 16px', borderRadius:'20px', fontSize:'13px', cursor:'pointer', background: localDailyTarget === h ? 'var(--accent)' : 'var(--bg)', color: localDailyTarget === h ? '#000' : 'var(--text2)', border:`1px solid ${localDailyTarget === h ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: localDailyTarget === h ? 700 : 400}}>
              {h}h
            </div>
          ))}
        </div>
        <div style={{fontSize:'12px', color:'var(--text2)', marginBottom:'8px'}}>Subjects</div>
        {localSubjects.map(s => (
          <div key={s.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border2)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <span style={{fontSize:'18px'}}>{s.emoji}</span>
              <span style={{fontSize:'13px', color: s.color, fontWeight:600}}>{s.label}</span>
            </div>
            <button onClick={() => removeSubject(s.id)} style={{background:'transparent', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'12px'}}>Remove</button>
          </div>
        ))}
        <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
          <input type="text" placeholder="New subject (e.g. Python)" value={newSubjectLabel} onChange={e => setNewSubjectLabel(e.target.value)}
            style={{flex:1, padding:'8px 12px', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontSize:'13px'}} />
          <button onClick={addSubject} style={{padding:'8px 14px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontWeight:600, cursor:'pointer', fontSize:'13px'}}>+ Add</button>
        </div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'12px', marginBottom:'24px'}}>
        <button className="settings-save" onClick={saveStudySettings} style={{flex:1}}>Save Study Settings</button>
        <span className="save-ok" style={{opacity: studyMsg ? 1 : 0}}>Saved ✓</span>
      </div>

      <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      <div style={{height:'20px'}}></div>

      {showSchedModal && (
        <div className="modal-overlay" onClick={() => setShowSchedModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Save Schedule</h3>
            <p style={{fontSize:'13px', color:'var(--text2)', marginBottom:'20px', lineHeight: 1.5}}>Do you want to save this permanently or just for this week?</p>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <button className="settings-save" onClick={() => saveSchedule('fullTime')} style={{background:'var(--accent)', color:'#000'}}>Full Time (Permanent)</button>
              <button className="settings-save" onClick={() => saveSchedule('thisWeek')} style={{background:'var(--bg3)', color:'var(--text)'}}>This Week Only</button>
              <button className="settings-save" onClick={() => setShowSchedModal(false)} style={{background:'transparent', color:'var(--text3)', border:'1px solid var(--border)'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
