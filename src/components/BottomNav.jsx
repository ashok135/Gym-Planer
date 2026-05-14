import React from 'react';
import { Dumbbell, Utensils, History as HistoryIcon, LineChart, Settings as SettingsIcon } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'today', label: 'Today', icon: Dumbbell },
    { id: 'diet', label: 'Diet', icon: Utensils },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'report', label: 'Report', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div id="bottom-nav" className="nav-container" style={{display: 'flex'}}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <div 
            key={tab.id} 
            className={`nav-btn ${isActive ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="nav-indicator"></div>
            <Icon className="nav-icon" size={24} style={{ color: isActive ? 'var(--bg)' : '#ffffff' }} />
            <div className="nav-label" style={{ color: isActive ? 'var(--bg)' : '#ffffff' }}>{tab.label}</div>
          </div>
        );
      })}
    </div>
  );
}
