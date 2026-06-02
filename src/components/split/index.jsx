import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';

import { 
  dayKey, formatTime, cleanName, getMonthStr, CURRENT_MONTH, 
  DEFAULT_SPLIT_CATEGORIES, getGroupLedger 
} from './utils/splitMath';

import { GroupSetup } from './GroupSetup';
import { SplitAnalytics } from './SplitAnalytics';
import { SplitDashboardHeader } from './SplitDashboardHeader';
import { SplitActionModals } from './SplitActionModals';
import { SplitBalances } from './SplitBalances';
import { SplitHistory } from './SplitHistory';

export default function SplitWrapper({ profileInfo }) {
  const [currentUser, setCurrentUser] = useState(null);
  const myName = useMemo(() => {
    if (profileInfo?.name?.trim()) return cleanName(profileInfo.name);
    return currentUser?.email ? cleanName(currentUser.email.split('@')[0]) : 'me';
  }, [currentUser, profileInfo]);

  const [activeGroup, setActiveGroup] = useState(() => {
    try { const saved = localStorage.getItem('g_split_active_group_v2'); return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });
  const [joinedGroups, setJoinedGroups] = useState(() => {
    try { const saved = localStorage.getItem('g_split_joined_groups_v2'); return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
  });

  const [splitCategories, setSplitCategories] = useState(() => {
    try { const saved = localStorage.getItem('g_split_categories'); return saved ? JSON.parse(saved) : DEFAULT_SPLIT_CATEGORIES; } catch(e) { return DEFAULT_SPLIT_CATEGORIES; }
  });

  const [groupSyncing, setGroupSyncing] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  
  const [createForm, setCreateForm] = useState({ name: '', password: '' });
  const [joinForm, setJoinForm] = useState({ name: '', password: '' });
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [splitType, setSplitType] = useState('everyone');
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', paidBy: '', category: 'others', splitWith: [] });

  const availableMonths = useMemo(() => {
    if (!activeGroup?.expenses) return [CURRENT_MONTH];
    const months = new Set(activeGroup.expenses.map(e => getMonthStr(e.timestamp)));
    months.add(CURRENT_MONTH);
    return Array.from(months).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  }, [activeGroup?.expenses]);

  // Auth Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (!u) {
        setActiveGroup(null); setJoinedGroups([]);
        localStorage.removeItem('g_split_active_group_v2'); localStorage.removeItem('g_split_joined_groups_v2');
      }
    });
    return () => unsubscribe();
  }, []);

  // Cloud Sync
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.splitGroupsJoinedV2) {
          setJoinedGroups(data.splitGroupsJoinedV2);
          localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(data.splitGroupsJoinedV2));
        }
        if (data.splitGroupActiveV2 === null) {
          setActiveGroup(null); localStorage.removeItem('g_split_active_group_v2');
        } else if (data.splitGroupActiveV2) {
          setActiveGroup(data.splitGroupActiveV2); localStorage.setItem('g_split_active_group_v2', JSON.stringify(data.splitGroupActiveV2));
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Real-time Firebase Sync (Active Group)
  useEffect(() => {
    if (!activeGroup?.id) return;
    setGroupSyncing(true);
    const unsubscribe = onSnapshot(doc(db, 'splitGroups', activeGroup.id), (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const updated = { 
          id: docSnap.id, ...rawData,
          members: Array.from(new Set((rawData.members || []).map(cleanName))),
          expenses: (rawData.expenses || []).map(e => ({
            ...e, paidBy: cleanName(e.paidBy), splitWith: Array.from(new Set((e.splitWith || []).map(cleanName)))
          }))
        };
        setActiveGroup(updated);
        localStorage.setItem('g_split_active_group_v2', JSON.stringify(updated));
      }
      setGroupSyncing(false);
    }, () => setGroupSyncing(false));
    return () => unsubscribe();
  }, [activeGroup?.id]);

  const syncGroupData = async (updatedGroup) => {
    const sanitized = {
      ...updatedGroup,
      members: Array.from(new Set((updatedGroup.members || []).map(cleanName))),
      expenses: (updatedGroup.expenses || []).map(e => ({
        ...e, paidBy: cleanName(e.paidBy), splitWith: Array.from(new Set((e.splitWith || []).map(cleanName)))
      }))
    };

    setActiveGroup(sanitized);
    localStorage.setItem('g_split_active_group_v2', JSON.stringify(sanitized));
    
    const exists = joinedGroups.some(g => g.id === sanitized.id);
    const nextJoined = exists ? joinedGroups.map(g => g.id === sanitized.id ? sanitized : g) : [...joinedGroups, sanitized];
    
    setJoinedGroups(nextJoined);
    localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(nextJoined));

    if (currentUser) {
      try { await setDoc(doc(db, 'users', currentUser.uid), { splitGroupsJoinedV2: nextJoined, splitGroupActiveV2: sanitized }, { merge: true }); } catch (err) {}
    }
    try {
      await setDoc(doc(db, 'splitGroups', sanitized.id), {
        name: sanitized.name, password: sanitized.password, members: sanitized.members,
        expenses: sanitized.expenses, createdAt: sanitized.createdAt || Date.now()
      });
    } catch (e) {}
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault(); setGroupError('');
    if (!createForm.name.trim() || !createForm.password.trim()) return setGroupError('Fill in all fields.');
    const groupId = `${cleanName(createForm.name).replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newGroup = { id: groupId, name: createForm.name.trim(), password: createForm.password.trim(), members: [myName], expenses: [], createdAt: Date.now() };
    await syncGroupData(newGroup);
    setCreateForm({ name: '', password: '' }); setShowCreateGroup(false);
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault(); setGroupError('');
    if (!joinForm.name.trim() || !joinForm.password.trim()) return setGroupError('Fill in all fields.');
    try {
      setGroupSyncing(true);
      let matchedGroup = null;
      const docSnap = await getDoc(doc(db, 'splitGroups', joinForm.name.trim()));
      if (docSnap.exists()) matchedGroup = { id: docSnap.id, ...docSnap.data() };
      else {
        const lowerDocSnap = await getDoc(doc(db, 'splitGroups', joinForm.name.trim().toLowerCase()));
        if (lowerDocSnap.exists()) matchedGroup = { id: lowerDocSnap.id, ...lowerDocSnap.data() };
      }
      if (!matchedGroup) return setGroupError("Group ID not found.");
      if (matchedGroup.password !== joinForm.password.trim()) return setGroupError("Incorrect password.");

      const existingMembers = (matchedGroup.members || []).map(cleanName);
      if (!existingMembers.includes(myName)) matchedGroup.members = [...existingMembers, myName];
      await syncGroupData(matchedGroup);
      setJoinForm({ name: '', password: '' }); setShowJoinGroup(false);
    } catch (err) { setGroupError("Error connecting to Firebase."); } finally { setGroupSyncing(false); }
  };

  const handleLeaveOrDeleteGroup = async () => {
    const isOwner = activeGroup.members?.[0] === myName;
    if (!window.confirm(isOwner ? `Delete group "${activeGroup.name}" permanently for everyone?` : `Leave group "${activeGroup.name}"?`)) return;
    try {
      setGroupSyncing(true);
      const nextJoined = joinedGroups.filter(g => g.id !== activeGroup.id);
      setJoinedGroups(nextJoined); localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(nextJoined));
      const groupId = activeGroup.id;
      setActiveGroup(null); localStorage.removeItem('g_split_active_group_v2');
      if (currentUser) await setDoc(doc(db, 'users', currentUser.uid), { splitGroupsJoinedV2: nextJoined, splitGroupActiveV2: null }, { merge: true });
      if (isOwner) await deleteDoc(doc(db, 'splitGroups', groupId));
      else await updateDoc(doc(db, 'splitGroups', groupId), { members: activeGroup.members.filter(m => m !== myName) });
    } catch (err) {} finally { setGroupSyncing(false); }
  };

  const { simplifiedDebts, totalGroupSpent, filteredExpenses } = getGroupLedger(activeGroup, selectedMonth);
  const myOwedToMe = simplifiedDebts.filter(d => d.to === myName).reduce((sum, d) => sum + d.amount, 0);
  const myOweToOthers = simplifiedDebts.filter(d => d.from === myName).reduce((sum, d) => sum + d.amount, 0);

  useEffect(() => {
    if (activeGroup && showAddExpense) {
      setExpenseForm({ description: '', amount: '', paidBy: myName, category: splitCategories[0]?.id || 'others', splitWith: [...activeGroup.members] });
      setSplitType('everyone');
    }
  }, [showAddExpense, activeGroup, myName, splitCategories]);

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) return alert("Valid description and amount required.");
    const payer = cleanName(expenseForm.paidBy || myName);
    const participants = splitType === 'everyone' ? activeGroup.members : expenseForm.splitWith;
    if (participants.length === 0) return alert("Must include at least one member to split with.");

    const newExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: expenseForm.description.trim(), amount: Number(expenseForm.amount),
      paidBy: payer, addedBy: myName, category: expenseForm.category,
      splitWith: participants, splitAll: splitType === 'everyone',
      date: dayKey(new Date()), time: formatTime(new Date()), timestamp: Date.now(), type: 'expense'
    };
    await syncGroupData({ ...activeGroup, expenses: [...(activeGroup.expenses || []), newExpense] });
    setShowAddExpense(false);
  };

  const handleSettleUp = async (from, to, amount) => {
    const settlementExpense = {
      id: `settle-${Date.now()}`, description: `Repayment: ${from} paid ${to}`, amount: Number(amount),
      paidBy: from, splitWith: [to], date: dayKey(new Date()), time: formatTime(new Date()), timestamp: Date.now(), type: 'settlement'
    };
    await syncGroupData({ ...activeGroup, expenses: [...(activeGroup.expenses || []), settlementExpense] });
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense permanently?")) return;
    await syncGroupData({ ...activeGroup, expenses: (activeGroup.expenses || []).filter(e => e.id !== expenseId) });
  };

  const getCategoryDetails = (id) => splitCategories.find(c => c.id === id) || { label: 'Others', emoji: '📦', color: '#94A3B8' };

  if (!activeGroup) {
    return (
      <GroupSetup 
        showCreateGroup={showCreateGroup} setShowCreateGroup={setShowCreateGroup}
        showJoinGroup={showJoinGroup} setShowJoinGroup={setShowJoinGroup}
        groupError={groupError} setGroupError={setGroupError}
        createForm={createForm} setCreateForm={setCreateForm}
        joinForm={joinForm} setJoinForm={setJoinForm}
        groupSyncing={groupSyncing}
        handleCreateGroup={handleCreateGroup} handleJoinGroup={handleJoinGroup}
        joinedGroups={joinedGroups} setActiveGroup={setActiveGroup}
      />
    );
  }

  if (showReport) {
    const expensesOnly = filteredExpenses.filter(e => e.type !== 'settlement');
    const categoryTotals = {};
    const spenderTotals = {};
    expensesOnly.forEach(e => {
      const cat = e.category || 'others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
      spenderTotals[e.paidBy] = (spenderTotals[e.paidBy] || 0) + e.amount;
    });

    return (
      <SplitAnalytics 
        setShowReport={setShowReport}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        availableMonths={availableMonths}
        totalGroupSpent={totalGroupSpent}
        simplifiedDebts={simplifiedDebts}
        categoryTotals={categoryTotals}
        spenderTotals={spenderTotals}
        getCategoryDetails={getCategoryDetails}
      />
    );
  }

  return (
    <div className="reveal-fade-in" style={{ padding: '0 20px 40px', fontFamily: 'inherit' }}>
      
      <SplitDashboardHeader 
        activeGroup={activeGroup} setActiveGroup={setActiveGroup}
        groupSyncing={groupSyncing}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        availableMonths={availableMonths}
        totalGroupSpent={totalGroupSpent}
        myOwedToMe={myOwedToMe} myOweToOthers={myOweToOthers}
      />

      <SplitActionModals 
        showAddExpense={showAddExpense} setShowAddExpense={setShowAddExpense}
        showMoreMenu={showMoreMenu} setShowMoreMenu={setShowMoreMenu}
        setShowReport={setShowReport}
        myName={myName}
        activeGroup={activeGroup} syncGroupData={syncGroupData}
        handleLeaveOrDeleteGroup={handleLeaveOrDeleteGroup}
        expenseForm={expenseForm} setExpenseForm={setExpenseForm}
        splitType={splitType} setSplitType={setSplitType}
        handleAddExpenseSubmit={handleAddExpenseSubmit}
        splitCategories={splitCategories}
      />

      <SplitBalances 
        simplifiedDebts={simplifiedDebts}
        selectedMonth={selectedMonth}
        myName={myName}
        handleSettleUp={handleSettleUp}
      />

      <SplitHistory 
        filteredExpenses={filteredExpenses}
        selectedMonth={selectedMonth}
        myName={myName}
        getCategoryDetails={getCategoryDetails}
        handleDeleteExpense={handleDeleteExpense}
      />

    </div>
  );
}
