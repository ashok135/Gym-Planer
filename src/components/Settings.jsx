import React, { useState } from 'react';
import { DEFAULT_PLAN, DAYS_FULL, DEFAULT_DIET_PLAN, MONTHS, dateKey } from '../data';
import { ChevronDown, Beaker } from 'lucide-react';
import { generateSeedData } from '../utils/seeder';

function Accordion({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '12px', borderRadius: '14px', border: '1px solid var(--border2)', overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'var(--bg3)', cursor: 'pointer', userSelect: 'none' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <ChevronDown size={18} color="var(--text3)" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
      </div>
      {open && <div style={{ padding: '16px 18px', background: 'var(--bg)' }}>{children}</div>}
    </div>
  );
}

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

  const DEFAULT_CATEGORIES = [
    { id: 'food',      label: 'Food',          emoji: '🍕', color: '#FF6B6B' },
    { id: 'supps',     label: 'Supplements',   emoji: '💊', color: '#C8F135' },
    { id: 'transport', label: 'Transport',     emoji: '🚗', color: '#4D9FFF' },
    { id: 'entertain', label: 'Entertainment', emoji: '🎮', color: '#A78BFA' },
    { id: 'outside',   label: 'Eating Out',    emoji: '🍽️', color: '#FB923C' },
    { id: 'gym',       label: 'Gym',           emoji: '🏋️', color: '#34D399' },
    { id: 'others',    label: 'Others',        emoji: '📦', color: '#94A3B8' },
  ];
  const CAT_COLORS = ['#FF6B6B','#C8F135','#4D9FFF','#A78BFA','#FB923C','#34D399','#94A3B8','#F472B6','#FBBF24'];

  const [localCategories, setLocalCategories] = useState(BUDGET_SETTINGS?.categories?.length ? BUDGET_SETTINGS.categories : DEFAULT_CATEGORIES);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');
  const [catMsg, setCatMsg] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [localAiEnabled, setLocalAiEnabled] = useState(() => localStorage.getItem('ai_enabled') === 'true');
  const [localAiKey, setLocalAiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [localAiModel, setLocalAiModel] = useState(() => localStorage.getItem('ai_model') || 'gemini-1.5-flash');
  const [localAiPersona, setLocalAiPersona] = useState(() => localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
  const [devMode, setDevMode] = useState(() => localStorage.getItem('dev_mode') === 'true');

  const addCategory = () => {
    if (!newCatLabel.trim()) return;
    const newCat = { id: Date.now().toString(), label: newCatLabel.trim(), emoji: newCatEmoji, color: CAT_COLORS[localCategories.length % CAT_COLORS.length] };
    setLocalCategories(prev => [...prev, newCat]);
    setNewCatLabel(''); setNewCatEmoji('📦');
  };

  const removeCategory = (id) => setLocalCategories(prev => prev.filter(c => c.id !== id));

  const saveBudgetSettings = () => {
    const newSettings = { ...BUDGET_SETTINGS, income: Number(localIncome), categories: localCategories };
    syncBudget(BUDGET, newSettings);
    setBudgetMsg(true); setCatMsg(true);
    setTimeout(() => { setBudgetMsg(false); setCatMsg(false); }, 2000);
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

  const exportBudgetCSV = () => {
    let csv = 'Date,Category,Amount,Note\n';
    Object.entries(BUDGET).forEach(([mk, md]) => {
      (md.entries || []).forEach(e => {
        csv += `${e.date},${e.category},${e.amount},"${(e.note||'').replace(/"/g,'""')}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'LifeTraker_Budget.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportStudyCSV = () => {
    let csv = 'Date,Subject,Hours,Learned\n';
    Object.entries(STUDY).forEach(([dk, sd]) => {
      (sd.sessions || []).forEach(s => {
        csv += `${dk},${s.subjectId},${s.hours},"${(s.learned||'').replace(/"/g,'""')}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'LifeTraker_Study.csv'; a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div id="settings-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div className="greeting">Configuration</div>
        <div className="ai-title">Settings</div>
      </div>

      {/* WORKOUT SCHEDULE */}
      <Accordion title="🗓️ Weekly Schedule Planner" subtitle="Customize your workout split per day" defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3,4,5,6,0].map(dow => {
            const currentSplit = localSchedule[dow] !== undefined ? localSchedule[dow] : (dow === 4 ? 1 : dow === 5 ? 2 : dow);
            return (
              <div key={dow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontWeight: 500, color: 'var(--text)', width: '90px', fontSize: '13px' }}>{DAYS_FULL[dow]}</div>
                <select style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', outline: 'none', fontSize: '13px' }}
                  value={currentSplit} onChange={e => setLocalSchedule(prev => ({ ...prev, [dow]: parseInt(e.target.value) }))}>
                  {SPLITS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button className="settings-save" onClick={() => setShowSchedModal(true)} style={{ flex: 1 }}>Save Schedule</button>
          <span className="save-ok" style={{ opacity: schedMsg ? 1 : 0 }}>Saved ✓</span>
        </div>
      </Accordion>

      {/* CUSTOM EXERCISES */}
      <Accordion title="🏋️ Custom Exercises" subtitle="Rename default exercises">
        {[1,2,3].map(dow => {
          const p = DEFAULT_PLAN[dow];
          return (
            <div className="settings-section" key={dow} style={{ marginBottom: '16px' }}>
              <div className="settings-label">{p.label} — {DAYS_FULL[dow]}</div>
              {p.muscles.map(m => (
                <div key={m.name}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', margin: '8px 0 6px', letterSpacing: '.05em' }}>{m.name}</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <button className="settings-save" onClick={saveNames} style={{ flex: 1 }}>Save Exercise Names</button>
          <span className="save-ok" style={{ opacity: saveMsg ? 1 : 0 }}>Saved ✓</span>
        </div>
      </Accordion>

      {/* BUDGET */}
      <Accordion title="💰 Budget Defaults" subtitle="Set monthly income and expense categories">
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Monthly Income (₹)</div>
          <input type="number" value={localIncome} onChange={e => setLocalIncome(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '16px', fontWeight: 'bold', boxSizing: 'border-box' }} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', margin: '14px 0 8px' }}>Expense Categories</div>
        {localCategories.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{c.emoji}</span>
              <span style={{ fontSize: '13px', color: c.color, fontWeight: 600 }}>{c.label}</span>
            </div>
            <button onClick={() => removeCategory(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}>Remove</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input type="text" value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} placeholder="Emoji" maxLength={2}
            style={{ width: '44px', padding: '8px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '18px', textAlign: 'center' }} />
          <input type="text" placeholder="Category name" value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} />
          <button onClick={addCategory} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
          <button className="settings-save" onClick={saveBudgetSettings} style={{ flex: 1 }}>Save Budget Settings</button>
          <span className="save-ok" style={{ opacity: budgetMsg ? 1 : 0 }}>Saved ✓</span>
        </div>
      </Accordion>

      {/* STUDY */}
      <Accordion title="📚 Study Defaults" subtitle="Daily target & subjects">
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Daily Target (hours)</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[2, 3, 4, 5, 6, 8].map(h => (
            <div key={h} onClick={() => setLocalDailyTarget(h)}
              style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', background: localDailyTarget === h ? 'var(--accent)' : 'var(--bg3)', color: localDailyTarget === h ? '#000' : 'var(--text2)', border: `1px solid ${localDailyTarget === h ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: localDailyTarget === h ? 700 : 400 }}>
              {h}h
            </div>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Subjects</div>
        {localSubjects.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{s.emoji}</span>
              <span style={{ fontSize: '13px', color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
            <button onClick={() => removeSubject(s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}>Remove</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input type="text" placeholder="New subject (e.g. Python)" value={newSubjectLabel} onChange={e => setNewSubjectLabel(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} />
          <button onClick={addSubject} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
          <button className="settings-save" onClick={saveStudySettings} style={{ flex: 1 }}>Save Study Settings</button>
          <span className="save-ok" style={{ opacity: studyMsg ? 1 : 0 }}>Saved ✓</span>
        </div>
      </Accordion>

      {/* AI COACH */}
      <Accordion title="🤖 AI Coach Settings" subtitle="Configure your personal AI assistant">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Enable AI Coach</div>
            <div onClick={() => {
              const newVal = !localAiEnabled;
              setLocalAiEnabled(newVal);
              localStorage.setItem('ai_enabled', newVal);
              window.dispatchEvent(new Event('storage'));
            }} style={{ width: '44px', height: '24px', background: localAiEnabled ? 'var(--accent)' : 'var(--bg3)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid var(--border2)' }}>
              <div style={{ width: '18px', height: '18px', background: localAiEnabled ? '#000' : 'var(--text3)', borderRadius: '50%', position: 'absolute', top: '2px', left: localAiEnabled ? '22px' : '3px', transition: 'all 0.3s' }}></div>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Gemini API Key</div>
          <input type="password" value={localAiKey} onChange={e => {
            setLocalAiKey(e.target.value);
            localStorage.setItem('gemini_api_key', e.target.value);
          }} placeholder="Paste your API key here"
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Coach Persona (Free Models)</div>
          <select value={localAiModel} onChange={e => {
            setLocalAiModel(e.target.value);
            localStorage.setItem('ai_model', e.target.value);
          }} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest/Free)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Advanced/Free)</option>
            <option value="gemini-pro">Gemini Pro (Legacy/Stable)</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Coach Personality / Instructions</div>
          <input type="text" value={localAiPersona} onChange={e => {
            setLocalAiPersona(e.target.value);
            localStorage.setItem('ai_persona', e.target.value);
          }} placeholder="e.g. Aggressive Drill Sergeant, Helpful Friend"
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '8px', opacity: 0.8 }}>
          Settings are saved locally on this device.
        </div>
      </Accordion>

      {/* DATA */}
      <Accordion title="📦 Data &amp; Export" subtitle="Choose what to export">
        <button className="settings-save" style={{ background: 'var(--accent)', color: '#000', marginBottom: '10px', width: '100%' }} onClick={() => setShowExportModal(true)}>Export Data</button>
        <button className="settings-save" style={{ background: 'var(--bg3)', color: 'var(--text)', marginBottom: '10px', width: '100%' }} onClick={exportData}>Full Backup (JSON)</button>
        <button className="logout-btn" onClick={handleLogout} style={{ width: '100%' }}>Log Out</button>
      </Accordion>

      {/* DEVELOPER OPTIONS */}
      <Accordion title="🧪 Developer Options" subtitle="Tools for testing and debugging">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Developer Mode</div>
            <div onClick={() => {
              const newVal = !devMode;
              setDevMode(newVal);
              localStorage.setItem('dev_mode', newVal);
              
              if (!newVal) {
                // Clear Jan-Apr data
                const monthsToClear = [0, 1, 2, 3]; // Jan, Feb, Mar, Apr
                const clearData = (obj) => {
                  const newObj = { ...obj };
                  Object.keys(newObj).forEach(k => {
                    const date = new Date(k);
                    if (monthsToClear.includes(date.getMonth()) && date.getFullYear() === 2026) {
                      delete newObj[k];
                    }
                  });
                  return newObj;
                };

                const newDB = clearData(DB);
                const newMETA = clearData(META);
                const newFOOD = clearData(FOOD);
                const newBUDGET = { ...BUDGET };
                ['2026-01', '2026-02', '2026-03', '2026-04'].forEach(m => delete newBUDGET[m]);
                const newSTUDY = clearData(STUDY);

                syncData(newDB, localNames, newMETA, newFOOD, SCHEDULE);
                syncBudget(newBUDGET);
                syncStudy(newSTUDY);
                alert('Developer Mode disabled. Jan-Apr dummy data cleared.');
              }
            }} style={{ width: '44px', height: '24px', background: devMode ? 'var(--accent)' : 'var(--bg3)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid var(--border2)' }}>
              <div style={{ width: '18px', height: '18px', background: devMode ? '#000' : 'var(--text3)', borderRadius: '50%', position: 'absolute', top: '2px', left: devMode ? '22px' : '3px', transition: 'all 0.3s' }}></div>
            </div>
          </div>
        </div>

        {devMode && (
          <>
            <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '12px', lineHeight: 1.4 }}>
              Seed your account with dummy data from January to April. This will overwrite existing data for those dates.
            </p>
            <button className="settings-save" style={{ background: 'var(--bg3)', color: 'var(--text)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => {
                const seed = generateSeedData();
                syncData({ ...DB, ...seed.DB }, localNames, { ...META, ...seed.META }, FOOD, SCHEDULE);
                syncBudget({ ...BUDGET, ...seed.BUDGET });
                syncStudy({ ...STUDY, ...seed.STUDY });
                alert('Dummy data for Jan-Apr generated successfully!');
              }}>
              <Beaker size={16} /> Seed Dummy Data (Jan-Apr)
            </button>
          </>
        )}
      </Accordion>

      <div style={{ height: '20px' }} />

      {showSchedModal && (
        <div className="modal-overlay" onClick={() => setShowSchedModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Save Schedule</h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px', lineHeight: 1.5 }}>Do you want to save this permanently or just for this week?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="settings-save" onClick={() => saveSchedule('fullTime')} style={{ background: 'var(--accent)', color: '#000' }}>Full Time (Permanent)</button>
              <button className="settings-save" onClick={() => saveSchedule('thisWeek')} style={{ background: 'var(--bg3)', color: 'var(--text)' }}>This Week Only</button>
              <button className="settings-save" onClick={() => setShowSchedModal(false)} style={{ background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Export Data</h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px', lineHeight: 1.5 }}>What would you like to export?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="settings-save" onClick={() => { exportCSV('gym'); setShowExportModal(false); }} style={{ background: 'var(--bg3)', color: 'var(--text)' }}>🏋️ Gym &amp; Diet Only</button>
              <button className="settings-save" onClick={() => { exportBudgetCSV(); setShowExportModal(false); }} style={{ background: 'var(--bg3)', color: 'var(--text)' }}>💰 Budget Only</button>
              <button className="settings-save" onClick={() => { exportStudyCSV(); setShowExportModal(false); }} style={{ background: 'var(--bg3)', color: 'var(--text)' }}>📚 Study Only</button>
              <button className="settings-save" onClick={() => { exportCSV('all'); setShowExportModal(false); }} style={{ background: 'var(--accent)', color: '#000' }}>📦 All Data</button>
              <button className="settings-save" onClick={() => setShowExportModal(false)} style={{ background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
