import React from 'react';
import { Plus, MoreHorizontal, BarChart, UserCheck, Trash2, DollarSign, X } from 'lucide-react';

export const SplitActionModals = ({
  showAddExpense, setShowAddExpense,
  showMoreMenu, setShowMoreMenu,
  setShowReport,
  myName,
  activeGroup,
  syncGroupData,
  handleLeaveOrDeleteGroup,
  expenseForm, setExpenseForm,
  splitType, setSplitType,
  handleAddExpenseSubmit,
  splitCategories
}) => {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '8px', marginBottom: '24px', position: 'relative' }}>
        <button onClick={() => setShowAddExpense(true)}
          style={{ padding: '16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Plus size={20} /><span>Add Expense</span>
        </button>
        <button onClick={() => setShowMoreMenu(!showMoreMenu)}
          style={{ padding: '16px 0', background: showMoreMenu ? 'var(--bg2)' : 'var(--bg3)', color: showMoreMenu ? '#fff' : 'var(--text)', border: '1px solid var(--border2)', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MoreHorizontal size={24} />
        </button>

        {showMoreMenu && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMoreMenu(false)} />
            <div className="reveal-scale-in" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '280px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
              
              <button onClick={() => { setShowMoreMenu(false); setShowReport(true); }} 
                style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'center', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <BarChart size={20} color="var(--blue)"/>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>Analytics & Reports</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600 }}>Detailed breakdown</div>
                </div>
              </button>

              <button onClick={() => {
                  setShowMoreMenu(false);
                  const mName = prompt("Enter friend's unique lowercase username:");
                  if (mName && mName.trim()) {
                    const trimmed = (mName || '').trim().toLowerCase();
                    if (activeGroup.members.includes(trimmed)) alert("Member already exists!");
                    else syncGroupData({ ...activeGroup, members: [...activeGroup.members, trimmed] });
                  }
                }} 
                style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'center', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <UserCheck size={20} color="var(--accent)"/>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>Add a Friend</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600 }}>Invite user to group</div>
                </div>
              </button>

              <button onClick={() => { setShowMoreMenu(false); handleLeaveOrDeleteGroup(); }} 
                style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'center', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <Trash2 size={20} color="var(--red)"/>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--red)' }}>{activeGroup.members?.[0] === myName ? 'Delete Group' : 'Leave Group'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600 }}>This is permanent</div>
                </div>
              </button>

            </div>
          </>
        )}
      </div>

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
    </>
  );
};
