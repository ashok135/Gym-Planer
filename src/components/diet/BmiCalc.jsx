import React from 'react';
import { RingMeter } from './RingMeter';
import { BMI_CATEGORIES, getBmiCategory } from './utils/calcMath';

export const BmiCalc = ({
  heightCm,
  handleHeightChange,
  weightKg,
  handleWeightChange,
  inputStyle,
  labelStyle
}) => {
  const h   = parseFloat(heightCm) / 100;
  const w   = parseFloat(weightKg);
  const bmi = (h > 0 && w > 0) ? +(w / (h * h)).toFixed(1) : 0;
  const bmiCat  = bmi > 0 ? getBmiCategory(bmi) : null;
  const bmiPct  = bmi > 0 ? Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100)) : 0;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>⚖️ BMI Calculator</div>
      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '18px' }}>Body Mass Index — check your weight category</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div>
          <div style={labelStyle}>Height (cm)</div>
          <input type="number" min="100" max="250" value={heightCm}
            onChange={e => handleHeightChange(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Weight (kg)</div>
          <input type="number" min="30" max="300" value={weightKg}
            onChange={e => handleWeightChange(e.target.value)} style={inputStyle} />
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
  );
};
