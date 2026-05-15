import React, { useState } from 'react';
import { PlusCircle, Trash2, BookOpen, Clock, CheckCircle } from 'lucide-react';

const DEFAULT_SUBJECTS = [
  { id: 'dsa',   label: 'DSA',    emoji: '🧠', color: '#A78BFA' },
  { id: 'js',    label: 'JavaScript', emoji: '⚡', color: '#FBBF24' },
  { id: 'react', label: 'React',  emoji: '⚛️',  color: '#4D9FFF' },
];

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export default function Study({ STUDY, syncStudy, STUDY_SETTINGS }) {
  const now = new Date();
  const todayKey = dateKey(now);

  const subjects = STUDY_SETTINGS?.subjects?.length ? STUDY_SETTINGS.subjects : DEFAULT_SUBJECTS;
  const dailyTarget = STUDY_SETTINGS?.dailyTarget || 4;

  const todayData = STUDY[todayKey] || {};
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ subjectId: subjects[0]?.id || 'dsa', hours: '1', learned: '' });
  const [expandedDay, setExpandedDay] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('All');

  // Today stats
  const todaySessions = todayData.sessions || [];
  const todayHours = todaySessions.reduce((s, e) => s + Number(e.hours), 0);
  const progressPct = Math.min(100, Math.round((todayHours / dailyTarget) * 100));

  // Subject breakdown for today
  const subjectHours = {};
  subjects.forEach(s => { subjectHours[s.id] = 0; });
  todaySessions.forEach(s => { subjectHours[s.subjectId] = (subjectHours[s.subjectId] || 0) + Number(s.hours); });

  const addSession = () => {
    if (!addForm.hours || isNaN(addForm.hours) || Number(addForm.hours) <= 0) return;
    const newSession = {
      id: Date.now().toString(),
      subjectId: addForm.subjectId,
      hours: Number(addForm.hours),
      learned: addForm.learned.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const newStudy = { ...STUDY, [todayKey]: { ...todayData, sessions: [...todaySessions, newSession] } };
    syncStudy(newStudy);
    setAddForm({ subjectId: subjects[0]?.id || 'dsa', hours: '1', learned: '' });
    setShowAdd(false);
  };

  const deleteSession = (id) => {
    const newStudy = { ...STUDY, [todayKey]: { ...todayData, sessions: todaySessions.filter(s => s.id !== id) } };
    syncStudy(newStudy);
  };

  // Last 7 days streak
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dk = dateKey(d);
    const hrs = ((STUDY[dk]?.sessions || []).reduce((s, e) => s + Number(e.hours), 0));
    last7.push({ dk, d, hrs, isToday: dk === todayKey });
  }

  // All history keys with filter
  const allHistoryKeys = Object.keys(STUDY).sort().reverse();
  const filteredHistoryKeys = allHistoryKeys.filter(dk => {
    if (dk === todayKey) return false;
    if (historyFilter === 'All') return true;
    const diff = (now - new Date(dk)) / (1000 * 60 * 60 * 24);
    if (historyFilter === 'Weekly')  return diff <= 7;
    if (historyFilter === 'Monthly') return diff <= 30;
    if (historyFilter === 'Yearly')  return diff <= 365;
    return true;
  });


  const statusEmoji = progressPct >= 100 ? '🔥' : progressPct >= 50 ? '⚡' : '📚';
  const statusColor = progressPct >= 100 ? 'var(--accent)' : progressPct >= 50 ? 'var(--orange)' : 'var(--blue)';

  return (
    <div id="study-content" style={{ padding: '20px 0' }}>
      {/* Header */}
      <div className="ai-dash-header" style={{ marginBottom: '8px' }}>
        <div>
          <div className="greeting">Daily</div>
          <div className="ai-title">Study Plan</div>
        </div>
      </div>

      {/* Today Progress Card */}
      <div style={{ margin: '0 20px 16px', background: 'linear-gradient(145deg, var(--bg3), var(--bg2))', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Today's Progress {statusEmoji}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: statusColor }}>{todayHours.toFixed(1)} hrs</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Target: {dailyTarget} hrs/day</div>
          </div>
          <div style={{ width: '64px', height: '64px', position: 'relative' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border2)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={statusColor} strokeWidth="3"
                strokeDasharray={`${progressPct} 100`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: statusColor }}>{progressPct}%</div>
          </div>
        </div>

        {/* Subject Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {subjects.map(sub => {
            const hrs = subjectHours[sub.id] || 0;
            const pct = Math.min(100, Math.round((hrs / dailyTarget) * 100));
            return (
              <div key={sub.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>{sub.emoji} {sub.label}</span>
                  <span style={{ color: sub.color, fontWeight: 600 }}>{hrs.toFixed(1)}h</span>
                </div>
                <div style={{ background: 'var(--border2)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: sub.color, borderRadius: '6px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Streak */}
      <div style={{ margin: '0 20px 16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>📅 This Week</div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {last7.map(({ dk, d, hrs, isToday }) => (
            <div key={dk} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>
                {d.toLocaleString('default', { weekday: 'narrow' })}
              </div>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hrs >= dailyTarget ? 'var(--accent)' : hrs > 0 ? 'rgba(200,241,53,0.2)' : 'var(--bg3)',
                border: isToday ? '2px solid var(--accent)' : '2px solid transparent',
                fontSize: '10px', fontWeight: 'bold',
                color: hrs >= dailyTarget ? '#000' : hrs > 0 ? 'var(--accent)' : 'var(--text3)',
              }}>
                {hrs > 0 ? `${hrs.toFixed(0)}h` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Session Button */}
      <div style={{ margin: '0 20px 16px' }}>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <PlusCircle size={18} /> Log Study Session
        </button>
      </div>

      {/* Add Session Form */}
      {showAdd && (
        <div style={{ margin: '0 20px 16px', background: 'var(--bg3)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border2)' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px' }}>New Session</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {subjects.map(s => (
              <div key={s.id} onClick={() => setAddForm(f => ({ ...f, subjectId: s.id }))}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: addForm.subjectId === s.id ? s.color : 'var(--bg)', color: addForm.subjectId === s.id ? '#000' : 'var(--text2)', fontWeight: addForm.subjectId === s.id ? 700 : 400, border: `1px solid ${addForm.subjectId === s.id ? s.color : 'var(--border2)'}`, transition: 'all 0.15s' }}>
                {s.emoji} {s.label}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px' }}>Hours Studied</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[0.5, 1, 1.5, 2, 2.5, 3].map(h => (
                <div key={h} onClick={() => setAddForm(f => ({ ...f, hours: h.toString() }))}
                  style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: addForm.hours == h ? 'var(--accent)' : 'var(--bg)', color: addForm.hours == h ? '#000' : 'var(--text2)', border: `1px solid ${addForm.hours == h ? 'var(--accent)' : 'var(--border2)'}`, transition: 'all 0.15s', fontWeight: addForm.hours == h ? 700 : 400 }}>
                  {h}h
                </div>
              ))}
            </div>
          </div>
          <textarea placeholder="What did you learn today? (optional)" value={addForm.learned} onChange={e => setAddForm(f => ({ ...f, learned: e.target.value }))}
            rows={2}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addSession} style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Save Session</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <div style={{ margin: '0 20px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Today's Sessions</div>
          {todaySessions.map(s => {
            const sub = subjects.find(x => x.id === s.subjectId) || subjects[0];
            return (
              <div key={s.id} style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '12px', marginBottom: '8px', border: `1px solid var(--border2)`, borderLeft: `3px solid ${sub.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span>{sub.emoji}</span>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: sub.color }}>{sub.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>{s.time}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.hours}h studied</div>
                    {s.learned && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', fontStyle: 'italic' }}>💡 {s.learned}</div>}
                  </div>
                  <button onClick={() => deleteSession(s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px', marginLeft: '8px' }}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORY WITH FILTER */}
      <div style={{ margin: '0 20px 16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>📋 Study History</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {['All', 'Weekly', 'Monthly', 'Yearly'].map(f => (
            <div key={f} onClick={() => setHistoryFilter(f)}
              style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontWeight: historyFilter === f ? 700 : 400, background: historyFilter === f ? 'var(--accent)' : 'var(--bg3)', color: historyFilter === f ? '#000' : 'var(--text2)', border: '1px solid var(--border2)', transition: 'all 0.2s' }}>
              {f}
            </div>
          ))}
        </div>
        {filteredHistoryKeys.length === 0 && <div style={{ color: 'var(--text3)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No study sessions in this period</div>}
        {filteredHistoryKeys.map(dk => {
          const sessions = STUDY[dk]?.sessions || [];
          const hrs = sessions.reduce((s, e) => s + Number(e.hours), 0);
          const subs = [...new Set(sessions.map(s => s.subjectId))].map(id => subjects.find(x => x.id === id)?.emoji || '📚').join(' ');
          return (
            <div key={dk} onClick={() => setExpandedDay(expandedDay === dk ? null : dk)}
              style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '12px', marginBottom: '6px', border: '1px solid var(--border2)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{dk}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{subs} {hrs.toFixed(1)}h</div>
                </div>
                <div style={{ background: hrs >= dailyTarget ? 'rgba(200,241,53,0.1)' : 'var(--bg)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: hrs >= dailyTarget ? 'var(--accent)' : 'var(--text3)', fontWeight: 600 }}>
                  {hrs >= dailyTarget ? '✅ Done' : `${Math.round((hrs/dailyTarget)*100)}%`}
                </div>
              </div>
              {expandedDay === dk && sessions.map(s => {
                const sub = subjects.find(x => x.id === s.subjectId) || subjects[0];
                return (
                  <div key={s.id} style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border2)', fontSize: '12px', color: 'var(--text2)' }}>
                    <span style={{ color: sub?.color }}>{sub?.emoji} {sub?.label}</span> — {s.hours}h
                    {s.learned && <div style={{ fontStyle: 'italic', color: 'var(--text3)', marginTop: '2px' }}>💡 {s.learned}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ height: '20px' }} />
    </div>
  );
}
