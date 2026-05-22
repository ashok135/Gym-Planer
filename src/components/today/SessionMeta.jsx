import React, { useState } from 'react';

/* ─── Mood Face SVG — morphs from dull → happy ─── */
function MoodFace({ value }) {
  // value 0..100
  const t = value / 100;

  // Face color: grey-blue (dull) → bright yellow-green (hyped)
  const r = Math.round(lerp(80, 200, t));
  const g = Math.round(lerp(90, 241, t));
  const b = Math.round(lerp(110, 53, t));
  const faceColor = `rgb(${r},${g},${b})`;

  // Eye openness: barely open (dull) → wide (happy)
  const eyeOpen = lerp(1.5, 6, t);
  const pupilSize = lerp(1.2, 3.5, t);

  // Mouth: flat frown → huge grin
  // Using SVG path for mouth arc
  const mouthY = 68;
  const mouthCX = 50;
  const mouthW = lerp(10, 24, t);
  const mouthCurve = lerp(-6, 12, t); // negative = frown, positive = smile

  // Eyebrows: angry/droopy → raised happy
  const browLift = lerp(4, -3, t); // distance above eye
  const browAngle = lerp(8, -4, t); // angle (positive = inner higher, negative = inner lower)

  // Sweat drop — only visible when dull/tired (t < 0.3)
  const sweatOpacity = Math.max(0, 0.3 - t) / 0.3;

  // Blush cheeks — only visible when happy (t > 0.6)
  const blushOpacity = Math.max(0, t - 0.6) / 0.4;

  // Stars / sparkles around face when very happy (t > 0.75)
  const sparkOpacity = Math.max(0, t - 0.75) / 0.25;

  // Wobble animation scale when fully happy
  const happyBounce = t > 0.85 ? 'animMoodBounce 0.6s ease-in-out infinite alternate' : 'none';

  return (
    <svg
      viewBox="0 0 100 100"
      width="80"
      height="80"
      style={{ filter: `drop-shadow(0 0 ${Math.round(t * 18)}px ${faceColor}44)`, animation: happyBounce, display: 'block', margin: '0 auto' }}
    >
      {/* Sparkle stars */}
      {[[-14, 20], [14, 15], [-18, 50], [18, 48], [-10, 78], [12, 80]].map(([dx, dy], i) => (
        <text
          key={i}
          x={50 + dx}
          y={dy}
          fontSize="7"
          textAnchor="middle"
          fill="#c8f135"
          opacity={sparkOpacity * (0.6 + 0.4 * Math.sin(i * 1.3))}
          style={{ userSelect: 'none' }}
        >★</text>
      ))}

      {/* Sweat drop (tired) */}
      <ellipse cx={72} cy={28} rx={3} ry={4.5}
        fill="#4d9fff" opacity={sweatOpacity}
        style={{ transform: 'rotate(-15deg)', transformOrigin: '72px 28px' }} />
      <ellipse cx={72} cy={24} rx={2} ry={2}
        fill="#4d9fff" opacity={sweatOpacity} />

      {/* Face circle */}
      <circle cx="50" cy="50" r="38"
        fill={faceColor}
        stroke={`rgba(0,0,0,0.15)`}
        strokeWidth="1.5"
      />

      {/* Blush cheeks */}
      <ellipse cx="28" cy="64" rx="9" ry="5" fill="#ff6b9d" opacity={blushOpacity * 0.55} />
      <ellipse cx="72" cy="64" rx="9" ry="5" fill="#ff6b9d" opacity={blushOpacity * 0.55} />

      {/* Left eyebrow */}
      <line
        x1={33 - 6} y1={32 + browLift - browAngle}
        x2={33 + 6} y2={32 + browLift + browAngle}
        stroke="#000" strokeWidth="2.5" strokeLinecap="round"
        opacity="0.75"
      />
      {/* Right eyebrow */}
      <line
        x1={67 - 6} y1={32 + browLift + browAngle}
        x2={67 + 6} y2={32 + browLift - browAngle}
        stroke="#000" strokeWidth="2.5" strokeLinecap="round"
        opacity="0.75"
      />

      {/* Left eye white */}
      <ellipse cx="33" cy="43" rx="6" ry={eyeOpen} fill="white" opacity="0.95" />
      {/* Left pupil */}
      <circle cx="33" cy={43 + (eyeOpen < 3 ? 1.5 : 0)} r={pupilSize} fill="#1a1a2e" />
      {/* Left eye shine */}
      <circle cx={34.5} cy={42} r={pupilSize * 0.4} fill="white" opacity={0.7} />

      {/* Right eye white */}
      <ellipse cx="67" cy="43" rx="6" ry={eyeOpen} fill="white" opacity="0.95" />
      {/* Right pupil */}
      <circle cx="67" cy={43 + (eyeOpen < 3 ? 1.5 : 0)} r={pupilSize} fill="#1a1a2e" />
      {/* Right eye shine */}
      <circle cx={68.5} cy={42} r={pupilSize * 0.4} fill="white" opacity={0.7} />

      {/* ZZZ when very dull (t < 0.15) */}
      {t < 0.2 && (
        <text x="70" y="28" fontSize="9" fill="#aaa" opacity={Math.max(0, 0.2 - t) / 0.2 * 0.9} style={{ userSelect: 'none' }}>z</text>
      )}
      {t < 0.12 && (
        <text x="76" y="21" fontSize="7" fill="#aaa" opacity={Math.max(0, 0.12 - t) / 0.12 * 0.8} style={{ userSelect: 'none' }}>z</text>
      )}

      {/* Mouth */}
      <path
        d={`M ${mouthCX - mouthW} ${mouthY} Q ${mouthCX} ${mouthY + mouthCurve} ${mouthCX + mouthW} ${mouthY}`}
        stroke="#000"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill={mouthCurve > 6 ? `rgba(0,0,0,0.15)` : 'none'}
        opacity="0.8"
      />

      {/* Teeth when very happy */}
      {mouthCurve > 8 && (
        <path
          d={`M ${mouthCX - mouthW + 3} ${mouthY + 1} Q ${mouthCX} ${mouthY + mouthCurve - 1} ${mouthCX + mouthW - 3} ${mouthY + 1}`}
          fill="white"
          opacity={Math.min(1, (mouthCurve - 8) / 4) * 0.9}
        />
      )}
    </svg>
  );
}

