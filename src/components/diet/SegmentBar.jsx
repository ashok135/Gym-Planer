import React from 'react';

export const SegmentBar = ({ val, onChange, color }) => {
  const activeColor = color || 'var(--accent)';
  return (
    <div style={{ display: 'flex', gap: '4px', width: '70px', height: '24px' }}>
      {[1, 2, 3].map(level => (
        <div
          key={level}
          onClick={(e) => { e.stopPropagation(); onChange(val === level ? 0 : level); }}
          style={{
            flex: 1,
            background: val >= level ? activeColor : 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            transition: 'background 0.2s',
            cursor: 'pointer'
          }}
        />
      ))}
    </div>
  );
};
