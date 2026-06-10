import React, { useState, useEffect, useRef } from 'react';
import { MONTHS } from '../../data';
import SplitExpense from '../split';

import { 
  monthKey, 
  dayKey, 
  formatTime, 
  getRolloverBalance, 
  getFilteredData 
} from './utils/budgetMath';

import { BudgetHeader } from './BudgetHeader';
import { BudgetActionButtons } from './BudgetActionButtons';
import { TransactionModals } from './TransactionModals';
import { BankingInsights } from './BankingInsights';
import { LiabilitiesTracker } from './LiabilitiesTracker';
import { CategorySpending } from './CategorySpending';
import { TransactionHistoryList } from './TransactionHistoryList';
import { DayDetailsModal } from './DayDetailsModal';

import { 
  Pizza, Pill, Car, Gamepad2, Utensils, Dumbbell, Coins, Package, Plane
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 'food',      label: 'Food',          Icon: Pizza,        emoji: '🍕', color: '#FF6B6B' },
  { id: 'supps',     label: 'Supplements',   Icon: Pill,         emoji: '💊', color: '#C8F135' },
  { id: 'transport', label: 'Transport',     Icon: Car,          emoji: '🚗', color: '#4D9FFF' },
  { id: 'travel',    label: 'Travel',        Icon: Plane,        emoji: '✈️', color: '#38BDF8' },
  { id: 'entertain', label: 'Entertainment', Icon: Gamepad2,     emoji: '🎮', color: '#A78BFA' },
  { id: 'outside',   label: 'Eating Out',    Icon: Utensils,     emoji: '🍽️', color: '#FB923C' },
  { id: 'gym',       label: 'Gym',           Icon: Dumbbell,     emoji: '🏋️', color: '#34D399' },
  { id: 'repayment', label: 'Repayments',    Icon: Coins,        emoji: '💸', color: '#F43F5E' },
  { id: 'others',    label: 'Others',        Icon: Package,      emoji: '📦', color: '#94A3B8' },
];

