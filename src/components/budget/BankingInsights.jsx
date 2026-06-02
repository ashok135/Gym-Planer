import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Info, CalendarDays } from 'lucide-react';
import { MONTHS } from '../../data';

export const BankingInsights = ({
  cashAssets,
  totalOutstandingDebt,
  netLiquidity,
  unpaidDebts,
  now
}) => {
  return (
    <div className="scroll-reveal" style={{ margin: '0 20px 24px', background: 'linear-gradient(135deg, rgba(77,159,255,0.05), rgba(200,241,53,0.03))', borderRadius: '24px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <TrendingUp size={18} color="var(--accent)" />
        <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Banking & Credit Position</div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg3)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border2)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Cash Assets</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)' }}>₹{cashAssets.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg3)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border2)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Active Liabilities</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--red)' }}>₹{totalOutstandingDebt.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Net Liquid Balance:</span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: netLiquidity >= 0 ? 'var(--accent)' : 'var(--red)' }}>
          ₹{netLiquidity.toLocaleString()}
        </span>
      </div>

      {(netLiquidity < 0 || totalOutstandingDebt > 0) && (
        <div style={{ 
          padding: '12px', 
          borderRadius: '12px', 
          fontSize: '11px', 
          lineHeight: 1.4, 
          background: netLiquidity < 0 ? 'rgba(244,63,94,0.06)' : 'rgba(77,159,255,0.06)',
          border: `1px solid ${netLiquidity < 0 ? 'rgba(244,63,94,0.15)' : 'rgba(77,159,255,0.15)'}`,
          color: netLiquidity < 0 ? 'var(--red)' : 'var(--blue)'
        }}>
          {netLiquidity < 0 ? (
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <AlertTriangle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>**Financial Health: Budget Deficit.** You have overspent your available cash by ₹{Math.abs(netLiquidity).toLocaleString()}! Avoid new expenses and balance your budget.</span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>**Financial Health: Healthy Coverage.** Your remaining cash covers your outstanding dues (₹{totalOutstandingDebt.toLocaleString()}). Settle them whenever you wish.</span>
            </span>
          )}
        </div>
      )}

      {totalOutstandingDebt > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.06)' 
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--red)', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', letterSpacing: '0.03em', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarDays size={12} />
              <span>{MONTHS[now.getMonth()]} Repayment Plan</span>
            </span>
            <span>₹{totalOutstandingDebt.toLocaleString()}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unpaidDebts.map(d => {
              const unpaidAmt = d.amount - (d.paid || 0);
              return (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                      {d.type === 'loan' ? '🤝 Friend:' : '💳 Card:'} {d.provider}
                    </div>
                    {d.note && <div style={{ color: 'var(--text3)', fontSize: '10px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><span>{d.note}</span></div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--red)' }}>₹{unpaidAmt.toLocaleString()}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text3)' }}>Target: ₹{d.amount.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
