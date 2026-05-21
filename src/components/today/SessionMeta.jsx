import React from 'react';

export default function SessionMeta({ meta, isSkipped, handleMetaChange }) {
  return (
    <div className="session-meta">
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
      
      <div className="meta-grid" style={{ opacity: isSkipped ? 0.5 : 1 }}>
        <div className="meta-group">
          <div className="meta-label" style={{ color: '#ddd' }}>Mood</div>
          <div className="mood-group">
            {['😴', '😐', '🙂', '🔥', '💪'].map(m => (
              <button key={m} className={`mood-btn ${meta.mood === m ? 'active' : ''}`} onClick={() => !isSkipped && handleMetaChange('mood', m)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer' }}>{m}</button>
            ))}
          </div>
        </div>
        <div className="meta-group">
          <div className="meta-label" style={{ color: '#ddd' }}>Energy</div>
          <div className="energy-group">
            {[1, 2, 3, 4, 5].map(e => (
              <span key={e} className={`energy-star ${meta.energy >= e ? 'active' : ''}`} onClick={() => !isSkipped && handleMetaChange('energy', e)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer' }}>★</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="meta-group" style={{ marginTop: '12px' }}>
        <div className="meta-label">Notes</div>
        <textarea className="notes-input" value={meta.notes || ''} onChange={e => handleMetaChange('notes', e.target.value)} placeholder="How did it feel?"></textarea>
      </div>
    </div>
  );
}
