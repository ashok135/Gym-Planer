import React, { useState } from 'react';
import { ACTIVITY_LEVELS } from './utils/calcMath';

export const CalorieCalc = ({
  cAge, handleAgeChange,
  cGender, handleGenderChange,
  cHeight, handleHeightChange,
  cWeight, handleWeightChange,
  cActivity, handleActivityChange,
  cGoal, handleGoalChange,
  profileInfo, syncProfileInfo,
  inputStyle, labelStyle
}) => {
  const [applySuccess, setApplySuccess] = useState(false);

  // --- TDEE Calculation (Mifflin-St Jeor) ---
  const age     = parseInt(cAge)    || 22;
  const ht      = parseInt(cHeight) || 170;
  const wt      = parseInt(cWeight) || 70;
  const actMult = ACTIVITY_LEVELS.find(a => a.id === cActivity)?.mult || 1.55;

  let bmr = 0;
  if (cGender === 'male')   bmr = 10 * wt + 6.25 * ht - 5 * age + 5;
  else                      bmr = 10 * wt + 6.25 * ht - 5 * age - 161;

  const tdee         = Math.round(bmr * actMult);
  const fatLossKcal  = Math.max(1200, tdee - 500);
  const muscleKcal   = tdee + 300;

  const macros = (kcal, goal) => {
    const proteinG = goal === 'fat_loss' ? Math.round(wt * 2.2) : Math.round(wt * 2.0);
    const fatG     = Math.round((kcal * 0.25) / 9);
    const carbG    = Math.round((kcal - (proteinG * 4) - (fatG * 9)) / 4);
    return { protein: proteinG, carbs: Math.max(0, carbG), fat: fatG };
  };

  const targetKcal  = cGoal === 'fat_loss' ? fatLossKcal : cGoal === 'muscle' ? muscleKcal : tdee;
  const targetMacro = macros(targetKcal, cGoal);

  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>🔥 Calorie Calculator</div>
      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '18px' }}>TDEE + personalised daily calorie targets</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div style={labelStyle}>Age</div>
          <input type="number" min="10" max="100" value={cAge} onChange={e => handleAgeChange(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Gender</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['male', 'female'].map(g => (
              <button key={g} onClick={() => handleGenderChange(g)} style={{
                flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: cGender === g ? 'var(--accent)' : 'var(--bg)',
                color: cGender === g ? '#000' : 'var(--text2)',
                fontWeight: 700, fontSize: '12px',
                border: cGender === g ? 'none' : '1px solid var(--border2)',
                textTransform: 'capitalize'
              }}>
                {g === 'male' ? '♂ Male' : '♀ Female'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={labelStyle}>Height (cm)</div>
          <input type="number" value={cHeight} onChange={e => handleHeightChange(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Weight (kg)</div>
          <input type="number" value={cWeight} onChange={e => handleWeightChange(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div style={labelStyle}>Activity Level</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {ACTIVITY_LEVELS.map(a => (
            <div key={a.id} onClick={() => handleActivityChange(a.id)} style={{
              padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
              background: cActivity === a.id ? 'rgba(200,241,53,0.12)' : 'var(--bg)',
              border: cActivity === a.id ? '1px solid var(--accent)' : '1px solid var(--border2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: cActivity === a.id ? 'var(--accent)' : 'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{a.desc}</div>
              </div>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: `2px solid ${cActivity === a.id ? 'var(--accent)' : 'var(--border2)'}`,
                background: cActivity === a.id ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {cActivity === a.id && <div style={{ width: '6px', height: '6px', background: '#000', borderRadius: '50%' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={labelStyle}>Your Goal</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'fat_loss', label: '🔥 Lose Fat',    color: '#FB923C' },
            { id: 'maintain', label: '⚖️ Maintain',    color: '#4D9FFF' },
            { id: 'muscle',   label: '💪 Build Muscle', color: '#C8F135' },
          ].map(g => (
            <button key={g.id} onClick={() => handleGoalChange(g.id)} style={{
              flex: 1, padding: '10px 6px', borderRadius: '12px', border: 'none',
              background: cGoal === g.id ? 'rgba(200,241,53,0.15)' : 'var(--bg3)',
              color: cGoal === g.id ? g.color : 'var(--text3)',
              fontWeight: cGoal === g.id ? 700 : 400,
              fontSize: '11px', cursor: 'pointer',
              border: cGoal === g.id ? `1px solid ${g.color}` : '1px solid var(--border2)',
              transition: 'all 0.2s'
            }}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {tdee > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Maintain',     kcal: tdee,        color: '#4D9FFF', selected: cGoal === 'maintain' },
              { label: 'Fat Loss',     kcal: fatLossKcal, color: '#FB923C', selected: cGoal === 'fat_loss', tag: '-500 kcal' },
              { label: 'Muscle Gain', kcal: muscleKcal,  color: '#C8F135', selected: cGoal === 'muscle',   tag: '+300 kcal' },
            ].map(c => (
              <div key={c.label} style={{
                background: c.selected ? `rgba(${c.color.replace('#', '').match(/../g).map(x => parseInt(x, 16)).join(',')}, 0.12)` : 'var(--bg2)',
                border: `1px solid ${c.selected ? c.color : 'var(--border2)'}`,
                borderRadius: '16px', padding: '14px 10px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: c.color }}>{c.kcal}</div>
                <div style={{ fontSize: '9px', color: 'var(--text3)' }}>kcal/day</div>
                {c.tag && <div style={{ fontSize: '9px', color: c.color, marginTop: '4px', fontWeight: 700 }}>{c.tag}</div>}
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg2)', borderRadius: '20px', padding: '18px',
            border: '1px solid var(--border2)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px', color: 'var(--text)' }}>
              📊 Daily Macro Split — {targetKcal} kcal
            </div>
            {[
              { label: 'Protein', g: targetMacro.protein, kcal: targetMacro.protein * 4, color: '#C8F135' },
              { label: 'Carbs',   g: targetMacro.carbs,   kcal: targetMacro.carbs * 4,   color: '#4D9FFF' },
              { label: 'Fats',    g: targetMacro.fat,     kcal: targetMacro.fat * 9,     color: '#FB923C' },
            ].map(m => {
              const pct = targetKcal > 0 ? Math.round((m.kcal / targetKcal) * 100) : 0;
              return (
                <div key={m.label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ color: m.color, fontWeight: 700 }}>{m.label}</span>
                    <span style={{ color: 'var(--text2)' }}>{m.g}g  <span style={{ color: 'var(--text3)', fontSize: '10px' }}>({pct}%)</span></span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '10px', textAlign: 'center' }}>
              Based on Mifflin-St Jeor formula • Adjust based on how your body responds
            </div>
            <button 
              onClick={async () => {
                if (syncProfileInfo) {
                  await syncProfileInfo({
                    ...profileInfo,
                    dailyProteinTarget: Number(targetMacro.protein),
                  });
                  setApplySuccess(true);
                  setTimeout(() => setApplySuccess(false), 2000);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '16px',
                borderRadius: '12px',
                border: 'none',
                background: applySuccess ? '#10B981' : 'var(--accent)',
                color: applySuccess ? '#fff' : '#000',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: applySuccess ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {applySuccess ? 'Applied successfully! ✓' : '🎯 Apply Protein Target to Daily Log'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
