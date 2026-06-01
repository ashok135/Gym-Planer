import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { 
  PlusCircle, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  BarChart as BarChartIcon, 
  X,
  Pizza, 
  Pill, 
  Car, 
  Gamepad2, 
  Utensils, 
  Dumbbell, 
  Coins, 
  Package,
  Handshake,
  CreditCard,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  CalendarDays,
  FileText,
  Sparkles,
  HelpCircle,
  Users
} from 'lucide-react';
import { MONTHS, DAYS_SHORT } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, ReferenceLine } from 'recharts';

const DEFAULT_CATEGORIES = [
  { id: 'food',      label: 'Food',          Icon: Pizza,        emoji: '🍕', color: '#FF6B6B' },
  { id: 'supps',     label: 'Supplements',   Icon: Pill,         emoji: '💊', color: '#C8F135' },
  { id: 'transport', label: 'Transport',     Icon: Car,          emoji: '🚗', color: '#4D9FFF' },
  { id: 'entertain', label: 'Entertainment', Icon: Gamepad2,     emoji: '🎮', color: '#A78BFA' },
  { id: 'outside',   label: 'Eating Out',    Icon: Utensils,     emoji: '🍽️', color: '#FB923C' },
  { id: 'gym',       label: 'Gym',           Icon: Dumbbell,     emoji: '🏋️', color: '#34D399' },
  { id: 'repayment', label: 'Repayments',    Icon: Coins,        emoji: '💸', color: '#F43F5E' },
  { id: 'others',    label: 'Others',        Icon: Package,      emoji: '📦', color: '#94A3B8' },
];

