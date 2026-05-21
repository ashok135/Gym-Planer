import React, { useState, useEffect, useMemo } from 'react';
import { DEFAULT_PLAN, DAYS_FULL, DEFAULT_DIET_PLAN, MONTHS, dateKey, EXERCISE_GIFS } from '../data';
import { Beaker } from 'lucide-react';
import { generateSeedData } from '../utils/seeder';
import Accordion from './shared/Accordion';
import ProfileSettings from './settings/ProfileSettings';
import AISettings from './settings/AISettings';
import DietPlanBuilder from './diet/DietPlanBuilder';

export default function Settings({ 
  NAMES, syncData, DB, META, FOOD, handleLogout, SCHEDULE, 
  BUDGET_SETTINGS, syncBudget, STUDY_SETTINGS, syncStudy, 
  BUDGET, STUDY, syncAiSettings, profileInfo, syncProfileInfo,
  workoutPlans, syncWorkoutPlans, DIET_PLAN, syncDietPlan
}) {
  const [localNames, setLocalNames] = useState(NAMES);
  const [saveMsg, setSaveMsg] = useState(false);
  
  const getFullSchedule = (sched) => {
    const full = {};
    [1, 2, 3, 4, 5, 6, 0].forEach(dow => {
      if (sched && sched[dow] !== undefined) {
        full[dow] = Number(sched[dow]);
      } else {
        full[dow] = dow === 4 ? 1 : dow === 5 ? 2 : dow === 6 ? 3 : dow;
      }
    });
    return full;
  };

  const [localSchedule, setLocalSchedule] = useState(() => getFullSchedule(SCHEDULE?.fullTime));
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
  const [devMode, setDevMode] = useState(() => localStorage.getItem('dev_mode') === 'true');

  const [selectedSplitToEdit, setSelectedSplitToEdit] = useState(1);
  const [newMuscleGroupName, setNewMuscleGroupName] = useState('');

  useEffect(() => {
    if (NAMES) setLocalNames(NAMES);
  }, [NAMES]);

  useEffect(() => {
    setLocalSchedule(getFullSchedule(SCHEDULE?.fullTime));
  }, [SCHEDULE]);

  useEffect(() => {
    if (BUDGET_SETTINGS) {
      setLocalIncome(BUDGET_SETTINGS.income || 22400);
      if (BUDGET_SETTINGS.categories?.length) {
        setLocalCategories(BUDGET_SETTINGS.categories);
      }
    }
  }, [BUDGET_SETTINGS]);

  useEffect(() => {
    if (STUDY_SETTINGS) {
      setLocalDailyTarget(STUDY_SETTINGS.dailyTarget || 4);
      setLocalSubjects(STUDY_SETTINGS.subjects || []);
    }
  }, [STUDY_SETTINGS]);

  const plansArray = useMemo(() => {
    if (!workoutPlans) return [];
    if (Array.isArray(workoutPlans)) return workoutPlans;
    return Object.entries(workoutPlans).map(([id, val]) => ({
      id: Number(id),
      ...val
    }));
  }, [workoutPlans]);

  const exerciseSuggestions = useMemo(() => {
    if (!EXERCISE_GIFS) return [];
    return Object.keys(EXERCISE_GIFS).map(name => {
      return name
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    });
  }, []);

  const deleteMuscleGroup = (splitId, muscleName) => {
    const updated = plansArray.map(p => {
      if (p.id === splitId) {
        return {
          ...p,
          muscles: p.muscles.filter(m => m.name !== muscleName)
        };
      }
      return p;
    });
    if (!Array.isArray(workoutPlans)) {
      const obj = {};
      updated.forEach(x => { obj[x.id] = x; });
      syncWorkoutPlans(obj);
    } else {
      syncWorkoutPlans(updated);
    }
  };

  const deleteExercise = (splitId, muscleName, exerciseName) => {
    const updated = plansArray.map(p => {
      if (p.id === splitId) {
        return {
          ...p,
          muscles: p.muscles.map(m => {
            if (m.name === muscleName) {
              return {
                ...m,
                exercises: m.exercises.filter(ex => ex !== exerciseName)
              };
            }
            return m;
          })
        };
      }
      return p;
    });
    if (!Array.isArray(workoutPlans)) {
      const obj = {};
      updated.forEach(x => { obj[x.id] = x; });
      syncWorkoutPlans(obj);
    } else {
      syncWorkoutPlans(updated);
    }
  };

  const addCustomExercise = (splitId, muscleName, exerciseName) => {
    if (!exerciseName.trim()) return;
    const updated = plansArray.map(p => {
      if (p.id === splitId) {
        return {
          ...p,
          muscles: p.muscles.map(m => {
            if (m.name === muscleName) {
              return {
                ...m,
                exercises: [...m.exercises, exerciseName.trim()]
              };
            }
            return m;
          })
        };
      }
      return p;
    });
    if (!Array.isArray(workoutPlans)) {
      const obj = {};
      updated.forEach(x => { obj[x.id] = x; });
      syncWorkoutPlans(obj);
    } else {
      syncWorkoutPlans(updated);
    }
  };

  const addMuscleGroup = (splitId) => {
    if (!newMuscleGroupName.trim()) return;
    const updated = plansArray.map(p => {
      if (p.id === splitId) {
        if (p.muscles.some(m => m.name.toLowerCase() === newMuscleGroupName.trim().toLowerCase())) return p;
        return {
          ...p,
          muscles: [...p.muscles, { name: newMuscleGroupName.trim(), exercises: [] }]
        };
      }
      return p;
    });
    if (!Array.isArray(workoutPlans)) {
      const obj = {};
      updated.forEach(x => { obj[x.id] = x; });
      syncWorkoutPlans(obj);
    } else {
      syncWorkoutPlans(updated);
    }
    setNewMuscleGroupName('');
  };

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
    { id: 7, label: 'Full Body 💪' },
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
    try {
      const allKeys = Array.from(new Set([
        ...Object.keys(DB || {}), 
        ...Object.keys(META || {}), 
        ...Object.keys(FOOD || {})
      ])).sort();
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
        if (isNaN(kd.getTime())) return;
        const dow = kd.getDay();
        const dayName = DAYS_FULL[dow] || '';
        const dayNum = kd.getDate();
        const monthName = MONTHS[kd.getMonth()] || '';
        const year = kd.getFullYear();
        const dateCols = `${k},${dayName},${dayNum},${monthName},${year}`;
        
        const m = META?.[k];
        if(m) {
          if(m.status) csv += `${dateCols},Meta,Daily Status,,,,,"${m.status}"\n`;
          if(m.bw) csv += `${dateCols},Meta,Bodyweight,,,,,"${m.bw} kg"\n`;
          if(m.energy) csv += `${dateCols},Meta,Energy,,,,,"${m.energy} stars"\n`;
          if(m.notes) csv += `${dateCols},Meta,Notes,,,,,${escapeCSV(m.notes)}\n`;
        }
        
        const entry = DB?.[k];
        if(entry) {
          Object.keys(entry).filter(ek => !['meta', 'customName'].includes(ek)).forEach(ek => {
            const v = entry[ek];
            if(v && (v.s || v.r || v.w)) {
              const customKey = Object.keys(localNames || {}).find(nameKey => nameKey.endsWith('_' + ek));
              let exName = customKey ? localNames[customKey] : ek;
              if(entry[ek].customName) exName = entry[ek].customName;
              csv += `${dateCols},Workout,${escapeCSV(exName)},${v.s||0},${v.r||0},${v.w||0},,\n`;
            }
          });
        }
        
        const f = FOOD?.[k];
        if(f) {
          if(f.water) csv += `${dateCols},Habit,Water 3-4L,,,,,Completed\n`;
          if(f.sleep) csv += `${dateCols},Habit,Sleep 7-8h,,,,,Completed\n`;
          if(f.junk) csv += `${dateCols},Habit,No Junk,,,,,Completed\n`;
          
          if(f.items) {
            const activePlan = (DIET_PLAN && DIET_PLAN[dow]?.length) ? DIET_PLAN[dow] : (DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1]);
            if (activePlan) {
              activePlan.forEach(meal => {
                if (meal && meal.items) {
                  meal.items.forEach(i => {
                    if(f.items[i.id]) {
                      const customName = (f.custom && f.custom[i.id]) ? f.custom[i.id] : i.name;
                      csv += `${dateCols},Diet,${escapeCSV(customName)},,,,${i.p || 0},\n`;
                    }
                  });
                }
              });
            }
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
    } catch (err) {
      console.error("CSV Gym/Habits/Diet export failed:", err);
      alert("Failed to export Gym/Habits/Diet CSV. Check browser console for details.");
    }
  };

  const exportBudgetCSV = () => {
    try {
      let csv = 'Date,Category,Amount,Note\n';
      Object.entries(BUDGET || {}).forEach(([mk, md]) => {
        if (md && md.entries) {
          md.entries.forEach(e => {
            if (e) {
              csv += `${e.date || ''},${e.category || ''},${e.amount || 0},"${(e.note||'').replace(/"/g,'""')}"\n`;
            }
          });
        }
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'LifeTraker_Budget.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Budget CSV export failed:", err);
      alert("Failed to export Budget CSV.");
    }
  };

  const exportStudyCSV = () => {
    try {
      let csv = 'Date,Subject,Hours,Learned\n';
      Object.entries(STUDY || {}).forEach(([dk, sd]) => {
        if (sd && sd.sessions) {
          sd.sessions.forEach(s => {
            if (s) {
              csv += `${dk},${s.subjectId || ''},${s.hours || 0},"${(s.learned||'').replace(/"/g,'""')}"\n`;
            }
          });
        }
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'LifeTraker_Study.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Study CSV export failed:", err);
      alert("Failed to export Study CSV.");
    }
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
                  {plansArray.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', width: '100%' }}>
          <button className="settings-save" onClick={() => setShowSchedModal(true)} style={{
            flex: 1,
            background: schedMsg ? '#10B981' : 'var(--accent)',
            color: schedMsg ? '#fff' : '#000',
            boxShadow: schedMsg ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 'bold'
          }}>
            {schedMsg ? 'Saved ✓' : 'Save Schedule'}
          </button>
        </div>
      </Accordion>

      {/* 💪 CUSTOM WORKOUT SPLITS BUILDER */}
      <Accordion title="💪 Workout Split Builder" subtitle="Add muscle groups, custom exercises, or delete routines">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Select Workout Split to Customize</div>
            <select value={selectedSplitToEdit} onChange={e => setSelectedSplitToEdit(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', outline: 'none', fontSize: '13px', fontWeight: 600 }}>
              {plansArray.map(p => <option key={p.id} value={p.id}>{p.label} (Split ID: {p.id})</option>)}
            </select>
          </div>

          {(() => {
            const currentPlan = plansArray.find(p => p.id === selectedSplitToEdit) || plansArray[0];
            return (
              <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '14px' }}>{currentPlan.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{currentPlan.muscles.length} Muscle Groups</div>
                </div>

                {currentPlan.muscles.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No muscle groups in this split. Add one below!</div>
                ) : (
                  currentPlan.muscles.map((muscle, mIdx) => (
                    <div key={muscle.name} style={{ marginBottom: '14px', borderBottom: mIdx < currentPlan.muscles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{muscle.name}</span>
                        <button onClick={() => deleteMuscleGroup(selectedSplitToEdit, muscle.name)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer' }}>
                          Remove Group
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                        {muscle.exercises.map((ex, exIdx) => (
                          <div key={exIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{ex}</span>
                            <button onClick={() => deleteExercise(selectedSplitToEdit, muscle.name, ex)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: '13px', cursor: 'pointer', padding: '0 4px', fontWeight: 'bold' }}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input type="text" placeholder={`Add exercise to ${muscle.name}...`} id={`new-ex-${muscle.name}`} list="exercise-suggestions"
                          style={{ flex: 1, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '6px', color: 'var(--text)', fontSize: '12px' }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              addCustomExercise(selectedSplitToEdit, muscle.name, e.target.value);
                              e.target.value = '';
                            }
                          }} />
                        <button onClick={() => {
                          const input = document.getElementById(`new-ex-${muscle.name}`);
                          if (input && input.value.trim()) {
                            addCustomExercise(selectedSplitToEdit, muscle.name, input.value.trim());
                            input.value = '';
                          }
                        }}
                          style={{ padding: '4px 10px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '6px', color: 'var(--text)', fontSize: '12px', cursor: 'pointer' }}>
                          + Add
                        </button>
                      </div>
                      <datalist id="exercise-suggestions">
                        {exerciseSuggestions.map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                  ))
                )}

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Add New Muscle Group to split</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="e.g. Forearms, Core" value={newMuscleGroupName} onChange={e => setNewMuscleGroupName(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} />
                    <button onClick={() => addMuscleGroup(selectedSplitToEdit)}
                      style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                      + Add Group
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </Accordion>

      {/* 🍽️ DIET PLAN BUILDER */}
      <Accordion title="🍽️ Diet Plan Builder" subtitle="Configure daily meals, dishes, and protein values">
        <div style={{ margin: '-10px -16px -16px' }}>
          <DietPlanBuilder DIET_PLAN={DIET_PLAN} syncDietPlan={syncDietPlan} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', width: '100%' }}>
          <button className="settings-save" onClick={saveBudgetSettings} style={{
            flex: 1,
            background: budgetMsg ? '#10B981' : 'var(--accent)',
            color: budgetMsg ? '#fff' : '#000',
            boxShadow: budgetMsg ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 'bold'
          }}>
            {budgetMsg ? 'Saved ✓' : 'Save Budget Settings'}
          </button>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', width: '100%' }}>
          <button className="settings-save" onClick={saveStudySettings} style={{
            flex: 1,
            background: studyMsg ? '#10B981' : 'var(--accent)',
            color: studyMsg ? '#fff' : '#000',
            boxShadow: studyMsg ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 'bold'
          }}>
            {studyMsg ? 'Saved ✓' : 'Save Study Settings'}
          </button>
        </div>
      </Accordion>

      {/* PROFILE & RESUME */}
      <ProfileSettings profileInfo={profileInfo} syncProfileInfo={syncProfileInfo} />

      {/* AI COACH */}
      <AISettings syncAiSettings={syncAiSettings} />

      {/* DATA & EXPORT */}
      <Accordion title="📦 Data &amp; Export" subtitle="Backup and export your data">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button className="settings-save"
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => setShowExportModal(true)}>
            📊 Export CSV
          </button>
          <button className="settings-save"
            style={{ background: 'var(--bg3)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={exportData}>
            💾 Full Backup
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '10px', lineHeight: 1.5 }}>
          CSV exports your gym, diet, budget and study data. Full Backup saves everything as a JSON file.
        </div>
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
                const monthsToClear = [0, 1, 2, 3];
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

      {/* LOGOUT */}
      <div style={{ marginTop: '8px', marginBottom: '8px', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,77,77,0.2)', background: 'rgba(255,77,77,0.04)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px' }}>Signed in to your LifeTraker account</div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '13px', borderRadius: '10px',
            background: 'rgba(255,77,77,0.12)', color: 'var(--red)',
            border: '1px solid rgba(255,77,77,0.3)', fontSize: '14px',
            fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,77,77,0.22)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,77,77,0.12)'}
        >
          🚪 Log Out
        </button>
      </div>

      <div style={{ height: '20px' }} />

      {showSchedModal && (
        <div className="modal-overlay open" onClick={() => setShowSchedModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>Apply Schedule Options</div>
            <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '18px' }}>
              Apply to <strong>"Permanent Split"</strong> (saves default split for weekdays) or <strong>"This Week Only"</strong> (overrides splits starting from today).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => saveSchedule('fullTime')} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                📅 Permanent Split (All Weeks)
              </button>
              <button onClick={() => saveSchedule('thisWeek')} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                📆 This Week Only (Temporary)
              </button>
              <button onClick={() => setShowSchedModal(false)} style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--text3)', border: 'none', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="modal-overlay open" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>📊 Export Data to CSV</div>
            <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '20px' }}>
              Choose a specific dataset or download the combined workspace report.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => { exportCSV(); setShowExportModal(false); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏋️ Gym, Habits &amp; Diet CSV
              </button>
              <button onClick={() => { exportBudgetCSV(); setShowExportModal(false); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💰 Budget Ledger CSV
              </button>
              <button onClick={() => { exportStudyCSV(); setShowExportModal(false); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📚 Study Sessions CSV
              </button>
              <button onClick={() => setShowExportModal(false)} style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--text3)', border: 'none', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
