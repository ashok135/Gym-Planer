import React, { useState } from 'react';
import { DEFAULT_PLAN, dateKey, DAYS_SHORT, DAYS_FULL, MONTHS, EXERCISE_GIFS } from '../data';
import { CheckCircle2, XCircle } from 'lucide-react';
import ExerciseCard from './today/ExerciseCard';
import SessionMeta from './today/SessionMeta';

const FULL_BODY_MUSCLES = [
  {name:'Chest',exercises:['Barbell Bench Press','Cable Chest Fly']},
  {name:'Back',exercises:['Lat Pulldown','Bent Over Barbell Row']},
  {name:'Legs',exercises:['Barbell Squat','Leg Press']},
  {name:'Shoulders',exercises:['Overhead Press','Dumbbell Lateral Raise']},
  {name:'Biceps',exercises:['Barbell Curl','Hammer Curl']},
  {name:'Triceps',exercises:['Tricep Pushdown','Diamond Push-ups']}
];

const getExerciseGif = (name) => {
  const clean = name.toLowerCase()
    .replace(/\(heavy\)/g, '')
    .replace(/\(light\)/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();
  
  if (EXERCISE_GIFS[clean]) return EXERCISE_GIFS[clean];

  // Guess dynamic URL
  const hyphenated = clean.replace(/\s+/g, '-');
  return `https://fitnessprogramer.com/wp-content/uploads/2021/02/${hyphenated}.gif`;
};

export default function Today({ DB, NAMES, META, syncData, FOOD, SCHEDULE, workoutPlans }) {
  const today = new Date();
  const dow = today.getDay();
  const key = dateKey(today);
  
  const saved = DB[key] || {};
  const meta = META[key] || { mood: '', energy: 0, status: 'Completed', bw: '', start: '06:30', end: '08:10', notes: '' };
  const isSkipped = meta.status === 'Skipped';
  
  let currentPlanId = dow;
  if (SCHEDULE?.fullTime && SCHEDULE.fullTime[dow] !== undefined) currentPlanId = SCHEDULE.fullTime[dow];
  if (SCHEDULE?.thisWeek && SCHEDULE.thisWeek[key] !== undefined) currentPlanId = SCHEDULE.thisWeek[key];

  // Create deep copy of plan
  const plan = JSON.parse(JSON.stringify(workoutPlans[currentPlanId] || workoutPlans[0]));
  plan.muscles.push({
    name: 'Abs',
    exercises: ['Crunches', 'Leg Raises', 'Plank']
  });
  plan.muscles.push({
    name: 'Progressive',
    exercises: ['Back Squat (Heavy)', 'Deadlift (Heavy)', 'Overhead Press (Heavy)', 'Weighted Pull-ups', 'Barbell Row (Heavy)']
  });
  // Full Body is added as a virtual muscle group marker
  plan.muscles.push({ name: 'FullBody', exercises: [] });

  plan.muscles.forEach(m => {
    m.exercises = m.exercises.map((ex, i) => {
      const k = `${currentPlanId}_${m.name}_${i}`;
      const ek = `${m.name}_${i}`;
      return (saved[ek] && saved[ek].customName) ? saved[ek].customName : (NAMES[k] || ex);
    });
  });

  const [activeDemo, setActiveDemo] = useState(null);
  const [renameBox, setRenameBox] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [saveMsg, setSaveMsg] = useState(false);
  const [showAbs, setShowAbs] = useState(() => {
    return meta.absEnabled || Object.keys(saved).some(k => k.startsWith('Abs_'));
  });
  const [showProgressive, setShowProgressive] = useState(() => {
    return meta.progressiveEnabled || Object.keys(saved).some(k => k.startsWith('Progressive_'));
  });
  const [showFullBody, setShowFullBody] = useState(() => {
    return meta.fullBodyEnabled || Object.keys(saved).some(k => k.startsWith('FullBodyMuscle_'));
  });

  const activeMuscles = plan.muscles.filter(m => {
    if (m.name === 'Abs') return showAbs;
    if (m.name === 'Progressive') return showProgressive;
    if (m.name === 'FullBody') return showFullBody;
    // Hide regular split muscles when Full Body mode is active
    if (showFullBody) return false;
    return true;
  });

  const activeExerciseCount = activeMuscles.reduce((s, m) => {
    if (m.name === 'FullBody') return s + FULL_BODY_MUSCLES.reduce((a, fm) => a + fm.exercises.length, 0);
    return s + m.exercises.length;
  }, 0);
  const activeMuscleCount = activeMuscles.reduce((s, m) => {
    if (m.name === 'FullBody') return s + FULL_BODY_MUSCLES.length;
    return s + 1;
  }, 0);

  const addAbs = () => {
    setShowAbs(true);
    handleMetaChange('absEnabled', true);
  };

  const addProgressive = () => {
    setShowProgressive(true);
    handleMetaChange('progressiveEnabled', true);
  };

  const addFullBody = () => {
    setShowFullBody(true);
    handleMetaChange('fullBodyEnabled', true);
  };

  const removeAbs = () => {
    setShowAbs(false);
    handleMetaChange('absEnabled', false);
    const newDB = { ...DB };
    if (newDB[key]) {
      Object.keys(newDB[key]).forEach(k => {
        if (k.startsWith('Abs_')) delete newDB[key][k];
      });
    }
    syncData(newDB, NAMES, META, FOOD, SCHEDULE);
  };

  const removeProgressive = () => {
    setShowProgressive(false);
    handleMetaChange('progressiveEnabled', false);
    const newDB = { ...DB };
    if (newDB[key]) {
      Object.keys(newDB[key]).forEach(k => {
        if (k.startsWith('Progressive_')) delete newDB[key][k];
      });
    }
    syncData(newDB, NAMES, META, FOOD, SCHEDULE);
  };

  const removeFullBody = () => {
    setShowFullBody(false);
    handleMetaChange('fullBodyEnabled', false);
    const newDB = { ...DB };
    if (newDB[key]) {
      Object.keys(newDB[key]).forEach(k => {
        if (k.startsWith('FullBodyMuscle_')) delete newDB[key][k];
      });
    }
    syncData(newDB, NAMES, META, FOOD, SCHEDULE);
  };

  const getPrevStats = (ek) => {
    const keys = Object.keys(DB).filter(k => k < key && DB[k][ek] && DB[k][ek].w).sort();
    if(keys.length === 0) return null;
    return DB[keys[keys.length - 1]][ek];
  };

  const toggleRename = (ek, currentName) => {
    if(renameBox === ek) setRenameBox(null);
    else {
      setRenameBox(ek);
      setRenameInput(currentName);
    }
  };

  const saveRename = (ek) => {
    if(!renameInput.trim()) return;
    const newDB = { ...DB };
    if(!newDB[key]) newDB[key] = {};
    if(!newDB[key][ek]) newDB[key][ek] = {};
    newDB[key][ek].customName = renameInput.trim();
    syncData(newDB, NAMES, META, FOOD);
    setRenameBox(null);
  };

  const handleInputChange = (ek, field, value) => {
    const newDB = { ...DB };
    if(!newDB[key]) newDB[key] = {};
    if(!newDB[key][ek]) newDB[key][ek] = {};
    if(field === 'done') {
      newDB[key][ek][field] = value;
    } else {
      newDB[key][ek][field] = parseFloat(value) || 0;
      if (newDB[key][ek].done === undefined || newDB[key][ek].done === null) {
        newDB[key][ek].done = true;
      }
    }
    syncData(newDB, NAMES, META, FOOD, SCHEDULE);
  };

  const handleMetaChange = (field, value) => {
    const newMeta = { ...META };
    if(!newMeta[key]) newMeta[key] = { ...meta };
    newMeta[key][field] = value;
    if (field === 'status' && value === 'Skipped') {
      newMeta[key].start = '';
      newMeta[key].end = '';
    }
    syncData(DB, NAMES, newMeta, FOOD);
  };

  const saveToday = () => {
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  };

  if(!plan.muscles.length) {
    return (
      <div id="today-content">
        <div className="rest-card">
          <div className="rest-icon">🛌</div>
          <div className="rest-title">Rest day</div>
          <div className="rest-sub">Recovery is part of the process. Come back tomorrow.</div>
        </div>
      </div>
    );
  }

  return (
    <div id="today-content" style={{padding:'20px 0'}}>
      <div className="workout-hero">
        <div className="workout-type">{DAYS_FULL[dow]}</div>
        <div className="workout-name">{showFullBody ? 'Full Body' : (plan.label + (showAbs ? ' & Abs' : '') + (showProgressive ? ' & Progressive' : ''))}</div>
        <div className="workout-meta">
          <span><strong>{activeExerciseCount}</strong> exercises</span>
          <span><strong>{activeMuscleCount}</strong> muscle groups</span>
        </div>
      </div>

      <SessionMeta meta={meta} isSkipped={isSkipped} handleMetaChange={handleMetaChange} />

      {plan.muscles.map(m => {
        // When Full Body is active, hide regular split muscles — only show Abs, Progressive, FullBody
        if (showFullBody && m.name !== 'Abs' && m.name !== 'Progressive' && m.name !== 'FullBody') {
          return null;
        }

        if(m.name === 'Abs' && !showAbs) {
          return (
            <div className="muscle-block" key={m.name} onClick={() => !isSkipped && addAbs()} style={{cursor: isSkipped ? 'not-allowed' : 'pointer', opacity: isSkipped ? 0.4 : 0.8, textAlign: 'center', padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px dashed var(--border2)'}}>
              <div style={{fontSize: '12px', fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.1em'}}>+ ADD ABS WORKOUT</div>
            </div>
          );
        }

        if(m.name === 'Progressive' && !showProgressive) {
          return (
            <div className="muscle-block" key={m.name} onClick={() => !isSkipped && addProgressive()} style={{cursor: isSkipped ? 'not-allowed' : 'pointer', opacity: isSkipped ? 0.4 : 0.8, textAlign: 'center', padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px dashed var(--border2)', marginTop: '8px'}}>
              <div style={{fontSize: '12px', fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.1em'}}>+ ADD PROGRESSIVE WORKOUT</div>
            </div>
          );
        }

        if(m.name === 'FullBody' && !showFullBody) {
          return (
            <div className="muscle-block" key={m.name} onClick={() => !isSkipped && addFullBody()} style={{cursor: isSkipped ? 'not-allowed' : 'pointer', opacity: isSkipped ? 0.4 : 0.8, textAlign: 'center', padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px dashed var(--accent)', marginTop: '8px'}}>
              <div style={{fontSize: '12px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em'}}>💪 ADD FULL BODY WORKOUT</div>
              <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>2 exercises · 6 muscle groups · After long break</div>
            </div>
          );
        }

        // Render Full Body expanded muscles inline
        if(m.name === 'FullBody' && showFullBody) {
          return (
            <React.Fragment key="fullbody-wrapper">
              <div className="muscle-block" key="fullbody-header" style={{ opacity: isSkipped ? 0.5 : 1 }}>
                <div className="muscle-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <div className="muscle-dot" style={{background:'var(--accent)'}}></div>
                    <div className="muscle-name">Full Body</div>
                  </div>
                  <button onClick={() => !isSkipped && removeFullBody()} disabled={isSkipped} style={{background:'transparent', border:'none', color:'var(--red)', fontSize:'12px', fontWeight:'bold', cursor: isSkipped ? 'not-allowed' : 'pointer', padding:'4px 8px'}}>REMOVE</button>
                </div>
              </div>
              {FULL_BODY_MUSCLES.map(fm => (
                <div className="muscle-block" key={`fb-${fm.name}`} style={{ opacity: isSkipped ? 0.5 : 1, marginTop: '4px' }}>
                  <div className="muscle-header" style={{display:'flex', alignItems:'center'}}>
                    <div className="muscle-dot"></div>
                    <div className="muscle-name" style={{fontSize:'13px'}}>{fm.name}</div>
                  </div>
                  {fm.exercises.map((ex, i) => {
                    const ek = `FullBodyMuscle_${fm.name}_${i}`;
                    const sv = saved[ek] || {};
                    const prev = getPrevStats(ek) || {};
                    return (
                      <ExerciseCard
                        key={ek}
                        ex={ex}
                        ek={ek}
                        sv={sv}
                        prev={prev}
                        activeDemo={activeDemo}
                        setActiveDemo={setActiveDemo}
                        renameBox={renameBox}
                        toggleRename={toggleRename}
                        renameInput={renameInput}
                        setRenameInput={setRenameInput}
                        saveRename={saveRename}
                        handleInputChange={handleInputChange}
                        isSkipped={isSkipped}
                        getExerciseGif={getExerciseGif}
                        showRenameBtn={false}
                      />
                    );
                  })}
                </div>
              ))}
            </React.Fragment>
          );
        }

        return (
          <div className="muscle-block" key={m.name} style={{ opacity: isSkipped ? 0.5 : 1 }}>
            <div className="muscle-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'center'}}><div className="muscle-dot"></div><div className="muscle-name">{m.name}</div></div>
              {(m.name === 'Abs' || m.name === 'Progressive') && (
                <button onClick={() => !isSkipped && (m.name === 'Abs' ? removeAbs() : removeProgressive())} disabled={isSkipped} style={{background:'transparent', border:'none', color:'var(--red)', fontSize:'12px', fontWeight:'bold', cursor: isSkipped ? 'not-allowed' : 'pointer', padding:'4px 8px'}}>REMOVE</button>
              )}
            </div>
            {m.exercises.map((ex, i) => {
              const ek = `${m.name}_${i}`;
              const sv = saved[ek] || {};
              const prev = getPrevStats(ek) || {};
              return (
                <ExerciseCard
                  key={ek}
                  ex={ex}
                  ek={ek}
                  sv={sv}
                  prev={prev}
                  activeDemo={activeDemo}
                  setActiveDemo={setActiveDemo}
                  renameBox={renameBox}
                  toggleRename={toggleRename}
                  renameInput={renameInput}
                  setRenameInput={setRenameInput}
                  saveRename={saveRename}
                  handleInputChange={handleInputChange}
                  isSkipped={isSkipped}
                  getExerciseGif={getExerciseGif}
                  showRenameBtn={true}
                />
              );
            })}
          </div>
        );
      })}

      <div className="save-area">
        <button 
          className="save-btn" 
          onClick={saveToday}
          style={{
            background: saveMsg ? '#10B981' : 'var(--accent)',
            color: saveMsg ? '#fff' : '#000',
            boxShadow: saveMsg ? '0 4px 20px rgba(16, 185, 129, 0.4)' : '0 4px 20px rgba(200, 241, 53, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 'bold'
          }}
        >
          {saveMsg ? 'Saved ✓' : 'Save workout'}
        </button>
      </div>
    </div>
  );
}
