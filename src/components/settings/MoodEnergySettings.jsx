import React, { useState, useRef } from 'react';
import { RotateCcw, Upload, Check, Smile, Zap } from 'lucide-react';
import { loadStatusResponses, saveStatusResponses, DEFAULT_STATUS_RESPONSES } from './StatusResponseSettings';

/* ─── Defaults (fallback if user hasn't customised) ─── */
export const DEFAULT_MOOD_STAGES = [
  { img: '/cats/cat1.jpg', label: '💀 I cannot even...',        color: '#888888' },
  { img: '/cats/cat2.jpg', label: '😂 Dying inside lol',        color: '#aaaaaa' },
  { img: '/cats/cat3.jpg', label: '😤 Do not talk to me',       color: '#c8c8cc' },
  { img: '/cats/cat4.jpg', label: '😎 Too cool for this',       color: '#c8f135' },
  { img: '/cats/cat5.jpg', label: "🔥 ABSOLUTE LEGEND — DON'T CARE", color: '#ff6b35' },
];

export const DEFAULT_ENERGY_STAGES = [
  { img: '/power/power1.png', label: '💀 Send a medic NOW',             color: '#888888' },
  { img: '/power/power2.jpg', label: '😩 Running on nothing...',        color: '#aaaaaa' },
  { img: '/power/power3.jpg', label: "😄 Let's gooo!",                  color: '#c8c8cc' },
  { img: '/power/power4.jpg', label: '😤 ZORO MODE — Nothing can stop me', color: '#c8f135' },
  { img: '/power/power5.jpg', label: '⚡ GEAR 5 — I AM INEVITABLE ⚡', color: '#ff6b35' },
];

const STORAGE_KEY = 'gmood_energy_config';

export function loadMoodEnergyConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return null;
    return saved;
  } catch {
    return null;
  }
}

export function saveMoodEnergyConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/* ─── Single stage row editor ─── */
function StageRow({ stage, index, onChange, defaultImg }) {
  const fileRef = useRef();
  const [saved, setSaved] = useState(false);

  const handleLabelChange = (e) => {
    onChange(index, { ...stage, label: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to base64 and store
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(index, { ...stage, img: ev.target.result });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    onChange(index, { ...stage, img: defaultImg });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const isCustomImg = stage.img && stage.img.startsWith('data:');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '8px',
    }}>
      {/* Preview circle */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={stage.img}
          alt=""
          style={{
            width: '52px',
            height: '52px',
            objectFit: 'cover',
            borderRadius: '50%',
            border: `2px solid ${stage.color}`,
            display: 'block',
          }}
          onError={e => { e.target.src = defaultImg; }}
        />
        {/* Stage number badge */}
        <div style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: stage.color,
          color: '#000',
          fontSize: '10px',
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--bg)',
        }}>
          {index + 1}
        </div>
      </div>

      {/* Label input */}
      <input
        type="text"
        value={stage.label}
        onChange={handleLabelChange}
        placeholder={`Stage ${index + 1} label`}
        style={{
          flex: 1,
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          color: 'var(--text)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '12px',
          outline: 'none',
          fontFamily: 'inherit',
          minWidth: 0,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border2)'}
      />

      {/* Upload button */}
      <button
        onClick={() => fileRef.current?.click()}
        title="Upload custom image"
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: '8px',
          padding: '7px 9px',
          cursor: 'pointer',
          color: 'var(--text2)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {saved ? <Check size={14} color="var(--accent)" /> : <Upload size={14} />}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* Reset to default */}
      {isCustomImg && (
        <button
          onClick={handleReset}
          title="Reset to default"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '7px 9px',
            cursor: 'pointer',
            color: 'var(--text3)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <RotateCcw size={13} />
        </button>
      )}
    </div>
  );
}

