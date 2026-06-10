import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function AppHeader({ 
  displayName, 
  dateStr, 
  isSyncing, 
  syncError, 
  lastSyncedTime, 
  onSync 
}) {
  return (
    <div className="header">
      <div className="header-left">
        <div className="greeting">Welcome back</div>
        <div className="title" style={{textTransform:'capitalize'}}>{displayName}</div>
      </div>
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          onClick={!isSyncing ? onSync : undefined}
          title={
            syncError 
              ? `Sync Error: ${syncError}. Click to retry sync.` 
              : isSyncing 
                ? 'Syncing data to Firebase...' 
                : lastSyncedTime 
                  ? `Synced at ${lastSyncedTime}. Click to sync now.` 
                  : 'Synced with cloud. Click to sync now.'
          }
          style={{
            background: 'var(--bg3)',
            border: `1px solid ${syncError ? 'rgba(255, 77, 77, 0.5)' : isSyncing ? 'rgba(77, 159, 255, 0.5)' : 'var(--border2)'}`,
            borderRadius: '20px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            color: syncError ? 'var(--red)' : isSyncing ? 'var(--blue)' : '#10B981',
            boxShadow: syncError ? '0 0 10px rgba(255, 77, 77, 0.15)' : 'none',
          }}
          className="sync-indicator-btn"
        >
          {isSyncing ? (
            <RefreshCw size={14} className="spinner" />
          ) : syncError ? (
            <CloudOff size={14} />
          ) : (
            <Cloud size={14} />
          )}
          
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 600, 
            color: syncError ? 'var(--red)' : isSyncing ? 'var(--text3)' : 'var(--text3)',
            userSelect: 'none'
          }}>
            {syncError ? 'Offline' : isSyncing ? 'Syncing...' : 'Synced'}
          </span>
        </div>

        <div className="date-chip">{dateStr}</div>
      </div>
    </div>
  );
}

