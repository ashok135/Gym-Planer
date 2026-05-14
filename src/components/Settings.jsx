import React, { useState } from 'react';
import { DEFAULT_PLAN, DAYS_FULL } from '../data';

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
    const data = {
      workouts: DB,
      names: localNames,
      meta: META,
      food: FOOD
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LifeTraker_Backup.json';
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
      
      <button className="settings-save" style={{background:'var(--bg3)', color:'var(--text)', marginBottom:'16px'}} onClick={exportData}>Export Backup (JSON)</button>
      <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      <div style={{height:'20px'}}></div>
    </div>
  );
}
