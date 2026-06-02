import React, { useState } from 'react';
import { Calendar, X, Trash2 } from 'lucide-react';
import { MONTHS, DAYS_SHORT } from '../../data';
import { dateKey, monthKey, renderSubjectIcon } from './utils/studyMath';

export const StudyHistory = ({ STUDY, syncStudy, subjects, dailyTarget, activeRange, selectedMonth }) => {
  const now = new Date();
  const todayKey = dateKey(now);

  const [showAllHistory, setShowAllHistory] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const [modalDay, setModalDay] = useState(null);

  const deleteSession = (id, dk) => {
    const targetDay = STUDY[dk];
    if (!targetDay) return;
    const newStudy = { 
      ...STUDY, 
      [dk]: { 
        ...targetDay, 
        sessions: (targetDay.sessions || []).filter(s => s.id !== id) 
      } 
    };
    syncStudy(newStudy);
  };

  const historyDataMap = {};
  Object.entries(STUDY).forEach(([dk, dayData]) => {
    const sessions = dayData.sessions || [];
    if (sessions.length === 0) return;

    const [y, mStr, dStr] = dk.split('-');
    const yr = parseInt(y);
    const mo = parseInt(mStr) - 1;
    const mk = `${y}-${mStr}`;

    let include = false;
    if (historyStart || historyEnd) {
      include = (!historyStart || dk >= historyStart) && (!historyEnd || dk <= historyEnd);
    } else if (showAllHistory) {
      include = true;
    } else {
      if (activeRange === 'Today' && dk === todayKey) include = true;
      if (activeRange === 'Weekly') {
        const diff = (now - new Date(dk)) / (1000 * 60 * 60 * 24);
        if (diff <= 7) include = true;
      }
      if (activeRange === 'Monthly' && mk === selectedMonth) include = true;
      if (activeRange === 'Yearly' && y === selectedMonth.split('-')[0]) include = true;
    }

    if (!include) return;

    if (!historyDataMap[mk]) {
      historyDataMap[mk] = { yr, mo, days: {} };
    }

    const totalHrs = sessions.reduce((s, e) => s + Number(e.hours), 0);
    historyDataMap[mk].days[dk] = { 
      dk, 
      totalHrs, 
      sessions: sessions.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)) 
    };
  });

  const sortedHistory = Object.values(historyDataMap).sort((a, b) => (b.yr - a.yr) || (b.mo - a.mo));
  sortedHistory.forEach(month => {
    month.dayList = Object.values(month.days).sort((a, b) => b.dk.localeCompare(a.dk));
  });

  const renderModal = () => {
    if (!modalDay) return null;
    const d = new Date(modalDay.dk);
    const sessions = modalDay.sessions.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

    return (
      <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setModalDay(null); }}>
        <div className="modal">
          <div className="modal-handle"></div>
          <button className="modal-close" onClick={() => setModalDay(null)}>×</button>
          <div className="modal-title">{modalDay.dk === todayKey ? 'Today' : DAYS_SHORT[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]}</div>
          <div className="modal-sub">Total Study: {modalDay.totalHrs.toFixed(1)} hrs</div>
          
          <div style={{ marginTop: '20px' }}>
            {sessions.map(s => {
              const sub = subjects.find(x => x.id === s.subjectId) || subjects[0];
              return (
                <div key={s.id} style={{ padding: '12px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--border2)', borderLeft: `3px solid ${sub.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span>{renderSubjectIcon(sub.id, sub.emoji, 14)}</span>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: sub.color }}>{sub.label}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>{s.time}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.hours}h session</div>
                      {s.learned && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', fontStyle: 'italic' }}>💡 {s.learned}</div>}
                    </div>
                    <button onClick={() => { deleteSession(s.id, modalDay.dk); setModalDay(prev => ({...prev, sessions: prev.sessions.filter(x => x.id !== s.id), totalHrs: prev.totalHrs - s.hours})); }} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>History</div>
          <div onClick={() => setShowAllHistory(!showAllHistory)} 
            style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', 
              background: showAllHistory ? 'var(--accent)' : 'var(--bg3)', 
              color: showAllHistory ? '#000' : 'var(--text2)', 
              border: '1px solid var(--border2)', fontWeight: showAllHistory ? 'bold' : 'normal' }}>
            {showAllHistory ? 'Showing All' : 'Show All Time'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {showDateFilter ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg3)', padding: '2px 6px', borderRadius: '20px', border: '1px solid var(--border2)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <div style={{display:'flex', alignItems:'center', background:'var(--bg)', borderRadius:'18px', padding:'4px 10px', gap:'8px'}}>
                <Calendar size={12} color="var(--accent)" />
                <input type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '10px', outline: 'none', width: '85px', cursor:'pointer' }} />
                <div style={{width:'1px', height:'12px', background:'var(--border2)'}}></div>
                <input type="date" value={historyEnd} onChange={e => setHistoryEnd(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '10px', outline: 'none', width: '85px', cursor:'pointer' }} />
                <X size={12} onClick={() => setShowDateFilter(false)} style={{cursor:'pointer', color:'var(--text3)'}} />
              </div>
            </div>
          ) : (
            <div onClick={() => setShowDateFilter(true)} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg3)', padding: '8px 16px', borderRadius: '16px', border: '1px solid var(--border2)', cursor: 'pointer', fontSize: '12px', color: 'var(--text2)' }}>
              <Calendar size={14} /> <span>Filter Dates</span>
            </div>
          )}
        </div>
      </div>

      {sortedHistory.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg3)', borderRadius: '20px', border: '1px dashed var(--border2)', color: 'var(--text3)', fontSize: '14px' }}>
          No study sessions recorded.
        </div>
      )}

      {sortedHistory.map(month => (
        <div key={`${month.yr}-${month.mo}`} style={{ marginBottom: '24px' }}>
          <div className="month-label" style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {MONTHS[month.mo]} {month.yr}
          </div>
          {month.dayList.map(day => {
            const d = new Date(day.dk);
            return (
              <div key={day.dk} className="history-day has-data" onClick={() => setModalDay(day)} style={{ marginBottom: '12px' }}>
                <div className="hday-top" style={{ marginBottom: '0' }}>
                  <div className="hday-date" style={{ fontSize: '13px', fontWeight: 700 }}>
                    {day.dk === todayKey ? 'Today — ' : ''}{DAYS_SHORT[d.getDay()]}, {d.getDate()} {MONTHS[month.mo].slice(0,3)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: day.totalHrs >= dailyTarget ? 'var(--accent)' : 'var(--blue)' }}>
                      {day.totalHrs.toFixed(1)}h
                    </div>
                  </div>
                </div>
                <div className="hday-focus" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{day.sessions.length} Sessions •</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {day.sessions.slice(0, 5).map((s, idx) => {
                      const sub = subjects.find(x => x.id === s.subjectId) || subjects[0];
                      return (
                        <span key={idx} style={{ color: sub.color, display: 'inline-flex', alignItems: 'center' }}>
                          {renderSubjectIcon(sub.id, sub.emoji, 12)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {renderModal()}
    </div>
  );
};
