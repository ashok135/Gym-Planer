import React, { useState, useEffect } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';

// Helper functions for date formatting
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function SplitExpense() {
  // Get active logged-in user username
  const [currentUser, setCurrentUser] = useState(null);
  const myName = currentUser?.email ? currentUser.email.split('@')[0].toLowerCase() : 'me';

  // State Management
  const [activeGroup, setActiveGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('g_split_active_group');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [joinedGroups, setJoinedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('g_split_joined_groups');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [groupSyncing, setGroupSyncing] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  
  const [createForm, setCreateForm] = useState({ name: '', password: '' });
  const [joinForm, setJoinForm] = useState({ name: '', password: '' });
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [splitType, setSplitType] = useState('everyone'); // 'everyone' or 'custom'
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', paidBy: '', splitWith: [] });

  // Sync Auth User State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (!u) {
        // Logged out: Clear state
        setActiveGroup(null);
        setJoinedGroups([]);
        localStorage.removeItem('g_split_active_group');
        localStorage.removeItem('g_split_joined_groups');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync User document Cloud State
  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.splitGroupsJoined) {
          setJoinedGroups(data.splitGroupsJoined);
          localStorage.setItem('g_split_joined_groups', JSON.stringify(data.splitGroupsJoined));
        }
        if (data.splitGroupActive !== undefined) {
          setActiveGroup(data.splitGroupActive);
          if (data.splitGroupActive === null) {
            localStorage.removeItem('g_split_active_group');
          } else {
            localStorage.setItem('g_split_active_group', JSON.stringify(data.splitGroupActive));
          }
        }
      }
    }, (err) => {
      console.warn("User doc cloud sync error:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Sync Active Group Firestore document
  useEffect(() => {
    if (!activeGroup?.id) return;
    setGroupSyncing(true);
    const groupRef = doc(db, 'splitGroups', activeGroup.id);
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updated = { id: docSnap.id, ...data };
        if (updated.members) {
          updated.members = Array.from(new Set(updated.members.map(m => m.toLowerCase())));
        }
        if (updated.expenses) {
          updated.expenses = updated.expenses.map(e => ({
            ...e,
            paidBy: e.paidBy ? e.paidBy.toLowerCase() : e.paidBy,
            splitWith: e.splitWith ? Array.from(new Set(e.splitWith.map(m => m.toLowerCase()))) : e.splitWith
          }));
        }
        setActiveGroup(updated);
        localStorage.setItem('g_split_active_group', JSON.stringify(updated));
        
        setJoinedGroups(prev => {
          const next = prev.map(g => g.id === docSnap.id ? updated : g);
          localStorage.setItem('g_split_joined_groups', JSON.stringify(next));
          return next;
        });
      }
      setGroupSyncing(false);
    }, (err) => {
      console.warn("Firestore sync failed, running in Offline/Cache mode:", err);
      setGroupSyncing(false);
    });
    return () => unsubscribe();
  }, [activeGroup?.id]);

  // Helper: Save state to Cloud + Local
  const saveUserSplitStateToCloud = async (groups, active) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        splitGroupsJoined: groups || [],
        splitGroupActive: active || null
      }, { merge: true });
    } catch (err) {
      console.warn("Cloud save user state warning:", err);
    }
  };

  const syncGroupData = async (updatedGroup) => {
    if (updatedGroup.members) {
      updatedGroup.members = Array.from(new Set(updatedGroup.members.map(m => m.toLowerCase())));
    }
    if (updatedGroup.expenses) {
      updatedGroup.expenses = updatedGroup.expenses.map(e => ({
        ...e,
        paidBy: e.paidBy ? e.paidBy.toLowerCase() : e.paidBy,
        splitWith: e.splitWith ? Array.from(new Set(e.splitWith.map(m => m.toLowerCase()))) : e.splitWith
      }));
    }
    setActiveGroup(updatedGroup);
    localStorage.setItem('g_split_active_group', JSON.stringify(updatedGroup));
    
    let nextJoined = [];
    setJoinedGroups(prev => {
      const exists = prev.some(g => g.id === updatedGroup.id);
      nextJoined = exists ? prev.map(g => g.id === updatedGroup.id ? updatedGroup : g) : [...prev, updatedGroup];
      localStorage.setItem('g_split_joined_groups', JSON.stringify(nextJoined));
      saveUserSplitStateToCloud(nextJoined, updatedGroup);
      return nextJoined;
    });

    try {
      const groupRef = doc(db, 'splitGroups', updatedGroup.id);
      await setDoc(groupRef, {
        name: updatedGroup.name,
        password: updatedGroup.password,
        members: updatedGroup.members || [],
        expenses: updatedGroup.expenses || [],
        createdAt: updatedGroup.createdAt || Date.now()
      });
    } catch (e) {
      console.warn("Cloud write failed, cached locally:", e);
    }
  };

  // Group Handlers
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    if (!createForm.name.trim() || !createForm.password.trim()) {
      setGroupError('Fill in all fields.');
      return;
    }

    const groupId = `${createForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    
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
    if (!joinForm.name.trim() || !joinForm.password.trim()) {
      setGroupError('Fill in all fields.');
      return;
    }

    const searchName = joinForm.name.trim();
    const searchPass = joinForm.password.trim();

    try {
      setGroupSyncing(true);
      let matchedGroup = null;

      // 1. Fetch group directly by matching Document ID (or lowercase equivalent)
      const groupRef = doc(db, 'splitGroups', searchName);
      let docSnap = await getDoc(groupRef);
      if (docSnap.exists()) {
        matchedGroup = { id: docSnap.id, ...docSnap.data() };
      }

      if (!matchedGroup && searchName.toLowerCase() !== searchName) {
        const lowerRef = doc(db, 'splitGroups', searchName.toLowerCase());
        let lowerDocSnap = await getDoc(lowerRef);
        if (lowerDocSnap.exists()) {
          matchedGroup = { id: lowerDocSnap.id, ...lowerDocSnap.data() };
        }
      }

      if (!matchedGroup) {
        setGroupError("Group ID not found. Verify casing or check the group exists.");
        setGroupSyncing(false);
        return;
      }

      if (matchedGroup.password !== searchPass) {
        setGroupError("Incorrect password.");
        setGroupSyncing(false);
        return;
      }

      // Add myself to members list if not already there
      const lowerMembers = (matchedGroup.members || []).map(m => m.toLowerCase());
      const updatedMembers = lowerMembers.includes(myName)
        ? (matchedGroup.members || [])
        : [...(matchedGroup.members || []), myName];

      const updatedGroup = { ...matchedGroup, members: updatedMembers };
      await syncGroupData(updatedGroup);

      setJoinForm({ name: '', password: '' });
      setShowJoinGroup(false);
    } catch (err) {
      console.error(err);
      setGroupError("Error connecting to Firebase.");
    } finally {
      setGroupSyncing(false);
    }
  };

  const handleLeaveOrDeleteGroup = async () => {
    const isOwner = activeGroup.members?.[0] === myName;
    const confirmMsg = isOwner 
      ? `Delete group "${activeGroup.name}"? This removes all split balances permanently for everyone.`
      : `Leave group "${activeGroup.name}"? Your profile will be removed.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setGroupSyncing(true);
      const groupId = activeGroup.id;
      const nextJoined = joinedGroups.filter(g => g.id !== groupId);
      
      setJoinedGroups(nextJoined);
      localStorage.setItem('g_split_joined_groups', JSON.stringify(nextJoined));
      setActiveGroup(null);
      localStorage.removeItem('g_split_active_group');
      
      await saveUserSplitStateToCloud(nextJoined, null);

      if (isOwner) {
        const groupRef = doc(db, 'splitGroups', groupId);
        await deleteDoc(groupRef);
      } else {
        const updatedMembers = activeGroup.members.filter(m => m !== myName);
        const groupRef = doc(db, 'splitGroups', groupId);
        await updateDoc(groupRef, { members: updatedMembers });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGroupSyncing(false);
    }
  };

  // Expense logging Handlers
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Please enter a valid description and amount.");
      return;
    }

    const payer = expenseForm.paidBy || myName;
    const participants = splitType === 'everyone' ? [...activeGroup.members] : [...expenseForm.splitWith];

    if (participants.length === 0) {
      alert("You must include at least one member to split with.");
      return;
    }

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
    setExpenseForm({ description: '', amount: '', paidBy: '', splitWith: [] });
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Remove this transaction?")) return;
    const updated = {
      ...activeGroup,
      expenses: (activeGroup.expenses || []).filter(e => e.id !== expenseId)
    };
    await syncGroupData(updated);
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

  // Google Pay P2P Ledger Calculator
  const getGroupLedger = () => {
    if (!activeGroup) return { netBalances: {}, simplifiedDebts: [], totalGroupSpent: 0 };
    
    const members = Array.from(new Set((activeGroup.members || []).map(m => m.toLowerCase())));
    const expenses = activeGroup.expenses || [];
    
    const netBalances = {};
    members.forEach(m => { netBalances[m] = 0; });
    
    let totalGroupSpent = 0;

    expenses.forEach(e => {
      const amt = Number(e.amount);
      const paidBy = (e.paidBy || '').toLowerCase();
      
      // Dynamic split fallback for 'split with everyone'
      const isEveryoneSplit = e.splitAll === true || (e.splitAll !== false && e.type !== 'settlement' && (!e.splitWith || e.splitWith.length >= 2));
      const splitWith = isEveryoneSplit ? [...members] : (e.splitWith || []).map(m => m.toLowerCase());
      
      if (splitWith.length === 0) return;
      const share = amt / splitWith.length;
      
      if (e.type !== 'settlement') {
        totalGroupSpent += amt;
      }

      splitWith.forEach(m => {
        if (netBalances[m] !== undefined) {
          netBalances[m] -= share;
        }
      });
      
      if (netBalances[paidBy] !== undefined) {
        netBalances[paidBy] += amt;
      }
    });

    const creditors = [];
    const debtors = [];
    Object.entries(netBalances).forEach(([member, bal]) => {
      if (bal > 0.05) creditors.push({ member, val: bal });
      else if (bal < -0.05) debtors.push({ member, val: Math.abs(bal) });
    });

    creditors.sort((a, b) => b.val - a.val);
    debtors.sort((a, b) => b.val - a.val);

    const simplifiedDebts = [];
    let cIdx = 0, dIdx = 0;

    const credCopy = creditors.map(c => ({ ...c }));
    const debtCopy = debtors.map(d => ({ ...d }));

    while (cIdx < credCopy.length && dIdx < debtCopy.length) {
      const cred = credCopy[cIdx];
      const debt = debtCopy[dIdx];
      
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

  // Owed Statistics specific to the logged-in current user
  const myOwedToMe = simplifiedDebts
    .filter(d => d.to === myName)
    .reduce((sum, d) => sum + d.amount, 0);
  const myOweToOthers = simplifiedDebts
    .filter(d => d.from === myName)
    .reduce((sum, d) => sum + d.amount, 0);

  // Pre-fill Add Expense fields
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

  // VIEW 1: LANDING PAGE (Create/Join Groups)
  if (!activeGroup) {
    return (
      <div className="reveal-fade-in" style={{ padding: '0 20px 40px', fontFamily: 'inherit' }}>
        
        {/* Flat Minimalist Header */}
        <div style={{
          padding: '24px 20px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <Users size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>Split Ledger</h2>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', marginInline: 'auto', maxWidth: '280px' }}>
            Instant Google Pay-style bill splitting with your gym buddies.
          </p>
        </div>

        {/* Action Toggle buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => { setShowCreateGroup(true); setShowJoinGroup(false); setGroupError(''); }}
            style={{
              flex: 1,
              padding: '16px',
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'transform 0.2s, opacity 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={16} />
            <span>Create Group</span>
          </button>
          
          <button 
            onClick={() => { setShowJoinGroup(true); setShowCreateGroup(false); setGroupError(''); }}
            style={{
              flex: 1,
              padding: '16px',
              background: 'var(--bg3)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'transform 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ArrowRight size={16} color="var(--accent)" />
            <span>Join Group</span>
          </button>
        </div>

        {/* Sub-Form: Create Group */}
        {showCreateGroup && (
          <div className="reveal-scale-in" style={{
            background: 'var(--bg3)',
            border: '1px solid rgba(200, 241, 53, 0.2)',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)', marginBottom: '14px', marginTop: 0 }}>Create a Split Group</h3>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Group Name (e.g. Iron Brotherhood)" 
                value={createForm.name} 
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })} 
                className="auth-input"
                style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}
                required
              />
              <input 
                type="password" 
                placeholder="Access Password (to share)" 
                value={createForm.password} 
                onChange={e => setCreateForm({ ...createForm, password: e.target.value })} 
                className="auth-input"
                style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}
                required
              />
              {groupError && <p style={{ fontSize: '11px', color: 'var(--red)', margin: 0 }}>{groupError}</p>}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  Create
                </button>
                <button type="button" onClick={() => setShowCreateGroup(false)} style={{ padding: '12px 16px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sub-Form: Join Group */}
        {showJoinGroup && (
          <div className="reveal-scale-in" style={{
            background: 'var(--bg3)',
            border: '1px solid rgba(77, 159, 255, 0.2)',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--blue)', marginBottom: '14px', marginTop: 0 }}>Join a Split Group</h3>
            <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Group ID (e.g. iron-brotherhood-1234)" 
                value={joinForm.name} 
                onChange={e => setJoinForm({ ...joinForm, name: e.target.value })} 
                className="auth-input"
                style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}
                required
              />
              <input 
                type="password" 
                placeholder="Group Password" 
                value={joinForm.password} 
                onChange={e => setJoinForm({ ...joinForm, password: e.target.value })} 
                className="auth-input"
                style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}
                required
              />
              {groupError && <p style={{ fontSize: '11px', color: 'var(--red)', margin: 0 }}>{groupError}</p>}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={groupSyncing} style={{ flex: 1, padding: '12px', background: 'var(--blue)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', opacity: groupSyncing ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {groupSyncing ? 'Connecting...' : 'Join Group'}
                </button>
                <button type="button" onClick={() => setShowJoinGroup(false)} style={{ padding: '12px 16px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sleek Minimalist Groups List */}
        <div style={{ marginTop: '8px' }}>
          <h4 style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Your Groups</h4>
          
          {joinedGroups.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg3)',
              borderRadius: '20px',
              padding: '30px 20px',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: '12px',
              border: '1px dashed var(--border2)'
            }}>
              <span>You aren't in any groups yet.</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>Create a group or ask friends for their ID to join.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {joinedGroups.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => {
                    setActiveGroup(g);
                    localStorage.setItem('g_split_active_group', JSON.stringify(g));
                    saveUserSplitStateToCloud(joinedGroups, g);
                  }}
                  style={{ 
                    background: 'var(--bg2)', 
                    border: '1px solid var(--border2)', 
                    borderRadius: '20px', 
                    padding: '16px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.015)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border2)';
                    e.currentTarget.style.background = 'var(--bg2)';
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>{g.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                      <span>👥 {g.members?.length || 0} members</span>
                      <span>💵 {g.expenses?.length || 0} splits</span>
                    </div>
                  </div>
                  
                  <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(200,241,53,0.08)', padding: '6px 12px', borderRadius: '12px', fontWeight: 800 }}>
                    Enter
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  // VIEW 2: ACTIVE GROUP DASHBOARD (Google Pay P2P Style)
  return (
    <div className="reveal-fade-in" style={{ padding: '0 20px 40px', fontFamily: 'inherit' }}>
      
      {/* 1. Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => {
            setActiveGroup(null);
            localStorage.removeItem('g_split_active_group');
            saveUserSplitStateToCloud(joinedGroups, null);
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'var(--bg3)', 
            border: '1px solid var(--border2)', 
            borderRadius: '12px', 
            padding: '6px 12px', 
            fontSize: '11px', 
            color: 'var(--text2)', 
            cursor: 'pointer',
            fontWeight: 700,
            fontFamily: 'inherit'
          }}
        >
          <ChevronLeft size={14} />
          <span>Groups</span>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text3)' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: groupSyncing ? 'var(--blue)' : 'var(--accent)',
            boxShadow: groupSyncing ? '0 0 8px var(--blue)' : '0 0 8px var(--accent)'
          }} />
          <span>{groupSyncing ? 'Syncing' : 'Live synced'}</span>
        </div>
      </div>

      {/* 2. Group info card */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: '24px',
        padding: '20px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent)" />
              <span>{activeGroup.name}</span>
            </h2>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', display: 'flex', gap: '8px' }}>
              <span>ID: <strong>{activeGroup.id}</strong></span>
              <span>•</span>
              <span>Pass: <strong>{activeGroup.password}</strong></span>
            </div>
          </div>
          
          <button
            onClick={handleLeaveOrDeleteGroup}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--red)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            {activeGroup.members?.[0] === myName ? 'Delete Group' : 'Leave Group'}
          </button>
        </div>

        {/* Identity Pill */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Logged in as</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={13} />
            <span>{myName} (You)</span>
          </span>
        </div>
      </div>

      {/* 3. Sleek Balance Sheet (Google Pay P2P Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          background: 'rgba(77, 159, 255, 0.04)',
          border: '1px solid rgba(77, 159, 255, 0.15)',
          borderRadius: '20px',
          padding: '16px 14px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>You are owed</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--blue)', marginTop: '4px' }}>₹{myOwedToMe.toLocaleString()}</div>
        </div>
        
        <div style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '20px',
          padding: '16px 14px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>You owe</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--red)', marginTop: '4px' }}>₹{myOweToOthers.toLocaleString()}</div>
        </div>
      </div>

      {/* 4. Google Pay P2P Debt Ledger ("Who owes whom") */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Balances Ledger
        </div>

        {simplifiedDebts.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(52,211,153,0.02)',
            borderRadius: '20px',
            padding: '24px 20px',
            textAlign: 'center',
            color: '#34D399',
            fontSize: '12px',
            border: '1px solid rgba(52,211,153,0.15)'
          }}>
            <CheckCircle2 size={18} />
            <span style={{ fontWeight: 800 }}>Everyone is fully settled up!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {simplifiedDebts.map((debt, index) => {
              const isIOWE = debt.from === myName;
              const isOWEDME = debt.to === myName;
              
              return (
                <div 
                  key={index} 
                  style={{ 
                    background: 'var(--bg3)', 
                    border: '1px solid var(--border2)', 
                    borderRadius: '16px', 
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                      {isIOWE ? (
                        <span>You owe <strong style={{ color: 'var(--red)' }}>{debt.to}</strong></span>
                      ) : isOWEDME ? (
                        <span><strong style={{ color: 'var(--accent)' }}>{debt.from}</strong> owes you</span>
                      ) : (
                        <span><strong>{debt.from}</strong> owes <strong>{debt.to}</strong></span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                      {isIOWE ? '🚨 Tap settle to pay them back' : isOWEDME ? '🎉 They will settle with you' : 'Other group split'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: isIOWE ? 'var(--red)' : isOWEDME ? 'var(--accent)' : '#fff' }}>
                      ₹{debt.amount.toLocaleString()}
                    </div>
                    
                    {isIOWE && (
                      <button 
                        onClick={() => {
                          if (window.confirm(`Settle ₹${debt.amount} to ${debt.to}? This adds a repayment record.`)) {
                            handleSettleUp(debt.from, debt.to, debt.amount);
                          }
                        }}
                        style={{
                          padding: '6px 14px',
                          background: 'var(--accent)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
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

      {/* 5. Primary Google Pay-Style Action buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setShowAddExpense(!showAddExpense)}
          style={{
            flex: 1,
            padding: '16px',
            background: showAddExpense ? 'var(--bg3)' : 'var(--accent)',
            color: showAddExpense ? 'var(--text)' : '#000',
            border: showAddExpense ? '1px solid var(--border2)' : 'none',
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={16} />
          <span>{showAddExpense ? 'Close' : 'Split an Expense'}</span>
        </button>

        <button 
          onClick={() => {
            const mName = prompt("Enter new friend's username:");
            if (mName && mName.trim()) {
              const trimmed = mName.trim().toLowerCase();
              const lowerMembers = (activeGroup.members || []).map(m => m.toLowerCase());
              if (lowerMembers.includes(trimmed)) {
                alert("This member is already in the group!");
              } else {
                syncGroupData({
                  ...activeGroup,
                  members: [...activeGroup.members, trimmed]
                });
              }
            }
          }}
          style={{
            padding: '16px 20px',
            background: 'var(--bg3)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            borderRadius: '16px',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'inherit'
          }}
        >
          <span>+ Friend</span>
        </button>
      </div>

      {/* 6. Centered Google Pay Expense form Panel */}
      {showAddExpense && (
        <div className="reveal-scale-in" style={{
          background: 'var(--bg3)',
          border: '1px solid rgba(200, 241, 53, 0.25)',
          borderRadius: '24px',
          padding: '24px 20px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent)', marginTop: 0, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} />
            <span>Split an Expense</span>
          </h3>
          
          <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Centered Large Amount Input */}
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px' }}>Amount to split</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)' }}>₹</span>
                <input 
                  type="number" 
                  placeholder="0"
                  value={expenseForm.amount} 
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '42px',
                    fontWeight: 900,
                    color: '#fff',
                    width: '180px',
                    textAlign: 'left',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 700 }}>Description</label>
              <input 
                type="text" 
                placeholder="What was this for? (e.g. Supplements, Rent)" 
                value={expenseForm.description} 
                onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} 
                className="auth-input"
                style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>

            {/* Split Type Selector */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 700 }}>Split Split Settings</label>
              <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '12px', padding: '3px', border: '1px solid var(--border2)', marginBottom: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setSplitType('everyone')}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '11px',
                    borderRadius: '9px',
                    border: 'none',
                    background: splitType === 'everyone' ? 'var(--accent)' : 'transparent',
                    color: splitType === 'everyone' ? '#000' : 'var(--text3)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  All Members
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setSplitType('custom');
                    setExpenseForm(prev => ({ ...prev, splitWith: [...activeGroup.members] }));
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '11px',
                    borderRadius: '9px',
                    border: 'none',
                    background: splitType === 'custom' ? 'var(--accent)' : 'transparent',
                    color: splitType === 'custom' ? '#000' : 'var(--text3)',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Custom
                </button>
              </div>

              {splitType === 'everyone' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: 'rgba(200,241,53,0.03)', borderRadius: '12px', border: '1px solid rgba(200,241,53,0.1)' }}>
                  <Info size={13} color="var(--accent)" />
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    Divided equally among all <strong>{activeGroup.members?.length}</strong> members (₹{expenseForm.amount ? Math.round(Number(expenseForm.amount) / activeGroup.members.length).toLocaleString() : '0'} each).
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeGroup.members?.map(m => {
                    const isIncluded = expenseForm.splitWith.includes(m);
                    return (
                      <div 
                        key={m}
                        onClick={() => {
                          const current = [...expenseForm.splitWith];
                          if (isIncluded) {
                            if (current.length > 1) {
                              setExpenseForm({ ...expenseForm, splitWith: current.filter(x => x !== m) });
                            } else {
                              alert("Must include at least 1 member.");
                            }
                          } else {
                            setExpenseForm({ ...expenseForm, splitWith: [...current, m] });
                          }
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: isIncluded ? 'rgba(52,211,153,0.03)' : 'rgba(255,255,255,0.01)',
                          border: `1px solid ${isIncluded ? 'rgba(52,211,153,0.2)' : 'var(--border2)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isIncluded ? '#fff' : 'var(--text3)' }}>
                          {m} {m === myName ? '(You)' : ''}
                        </span>
                        
                        <span style={{ 
                          fontSize: '9px', 
                          padding: '2px 8px', 
                          borderRadius: '8px', 
                          fontWeight: 800,
                          background: isIncluded ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)',
                          color: isIncluded ? '#34D399' : 'var(--red)',
                          textTransform: 'uppercase'
                        }}>
                          {isIncluded ? 'Included' : 'Excluded'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                Confirm split
              </button>
              <button type="button" onClick={() => setShowAddExpense(false)} style={{ padding: '12px 16px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Minimalist Group Activity History list */}
      <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <h4 style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Transaction History
        </h4>
        
        {(!activeGroup.expenses || activeGroup.expenses.length === 0) ? (
          <div style={{ background: 'var(--bg3)', borderRadius: '20px', padding: '24px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px', border: '1px dashed var(--border2)' }}>
            <span>No transactions recorded yet.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...activeGroup.expenses].reverse().map(e => {
              const isSettle = e.type === 'settlement';
              const splitNames = e.splitWith || [];
              const isEveryone = e.splitAll || (e.splitAll !== false && splitNames.length >= 2);
              
              return (
                <div 
                  key={e.id}
                  style={{ 
                    background: 'var(--bg3)', 
                    borderRadius: '16px', 
                    padding: '12px 14px', 
                    border: `1px solid ${isSettle ? 'rgba(52,211,153,0.08)' : 'var(--border2)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '10px', 
                      background: isSettle ? 'rgba(52,211,153,0.08)' : 'rgba(77,159,255,0.06)',
                      color: isSettle ? '#34D399' : 'var(--blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSettle ? <CheckCircle2 size={15} /> : <CreditCard size={15} />}
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{e.description}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', lineHeight: 1.4 }}>
                        Paid by <strong style={{ color: 'var(--text2)' }}>{e.paidBy === myName ? 'You' : e.paidBy}</strong> 
                        {!isSettle && ` • Split with ${isEveryone ? 'Everyone' : splitNames.join(', ')}`}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '1px' }}>{e.date} {e.time}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: isSettle ? '#34D399' : '#fff' }}>
                      {isSettle ? '' : ''}₹{e.amount.toLocaleString()}
                    </div>
                    <button 
                      onClick={() => handleDeleteExpense(e.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--red)', opacity: 0.4, cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={12} />
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
