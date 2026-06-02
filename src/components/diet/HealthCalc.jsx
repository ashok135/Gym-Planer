import React, { useState } from 'react';
import { BmiCalc } from './BmiCalc';
import { CalorieCalc } from './CalorieCalc';

export default function HealthCalc({ profileInfo, syncProfileInfo }) {
  // BMI State
  const [heightCm, setHeightCm] = useState(() => localStorage.getItem('calc_bmi_height') || '170');
  const [weightKg, setWeightKg] = useState(() => localStorage.getItem('calc_bmi_weight') || '70');

  // Calorie calc state
  const [cAge,      setCAge]      = useState(() => localStorage.getItem('calc_tdee_age') || '22');
  const [cGender,   setCGender]   = useState(() => localStorage.getItem('calc_tdee_gender') || 'male');
  const [cHeight,   setCHeight]   = useState(() => localStorage.getItem('calc_tdee_height') || '170');
  const [cWeight,   setCWeight]   = useState(() => localStorage.getItem('calc_tdee_weight') || '70');
  const [cActivity, setCActivity] = useState(() => localStorage.getItem('calc_tdee_activity') || 'moderate');
  const [cGoal,     setCGoal]     = useState(() => localStorage.getItem('calc_tdee_goal') || 'fat_loss');

  // Sync state helpers
  const handleHeightChange = (val) => {
    setHeightCm(val);
    setCHeight(val);
    localStorage.setItem('calc_bmi_height', val);
    localStorage.setItem('calc_tdee_height', val);
  };

  const handleWeightChange = (val) => {
    setWeightKg(val);
    setCWeight(val);
    localStorage.setItem('calc_bmi_weight', val);
    localStorage.setItem('calc_tdee_weight', val);
  };

  const handleAgeChange = (val) => {
    setCAge(val);
    localStorage.setItem('calc_tdee_age', val);
  };

  const handleGenderChange = (val) => {
    setCGender(val);
    localStorage.setItem('calc_tdee_gender', val);
  };

  const handleActivityChange = (val) => {
    setCActivity(val);
    localStorage.setItem('calc_tdee_activity', val);
  };

  const handleGoalChange = (val) => {
    setCGoal(val);
    localStorage.setItem('calc_tdee_goal', val);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: 'var(--bg)',
    border: '1px solid var(--border2)', borderRadius: '12px',
    color: 'var(--text)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '11px', color: 'var(--text3)', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600
  };

  return (
    <div style={{ padding: '20px' }}>
      <BmiCalc 
        heightCm={heightCm} handleHeightChange={handleHeightChange}
        weightKg={weightKg} handleWeightChange={handleWeightChange}
        inputStyle={inputStyle} labelStyle={labelStyle}
      />

      <div style={{ borderBottom: '1px solid var(--border2)', marginBottom: '24px' }} />

      <CalorieCalc 
        cAge={cAge} handleAgeChange={handleAgeChange}
        cGender={cGender} handleGenderChange={handleGenderChange}
        cHeight={cHeight} handleHeightChange={handleHeightChange}
        cWeight={cWeight} handleWeightChange={handleWeightChange}
        cActivity={cActivity} handleActivityChange={handleActivityChange}
        cGoal={cGoal} handleGoalChange={handleGoalChange}
        profileInfo={profileInfo} syncProfileInfo={syncProfileInfo}
        inputStyle={inputStyle} labelStyle={labelStyle}
      />

      <div style={{ height: '40px' }} />
    </div>
  );
}
