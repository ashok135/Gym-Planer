import React, { useState } from 'react';
import { DEFAULT_DIET_PLAN, BUDGET_GUIDES, dateKey, DAYS_FULL, MONTHS } from '../data';
import { CheckCircle2, Circle } from 'lucide-react';

const SegmentBar = ({ val, onChange, color }) => {
  const activeColor = color || "var(--accent)";
  return (
    <div style={{display: 'flex', gap: '4px', width: '70px', height: '24px'}}>
      {[1, 2, 3].map(level => (
        <div 
          key={level}
          onClick={(e) => { e.stopPropagation(); onChange(val === level ? 0 : level); }}
          style={{
            flex: 1, 
            background: val >= level ? activeColor : 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
        />
      ))}
    </div>
  );
};

const WATER_LABELS = ['0L', '1-2L', '2-3L', '3-4L'];
const SLEEP_LABELS = ['< 5h', '5-6h', '6-7h', '7-8h'];
const JUNK_LABELS = ['Failed', 'Small Cheat', 'Very Little', 'Perfect'];

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

  const handleCheck = (id, newVal) => {
    const newFood = { ...FOOD };
    if(!newFood[key]) newFood[key] = { items: {}, water: 0, sleep: 0, junk: 0, custom: {} };
    if(!newFood[key].items) newFood[key].items = {};
    newFood[key].items[id] = newVal;
    syncData(DB, NAMES, META, newFood);
  };

  const handleHabit = (type, newVal) => {
    const newFood = { ...FOOD };
    if(!newFood[key]) newFood[key] = { items: {}, water: 0, sleep: 0, junk: 0, custom: {} };
    newFood[key][type] = newVal;
    syncData(DB, NAMES, META, newFood);
  };

  const getVal = (v) => {
    if (v === true) return 3;
    if (v === false || v === undefined) return 0;
    return v;
  };

  let totalP = 0;
  dietPlan.forEach(meal => {
    meal.items.forEach(item => {
      if(saved.items) {
        const val = getVal(saved.items[item.id]);
        if (val > 0) totalP += (item.p * (val / 3));
      }
    });
  });
  totalP = Math.round(totalP);

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
        <div className="habit-card" onClick={() => handleHabit('water', (getVal(saved.water) + 1) % 4)} style={{cursor:'pointer', flexDirection:'column', alignItems:'flex-start', gap:'12px', padding:'16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <div className="habit-icon">💧</div>
            <div className="habit-label" style={{margin:0}}>Water</div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
            <div style={{fontSize:'11px', color:'var(--text2)', fontWeight:600}}>{WATER_LABELS[getVal(saved.water)]}</div>
            <SegmentBar val={getVal(saved.water)} onChange={(v) => handleHabit('water', v)} color="var(--blue)" />
          </div>
        </div>
        <div className="habit-card" onClick={() => handleHabit('sleep', (getVal(saved.sleep) + 1) % 4)} style={{cursor:'pointer', flexDirection:'column', alignItems:'flex-start', gap:'12px', padding:'16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <div className="habit-icon">😴</div>
            <div className="habit-label" style={{margin:0}}>Sleep</div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
            <div style={{fontSize:'11px', color:'var(--text2)', fontWeight:600}}>{SLEEP_LABELS[getVal(saved.sleep)]}</div>
            <SegmentBar val={getVal(saved.sleep)} onChange={(v) => handleHabit('sleep', v)} color="var(--accent)" />
          </div>
        </div>
        <div className="habit-card" onClick={() => handleHabit('junk', (getVal(saved.junk) + 1) % 4)} style={{gridColumn: '1 / -1', flexDirection:'row', justifyContent:'space-between', padding:'16px', cursor:'pointer'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div className="habit-icon">🚫</div>
            <div style={{textAlign:'left'}}>
              <div className="habit-label" style={{margin:0}}>No Junk & Reels</div>
              <div style={{fontSize:'11px', color:'var(--text2)', marginTop:'4px', fontWeight:600}}>{JUNK_LABELS[getVal(saved.junk)]}</div>
            </div>
          </div>
          <SegmentBar val={getVal(saved.junk)} onChange={(v) => handleHabit('junk', v)} color="var(--red)" />
        </div>
      </div>

      {dietPlan.map(meal => (
        <div className="meal-block" key={meal.meal}>
          <div className="meal-header">{meal.meal}</div>
          {meal.items.map(item => {
            const val = getVal(saved.items && saved.items[item.id]);
            const customName = (saved.custom && saved.custom[item.id]) ? saved.custom[item.id] : item.name;
            return (
              <React.Fragment key={item.id}>
                <div className="food-item" onClick={() => handleCheck(item.id, (val + 1) % 4)} style={{cursor:'pointer'}}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <SegmentBar val={val} onChange={(v) => handleCheck(item.id, v)} color="var(--accent)" />
                  </div>
                  <div className="food-name-wrap" style={{marginLeft: '12px'}}>
                    <div className="food-name" style={{opacity: val === 0 ? 0.6 : 1, transition:'opacity 0.2s'}}>{customName}</div>
                    <button className="rename-today-btn" onClick={(e) => { e.stopPropagation(); toggleRename(item.id, customName); }}>✏️</button>
                  </div>
                  <div className="food-macros">{item.p > 0 ? Math.round(item.p * (val/3))+'g P' : ''}</div>
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
