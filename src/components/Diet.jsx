import React, { useState } from 'react';
import { DEFAULT_DIET_PLAN, BUDGET_GUIDES, dateKey, DAYS_FULL, MONTHS } from '../data';
import { CheckCircle2, Circle } from 'lucide-react';

export default function Diet({ FOOD, syncData, DB, NAMES, META }) {
  const today = new Date();
  const dow = today.getDay();
  const key = dateKey(today);
  
  const saved = FOOD[key] || { items: {}, water: false, sleep: false, junk: false, custom: {} };
  const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[0];
  const budgetGuide = BUDGET_GUIDES[dow] || BUDGET_GUIDES[1];

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
        <div style={{fontSize: '20px', fontWeight: 600, color: 'var(--text)'}}>{DAYS_FULL[dow]}, {today.getDate()} {MONTHS[today.getMonth()]} {today.getFullYear()}</div>
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
        <div className="habit-card" onClick={() => handleHabit('water', !saved.water)} style={{cursor:'pointer'}}>
          <div className="habit-icon">💧</div>
          <div className="habit-label">3-4L Water</div>
          <div style={{display:'flex', alignItems:'center'}}>
            {saved.water ? <CheckCircle2 size={24} color="var(--accent)"/> : <Circle size={24} color="rgba(200, 241, 53, 0.2)"/>}
          </div>
        </div>
        <div className="habit-card" onClick={() => handleHabit('sleep', !saved.sleep)} style={{cursor:'pointer'}}>
          <div className="habit-icon">😴</div>
          <div className="habit-label">7-8h Sleep</div>
          <div style={{display:'flex', alignItems:'center'}}>
            {saved.sleep ? <CheckCircle2 size={24} color="var(--accent)"/> : <Circle size={24} color="rgba(200, 241, 53, 0.2)"/>}
          </div>
        </div>
        <div className="habit-card" onClick={() => handleHabit('junk', !saved.junk)} style={{gridColumn: '1 / -1', flexDirection:'row', justifyContent:'space-between', padding:'16px', cursor:'pointer'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div className="habit-icon">🚫</div>
            <div style={{textAlign:'left'}}>
              <div className="habit-label" style={{margin:0}}>No Junk & Reels</div>
              <div style={{fontSize:'10px', color:'var(--text3)', marginTop:'2px'}}>Stay focused today</div>
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center'}}>
            {saved.junk ? <CheckCircle2 size={24} color="var(--accent)"/> : <Circle size={24} color="rgba(200, 241, 53, 0.2)"/>}
          </div>
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
                <div className="food-item" onClick={() => handleCheck(item.id, !isChecked)} style={{cursor:'pointer'}}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    {isChecked ? <CheckCircle2 size={24} color="var(--accent)"/> : <Circle size={24} color="rgba(200, 241, 53, 0.2)"/>}
                  </div>
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
        <div className="bg-title">Budget Cheat Sheet ({DAYS_FULL[dow]})</div>
        <div className="bg-list">
          {budgetGuide.map((g, idx) => (
            <div key={idx} style={{marginBottom: '8px'}}>
              • <strong style={{color:'var(--accent)'}}>{g.name}:</strong> <span style={{color:'var(--text2)'}}>{g.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{height:'20px'}}></div>
    </div>
  );
}
