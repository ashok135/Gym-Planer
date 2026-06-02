import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight,
  Info,
  DollarSign,
  UserCheck,
  ChevronLeft,
  X
} from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';

// Helper formatting
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const cleanName = (name) => (name || '').trim().toLowerCase();

export default function SplitExpense() {
  // Identity
  const [currentUser, setCurrentUser] = useState(null);
  const myName = useMemo(() => currentUser?.email ? cleanName(currentUser.email.split('@')[0]) : 'me', [currentUser]);

  // State Management
  const [activeGroup, setActiveGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('g_split_active_group_v2');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [joinedGroups, setJoinedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('g_split_joined_groups_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [groupSyncing, setGroupSyncing] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  
  const [createForm, setCreateForm] = useState({ name: '', password: '' });
  const [joinForm, setJoinForm] = useState({ name: '', password: '' });
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [splitType, setSplitType] = useState('everyone');
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', paidBy: '', splitWith: [] });

  // 1. Auth Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (!u) {
        setActiveGroup(null);
        setJoinedGroups([]);
        localStorage.removeItem('g_split_active_group_v2');
        localStorage.removeItem('g_split_joined_groups_v2');
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firebase Sync (Active Group)
  useEffect(() => {
    if (!activeGroup?.id) return;
    setGroupSyncing(true);
    const groupRef = doc(db, 'splitGroups', activeGroup.id);
    
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        
        // Sanitize incoming data exactly once to guarantee correctness
        const updated = { 
          id: docSnap.id, 
          ...rawData,
          members: Array.from(new Set((rawData.members || []).map(cleanName))),
          expenses: (rawData.expenses || []).map(e => ({
            ...e,
            paidBy: cleanName(e.paidBy),
            splitWith: Array.from(new Set((e.splitWith || []).map(cleanName)))
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
    }, (err) => {
      console.warn("Firestore sync failed (using cache):", err);
      setGroupSyncing(false);
    });

    return () => unsubscribe();
  }, [activeGroup?.id]);

  // Sync Helper (Writes to DB)
  const syncGroupData = async (updatedGroup) => {
    // 1. Sanitize before ANY save
    const sanitized = {
      ...updatedGroup,
      members: Array.from(new Set((updatedGroup.members || []).map(cleanName))),
      expenses: (updatedGroup.expenses || []).map(e => ({
        ...e,
        paidBy: cleanName(e.paidBy),
        splitWith: Array.from(new Set((e.splitWith || []).map(cleanName)))
      }))
    };

    // 2. Optimistic UI Update
    setActiveGroup(sanitized);
    localStorage.setItem('g_split_active_group_v2', JSON.stringify(sanitized));
    
    let nextJoined = [];
    setJoinedGroups(prev => {
      const exists = prev.some(g => g.id === sanitized.id);
      nextJoined = exists ? prev.map(g => g.id === sanitized.id ? sanitized : g) : [...prev, sanitized];
      localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(nextJoined));
      return nextJoined;
    });

    // 3. Persist User metadata
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          splitGroupsJoinedV2: nextJoined,
          splitGroupActiveV2: sanitized
        }, { merge: true });
      } catch (err) {}
    }

    // 4. Persist Group Data
    try {
      await setDoc(doc(db, 'splitGroups', sanitized.id), {
        name: sanitized.name,
        password: sanitized.password,
        members: sanitized.members,
        expenses: sanitized.expenses,
        createdAt: sanitized.createdAt || Date.now()
      });
    } catch (e) {
      console.warn("Cloud write failed, data is saved locally.", e);
    }
  };

  // Group Management
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    if (!createForm.name.trim() || !createForm.password.trim()) return setGroupError('Fill in all fields.');

    const groupId = `${cleanName(createForm.name).replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    
    const newGroup = {
      id: groupId,
      name: createForm.name.trim(),
      password: createForm.password.trim(),
      members: [myName],
      expenses: [],
      createdAt: Date.now()
    };

    await syncGroupData(newGroup);
    setCreateForm({ name: '', password: '' });
    setShowCreateGroup(false);
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    if (!joinForm.name.trim() || !joinForm.password.trim()) return setGroupError('Fill in all fields.');

    try {
      setGroupSyncing(true);
      const searchName = joinForm.name.trim();
      let matchedGroup = null;

      const groupRef = doc(db, 'splitGroups', searchName);
      const docSnap = await getDoc(groupRef);
      if (docSnap.exists()) {
        matchedGroup = { id: docSnap.id, ...docSnap.data() };
      } else {
        const lowerRef = doc(db, 'splitGroups', searchName.toLowerCase());
        const lowerDocSnap = await getDoc(lowerRef);
        if (lowerDocSnap.exists()) {
          matchedGroup = { id: lowerDocSnap.id, ...lowerDocSnap.data() };
        }
      }

      if (!matchedGroup) {
        setGroupSyncing(false);
        return setGroupError("Group ID not found.");
      }

      if (matchedGroup.password !== joinForm.password.trim()) {
        setGroupSyncing(false);
        return setGroupError("Incorrect password.");
      }

      // Add self safely
      const existingMembers = (matchedGroup.members || []).map(cleanName);
      if (!existingMembers.includes(myName)) {
        matchedGroup.members = [...existingMembers, myName];
      }

      await syncGroupData(matchedGroup);
      setJoinForm({ name: '', password: '' });
      setShowJoinGroup(false);
    } catch (err) {
      setGroupError("Error connecting to Firebase.");
    } finally {
      setGroupSyncing(false);
    }
  };

  const handleLeaveOrDeleteGroup = async () => {
    const isOwner = activeGroup.members?.[0] === myName;
    const confirmMsg = isOwner 
      ? `Delete group "${activeGroup.name}" permanently for everyone?`
      : `Leave group "${activeGroup.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setGroupSyncing(true);
      const nextJoined = joinedGroups.filter(g => g.id !== activeGroup.id);
      setJoinedGroups(nextJoined);
      localStorage.setItem('g_split_joined_groups_v2', JSON.stringify(nextJoined));
      
      const groupId = activeGroup.id;
      setActiveGroup(null);
      localStorage.removeItem('g_split_active_group_v2');

      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          splitGroupsJoinedV2: nextJoined,
          splitGroupActiveV2: null
        }, { merge: true });
      }

      if (isOwner) {
        await deleteDoc(doc(db, 'splitGroups', groupId));
      } else {
        const updatedMembers = activeGroup.members.filter(m => m !== myName);
        await updateDoc(doc(db, 'splitGroups', groupId), { members: updatedMembers });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGroupSyncing(false);
    }
  };

  // Google Pay-Style Greedy Algorithm Ledger
  const getGroupLedger = () => {
    if (!activeGroup) return { netBalances: {}, simplifiedDebts: [], totalGroupSpent: 0 };
    
    const members = activeGroup.members || [];
    const expenses = activeGroup.expenses || [];
    
    // 1. Initialize balances map to 0
    const netBalances = {};
    members.forEach(m => { netBalances[m] = 0; });
    
    let totalGroupSpent = 0;

    // 2. Tally up all transactions exactly
    expenses.forEach(e => {
      const amt = Number(e.amount);
      const payer = e.paidBy;
      
      // Resolve participants list
      const isEveryoneSplit = e.splitAll === true;
      const participants = isEveryoneSplit ? members : (e.splitWith && e.splitWith.length > 0 ? e.splitWith : members);
      
      if (participants.length === 0) return;
      
      const exactShare = amt / participants.length;
      
      if (e.type !== 'settlement') totalGroupSpent += amt;

      // Subtract share from all participants
      participants.forEach(p => {
        if (netBalances[p] !== undefined) netBalances[p] -= exactShare;
      });
      
      // Add total paid amount to the payer's balance
      if (netBalances[payer] !== undefined) netBalances[payer] += amt;
    });

    // 3. Separate Debtors (negative balance) and Creditors (positive balance)
    const creditors = [];
    const debtors = [];
    
    Object.entries(netBalances).forEach(([member, balance]) => {
      // 0.05 tolerance handles floating point inaccuracies
      if (balance > 0.05) creditors.push({ member, val: balance });
      else if (balance < -0.05) debtors.push({ member, val: Math.abs(balance) });
    });

    // Sort by largest debts first for greedy settlement
    creditors.sort((a, b) => b.val - a.val);
    debtors.sort((a, b) => b.val - a.val);

    // 4. Greedy matching (Google Pay style)
    const simplifiedDebts = [];
    let cIdx = 0, dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const cred = creditors[cIdx];
      const debt = debtors[dIdx];
      
      const settleAmt = Math.min(cred.val, debt.val);
      
      simplifiedDebts.push({
        from: debt.member,
        to: cred.member,
        amount: Math.round(settleAmt * 100) / 100
      });
      
      cred.val -= settleAmt;
      debt.val -= settleAmt;
      
      if (cred.val < 0.05) cIdx++;
      if (debt.val < 0.05) dIdx++;
    }

    return { netBalances, simplifiedDebts, totalGroupSpent };
  };

  const { netBalances, simplifiedDebts, totalGroupSpent } = getGroupLedger();

  // Active User Specific Stats
  const myOwedToMe = simplifiedDebts
    .filter(d => d.to === myName)
    .reduce((sum, d) => sum + d.amount, 0);
    
  const myOweToOthers = simplifiedDebts
    .filter(d => d.from === myName)
    .reduce((sum, d) => sum + d.amount, 0);

  // Expense Handlers
  useEffect(() => {
    if (activeGroup && showAddExpense) {
      setExpenseForm({
        description: '',
        amount: '',
        paidBy: myName,
        splitWith: [...activeGroup.members]
      });
      setSplitType('everyone');
    }
  }, [showAddExpense, activeGroup, myName]);

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      return alert("Please enter a valid description and amount.");
    }

    const payer = cleanName(expenseForm.paidBy || myName);
    const participants = splitType === 'everyone' ? activeGroup.members : expenseForm.splitWith;

    if (participants.length === 0) return alert("Must include at least one member to split with.");

    const newExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: expenseForm.description.trim(),
      amount: Number(expenseForm.amount),
      paidBy: payer,
      splitWith: participants,
      splitAll: splitType === 'everyone',
      date: dayKey(new Date()),
      time: formatTime(new Date()),
      timestamp: Date.now(),
      type: 'expense'
    };

    const updated = {
      ...activeGroup,
      expenses: [...(activeGroup.expenses || []), newExpense]
    };

    await syncGroupData(updated);
    setShowAddExpense(false);
  };

  const handleSettleUp = async (from, to, amount) => {
    const settlementExpense = {
      id: `settle-${Date.now()}`,
      description: `Repayment: ${from} paid ${to}`,
      amount: Number(amount),
      paidBy: from,
      splitWith: [to],
      date: dayKey(new Date()),
      time: formatTime(new Date()),
      timestamp: Date.now(),
      type: 'settlement'
    };

    const updated = {
      ...activeGroup,
      expenses: [...(activeGroup.expenses || []), settlementExpense]
    };
    await syncGroupData(updated);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Remove this transaction permanently?")) return;
    const updated = {
      ...activeGroup,
      expenses: (activeGroup.expenses || []).filter(e => e.id !== expenseId)
    };
    await syncGroupData(updated);
  };

  // --- RENDER VIEWS ---

  if (!activeGroup) {
    return (
      <div className="reveal-fade-in" style={{ padding: '0 20px 40px', fontFamily: 'inherit' }}>
        <div style={{
          padding: '30px 20px',
          borderRadius: '24px',
          background: 'linear-gradient(145deg, var(--bg2), var(--bg))',
          border: '1px solid var(--border)',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <Users size={36} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Split Ledger</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px', marginInline: 'auto', maxWidth: '280px', lineHeight: 1.5 }}>
            Instant Google Pay-style bill splitting with real-time cloud sync.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => { setShowCreateGroup(true); setShowJoinGroup(false); setGroupError(''); }}
            style={{
              flex: 1, padding: '16px', background: 'var(--accent)', color: '#000', border: 'none',
              borderRadius: '16px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.15s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Plus size={18} /><span>Create Group</span>
          </button>
          
          <button onClick={() => { setShowJoinGroup(true); setShowCreateGroup(false); setGroupError(''); }}
            style={{
              flex: 1, padding: '16px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)',
              borderRadius: '16px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'transform 0.15s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            <ArrowRight size={18} color="var(--accent)" /><span>Join Group</span>
          </button>
        </div>

        {(showCreateGroup || showJoinGroup) && (
          <div className="reveal-scale-in" style={{
            background: 'var(--bg3)', border: `1px solid ${showCreateGroup ? 'rgba(200, 241, 53, 0.2)' : 'rgba(77, 159, 255, 0.2)'}`,
            borderRadius: '24px', padding: '24px', marginBottom: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: showCreateGroup ? 'var(--accent)' : 'var(--blue)', margin: 0 }}>
                {showCreateGroup ? 'Create a New Group' : 'Join an Existing Group'}
              </h3>
              <X size={20} color="var(--text3)" cursor="pointer" onClick={() => { setShowCreateGroup(false); setShowJoinGroup(false); }} />
            </div>
            
            <form onSubmit={showCreateGroup ? handleCreateGroup : handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder={showCreateGroup ? "Group Name (e.g. Goa Trip)" : "Group ID (e.g. goa-trip-1234)"} 
                value={showCreateGroup ? createForm.name : joinForm.name} 
                onChange={e => showCreateGroup ? setCreateForm({ ...createForm, name: e.target.value }) : setJoinForm({ ...joinForm, name: e.target.value })} 
                className="auth-input" style={{ width: '100%', boxSizing: 'border-box' }} required />
                
              <input type="password" placeholder="Access Password" 
                value={showCreateGroup ? createForm.password : joinForm.password} 
                onChange={e => showCreateGroup ? setCreateForm({ ...createForm, password: e.target.value }) : setJoinForm({ ...joinForm, password: e.target.value })} 
                className="auth-input" style={{ width: '100%', boxSizing: 'border-box' }} required />
              
              {groupError && <p style={{ fontSize: '12px', color: 'var(--red)', margin: '4px 0 0', fontWeight: 700 }}>{groupError}</p>}
              
              <button type="submit" disabled={groupSyncing} style={{ 
                marginTop: '8px', padding: '14px', background: showCreateGroup ? 'var(--accent)' : 'var(--blue)', 
                color: '#000', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '14px',
                opacity: groupSyncing ? 0.7 : 1
              }}>
                {groupSyncing ? 'Connecting...' : (showCreateGroup ? 'Create Now' : 'Join Securely')}
              </button>
            </form>
          </div>
        )}

        <div>
          <h4 style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Your Groups</h4>
          {joinedGroups.length === 0 ? (
            <div style={{ background: 'var(--bg3)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', border: '1px dashed var(--border2)' }}>
              You aren't in any split groups yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {joinedGroups.map(g => (
                <div key={g.id} 
                  onClick={() => { setActiveGroup(g); localStorage.setItem('g_split_active_group_v2', JSON.stringify(g)); }}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg2)'; }}>
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

  // --- DASHBOARD VIEW ---
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

      {/* Info Card */}
      <div style={{ background: 'linear-gradient(145deg, var(--bg2), var(--bg))', border: '1px solid var(--border2)', borderRadius: '24px', padding: '24px', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
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
        
        <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 600 }}>Logged in strictly as</span>
          <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><UserCheck size={16} /> {myName}</span>
        </div>
      </div>

      {/* Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(77, 159, 255, 0.05)', border: '1px solid rgba(77, 159, 255, 0.2)', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>You are owed</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--blue)', marginTop: '6px' }}>₹{myOwedToMe.toLocaleString()}</div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>You owe</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--red)', marginTop: '6px' }}>₹{myOweToOthers.toLocaleString()}</div>
        </div>
      </div>

      {/* Ledger list */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>Group Balances</div>

        {simplifiedDebts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(52,211,153,0.05)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
            <CheckCircle2 size={24} />
            <span style={{ fontWeight: 900, fontSize: '14px' }}>Everyone is fully settled up!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {simplifiedDebts.map((debt, i) => {
              const isIOWE = debt.from === myName;
              const isOWEDME = debt.to === myName;
              
              return (
                <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '18px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: 800 }}>
                      {isIOWE ? <span>You owe <strong style={{ color: 'var(--red)' }}>{debt.to}</strong></span> : 
                       isOWEDME ? <span><strong style={{ color: 'var(--accent)' }}>{debt.from}</strong> owes you</span> : 
                       <span><strong>{debt.from}</strong> owes <strong>{debt.to}</strong></span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px', fontWeight: 600 }}>
                      {isIOWE ? 'Tap settle to pay them back' : isOWEDME ? 'They will settle up with you' : 'Other group debt'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: isIOWE ? 'var(--red)' : isOWEDME ? 'var(--accent)' : '#fff' }}>
                      ₹{debt.amount.toLocaleString()}
                    </div>
                    {isIOWE && (
                      <button onClick={() => { if(window.confirm(`Settle ₹${debt.amount} to ${debt.to}?`)) handleSettleUp(debt.from, debt.to, debt.amount); }}
                        style={{ padding: '8px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setShowAddExpense(!showAddExpense)}
          style={{ flex: 1, padding: '18px', background: showAddExpense ? 'var(--bg3)' : 'var(--accent)', color: showAddExpense ? 'var(--text)' : '#000', border: showAddExpense ? '1px solid var(--border2)' : 'none', borderRadius: '18px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {showAddExpense ? <X size={20} /> : <Plus size={20} />}
          <span>{showAddExpense ? 'Close Form' : 'Split New Expense'}</span>
        </button>

        <button onClick={() => {
            const mName = prompt("Enter friend's unique lowercase username:");
            if (mName && mName.trim()) {
              const trimmed = cleanName(mName);
              if (activeGroup.members.includes(trimmed)) alert("Member already exists!");
              else syncGroupData({ ...activeGroup, members: [...activeGroup.members, trimmed] });
            }
          }}
          style={{ padding: '18px 24px', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: '18px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={18} /><span>Add Friend</span>
        </button>
      </div>

      {/* Expense Form */}
      {showAddExpense && (
        <div className="reveal-scale-in" style={{ background: 'var(--bg3)', border: '1px solid rgba(200, 241, 53, 0.3)', borderRadius: '24px', padding: '24px', marginBottom: '30px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} /> Add Expense
          </h3>
          <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 800 }}>Total Amount to split</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ fontSize: '40px', fontWeight: 900, color: 'var(--accent)' }}>₹</span>
                <input type="number" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} 
                  style={{ background: 'transparent', border: 'none', fontSize: '48px', fontWeight: 900, color: '#fff', width: '200px', textAlign: 'left', outline: 'none' }} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontWeight: 800 }}>What was it for?</label>
              <input type="text" placeholder="e.g. Dinner, Rent, Gym" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} 
                className="auth-input" style={{ width: '100%', boxSizing: 'border-box' }} required />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontWeight: 800 }}>Who Paid?</label>
              <select 
                value={expenseForm.paidBy} 
                onChange={e => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                style={{ width: '100%', padding: '16px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, outline: 'none' }}
              >
                {activeGroup.members.map(m => (
                  <option key={m} value={m}>{m} {m === myName ? '(You)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontWeight: 800 }}>Who is splitting it?</label>
              <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: '14px', padding: '4px', border: '1px solid var(--border2)', marginBottom: '14px' }}>
                <button type="button" onClick={() => setSplitType('everyone')}
                  style={{ flex: 1, padding: '12px 0', fontSize: '12px', borderRadius: '10px', border: 'none', background: splitType === 'everyone' ? 'var(--accent)' : 'transparent', color: splitType === 'everyone' ? '#000' : 'var(--text3)', fontWeight: 900, cursor: 'pointer' }}>
                  Split with Everyone
                </button>
                <button type="button" onClick={() => { setSplitType('custom'); setExpenseForm(prev => ({ ...prev, splitWith: [...activeGroup.members] })); }}
                  style={{ flex: 1, padding: '12px 0', fontSize: '12px', borderRadius: '10px', border: 'none', background: splitType === 'custom' ? 'var(--accent)' : 'transparent', color: splitType === 'custom' ? '#000' : 'var(--text3)', fontWeight: 900, cursor: 'pointer' }}>
                  Custom Split
                </button>
              </div>

              {splitType === 'everyone' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', background: 'rgba(200,241,53,0.05)', borderRadius: '14px', border: '1px solid rgba(200,241,53,0.2)' }}>
                  <Info size={16} color="var(--accent)" />
                  <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 600 }}>
                    Divided equally among all <strong>{activeGroup.members?.length}</strong> members (₹{expenseForm.amount ? Math.round(Number(expenseForm.amount) / activeGroup.members.length).toLocaleString() : '0'} each).
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeGroup.members?.map(m => {
                    const isIncluded = expenseForm.splitWith.includes(m);
                    return (
                      <div key={m} onClick={() => {
                          const current = [...expenseForm.splitWith];
                          if (isIncluded) {
                            if (current.length > 1) setExpenseForm({ ...expenseForm, splitWith: current.filter(x => x !== m) });
                            else alert("Must include at least 1 member.");
                          } else setExpenseForm({ ...expenseForm, splitWith: [...current, m] });
                        }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '14px', background: isIncluded ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isIncluded ? 'rgba(52,211,153,0.3)' : 'var(--border2)'}`, cursor: 'pointer' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: isIncluded ? '#fff' : 'var(--text3)' }}>{m} {m === myName ? '(You)' : ''}</span>
                        <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '10px', fontWeight: 900, background: isIncluded ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)', color: isIncluded ? '#34D399' : 'var(--red)', textTransform: 'uppercase' }}>
                          {isIncluded ? 'Included' : 'Excluded'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>
                Confirm & Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          Transaction History
        </h4>
        
        {(!activeGroup.expenses || activeGroup.expenses.length === 0) ? (
          <div style={{ background: 'var(--bg3)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', border: '1px dashed var(--border2)' }}>
            No expenses recorded yet. Be the first to start splitting!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...activeGroup.expenses].reverse().map(e => {
              const isSettle = e.type === 'settlement';
              const isEveryone = e.splitAll || (e.splitAll !== false && (e.splitWith || []).length >= 2);
              
              return (
                <div key={e.id} style={{ background: 'var(--bg3)', borderRadius: '18px', padding: '16px', border: `1px solid ${isSettle ? 'rgba(52,211,153,0.15)' : 'var(--border2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isSettle ? 'rgba(52,211,153,0.1)' : 'rgba(77,159,255,0.1)', color: isSettle ? '#34D399' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSettle ? <CheckCircle2 size={18} /> : <CreditCard size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{e.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.5, fontWeight: 600 }}>
                        Paid by <strong style={{ color: 'var(--text)' }}>{e.paidBy === myName ? 'You' : e.paidBy}</strong> 
                        {!isSettle && ` • Split with ${isEveryone ? 'Everyone' : (e.splitWith || []).join(', ')}`}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{e.date} at {e.time}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: isSettle ? '#34D399' : '#fff' }}>
                      ₹{e.amount.toLocaleString()}
                    </div>
                    <button onClick={() => handleDeleteExpense(e.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', opacity: 0.5, cursor: 'pointer', padding: '4px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                      <Trash2 size={14} />
                    </button>
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
