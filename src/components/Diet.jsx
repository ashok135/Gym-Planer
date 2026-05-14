import React, { useState } from 'react';
import { DEFAULT_DIET_PLAN, dateKey, DAYS_FULL } from '../data';

export default function Diet({ FOOD, syncData, DB, NAMES, META }) {
  const today = new Date();
  const dow = today.getDay();
  const key = dateKey(today);
  
  const saved = FOOD[key] || { items: {}, water: false, sleep: false, junk: false, custom: {} };
  const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[0];

  const [renameBox, setRenameBox] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  const toggleRename = (id, currentName) => {
    if (renameBox === id) {
      setRenameBox(null);
    } else {
      setRenameBox(id);
      setRenameInput(currentName);
    }
  };

  const saveRename = (id) => {
    if(!renameInput.trim()) return;
    const newFood = { ...FOOD };
    if(!newFood[key]) newFood[key] = { items: {}, water: false, sleep: false, junk: false, custom: {} };
    if(!newFood[key].custom) newFood[key].custom = {};
    newFood[key].custom[id] = renameInput.trim();
    syncData(DB, NAMES, META, newFood);
    setRenameBox(null);
  };

  const handleCheck = (id, checked) => {
    const newFood = { ...FOOD };
    if(!newFood[key]) newFood[key] = { items: {}, water: false, sleep: false, junk: false, custom: {} };
    if(!newFood[key].items) newFood[key].items = {};
    newFood[key].items[id] = checked;
    syncData(DB, NAMES, META, newFood);
  };

  const handleHabit = (type, checked) => {
    const newFood = { ...FOOD };
    if(!newFood[key]) newFood[key] = { items: {}, water: false, sleep: false, junk: false, custom: {} };
    newFood[key][type] = checked;
    syncData(DB, NAMES, META, newFood);
  };

  let totalP = 0;
  dietPlan.forEach(meal => {
    meal.items.forEach(item => {
      if(saved.items && saved.items[item.id]) totalP += item.p;
    });
  });

  const pct = Math.min(100, Math.round((totalP / 100) * 100));

  return (
    <div id="food-content" style={{padding: '20px 0'}}>
      <div style={{textAlign: 'center', marginBottom: '16px'}}>
        <div style={{fontSize: '20px', fontWeight: 600, color: 'var(--text)'}}>{DAYS_FULL[dow]} Diet Plan</div>
        <div style={{fontSize: '13px', color: 'var(--text2)'}}>Log your meals and habits for today</div>
      </div>
      <div className="food-ring-container">
        <div className="food-ring" style={{background: `conic-gradient(var(--accent) ${pct}%, var(--bg3) 0%)`}}>
          <div className="food-ring-inner">
            <div className="food-ring-val">{totalP}g</div>
            <div className="food-ring-label">of 100g Protein</div>
          </div>
        </div>
      </div>
      
      <div className="habit-grid">
        <div className="habit-card">
          <div className="habit-icon">💧</div>
          <div className="habit-label">3-4L Water</div>
          <input type="checkbox" className="food-check" checked={saved.water || false} onChange={e => handleHabit('water', e.target.checked)} />
        </div>
        <div className="habit-card">
          <div className="habit-icon">😴</div>
          <div className="habit-label">7-8h Sleep</div>
          <input type="checkbox" className="food-check" checked={saved.sleep || false} onChange={e => handleHabit('sleep', e.target.checked)} />
        </div>
        <div className="habit-card" style={{gridColumn: '1 / -1', flexDirection:'row', justifyContent:'space-between', padding:'16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div className="habit-icon">🚫</div>
            <div style={{textAlign:'left'}}>
              <div className="habit-label" style={{margin:0}}>No Junk & Reels</div>
              <div style={{fontSize:'10px', color:'var(--text3)', marginTop:'2px'}}>Stay focused today</div>
            </div>
          </div>
          <input type="checkbox" className="food-check" checked={saved.junk || false} onChange={e => handleHabit('junk', e.target.checked)} />
        </div>
      </div>

      {dietPlan.map(meal => (
        <div className="meal-block" key={meal.meal}>
          <div className="meal-header">{meal.meal}</div>
          {meal.items.map(item => {
            const isChecked = saved.items && saved.items[item.id];
            const customName = (saved.custom && saved.custom[item.id]) ? saved.custom[item.id] : item.name;
            return (
              <React.Fragment key={item.id}>
                <div className="food-item">
                  <input type="checkbox" className="food-check" checked={isChecked || false} onChange={e => handleCheck(item.id, e.target.checked)} />
                  <div className="food-name-wrap">
                    <div className="food-name">{customName}</div>
                    <button className="rename-today-btn" onClick={() => toggleRename(item.id, customName)}>✏️</button>
                  </div>
                  <div className="food-macros">{item.p > 0 ? item.p+'g P' : ''}</div>
                </div>
                {renameBox === item.id && (
                  <div className="rename-input-box open">
                    <input type="text" className="rename-input" value={renameInput} onChange={e => setRenameInput(e.target.value)} placeholder="Rename for today" />
                    <button className="rename-save" onClick={() => saveRename(item.id)}>Apply</button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ))}

      <div className="budget-guide">
        <div className="bg-title">Budget Protein Cheat Sheet</div>
        <div className="bg-list">
          • <strong>Soya Chunks:</strong> 52g P per 100g (Very cheap!)<br/>
          • <strong>Eggs:</strong> 6g P per egg<br/>
          • <strong>Green Gram (Moong):</strong> 24g P per 100g<br/>
          • <strong>Roasted Channa:</strong> 18g P per 100g<br/>
          • <strong>Peanuts:</strong> 25g P per 100g
        </div>
      </div>
      <div style={{height:'20px'}}></div>
    </div>
  );
}
