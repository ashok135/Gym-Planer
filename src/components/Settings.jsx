import React, { useState, useEffect } from 'react';
import { DEFAULT_PLAN, DAYS_FULL, DEFAULT_DIET_PLAN, MONTHS, dateKey } from '../data';
import { ChevronDown, Beaker } from 'lucide-react';
import { generateSeedData } from '../utils/seeder';

const getJobSuggestions = (input) => {
  const clean = input.trim();
  if (!clean) {
    return [
      'React Developer', 'WordPress Developer', 'Frontend Developer', 
      'Fullstack Developer', 'Node.js Developer', 'Django Developer', 
      'UI/UX Designer', 'Mobile App Developer'
    ];
  }
  const lower = clean.toLowerCase();
  if (lower.startsWith('re') || lower.includes('react')) {
    return ['React Developer', 'React Engineer', 'React Frontend Developer', 'React Native Developer', 'React.js Specialist', 'Senior React Developer', 'Fullstack React Developer'];
  }
  if (lower.startsWith('wo') || lower.includes('word') || lower.includes('wp')) {
    return ['WordPress Developer', 'WordPress Plugin Developer', 'WordPress Theme Developer', 'WordPress Web Designer', 'WordPress Elementor Specialist', 'WordPress WooCommerce Developer', 'WordPress Theme Architect'];
  }
  if (lower.startsWith('fr') || lower.includes('front')) {
    return ['Frontend Developer', 'Frontend Engineer', 'Frontend React Developer', 'Frontend UI Developer', 'Senior Frontend Engineer'];
  }
  if (lower.startsWith('py') || lower.includes('python') || lower.includes('dj')) {
    return ['Python Developer', 'Django Developer', 'Python Django Engineer', 'Python Backend Developer', 'Python Data Scientist'];
  }
  if (lower.startsWith('no') || lower.includes('node')) {
    return ['Node.js Developer', 'Node.js Backend Developer', 'Fullstack Node.js Developer', 'Node.js Software Engineer'];
  }
  if (lower.startsWith('ph') || lower.includes('php') || lower.includes('lar')) {
    return ['PHP Developer', 'Laravel Developer', 'PHP Laravel Developer', 'Fullstack PHP Developer', 'Laravel Web Developer'];
  }
  if (lower.startsWith('ui') || lower.includes('ux') || lower.includes('des')) {
    return ['UI/UX Designer', 'User Interface Designer', 'User Experience Designer', 'Web Designer', 'Product Designer'];
  }
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return [
    `${capitalized} Developer`,
    `${capitalized} Engineer`,
    `Senior ${capitalized} Developer`,
    `Junior ${capitalized} Developer`,
    `${capitalized} Consultant`,
    `Fullstack ${capitalized} Developer`,
    `${capitalized} Technical Specialist`
  ];
};

const getCitySuggestions = (input) => {
  const clean = input.trim();
  if (!clean) {
    return ['Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Noida', 'Remote'];
  }
  const lower = clean.toLowerCase();
  const list = ['Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Noida', 'Gurgaon', 'Kolkata', 'San Francisco', 'New York', 'London', 'Remote'];
  return list.filter(item => item.toLowerCase().includes(lower));
};

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