/* ─── Main MoodEnergySettings component ─── */
export default function MoodEnergySettings() {
  const [saved, setSaved] = useState(false);

  // Load from localStorage or use defaults
  const [moodStages, setMoodStages] = useState(() => {
    const cfg = loadMoodEnergyConfig();
    return cfg?.mood || DEFAULT_MOOD_STAGES;
  });

  const [energyStages, setEnergyStages] = useState(() => {
    const cfg = loadMoodEnergyConfig();
    return cfg?.energy || DEFAULT_ENERGY_STAGES;
  });

  const [statusResponses, setStatusResponses] = useState(() => {
    return loadStatusResponses();
  });

  const handleMoodChange = (idx, updated) => {
    setMoodStages(prev => prev.map((s, i) => i === idx ? updated : s));
  };

  const handleEnergyChange = (idx, updated) => {
    setEnergyStages(prev => prev.map((s, i) => i === idx ? updated : s));
  };

  const handleSave = () => {
    saveMoodEnergyConfig({ mood: moodStages, energy: energyStages });
    saveStatusResponses(statusResponses);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Notify SessionMeta to re-read
    window.dispatchEvent(new Event('moodEnergyConfigUpdated'));
    window.dispatchEvent(new Event('statusResponsesUpdated'));
  };

  const handleResetAll = () => {
    setMoodStages(DEFAULT_MOOD_STAGES);
    setEnergyStages(DEFAULT_ENERGY_STAGES);
    setStatusResponses(DEFAULT_STATUS_RESPONSES);
    saveMoodEnergyConfig({ mood: DEFAULT_MOOD_STAGES, energy: DEFAULT_ENERGY_STAGES });
    saveStatusResponses(DEFAULT_STATUS_RESPONSES);
    window.dispatchEvent(new Event('moodEnergyConfigUpdated'));
    window.dispatchEvent(new Event('statusResponsesUpdated'));
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text2)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '10px',
    marginTop: '4px',
  };

  return (
    <div style={{ padding: '4px 0 8px' }}>
      {/* MOOD section */}
      <div style={labelStyle}>
        <Smile size={14} color="var(--accent)" />
        Mood Stages
      </div>
      {moodStages.map((stage, i) => (
        <StageRow
          key={i}
          stage={stage}
          index={i}
          onChange={handleMoodChange}
          defaultImg={DEFAULT_MOOD_STAGES[i].img}
        />
      ))}

      {/* ENERGY section */}
      <div style={{ ...labelStyle, marginTop: '18px' }}>
        <Zap size={14} color="#ff6b35" />
        Energy Stages
      </div>
      {energyStages.map((stage, i) => (
        <StageRow
          key={i}
          stage={stage}
          index={i}
          onChange={handleEnergyChange}
          defaultImg={DEFAULT_ENERGY_STAGES[i].img}
        />
      ))}

      {/* WORKOUT STATUS RESPONSES section */}
      <div style={{ ...labelStyle, marginTop: '18px' }}>
        <Smile size={14} color="var(--accent)" />
        Status Motivational Lucy Responses
      </div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px', 
        background: 'var(--bg)', 
        border: '1px solid var(--border)', 
        borderRadius: '12px', 
        padding: '14px', 
        marginBottom: '14px' 
      }}>
        {/* Completed */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Completed Response (Motivate / Tamil)
          </div>
          <textarea
            value={statusResponses.Completed}
            onChange={e => setStatusResponses(prev => ({ ...prev, Completed: e.target.value }))}
            style={{
              width: '100%',
              height: '46px',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = '#10B981'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>

        {/* Partial */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Partial Response (Motivate / Tamil)
          </div>
          <textarea
            value={statusResponses.Partial}
            onChange={e => setStatusResponses(prev => ({ ...prev, Partial: e.target.value }))}
            style={{
              width: '100%',
              height: '46px',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>

        {/* Skipped */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Skipped Response (Tamil / Ashamed)
          </div>
          <textarea
            value={statusResponses.Skipped}
            onChange={e => setStatusResponses(prev => ({ ...prev, Skipped: e.target.value }))}
            style={{
              width: '100%',
              height: '46px',
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--red)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '12px',
            background: saved ? '#10B981' : 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 400,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
        </button>
        <button
          onClick={handleResetAll}
          title="Reset all to default"
          style={{
            padding: '12px 16px',
            background: 'var(--bg3)',
            color: 'var(--text2)',
            border: '1px solid var(--border2)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
          }}
        >
          <RotateCcw size={13} /> Reset All
        </button>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px', lineHeight: 1.5 }}>
        Tip: Upload any image (JPG, PNG, GIF) for each stage. Changes apply immediately after saving.
      </div>
    </div>
  );
}
