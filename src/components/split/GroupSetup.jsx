import React from 'react';
import { Users, Plus, ArrowRight, X, CreditCard } from 'lucide-react';

export const GroupSetup = ({
  showCreateGroup, setShowCreateGroup,
  showJoinGroup, setShowJoinGroup,
  groupError, setGroupError,
  createForm, setCreateForm,
  joinForm, setJoinForm,
  groupSyncing,
  handleCreateGroup, handleJoinGroup,
  joinedGroups, setActiveGroup
}) => {
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
};
