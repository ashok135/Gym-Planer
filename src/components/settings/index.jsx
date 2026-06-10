import React, { useState, useEffect } from 'react';
import ProfileSettings from './ProfileSettings';
import AISettings from './AISettings';
import DietPlanBuilder from '../diet/DietPlanBuilder';
import MoodEnergySettings from './MoodEnergySettings';
import WorkoutSettings from './WorkoutSettings';
import FinanceSettings from './FinanceSettings';
import StudySettings from './StudySettings';
import SystemSettings from './SystemSettings';
import Accordion from '../shared/Accordion';
import { Utensils, Smile } from 'lucide-react';

export default function Settings({ 
  NAMES, syncData, DB, META, FOOD, handleLogout, SCHEDULE, 
  BUDGET_SETTINGS, syncBudget, STUDY_SETTINGS, syncStudy, 
  BUDGET, STUDY, syncAiSettings, profileInfo, syncProfileInfo,
  workoutPlans, syncWorkoutPlans, DIET_PLAN, syncDietPlan, user,
  activeTheme, setActiveTheme, syncSplitCategories, syncMoodEnergyConfig,
  syncStatusResponses
}) {
  const [localNames, setLocalNames] = useState(NAMES);

  useEffect(() => {
    if (NAMES) setLocalNames(NAMES);
  }, [NAMES]);

  return (
    <div id="settings-content" style={{ padding: '0 20px 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div className="greeting">Configuration</div>
        <div className="ai-title">Settings</div>
      </div>

      <WorkoutSettings 
        workoutPlans={workoutPlans} 
        syncWorkoutPlans={syncWorkoutPlans} 
        SCHEDULE={SCHEDULE} 
        syncData={syncData} 
        DB={DB} 
        localNames={localNames} 
        META={META} 
        FOOD={FOOD} 
      />

      {/* 🍽️ DIET PLAN BUILDER */}
      <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Utensils size={16} style={{ color: 'var(--accent)' }} /> Diet Plan Builder</span>} subtitle="Configure daily meals, dishes, and protein values">
        <div style={{ margin: '-10px -16px -16px' }}>
          <DietPlanBuilder DIET_PLAN={DIET_PLAN} syncDietPlan={syncDietPlan} />
        </div>
      </Accordion>

      <FinanceSettings 
        BUDGET_SETTINGS={BUDGET_SETTINGS} 
        syncBudget={syncBudget} 
        BUDGET={BUDGET} 
        syncSplitCategories={syncSplitCategories}
      />

      <StudySettings 
        STUDY_SETTINGS={STUDY_SETTINGS} 
        syncStudy={syncStudy} 
        STUDY={STUDY} 
      />

      {/* PROFILE & RESUME */}
      <ProfileSettings profileInfo={profileInfo} syncProfileInfo={syncProfileInfo} />

      {/* AI COACH */}
      <AISettings syncAiSettings={syncAiSettings} />

      <SystemSettings 
        localNames={localNames}
        syncData={syncData}
        DB={DB}
        META={META}
        FOOD={FOOD}
        SCHEDULE={SCHEDULE}
        BUDGET_SETTINGS={BUDGET_SETTINGS}
        syncBudget={syncBudget}
        STUDY_SETTINGS={STUDY_SETTINGS}
        syncStudy={syncStudy}
        BUDGET={BUDGET}
        STUDY={STUDY}
        profileInfo={profileInfo}
        syncProfileInfo={syncProfileInfo}
        workoutPlans={workoutPlans}
        syncWorkoutPlans={syncWorkoutPlans}
        DIET_PLAN={DIET_PLAN}
        syncDietPlan={syncDietPlan}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
      />

      {/* ─── MOOD & ENERGY CUSTOMISATION ─── */}
      <Accordion title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smile size={16} color="#c8f135" />
          <span>Mood &amp; Energy Slider</span>
        </span>
      }>
        <MoodEnergySettings 
          syncMoodEnergyConfig={syncMoodEnergyConfig} 
          syncStatusResponses={syncStatusResponses} 
        />
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
    </div>
  );
}
