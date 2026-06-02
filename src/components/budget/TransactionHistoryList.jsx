import React from 'react';
import { Calendar, Coins, Handshake, CreditCard, HelpCircle } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { MONTHS, DAYS_SHORT } from '../../data';

export const TransactionHistoryList = ({
  showAllHistory,
  setShowAllHistory,
  showDateFilter,
  setShowDateFilter,
  historyStart,
  setHistoryStart,
  historyEnd,
  setHistoryEnd,
  sortedHistory,
  setModalDay,
  todayKey,
  CATEGORIES
}) => {
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700 }}>Transaction History</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div onClick={() => setShowAllHistory(!showAllHistory)} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: showAllHistory ? 'var(--accent)' : 'var(--bg3)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border2)', cursor: 'pointer', color: showAllHistory ? '#000' : 'var(--text2)', fontSize: '12px', fontWeight: 600 }}>{showAllHistory ? 'Show Selected Month' : 'Show All'}</div>
          <div onClick={() => { if (showDateFilter) { setHistoryStart(''); setHistoryEnd(''); } setShowDateFilter(!showDateFilter); }} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: showDateFilter ? 'var(--accent)' : 'var(--bg3)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border2)', cursor: 'pointer', color: showDateFilter ? '#000' : 'var(--text2)', fontSize: '12px', fontWeight: 600 }}><Calendar size={14} /> Filter</div>
        </div>
      </div>
      {showDateFilter && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg3)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border2)', marginBottom: '16px' }}>
          <input type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: '12px', padding: '6px', borderRadius: '8px' }} />
          <input type="date" value={historyEnd} onChange={e => setHistoryEnd(e.target.value)} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: '12px', padding: '6px', borderRadius: '8px' }} />
        </div>
      )}
      {sortedHistory.length === 0 ? (
        <div style={{ background: 'var(--bg3)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', border: '1px dashed var(--border2)', marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Calendar size={24} style={{ color: 'var(--text3)', opacity: 0.5 }} />
          <div>No history this month</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', opacity: 0.8 }}>Start logging expenses or income to build your ledger.</div>
        </div>
      ) : (
        sortedHistory.map(month => (
          <div key={`${month.yr}-${month.mo}`} style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase' }}>{MONTHS[month.mo]} {month.yr}</div>
            {month.dayList.map(day => (
              <div key={day.dk} className="history-day has-data" onClick={() => setModalDay(day)} style={{ marginBottom: '12px' }}>
                <div className="hday-top">
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{day.dk === todayKey ? 'Today' : DAYS_SHORT[new Date(day.dk).getDay()]}, {new Date(day.dk).getDate()}</div>
                  <div style={{ textAlign: 'right' }}>
                    {day.totalSpent > 0 && <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--red)' }}>-₹{day.totalSpent.toLocaleString()}</div>}
                    {day.totalIncome > 0 && <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>+₹{day.totalIncome.toLocaleString()}</div>}
                  </div>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text3)', fontSize: '11px' }}>{day.items.filter(x => x.type === 'expense' || x.type === 'credit').length} Exp</span>
                  {day.totalIncome > 0 && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>• {day.items.filter(x => x.type === 'income').length} Inc</span>}
                  {day.items.some(x => x.type === 'loan') && <span style={{ color: 'var(--blue)', fontSize: '11px' }}>• {day.items.filter(x => x.type === 'loan').length} Loan</span>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {day.items.map((e, idx) => {
                      if (idx > 4) return null;
                      const cat = e.type === 'income' 
                        ? { Icon: Coins, color: 'var(--accent)' } 
                        : e.type === 'loan'
                          ? { Icon: Handshake, color: 'var(--blue)' }
                          : e.type === 'credit'
                            ? { Icon: CreditCard, color: 'var(--red)' }
                            : (CATEGORIES.find(c => c.id === e.category) || { Icon: HelpCircle, color: 'var(--text3)' });
                      
                      return (
                        <span key={e.id} style={{ color: cat.color || 'var(--text2)', display: 'inline-flex', alignItems: 'center' }}>
                          <CategoryIcon cat={cat} size={12} />
                        </span>
                      );
                    })}
                    {day.items.length > 5 && <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 700 }}>+</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};
