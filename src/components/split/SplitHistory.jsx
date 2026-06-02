import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';

export const SplitHistory = ({
  filteredExpenses,
  selectedMonth,
  myName,
  getCategoryDetails,
  handleDeleteExpense
}) => {
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
      <h4 style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>History ({selectedMonth})</h4>
      {(!filteredExpenses || filteredExpenses.length === 0) ? (
        <div style={{ background: 'var(--bg3)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', border: '1px dashed var(--border2)' }}>No expenses recorded for this month.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...filteredExpenses].reverse().map(e => {
            const isSettle = e.type === 'settlement';
            const isEveryone = e.splitAll || (e.splitAll !== false && (e.splitWith || []).length >= 2);
            const catDetails = getCategoryDetails(e.category);
            return (
              <div key={e.id} style={{ background: 'var(--bg3)', borderRadius: '18px', padding: '16px', border: `1px solid ${isSettle ? 'rgba(52,211,153,0.15)' : 'var(--border2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isSettle ? 'rgba(52,211,153,0.1)' : 'var(--bg2)', border: '1px solid var(--border2)', color: isSettle ? '#34D399' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
                    {isSettle ? <CheckCircle2 size={18} /> : catDetails.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{e.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.5, fontWeight: 600 }}>
                      Paid by <strong style={{ color: 'var(--text)' }}>{e.paidBy === myName ? 'You' : e.paidBy}</strong> 
                      {!isSettle && ` • Split with ${isEveryone ? 'Everyone' : (e.splitWith || []).join(', ')}`}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{e.date} at {e.time} • {catDetails.label}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: isSettle ? '#34D399' : '#fff' }}>₹{e.amount.toLocaleString()}</div>
                  {(e.addedBy === myName || e.paidBy === myName) && (
                    <button onClick={() => handleDeleteExpense(e.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', opacity: 0.5, cursor: 'pointer', padding: '4px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
