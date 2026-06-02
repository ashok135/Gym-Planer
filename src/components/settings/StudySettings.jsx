import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import Accordion from '../shared/Accordion';

const SUBJECT_COLORS = ['#A78BFA', '#FBBF24', '#4D9FFF', '#34D399', '#FB923C', '#F472B6', '#FF6B6B'];

export default function StudySettings({ STUDY_SETTINGS, syncStudy, STUDY }) {
  const [localDailyTarget, setLocalDailyTarget] = useState(STUDY_SETTINGS?.dailyTarget || 4);
  const [localSubjects, setLocalSubjects] = useState(STUDY_SETTINGS?.subjects || []);
  const [newSubjectLabel, setNewSubjectLabel] = useState('');
  const [studyMsg, setStudyMsg] = useState(false);

  useEffect(() => {
    if (STUDY_SETTINGS) {
      setLocalDailyTarget(STUDY_SETTINGS.dailyTarget || 4);
      setLocalSubjects(STUDY_SETTINGS.subjects || []);
    }
  }, [STUDY_SETTINGS]);

  const addSubject = () => {
    if (!newSubjectLabel.trim()) return;
    const newSub = { id: Date.now().toString(), label: newSubjectLabel.trim(), emoji: '📖', color: SUBJECT_COLORS[localSubjects.length % SUBJECT_COLORS.length] };
    setLocalSubjects(prev => [...prev, newSub]);
    setNewSubjectLabel('');
  };

  const removeSubject = (id) => setLocalSubjects(prev => prev.filter(s => s.id !== id));

  const saveStudySettings = () => {
    const newSettings = { ...STUDY_SETTINGS, dailyTarget: Number(localDailyTarget), subjects: localSubjects };
    syncStudy(STUDY, newSettings);
    setStudyMsg(true);
    setTimeout(() => setStudyMsg(false), 2000);
  };

  return (
    <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={16} style={{ color: 'var(--accent)' }} /> Study Defaults</span>} subtitle="Daily target & subjects">
      <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Daily Target (hours)</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[2, 3, 4, 5, 6, 8].map(h => (
          <div key={h} onClick={() => setLocalDailyTarget(h)}
            style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', background: localDailyTarget === h ? 'var(--accent)' : 'var(--bg3)', color: localDailyTarget === h ? '#000' : 'var(--text2)', border: `1px solid ${localDailyTarget === h ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: localDailyTarget === h ? 700 : 400 }}>
            {h}h
          </div>
        ))}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Subjects</div>
      {localSubjects.map(s => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{s.emoji}</span>
            <span style={{ fontSize: '13px', color: s.color, fontWeight: 600 }}>{s.label}</span>
          </div>
          <button onClick={() => removeSubject(s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}>Remove</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <input type="text" placeholder="New subject (e.g. Python)" value={newSubjectLabel} onChange={e => setNewSubjectLabel(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} />
        <button onClick={addSubject} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>+ Add</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', width: '100%' }}>
        <button className="settings-save" onClick={saveStudySettings} style={{
          flex: 1,
          background: studyMsg ? '#10B981' : 'var(--accent)',
          color: studyMsg ? '#fff' : '#000',
          boxShadow: studyMsg ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: 'bold'
        }}>
          {studyMsg ? 'Saved ✓' : 'Save Study Settings'}
        </button>
      </div>
    </Accordion>
  );
}
