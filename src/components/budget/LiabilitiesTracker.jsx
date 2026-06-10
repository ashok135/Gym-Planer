import React, { useState } from 'react';
import { CreditCard, Sparkles, Handshake, CheckCircle2, FileText, Coins, Trash2, ChevronDown, ChevronUp, HandCoins } from 'lucide-react';

export const LiabilitiesTracker = ({
  totalOutstandingDebt,
  allDebts,
  repayForm,
  setRepayForm,
  repayDebt,
  deleteDebt,
  allLends,
  totalLentOut,
  collectForm,
  setCollectForm,
  collectLend,
  deleteLend
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showLendHistory, setShowLendHistory] = useState(false);
  
  const activeDebts = allDebts.filter(d => d.status !== 'paid');
  const paidDebts = allDebts.filter(d => d.status === 'paid');

  const activeLends = (allLends || []).filter(l => l.status !== 'returned');
  const returnedLends = (allLends || []).filter(l => l.status === 'returned');

  const renderDebt = (d) => {
    const remainingAmount = d.amount - (d.paid || 0);
    const progress = Math.min(100, Math.round(((d.paid || 0) / d.amount) * 100));
    const isPaid = d.status === 'paid';
    
    return (
      <div key={d.id} className="scroll-reveal" style={{ background: isPaid ? 'rgba(52,211,153,0.02)' : 'var(--bg2)', borderRadius: '16px', padding: '16px', border: `1px solid ${isPaid ? 'rgba(52,211,153,0.15)' : 'var(--border2)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isPaid ? '0' : '8px' }}>
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
            {!isPaid && d.note && (
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

        {!isPaid && (
          <>
            <div style={{ margin: '12px 0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>
                <span>Paid: ₹{(d.paid || 0).toLocaleString()} ({progress}%)</span>
                <span>Target: ₹{d.amount.toLocaleString()}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--blue)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>

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
          </>
        )}
      </div>
    );
  };

  const renderLend = (l) => {
    const remaining = l.amount - (l.collected || 0);
    const progress = Math.min(100, Math.round(((l.collected || 0) / l.amount) * 100));
    const isReturned = l.status === 'returned';

    return (
      <div key={l.id} className="scroll-reveal" style={{ background: isReturned ? 'rgba(52,211,153,0.02)' : 'var(--bg2)', borderRadius: '16px', padding: '16px', border: `1px solid ${isReturned ? 'rgba(52,211,153,0.15)' : 'rgba(251,146,60,0.2)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isReturned ? '0' : '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: 'rgba(251,146,60,0.15)', color: '#FB923C', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HandCoins size={10} />
                <span>Lent Out</span>
              </span>
              {isReturned && (
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(52,211,153,0.15)', color: '#34D399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={10} />
                  <span>Returned</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginTop: '6px' }}>{l.person}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>Lent on {l.date}</div>
            {!isReturned && l.note && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: 'var(--text2)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', marginTop: '6px', borderLeft: '3px solid rgba(251,146,60,0.4)' }}>
                <FileText size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span><strong>Note:</strong> {l.note}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)' }}>₹{l.amount.toLocaleString()}</div>
            {!isReturned && <div style={{ fontSize: '11px', color: '#FB923C', fontWeight: 600 }}>Pending: ₹{remaining.toLocaleString()}</div>}
            {isReturned && <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Fully Returned</div>}
          </div>
        </div>

        {!isReturned && (
          <>
            <div style={{ margin: '12px 0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>
                <span>Returned: ₹{(l.collected || 0).toLocaleString()} ({progress}%)</span>
                <span>Total: ₹{l.amount.toLocaleString()}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#FB923C', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center' }}>
              {collectForm.lendId === l.id ? (
                <>
                  <input 
                    type="number" 
                    placeholder="Amount returned (₹)" 
                    value={collectForm.amount}
                    onChange={e => setCollectForm(f => ({ ...f, amount: e.target.value }))}
                    style={{ flex: 1, padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                  />
                  <button 
                    onClick={() => collectLend(l.id, collectForm.amount, l.mk)}
                    style={{ padding: '6px 14px', background: '#FB923C', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                  >
                    Collect
                  </button>
                  <button 
                    onClick={() => setCollectForm({ lendId: null, amount: '' })}
                    style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setCollectForm({ lendId: l.id, amount: String(remaining) })}
                    style={{ padding: '6px 12px', background: 'rgba(251,146,60,0.1)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Coins size={12} />
                    <span>They Returned?</span>
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Delete this lend entry?')) deleteLend(l.id, l.mk); }}
                    style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--red)', opacity: 0.5, cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '0 20px', marginBottom: '24px' }}>
      
      {/* ---- DEBTS I OWE ---- */}
      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <CreditCard size={16} color="var(--red)" />
        <span>Liabilities & Outstanding Dues</span>
        <span style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 'normal', marginLeft: 'auto' }}>
          Unpaid: ₹{totalOutstandingDebt.toLocaleString()}
        </span>
      </div>
      
      {allDebts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg3)', borderRadius: '16px', padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px', border: '1px dashed var(--border2)', marginBottom: '24px' }}>
          <Sparkles size={20} color="var(--accent)" />
          <span>No borrowed loans or credit card spend logged yet.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {activeDebts.length > 0 && activeDebts.map(renderDebt)}
          
          {paidDebts.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div 
                onClick={() => setShowHistory(!showHistory)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)', cursor: 'pointer', padding: '12px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border2)', transition: 'all 0.2s' }}
              >
                {showHistory ? 'Hide Repaid History' : `View Repaid History (${paidDebts.length})`}
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              
              {showHistory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {paidDebts.map(renderDebt)}
                </div>
              )}
            </div>
          )}
          
          {activeDebts.length === 0 && paidDebts.length > 0 && !showHistory && (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>
               <CheckCircle2 size={32} color="#34D399" style={{ opacity: 0.5 }} />
               <span>All your debts are fully repaid! Great job!</span>
             </div>
          )}
        </div>
      )}

      {/* ---- MONEY I LENT OUT ---- */}
      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <HandCoins size={16} color="#FB923C" />
        <span>Money I Lent Out</span>
        {totalLentOut > 0 && (
          <span style={{ fontSize: '11px', color: '#FB923C', fontWeight: 'normal', marginLeft: 'auto' }}>
            Pending: ₹{totalLentOut.toLocaleString()}
          </span>
        )}
      </div>

      {(allLends || []).length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg3)', borderRadius: '16px', padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px', border: '1px dashed var(--border2)' }}>
          <HandCoins size={20} color="var(--text3)" style={{ opacity: 0.5 }} />
          <span>No money lent yet. Use "Lend Money" to track who owes you.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeLends.length > 0 && activeLends.map(renderLend)}

          {returnedLends.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div 
                onClick={() => setShowLendHistory(!showLendHistory)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)', cursor: 'pointer', padding: '12px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border2)', transition: 'all 0.2s' }}
              >
                {showLendHistory ? 'Hide Returned History' : `View Returned (${returnedLends.length})`}
                {showLendHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {showLendHistory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {returnedLends.map(renderLend)}
                </div>
              )}
            </div>
          )}

          {activeLends.length === 0 && returnedLends.length > 0 && !showLendHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>
              <CheckCircle2 size={32} color="#34D399" style={{ opacity: 0.5 }} />
              <span>All lent money has been returned! 🎉</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