/* ─── Energy Guy SVG — from drained → JACKED ─── */
function EnergyGuy({ value }) {
  const t = value / 100;

  // Body color: grey → fiery orange-red → glowing lime
  const phase = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  let bodyR, bodyG, bodyB;
  if (t < 0.5) {
    bodyR = Math.round(lerp(90, 255, t * 2));
    bodyG = Math.round(lerp(90, 140, t * 2));
    bodyB = Math.round(lerp(100, 30, t * 2));
  } else {
    bodyR = Math.round(lerp(255, 200, (t - 0.5) * 2));
    bodyG = Math.round(lerp(140, 241, (t - 0.5) * 2));
    bodyB = Math.round(lerp(30, 53, (t - 0.5) * 2));
  }
  const bodyColor = `rgb(${bodyR},${bodyG},${bodyB})`;

  // Posture: slouched (spine Y offset) → upright → arms raised
  const spineY = lerp(10, 0, t); // body drops when tired
  const bodyTilt = lerp(15, 0, t); // tilt when tired

  // Arm angles:  dragging down (tired) → raised up (hyped)
  const leftArmAngle = lerp(60, -120, t);   // degrees from horizontal
  const rightArmAngle = lerp(120, -60, t);

  // Head drooping → upright
  const headDrop = lerp(8, 0, t);

  // Lightning bolts when high energy
  const boltOpacity = Math.max(0, t - 0.65) / 0.35;

  // Shake/bounce animation
  const animation = t > 0.8
    ? 'animEnergyShake 0.3s ease-in-out infinite alternate'
    : t < 0.15
    ? 'animEnergySlump 2s ease-in-out infinite alternate'
    : 'none';

  // Glow
  const glowColor = t > 0.5 ? bodyColor : 'transparent';

  return (
    <svg
      viewBox="0 0 100 110"
      width="76"
      height="76"
      style={{ filter: `drop-shadow(0 0 ${Math.round(t * 16)}px ${glowColor})`, animation, display: 'block', margin: '0 auto' }}
    >
      {/* Lightning bolts */}
      <text x="8" y="35" fontSize="14" opacity={boltOpacity * 0.9} style={{ userSelect: 'none' }}>⚡</text>
      <text x="74" y="35" fontSize="14" opacity={boltOpacity * 0.9} style={{ userSelect: 'none' }}>⚡</text>
      {t > 0.9 && <text x="40" y="10" fontSize="10" opacity={boltOpacity} style={{ userSelect: 'none' }}>🔥</text>}

      <g transform={`translate(0, ${spineY}) rotate(${bodyTilt * (t < 0.3 ? 1 : 0)}, 50, 70)`}>

        {/* Head */}
        <g transform={`translate(0, ${headDrop})`}>
          <circle cx="50" cy="25" r="16" fill={bodyColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
          {/* Eyes */}
          <ellipse cx="44" cy={t < 0.3 ? 26 : 24} rx="3" ry={t < 0.2 ? 1 : 3} fill="white" />
          <circle cx="44" cy={t < 0.3 ? 26 : 24} r={t < 0.2 ? 0.8 : 1.8} fill="#1a1a2e" />
          <ellipse cx="56" cy={t < 0.3 ? 26 : 24} rx="3" ry={t < 0.2 ? 1 : 3} fill="white" />
          <circle cx="56" cy={t < 0.3 ? 26 : 24} r={t < 0.2 ? 0.8 : 1.8} fill="#1a1a2e" />
          {/* Eye shine */}
          <circle cx="45.5" cy={t < 0.3 ? 25.5 : 23.5} r={0.7} fill="white" opacity={t > 0.2 ? 0.8 : 0} />
          <circle cx="57.5" cy={t < 0.3 ? 25.5 : 23.5} r={0.7} fill="white" opacity={t > 0.2 ? 0.8 : 0} />
          {/* Mouth */}
          <path
            d={t < 0.25
              ? `M 44 32 Q 50 30 56 32`   // frown
              : t < 0.6
              ? `M 44 32 Q 50 33 56 32`   // slight smile
              : `M 43 31 Q 50 37 57 31`   // big grin
            }
            stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75"
          />
          {/* Sweat when tired */}
          {t < 0.3 && (
            <ellipse cx="62" cy="20" rx="2" ry="3" fill="#4d9fff" opacity={(0.3 - t) / 0.3 * 0.8} />
          )}
        </g>

        {/* Neck */}
        <rect x="46" y={39 + headDrop} width="8" height="8" rx="2" fill={bodyColor} opacity="0.9" />

        {/* Body / torso */}
        <rect x={38} y={46} width="24" height={lerp(22, 26, t)} rx="5" fill={bodyColor} opacity="0.95" />

        {/* Abs lines when pumped */}
        {t > 0.7 && (
          <>
            <line x1="50" y1="50" x2="50" y2={46 + lerp(22, 26, t)} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="40" y1="56" x2="60" y2="56" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
            <line x1="40" y1="62" x2="60" y2="62" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          </>
        )}

        {/* Left arm */}
        <g transform={`rotate(${leftArmAngle}, 38, 52)`}>
          <rect x="22" y="49" width="16" height="7" rx="3.5" fill={bodyColor} opacity="0.9" />
          {/* Fist/hand */}
          <circle cx="20" cy="52.5" r="5" fill={bodyColor} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Right arm */}
        <g transform={`rotate(${rightArmAngle}, 62, 52)`}>
          <rect x="62" y="49" width="16" height="7" rx="3.5" fill={bodyColor} opacity="0.9" />
          <circle cx="80" cy="52.5" r="5" fill={bodyColor} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Left leg */}
        <rect
          x="38" y={46 + lerp(22, 26, t) - 2}
          width="10" height={lerp(18, 22, t)} rx="4"
          fill={bodyColor} opacity="0.85"
          transform={t < 0.3 ? `rotate(8, 43, ${46 + 22})` : 'none'}
        />
        {/* Right leg */}
        <rect
          x="52" y={46 + lerp(22, 26, t) - 2}
          width="10" height={lerp(18, 22, t)} rx="4"
          fill={bodyColor} opacity="0.85"
          transform={t < 0.3 ? `rotate(-8, 57, ${46 + 22})` : 'none'}
        />

      </g>
    </svg>
  );
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/* ─── Labels ─── */
const MOOD_LABELS = [
  { max: 10,  text: '💀 Dead Inside', color: '#888' },
  { max: 25,  text: '😑 Meh...',       color: '#aaa' },
  { max: 45,  text: '😐 Okay I Guess', color: '#bbb' },
  { max: 65,  text: '🙂 Feeling Alright', color: '#c8f135' },
  { max: 80,  text: '😁 Pretty Good!',  color: '#8ef' },
  { max: 95,  text: '🤩 LET\'S GOOO!!',  color: '#c8f135' },
  { max: 100, text: '🔥 ABSOLUTE UNIT!', color: '#ff6b35' },
];

