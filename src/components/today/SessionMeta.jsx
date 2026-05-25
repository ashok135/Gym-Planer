import React, { useState, useEffect } from 'react';
import {
  DEFAULT_MOOD_STAGES,
  DEFAULT_ENERGY_STAGES,
  loadMoodEnergyConfig,
} from '../settings/MoodEnergySettings';

/* ─── Animation config (based on stage index, not stored in localStorage) ─── */
const MOOD_ANIMS   = ['catCry 1.8s ease-in-out infinite alternate', 'none', 'none', 'none', 'catHype 0.5s ease-in-out infinite alternate'];
const ENERGY_ANIMS = ['powerDead 2s ease-in-out infinite alternate', 'none', 'none', 'none', 'gear5Shake 0.2s ease-in-out infinite alternate'];
const MOOD_FILTERS   = ['grayscale(40%) brightness(0.8)', 'brightness(0.9)', 'none', 'brightness(1.05) saturate(1.1)', 'brightness(1.15) saturate(1.3)'];
const ENERGY_FILTERS = ['grayscale(50%) brightness(0.7)', 'grayscale(20%) brightness(0.85)', 'brightness(1.05)', 'brightness(1.1) saturate(1.3)', 'brightness(1.25) saturate(1.6)'];

/* ─── Map 0-100 slider value → stage index (0..4) ─── */
function getStageIdx(value) {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

/* ─── The animated image display — ONE image at a time, fades on stage change ─── */
function StageDisplay({ value, stages, anims, filters }) {
  const idx = getStageIdx(value);
  const stage = stages[idx];
  const anim = anims[idx];
  const filter = filters[idx];

  const animStr = anim && anim !== 'none'
    ? `stageFadeIn 0.35s ease forwards, ${anim}`
    : 'stageFadeIn 0.35s ease forwards';

  return (
    <div style={{ position: 'relative', width: '112px', height: '112px', margin: '0 auto' }}>
      <style>{`
        @keyframes stageFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes catCry {
          from { transform: scale(0.95) rotate(-3deg) translateY(2px); }
          to   { transform: scale(0.98) rotate(-1deg) translateY(-1px); }
        }
        @keyframes catHype {
          from { transform: scale(1.05) rotate(-3deg); }
          to   { transform: scale(1.1) rotate(3deg); }
        }
        @keyframes powerDead {
          from { transform: scale(0.93) translateY(3px); }
          to   { transform: scale(0.97) translateY(0px); }
        }
        @keyframes gear5Shake {
          from { transform: scale(1.06) rotate(-4deg) translateX(-2px); }
          to   { transform: scale(1.11) rotate(4deg) translateX(2px); }
        }
      `}</style>
      {/* key on wrapper forces React to remount on stage change → clean fade-in, no mixing */}
      <div key={idx} style={{ position: 'absolute', inset: 0 }}>
        <img
          src={stage.img}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            border: `3px solid ${stage.color}`,
            filter,
            animation: animStr,
            boxShadow: value > 60 ? `0 0 ${Math.round(value * 0.22)}px ${stage.color}55` : 'none',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'block',
          }}
          onError={e => { e.target.style.opacity = 0; }}
        />
      </div>
    </div>
  );
}

