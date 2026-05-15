import React from 'react';
import { Dumbbell, Utensils, LineChart, Settings as SettingsIcon, Wallet, BookOpen } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, showNav }) {
  const tabs = [
    { id: 'today',   label: 'Today',   icon: Dumbbell },
    { id: 'diet',    label: 'Diet',    icon: Utensils },
    { id: 'budget',  label: 'Budget',  icon: Wallet },
    { id: 'study',   label: 'Study',   icon: BookOpen },
    { id: 'report',  label: 'Report',  icon: LineChart },
    { id: 'settings',label: 'More',    icon: SettingsIcon },
  ];

  return (
    <div 
      id="bottom-nav" 
      className="nav" 
      style={{
        display: 'flex',
        transform: `translate(-50%, ${showNav ? '0' : '100%'})`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '0 4px',
      }}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <div 
            key={tab.id} 
            className={`nav-btn ${isActive ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, minWidth: 0 }}
          >
            <div className="nav-indicator"></div>
            <Icon className="nav-icon" size={20} style={{stroke: isActive ? 'var(--accent)' : '#ffffff'}} />
            <div className="nav-label" style={{color: isActive ? 'var(--accent)' : '#ffffff', fontSize: '9px'}}>{tab.label}</div>
          </div>
        );
      })}
    </div>
  );
}