const CategoryIcon = ({ cat, size = 16, style = {} }) => {
  if (!cat) return <HelpCircle size={size} style={style} />;
  if (cat.Icon) {
    const IconComponent = cat.Icon;
    return <IconComponent size={size} style={style} />;
  }
  if (cat.emoji) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1, ...style }}>{cat.emoji}</span>;
  }
  return <HelpCircle size={size} style={style} />;
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const dayKey   = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Budget({ BUDGET, syncBudget, BUDGET_SETTINGS, isReport, activeRange: propRange }) {
  const now = new Date();
  const currentMonthKey = monthKey(now);
  const todayKey = dayKey(now);

  const CATEGORIES = BUDGET_SETTINGS?.categories?.length ? BUDGET_SETTINGS.categories : DEFAULT_CATEGORIES;

  const getRolloverBalance = (targetMonthKey) => {
    if (!BUDGET) return 0;
    let rolloverSum = 0;
    const [targetY, targetM] = targetMonthKey.split('-').map(Number);
    
    Object.entries(BUDGET || {}).forEach(([mk, md]) => {
      const [y, m] = mk.split('-').map(Number);
      if (y < targetY || (y === targetY && m < targetM)) {
        // Calculate Income for this prior month
        let monthIncome = BUDGET_SETTINGS?.income || 22400;
        (md.extraIncome || []).forEach(i => {
          if (!i.isLoan && !i.label?.toLowerCase().includes('loan')) {
            monthIncome += Number(i.amount);
          }
        });
        
        // Calculate Spent for this prior month
        let monthSpent = 0;
        (md.entries || []).forEach(e => {
          monthSpent += Number(e.amount);
        });
        
        rolloverSum += (monthIncome - monthSpent);
      }
    });
    
    // Also count base salaries for empty prior months (not in BUDGET keys)
    const allKeys = Object.keys(BUDGET || {});
    if (allKeys.length > 0) {
      allKeys.sort();
      const [oldestY, oldestM] = allKeys[0].split('-').map(Number);
      let currY = oldestY;
      let currM = oldestM;
      while (currY < targetY || (currY === targetY && currM < targetM)) {
        const currKey = `${currY}-${String(currM).padStart(2, '0')}`;
        if (!BUDGET[currKey]) {
          rolloverSum += (BUDGET_SETTINGS?.income || 22400);
        }
        currM++;
        if (currM > 12) {
          currM = 1;
          currY++;
        }
      }
    }
    
    return rolloverSum;
  };

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
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtForm, setDebtForm] = useState({ type: 'loan', provider: '', amount: '', dueDate: '', note: '' });
  const [repayForm, setRepayForm] = useState({ debtId: null, amount: '' });

  // Collaborative Group Split States
  const [activeGroupId, setActiveGroupId] = useState(BUDGET_SETTINGS?.activeGroupId || '');
  const [sharedGroup, setSharedGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [nickname, setNickname] = useState(localStorage.getItem('gsplit_nickname') || '');
  
  // Create / Join UI forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createFields, setCreateFields] = useState({ groupId: '', passcode: '', nickname: '' });
  const [joinFields, setJoinFields] = useState({ groupId: '', passcode: '', nickname: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // Bill & Custom Category forms
  const [showAddBill, setShowAddBill] = useState(false);
  const [billForm, setBillForm] = useState({ title: '', amount: '', category: 'groceries', note: '', paidBy: '', splitWith: [] });
  const [showAddCustomCat, setShowAddCustomCat] = useState(false);
  const [customCatForm, setCustomCatForm] = useState({ label: '', emoji: '🏷️' });

  // Sync settings when they update
  useEffect(() => {
    setActiveGroupId(BUDGET_SETTINGS?.activeGroupId || '');
  }, [BUDGET_SETTINGS]);

  // Real-time Firestore sync
  useEffect(() => {
    if (!activeGroupId) {
      setSharedGroup(null);
      return;
    }
    setGroupLoading(true);
    const docRef = doc(db, "splitGroups", activeGroupId.toLowerCase().trim());
    const unsub = onSnapshot(docRef, docSnap => {
      setGroupLoading(false);
      if (docSnap.exists()) {
        setSharedGroup(docSnap.data());
      } else {
        setSharedGroup(null);
      }
    }, err => {
      console.error(err);
      setGroupLoading(false);
    });
    return () => unsub();
  }, [activeGroupId]);

  const groupMembers = sharedGroup?.members || [];
  const groupBills = sharedGroup?.months?.[selectedMonth]?.bills || [];
  const groupCategories = sharedGroup?.categories || [
    { id: 'house', label: 'House', emoji: '🏠', color: '#4D9FFF' },
    { id: 'groceries', label: 'Groceries', emoji: '🍎', color: '#34D399' },
    { id: 'zepto', label: 'Zepto', emoji: '⚡', color: '#FBBF24' },
    { id: 'instamart', label: 'Instamart', emoji: '🛵', color: '#FB923C' },
    { id: 'other', label: 'Other', emoji: '📦', color: '#94A3B8' }
  ];

  // Default payer & participants selection
  useEffect(() => {
    if (groupMembers.length > 0) {
      const activeUser = groupMembers.includes(nickname) ? nickname : (groupMembers[0] || 'You');
      setBillForm(f => ({
        ...f,
        paidBy: activeUser,
        category: groupCategories[0]?.id || 'groceries',
        splitWith: [...groupMembers]
      }));
    }
  }, [selectedMonth, sharedGroup, nickname]);

  // Dynamic balance calculations
  const balances = {};
  groupMembers.forEach(m => { balances[m] = 0; });
  groupBills.forEach(bill => {
    const totalAmount = Number(bill.amount) || 0;
    const payer = bill.paidBy;
    const splitWith = bill.splitWith || [];
    if (splitWith.length === 0) return;
    const share = totalAmount / splitWith.length;
    if (balances[payer] !== undefined) balances[payer] += totalAmount;
    splitWith.forEach(member => {
      if (balances[member] !== undefined) balances[member] -= share;
    });
  });

  // Suggested settlements minimization
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([name, bal]) => {
    const val = Math.round(bal * 100) / 100;
    if (val > 0.01) creditors.push({ name, amount: val });
    else if (val < -0.01) debtors.push({ name, amount: Math.abs(val) });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let cIdx = 0, dIdx = 0;
  const cTemp = creditors.map(c => ({ ...c }));
  const dTemp = debtors.map(d => ({ ...d }));
  while (cIdx < cTemp.length && dIdx < dTemp.length) {
    const creditor = cTemp[cIdx];
    const debtor = dTemp[dIdx];
    const amountToSettle = Math.min(creditor.amount, debtor.amount);
    if (amountToSettle > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amountToSettle * 100) / 100
      });
    }
    creditor.amount -= amountToSettle;
    debtor.amount -= amountToSettle;
    if (creditor.amount <= 0.01) cIdx++;
    if (debtor.amount <= 0.01) dIdx++;
  }

  // Group split functions
  const handleCreateGroup = async () => {
    setErrorMsg('');
    const { groupId, passcode, nickname: nName } = createFields;
    if (!groupId.trim() || !passcode.trim() || !nName.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    const finalId = groupId.toLowerCase().trim().replace(/\s+/g, '-');
    try {
      const docRef = doc(db, "splitGroups", finalId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setErrorMsg('Group ID already taken! Try another name.');
        return;
      }
      const newGroup = {
        id: finalId,
        groupName: groupId.trim(),
        passcode: passcode.trim(),
        members: [nName.trim()],
        categories: [
          { id: 'house', label: 'House', emoji: '🏠', color: '#4D9FFF' },
          { id: 'groceries', label: 'Groceries', emoji: '🍎', color: '#34D399' },
          { id: 'zepto', label: 'Zepto', emoji: '⚡', color: '#FBBF24' },
          { id: 'instamart', label: 'Instamart', emoji: '🛵', color: '#FB923C' },
          { id: 'other', label: 'Other', emoji: '📦', color: '#94A3B8' }
        ],
        months: {}
      };
      await setDoc(docRef, newGroup);
      localStorage.setItem('gsplit_nickname', nName.trim());
      setNickname(nName.trim());
      const updatedSettings = { ...BUDGET_SETTINGS, activeGroupId: finalId };
      syncBudget(BUDGET, updatedSettings);
      setShowCreateForm(false);
      setCreateFields({ groupId: '', passcode: '', nickname: '' });
    } catch (e) {
      console.error(e);
      setErrorMsg('Error creating group.');
    }
  };

  const handleJoinGroup = async () => {
    setErrorMsg('');
    const { groupId, passcode, nickname: nName } = joinFields;
    if (!groupId.trim() || !passcode.trim() || !nName.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    const finalId = groupId.toLowerCase().trim().replace(/\s+/g, '-');
    try {
      const docRef = doc(db, "splitGroups", finalId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setErrorMsg('Group not found!');
        return;
      }
      const data = docSnap.data();
      if (data.passcode !== passcode.trim()) {
        setErrorMsg('Incorrect passcode!');
        return;
      }
      if (data.members.includes(nName.trim())) {
        setErrorMsg('Nickname already in use in this group!');
        return;
      }
      const updatedMembers = [...data.members, nName.trim()];
      await updateDoc(docRef, { members: updatedMembers });
      localStorage.setItem('gsplit_nickname', nName.trim());
      setNickname(nName.trim());
      const updatedSettings = { ...BUDGET_SETTINGS, activeGroupId: finalId };
      syncBudget(BUDGET, updatedSettings);
      setShowJoinForm(false);
      setJoinFields({ groupId: '', passcode: '', nickname: '' });
    } catch (e) {
      console.error(e);
      setErrorMsg('Error joining group.');
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this shared group?')) return;
    try {
      const finalId = activeGroupId.toLowerCase().trim();
      const docRef = doc(db, "splitGroups", finalId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedMembers = (data.members || []).filter(m => m !== nickname);
        await updateDoc(docRef, { members: updatedMembers });
      }
    } catch(err) {
      console.error(err);
    }
    const updatedSettings = { ...BUDGET_SETTINGS, activeGroupId: '' };
    syncBudget(BUDGET, updatedSettings);
  };

  const addSharedBill = async () => {
    if (!billForm.title.trim() || !billForm.amount || isNaN(billForm.amount) || Number(billForm.amount) <= 0) return;
    if (!billForm.splitWith || billForm.splitWith.length === 0) return;
    
    const d = new Date();
    const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const ts = d.getTime();
    
    const newBill = {
      id: ts.toString(),
      title: billForm.title.trim(),
      amount: Number(billForm.amount),
      paidBy: billForm.paidBy,
      category: billForm.category,
      note: billForm.note.trim(),
      splitWith: [...billForm.splitWith],
      approvals: [billForm.paidBy],
      date: dk,
      timestamp: ts
    };

    const docRef = doc(db, "splitGroups", activeGroupId.toLowerCase().trim());
    const currentMonths = { ...sharedGroup.months } || {};
    const monthData = currentMonths[selectedMonth] || { bills: [] };
    
    currentMonths[selectedMonth] = {
      ...monthData,
      bills: [...(monthData.bills || []), newBill]
    };
    
    await updateDoc(docRef, { months: currentMonths });
    setBillForm(f => ({ ...f, title: '', amount: '', note: '' }));
    setShowAddBill(false);
  };

  const deleteBill = async (billId) => {
    const docRef = doc(db, "splitGroups", activeGroupId.toLowerCase().trim());
    const currentMonths = { ...sharedGroup.months } || {};
    const monthData = currentMonths[selectedMonth] || { bills: [] };
    const updatedBills = (monthData.bills || []).filter(b => b.id !== billId);
    
    currentMonths[selectedMonth] = {
      ...monthData,
      bills: updatedBills
    };
    await updateDoc(docRef, { months: currentMonths });
  };

  const confirmSplitShare = async (billId) => {
    const docRef = doc(db, "splitGroups", activeGroupId.toLowerCase().trim());
    const currentMonths = { ...sharedGroup.months } || {};
    const monthData = currentMonths[selectedMonth] || { bills: [] };
    const updatedBills = (monthData.bills || []).map(b => {
      if (b.id === billId) {
        const curApprovals = b.approvals || [b.paidBy];
        if (!curApprovals.includes(nickname)) {
          return { ...b, approvals: [...curApprovals, nickname] };
        }
      }
      return b;
    });
    currentMonths[selectedMonth] = { ...monthData, bills: updatedBills };
    await updateDoc(docRef, { months: currentMonths });
  };

  const quickSettle = async (from, to, amount) => {
    const d = new Date();
    const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const ts = d.getTime();
    
    const settleBill = {
      id: ts.toString(),
      title: `Settle: ${from} to ${to}`,
      amount: Number(amount),
      paidBy: from,
      category: 'other',
      note: `Direct repayment settlement`,
      splitWith: [to],
      approvals: [from, to],
      date: dk,
      timestamp: ts
    };

    const docRef = doc(db, "splitGroups", activeGroupId.toLowerCase().trim());
    const currentMonths = { ...sharedGroup.months } || {};
    const monthData = currentMonths[selectedMonth] || { bills: [] };
    
    currentMonths[selectedMonth] = {
      ...monthData,
      bills: [...(monthData.bills || []), settleBill]
    };
    await updateDoc(docRef, { months: currentMonths });
  };

  const createCustomCategory = async () => {
    if (!customCatForm.label.trim()) return;
    const docRef = doc(db, "splitGroups", activeGroupId.toLowerCase().trim());
    const newCat = {
      id: customCatForm.label.toLowerCase().trim().replace(/\s+/g, '-'),
      label: customCatForm.label.trim(),
      emoji: customCatForm.emoji.trim() || '🏷️',
      color: `hsl(${Math.floor(Math.random() * 360)}, 75%, 60%)`
    };
    const updatedCats = [...groupCategories, newCat];
    await updateDoc(docRef, { categories: updatedCats });
    setShowAddCustomCat(false);
    setCustomCatForm({ label: '', emoji: '🏷️' });
    setBillForm(f => ({ ...f, category: newCat.id }));
  };

  const potentialRollover = getRolloverBalance(selectedMonth);

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
        if (d >= startRange && d <= endRange) {
          if (!i.isLoan && !i.label?.toLowerCase().includes('loan')) {
            income += Number(i.amount);
          }
        }
      });
    });

    // Automatically calculate and add the salary income independent of whether the month is in BUDGET entries
    for (let y = startRange.getFullYear(); y <= endRange.getFullYear(); y++) {
      const startM = (y === startRange.getFullYear()) ? startRange.getMonth() : 0;
      const endM = (y === endRange.getFullYear()) ? endRange.getMonth() : 11;
      for (let m = startM; m <= endM; m++) {
        const payoutDate = new Date(y, m, 1);
        if (payoutDate >= startRange && payoutDate <= endRange) {
          income += (BUDGET_SETTINGS?.income || 22400);
        }
      }
    }

    // Add rollover balance if evaluating monthly budget and user claimed it
    if (range === 'Monthly') {
      const evalMonthKey = monthKey(new Date(selY, selM - 1 - (isPrevious ? 1 : 0), 1));
      if (BUDGET[evalMonthKey]?.rolloverClaimed === true) {
        income += getRolloverBalance(evalMonthKey);
      }
    }

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
  const rollover = getRolloverBalance(selectedMonth);
  const rolloverApplied = BUDGET[selectedMonth]?.rolloverClaimed === true ? rollover : 0;
  const bonusIncome = Math.max(0, totalIncome - baseSalary - rolloverApplied);
  const extraIncome = (BUDGET[selectedMonth] || {}).extraIncome || [];

  const allDebts = [];
  Object.entries(BUDGET).forEach(([mk, md]) => {
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
    Object.entries(BUDGET).forEach(([mk, md]) => {
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
    const targetMonthData = BUDGET[mk] || { entries: [], extraIncome: [] };
    syncBudget({ ...BUDGET, [mk]: { ...targetMonthData, entries: [...(targetMonthData.entries || []), newEntry] } });
    setForm({ category: CATEGORIES[0]?.id || 'food', amount: '', note: '' });
    setShowAdd(false); setSelectedMonth(mk);
  };

  const deleteEntry = (id, mk) => {
    const targetMonth = BUDGET[mk]; if (!targetMonth) return;
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
    const targetMonthData = BUDGET[mk] || { entries: [], extraIncome: [] };
    syncBudget({ ...BUDGET, [mk]: { ...targetMonthData, extraIncome: [...(targetMonthData.extraIncome || []), newIncome] } });
    setIncomeForm({ label: '', amount: '' });
    setShowAddIncome(false); setSelectedMonth(mk);
  };

  const deleteIncome = (id, mk) => {
    const targetMonth = BUDGET[mk]; if (!targetMonth) return;
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
    
    const targetMonthData = BUDGET[mk] || { entries: [], extraIncome: [], debts: [] };
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
    const targetMonth = BUDGET[mk]; if (!targetMonth) return;
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

  const deleteDebt = (debtId, mk) => {
    const targetMonth = BUDGET[mk]; if (!targetMonth) return;
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

  const historyDataMap = {};
  Object.entries(BUDGET).forEach(([mk, md]) => {
    const [y, m] = mk.split('-').map(Number);
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
  sortedHistory.forEach(month => { month.dayList = Object.values(month.days).sort((a, b) => b.dk.localeCompare(a.dk)); });

  const pieData = CATEGORIES.map(c => ({ name: c.label, value: catTotals[c.id], color: c.color })).filter(d => d.value > 0);

  const renderModal = () => {
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
                      else if (isLoan) deleteIncome(e.id, e.mk); // this will also auto-delete linked debt!
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

  const renderAddBillModal = () => {
    if (!showAddBill) return null;
    return (
      <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setShowAddBill(false); }}>
        <div className="modal" style={{ maxWidth: '400px', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <button className="modal-close" onClick={() => setShowAddBill(false)}>×</button>
          <div className="modal-title" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={20} />
            <span>Add Shared Bill</span>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Bill Title / Expense</label>
            <input 
              type="text" 
              placeholder="e.g. Electricity, Groceries, Dinner" 
              value={billForm.title} 
              onChange={e => setBillForm(f => ({ ...f, title: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} 
            />

            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Amount (₹)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={billForm.amount} 
              onChange={e => setBillForm(f => ({ ...f, amount: e.target.value }))} 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} 
            />

            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Who Paid?</label>
            <select 
              value={billForm.paidBy} 
              onChange={e => setBillForm(f => ({ ...f, paidBy: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }}
            >
              {groupMembers.map(m => (
                <option key={m} value={m}>{m === 'You' ? 'You' : m}</option>
              ))}
            </select>

            <label style={{ fontSize: '11px', color: 'var(--text3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Split With Whom?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border2)' }}>
              {groupMembers.map(m => {
                const isSelected = billForm.splitWith?.includes(m);
                return (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => {
                        const newSplitWith = isSelected 
                          ? billForm.splitWith.filter(x => x !== m)
                          : [...billForm.splitWith, m];
                        setBillForm(f => ({ ...f, splitWith: newSplitWith }));
                      }}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                    <span>{m === 'You' ? 'You' : m}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={addSharedBill} 
                style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
              >
                Log Shared Bill
              </button>
              <button 
                onClick={() => setShowAddBill(false)} 
                style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditMembersModal = () => {
    if (!showEditMembers) return null;
    return (
      <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setShowEditMembers(false); }}>
        <div className="modal" style={{ maxWidth: '360px', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <button className="modal-close" onClick={() => setShowEditMembers(false)}>×</button>
          <div className="modal-title" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={20} />
            <span>Customize Friends</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', marginBottom: '16px' }}>
            Define the names of your 3 friends in the group. You can edit them at any time.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {editNames.map((name, idx) => (
              <div key={idx}>
                <label style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Friend {idx + 1} Name</label>
                <input 
                  type="text" 
                  value={name} 
                  placeholder={`Friend ${idx + 1}`}
                  onChange={e => {
                    const copy = [...editNames];
                    copy[idx] = e.target.value;
                    setEditNames(copy);
                  }} 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '10px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button 
                onClick={() => saveGroupMembers(editNames)} 
                style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
              >
                Save Changes
              </button>
              <button 
                onClick={() => setShowEditMembers(false)} 
                style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="budget-content" style={{ padding: '0 0 20px' }}>
      {/* Dynamic Wealth Banner with futuristic network/financial lines overlay background */}
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

      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
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

      {/* Mini Rollover prompt row tucked beautifully below the main card */}
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
              style={{ 
                padding: '4px 10px', 
                background: 'var(--accent)', 
                color: '#000', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '10px', 
                fontWeight: 800, 
                cursor: 'pointer' 
              }}
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
              style={{ 
                padding: '4px 8px', 
                background: 'transparent', 
                color: 'var(--text3)', 
                border: '1px solid var(--border2)', 
                borderRadius: '8px', 
                fontSize: '10px', 
                fontWeight: 700, 
                cursor: 'pointer' 
              }}
            >
              No
            </button>
          </div>
        </div>
      )}

      {!isReport && (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '0 20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => { setShowAdd(true); setShowAddIncome(false); setShowAddDebt(false); }} style={{ flex: '1 1 100px', padding: '14px 10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(200,241,53,0.2)' }}><TrendingDown size={16} /> Expense</button>
            <button onClick={() => { setShowAddIncome(true); setShowAdd(false); setShowAddDebt(false); }} style={{ flex: '1 1 100px', padding: '14px 10px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><TrendingUp size={16} /> Income</button>
            <button onClick={() => { setShowAddDebt(true); setShowAdd(false); setShowAddIncome(false); }} style={{ flex: '1 1 100px', padding: '14px 10px', background: 'rgba(77,159,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(77,159,255,0.3)', borderRadius: '14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><PlusCircle size={16} /> Credit & Loans</button>
          </div>
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
        </>
      )}

      {/* 📊 BANKING & CREDIT INSIGHTS CARD */}
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

        {/* Banking Health Banner */}
        <div style={{ 
          padding: '12px', 
          borderRadius: '12px', 
          fontSize: '11px', 
          lineHeight: 1.4, 
          background: netLiquidity < 0
            ? 'rgba(244,63,94,0.06)'
            : totalOutstandingDebt === 0 
              ? 'rgba(52,211,153,0.06)' 
              : 'rgba(77,159,255,0.06)',
          border: `1px solid ${
            netLiquidity < 0
              ? 'rgba(244,63,94,0.15)'
              : totalOutstandingDebt === 0 
                ? 'rgba(52,211,153,0.15)' 
                : 'rgba(77,159,255,0.15)'
          }`,
          color: netLiquidity < 0
            ? 'var(--red)'
            : totalOutstandingDebt === 0 
              ? '#34D399' 
              : 'var(--blue)'
        }}>
          {netLiquidity < 0 ? (
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <AlertTriangle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>**Financial Health: Budget Deficit.** You have overspent your available cash by ₹{Math.abs(netLiquidity).toLocaleString()}! Avoid new expenses and balance your budget.</span>
            </span>
          ) : totalOutstandingDebt === 0 ? (
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>**Financial Health: Excellent.** You have zero outstanding liabilities! All your cash is fully liquid and debt-free.</span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>**Financial Health: Healthy Coverage.** Your remaining cash covers your outstanding dues (₹{totalOutstandingDebt.toLocaleString()}). Settle them whenever you wish.</span>
            </span>
          )}
        </div>

        {/* Next Month Repayment Planner Card */}
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
                      {d.note && <div style={{ color: 'var(--text3)', fontSize: '10px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={10} /> <span>{d.note}</span></div>}
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

      {/* 👥 GROUP SPLIT LEDGER CARD */}
      <div className="scroll-reveal" style={{ 
        margin: '0 20px 24px', 
        background: 'linear-gradient(135deg, rgba(200,241,53,0.04), rgba(167,139,250,0.04))', 
        borderRadius: '24px', 
        padding: '20px', 
        border: '1px solid rgba(255,255,255,0.05)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent)" />
            <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Group Split Ledger
            </div>
          </div>
          <button 
            onClick={() => {
              setEditNames(groupMembers.slice(1));
              setShowEditMembers(true);
            }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text3)', 
              fontSize: '11px', 
              fontWeight: 600, 
              cursor: 'pointer',
              textDecoration: 'underline' 
            }}
          >
            Manage Friends
          </button>
        </div>

        {/* Balance Sheet Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          {groupMembers.map(m => {
            const bal = Math.round((balances[m] || 0) * 100) / 100;
            const isOwed = bal > 0.01;
            const owes = bal < -0.01;
            
            return (
              <div key={m} style={{ 
                background: 'var(--bg3)', 
                padding: '12px 10px', 
                borderRadius: '14px', 
                border: '1px solid var(--border2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {m === 'You' ? '👥 You' : m}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 900, 
                  marginTop: '4px',
                  color: isOwed ? 'var(--accent)' : owes ? 'var(--red)' : 'var(--text3)' 
                }}>
                  {isOwed ? `+₹${bal.toLocaleString()}` : owes ? `-₹${Math.abs(bal).toLocaleString()}` : 'Settled'}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>
                  {isOwed ? 'Owed' : owes ? 'Owes' : 'Clear'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestions & Transfers */}
        {settlements.length > 0 && (
          <div style={{ 
            background: 'rgba(0,0,0,0.15)', 
            padding: '12px', 
            borderRadius: '16px', 
            marginBottom: '16px', 
            border: '1px solid var(--border2)' 
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 700 }}>
              Suggested Settlements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {settlements.map((s, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  fontSize: '11px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  <span style={{ color: 'var(--text2)' }}>
                    <strong>{s.from === 'You' ? 'You owe' : `${s.from} owes`}</strong> {s.to === 'You' ? 'You' : s.to} <strong style={{ color: 'var(--accent)' }}>₹{s.amount.toLocaleString()}</strong>
                  </span>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Mark ₹${s.amount} settlement between ${s.from} and ${s.to}?`)) {
                        quickSettle(s.from, s.to, s.amount);
                      }
                    }}
                    style={{ 
                      padding: '4px 8px', 
                      background: 'var(--accent)', 
                      color: '#000', 
                      border: 'none', 
                      borderRadius: '6px', 
                      fontSize: '9px', 
                      fontWeight: 800, 
                      cursor: 'pointer' 
                    }}
                  >
                    ⚡ Settle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Bills List */}
        {groupBills.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
              Group Shared Bills ({groupBills.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }} className="hide-scroll">
              {groupBills.slice().reverse().map(b => (
                <div key={b.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'rgba(0,0,0,0.1)', 
                  padding: '8px 12px', 
                  borderRadius: '10px',
                  fontSize: '11px',
                  border: '1px solid rgba(255,255,255,0.02)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{b.title}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>
                      Paid by {b.paidBy === 'You' ? 'You' : b.paidBy} • split with {b.splitWith?.length || 0}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text2)' }}>₹{b.amount.toLocaleString()}</span>
                    <Trash2 
                      size={12} 
                      onClick={() => { if(window.confirm('Delete this bill?')) deleteBill(b.id); }} 
                      style={{ color: 'var(--red)', cursor: 'pointer', opacity: 0.6 }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              setBillForm({
                title: '',
                amount: '',
                paidBy: 'You',
                splitWith: [...groupMembers]
              });
              setShowAddBill(true);
            }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: 'var(--accent)', 
              color: '#000', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 800, 
              fontSize: '12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <PlusCircle size={14} /> Add Shared Bill
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Spending by Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pieData.sort((a,b) => b.value - a.value).map(d => {
            const pct = Math.round((d.value / (totalSpent || 1)) * 100); const cat = CATEGORIES.find(c => c.label === d.name);
            return (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ color: d.color, display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon cat={cat} size={16} />
                    </span>
                    <div>{d.name}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: d.color }}>₹{d.value.toLocaleString()} <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 400 }}>({pct}%)</span></div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: d.color, borderRadius: 3 }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 💳 LIABILITIES & REPAYMENTS TRACKER */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CreditCard size={16} color="var(--red)" />
          <span>Liabilities & Outstanding Dues</span>
          <span style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 'normal', marginLeft: 'auto' }}>
            Unpaid: ₹{totalOutstandingDebt.toLocaleString()}
          </span>
        </div>
        
        {allDebts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg3)', borderRadius: '16px', padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px', border: '1px dashed var(--border2)' }}>
            <Sparkles size={20} color="var(--accent)" />
            <span>No borrowed loans or credit card spend logged yet.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allDebts.map(d => {
              const remainingAmount = d.amount - (d.paid || 0);
              const progress = Math.min(100, Math.round(((d.paid || 0) / d.amount) * 100));
              const isPaid = d.status === 'paid';
              
              return (
                <div key={d.id} className="scroll-reveal" style={{ background: isPaid ? 'rgba(52,211,153,0.02)' : 'var(--bg2)', borderRadius: '16px', padding: '16px', border: `1px solid ${isPaid ? 'rgba(52,211,153,0.15)' : 'var(--border2)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: d.type === 'loan' ? 'rgba(77,159,255,0.15)' : 'rgba(244,63,94,0.15)', color: d.type === 'loan' ? 'var(--blue)' : 'var(--red)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {d.type === 'loan' ? <Handshake size={10} /> : <CreditCard size={10} />}
                          <span>{d.type === 'loan' ? 'Friend Loan' : 'Credit Due'}</span>
                        </span>
                        {isPaid && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(52,211,153,0.15)', color: '#34D399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} />
                            <span>Paid</span>
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginTop: '6px' }}>{d.provider}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>Logged on {d.date}</div>
                      {d.note && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: 'var(--text2)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', marginTop: '6px', borderLeft: '3px solid var(--border)' }}>
                          <FileText size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span><strong>Note:</strong> {d.note}</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)' }}>₹{d.amount.toLocaleString()}</div>
                      {!isPaid && <div style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 600 }}>Owe: ₹{remainingAmount.toLocaleString()}</div>}
                      {isPaid && <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Fully Repaid</div>}
                    </div>
                  </div>

                  {/* Repayment Progress Bar */}
                  <div style={{ margin: '12px 0 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>
                      <span>Paid: ₹{(d.paid || 0).toLocaleString()} ({progress}%)</span>
                      <span>Target: ₹{d.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: isPaid ? '#34D399' : 'var(--blue)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  {/* Inline Repayment Form / Buttons */}
                  {!isPaid && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center' }}>
                      {repayForm.debtId === d.id ? (
                        <>
                          <input 
                            type="number" 
                            placeholder="Repay Amt (₹)" 
                            value={repayForm.amount}
                            onChange={e => setRepayForm(f => ({ ...f, amount: e.target.value }))}
                            style={{ flex: 1, padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                          />
                          <button 
                            onClick={() => repayDebt(d.id, repayForm.amount, d.mk)}
                            style={{ padding: '6px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                          >
                            Pay
                          </button>
                          <button 
                            onClick={() => setRepayForm({ debtId: null, amount: '' })}
                            style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => setRepayForm({ debtId: d.id, amount: String(remainingAmount) })}
                            style={{ padding: '6px 12px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Coins size={12} />
                            <span>Repay / Payback</span>
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('Delete this debt entry?')) deleteDebt(d.id, d.mk); }}
                            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--red)', opacity: 0.5, cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
        {sortedHistory.length === 0 ? (
          <div style={{ background: 'var(--bg3)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', border: '1px dashed var(--border2)', marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} style={{ color: 'var(--text3)', opacity: 0.5 }} />
            <div>No history this month</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', opacity: 0.8 }}>Start logging expenses or income to build your ledger.</div>
          </div>
        ) : (
          sortedHistory.map(month => (
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
                    <span style={{ color: 'var(--text3)', fontSize: '11px' }}>{day.items.filter(x => x.type === 'expense' || x.type === 'credit').length} Exp</span>
                    {day.totalIncome > 0 && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>• {day.items.filter(x => x.type === 'income').length} Inc</span>}
                    {day.items.some(x => x.type === 'loan') && <span style={{ color: 'var(--blue)', fontSize: '11px' }}>• {day.items.filter(x => x.type === 'loan').length} Loan</span>}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {day.items.map((e, idx) => {
                        if (idx > 4) return null;
                        const cat = e.type === 'income' 
                          ? { Icon: Coins, color: 'var(--accent)' } 
                          : e.type === 'loan'
                            ? { Icon: Handshake, color: 'var(--blue)' }
                            : e.type === 'credit'
                              ? { Icon: CreditCard, color: 'var(--red)' }
                              : (CATEGORIES.find(c => c.id === e.category) || { Icon: HelpCircle, color: 'var(--text3)' });
                        
                        return (
                          <span key={e.id} style={{ color: cat.color || 'var(--text2)', display: 'inline-flex', alignItems: 'center' }}>
                            <CategoryIcon cat={cat} size={12} />
                          </span>
                        );
                      })}
                      {day.items.length > 5 && <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 700 }}>+</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        {renderModal()}
        {renderAddBillModal()}
        {renderAddCustomCatModal()}
      </div>
    </div>
  );
}
