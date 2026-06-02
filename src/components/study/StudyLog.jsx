import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { dateKey, renderSubjectIcon } from './utils/studyMath';

export const StudyLog = ({ STUDY, syncStudy, subjects }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ subjectId: subjects[0]?.id || 'dsa', hours: '1', learned: '' });

  const addSession = () => {
    if (!addForm.hours || isNaN(addForm.hours) || Number(addForm.hours) <= 0) return;
    const d = new Date();
    const dk = dateKey(d);
    const tm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const ts = d.getTime();

    const newSession = {
      id: ts.toString(),
      subjectId: addForm.subjectId,
      hours: Number(addForm.hours),
      learned: addForm.learned.trim(),
      time: tm,
      timestamp: ts
    };

    const targetDayData = STUDY[dk] || { sessions: [] };
    const newStudy = { ...STUDY, [dk]: { ...targetDayData, sessions: [...(targetDayData.sessions || []), newSession] } };
    syncStudy(newStudy);
    setAddForm({ subjectId: subjects[0]?.id || 'dsa', hours: '1', learned: '' });
    setShowAdd(false);
  };

  return (
    <>
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(200,241,53,0.2)' }}>
          <PlusCircle size={18} /> Log Study Session
        </button>
      </div>

      {showAdd && (
        <div style={{ margin: '0 20px 24px', background: 'var(--bg3)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border2)' }}>
          <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>New Session</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {subjects.map(s => (
              <div key={s.id} onClick={() => setAddForm(f => ({ ...f, subjectId: s.id }))}
                style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: addForm.subjectId === s.id ? s.color : 'var(--bg)', color: addForm.subjectId === s.id ? '#000' : 'var(--text2)', fontWeight: 700, border: `1px solid ${addForm.subjectId === s.id ? s.color : 'var(--border2)'}`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {renderSubjectIcon(s.id, s.emoji, 13)} {s.label}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Select Hours</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[0.5, 1, 1.5, 2, 2.5, 3, 4].map(h => (
                <div key={h} onClick={() => setAddForm(f => ({ ...f, hours: h.toString() }))}
                  style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: addForm.hours == h ? 'var(--accent)' : 'var(--bg)', color: addForm.hours == h ? '#000' : 'var(--text2)', border: `1px solid ${addForm.hours == h ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700 }}>
                  {h}h
                </div>
              ))}
            </div>
          </div>
          <textarea placeholder="What topic did you cover?" value={addForm.learned} onChange={e => setAddForm(f => ({ ...f, learned: e.target.value }))}
            rows={2} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addSession} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Save Entry</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};
