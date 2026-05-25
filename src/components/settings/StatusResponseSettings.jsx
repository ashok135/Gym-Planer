import React, { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'gstatus_responses_config';

export const DEFAULT_STATUS_RESPONSES = {
  Completed: "Super, Vera level! 💪 Today's workout is complete, you are absolutely crushing it!",
  Partial: "Paravala, half workout is better than no workout! 👍 Keep moving!",
  Skipped: "Enna ya achu? Somaari! Are you ashamed? 💀 Let's get back to it tomorrow!"
};

export function loadStatusResponses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return DEFAULT_STATUS_RESPONSES;
    return { ...DEFAULT_STATUS_RESPONSES, ...saved };
  } catch {
    return DEFAULT_STATUS_RESPONSES;
  }
}

export function saveStatusResponses(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function StatusResponseSettings() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState(() => loadStatusResponses());

  const handleSave = () => {
    saveStatusResponses(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Notify other components
    window.dispatchEvent(new Event('statusResponsesUpdated'));
  };

  const handleReset = () => {
    setConfig(DEFAULT_STATUS_RESPONSES);
    saveStatusResponses(DEFAULT_STATUS_RESPONSES);
    window.dispatchEvent(new Event('statusResponsesUpdated'));
  };

  return (
    <div style={{ padding: '4px 0 8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.4, marginBottom: '4px' }}>
        Customize the motivational phrases or questions that Coach Lucy asks when you change your workout status.
      </p>

      {/* Completed */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Completed Status Response
        </div>
        <textarea
          value={config.Completed}
          onChange={e => setConfig(prev => ({ ...prev, Completed: e.target.value }))}
          placeholder="e.g. Super, Vera level! 💪"
          style={{
            width: '100%',
            height: '60px',
            background: 'var(--bg3)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
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
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Partial Status Response
        </div>
        <textarea
          value={config.Partial}
          onChange={e => setConfig(prev => ({ ...prev, Partial: e.target.value }))}
          placeholder="e.g. Paravala, half workout is better than nothing! 👍"
          style={{
            width: '100%',
            height: '60px',
            background: 'var(--bg3)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
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
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Skipped Status Response
        </div>
        <textarea
          value={config.Skipped}
          onChange={e => setConfig(prev => ({ ...prev, Skipped: e.target.value }))}
          placeholder="e.g. Enna ya achu? Somaari! 💀"
          style={{
            width: '100%',
            height: '60px',
            background: 'var(--bg3)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--red)'}
          onBlur={e => e.target.style.borderColor = 'var(--border2)'}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '12px',
            background: saved ? '#10B981' : 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {saved ? <><Check size={14} /> Saved!</> : 'Save Status Responses'}
        </button>
        <button
          onClick={handleReset}
          title="Reset to default"
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
          <RotateCcw size={13} /> Reset
        </button>
      </div>
    </div>
  );
}
