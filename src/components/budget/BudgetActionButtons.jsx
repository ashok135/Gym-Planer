import React from 'react';
import { TrendingDown, TrendingUp, PlusCircle, HandCoins } from 'lucide-react';

export const BudgetActionButtons = ({
  setShowAdd,
  setShowAddIncome,
  setShowAddDebt,
  setShowAddLend
}) => {
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '0 20px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <button 
        onClick={() => { setShowAdd(true); setShowAddIncome(false); setShowAddDebt(false); setShowAddLend(false); }} 
        style={{ flex: '1 1 100px', padding: '14px 10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(200,241,53,0.2)' }}
      >
        <TrendingDown size={16} /> Expense
      </button>
      
      <button 
        onClick={() => { setShowAddIncome(true); setShowAdd(false); setShowAddDebt(false); setShowAddLend(false); }} 
        style={{ flex: '1 1 100px', padding: '14px 10px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <TrendingUp size={16} /> Income
      </button>

      <button 
        onClick={() => { setShowAddDebt(true); setShowAdd(false); setShowAddIncome(false); setShowAddLend(false); }} 
        style={{ flex: '1 1 100px', padding: '14px 10px', background: 'rgba(77,159,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(77,159,255,0.3)', borderRadius: '14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <PlusCircle size={16} /> Credit & Loans
      </button>

      <button 
        onClick={() => { setShowAddLend(true); setShowAdd(false); setShowAddIncome(false); setShowAddDebt(false); }} 
        style={{ flex: '1 1 100px', padding: '14px 10px', background: 'rgba(251,146,60,0.1)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <HandCoins size={16} /> Lend Money
      </button>
    </div>
  );
};
