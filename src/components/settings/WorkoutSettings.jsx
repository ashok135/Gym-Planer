import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Dumbbell } from 'lucide-react';
import Accordion from '../shared/Accordion';
import { DAYS_FULL, DEFAULT_PLAN, dateKey, EXERCISE_GIFS } from '../../data';

export default function WorkoutSettings({ workoutPlans, syncWorkoutPlans, SCHEDULE, syncData, DB, localNames, META, FOOD }) {
  const getFullSchedule = (sched) => {
    const full = {};
    [1, 2, 3, 4, 5, 6, 0].forEach(dow => {
      if (sched && sched[dow] !== undefined) {
        full[dow] = Number(sched[dow]);
      } else {
        full[dow] = dow;
      }
    });
    return full;
  };

  const [localSchedule, setLocalSchedule] = useState(() => getFullSchedule(SCHEDULE?.fullTime));
  const [schedMsg, setSchedMsg] = useState(false);

  // Keep localSchedule in sync when SCHEDULE prop updates from Firebase
  useEffect(() => {
    if (SCHEDULE?.fullTime) {
      setLocalSchedule(getFullSchedule(SCHEDULE.fullTime));
    }
  }, [SCHEDULE]);
  const [showSchedModal, setShowSchedModal] = useState(false);

  const [selectedSplitToEdit, setSelectedSplitToEdit] = useState(1);
  const [newMuscleGroupName, setNewMuscleGroupName] = useState('');
  const [newSplitName, setNewSplitName] = useState('');

  const plansArray = useMemo(() => {
    if (!workoutPlans) return [];
    if (Array.isArray(workoutPlans)) return workoutPlans;
    return Object.entries(workoutPlans).map(([id, val]) => ({
      id: Number(id),
      ...val
    }));
  }, [workoutPlans]);

  const getSplitDisplayName = (s) => {
    if (s.id === 0) return `${s.label} (Sunday)`;
    if (s.id === 1) return `${s.label} (Monday)`;
    if (s.id === 2) return `${s.label} (Tuesday)`;
    if (s.id === 3) return `${s.label} (Wednesday)`;
    if (s.id === 4) return `${s.label} (Thursday)`;
    if (s.id === 5) return `${s.label} (Friday)`;
    if (s.id === 6) return `${s.label} (Saturday)`;
    if (s.id === 7) return `${s.label} (Full Body)`;
    return `${s.label} (Split ID: ${s.id})`;
  };

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
              if (m.exercises.some(ex => ex.toLowerCase() === exerciseName.trim().toLowerCase())) return m;
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

  const renameWorkoutSplit = (splitId, newLabel) => {
    if (!newLabel.trim()) return;
    const updated = plansArray.map(p => {
      if (p.id === splitId) {
        return { ...p, label: newLabel.trim() };
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

  const createNewSplit = () => {
    if (!newSplitName.trim()) return;
    const newId = Date.now();
    const newSplit = {
      id: newId,
      label: newSplitName.trim(),
      muscles: []
    };
    if (!Array.isArray(workoutPlans)) {
      const obj = { ...workoutPlans };
      obj[newId] = newSplit;
      syncWorkoutPlans(obj);
    } else {
      syncWorkoutPlans([...plansArray, newSplit]);
    }
    setSelectedSplitToEdit(newId);
    setNewSplitName('');
  };

  const saveSchedule = (type) => {
    try {
      const newSched = { fullTime: { ...(SCHEDULE?.fullTime || {}) }, thisWeek: { ...(SCHEDULE?.thisWeek || {}) } };
      if (type === 'fullTime') {
        // Ensure keys are stored as numbers for consistent lookup
        const cleanSchedule = {};
        [1, 2, 3, 4, 5, 6, 0].forEach(dow => {
          cleanSchedule[dow] = (localSchedule && localSchedule[dow] !== undefined) ? Number(localSchedule[dow]) : dow;
        });
        newSched.fullTime = cleanSchedule;
      } else {
        // Cover the full current week (Monday through Sunday)
        // Find the Monday of this week first
        const today = new Date();
        const currentDow = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const mondayOffset = currentDow === 0 ? -6 : 1 - currentDow;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        
        for(let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dk = dateKey(d);
          const dow = d.getDay();
          newSched.thisWeek[dk] = (localSchedule && localSchedule[dow] !== undefined) ? Number(localSchedule[dow]) : (DEFAULT_PLAN?.[dow]?.id || dow);
        }
      }
      syncData(DB, localNames, META, FOOD, newSched);
      setShowSchedModal(false);
      setSchedMsg(true);
      setTimeout(() => setSchedMsg(false), 2000);
    } catch (err) {
      console.error("Save schedule failed:", err);
      alert("Failed to save schedule settings: " + err.message);
    }
  };

  return (
    <>
      {/* WORKOUT SCHEDULE */}
      <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} style={{ color: 'var(--accent)' }} /> Weekly Schedule Planner</span>} subtitle="Customize your workout split per day" defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3,4,5,6,0].map(dow => {
            const currentSplit = localSchedule[dow] !== undefined ? localSchedule[dow] : dow;
            return (
              <div key={dow} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontWeight: 400, color: 'var(--text2)', minWidth: '80px', flexShrink: 0, fontSize: '13px' }}>{DAYS_FULL[dow]}</div>
                <select style={{ flex: 1, minWidth: 0, width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', outline: 'none', fontSize: '12px', fontWeight: 400 }}
                  value={currentSplit} onChange={e => setLocalSchedule(prev => ({ ...prev, [dow]: parseInt(e.target.value) }))}>
                  {plansArray.map(s => <option key={s.id} value={s.id}>{getSplitDisplayName(s)}</option>)}
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
            fontWeight: 400,
          }}>
            {schedMsg ? 'Saved ✓' : 'Save Schedule'}
          </button>
        </div>
        {SCHEDULE?.thisWeek && Object.keys(SCHEDULE.thisWeek).length > 0 && (
          <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 149, 51, 0.08)', border: '1px solid rgba(255, 149, 51, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--orange, #ff9533)' }}>
              ⚠️ "This Week Only" override is active — it overrides your permanent schedule.
            </div>
            <button onClick={() => {
              const newSched = { fullTime: { ...(SCHEDULE?.fullTime || {}) }, thisWeek: {} };
              syncData(DB, localNames, META, FOOD, newSched);
            }} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255, 149, 51, 0.15)', border: '1px solid rgba(255, 149, 51, 0.3)', color: 'var(--orange, #ff9533)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Clear
            </button>
          </div>
        )}
      </Accordion>

      {/* 💪 CUSTOM WORKOUT SPLITS BUILDER */}
      <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Dumbbell size={16} style={{ color: 'var(--accent)' }} /> Workout Split Builder</span>} subtitle="Add muscle groups, custom exercises, or delete routines">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* CREATE NEW CUSTOM SPLIT FORM */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px dashed var(--border2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.05em' }}>➕ CREATE A NEW CUSTOM WORKOUT SPLIT</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="e.g. Chest Back & Legs, Push Day" value={newSplitName} onChange={e => setNewSplitName(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    createNewSplit();
                  }
                }} />
              <button onClick={createNewSplit}
                style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                Create Split
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Select Workout Split to Customize</div>
            <select value={selectedSplitToEdit} onChange={e => setSelectedSplitToEdit(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', outline: 'none', fontSize: '13px', fontWeight: 600 }}>
              {plansArray.map(p => <option key={p.id} value={p.id}>{getSplitDisplayName(p)}</option>)}
            </select>
          </div>

          {(() => {
            const currentPlan = plansArray.find(p => p.id === selectedSplitToEdit) || plansArray[0];
            const scheduledDays = [];
            for (let d = 0; d < 7; d++) {
              const currentSplit = localSchedule[d] !== undefined ? localSchedule[d] : d;
              if (currentSplit === currentPlan.id) {
                scheduledDays.push(DAYS_FULL[d]);
              }
            }
            return (
              <div style={{ background: 'var(--bg3)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '14px' }}>{currentPlan.label}</span>
                      <input type="text" key={currentPlan.id} defaultValue={currentPlan.label}
                        onBlur={e => renameWorkoutSplit(currentPlan.id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            renameWorkoutSplit(currentPlan.id, e.target.value);
                            e.target.blur();
                          }
                        }}
                        placeholder="Rename split..."
                        style={{ padding: '3px 8px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '6px', color: 'var(--text)', fontSize: '11px', width: '130px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                      {scheduledDays.length > 0 ? `📅 Scheduled: ${scheduledDays.join(', ')}` : '⚠️ Not scheduled on any day'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '6px' }}>{currentPlan.muscles.length} Muscle Groups</div>
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
    </>
  );
}
