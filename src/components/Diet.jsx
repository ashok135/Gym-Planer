import React, { useState } from 'react';
import DietLog from './diet/DietLog';
import HealthCalc from './diet/HealthCalc';

const TABS = [
  { id: 'log',     label: "Today's Log",   icon: '📋' },
  { id: 'calc',    label: 'Calculators',   icon: '📊' },
];

export default function Diet({ FOOD, syncData, DB, NAMES, META, profileInfo, DIET_PLAN }) {
  const [activeTab, setActiveTab] = useState('log');

  return (
    <div style={{ padding: '0' }}>
      {/* Page Title */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          fontSize: '24px', fontWeight: 900,
          background: 'linear-gradient(90deg, #C8F135, #FB923C)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '2px'
        }}>
          🥗 Diet
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Track meals · Calculate macros</div>
      </div>

      {/* Sub-Tab Switcher */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', background: 'var(--bg3)', borderRadius: '16px',
          padding: '4px', border: '1px solid var(--border2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '9px 6px', borderRadius: '12px', border: 'none',
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? '#000' : 'var(--text2)',
              fontWeight: 700, fontSize: '11px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              transition: 'all 0.2s ease-in-out', whiteSpace: 'nowrap'
            }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'log' && (
        <DietLog
          FOOD={FOOD}
          syncData={syncData}
          DB={DB}
          NAMES={NAMES}
          META={META}
          profileInfo={profileInfo}
          DIET_PLAN={DIET_PLAN}
        />
      )}

      {activeTab === 'calc' && (
        <HealthCalc />
      )}
    </div>
  );
}
