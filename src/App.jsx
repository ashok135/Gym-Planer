import React, { useState, useEffect } from 'react';
import './index.css';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Porting firebase logic...
    setTimeout(() => setLoading(false), 1500);
  }, []);

  if(loading) {
    return (
      <div className="screen active" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',animation:'pulse 1s infinite alternate'}}>
        <div style={{color:'var(--accent)',fontWeight:600,fontSize:'24px',letterSpacing:'1px'}}>💪 LIFETRAKER REACT</div>
      </div>
    );
  }

  return (
    <div style={{padding:'20px'}}>
      <h1>LifeTraker (React Edition)</h1>
      <p>This branch contains the ongoing React rewrite.</p>
    </div>
  );
}
