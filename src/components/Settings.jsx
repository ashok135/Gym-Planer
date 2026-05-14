import React, { useState } from 'react';
import { DEFAULT_PLAN, DAYS_FULL, DEFAULT_DIET_PLAN } from '../data';

export default function Settings({ NAMES, syncData, DB, META, FOOD, handleLogout }) {
  const [localNames, setLocalNames] = useState(NAMES);
  const [saveMsg, setSaveMsg] = useState(false);

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
    let csv = 'Date,Category,Item_Name,Sets,Reps,Weight_kg,Protein_g,Notes_or_Status\n';
    
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
      
      // 1. Meta
      const m = META[k];
      if(m) {
        if(m.status) csv += `${k},Meta,Daily Status,,,,,"${m.status}"\n`;
        if(m.bw) csv += `${k},Meta,Bodyweight,,,,,"${m.bw} kg"\n`;
        if(m.energy) csv += `${k},Meta,Energy,,,,,"${m.energy} stars"\n`;
        if(m.notes) csv += `${k},Meta,Notes,,,,,${escapeCSV(m.notes)}\n`;
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
            
            csv += `${k},Workout,${escapeCSV(exName)},${v.s||0},${v.r||0},${v.w||0},,\n`;
          }
        });
      }
      
      // 3. Food
      const f = FOOD[k];
      if(f) {
        if(f.water) csv += `${k},Habit,Water 3-4L,,,,,Completed\n`;
        if(f.sleep) csv += `${k},Habit,Sleep 7-8h,,,,,Completed\n`;
        if(f.junk) csv += `${k},Habit,No Junk,,,,,Completed\n`;
        
        if(f.items) {
          const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
          dietPlan.forEach(meal => meal.items.forEach(i => {
            if(f.items[i.id]) {
              const customName = (f.custom && f.custom[i.id]) ? f.custom[i.id] : i.name;
              csv += `${k},Diet,${escapeCSV(customName)},,,,${i.p},\n`;
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
      <div className="settings-header">Custom Exercises</div>
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
      <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      <div style={{height:'20px'}}></div>
    </div>
  );
}
