import React from 'react';
import { Sparkles } from 'lucide-react';
import { monthKey } from './utils/budgetMath';

export const BudgetHeader = ({
  isReport,
  totalIncome,
  baseSalary,
  rollover,
  bonusIncome,
  remaining,
  spentPct,
  totalSpent,
  selectedMonth,
  potentialRollover,
  BUDGET,
  syncBudget
}) => {
  return (
    <>
      {/* Dynamic Wealth Banner */}
      {!isReport && (
        <div 
          className="scroll-reveal" 
          style={{
            margin: '0 20px 24px',
            padding: '24px 20px',
            borderRadius: 'var(--radius)',
            backgroundImage: 'linear-gradient(to right, rgba(18, 18, 20, 0.95) 45%, rgba(18, 18, 20, 0.45) 100%), url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Capital & Liabilities
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Wealth Ledger</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Track liquid assets, pending repayments, and transaction flow.</div>
        </div>
      )}

      {/* Main Income/Remaining Card */}
      <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase' }}>Total Income</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)' }}>₹{totalIncome.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span>Salary: ₹{baseSalary.toLocaleString()}</span>
              {BUDGET?.[selectedMonth]?.rolloverClaimed === true && rollover > 0 && (
                <span style={{ color: 'var(--accent)' }}>• Rollover: ₹{rollover.toLocaleString()}</span>
              )}
              {bonusIncome > 0 && <span style={{ color: 'var(--blue)' }}>• Bonus: ₹{bonusIncome.toLocaleString()}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase' }}>Remaining</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text)' }}>₹{remaining.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{100 - spentPct}% left</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '10px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${spentPct}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)' }}>
          <span>Spent ₹{totalSpent.toLocaleString()} ({spentPct}%)</span>
          <span>Budget ₹{totalIncome.toLocaleString()}</span>
        </div>
      </div>

      {/* Mini Rollover prompt row */}
      {potentialRollover > 0 && BUDGET?.[selectedMonth]?.rolloverClaimed === undefined && (
        <div style={{
          margin: '-16px 20px 24px',
          padding: '10px 16px',
          background: 'var(--bg3)',
          borderRadius: '16px',
          border: '1px solid var(--border2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text2)' }}>
            <Sparkles size={13} color="var(--accent)" />
            <span>Found prior savings of <strong>₹{potentialRollover.toLocaleString()}</strong>. Roll over?</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button 
              onClick={() => {
                const targetMonthData = BUDGET?.[selectedMonth] || {};
                syncBudget({
                  ...BUDGET,
                  [selectedMonth]: { ...targetMonthData, rolloverClaimed: true }
                });
              }}
              style={{ padding: '4px 10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
            >
              Yes
            </button>
            <button 
              onClick={() => {
                const targetMonthData = BUDGET?.[selectedMonth] || {};
                syncBudget({
                  ...BUDGET,
                  [selectedMonth]: { ...targetMonthData, rolloverClaimed: false }
                });
              }}
              style={{ padding: '4px 8px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
            >
              No
            </button>
          </div>
        </div>
      )}
    </>
  );
};
