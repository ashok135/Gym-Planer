import React from 'react';
import { CategoryIcon } from './CategoryIcon';

export const CategorySpending = ({
  pieData,
  totalSpent,
  CATEGORIES
}) => {
  return (
    <div style={{ padding: '0 20px', marginBottom: '24px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Spending by Category</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pieData.sort((a,b) => b.value - a.value).map(d => {
          const pct = Math.round((d.value / (totalSpent || 1)) * 100); 
          const cat = CATEGORIES.find(c => c.label === d.name);
          return (
            <div key={d.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 500 }}>
                  <span style={{ color: d.color, display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon cat={cat} size={16} />
                  </span>
                  <div>{d.name}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: d.color }}>₹{d.value.toLocaleString()} <span style={{ color: 'var(--text3)', fontSize: '11px', fontWeight: 400 }}>({pct}%)</span></div>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: d.color, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
