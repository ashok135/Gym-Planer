import React from 'react';

export default function AppHeader({ displayName, dateStr }) {
  return (
    <div className="header">
      <div className="header-left">
        <div className="greeting">Welcome back</div>
        <div className="title" style={{textTransform:'capitalize'}}>{displayName}</div>
      </div>
      <div className="header-right">
        <div className="date-chip">{dateStr}</div>
      </div>
    </div>
  );
}
