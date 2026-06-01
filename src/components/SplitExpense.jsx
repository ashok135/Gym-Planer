import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Lock, 
  Plus, 
  Check, 
  PlusCircle, 
  Trash2, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Info,
  AlertTriangle
} from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function SplitExpense() {
  // Group split states
  const [activeGroup, setActiveGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('g_split_active_group');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [activeMember, setActiveMember] = useState(() => {
    return localStorage.getItem('g_split_active_member') || '';
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
  
  const [createForm, setCreateForm] = useState({ name: '', password: '', memberName: '' });
  const [joinForm, setJoinForm] = useState({ name: '', password: '', memberName: '' });
  
  const [showAddGroupExpense, setShowAddGroupExpense] = useState(false);
  const [splitType, setSplitType] = useState('everyone'); // 'everyone' or 'custom'
  const [groupExpenseForm, setGroupExpenseForm] = useState({ description: '', amount: '', paidBy: '', splitWith: [] });

  // Firestore Sync Effect
  useEffect(() => {
    if (!activeGroup?.id) return;
    setGroupSyncing(true);
    const groupRef = doc(db, 'splitGroups', activeGroup.id);
    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updated = { id: docSnap.id, ...data };
        setActiveGroup(updated);
        localStorage.setItem('g_split_active_group', JSON.stringify(updated));
        
        setJoinedGroups(prev => {
          const next = prev.map(g => g.id === docSnap.id ? updated : g);
          localStorage.setItem('g_split_joined_groups', JSON.stringify(next));
          return next;
        });
        
        // Auto set active simulated member if empty
        if (!activeMember && updated.members?.length > 0) {
          setActiveMember(updated.members[0]);
          localStorage.setItem('g_split_active_member', updated.members[0]);
        }
      }
      setGroupSyncing(false);
    }, (err) => {
      console.warn("Firestore access error - running in Offline/Demo mode:", err);
      setGroupSyncing(false);
    });
    
    return () => unsubscribe();
  }, [activeGroup?.id]);

  // Sync helper for Local + Firestore updates
  const syncGroupData = async (updatedGroup) => {
    setActiveGroup(updatedGroup);
    localStorage.setItem('g_split_active_group', JSON.stringify(updatedGroup));
    
    setJoinedGroups(prev => {
      const exists = prev.some(g => g.id === updatedGroup.id);
      const next = exists ? prev.map(g => g.id === updatedGroup.id ? updatedGroup : g) : [...prev, updatedGroup];
      localStorage.setItem('g_split_joined_groups', JSON.stringify(next));
      return next;
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
      console.warn("Firestore sync failed, saved locally", e);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    if (!createForm.name.trim() || !createForm.password.trim() || !createForm.memberName.trim()) {
      setGroupError('Fill in all fields.');
      return;
    }

    const groupId = `${createForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const myName = createForm.memberName.trim();
    
    const newGroup = {
      id: groupId,
      name: createForm.name.trim(),
      password: createForm.password.trim(),
      members: [myName],
      expenses: [],
      createdAt: Date.now()
    };

    setActiveMember(myName);
    localStorage.setItem('g_split_active_member', myName);
    
    await syncGroupData(newGroup);
    
    setCreateForm({ name: '', password: '', memberName: '' });
    setShowCreateGroup(false);
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    if (!joinForm.name.trim() || !joinForm.password.trim() || !joinForm.memberName.trim()) {
      setGroupError('Fill in all fields.');
      return;
    }

    const searchName = joinForm.name.trim();
    const searchPass = joinForm.password.trim();
    const myName = joinForm.memberName.trim();

    try {
      let matchedGroup = joinedGroups.find(g => g.name.toLowerCase() === searchName.toLowerCase() || g.id === searchName);
      
      if (!matchedGroup) {
        setGroupSyncing(true);
        const groupRef = doc(db, 'splitGroups', searchName);
        const docSnap = await getDoc(groupRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          matchedGroup = { id: docSnap.id, ...data };
        }
      }

      if (!matchedGroup) {
        setGroupError('Group not found. Try creating it first or check Group ID.');
        setGroupSyncing(false);
        return;
      }

      if (matchedGroup.password !== searchPass) {
        setGroupError('Incorrect Group Password.');
        setGroupSyncing(false);
        return;
      }

      const updatedMembers = matchedGroup.members.includes(myName)
        ? matchedGroup.members
        : [...matchedGroup.members, myName];

      const updatedGroup = { ...matchedGroup, members: updatedMembers };
      
      setActiveMember(myName);
      localStorage.setItem('g_split_active_member', myName);
      
      await syncGroupData(updatedGroup);

      setJoinForm({ name: '', password: '', memberName: '' });
      setShowJoinGroup(false);
    } catch (err) {
      console.error(err);
      setGroupError('Failed to join. Verify connection.');
    }
    setGroupSyncing(false);
  };

  const handleAddGroupExpense = async (e) => {
    e.preventDefault();
    if (!groupExpenseForm.description.trim() || !groupExpenseForm.amount || Number(groupExpenseForm.amount) <= 0) {
      alert("Enter a valid description and amount.");
      return;
    }

    // Determine target split participants based on active splitType
    const finalSplitWith = splitType === 'everyone'
      ? [...activeGroup.members]
      : [...groupExpenseForm.splitWith];

    if (finalSplitWith.length === 0) {
      alert("Select at least one member to split with (cannot split with 0 members).");
      return;
    }

    const newExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: groupExpenseForm.description.trim(),
      amount: Number(groupExpenseForm.amount),
      paidBy: groupExpenseForm.paidBy || activeMember || activeGroup.members[0],
      splitWith: finalSplitWith,
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
    setShowAddGroupExpense(false);
    setGroupExpenseForm({ description: '', amount: '', paidBy: '', splitWith: [] });
  };

  const handleDeleteGroupExpense = async (expenseId) => {
    if (!window.confirm("Delete this group transaction?")) return;
    const updated = {
      ...activeGroup,
      expenses: (activeGroup.expenses || []).filter(e => e.id !== expenseId)
    };
    await syncGroupData(updated);
  };

  const handleSettleUp = async (from, to, amount) => {
    const settlementExpense = {
      id: `settle-${Date.now()}`,
      description: `Settlement: ${from} paid ${to}`,
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

  const handleLeaveGroupDashboard = () => {
    setActiveGroup(null);
    localStorage.removeItem('g_split_active_group');
    setActiveMember('');
    localStorage.removeItem('g_split_active_member');
  };

  // GREEDY SPLITTING LEDGER CALCULATOR
  const getGroupLedger = () => {
    if (!activeGroup) return { netBalances: {}, simplifiedDebts: [], totalGroupSpent: 0 };
    
    const members = activeGroup.members || [];
    const expenses = activeGroup.expenses || [];
    
    const netBalances = {};
    members.forEach(m => { netBalances[m] = 0; });
    
    let totalGroupSpent = 0;

    expenses.forEach(e => {
      const amt = Number(e.amount);
      const paidBy = e.paidBy;
      const splitWith = e.splitWith || [];
      
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
  
  // Pre-fill form when add expense opens
  useEffect(() => {
    if (activeGroup && showAddGroupExpense) {
      setGroupExpenseForm({
        description: '',
        amount: '',
        paidBy: activeMember || activeGroup.members[0] || '',
        splitWith: [...activeGroup.members] // default split with everyone
      });
      setSplitType('everyone');
    }
  }, [showAddGroupExpense, activeGroup, activeMember]);

  if (!activeGroup) {
    return (
      <div className="reveal-fade-in" style={{ padding: '0 20px 40px' }}>
        
        <div 
          className="scroll-reveal reveal-active" 
          style={{
            padding: '24px 20px',
            borderRadius: 'var(--radius)',
            backgroundImage: 'linear-gradient(to right, rgba(18, 18, 20, 0.95) 45%, rgba(18, 18, 20, 0.45) 100%), url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            marginBottom: '24px'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            COLLABORATIVE SPLITTING
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Split Ledger</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Split gym fees, supplements, or dinners with friends in real-time.</div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => { setShowCreateGroup(true); setShowJoinGroup(false); setGroupError(''); }}
            style={{
              flex: 1,
              padding: '20px 14px',
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(200, 241, 53, 0.15)',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            <Users size={22} />
            <span>Create Split Group</span>
          </button>
          <button 
            onClick={() => { setShowJoinGroup(true); setShowCreateGroup(false); setGroupError(''); }}
            style={{
              flex: 1,
              padding: '20px 14px',
              background: 'var(--bg3)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            <Lock size={22} color="var(--blue)" />
            <span>Join Split Group</span>
          </button>
        </div>

        {showCreateGroup && (
          <div className="reveal-scale-in" style={{ background: 'var(--bg3)', border: '1px solid rgba(200, 241, 53, 0.25)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--accent)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} />
              <span>Launch New Group</span>
            </div>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Group Name (e.g. Iron Brotherhood)" 
                value={createForm.name} 
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })} 
                className="auth-input"
                style={{ margin: 0 }}
                required
              />
              <input 
                type="password" 
                placeholder="Set Access Password (to share)" 
                value={createForm.password} 
                onChange={e => setCreateForm({ ...createForm, password: e.target.value })} 
                className="auth-input"
                style={{ margin: 0 }}
                required
              />
              <input 
                type="text" 
                placeholder="Your Name (e.g. Ashok)" 
                value={createForm.memberName} 
                onChange={e => setCreateForm({ ...createForm, memberName: e.target.value })} 
                className="auth-input"
                style={{ margin: 0 }}
                required
              />
              {groupError && <div style={{ fontSize: '11px', color: 'var(--red)' }}>{groupError}</div>}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  Create Group
                </button>
                <button type="button" onClick={() => setShowCreateGroup(false)} style={{ padding: '12px 16px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showJoinGroup && (
          <div className="reveal-scale-in" style={{ background: 'var(--bg3)', border: '1px solid rgba(77,159,255,0.25)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--blue)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={16} />
              <span>Join Existing Group</span>
            </div>
            <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Group Name or Group ID" 
                value={joinForm.name} 
                onChange={e => setJoinForm({ ...joinForm, name: e.target.value })} 
                className="auth-input"
                style={{ margin: 0 }}
                required
              />
              <input 
                type="password" 
                placeholder="Group Password" 
                value={joinForm.password} 
                onChange={e => setJoinForm({ ...joinForm, password: e.target.value })} 
                className="auth-input"
                style={{ margin: 0 }}
                required
              />
              <input 
                type="text" 
                placeholder="Your Name (e.g. Rahul)" 
                value={joinForm.memberName} 
                onChange={e => setJoinForm({ ...joinForm, memberName: e.target.value })} 
                className="auth-input"
                style={{ margin: 0 }}
                required
              />
              {groupError && <div style={{ fontSize: '11px', color: 'var(--red)' }}>{groupError}</div>}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" disabled={groupSyncing} style={{ flex: 1, padding: '12px', background: 'var(--blue)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', opacity: groupSyncing ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {groupSyncing ? 'Searching...' : 'Join Group'}
                </button>
                <button type="button" onClick={() => setShowJoinGroup(false)} style={{ padding: '12px 16px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} color="var(--accent)" />
            <span>Your Split Groups</span>
          </div>
          
          {joinedGroups.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg3)', borderRadius: '16px', padding: '30px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px', border: '1px dashed var(--border2)' }}>
              <Sparkles size={20} color="var(--accent)" />
              <span>You have not joined any split groups yet.</span>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>Create a group or ask your gym buddies for their Group Name and Password to join.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {joinedGroups.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => {
                    setActiveGroup(g);
                    localStorage.setItem('g_split_active_group', JSON.stringify(g));
                    if (g.members?.length > 0) {
                      const m = localStorage.getItem('g_split_active_member') || g.members[0];
                      setActiveMember(m);
                      localStorage.setItem('g_split_active_member', m);
                    }
                  }}
                  style={{ 
                    background: 'var(--bg2)', 
                    border: '1px solid var(--border2)', 
                    borderRadius: '16px', 
                    padding: '16px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  className="job-card"
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{g.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                      <span>👥 {g.members?.length || 0} Members</span>
                      <span>💵 {g.expenses?.length || 0} Trx</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(200,241,53,0.1)', padding: '4px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      Enter Group
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  const activeMemberBalance = netBalances[activeMember] || 0;
  const activeMemberOwedAmount = simplifiedDebts
    .filter(d => d.to === activeMember)
    .reduce((sum, d) => sum + d.amount, 0);
  const activeMemberOwesAmount = simplifiedDebts
    .filter(d => d.from === activeMember)
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="reveal-fade-in" style={{ padding: '0 20px 40px' }}>
      
      {/* 1. Header controls */}
      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button 
          onClick={handleLeaveGroupDashboard}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: 'var(--bg3)', 
            border: '1px solid var(--border2)', 
            borderRadius: '10px', 
            padding: '6px 12px', 
            fontSize: '11px', 
            color: 'var(--text2)', 
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: 'inherit'
          }}
        >
          ← Back
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
          <span>{groupSyncing ? 'Syncing...' : 'Live Synced'}</span>
        </div>
      </div>

      {/* 2. Group info card */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '20px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--accent)" />
          <span>{activeGroup.name}</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Group ID: <strong style={{ color: 'var(--text2)' }}>{activeGroup.id}</strong> • Pass: <strong style={{ color: 'var(--text2)' }}>{activeGroup.password}</strong>
        </div>

        {/* Swapping Active simulated user selector */}
        <div style={{ 
          marginTop: '14px', 
          padding: '10px 12px', 
          background: 'var(--bg3)', 
          borderRadius: '12px', 
          border: '1px solid rgba(255,255,255,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase' }}>Acting Profile</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={13} />
              <span>{activeMember}</span>
            </div>
          </div>
          
          <select 
            value={activeMember} 
            onChange={(e) => {
              setActiveMember(e.target.value);
              localStorage.setItem('g_split_active_member', e.target.value);
            }}
            style={{ 
              background: 'var(--bg)', 
              border: '1px solid var(--border2)', 
              color: 'var(--text)', 
              fontSize: '11px', 
              padding: '6px 20px 6px 8px', 
              borderRadius: '8px', 
              outline: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {activeGroup.members?.map(m => (
              <option key={m} value={m}>Simulate: {m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 🚀 3. PRIMARY ACTION BUTTONS PLACED AT THE ABSOLUTE TOP */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button 
          onClick={() => setShowAddGroupExpense(!showAddGroupExpense)}
          style={{
            flex: 1,
            padding: '14px 10px',
            background: showAddGroupExpense ? 'var(--bg3)' : 'var(--accent)',
            color: showAddGroupExpense ? 'var(--text)' : '#000',
            border: showAddGroupExpense ? '1px solid var(--border2)' : 'none',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: showAddGroupExpense ? 'none' : '0 4px 15px rgba(200,241,53,0.2)',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
        >
          {showAddGroupExpense ? <Check size={16} /> : <PlusCircle size={16} />}
          <span>{showAddGroupExpense ? 'Close Form' : 'Add Group Expense'}</span>
        </button>

        <button 
          onClick={() => {
            const mName = prompt("Enter new member's name:");
            if (mName && mName.trim()) {
              const trimmed = mName.trim();
              if (activeGroup.members.includes(trimmed)) {
                alert("Member already exists!");
              } else {
                syncGroupData({
                  ...activeGroup,
                  members: [...activeGroup.members, trimmed]
                });
              }
            }
          }}
          style={{
            padding: '14px 16px',
            background: 'var(--bg3)',
            color: 'var(--text)',
            border: '1px solid var(--border2)',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'inherit'
          }}
        >
          <Users size={14} />
          <span>+ Member</span>
        </button>
      </div>

      {/* 🚀 4. ADD GROUP EXPENSE FORM (GORGEOUS DETAILED PANEL, NOW PRE-CHECKS EVERYTHING AND MAKES EXCLUSION CLEAR) */}
      {showAddGroupExpense && (
        <div className="reveal-scale-in" style={{ background: 'var(--bg3)', border: '1px solid rgba(200, 241, 53, 0.3)', borderRadius: '20px', padding: '20px', marginBottom: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--accent)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle size={18} />
            <span>New Group Split</span>
          </div>
          
          <form onSubmit={handleAddGroupExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Expense Details</label>
              <input 
                type="number" 
                placeholder="Amount (₹)" 
                value={groupExpenseForm.amount} 
                onChange={e => setGroupExpenseForm({ ...groupExpenseForm, amount: e.target.value })} 
                className="auth-input"
                style={{ margin: '0 0 10px', boxSizing: 'border-box' }}
                required
              />
              <input 
                type="text" 
                placeholder="Description (e.g. Whey supplements, gym rental)" 
                value={groupExpenseForm.description} 
                onChange={e => setGroupExpenseForm({ ...groupExpenseForm, description: e.target.value })} 
                className="auth-input"
                style={{ margin: 0, boxSizing: 'border-box' }}
                required
              />
            </div>
            
            {/* Split billing exclusions layout */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Split Settings</label>
              <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '10px', padding: '3px', border: '1px solid var(--border2)', marginBottom: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setSplitType('everyone')}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: splitType === 'everyone' ? 'var(--accent)' : 'transparent',
                    color: splitType === 'everyone' ? '#000' : 'var(--text3)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s'
                  }}
                >
                  Split with Everyone
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setSplitType('custom');
                    // Preselect everyone by default when switching to custom split so user only has to uncheck to exclude
                    setGroupExpenseForm(prev => ({ ...prev, splitWith: [...activeGroup.members] }));
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: splitType === 'custom' ? 'var(--accent)' : 'transparent',
                    color: splitType === 'custom' ? '#000' : 'var(--text3)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s'
                  }}
                >
                  Custom (Exclude Members)
                </button>
              </div>

              {splitType === 'everyone' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: 'rgba(200,241,53,0.05)', borderRadius: '10px', border: '1px solid rgba(200,241,53,0.15)' }}>
                  <Info size={13} color="var(--accent)" />
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    Splitting equally among **all {activeGroup.members?.length} members** (₹{groupExpenseForm.amount ? Math.round(Number(groupExpenseForm.amount) / activeGroup.members.length).toLocaleString() : '0'} each).
                  </span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px', fontStyle: 'italic' }}>
                    Tap any name to exclude them from this split:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeGroup.members?.map(m => {
                      const isIncluded = groupExpenseForm.splitWith.includes(m);
                      return (
                        <div 
                          key={m}
                          onClick={() => {
                            const current = [...groupExpenseForm.splitWith];
                            if (isIncluded) {
                              // If checked, remove to exclude
                              if (current.length > 1) {
                                setGroupExpenseForm({ ...groupExpenseForm, splitWith: current.filter(x => x !== m) });
                              } else {
                                alert("Cannot split with 0 members. Keep at least 1 member included.");
                              }
                            } else {
                              // If unchecked, add to include
                              setGroupExpenseForm({ ...groupExpenseForm, splitWith: [...current, m] });
                            }
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: isIncluded ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isIncluded ? 'rgba(52,211,153,0.2)' : 'var(--border2)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isIncluded ? 'var(--text)' : 'var(--text3)' }}>
                            {m} {m === activeMember ? '(You)' : ''}
                          </span>
                          
                          <span style={{ 
                            fontSize: '9px', 
                            padding: '2px 8px', 
                            borderRadius: '8px', 
                            fontWeight: 800,
                            background: isIncluded ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)',
                            color: isIncluded ? '#34D399' : 'var(--red)',
                            border: `1px solid ${isIncluded ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {isIncluded ? 'Included' : 'Excluded'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                Log split Expense
              </button>
              <button type="button" onClick={() => setShowAddGroupExpense(false)} style={{ padding: '12px 16px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Stat values */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', padding: '12px 10px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Pot</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>₹{totalGroupSpent.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', padding: '12px 10px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>You Owed</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>₹{activeMemberOwedAmount.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', padding: '12px 10px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>You Owe</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--red)' }}>₹{activeMemberOwesAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* 6. Simplified debts ledger ("Who owes whom") */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowRight size={15} color="var(--accent)" />
          <span>Group Debts Ledger</span>
          <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 'normal', marginLeft: 'auto' }}>
            Settlement Summary
          </span>
        </div>

        {simplifiedDebts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.02)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center', color: '#34D399', fontSize: '12px', border: '1px solid rgba(52,211,153,0.15)' }}>
            <CheckCircle2 size={22} />
            <span style={{ fontWeight: 700 }}>All settled up!</span>
            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>No outstanding payments left inside this group.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {simplifiedDebts.map((debt, index) => {
              const isMyDebt = debt.from === activeMember;
              const isOwedToMe = debt.to === activeMember;
              
              return (
                <div 
                  key={index} 
                  style={{ 
                    background: 'var(--bg2)', 
                    border: '1px solid var(--border2)', 
                    borderRadius: '14px', 
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>
                      <span style={{ fontWeight: 800, color: isMyDebt ? 'var(--red)' : 'var(--text)' }}>{debt.from}</span>
                      <span style={{ color: 'var(--text3)', margin: '0 6px' }}>owes</span>
                      <span style={{ fontWeight: 800, color: isOwedToMe ? 'var(--accent)' : 'var(--text)' }}>{debt.to}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                      {isMyDebt ? '🚨 Action required: pay back friend' : isOwedToMe ? '🎉 Friend will settle with you' : 'Other group liability'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: isMyDebt ? 'var(--red)' : isOwedToMe ? 'var(--accent)' : '#fff' }}>
                      ₹{debt.amount.toLocaleString()}
                    </div>
                    
                    {isMyDebt && (
                      <button 
                        onClick={() => {
                          if (window.confirm(`Simulate paying ₹${debt.amount} to ${debt.to} to settle this debt?`)) {
                            handleSettleUp(debt.from, debt.to, debt.amount);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--accent)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
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

      {/* 🚀 7. GROUP TRANSACTION HISTORY PLACED ABSOLUTELY AT THE BOTTOM */}
      <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CreditCard size={15} color="var(--blue)" />
          <span>Group Activity History</span>
        </div>
        
        {(!activeGroup.expenses || activeGroup.expenses.length === 0) ? (
          <div style={{ background: 'var(--bg3)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px', border: '1px dashed var(--border2)' }}>
            <span>No transactions logged yet. Log an expense above!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...activeGroup.expenses].reverse().map(e => {
              const isSettle = e.type === 'settlement';
              const splitNames = e.splitWith || [];
              
              return (
                <div 
                  key={e.id}
                  style={{ 
                    background: 'var(--bg3)', 
                    borderRadius: '12px', 
                    padding: '12px', 
                    border: `1px solid ${isSettle ? 'rgba(52,211,153,0.1)' : 'var(--border2)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: isSettle ? 'rgba(52,211,153,0.1)' : 'rgba(77,159,255,0.08)',
                      color: isSettle ? '#34D399' : 'var(--blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSettle ? <CheckCircle2 size={16} /> : <CreditCard size={16} />}
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{e.description}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', lineHeight: 1.4 }}>
                        Paid by <strong style={{ color: 'var(--text2)' }}>{e.paidBy}</strong> 
                        {!isSettle && ` • Split with ${splitNames.join(', ')}`}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '1px' }}>{e.date} {e.time}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: isSettle ? '#34D399' : '#fff' }}>
                      {isSettle ? '🤝 ' : ''}₹{e.amount.toLocaleString()}
                    </div>
                    <button 
                      onClick={() => handleDeleteGroupExpense(e.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--red)', opacity: 0.5, cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={13} />
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
