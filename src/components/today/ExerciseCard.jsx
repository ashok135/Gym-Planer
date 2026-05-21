import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function ExerciseCard({
  ex,
  ek,
  sv,
  prev,
  activeDemo,
  setActiveDemo,
  renameBox,
  toggleRename,
  renameInput,
  setRenameInput,
  saveRename,
  handleInputChange,
  isSkipped,
  getExerciseGif,
  showRenameBtn = true
}) {
  const vol = (sv.s && sv.r && sv.w) ? Math.round(sv.s * sv.r * sv.w) : '';
  const isDone = sv.done;
  const isTimeBased = ex.toLowerCase().includes('plank') || ex.toLowerCase().includes('hold') || ex.toLowerCase().includes('cardio');

  return (
    <div className={`exercise-card ${isDone === true ? 'done' : ''}`} key={ek} style={{ opacity: isDone === false ? 0.4 : (isDone === true ? 0.7 : 1), transition: 'opacity 0.2s' }}>
      <div className="exercise-name-row">
        <div className="exercise-name-wrap" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
            <div onClick={() => !isSkipped && handleInputChange(ek, 'done', isDone === true ? null : true)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
              <CheckCircle2 size={22} color={isDone === true ? "var(--accent)" : "rgba(200, 241, 53, 0.2)"} />
            </div>
            <div onClick={() => !isSkipped && handleInputChange(ek, 'done', isDone === false ? null : false)} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
              <XCircle size={22} color={isDone === false ? "var(--red)" : "rgba(255, 77, 77, 0.2)"} />
            </div>
          </div>
          <div className="exercise-name" style={{ textDecoration: isDone === false ? 'line-through' : 'none', color: isDone === true ? 'var(--accent)' : 'var(--text)', flex: 1 }}>{ex}</div>
          
          <button className="rename-today-btn" onClick={() => setActiveDemo(activeDemo === ek ? null : ek)} style={{ cursor: 'pointer', marginRight: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: activeDemo === ek ? 'rgba(200,241,53,0.1)' : 'transparent', color: activeDemo === ek ? 'var(--accent)' : 'var(--text3)', border: activeDemo === ek ? '1px solid var(--accent)' : 'none', padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s' }}>
            🎬 {activeDemo === ek ? 'Hide' : 'Demo'}
          </button>
          
          {showRenameBtn && (
            <button className="rename-today-btn" onClick={() => !isSkipped && toggleRename(ek, ex)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'pointer' }}>✏️</button>
          )}
        </div>
      </div>

      {activeDemo === ek && (
        <div className="demo-preview-box" style={{ margin: '0 14px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', transition: 'all 0.3s ease-in-out' }}>
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#000' }}>
            <img 
              src={getExerciseGif(ex)} 
              alt={ex} 
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px', color: 'var(--text2)', textAlign: 'center' }}>
              <span style={{ fontSize: '32px' }}>🏋️</span>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{ex}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', maxWidth: '250px' }}>Custom execution video/gif demo not found in library.</div>
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex + ' exercise form guide')}`} target="_blank" rel="noopener noreferrer" 
                 style={{ fontSize: '11px', color: '#000', fontWeight: 'bold', textDecoration: 'none', background: 'var(--accent)', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s' }}>
                Watch Form Guide on YouTube ➔
              </a>
            </div>
          </div>
        </div>
      )}

      {showRenameBtn && renameBox === ek && (
        <div className="rename-input-box open">
          <input type="text" className="rename-input" value={renameInput} onChange={e => setRenameInput(e.target.value)} placeholder="Rename for today only" disabled={isSkipped} />
          <button className="rename-save" onClick={() => saveRename(ek)} disabled={isSkipped}>Apply</button>
        </div>
      )}

      <div className="exercise-inputs">
        <div className="input-group">
          <div className="input-label">SETS</div>
          <input type="number" min="0" placeholder={prev.s || "0"} value={sv.s || ''} onChange={e => handleInputChange(ek, 's', e.target.value)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'text' }} />
        </div>
        <div className="input-group">
          <div className="input-label">{isTimeBased ? 'TIME (s)' : 'REPS'}</div>
          <input type="number" min="0" placeholder={prev.r || "0"} value={sv.r || ''} onChange={e => handleInputChange(ek, 'r', e.target.value)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'text' }} />
        </div>
        <div className="input-group">
          <div className="input-label">{isTimeBased ? 'LEVEL' : 'KG'}</div>
          <input type="number" min="0" step="0.5" placeholder={prev.w || "0"} value={sv.w || ''} onChange={e => handleInputChange(ek, 'w', e.target.value)} disabled={isSkipped} style={{ cursor: isSkipped ? 'not-allowed' : 'text' }} />
        </div>
      </div>
      <div className="vol-row">
        <span className="vol-label">Volume</span>
        <span className="vol-val">{vol ? vol + ' kg' : '—'}</span>
      </div>
    </div>
  );
}
