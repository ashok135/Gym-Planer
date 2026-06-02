import React from 'react';
import { ChevronLeft, Users, UserCheck, Calendar as CalendarIcon } from 'lucide-react';

export const SplitDashboardHeader = ({
  activeGroup,
  setActiveGroup,
  groupSyncing,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  totalGroupSpent,
  myOwedToMe,
  myOweToOthers
}) => {
  return (
    <>
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
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={12} color="var(--accent)" />
              <span>{activeGroup.members?.length || 0} Members: <strong style={{ color: 'var(--text)' }}>{(activeGroup.members || []).join(', ')}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} color="var(--blue)"/> Ledger Month
        </h3>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '10px', fontWeight: 900, outline: 'none', cursor: 'pointer' }}>
          {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
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
    </>
  );
};
