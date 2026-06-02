import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const SplitBalances = ({
  simplifiedDebts,
  selectedMonth,
  myName,
  handleSettleUp
}) => {
  return (
    <div style={{ marginBottom: '30px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Group Balances ({selectedMonth})</div>
      {simplifiedDebts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(52,211,153,0.05)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
          <CheckCircle2 size={24} /> <span style={{ fontWeight: 900, fontSize: '14px' }}>Everyone is fully settled up!</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {simplifiedDebts.map((debt, i) => {
            const isIOWE = debt.from === myName; const isOWEDME = debt.to === myName;
            return (
              <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '18px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#fff', fontWeight: 800 }}>
                    {isIOWE ? <span>You owe <strong style={{ color: 'var(--red)' }}>{debt.to}</strong></span> : 
                     isOWEDME ? <span><strong style={{ color: 'var(--accent)' }}>{debt.from}</strong> owes you</span> : 
                     <span><strong>{debt.from}</strong> owes <strong>{debt.to}</strong></span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px', fontWeight: 600 }}>{isIOWE ? 'Tap settle to pay them back' : isOWEDME ? 'They will settle up with you' : 'Other group debt'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: isIOWE ? 'var(--red)' : isOWEDME ? 'var(--accent)' : '#fff' }}>₹{debt.amount.toLocaleString()}</div>
                  {isIOWE && <button onClick={() => { if(window.confirm(`Settle ₹${debt.amount} to ${debt.to}?`)) handleSettleUp(debt.from, debt.to, debt.amount); }} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>Settle</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
