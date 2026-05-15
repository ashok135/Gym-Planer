import React, { useState } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const CATEGORIES = [
  { id: 'food',      label: 'Food',         emoji: '🍕', color: '#FF6B6B' },
  { id: 'supps',     label: 'Supplements',  emoji: '💊', color: '#C8F135' },
  { id: 'transport', label: 'Transport',    emoji: '🚗', color: '#4D9FFF' },
  { id: 'entertain', label: 'Entertainment',emoji: '🎮', color: '#A78BFA' },
  { id: 'outside',   label: 'Eating Out',   emoji: '🍽️', color: '#FB923C' },
  { id: 'gym',       label: 'Gym',          emoji: '🏋️', color: '#34D399' },
  { id: 'others',    label: 'Others',       emoji: '📦', color: '#94A3B8' },
];

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

export default function Budget({ BUDGET, syncBudget, BUDGET_SETTINGS }) {
  const now = new Date();
  const currentMonthKey = dateKey(now);
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [form, setForm] = useState({ category: 'food', amount: '', note: '' });
  const [incomeForm, setIncomeForm] = useState({ label: '', amount: '' });

  const monthData = BUDGET[selectedMonth] || { entries: [], extraIncome: [] };
  const entries = monthData.entries || [];
  const extraIncome = monthData.extraIncome || [];

  const baseIncome = BUDGET_SETTINGS?.income || 22400;
  const totalExtra = extraIncome.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = baseIncome + totalExtra;
  const totalSpent = entries.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = totalIncome - totalSpent;
  const spentPct = Math.min(100, Math.round((totalSpent / totalIncome) * 100));

  const catTotals = {};
  CATEGORIES.forEach(c => { catTotals[c.id] = 0; });
  entries.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount); });

  const addEntry = () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return;
    const newEntry = {
      id: Date.now().toString(),
      category: form.category,
      amount: Number(form.amount),
      note: form.note.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    const newBudget = {
      ...BUDGET,
      [selectedMonth]: {
        ...monthData,
        entries: [...entries, newEntry],
      }
    };
    syncBudget(newBudget);
    setForm({ category: 'food', amount: '', note: '' });
    setShowAdd(false);
  };

  const deleteEntry = (id) => {
    const newBudget = {
      ...BUDGET,
      [selectedMonth]: {
        ...monthData,
        entries: entries.filter(e => e.id !== id),
      }
    };
    syncBudget(newBudget);
  };

  const addIncome = () => {
    if (!incomeForm.amount || isNaN(incomeForm.amount) || Number(incomeForm.amount) <= 0) return;
    const newIncome = { id: Date.now().toString(), label: incomeForm.label || 'Extra Income', amount: Number(incomeForm.amount) };
    const newBudget = {
      ...BUDGET,
      [selectedMonth]: { ...monthData, extraIncome: [...extraIncome, newIncome] }
    };
    syncBudget(newBudget);
    setIncomeForm({ label: '', amount: '' });
    setShowAddIncome(false);
  };

  const deleteIncome = (id) => {
    const newBudget = {
      ...BUDGET,
      [selectedMonth]: { ...monthData, extraIncome: extraIncome.filter(e => e.id !== id) }
    };
    syncBudget(newBudget);
  };

  // Generate last 6 months for selector
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: dateKey(d), label: d.toLocaleString('default', { month: 'short', year: '2-digit' }) });
  }

  const statusColor = spentPct >= 100 ? 'var(--red)' : spentPct >= 80 ? 'var(--orange)' : 'var(--accent)';

  return (
    <div id="budget-content" style={{ padding: '20px 0' }}>
      {/* Header */}
      <div className="ai-dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <div>
          <div className="greeting">Monthly</div>
          <div className="ai-title">Budget</div>
        </div>
        {/* Month Selector */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {months.map(m => (
            <div key={m.key} onClick={() => setSelectedMonth(m.key)}
              style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: selectedMonth === m.key ? 'bold' : 'normal', background: selectedMonth === m.key ? 'var(--accent)' : 'var(--bg3)', color: selectedMonth === m.key ? '#000' : 'var(--text2)', border: '1px solid var(--border2)', transition: 'all 0.2s' }}
            >{m.label}</div>
          ))}
        </div>
      </div>

      {/* Overview Card */}
      <div style={{ margin: '0 20px 16px', background: 'linear-gradient(145deg, var(--bg3), var(--bg2))', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Total Income</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>₹{totalIncome.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>Base ₹{baseIncome.toLocaleString()}{totalExtra > 0 ? ` + ₹${totalExtra.toLocaleString()} extra` : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Remaining</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: remaining >= 0 ? statusColor : 'var(--red)' }}>₹{Math.abs(remaining).toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{remaining < 0 ? '⚠️ Over budget' : `${100 - spentPct}% left`}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: 'var(--border2)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${spentPct}%`, height: '100%', background: statusColor, borderRadius: '8px', transition: 'width 1s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text2)' }}>
          <span>Spent ₹{totalSpent.toLocaleString()} ({spentPct}%)</span>
          <span>Budget ₹{totalIncome.toLocaleString()}</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{ margin: '0 20px 16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>Spending by Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {CATEGORIES.filter(c => catTotals[c.id] > 0).map(c => {
            const pct = Math.round((catTotals[c.id] / totalIncome) * 100);
            return (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>{c.emoji} {c.label}</span>
                  <span style={{ color: c.color, fontWeight: 600 }}>₹{catTotals[c.id].toLocaleString()} <span style={{ color: 'var(--text3)' }}>({pct}%)</span></span>
                </div>
                <div style={{ background: 'var(--border2)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: c.color, borderRadius: '6px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
          {entries.length === 0 && <div style={{ color: 'var(--text3)', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>No expenses logged yet</div>}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', margin: '0 20px 16px' }}>
        <button onClick={() => { setShowAdd(true); setShowAddIncome(false); }} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <TrendingDown size={16} /> Add Expense
        </button>
        <button onClick={() => { setShowAddIncome(true); setShowAdd(false); }} style={{ flex: 1, padding: '12px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '12px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <TrendingUp size={16} /> Add Income
        </button>
      </div>

      {/* Add Expense Form */}
      {showAdd && (
        <div style={{ margin: '0 20px 16px', background: 'var(--bg3)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border2)' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Add Expense</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {CATEGORIES.map(c => (
              <div key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: form.category === c.id ? c.color : 'var(--bg)', color: form.category === c.id ? '#000' : 'var(--text2)', fontWeight: form.category === c.id ? 700 : 400, border: `1px solid ${form.category === c.id ? c.color : 'var(--border2)'}`, transition: 'all 0.15s' }}>
                {c.emoji} {c.label}
              </div>
            ))}
          </div>
          <input type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <input type="text" placeholder="Note (optional)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addEntry} style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Extra Income Form */}
      {showAddIncome && (
        <div style={{ margin: '0 20px 16px', background: 'var(--bg3)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(200,241,53,0.2)' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px', color: 'var(--accent)' }}>Add Extra Income</div>
          <input type="text" placeholder="Source (e.g. Freelance, Gift)" value={incomeForm.label} onChange={e => setIncomeForm(f => ({ ...f, label: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <input type="number" placeholder="Amount (₹)" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addIncome} style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setShowAddIncome(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Extra Income List */}
      {extraIncome.length > 0 && (
        <div style={{ margin: '0 20px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '8px' }}>💰 Extra Income</div>
          {extraIncome.map(inc => (
            <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: '10px', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{inc.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent)' }}>+₹{Number(inc.amount).toLocaleString()}</div>
              </div>
              <button onClick={() => deleteIncome(inc.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Expense List */}
      {entries.length > 0 && (
        <div style={{ margin: '0 20px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>All Expenses</div>
          {[...entries].reverse().map(e => {
            const cat = CATEGORIES.find(c => c.id === e.category) || CATEGORIES[6];
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg3)', borderRadius: '10px', marginBottom: '8px', border: '1px solid var(--border2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '22px' }}>{cat.emoji}</div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{cat.label}</div>
                    {e.note && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{e.note}</div>}
                    <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{e.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: cat.color, fontSize: '16px' }}>₹{Number(e.amount).toLocaleString()}</div>
                  <button onClick={() => deleteEntry(e.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ height: '20px' }} />
    </div>
  );
}
