import React, { useState } from 'react';
import { ClipboardList, Calculator, Apple } from 'lucide-react';
import { DAYS_FULL, MONTHS } from '../data';
import DietLog from './diet/DietLog';
import HealthCalc from './diet/HealthCalc';

const TABS = [
  { id: 'log',     label: "Today's Log",   icon: ClipboardList },
  { id: 'calc',    label: 'Calculators',   icon: Calculator },
];

export default function Diet({ FOOD, syncData, DB, NAMES, META, profileInfo, DIET_PLAN, syncProfileInfo }) {
  const [activeTab, setActiveTab] = useState('log');
  const today = new Date();
  const dow = today.getDay();

  return (
    <div style={{ padding: '0' }}>
      {/* Diet Hero Card Banner with beautiful fresh citrus flatlay background */}
      <div 
        className="scroll-reveal" 
        style={{
          margin: '0 20px 24px',
          padding: '24px 20px',
          borderRadius: 'var(--radius)',
          backgroundImage: 'linear-gradient(to right, rgba(18, 18, 20, 0.95) 45%, rgba(18, 18, 20, 0.45) 100%), url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {DAYS_FULL[dow]}, {today.getDate()}-{MONTHS[today.getMonth()].slice(0, 3)}
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Fuel Your Body</div>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Log nutrition, water intake, and recovery sleep.</div>
      </div>

      {/* Sub-Tab Switcher */}
      <div style={{ padding: '0 20px 0' }}>
        <div style={{
          display: 'flex', background: 'var(--bg3)', borderRadius: '16px',
          padding: '4px', border: '1px solid var(--border2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          {TABS.map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: '9px 6px', borderRadius: '12px', border: 'none',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#000' : 'var(--text2)',
                fontWeight: 700, fontSize: '11px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s ease-in-out', whiteSpace: 'nowrap'
              }}>
                <IconComponent size={14} style={{ color: isActive ? '#000' : 'var(--text2)' }} /> {tab.label}
              </button>
            );
          })}
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
        <HealthCalc 
          profileInfo={profileInfo}
          syncProfileInfo={syncProfileInfo}
        />
      )}
    </div>
  );
}
