import React from 'react';
import { PlusCircle, Handshake, CreditCard, Lightbulb, HandCoins } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

export const TransactionModals = ({
  showAdd,
  setShowAdd,
  showAddIncome,
  setShowAddIncome,
  showAddDebt,
  setShowAddDebt,
  showAddLend,
  setShowAddLend,
  form,
  setForm,
  incomeForm,
  setIncomeForm,
  debtForm,
  setDebtForm,
  lendForm,
  setLendForm,
  CATEGORIES,
  addEntry,
  addIncome,
  addDebt,
  addLend
}) => {
  return (
    <>
      {showAdd && (
        <div style={{ margin: '0 20px 24px', background: 'var(--bg3)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border2)' }}>
          <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>New Expense</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {CATEGORIES.map(c => (
              <div 
                key={c.id} 
                onClick={() => setForm(f => ({ ...f, category: c.id }))} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  background: form.category === c.id ? c.color : 'var(--bg)', 
                  color: form.category === c.id ? '#000' : 'var(--text2)', 
                  fontWeight: 700, 
                  border: `1px solid ${form.category === c.id ? c.color : 'var(--border2)'}`, 
                  transition: 'all 0.2s' 
                }}
              >
                <CategoryIcon cat={c} size={14} />
                <span>{c.label}</span>
              </div>
            ))}
          </div>
          <input type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <input type="text" placeholder="Add a note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addEntry} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Add Transaction</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {showAddIncome && (
        <div style={{ margin: '0 20px 24px', background: 'var(--bg3)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(200,241,53,0.2)' }}>
          <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px', color: 'var(--accent)' }}>Add Extra Income</div>
          <input type="text" placeholder="Source" value={incomeForm.label} onChange={e => setIncomeForm(f => ({ ...f, label: e.target.value }))} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <input type="number" placeholder="Amount" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addIncome} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setShowAddIncome(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {showAddDebt && (
        <div style={{ margin: '0 20px 24px', background: 'var(--bg3)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(77,159,255,0.3)' }}>
          <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '6px' }}><PlusCircle size={18}/> Log Loan / Credit Card spend</div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Type of Liability</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setDebtForm(f => ({ ...f, type: 'loan' }))}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: debtForm.type === 'loan' ? 'var(--blue)' : 'var(--bg)', color: debtForm.type === 'loan' ? '#000' : 'var(--text2)', border: '1px solid var(--border2)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
              >
                <Handshake size={14} />
                <span>Friend Loan</span>
              </button>
              <button 
                onClick={() => setDebtForm(f => ({ ...f, type: 'credit' }))}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: debtForm.type === 'credit' ? 'var(--blue)' : 'var(--bg)', color: debtForm.type === 'credit' ? '#000' : 'var(--text2)', border: '1px solid var(--border2)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
              >
                <CreditCard size={14} />
                <span>Credit Card</span>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              {debtForm.type === 'loan' ? 'Who did you borrow from?' : 'Card / Platform Name'}
            </label>
            <input 
              type="text" 
              placeholder={debtForm.type === 'loan' ? "e.g. Rahul (Friend)" : "e.g. SBI SimplyClick, Amazon PayLater"} 
              value={debtForm.provider} 
              onChange={e => setDebtForm(f => ({ ...f, provider: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Amount (₹)</label>
            <input 
              type="number" 
              placeholder="Amount" 
              value={debtForm.amount} 
              onChange={e => setDebtForm(f => ({ ...f, amount: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} 
            />
            <span style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontStyle: 'italic' }}>
              <Lightbulb size={12} color="var(--accent)" />
              <span>{debtForm.type === 'loan' ? 'Adds to cash balance (Income).' : 'Logs purchase transaction in expense history.'}</span>
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Note / Purpose</label>
            <input 
              type="text" 
              placeholder={debtForm.type === 'loan' ? "Why did you borrow? (e.g. for gym fees, emergency)" : "What did you buy? (e.g. shoes, dinner)"} 
              value={debtForm.note || ''} 
              onChange={e => setDebtForm(f => ({ ...f, note: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={addDebt} style={{ flex: 1, padding: '12px', background: 'var(--blue)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Save Entry</button>
            <button onClick={() => setShowAddDebt(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>
        </div>
      )}

      {showAddLend && (
        <div style={{ margin: '0 20px 24px', background: 'var(--bg3)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(251,146,60,0.35)' }}>
          <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px', color: '#FB923C', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HandCoins size={18}/> Lend Money to Someone
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Who are you lending to?</label>
            <input 
              type="text" 
              placeholder="e.g. Karthik (Friend), Brother" 
              value={lendForm.person} 
              onChange={e => setLendForm(f => ({ ...f, person: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Amount (₹)</label>
            <input 
              type="number" 
              placeholder="Amount you are lending" 
              value={lendForm.amount} 
              onChange={e => setLendForm(f => ({ ...f, amount: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} 
            />
            <span style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontStyle: 'italic' }}>
              <Lightbulb size={12} color="#FB923C" />
              <span>Logged as expense. When they return it, income is added back automatically.</span>
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Note / Reason</label>
            <input 
              type="text" 
              placeholder="e.g. For travel, emergency, business" 
              value={lendForm.note} 
              onChange={e => setLendForm(f => ({ ...f, note: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={addLend} style={{ flex: 1, padding: '12px', background: '#FB923C', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Save Lend</button>
            <button onClick={() => setShowAddLend(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};
