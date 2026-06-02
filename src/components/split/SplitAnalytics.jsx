import React from 'react';
import { ChevronLeft, Trophy, TrendingUp, PieChart, Users } from 'lucide-react';

export const SplitAnalytics = ({
  setShowReport,
  selectedMonth, setSelectedMonth,
  availableMonths,
  totalGroupSpent,
  simplifiedDebts,
  categoryTotals,
  spenderTotals,
  getCategoryDetails
}) => {
  const topSpender = Object.entries(spenderTotals).sort((a,b)=>b[1]-a[1])[0] || null;

  return (
    <div className="reveal-slide-up" style={{ padding: '0 20px 40px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '10px' }}>
        <button onClick={() => setShowReport(false)} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '8px 14px', fontSize: '12px', color: 'var(--text2)', cursor: 'pointer', fontWeight: 800 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 900, color: '#fff' }}>Analytics</h2>
        <div style={{width: 70}}></div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)', margin: 0 }}>{selectedMonth}</h3>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '8px 12px', borderRadius: '12px', fontWeight: 800, outline: 'none' }}>
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{ background: 'linear-gradient(145deg, var(--bg2), var(--bg))', border: '1px solid var(--border2)', borderRadius: '24px', padding: '24px', marginBottom: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: '8px' }}>Total Spend for {selectedMonth}</div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: '#fff' }}>₹{totalGroupSpent.toLocaleString()}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
          {topSpender && (
            <div style={{ background: 'rgba(77, 159, 255, 0.05)', border: '1px solid rgba(77, 159, 255, 0.2)', borderRadius: '20px', padding: '20px' }}>
              <Trophy size={20} color="var(--blue)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800 }}>Top Spender</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{topSpender[0]}</div>
              <div style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 800, marginTop: '2px' }}>₹{topSpender[1].toLocaleString()}</div>
            </div>
          )}
          <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '20px', padding: '20px' }}>
            <TrendingUp size={20} color="#34D399" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800 }}>Total Debts</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{simplifiedDebts.length}</div>
            <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 800, marginTop: '2px' }}>Requires settling</div>
          </div>
        </div>

        <h4 style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={18} color="var(--accent)" /> Category Breakdown
        </h4>
        
        {Object.keys(categoryTotals).length === 0 ? (
           <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '12px', padding: '20px', background: 'var(--bg2)', borderRadius: '16px' }}>No category data found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg2)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border2)' }}>
            {Object.entries(categoryTotals).sort((a,b) => b[1]-a[1]).map(([catId, amt]) => {
              const c = getCategoryDetails(catId);
              const pct = Math.round((amt / totalGroupSpent) * 100);
              return (
                <div key={catId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 800 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}><span style={{ fontSize: '16px' }}>{c.emoji}</span> {c.label}</span>
                    <span style={{ color: 'var(--text2)' }}>₹{amt.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: '4px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <h4 style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 900, margin: '30px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--blue)" /> Who owes whom?
        </h4>
        {simplifiedDebts.length === 0 ? (
          <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>All settled up for {selectedMonth}!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {simplifiedDebts.map((debt, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--red)' }}>{debt.from}</strong> owes <strong style={{ color: 'var(--accent)' }}>{debt.to}</strong>
                </div>
                <strong style={{ color: '#fff' }}>₹{debt.amount.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