/* ─── Single animated slider card ─── */
function MemeSlider({ id, value, onChange, disabled, stages, anims, filters, bottomLeft, bottomRight }) {
  const idx = getStageIdx(value);
  const stage = stages[idx];

  return (
    <div style={{ padding: '2px 0' }}>
      <style>{`
        .meme-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
        }
        .meme-range:disabled { cursor: not-allowed; opacity: 0.4; }
        .meme-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          border: 3px solid #111;
          box-shadow: 0 0 10px rgba(200,241,53,0.55);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .meme-range::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          border: 3px solid #111;
          cursor: pointer;
        }
      `}</style>

      {/* Image display */}
      <div style={{ marginBottom: '10px' }}>
        <StageDisplay value={value} stages={stages} anims={anims} filters={filters} />
      </div>

      {/* Meme label */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: stage.color,
        letterSpacing: '0.02em',
        marginBottom: '10px',
        minHeight: '18px',
        transition: 'color 0.3s ease',
        fontWeight: 400,
        lineHeight: 1.4,
      }}>
        {stage.label} <span style={{ opacity: 0.8, fontSize: '10px', fontWeight: 300 }}>({idx + 1}/5)</span>
      </div>

      {/* Slider track */}
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        disabled={disabled}
        onChange={e => onChange(parseInt(e.target.value))}
        className="meme-range"
        style={{
          background: `linear-gradient(to right, ${stage.color} 0%, ${stage.color} ${value}%, rgba(255,255,255,0.08) ${value}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />

      {/* Min/Max labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text3)' }}>
        <span>{bottomLeft}</span>
        <span>{bottomRight}</span>
      </div>
    </div>
  );
}

/* ─── Main SessionMeta export ─── */
export default function SessionMeta({ meta, isSkipped, handleMetaChange }) {
  // Load config from localStorage (user-customised labels + images)
  const [moodStages, setMoodStages] = useState(() => {
    const cfg = loadMoodEnergyConfig();
    return cfg?.mood || DEFAULT_MOOD_STAGES;
  });
  const [energyStages, setEnergyStages] = useState(() => {
    const cfg = loadMoodEnergyConfig();
    return cfg?.energy || DEFAULT_ENERGY_STAGES;
  });

  // Listen for config updates from Settings page
  useEffect(() => {
    const refresh = () => {
      const cfg = loadMoodEnergyConfig();
      if (cfg?.mood) setMoodStages(cfg.mood);
      if (cfg?.energy) setEnergyStages(cfg.energy);
    };
    window.addEventListener('moodEnergyConfigUpdated', refresh);
    return () => window.removeEventListener('moodEnergyConfigUpdated', refresh);
  }, []);

  // Support both old emoji mood and new numeric mood
  const MOOD_EMOJI_MAP = { '😴': 5, '😐': 25, '🙂': 55, '🔥': 80, '💪': 100 };
  const rawMood = meta.mood;
  const moodVal = typeof rawMood === 'number'
    ? rawMood
    : (MOOD_EMOJI_MAP[rawMood] ?? 50);

  // Support old 1-5 energy scale and new 0-100
  const rawEnergy = meta.energy;
  const energyVal = typeof rawEnergy === 'number' && rawEnergy <= 5
    ? Math.round((rawEnergy / 5) * 100)
    : (typeof rawEnergy === 'number' ? rawEnergy : 50);

  return (
    <div className="session-meta">
      {/* Standard meta grid */}
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
          <input type="number" step="0.1" className="meta-input" value={meta.bw || ''} onChange={e => handleMetaChange('bw', e.target.value)} placeholder="75.5" disabled={isSkipped} />
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

      {/* ─── MEME SLIDERS ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          margin: '16px 0 4px',
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
          <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '10px' }}>
            Mood
          </div>
          <MemeSlider
            id="mood-slider"
            value={moodVal}
            onChange={v => handleMetaChange('mood', v)}
            disabled={isSkipped}
            stages={moodStages}
            anims={MOOD_ANIMS}
            filters={MOOD_FILTERS}
            bottomLeft="💀 Dead"
            bottomRight="🔥 Legend"
          />
        </div>

        {/* ENERGY */}
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '14px 12px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '10px' }}>
            Energy
          </div>
          <MemeSlider
            id="energy-slider"
            value={energyVal}
            onChange={v => handleMetaChange('energy', v)}
            disabled={isSkipped}
            stages={energyStages}
            anims={ENERGY_ANIMS}
            filters={ENERGY_FILTERS}
            bottomLeft="💀 Empty"
            bottomRight="⚡ Gear 5"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="meta-group" style={{ marginTop: '8px' }}>
        <div className="meta-label">Notes</div>
        <textarea
          className="notes-input"
          value={meta.notes || ''}
          onChange={e => handleMetaChange('notes', e.target.value)}
          placeholder="How did it feel?"
        />
      </div>
    </div>
  );
}