export default function Settings({ NAMES, syncData, DB, META, FOOD, handleLogout, SCHEDULE, BUDGET_SETTINGS, syncBudget, STUDY_SETTINGS, syncStudy, BUDGET, STUDY, syncAiSettings, profileInfo = { name: '', resume: '', targetRoles: ['React Developer', 'WordPress Developer', 'Frontend Developer'], preferredLocations: ['Bangalore', 'Chennai', 'Remote'], workTypes: ['Remote', 'Hybrid'] }, syncProfileInfo }) {
  const [localNames, setLocalNames] = useState(NAMES);
  const [profileName, setProfileName] = useState(profileInfo?.name || '');
  const [profileResume, setProfileResume] = useState(profileInfo?.resume || '');
  const [targetRoles, setTargetRoles] = useState(profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer']);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [preferredLocations, setPreferredLocations] = useState(profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote']);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [workTypes, setWorkTypes] = useState(profileInfo?.workTypes || ['Remote', 'Hybrid']);
  const [profileMsg, setProfileMsg] = useState(false);
  const [roleFocused, setRoleFocused] = useState(false);
  const [locFocused, setLocFocused] = useState(false);

  useEffect(() => {
    setProfileName(profileInfo?.name || '');
    setProfileResume(profileInfo?.resume || '');
    setTargetRoles(profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer']);
    setPreferredLocations(profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote']);
    setWorkTypes(profileInfo?.workTypes || ['Remote', 'Hybrid']);
  }, [profileInfo]);
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
  const [localProvider, setLocalProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [localOpenrouterKey, setLocalOpenrouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [localOpenrouterModel, setLocalOpenrouterModel] = useState(() => localStorage.getItem('openrouter_model') || 'openrouter/free');
  const [devMode, setDevMode] = useState(() => localStorage.getItem('dev_mode') === 'true');

  React.useEffect(() => {
    const handleStorage = () => {
      setLocalAiEnabled(localStorage.getItem('ai_enabled') === 'true');
      setLocalAiKey(localStorage.getItem('gemini_api_key') || '');
      setLocalAiModel(localStorage.getItem('ai_model') || 'gemini-1.5-flash');
      setLocalAiPersona(localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
      setLocalProvider(localStorage.getItem('ai_provider') || 'gemini');
      setLocalOpenrouterKey(localStorage.getItem('openrouter_api_key') || '');
      setLocalOpenrouterModel(localStorage.getItem('openrouter_model') || 'openrouter/free');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

      {/* PROFILE & RESUME */}
      <Accordion title="👤 Profile &amp; Resume Details" subtitle="Set your name and professional background for Lucy">
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Your Name / Nickname</div>
          <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g. Ashok"
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Resume / Profile Summary</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px' }}>
            Paste your skills, experience, education, or achievements. Lucy will read this to customize your interview prep!
          </div>
          <textarea value={profileResume} onChange={e => setProfileResume(e.target.value)} placeholder="e.g. JavaScript, React, Node.js developer with 2 years of experience. Education: B.Tech in CSE..."
            style={{ width: '100%', height: '120px', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
        </div>

        {/* Preferred Locations Input & Tags */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Preferred Job Locations (Cities / Remote)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {preferredLocations.map(loc => (
              <div key={loc}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', background: 'rgba(77, 159, 255, 0.1)', color: '#4D9FFF', border: '1px solid rgba(77, 159, 255, 0.3)', fontWeight: 700 }}>
                <span>📍 {loc}</span>
                <span onClick={() => {
                  if (preferredLocations.length > 1) {
                    setPreferredLocations(preferredLocations.filter(l => l !== loc));
                  }
                }} style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '14px', marginLeft: '4px', fontWeight: 'bold' }}>×</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="text" placeholder="Add location (e.g. Hyderabad, Chennai)" value={newLocationInput} 
                onChange={e => setNewLocationInput(e.target.value)}
                onFocus={() => setLocFocused(true)}
                onBlur={() => setTimeout(() => setLocFocused(false), 200)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
              {locFocused && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '120px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  {getCitySuggestions(newLocationInput).map(item => (
                    <div key={item} onMouseDown={() => {
                      setNewLocationInput(item);
                      setLocFocused(false);
                    }}
                      style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text2)', cursor: 'pointer', borderBottom: '1px solid var(--border2)', background: 'transparent', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}>
                      📍 {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => {
              if (newLocationInput.trim() && !preferredLocations.includes(newLocationInput.trim())) {
                setPreferredLocations([...preferredLocations, newLocationInput.trim()]);
                setNewLocationInput('');
              }
            }}
              style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', height: '37px' }}>
              + Add
            </button>
          </div>
        </div>

        {/* Work Type Checkbox Selector */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Preferred Work Modes</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'Remote', label: '🏠 Remote' },
              { id: 'Hybrid', label: '🤝 Hybrid' },
              { id: 'On-site', label: '🏢 On-site (Office)' }
            ].map(mode => {
              const isSelected = workTypes.includes(mode.id);
              return (
                <div key={mode.id} onClick={() => {
                  if (isSelected) {
                    if (workTypes.length > 1) {
                      setWorkTypes(workTypes.filter(t => t !== mode.id));
                    }
                  } else {
                    setWorkTypes([...workTypes, mode.id]);
                  }
                }}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', textAlign: 'center', cursor: 'pointer', background: isSelected ? 'var(--accent)' : 'var(--bg3)', color: isSelected ? '#000' : 'var(--text2)', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700, transition: 'all 0.2s' }}>
                  {mode.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Target Roles Tag Box */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Target Job Roles</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {targetRoles.map(role => (
              <div key={role}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', background: 'rgba(200, 241, 53, 0.1)', color: 'var(--accent)', border: '1px solid rgba(200, 241, 53, 0.3)', fontWeight: 700 }}>
                <span>⚛️ {role}</span>
                <span onClick={() => {
                  if (targetRoles.length > 1) {
                    setTargetRoles(targetRoles.filter(r => r !== role));
                  }
                }} style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '14px', marginLeft: '4px', fontWeight: 'bold' }}>×</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="text" placeholder="Add custom role (e.g. Node Developer)" value={newRoleInput} 
                onChange={e => setNewRoleInput(e.target.value)}
                onFocus={() => setRoleFocused(true)}
                onBlur={() => setTimeout(() => setRoleFocused(false), 200)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
              {roleFocused && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '120px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  {getJobSuggestions(newRoleInput).map(item => (
                    <div key={item} onMouseDown={() => {
                      setNewRoleInput(item);
                      setRoleFocused(false);
                    }}
                      style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text2)', cursor: 'pointer', borderBottom: '1px solid var(--border2)', background: 'transparent', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}>
                      🔍 {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => {
              if (newRoleInput.trim() && !targetRoles.includes(newRoleInput.trim())) {
                setTargetRoles([...targetRoles, newRoleInput.trim()]);
                setNewRoleInput('');
              }
            }}
              style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', height: '37px' }}>
              + Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
          <button className="settings-save" onClick={async () => {
            if (syncProfileInfo) {
              await syncProfileInfo({ 
                name: profileName.trim(), 
                resume: profileResume.trim(),
                targetRoles,
                preferredLocations,
                workTypes
              });
              setProfileMsg(true);
              setTimeout(() => setProfileMsg(false), 2000);
            }
          }} style={{ flex: 1 }}>Save Profile</button>
          <span className="save-ok" style={{ opacity: profileMsg ? 1 : 0 }}>Saved ✓</span>
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
              if (syncAiSettings) {
                syncAiSettings({ enabled: newVal });
              } else {
                localStorage.setItem('ai_enabled', newVal ? 'true' : 'false');
                window.dispatchEvent(new Event('storage'));
              }
            }} style={{ width: '44px', height: '24px', background: localAiEnabled ? 'var(--accent)' : 'var(--bg3)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid var(--border2)' }}>
              <div style={{ width: '18px', height: '18px', background: localAiEnabled ? '#000' : 'var(--text3)', borderRadius: '50%', position: 'absolute', top: '2px', left: localAiEnabled ? '22px' : '3px', transition: 'all 0.3s' }}></div>
            </div>
          </div>
        </div>

        {/* AI Provider Selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Select AI Provider</div>
          <select 
            value={localProvider} 
            onChange={e => {
              const val = e.target.value;
              setLocalProvider(val);
              if (syncAiSettings) {
                syncAiSettings({ provider: val });
              } else {
                localStorage.setItem('ai_provider', val);
                window.dispatchEvent(new Event('storage'));
              }
            }}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
          >
            <option value="gemini">Google Gemini (Direct)</option>
            <option value="openrouter">OpenRouter (Free Auto-Router)</option>
          </select>
        </div>

        {/* Gemini Configuration */}
        {localProvider === 'gemini' && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Gemini API Key</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>
                Get a free key in 10s at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>aistudio.google.com</a>
              </div>
              <input type="password" value={localAiKey} onChange={e => {
                const val = e.target.value;
                setLocalAiKey(val);
                if (syncAiSettings) {
                  syncAiSettings({ apiKey: val });
                } else {
                  localStorage.setItem('gemini_api_key', val);
                  window.dispatchEvent(new Event('storage'));
                }
              }} placeholder="Paste your Gemini key here"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Gemini Model</div>
              <select value={localAiModel} onChange={e => {
                const val = e.target.value;
                setLocalAiModel(val);
                if (syncAiSettings) {
                  syncAiSettings({ model: val });
                } else {
                  localStorage.setItem('ai_model', val);
                  window.dispatchEvent(new Event('storage'));
                }
              }} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest/Free)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Advanced/Free)</option>
                <option value="gemini-pro">Gemini Pro (Legacy/Stable)</option>
              </select>
            </div>
          </>
        )}

        {/* OpenRouter Configuration */}
        {localProvider === 'openrouter' && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>OpenRouter API Key</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>
                Get a free key at <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>openrouter.ai</a> (Access Llama 3 / Gemma Free!)
              </div>
              <input type="password" value={localOpenrouterKey} onChange={e => {
                const val = e.target.value;
                setLocalOpenrouterKey(val);
                if (syncAiSettings) {
                  syncAiSettings({ openrouterKey: val });
                } else {
                  localStorage.setItem('openrouter_api_key', val);
                  window.dispatchEvent(new Event('storage'));
                }
              }} placeholder="Paste your OpenRouter key here"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>OpenRouter Free Model</div>
              <select value={localOpenrouterModel} onChange={e => {
                const val = e.target.value;
                setLocalOpenrouterModel(val);
                if (syncAiSettings) {
                  syncAiSettings({ openrouterModel: val });
                } else {
                  localStorage.setItem('openrouter_model', val);
                  window.dispatchEvent(new Event('storage'));
                }
              }} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}>
                <option value="openrouter/free">Auto-Select Active Free Model (Highly Recommended!)</option>
                <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free/Fast)</option>
              </select>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', fontStyle: 'italic' }}>
                💡 "Auto-Select" always routes to an active free model even if others are down.
              </div>
            </div>
          </>
        )}

        {/* Common Coach Persona/Personality Instructions */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Coach Personality / Instructions</div>
          <input type="text" value={localAiPersona} onChange={e => {
            const val = e.target.value;
            setLocalAiPersona(val);
            if (syncAiSettings) {
              syncAiSettings({ persona: val });
            } else {
              localStorage.setItem('ai_persona', val);
              window.dispatchEvent(new Event('storage'));
            }
          }} placeholder="e.g. Aggressive Drill Sergeant, Helpful Friend"
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '8px', opacity: 0.8 }}>
          Settings are synchronized with your account securely in the cloud.
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
