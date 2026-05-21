import React, { useState } from 'react';

// Activity multipliers for Mifflin-St Jeor TDEE
const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'Sedentary',        desc: 'Little or no exercise',                  mult: 1.2 },
  { id: 'light',      label: 'Light',             desc: '1–3 days/week workout',                  mult: 1.375 },
  { id: 'moderate',   label: 'Moderate',          desc: '3–5 days/week workout',                  mult: 1.55 },
  { id: 'active',     label: 'Active',            desc: '6–7 days/week workout',                  mult: 1.725 },
  { id: 'very_active',label: 'Very Active',       desc: 'Twice a day or physical job',            mult: 1.9 },
];

const BMI_CATEGORIES = [
  { max: 18.5, label: 'Underweight', color: '#4D9FFF' },
  { max: 25,   label: 'Normal',      color: '#C8F135' },
  { max: 30,   label: 'Overweight',  color: '#FB923C' },
  { max: 999,  label: 'Obese',       color: '#FF6B6B' },
];

function getBmiCategory(bmi) {
  return BMI_CATEGORIES.find(c => bmi < c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

// Small ring component
function RingMeter({ pct, color, size = 100, strokeWidth = 8 }) {
  const r   = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

export default function HealthCalc() {
  // BMI State
  const [heightCm, setHeightCm] = useState('170');
  const [weightKg, setWeightKg] = useState('70');

  // Calorie calc state
  const [cAge,      setCAge]      = useState('22');
  const [cGender,   setCGender]   = useState('male');
  const [cHeight,   setCHeight]   = useState('170');
  const [cWeight,   setCWeight]   = useState('70');
  const [cActivity, setCActivity] = useState('moderate');
  const [cGoal,     setCGoal]     = useState('fat_loss');

  // --- BMI Calculation ---
  const h   = parseFloat(heightCm) / 100;
  const w   = parseFloat(weightKg);
  const bmi = (h > 0 && w > 0) ? +(w / (h * h)).toFixed(1) : 0;
  const bmiCat  = bmi > 0 ? getBmiCategory(bmi) : null;
  // normalise for ring: healthy 18.5–25 → try to show 18.5 as 0% and 40+ as 100%
  const bmiPct  = bmi > 0 ? Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100)) : 0;

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

  // Macro splits (rough guideline)
  const macros = (kcal, goal) => {
    const proteinG = goal === 'fat_loss' ? Math.round(wt * 2.2) : Math.round(wt * 2.0);
    const fatG     = Math.round((kcal * 0.25) / 9);
    const carbG    = Math.round((kcal - (proteinG * 4) - (fatG * 9)) / 4);
    return { protein: proteinG, carbs: Math.max(0, carbG), fat: fatG };
  };

  const targetKcal  = cGoal === 'fat_loss' ? fatLossKcal : cGoal === 'muscle' ? muscleKcal : tdee;
  const targetMacro = macros(targetKcal, cGoal);

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
      {/* ─── BMI CALCULATOR ─── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>⚖️ BMI Calculator</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '18px' }}>Body Mass Index — check your weight category</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={labelStyle}>Height (cm)</div>
            <input type="number" min="100" max="250" value={heightCm}
              onChange={e => setHeightCm(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Weight (kg)</div>
            <input type="number" min="30" max="300" value={weightKg}
              onChange={e => setWeightKg(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {bmi > 0 && (
          <div style={{
            background: 'var(--bg2)', borderRadius: '20px', padding: '24px',
            border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: '20px'
          }}>
            {/* Ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <RingMeter pct={bmiPct} color={bmiCat.color} size={90} strokeWidth={8} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: bmiCat.color }}>{bmi}</div>
                <div style={{ fontSize: '8px', color: 'var(--text3)', textTransform: 'uppercase' }}>BMI</div>
              </div>
            </div>
            {/* Details */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: bmiCat.color, marginBottom: '6px' }}>{bmiCat.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {BMI_CATEGORIES.map(cat => (
                  <div key={cat.label} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px',
                    color: cat.label === bmiCat?.label ? cat.color : 'var(--text3)'
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', background: cat.color,
                      opacity: cat.label === bmiCat?.label ? 1 : 0.3
                    }} />
                    {cat.label}: {cat.label === 'Underweight' ? '< 18.5' : cat.label === 'Normal' ? '18.5–25' : cat.label === 'Overweight' ? '25–30' : '> 30'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderBottom: '1px solid var(--border2)', marginBottom: '24px' }} />

      {/* ─── CALORIE CALCULATOR ─── */}
      <div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>🔥 Calorie Calculator</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '18px' }}>TDEE + personalised daily calorie targets</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={labelStyle}>Age</div>
            <input type="number" min="10" max="100" value={cAge} onChange={e => setCAge(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Gender</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['male', 'female'].map(g => (
                <button key={g} onClick={() => setCGender(g)} style={{
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
            <input type="number" value={cHeight} onChange={e => setCHeight(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Weight (kg)</div>
            <input type="number" value={cWeight} onChange={e => setCWeight(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Activity Level */}
        <div style={{ marginBottom: '14px' }}>
          <div style={labelStyle}>Activity Level</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ACTIVITY_LEVELS.map(a => (
              <div key={a.id} onClick={() => setCActivity(a.id)} style={{
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

        {/* Goal Selector */}
        <div style={{ marginBottom: '20px' }}>
          <div style={labelStyle}>Your Goal</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'fat_loss', label: '🔥 Lose Fat',    color: '#FB923C' },
              { id: 'maintain', label: '⚖️ Maintain',    color: '#4D9FFF' },
              { id: 'muscle',   label: '💪 Build Muscle', color: '#C8F135' },
            ].map(g => (
              <button key={g.id} onClick={() => setCGoal(g.id)} style={{
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

        {/* Results */}
        {tdee > 0 && (
          <>
            {/* TDEE Cards */}
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

            {/* Macro Split */}
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
            </div>
          </>
        )}
      </div>

      <div style={{ height: '40px' }} />
    </div>
  );
}