export default function BudgetWrapper({ BUDGET, syncBudget, BUDGET_SETTINGS, isReport, activeRange: propRange, profileInfo }) {
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
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtForm, setDebtForm] = useState({ type: 'loan', provider: '', amount: '', dueDate: '', note: '' });
  const [repayForm, setRepayForm] = useState({ debtId: null, amount: '' });
  const [showAddLend, setShowAddLend] = useState(false);
  const [lendForm, setLendForm] = useState({ person: '', amount: '', note: '' });
  const [collectForm, setCollectForm] = useState({ lendId: null, amount: '' });

  // --- SUB-TAB & SWIPE GESTURE EXTENSIONS ---
  const [activeSubTab, setActiveSubTab] = useState('my-budget');
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current;
    if (diffX > 75 && activeSubTab === 'my-budget') {
      setActiveSubTab('split-expense');
    }
    if (diffX < -75 && activeSubTab === 'split-expense') {
      setActiveSubTab('my-budget');
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };
  // ------------------------------------------

  const potentialRollover = getRolloverBalance(selectedMonth, BUDGET, BUDGET_SETTINGS);

  const currentData = getFilteredData(activeRange, false, selectedMonth, BUDGET, BUDGET_SETTINGS, CATEGORIES, now);
  const prevData = getFilteredData(activeRange, true, selectedMonth, BUDGET, BUDGET_SETTINGS, CATEGORIES, now);
  
  const totalIncome = currentData.income;
  const totalSpent = currentData.spent;
  const catTotals = currentData.catTotals;
  const rangeEntries = currentData.rangeEntries;
  
  const remaining = totalIncome - totalSpent;
  const spentPct = totalIncome > 0 ? Math.min(100, Math.round((totalSpent / totalIncome) * 100)) : 0;
  
  const spendDiff = prevData.spent > 0 ? Math.round(((totalSpent - prevData.spent) / prevData.spent) * 100) : 0;
  const isBetter = totalSpent <= prevData.spent;

  // Base salary and bonus for breakdown
  const baseSalary = (() => {
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
      startR = new Date(now); 
      startR.setHours(0,0,0,0);
      startR.setDate(now.getDate() - days);
      endR = new Date(now);
      endR.setHours(23,59,59,999);
    }
    
    let sum = 0;
    for (let y = startR.getFullYear(); y <= endR.getFullYear(); y++) {
      const startM = (y === startR.getFullYear()) ? startR.getMonth() : 0;
      const endM = (y === endR.getFullYear()) ? endR.getMonth() : 11;
      for (let m = startM; m <= endM; m++) {
        const payoutDate = new Date(y, m, 1);
        if (payoutDate >= startR && payoutDate <= endR) {
          sum += (BUDGET_SETTINGS?.income || 22400);
        }
      }
    }
    return sum;
  })();
  
  const rollover = getRolloverBalance(selectedMonth, BUDGET, BUDGET_SETTINGS);
  const rolloverApplied = BUDGET?.[selectedMonth]?.rolloverClaimed === true ? rollover : 0;
  const bonusIncome = Math.max(0, totalIncome - baseSalary - rolloverApplied);
  const extraIncome = (BUDGET?.[selectedMonth] || {}).extraIncome || [];

  const allDebts = [];
  Object.entries(BUDGET || {}).forEach(([mk, md]) => {
    (md.debts || []).forEach(d => {
      allDebts.push({ ...d, mk });
    });
  });

  const unpaidDebts = allDebts.filter(d => d.status !== 'paid');
  const totalBorrowed = unpaidDebts.filter(d => d.type === 'loan').reduce((sum, d) => sum + (Number(d.amount) - Number(d.paid || 0)), 0);
  const totalCreditDebt = unpaidDebts.filter(d => d.type === 'credit').reduce((sum, d) => sum + (Number(d.amount) - Number(d.paid || 0)), 0);
  const totalOutstandingDebt = totalBorrowed + totalCreditDebt;

  const earnedIncome = (() => {
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

    let extraSum = 0;
    Object.entries(BUDGET || {}).forEach(([mk, md]) => {
      (md.extraIncome || []).forEach(i => {
        const d = new Date(i.date);
        if (d >= startR && d <= endR) {
          if (!i.isLoan && !i.label?.toLowerCase().includes('loan')) {
            extraSum += Number(i.amount);
          }
        }
      });
    });

    return baseSalary + extraSum + rolloverApplied;
  })();

  const cashAssets = Math.max(0, earnedIncome + totalBorrowed - (totalSpent - totalCreditDebt));
  const netLiquidity = cashAssets - totalOutstandingDebt;

  const addEntry = () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return;
    const d = new Date(); const mk = monthKey(d); const dk = dayKey(d); const tm = formatTime(d); const ts = d.getTime();
    const newEntry = { id: ts.toString(), category: form.category, amount: Number(form.amount), note: form.note.trim(), date: dk, time: tm, timestamp: ts };
    const targetMonthData = BUDGET?.[mk] || { entries: [], extraIncome: [] };
    syncBudget({ ...BUDGET, [mk]: { ...targetMonthData, entries: [...(targetMonthData.entries || []), newEntry] } });
    setForm({ category: CATEGORIES[0]?.id || 'food', amount: '', note: '' });
    setShowAdd(false); setSelectedMonth(mk);
  };

  const deleteEntry = (id, mk) => {
    const targetMonth = BUDGET?.[mk]; if (!targetMonth) return;
    const updatedDebts = (targetMonth.debts || []).filter(d => d.transactionId !== id);
    syncBudget({
      ...BUDGET,
      [mk]: {
        ...targetMonth,
        entries: (targetMonth.entries || []).filter(e => e.id !== id),
        debts: updatedDebts
      }
    });
  };

  const addIncome = () => {
    if (!incomeForm.amount || isNaN(incomeForm.amount) || Number(incomeForm.amount) <= 0) return;
    const d = new Date(); const mk = monthKey(d); const dk = dayKey(d); const tm = formatTime(d); const ts = d.getTime();
    const newIncome = { id: ts.toString(), label: incomeForm.label || 'Extra Income', amount: Number(incomeForm.amount), date: dk, time: tm, timestamp: ts };
    const targetMonthData = BUDGET?.[mk] || { entries: [], extraIncome: [] };
    syncBudget({ ...BUDGET, [mk]: { ...targetMonthData, extraIncome: [...(targetMonthData.extraIncome || []), newIncome] } });
    setIncomeForm({ label: '', amount: '' });
    setShowAddIncome(false); setSelectedMonth(mk);
  };

  const deleteIncome = (id, mk) => {
    const targetMonth = BUDGET?.[mk]; if (!targetMonth) return;
    const updatedDebts = (targetMonth.debts || []).filter(d => d.transactionId !== id);
    syncBudget({
      ...BUDGET,
      [mk]: {
        ...targetMonth,
        extraIncome: (targetMonth.extraIncome || []).filter(e => e.id !== id),
        debts: updatedDebts
      }
    });
  };

  const addDebt = () => {
    if (!debtForm.amount || isNaN(debtForm.amount) || Number(debtForm.amount) <= 0 || !debtForm.provider.trim()) return;
    const d = new Date(); const mk = monthKey(d); const dk = dayKey(d); const tm = formatTime(d); const ts = d.getTime();
    const transactionId = (ts + 1).toString();
    const newDebt = {
      id: ts.toString(),
      type: debtForm.type,
      provider: debtForm.provider.trim(),
      amount: Number(debtForm.amount),
      paid: 0,
      status: 'pending',
      date: dk,
      time: tm,
      timestamp: ts,
      transactionId: transactionId,
      note: debtForm.note ? debtForm.note.trim() : ''
    };
    
    const targetMonthData = BUDGET?.[mk] || { entries: [], extraIncome: [], debts: [] };
    const updatedMonthData = { ...targetMonthData };
    
    updatedMonthData.debts = [...(targetMonthData.debts || []), newDebt];
    
    if (debtForm.type === 'loan') {
      const loanIncome = {
        id: transactionId,
        label: `Loan from ${debtForm.provider.trim()}`,
        amount: Number(debtForm.amount),
        date: dk,
        time: tm,
        timestamp: ts + 1,
        isLoan: true,
        note: debtForm.note ? debtForm.note.trim() : ''
      };
      updatedMonthData.extraIncome = [...(targetMonthData.extraIncome || []), loanIncome];
    } else {
      const cardExpense = {
        id: transactionId,
        category: 'others',
        amount: Number(debtForm.amount),
        note: debtForm.note ? `Credit Spend (${debtForm.provider.trim()}): ${debtForm.note.trim()}` : `Credit Spend: ${debtForm.provider.trim()}`,
        date: dk,
        time: tm,
        timestamp: ts + 1,
        isCredit: true
      };
      updatedMonthData.entries = [...(targetMonthData.entries || []), cardExpense];
    }
    
    syncBudget({ ...BUDGET, [mk]: updatedMonthData });
    setDebtForm({ type: 'loan', provider: '', amount: '', dueDate: '', note: '' });
    setShowAddDebt(false); setSelectedMonth(mk);
  };

  const repayDebt = (debtId, repayAmount, mk) => {
    if (!repayAmount || isNaN(repayAmount) || Number(repayAmount) <= 0) return;
    const targetMonth = BUDGET?.[mk]; if (!targetMonth) return;
    const ts = Date.now(); const dk = dayKey(new Date()); const tm = formatTime(new Date());
    
    let repaidDebtObj = null;
    const updatedDebts = (targetMonth.debts || []).map(d => {
      if (d.id === debtId) {
        const totalPaid = Number(d.paid || 0) + Number(repayAmount);
        const isFullyPaid = totalPaid >= d.amount;
        repaidDebtObj = { ...d, paid: totalPaid, status: isFullyPaid ? 'paid' : 'pending' };
        return repaidDebtObj;
      }
      return d;
    });

    if (!repaidDebtObj) return;

    const repaymentExpense = {
      id: ts.toString(),
      category: 'repayment',
      amount: Number(repayAmount),
      note: `Repayment: ${repaidDebtObj.type === 'loan' ? 'Loan from' : 'Credit Card due for'} ${repaidDebtObj.provider}`,
      date: dk,
      time: tm,
      timestamp: ts
    };

    syncBudget({
      ...BUDGET,
      [mk]: {
        ...targetMonth,
        debts: updatedDebts,
        entries: [...(targetMonth.entries || []), repaymentExpense]
      }
    });
    setRepayForm({ debtId: null, amount: '' });
  };

  // --- LEND MONEY (money you gave to someone) ---
  const addLend = () => {
    if (!lendForm.amount || isNaN(lendForm.amount) || Number(lendForm.amount) <= 0 || !lendForm.person.trim()) return;
    const d = new Date(); const mk = monthKey(d); const dk = dayKey(d); const tm = formatTime(d); const ts = d.getTime();
    const transactionId = (ts + 2).toString();
    const newLend = {
      id: ts.toString(),
      person: lendForm.person.trim(),
      amount: Number(lendForm.amount),
      collected: 0,
      status: 'pending',
      date: dk,
      time: tm,
      timestamp: ts,
      transactionId,
      note: lendForm.note ? lendForm.note.trim() : ''
    };
    const lendExpense = {
      id: transactionId,
      category: 'others',
      amount: Number(lendForm.amount),
      note: `Lent to ${lendForm.person.trim()}${lendForm.note ? ': ' + lendForm.note.trim() : ''}`,
      date: dk, time: tm, timestamp: ts + 2, isLend: true
    };
    const targetMonthData = BUDGET?.[mk] || { entries: [], extraIncome: [], debts: [], lends: [] };
    syncBudget({
      ...BUDGET,
      [mk]: {
        ...targetMonthData,
        lends: [...(targetMonthData.lends || []), newLend],
        entries: [...(targetMonthData.entries || []), lendExpense]
      }
    });
    setLendForm({ person: '', amount: '', note: '' });
    setShowAddLend(false); setSelectedMonth(mk);
  };

  const collectLend = (lendId, collectAmount, mk) => {
    if (!collectAmount || isNaN(collectAmount) || Number(collectAmount) <= 0) return;
    const targetMonth = BUDGET?.[mk]; if (!targetMonth) return;
    const ts = Date.now(); const dk = dayKey(new Date()); const tm = formatTime(new Date());
    let lendObj = null;
    const updatedLends = (targetMonth.lends || []).map(l => {
      if (l.id === lendId) {
        const totalCollected = Number(l.collected || 0) + Number(collectAmount);
        const isFullyCollected = totalCollected >= l.amount;
        lendObj = { ...l, collected: totalCollected, status: isFullyCollected ? 'returned' : 'pending' };
        return lendObj;
      }
      return l;
    });
    if (!lendObj) return;
    const returnIncome = {
      id: ts.toString(),
      label: `${lendObj.person} returned ₹${Number(collectAmount).toLocaleString()}`,
      amount: Number(collectAmount),
      date: dk, time: tm, timestamp: ts, isLendReturn: true
    };
    syncBudget({
      ...BUDGET,
      [mk]: {
        ...targetMonth,
        lends: updatedLends,
        extraIncome: [...(targetMonth.extraIncome || []), returnIncome]
      }
    });
    setCollectForm({ lendId: null, amount: '' });
  };

  const deleteLend = (lendId, mk) => {
    const targetMonth = BUDGET?.[mk]; if (!targetMonth) return;
    const lend = (targetMonth.lends || []).find(l => l.id === lendId);
    if (!lend) return;
    syncBudget({
      ...BUDGET,
      [mk]: {
        ...targetMonth,
        lends: (targetMonth.lends || []).filter(l => l.id !== lendId),
        entries: (targetMonth.entries || []).filter(e => e.id !== lend.transactionId),
        extraIncome: (targetMonth.extraIncome || []).filter(i => i.id !== lend.transactionId)
      }
    });
  };
  // -----------------------------------------------

  const deleteDebt = (debtId, mk) => {
    const targetMonth = BUDGET?.[mk]; if (!targetMonth) return;
    const debt = (targetMonth.debts || []).find(d => d.id === debtId);
    if (!debt) return;
    
    const updatedDebts = (targetMonth.debts || []).filter(d => d.id !== debtId);
    const updatedEntries = (targetMonth.entries || []).filter(e => e.id !== debt.transactionId);
    const updatedExtraIncome = (targetMonth.extraIncome || []).filter(i => i.id !== debt.transactionId);
    
    syncBudget({
      ...BUDGET,
      [mk]: {
        ...targetMonth,
        debts: updatedDebts,
        entries: updatedEntries,
        extraIncome: updatedExtraIncome
      }
    });
  };

  // Collect all lends across all months
  const allLends = [];
  Object.entries(BUDGET || {}).forEach(([mk, md]) => {
    (md.lends || []).forEach(l => {
      allLends.push({ ...l, mk });
    });
  });
  const pendingLends = allLends.filter(l => l.status !== 'returned');
  const totalLentOut = pendingLends.reduce((sum, l) => sum + (Number(l.amount) - Number(l.collected || 0)), 0);

  const historyDataMap = {};
  Object.entries(BUDGET || {}).forEach(([mk, md]) => {
    const parts = mk.split('-');
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    if (!historyStart && !historyEnd && !showAllHistory && mk !== selectedMonth) return;
    if (!historyDataMap[mk]) historyDataMap[mk] = { yr: y, mo: m - 1, days: {} };
    const allItems = [
      ...(md.entries || []).map(e => {
        if (e.isCredit) return { ...e, type: 'credit' };
        return { ...e, type: 'expense' };
      }),
      ...(md.extraIncome || []).map(i => {
        if (i.isLoan || i.label?.toLowerCase().includes('loan')) return { ...i, type: 'loan', category: 'loan', amount: i.amount, note: i.label };
        return { ...i, type: 'income', category: 'income', amount: i.amount, note: i.label };
      })
    ];
    allItems.forEach(e => {
      if (!e.date) return;
      if (historyStart && e.date < historyStart) return;
      if (historyEnd && e.date > historyEnd) return;
      if (!historyDataMap[mk].days[e.date]) historyDataMap[mk].days[e.date] = { dk: e.date, totalSpent: 0, totalIncome: 0, items: [] };
      if (e.type === 'expense' || e.type === 'credit') historyDataMap[mk].days[e.date].totalSpent += Number(e.amount);
      else if (e.type === 'income') historyDataMap[mk].days[e.date].totalIncome += Number(e.amount);
      historyDataMap[mk].days[e.date].items.push({ ...e, mk });
    });
    if (Object.keys(historyDataMap[mk].days).length === 0) delete historyDataMap[mk];
  });

  const sortedHistory = Object.values(historyDataMap).sort((a, b) => (b.yr - a.yr) || (b.mo - a.mo));
  sortedHistory.forEach(month => {
    month.dayList = Object.values(month.days).sort((a, b) => {
      const ad = a.dk || '';
      const bd = b.dk || '';
      return bd.localeCompare(ad);
    });
  });

  const pieData = CATEGORIES.map(c => ({ name: c.label, value: catTotals[c.id], color: c.color })).filter(d => d.value > 0);

  const renderMyBudget = () => {
    return (
      <div style={{ padding: '0 0 20px' }}>
        
        {/* Month Selector */}
        <div style={{ padding: '0 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }} className="hide-scroll">
            {(() => {
              // Always show last 6 months + any month that has data
              const monthSet = new Set();
              for (let i = 0; i < 6; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthSet.add(monthKey(d));
              }
              // Add all months from BUDGET that have actual entries or income
              Object.entries(BUDGET || {}).forEach(([mk, md]) => {
                if ((md.entries && md.entries.length > 0) || (md.extraIncome && md.extraIncome.length > 0)) {
                  monthSet.add(mk);
                }
              });
              // Sort descending (newest first) and map safely
              const months = Array.from(monthSet).map(mk => {
                const parts = mk.split('-');
                if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
                const y = Number(parts[0]);
                const m = Number(parts[1]);
                const d = new Date(y, m - 1, 1);
                if (isNaN(d.getTime())) return null;
                const monthName = MONTHS[d.getMonth()];
                if (!monthName) return null;
                return { mk, label: `${monthName.slice(0, 3)} ${String(d.getFullYear()).slice(2)}`, hasData: !!(BUDGET?.[mk]?.entries?.length || BUDGET?.[mk]?.extraIncome?.length) };
              }).filter(Boolean).sort((a, b) => b.mk.localeCompare(a.mk));

              return months.map(m => (
                <div key={m.mk} onClick={() => setSelectedMonth(m.mk)}
                  style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer', background: selectedMonth === m.mk ? 'var(--accent)' : 'var(--bg3)', color: selectedMonth === m.mk ? '#000' : m.hasData ? 'var(--text)' : 'var(--text3)', border: `1px solid ${selectedMonth === m.mk ? 'var(--accent)' : m.hasData ? 'var(--border)' : 'var(--border2)'}`, fontWeight: selectedMonth === m.mk ? 700 : m.hasData ? 600 : 400, position: 'relative' }}>
                  {m.label}{m.hasData && selectedMonth !== m.mk && <span style={{ position: 'absolute', top: '4px', right: '6px', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Report Range Selector */}
        {isReport && (
          <div style={{ padding: '0 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '20px', padding: '4px', width: 'fit-content', border: '1px solid var(--border2)' }}>
              {['Today', 'Weekly', 'Monthly', 'Yearly'].map(tr => (
                <div key={tr} onClick={() => setActiveRange(tr)} style={{ padding: '6px 16px', fontSize: '11px', borderRadius: '16px', cursor: 'pointer', background: activeRange === tr ? 'var(--accent)' : 'transparent', color: activeRange === tr ? '#000' : 'var(--text3)', fontWeight: activeRange === tr ? 700 : 400, transition: 'all 0.2s' }}>{tr}</div>
              ))}
            </div>
          </div>
        )}

        <BudgetHeader 
          isReport={isReport}
          totalIncome={totalIncome}
          baseSalary={baseSalary}
          rollover={rollover}
          bonusIncome={bonusIncome}
          remaining={remaining}
          spentPct={spentPct}
          totalSpent={totalSpent}
          selectedMonth={selectedMonth}
          potentialRollover={potentialRollover}
          BUDGET={BUDGET}
          syncBudget={syncBudget}
        />

        {!isReport && (
          <>
            <BudgetActionButtons 
              setShowAdd={setShowAdd}
              setShowAddIncome={setShowAddIncome}
              setShowAddDebt={setShowAddDebt}
              setShowAddLend={setShowAddLend}
            />

            <TransactionModals 
              showAdd={showAdd}
              setShowAdd={setShowAdd}
              showAddIncome={showAddIncome}
              setShowAddIncome={setShowAddIncome}
              showAddDebt={showAddDebt}
              setShowAddDebt={setShowAddDebt}
              showAddLend={showAddLend}
              setShowAddLend={setShowAddLend}
              form={form}
              setForm={setForm}
              incomeForm={incomeForm}
              setIncomeForm={setIncomeForm}
              debtForm={debtForm}
              setDebtForm={setDebtForm}
              lendForm={lendForm}
              setLendForm={setLendForm}
              CATEGORIES={CATEGORIES}
              addEntry={addEntry}
              addIncome={addIncome}
              addDebt={addDebt}
              addLend={addLend}
            />
          </>
        )}

        <BankingInsights 
          cashAssets={cashAssets}
          totalOutstandingDebt={totalOutstandingDebt}
          netLiquidity={netLiquidity}
          unpaidDebts={unpaidDebts}
          now={now}
        />

        <CategorySpending 
          pieData={pieData}
          totalSpent={totalSpent}
          CATEGORIES={CATEGORIES}
        />

        <LiabilitiesTracker 
          totalOutstandingDebt={totalOutstandingDebt}
          allDebts={allDebts}
          repayForm={repayForm}
          setRepayForm={setRepayForm}
          repayDebt={repayDebt}
          deleteDebt={deleteDebt}
          allLends={allLends}
          totalLentOut={totalLentOut}
          collectForm={collectForm}
          setCollectForm={setCollectForm}
          collectLend={collectLend}
          deleteLend={deleteLend}
        />

        <TransactionHistoryList 
          showAllHistory={showAllHistory}
          setShowAllHistory={setShowAllHistory}
          showDateFilter={showDateFilter}
          setShowDateFilter={setShowDateFilter}
          historyStart={historyStart}
          setHistoryStart={setHistoryStart}
          historyEnd={historyEnd}
          setHistoryEnd={setHistoryEnd}
          sortedHistory={sortedHistory}
          setModalDay={setModalDay}
          todayKey={todayKey}
          CATEGORIES={CATEGORIES}
        />
      </div>
    );
  };

  return (
    <div id="budget-content" style={{ padding: '0 0 20px', overflowX: 'hidden' }}>
      
      {!isReport && (
        <div style={{ padding: '0 20px', marginBottom: '20px', marginTop: '10px' }}>
          <div style={{ 
            position: 'relative',
            display: 'flex', 
            background: 'var(--bg3)', 
            borderRadius: '24px', 
            padding: '4px', 
            border: '1px solid var(--border2)',
            zIndex: 10
          }}>
            <div style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: activeSubTab === 'my-budget' ? '4px' : '50%',
              width: 'calc(50% - 4px)',
              background: 'var(--accent)',
              borderRadius: '20px',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 1,
              boxShadow: '0 4px 12px rgba(200, 241, 53, 0.25)'
            }} />
            
            <button 
              onClick={() => setActiveSubTab('my-budget')} 
              style={{ 
                flex: 1, padding: '10px 0', fontSize: '12px', borderRadius: '20px', cursor: 'pointer', border: 'none', background: 'transparent',
                color: activeSubTab === 'my-budget' ? '#000' : 'var(--text3)', fontWeight: 700, transition: 'color 0.2s', zIndex: 2, fontFamily: 'inherit'
              }}
            >
              My Budget
            </button>
            <button 
              onClick={() => setActiveSubTab('split-expense')} 
              style={{ 
                flex: 1, padding: '10px 0', fontSize: '12px', borderRadius: '20px', cursor: 'pointer', border: 'none', background: 'transparent',
                color: activeSubTab === 'split-expense' ? '#000' : 'var(--text3)', fontWeight: 700, transition: 'color 0.2s', zIndex: 2, fontFamily: 'inherit'
              }}
            >
              Split Expense
            </button>
          </div>
        </div>
      )}

      {isReport ? (
        <div style={{ padding: '0 0 20px' }}>
          {renderMyBudget()}
        </div>
      ) : (
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'flex',
            width: '200%',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: activeSubTab === 'my-budget' ? 'translateX(0%)' : 'translateX(-50%)'
          }}
        >
          <div style={{ width: '50%', flexShrink: 0, boxSizing: 'border-box' }}>
            {renderMyBudget()}
          </div>
          <div style={{ width: '50%', flexShrink: 0, boxSizing: 'border-box', padding: '0' }}>
            <SplitExpense profileInfo={profileInfo} />
          </div>
        </div>
      )}

      <DayDetailsModal 
        modalDay={modalDay}
        setModalDay={setModalDay}
        todayKey={todayKey}
        deleteIncome={deleteIncome}
        deleteEntry={deleteEntry}
        CATEGORIES={CATEGORIES}
      />
    </div>
  );
}
