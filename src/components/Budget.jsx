import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Calendar, Clock, ChevronLeft, ChevronRight, BarChart as BarChartIcon, X } from 'lucide-react';
import { MONTHS, DAYS_SHORT } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, ReferenceLine } from 'recharts';

const DEFAULT_CATEGORIES = [
  { id: 'food',      label: 'Food',          emoji: '🍕', color: '#FF6B6B' },
  { id: 'supps',     label: 'Supplements',   emoji: '💊', color: '#C8F135' },
  { id: 'transport', label: 'Transport',     emoji: '🚗', color: '#4D9FFF' },
  { id: 'entertain', label: 'Entertainment', emoji: '🎮', color: '#A78BFA' },
  { id: 'outside',   label: 'Eating Out',    emoji: '🍽️', color: '#FB923C' },
  { id: 'gym',       label: 'Gym',           emoji: '🏋️', color: '#34D399' },
  { id: 'others',    label: 'Others',        emoji: '📦', color: '#94A3B8' },
];

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const dayKey   = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Budget({ BUDGET, syncBudget, BUDGET_SETTINGS, isReport, activeRange: propRange }) {
  const now = new Date();
  const currentMonthKey = monthKey(now);
  const todayKey = dayKey(now);

  const CATEGORIES = BUDGET_SETTINGS?.categories?.length ? BUDGET_SETTINGS.categories : DEFAULT_CATEGORIES;

  const [activeRange, setActiveRange] = useState(propRange || 'Monthly');
  
  useEffect(() => {
    if (propRange) {
      setActiveRange(propRange);
      setHistoryStart('');
      setHistoryEnd('');
    }
  }, [propRange]);

  useEffect(() => {
    setHistoryStart('');
    setHistoryEnd('');
  }, [activeRange]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [form, setForm] = useState({ category: CATEGORIES[0]?.id || 'food', amount: '', note: '' });
  const [incomeForm, setIncomeForm] = useState({ label: '', amount: '' });
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const [modalDay, setModalDay] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Unified filter logic for stats and categories
  const getFilteredData = (range, isPrevious = false) => {
    let spent = 0, income = 0;
    const catTotals = {};
    CATEGORIES.forEach(c => { catTotals[c.id] = 0; });
    const rangeEntries = [];

    const offset = isPrevious ? (range === 'Today' ? 1 : range === 'Weekly' ? 7 : range === 'Monthly' ? 30 : 365) : 0;
    const days = range === 'Today' ? 1 : range === 'Weekly' ? 7 : range === 'Monthly' ? 30 : 365;
    
    let startRange, endRange;
    const [selY, selM] = selectedMonth.split('-').map(Number);

    if (range === 'Monthly') {
      startRange = new Date(selY, selM - 1 - (isPrevious ? 1 : 0), 1);
      endRange = new Date(selY, selM - (isPrevious ? 1 : 0), 0, 23, 59, 59);
    } else if (range === 'Yearly') {
      startRange = new Date(selY - (isPrevious ? 1 : 0), 0, 1);
      endRange = new Date(selY - (isPrevious ? 1 : 0), 11, 31, 23, 59, 59);
    } else {
      startRange = new Date(now); 
      startRange.setHours(0,0,0,0);
      startRange.setDate(now.getDate() - offset - days);
      endRange = new Date(now);
      endRange.setHours(23,59,59,999);
      endRange.setDate(now.getDate() - offset);
    }

    Object.entries(BUDGET).forEach(([mk, md]) => {
      (md.entries || []).forEach(e => {
        const d = new Date(e.date);
        if (d >= startRange && d <= endRange) {
          const amt = Number(e.amount);
          spent += amt;
          if (!isPrevious) {
            rangeEntries.push(e);
            catTotals[e.category] = (catTotals[e.category] || 0) + amt;
          }
        }
      });
      (md.extraIncome || []).forEach(i => {
        const d = new Date(i.date);
        if (d >= startRange && d <= endRange) income += Number(i.amount);
      });
      
      const [ry, rm] = mk.split('-').map(Number);
      const salaryDate = new Date(ry, rm - 1, 1);
      if (salaryDate >= startRange && salaryDate <= endRange) {
        income += (BUDGET_SETTINGS?.income || 22400);
      }
    });

    return { spent, income, catTotals, rangeEntries };
  };

  const currentData = getFilteredData(activeRange);
  const prevData = getFilteredData(activeRange, true);
  
  const totalIncome = currentData.income;
  const totalSpent = currentData.spent;
  const catTotals = currentData.catTotals;
  const rangeEntries = currentData.rangeEntries;
  
  const remaining = totalIncome - totalSpent;
  const spentPct = totalIncome > 0 ? Math.min(100, Math.round((totalSpent / totalIncome) * 100)) : 0;
  
  const spendDiff = prevData.spent > 0 ? Math.round(((totalSpent - prevData.spent) / prevData.spent) * 100) : 0;
  const isBetter = totalSpent <= prevData.spent;

  // Base salary and bonus for breakdown
  const baseSalary = Object.entries(BUDGET).reduce((acc, [mk, md]) => {
    const [ry, rm] = mk.split('-').map(Number);
    const salaryDate = new Date(ry, rm - 1, 1);
    
    let startR, endR;
    const [selY, selM] = selectedMonth.split('-').map(Number);
    if (activeRange === 'Monthly') {
      startR = new Date(selY, selM - 1, 1);
      endR = new Date(selY, selM, 0, 23, 59, 59);
    } else if (activeRange === 'Yearly') {
      startR = new Date(selY, 0, 1);
      endR = new Date(selY, 11, 31, 23, 59, 59);
    } else {
      const days = activeRange === 'Today' ? 1 : activeRange === 'Weekly' ? 7 : 30;
      startR = new Date(now); startR.setDate(now.getDate() - days);
      endR = now;
    }
    
    if (salaryDate >= startR && salaryDate <= endR) return acc + (BUDGET_SETTINGS?.income || 22400);
    return acc;
  }, 0);
  const bonusIncome = Math.max(0, totalIncome - baseSalary);
  const extraIncome = (BUDGET[selectedMonth] || {}).extraIncome || [];

  const addEntry = () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return;
    const d = new Date(); const mk = monthKey(d); const dk = dayKey(d); const tm = formatTime(d); const ts = d.getTime();
    const newEntry = { id: ts.toString(), category: form.category, amount: Number(form.amount), note: form.note.trim(), date: dk, time: tm, timestamp: ts };
    const targetMonthData = BUDGET[mk] || { entries: [], extraIncome: [] };
    syncBudget({ ...BUDGET, [mk]: { ...targetMonthData, entries: [...(targetMonthData.entries || []), newEntry] } });
    setForm({ category: CATEGORIES[0]?.id || 'food', amount: '', note: '' });
    setShowAdd(false); setSelectedMonth(mk);
  };

  const deleteEntry = (id, mk) => {
    const targetMonth = BUDGET[mk]; if (!targetMonth) return;
    syncBudget({ ...BUDGET, [mk]: { ...targetMonth, entries: (targetMonth.entries || []).filter(e => e.id !== id) } });
  };

  const addIncome = () => {
    if (!incomeForm.amount || isNaN(incomeForm.amount) || Number(incomeForm.amount) <= 0) return;
    const d = new Date(); const mk = monthKey(d); const dk = dayKey(d); const tm = formatTime(d); const ts = d.getTime();
    const newIncome = { id: ts.toString(), label: incomeForm.label || 'Extra Income', amount: Number(incomeForm.amount), date: dk, time: tm, timestamp: ts };
    const targetMonthData = BUDGET[mk] || { entries: [], extraIncome: [] };
    syncBudget({ ...BUDGET, [mk]: { ...targetMonthData, extraIncome: [...(targetMonthData.extraIncome || []), newIncome] } });
    setIncomeForm({ label: '', amount: '' });
    setShowAddIncome(false); setSelectedMonth(mk);
  };

  const deleteIncome = (id, mk) => {
    const targetMonth = BUDGET[mk]; if (!targetMonth) return;
    syncBudget({ ...BUDGET, [mk]: { ...targetMonth, extraIncome: (targetMonth.extraIncome || []).filter(e => e.id !== id) } });
  };

  const historyDataMap = {};
  Object.entries(BUDGET).forEach(([mk, md]) => {
    const [y, m] = mk.split('-').map(Number);
    if (!historyStart && !historyEnd && !showAllHistory && mk !== selectedMonth) return;
    if (!historyDataMap[mk]) historyDataMap[mk] = { yr: y, mo: m - 1, days: {} };
    const allItems = [
      ...(md.entries || []).map(e => ({ ...e, type: 'expense' })),
      ...(md.extraIncome || []).map(i => ({ ...i, type: 'income', category: 'income', amount: i.amount, note: i.label }))
    ];
    allItems.forEach(e => {
      if (historyStart && e.date < historyStart) return;
      if (historyEnd && e.date > historyEnd) return;
      if (!historyDataMap[mk].days[e.date]) historyDataMap[mk].days[e.date] = { dk: e.date, totalSpent: 0, totalIncome: 0, items: [] };
      if (e.type === 'expense') historyDataMap[mk].days[e.date].totalSpent += Number(e.amount);
      else historyDataMap[mk].days[e.date].totalIncome += Number(e.amount);
      historyDataMap[mk].days[e.date].items.push({ ...e, mk });
    });
    if (Object.keys(historyDataMap[mk].days).length === 0) delete historyDataMap[mk];
  });

  const sortedHistory = Object.values(historyDataMap).sort((a, b) => (b.yr - a.yr) || (b.mo - a.mo));
  sortedHistory.forEach(month => { month.dayList = Object.values(month.days).sort((a, b) => b.dk.localeCompare(a.dk)); });

  const pieData = CATEGORIES.map(c => ({ name: c.label, value: catTotals[c.id], color: c.color })).filter(d => d.value > 0);

  const renderModal = () => {
    if (!modalDay) return null;
    const d = new Date(modalDay.dk);
    return (
      <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setModalDay(null); }}>
        <div className="modal">
          <div className="modal-handle"></div>
          <button className="modal-close" onClick={() => setModalDay(null)}>×</button>
          <div className="modal-title">{modalDay.dk === todayKey ? 'Today' : DAYS_SHORT[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600 }}>Spent: ₹{modalDay.totalSpent.toLocaleString()}</div>
            {modalDay.totalIncome > 0 && <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>Income: ₹{modalDay.totalIncome.toLocaleString()}</div>}
          </div>
          <div style={{ marginTop: '20px' }}>
            {modalDay.items.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map(e => {
              const isIncome = e.type === 'income';
              const cat = isIncome ? { emoji: '💰', label: 'Income', color: 'var(--accent)' } : (CATEGORIES.find(c => c.id === e.category) || CATEGORIES[CATEGORIES.length - 1]);
              return (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '10px', border: `1px solid ${isIncome ? 'rgba(200,241,53,0.1)' : 'var(--border2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>{cat.emoji}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{isIncome ? e.label : cat.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{e.time || 'Logged'} {e.note && !isIncome && `• ${e.note}`}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontWeight: 700, color: isIncome ? 'var(--accent)' : 'var(--text)' }}>{isIncome ? '+' : ''}₹{e.amount.toLocaleString()}</div>
                    <Trash2 size={14} onClick={() => { isIncome ? deleteIncome(e.id, e.mk) : deleteEntry(e.id, e.mk); setModalDay(null); }} style={{ color: 'var(--red)', cursor: 'pointer', opacity: 0.6 }} />
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
    <div id="budget-content" style={{ padding: '20px 0' }}>
      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        {!isReport && <div className="ai-title" style={{ fontSize: '32px', marginBottom: '20px' }}>Bud<span style={{ color: 'var(--blue)' }}>get</span></div>}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }} className="hide-scroll">
          {(() => {
            const months = []; for (let i = 0; i < 6; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const mk = monthKey(d); months.push({ mk, label: `${MONTHS[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}` }); }
            return months.map(m => (
              <div key={m.mk} onClick={() => setSelectedMonth(m.mk)}
                style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer', background: selectedMonth === m.mk ? 'var(--accent)' : 'var(--bg3)', color: selectedMonth === m.mk ? '#000' : 'var(--text3)', border: '1px solid var(--border2)', fontWeight: selectedMonth === m.mk ? 700 : 400 }}>
                {m.label}
              </div>
            ));
          })()}
        </div>
      </div>

      {isReport && (
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '20px', padding: '4px', width: 'fit-content', border: '1px solid var(--border2)' }}>
            {['Today', 'Weekly', 'Monthly', 'Yearly'].map(tr => (
              <div key={tr} onClick={() => setActiveRange(tr)} style={{ padding: '6px 16px', fontSize: '11px', borderRadius: '16px', cursor: 'pointer', background: activeRange === tr ? 'var(--accent)' : 'transparent', color: activeRange === tr ? '#000' : 'var(--text3)', fontWeight: activeRange === tr ? 700 : 400, transition: 'all 0.2s' }}>{tr}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase' }}>Total Income</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)' }}>₹{totalIncome.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', display: 'flex', gap: '8px' }}>
              <span>Salary: ₹{baseSalary.toLocaleString()}</span>
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

      {!isReport && (
        <>
          <div style={{ display: 'flex', gap: '12px', padding: '0 20px', marginBottom: '24px' }}>
            <button onClick={() => { setShowAdd(true); setShowAddIncome(false); }} style={{ flex: 1, padding: '16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(200,241,53,0.3)' }}><TrendingDown size={20} /> Add Expense</button>
            <button onClick={() => { setShowAddIncome(true); setShowAdd(false); }} style={{ flex: 1, padding: '16px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '16px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><TrendingUp size={20} /> Add Income</button>
          </div>
          {showAdd && (
            <div style={{ margin: '0 20px 24px', background: 'var(--bg3)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border2)' }}>
              <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>New Expense</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>{CATEGORIES.map(c => (<div key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: form.category === c.id ? c.color : 'var(--bg)', color: form.category === c.id ? '#000' : 'var(--text2)', fontWeight: 700, border: `1px solid ${form.category === c.id ? c.color : 'var(--border2)'}`, transition: 'all 0.2s' }}>{c.emoji} {c.label}</div>))}</div>
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
        </>
      )}

      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Spending by Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pieData.sort((a,b) => b.value - a.value).map(d => {
            const pct = Math.round((d.value / (totalSpent || 1)) * 100); const cat = CATEGORIES.find(c => c.label === d.name);
            return (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 500 }}><span>{cat?.emoji}</span><div>{d.name}</div></div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: d.color }}>₹{d.value.toLocaleString()} <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 400 }}>({pct}%)</span></div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: d.color, borderRadius: 3 }} /></div>
              </div>
            );
          })}
        </div>
      </div>

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
        {sortedHistory.map(month => (
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
                  <span style={{ color: 'var(--text3)', fontSize: '11px' }}>{day.items.filter(x => x.type === 'expense').length} Exp</span>
                  {day.totalIncome > 0 && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>• {day.items.filter(x => x.type === 'income').length} Inc</span>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    {day.items.map((e, idx) => {
                      if (idx > 4) return null;
                      const cat = e.type === 'income' ? { emoji: '💰' } : (CATEGORIES.find(c => c.id === e.category) || { emoji: '❓' });
                      return <span key={e.id} style={{ fontSize: '12px' }}>{cat.emoji}</span>;
                    })}
                    {day.items.length > 5 && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>+</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {renderModal()}
      </div>
    </div>
  );
}
