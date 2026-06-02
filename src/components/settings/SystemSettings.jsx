import React, { useState } from 'react';
import { Database, Download, Beaker, Zap } from 'lucide-react';
import Accordion from '../shared/Accordion';
import { THEMES, MONTHS, DAYS_FULL } from '../../data';
import { generateSeedData } from '../../utils/seeder';

export default function SystemSettings({
  localNames, syncData, DB, META, FOOD, SCHEDULE,
  BUDGET_SETTINGS, syncBudget, STUDY_SETTINGS, syncStudy,
  BUDGET, STUDY, profileInfo, syncProfileInfo,
  workoutPlans, syncWorkoutPlans, DIET_PLAN, syncDietPlan,
  activeTheme, setActiveTheme
}) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('dev_mode') === 'true');

  const exportData = () => {
    const moodEnergyConfig = localStorage.getItem('gmood_energy_config');
    const data = {
      workouts: DB,
      names: localNames,
      meta: META,
      food: FOOD,
      schedule: SCHEDULE,
      budget: BUDGET,
      budgetSettings: BUDGET_SETTINGS,
      study: STUDY,
      studySettings: STUDY_SETTINGS,
      profileInfo: profileInfo,
      workoutPlans: workoutPlans,
      dietPlan: DIET_PLAN,
      moodEnergyConfig: moodEnergyConfig ? JSON.parse(moodEnergyConfig) : null
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LifeTraker_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object') {
          alert('Invalid backup file structure!');
          return;
        }

        if (data.workouts) syncData(data.workouts, data.names || localNames, data.meta || {}, data.food || {}, data.schedule || SCHEDULE);
        if (data.budget) syncBudget(data.budget);
        if (data.budgetSettings) localStorage.setItem('gym_budget_settings', JSON.stringify(data.budgetSettings));
        if (data.study) syncStudy(data.study);
        if (data.studySettings) localStorage.setItem('gym_study_settings', JSON.stringify(data.studySettings));
        if (data.profileInfo) syncProfileInfo(data.profileInfo);
        if (data.workoutPlans) syncWorkoutPlans(data.workoutPlans);
        if (data.dietPlan) syncDietPlan(data.dietPlan);

        if (data.moodEnergyConfig) {
          localStorage.setItem('gmood_energy_config', JSON.stringify(data.moodEnergyConfig));
          window.dispatchEvent(new Event('moodEnergyConfigUpdated'));
        }

        alert('🎉 Backup successfully restored! All your workouts, budgets, custom setups, and gallery photos are now fully active.');
        window.location.reload();
      } catch (err) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
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
        if (str === null || str === undefined) return '';
        const s = String(str);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
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
        if (m) {
          if (m.status) csv += `${dateCols},Meta,Daily Status,,,,,"${m.status}"\n`;
          if (m.bw) csv += `${dateCols},Meta,Bodyweight,,,,,"${m.bw} kg"\n`;
          if (m.energy) csv += `${dateCols},Meta,Energy,,,,,"${m.energy} stars"\n`;
          if (m.notes) csv += `${dateCols},Meta,Notes,,,,,${escapeCSV(m.notes)}\n`;
        }

        const entry = DB?.[k];
        if (entry && typeof entry === 'object') {
          Object.keys(entry).filter(ek => !['meta', 'customName'].includes(ek)).forEach(ek => {
            const v = entry[ek];
            if (v && typeof v === 'object' && (v.s || v.r || v.w)) {
              const customKey = Object.keys(localNames || {}).find(nameKey => nameKey.endsWith('_' + ek));
              let exName = customKey ? localNames[customKey] : ek;
              if (v.customName) exName = v.customName;
              csv += `${dateCols},Workout,${escapeCSV(exName)},${v.s || 0},${v.r || 0},${v.w || 0},,\n`;
            }
          });
        }

        const f = FOOD?.[k];
        if (f && typeof f === 'object') {
          if (f.water) csv += `${dateCols},Habit,Water 3-4L,,,,,Completed\n`;
          if (f.sleep) csv += `${dateCols},Habit,Sleep 7-8h,,,,,Completed\n`;
          if (f.junk) csv += `${dateCols},Habit,No Junk,,,,,Completed\n`;

          if (f.items && typeof f.items === 'object') {
            const activePlan = (DIET_PLAN && DIET_PLAN[dow]?.length) ? DIET_PLAN[dow] : (DIET_PLAN ? (DIET_PLAN[dow] || DIET_PLAN[1]) : []);
            if (activePlan && Array.isArray(activePlan)) {
              activePlan.forEach(meal => {
                if (meal && meal.items && Array.isArray(meal.items)) {
                  meal.items.forEach(i => {
                    if (f.items[i.id]) {
                      const customName = (f.custom && typeof f.custom === 'object' && f.custom[i.id]) ? f.custom[i.id] : i.name;
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
        if (md && Array.isArray(md.entries)) {
          md.entries.forEach(e => {
            if (e) {
              csv += `${e.date || ''},${e.category || ''},${e.amount || 0},"${(e.note || '').replace(/"/g, '""')}"\n`;
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
      alert("Failed to export Budget CSV: " + err.message);
    }
  };

  const exportStudyCSV = () => {
    try {
      let csv = 'Date,Subject,Hours,Learned\n';
      Object.entries(STUDY || {}).forEach(([dk, sd]) => {
        if (sd && Array.isArray(sd.sessions)) {
          sd.sessions.forEach(s => {
            if (s) {
              csv += `${dk},${s.subjectId || ''},${s.hours || 0},"${(s.learned || '').replace(/"/g, '""')}"\n`;
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
      alert("Failed to export Study CSV: " + err.message);
    }
  };

  return (
    <>
      {/* DATA & EXPORT */}
      <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={16} style={{ color: 'var(--accent)' }} /> Data &amp; Export</span>} subtitle="Backup and export your data">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button className="settings-save"
            style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => setShowExportModal(true)}>
            <Download size={14} /> Export CSV
          </button>
          <button className="settings-save"
            style={{ background: 'var(--bg3)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={exportData}>
            <Database size={14} /> Full Backup
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '8px', lineHeight: 1.5 }}>
          CSV exports your gym, diet, budget and study data. Full Backup saves all customization, history, and custom slider photos as a JSON file.
        </div>

        {/* RESTORE FROM BACKUP */}
        <div style={{ marginTop: '14px', borderTop: '1px solid var(--border2)', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600 }}>Restore from Backup</div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: 'var(--bg2)',
            border: '1.5px dashed var(--border2)',
            borderRadius: '12px',
            color: 'var(--text)',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
            boxSizing: 'border-box'
          }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
            <Database size={14} color="var(--accent)" />
            <span>Select Backup JSON File</span>
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
        </div>
      </Accordion>

      {/* DEVELOPER OPTIONS */}
      <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Beaker size={16} style={{ color: 'var(--accent)' }} /> Developer Options</span>} subtitle="Tools for testing and debugging">
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

      {/* ─── APP THEMES ACCORDION ─── */}
      <Accordion title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="var(--accent)" />
          <span>Custom App Themes</span>
        </span>
      }>
        <div style={{ padding: '4px 0' }}>
          <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px', lineHeight: 1.4 }}>
            Personalize your workspace experience with premium custom accent themes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {THEMES.map(theme => {
              const isActive = activeTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  style={{
                    background: 'var(--bg2)',
                    border: isActive ? `1.5px solid ${theme.colors.accent}` : '1.5px solid var(--border2)',
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? `0 0 12px ${theme.colors.accent}20` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.borderColor = theme.colors.accent;
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--border2)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text)' : 'var(--text2)' }}>
                      {theme.name}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: '10px', color: theme.colors.accent, fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>

                  {/* Colors Preview row */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: theme.colors.accent, border: '1px solid rgba(255,255,255,0.1)' }} title="Accent" />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: theme.colors.bg, border: '1px solid rgba(255,255,255,0.1)' }} title="Background" />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: theme.colors.bg3, border: '1px solid rgba(255,255,255,0.1)' }} title="Card Background" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Accordion>

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
    </>
  );
}
