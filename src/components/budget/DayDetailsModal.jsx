import React from 'react';
import { Trash2, Coins, Handshake, CreditCard, HelpCircle } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { MONTHS, DAYS_SHORT } from '../../data';

export const DayDetailsModal = ({
  modalDay,
  setModalDay,
  todayKey,
  deleteIncome,
  deleteEntry,
  CATEGORIES
}) => {
  if (!modalDay) return null;
  const d = new Date(modalDay.dk);
  
  return (
    <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setModalDay(null); }}>
      <div className="modal">
        <button className="modal-close" onClick={() => setModalDay(null)}>×</button>
        <div className="modal-title">{modalDay.dk === todayKey ? 'Today' : DAYS_SHORT[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]}</div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600 }}>Spent: ₹{modalDay.totalSpent.toLocaleString()}</div>
          {modalDay.totalIncome > 0 && <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>Income: ₹{modalDay.totalIncome.toLocaleString()}</div>}
        </div>
        <div style={{ marginTop: '20px', flex: '1 1 auto', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', WebkitOverflowScrolling: 'touch' }}>
          {modalDay.items.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map(e => {
            const isIncome = e.type === 'income';
            const isLoan = e.type === 'loan';
            const isCredit = e.type === 'credit';
            
            const cat = isIncome 
              ? { Icon: Coins, emoji: '💰', label: 'Income', color: 'var(--accent)' } 
              : isLoan 
                ? { Icon: Handshake, emoji: '🤝', label: 'Borrowed Loan', color: 'var(--blue)' } 
                : isCredit 
                  ? { Icon: CreditCard, emoji: '💳', label: 'Credit Spend', color: 'var(--red)' }
                  : (CATEGORIES.find(c => c.id === e.category) || CATEGORIES[CATEGORIES.length - 1]);
            
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '10px', border: `1px solid ${isIncome ? 'rgba(200,241,53,0.1)' : isLoan ? 'rgba(77,159,255,0.1)' : 'var(--border2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg)', color: cat.color || 'var(--text)', flexShrink: 0 }}>
                    <CategoryIcon cat={cat} size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{isIncome ? e.label : isLoan ? e.label : cat.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      {e.time || 'Logged'} 
                      {e.note && ` • ${e.note}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontWeight: 700, color: isIncome ? 'var(--accent)' : isLoan ? 'var(--blue)' : 'var(--text)' }}>
                    {isIncome ? '+' : isLoan ? '🤝 ' : ''}₹{e.amount.toLocaleString()}
                  </div>
                  <Trash2 size={14} onClick={() => { 
                    if (isIncome) deleteIncome(e.id, e.mk);
                    else if (isLoan) deleteIncome(e.id, e.mk); 
                    else deleteEntry(e.id, e.mk); 
                    setModalDay(null); 
                  }} style={{ color: 'var(--red)', cursor: 'pointer', opacity: 0.6 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
