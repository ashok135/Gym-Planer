import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Trash2, CheckCircle2, CreditCard, ArrowRight, Info, DollarSign,
  UserCheck, ChevronLeft, X, PieChart, BarChart, List
} from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const cleanName = (name) => (name || '').trim().toLowerCase();

const DEFAULT_SPLIT_CATEGORIES = [
  { id: 'food',      label: 'Food & Dining', emoji: '🍕', color: '#FF6B6B' },
  { id: 'rent',      label: 'Rent & Bills',  emoji: '🏠', color: '#4D9FFF' },
  { id: 'transport', label: 'Transport',     emoji: '🚗', color: '#FBBF24' },
  { id: 'groceries', label: 'Groceries',     emoji: '🛒', color: '#34D399' },
  { id: 'entertain', label: 'Entertainment', emoji: '🎮', color: '#A78BFA' },
  { id: 'others',    label: 'Others',        emoji: '📦', color: '#94A3B8' },
];

export default function SplitExpense() {
  const [currentUser, setCurrentUser] = useState(null);
  const myName = useMemo(() => currentUser?.email ? cleanName(currentUser.email.split('@')[0]) : 'me', [currentUser]);

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
  const [splitType, setSplitType] = useState('everyone');
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', paidBy: '', category: 'others', splitWith: [] });

  // 1. Auth Sync
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

  // 1b. Cloud Sync Joined Groups for New Devices
  useEffect(() => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.splitGroupsJoinedV2) {
          setJoinedGroups(data.splitGroupsJoinedV2);
          localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(data.splitGroupsJoinedV2));
        }
        
        // Full Real-time Sync across devices:
        // If active group is cleared on one device (e.g. they left the group or hit back), clear it everywhere.
        if (data.splitGroupActiveV2 === null) {
          setActiveGroup(null);
          localStorage.removeItem('g_split_active_group_v2');
        } else if (data.splitGroupActiveV2) {
          setActiveGroup(data.splitGroupActiveV2);
          localStorage.setItem('g_split_active_group_v2', JSON.stringify(data.splitGroupActiveV2));
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 2. Real-time Firebase Sync (Active Group)
  useEffect(() => {
    if (!activeGroup?.id) return;
    setGroupSyncing(true);
    const groupRef = doc(db, 'splitGroups', activeGroup.id);
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
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
        setJoinedGroups(prev => {
          const next = prev.map(g => g.id === docSnap.id ? updated : g);
          localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(next));
          return next;
        });
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
    
    let nextJoined = [];
    setJoinedGroups(prev => {
      const exists = prev.some(g => g.id === sanitized.id);
      nextJoined = exists ? prev.map(g => g.id === sanitized.id ? sanitized : g) : [...prev, sanitized];
      localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(nextJoined));
      return nextJoined;
    });

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
      const searchName = joinForm.name.trim();
      let matchedGroup = null;
      const docSnap = await getDoc(doc(db, 'splitGroups', searchName));
      if (docSnap.exists()) matchedGroup = { id: docSnap.id, ...docSnap.data() };
      else {
        const lowerDocSnap = await getDoc(doc(db, 'splitGroups', searchName.toLowerCase()));
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

  const getGroupLedger = () => {
    if (!activeGroup) return { netBalances: {}, simplifiedDebts: [], totalGroupSpent: 0 };
    const members = activeGroup.members || [];
    const expenses = activeGroup.expenses || [];
    const netBalances = {};
    members.forEach(m => { netBalances[m] = 0; });
    let totalGroupSpent = 0;

    expenses.forEach(e => {
      const amt = Number(e.amount);
      const isEveryoneSplit = e.splitAll === true;
      const participants = isEveryoneSplit ? members : (e.splitWith && e.splitWith.length > 0 ? e.splitWith : members);
      if (participants.length === 0) return;
      
      const exactShare = amt / participants.length;
      if (e.type !== 'settlement') totalGroupSpent += amt;

      participants.forEach(p => { if (netBalances[p] !== undefined) netBalances[p] -= exactShare; });
      if (netBalances[e.paidBy] !== undefined) netBalances[e.paidBy] += amt;
    });

    const creditors = []; const debtors = [];
    Object.entries(netBalances).forEach(([member, balance]) => {
      if (balance > 0.05) creditors.push({ member, val: balance });
      else if (balance < -0.05) debtors.push({ member, val: Math.abs(balance) });
    });
    creditors.sort((a, b) => b.val - a.val); debtors.sort((a, b) => b.val - a.val);

    const simplifiedDebts = [];
    let cIdx = 0, dIdx = 0;
    while (cIdx < creditors.length && dIdx < debtors.length) {
      const cred = creditors[cIdx]; const debt = debtors[dIdx];
      const settleAmt = Math.min(cred.val, debt.val);
      simplifiedDebts.push({ from: debt.member, to: cred.member, amount: Math.round(settleAmt * 100) / 100 });
      cred.val -= settleAmt; debt.val -= settleAmt;
      if (cred.val < 0.05) cIdx++;
      if (debt.val < 0.05) dIdx++;
    }
    return { netBalances, simplifiedDebts, totalGroupSpent };
  };

  const { simplifiedDebts, totalGroupSpent } = getGroupLedger();
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
      description: expenseForm.description.trim(),
      amount: Number(expenseForm.amount),
      paidBy: payer, category: expenseForm.category,
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

  const getMonthlyReport = () => {
    if (!activeGroup?.expenses) return {};
    const report = {};
    activeGroup.expenses.filter(e => e.type !== 'settlement').forEach(e => {
      const monthStr = new Date(e.timestamp).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!report[monthStr]) report[monthStr] = { total: 0, byCategory: {} };
      report[monthStr].total += e.amount;
      const cat = e.category || 'others';
      report[monthStr].byCategory[cat] = (report[monthStr].byCategory[cat] || 0) + e.amount;
    });
    return report;
  };

  const getCategoryDetails = (id) => splitCategories.find(c => c.id === id) || { label: 'Others', emoji: '📦', color: '#94A3B8' };

  if (!activeGroup) {
    return (
      <div className="reveal-fade-in" style={{ padding: '0 20px 40px', fontFamily: 'inherit' }}>
        <div style={{ padding: '30px 20px', borderRadius: '24px', background: 'linear-gradient(145deg, var(--bg2), var(--bg))', border: '1px solid var(--border)', textAlign: 'center', marginBottom: '24px' }}>
          <Users size={36} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>Split Ledger</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px', marginInline: 'auto', maxWidth: '280px' }}>Instant Google Pay-style bill splitting with real-time cloud sync.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => { setShowCreateGroup(true); setShowJoinGroup(false); setGroupError(''); }}
            style={{ flex: 1, padding: '16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Plus size={18} /><span>Create Group</span>
          </button>
          <button onClick={() => { setShowJoinGroup(true); setShowCreateGroup(false); setGroupError(''); }}
            style={{ flex: 1, padding: '16px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '16px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ArrowRight size={18} color="var(--accent)" /><span>Join Group</span>
          </button>
        </div>

        {(showCreateGroup || showJoinGroup) && (
          <div className="reveal-scale-in" style={{ background: 'var(--bg3)', border: `1px solid ${showCreateGroup ? 'rgba(200, 241, 53, 0.2)' : 'rgba(77, 159, 255, 0.2)'}`, borderRadius: '24px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: showCreateGroup ? 'var(--accent)' : 'var(--blue)', margin: 0 }}>{showCreateGroup ? 'Create a New Group' : 'Join an Existing Group'}</h3>
              <X size={20} color="var(--text3)" cursor="pointer" onClick={() => { setShowCreateGroup(false); setShowJoinGroup(false); }} />
            </div>
            <form onSubmit={showCreateGroup ? handleCreateGroup : handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder={showCreateGroup ? "Group Name (e.g. Goa Trip)" : "Group ID (e.g. goa-trip-1234)"} value={showCreateGroup ? createForm.name : joinForm.name} onChange={e => showCreateGroup ? setCreateForm({ ...createForm, name: e.target.value }) : setJoinForm({ ...joinForm, name: e.target.value })} className="auth-input" style={{ width: '100%', boxSizing: 'border-box' }} required />
              <input type="password" placeholder="Access Password" value={showCreateGroup ? createForm.password : joinForm.password} onChange={e => showCreateGroup ? setCreateForm({ ...createForm, password: e.target.value }) : setJoinForm({ ...joinForm, password: e.target.value })} className="auth-input" style={{ width: '100%', boxSizing: 'border-box' }} required />
              {groupError && <p style={{ fontSize: '12px', color: 'var(--red)', margin: '4px 0 0', fontWeight: 700 }}>{groupError}</p>}
              <button type="submit" disabled={groupSyncing} style={{ marginTop: '8px', padding: '14px', background: showCreateGroup ? 'var(--accent)' : 'var(--blue)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '14px', opacity: groupSyncing ? 0.7 : 1 }}>
                {groupSyncing ? 'Connecting...' : (showCreateGroup ? 'Create Now' : 'Join Securely')}
              </button>
            </form>
          </div>
        )}

        <div>
          <h4 style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Your Groups</h4>
          {joinedGroups.length === 0 ? (
            <div style={{ background: 'var(--bg3)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', border: '1px dashed var(--border2)' }}>You aren't in any split groups yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {joinedGroups.map(g => (
                <div key={g.id} onClick={() => { setActiveGroup(g); localStorage.setItem('g_split_active_group_v2', JSON.stringify(g)); }}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '15px', color: '#fff' }}>{g.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', display: 'flex', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12}/> {g.members?.length || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12}/> {g.expenses?.length || 0}</span>
                    </div>
                  </div>
                  <ArrowRight size={20} color="var(--accent)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const monthlyReport = getMonthlyReport();

  return (
    <div className="reveal-fade-in" style={{ padding: '0 20px 40px', fontFamily: 'inherit' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => { setActiveGroup(null); localStorage.removeItem('g_split_active_group_v2'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '8px 14px', fontSize: '12px', color: 'var(--text2)', cursor: 'pointer', fontWeight: 800 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text3)', fontWeight: 700 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: groupSyncing ? 'var(--blue)' : 'var(--accent)', boxShadow: `0 0 10px ${groupSyncing ? 'var(--blue)' : 'var(--accent)'}` }} />
          {groupSyncing ? 'Syncing...' : 'Live Synced'}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(145deg, var(--bg2), var(--bg))', border: '1px solid var(--border2)', borderRadius: '24px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={22} color="var(--accent)" /> {activeGroup.name}
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--text3)', display: 'flex', gap: '12px', fontWeight: 600 }}>
              <span>ID: <strong style={{ color: 'var(--text)' }}>{activeGroup.id}</strong></span>
              <span>Pass: <strong style={{ color: 'var(--text)' }}>{activeGroup.password}</strong></span>
            </div>
          </div>
          <button onClick={handleLeaveOrDeleteGroup} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '8px 14px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>
            {activeGroup.members?.[0] === myName ? 'Delete Group' : 'Leave'}
          </button>
        </div>
      </div>

      {/* THREE-COLUMN BALANCES (Total Spend, Owed, Owe) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Total Spent</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginTop: '6px' }}>₹{totalGroupSpent.toLocaleString()}</div>
        </div>
        <div style={{ background: 'rgba(77, 159, 255, 0.05)', border: '1px solid rgba(77, 159, 255, 0.2)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>You are owed</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--blue)', marginTop: '6px' }}>₹{myOwedToMe.toLocaleString()}</div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>You owe</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--red)', marginTop: '6px' }}>₹{myOweToOthers.toLocaleString()}</div>
        </div>
      </div>

      {/* Action Buttons (Compact UI) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setShowAddExpense(true)}
          style={{ padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Plus size={18} /><span>Expense</span>
        </button>
        <button onClick={() => setShowReport(true)}
          style={{ padding: '12px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '14px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <BarChart size={18} color="var(--blue)" /><span>Reports</span>
        </button>
        <button onClick={() => {
            const mName = prompt("Enter friend's unique lowercase username:");
            if (mName && mName.trim()) {
              const trimmed = cleanName(mName);
              if (activeGroup.members.includes(trimmed)) alert("Member already exists!");
              else syncGroupData({ ...activeGroup, members: [...activeGroup.members, trimmed] });
            }
          }}
          style={{ padding: '12px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '14px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <UserCheck size={18} /><span>Add Friend</span>
        </button>
      </div>

      {/* COMPACT MODAL: ADD EXPENSE */}
      {showAddExpense && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="reveal-scale-in" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '20px', width: '100%', maxWidth: '380px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={18} /> New Expense
              </h3>
              <X size={20} color="var(--text3)" cursor="pointer" onClick={() => setShowAddExpense(false)} />
            </div>

            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', borderRadius: '12px', padding: '12px 16px', border: '1px solid var(--border2)' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', marginRight: '8px' }}>₹</span>
                <input type="number" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} 
                  style={{ background: 'transparent', border: 'none', fontSize: '24px', fontWeight: 900, color: '#fff', width: '100%', outline: 'none' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 800 }}>Description</label>
                  <input type="text" placeholder="e.g. Dinner" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} 
                    className="auth-input" style={{ width: '100%', padding: '10px', fontSize: '12px' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 800 }}>Category</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px', color: '#fff', fontSize: '12px', outline: 'none' }}>
                    {splitCategories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 800 }}>Who Paid?</label>
                <select value={expenseForm.paidBy} onChange={e => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px', color: '#fff', fontSize: '12px', outline: 'none' }}>
                  {activeGroup.members.map(m => <option key={m} value={m}>{m} {m === myName ? '(You)' : ''}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border2)', marginBottom: '10px' }}>
                  <button type="button" onClick={() => setSplitType('everyone')} style={{ flex: 1, padding: '8px 0', fontSize: '11px', borderRadius: '8px', border: 'none', background: splitType === 'everyone' ? 'var(--accent)' : 'transparent', color: splitType === 'everyone' ? '#000' : 'var(--text3)', fontWeight: 900 }}>Everyone</button>
                  <button type="button" onClick={() => { setSplitType('custom'); setExpenseForm(prev => ({ ...prev, splitWith: [...activeGroup.members] })); }} style={{ flex: 1, padding: '8px 0', fontSize: '11px', borderRadius: '8px', border: 'none', background: splitType === 'custom' ? 'var(--accent)' : 'transparent', color: splitType === 'custom' ? '#000' : 'var(--text3)', fontWeight: 900 }}>Custom</button>
                </div>
                {splitType === 'custom' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                    {activeGroup.members?.map(m => {
                      const isIncluded = expenseForm.splitWith.includes(m);
                      return (
                        <div key={m} onClick={() => {
                            const current = [...expenseForm.splitWith];
                            if (isIncluded) { if (current.length > 1) setExpenseForm({ ...expenseForm, splitWith: current.filter(x => x !== m) }); else alert("Must include 1 member."); }
                            else setExpenseForm({ ...expenseForm, splitWith: [...current, m] });
                          }}
                          style={{ padding: '8px', borderRadius: '10px', background: isIncluded ? 'rgba(52,211,153,0.1)' : 'var(--bg2)', border: `1px solid ${isIncluded ? '#34D399' : 'var(--border2)'}`, fontSize: '11px', fontWeight: 700, color: isIncluded ? '#fff' : 'var(--text3)', textAlign: 'center', cursor: 'pointer' }}>
                          {m}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <button type="submit" style={{ padding: '14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '14px', marginTop: '4px' }}>Confirm Expense</button>
            </form>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT MODAL */}
      {showReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="reveal-scale-in" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '20px', width: '100%', maxWidth: '380px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><PieChart size={18} color="var(--blue)" /> Monthly Spend Report</h3>
              <X size={20} color="var(--text3)" cursor="pointer" onClick={() => setShowReport(false)} />
            </div>
            {Object.keys(monthlyReport).length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '12px', padding: '20px' }}>No expenses to analyze yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(monthlyReport).map(([month, data]) => (
                  <div key={month} style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--accent)' }}>{month}</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>₹{data.total.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(data.byCategory).sort((a,b) => b[1]-a[1]).map(([catId, amt]) => {
                        const c = getCategoryDetails(catId);
                        const pct = Math.round((amt / data.total) * 100);
                        return (
                          <div key={catId}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '14px' }}>{c.emoji}</span> {c.label}</span>
                              <span style={{ color: 'var(--text2)' }}>₹{amt.toLocaleString()} ({pct}%)</span>
                            </div>
                            <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: '4px' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ledger list */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Group Balances</div>
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

      {/* History */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Transaction History</h4>
        {(!activeGroup.expenses || activeGroup.expenses.length === 0) ? (
          <div style={{ background: 'var(--bg3)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', border: '1px dashed var(--border2)' }}>No expenses recorded yet. Be the first to start splitting!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...activeGroup.expenses].reverse().map(e => {
              const isSettle = e.type === 'settlement';
              const isEveryone = e.splitAll || (e.splitAll !== false && (e.splitWith || []).length >= 2);
              const catDetails = getCategoryDetails(e.category);
              return (
                <div key={e.id} style={{ background: 'var(--bg3)', borderRadius: '18px', padding: '16px', border: `1px solid ${isSettle ? 'rgba(52,211,153,0.15)' : 'var(--border2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isSettle ? 'rgba(52,211,153,0.1)' : 'var(--bg2)', border: '1px solid var(--border2)', color: isSettle ? '#34D399' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
                      {isSettle ? <CheckCircle2 size={18} /> : catDetails.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{e.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.5, fontWeight: 600 }}>
                        Paid by <strong style={{ color: 'var(--text)' }}>{e.paidBy === myName ? 'You' : e.paidBy}</strong> 
                        {!isSettle && ` • Split with ${isEveryone ? 'Everyone' : (e.splitWith || []).join(', ')}`}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{e.date} at {e.time} • {catDetails.label}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: isSettle ? '#34D399' : '#fff' }}>₹{e.amount.toLocaleString()}</div>
                    <button onClick={() => handleDeleteExpense(e.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', opacity: 0.5, cursor: 'pointer', padding: '4px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