const ENERGY_LABELS = [
  { max: 10,  text: '☠️ Send Help',       color: '#888' },
  { max: 25,  text: '🥱 Need Coffee x10', color: '#aaa' },
  { max: 45,  text: '😴 Running on Fumes', color: '#bbb' },
  { max: 65,  text: '⚡ Getting There',    color: '#c8f135' },
  { max: 80,  text: '💪 Feeling Strong!', color: '#8ef' },
  { max: 95,  text: '🔥 Beast Mode ON',   color: '#c8f135' },
  { max: 100, text: '⚡ SUPERHUMAN ⚡',    color: '#ff6b35' },
];

function getLabel(value, labels) {
  return labels.find(l => value <= l.max) || labels[labels.length - 1];
}

/* ─── Animated Slider ─── */
function AnimSlider({ value, onChange, disabled, face, labels, id }) {
  const pct = value;
  const lbl = getLabel(pct, labels);

  return (
    <div style={{ padding: '4px 0' }}>
      <style>{`
        @keyframes animMoodBounce {
          from { transform: scale(1) translateY(0); }
          to   { transform: scale(1.07) translateY(-4px); }
        }
        @keyframes animEnergyShake {
          from { transform: translateX(-2px) rotate(-3deg); }
          to   { transform: translateX(2px) rotate(3deg); }
        }
        @keyframes animEnergySlump {
          from { transform: translateY(0px) rotate(0deg); }
          to   { transform: translateY(3px) rotate(5deg); }
        }
        .anim-slider-track {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .anim-slider-track::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 3px solid #000;
          box-shadow: 0 0 8px rgba(200,241,53,0.6);
          transition: box-shadow 0.2s;
        }
        .anim-slider-track::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 3px solid #000;
          box-shadow: 0 0 8px rgba(200,241,53,0.6);
        }
      `}</style>

      {/* Face/Guy display */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', minHeight: '84px', alignItems: 'center' }}>
        {face === 'mood' ? <MoodFace value={pct} /> : <EnergyGuy value={pct} />}
      </div>

      {/* Label */}
      <div style={{
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 400,
        color: lbl.color,
        letterSpacing: '0.04em',
        marginBottom: '10px',
        minHeight: '18px',
        transition: 'color 0.3s',
      }}>
        {lbl.text}
      </div>

      {/* Slider track */}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          disabled={disabled}
          onChange={e => onChange(parseInt(e.target.value))}
          className="anim-slider-track"
          style={{
            background: `linear-gradient(to right, ${lbl.color} 0%, ${lbl.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
      </div>

      {/* Tick labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text3)' }}>
        <span>{face === 'mood' ? 'Dead 💀' : 'Empty ☠️'}</span>
        <span>{face === 'mood' ? '🔥 Hyped' : '⚡ Beast'}</span>
      </div>
    </div>
  );
}

/* ─── Main SessionMeta export ─── */
export default function SessionMeta({ meta, isSkipped, handleMetaChange }) {
  // Convert legacy mood emoji to numeric 0-100
  const MOOD_EMOJI_MAP = { '😴': 5, '😐': 25, '🙂': 55, '🔥': 80, '💪': 100 };
  const rawMood = meta.mood;
  let moodVal = typeof rawMood === 'number'
    ? rawMood
    : (MOOD_EMOJI_MAP[rawMood] ?? 50);

  // Energy: was 1-5 scale, now 0-100
  const rawEnergy = meta.energy;
  let energyVal = typeof rawEnergy === 'number' && rawEnergy <= 5
    ? Math.round((rawEnergy / 5) * 100)
    : (typeof rawEnergy === 'number' ? rawEnergy : 50);

  const onMoodChange = (v) => {
    handleMetaChange('mood', v); // store as number
  };

  const onEnergyChange = (v) => {
    handleMetaChange('energy', v); // store as number
  };

  return (
    <div className="session-meta">
      {/* Top meta grid */}
      <div className="meta-grid">
        <div className="meta-group">
          <div className="meta-label">Status</div>
          <select className="meta-input" value={meta.status || 'Completed'} onChange={e => handleMetaChange('status', e.target.value)}>
            <option value="Completed">Completed</option>
            <option value="Partial">Partial</option>
            <option value="Skipped">Skipped</option>
          </select>
        </div>
        <div className="meta-group">
          <div className="meta-label">Body Weight (kg)</div>
          <input type="number" step="0.1" className="meta-input" value={meta.bw || ''} onChange={e => handleMetaChange('bw', e.target.value)} placeholder="e.g. 75.5" disabled={isSkipped} />
        </div>
        <div className="meta-group">
          <div className="meta-label">Start Time</div>
          <input type="time" className="meta-input" value={meta.start || ''} onChange={e => handleMetaChange('start', e.target.value)} disabled={isSkipped} />
        </div>
        <div className="meta-group">
          <div className="meta-label">End Time</div>
          <input type="time" className="meta-input" value={meta.end || ''} onChange={e => handleMetaChange('end', e.target.value)} disabled={isSkipped} />
        </div>
      </div>

      {/* ─── ANIMATED MOOD + ENERGY SLIDERS ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          margin: '16px 0',
          opacity: isSkipped ? 0.4 : 1,
          transition: 'opacity 0.3s',
          pointerEvents: isSkipped ? 'none' : 'auto',
        }}
      >
        {/* MOOD */}
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '14px 12px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
            Mood
          </div>
          <AnimSlider
            id="mood-slider"
            value={moodVal}
            onChange={onMoodChange}
            disabled={isSkipped}
            face="mood"
            labels={MOOD_LABELS}
          />
        </div>

        {/* ENERGY */}
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '14px 12px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
            Energy
          </div>
          <AnimSlider
            id="energy-slider"
            value={energyVal}
            onChange={onEnergyChange}
            disabled={isSkipped}
            face="energy"
            labels={ENERGY_LABELS}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="meta-group" style={{ marginTop: '4px' }}>
        <div className="meta-label">Notes</div>
        <textarea className="notes-input" value={meta.notes || ''} onChange={e => handleMetaChange('notes', e.target.value)} placeholder="How did it feel?" />
      </div>
    </div>
  );
}
