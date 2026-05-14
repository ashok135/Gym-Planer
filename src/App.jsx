import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import BottomNav from './components/BottomNav';
import Today from './components/Today';
import Diet from './components/Diet';
import History from './components/History';
import Report from './components/Report';
import Settings from './components/Settings';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('today');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  
  const [DB, setDB] = useState({});
  const [NAMES, setNAMES] = useState({});
  const [META, setMETA] = useState({});
  const [FOOD, setFOOD] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        try {
          const docSnap = await getDoc(doc(db, "users", u.uid));
          if(docSnap.exists()) {
            const data = docSnap.data();
            setDB(data.workouts || {});
            setNAMES(data.names || {});
            setMETA(data.meta || {});
            setFOOD(data.food || {});
          }
        } catch(e) {
          console.error("Cloud fetch failed, using local", e);
          setDB(JSON.parse(localStorage.getItem('gdb')||'{}'));
          setNAMES(JSON.parse(localStorage.getItem('gnames')||'{}'));
          setMETA(JSON.parse(localStorage.getItem('gmeta')||'{}'));
          setFOOD(JSON.parse(localStorage.getItem('gfood')||'{}'));
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const syncData = async (newDB, newNAMES, newMETA, newFOOD) => {
    setDB(newDB); setNAMES(newNAMES); setMETA(newMETA); setFOOD(newFOOD);
    localStorage.setItem('gdb', JSON.stringify(newDB));
    localStorage.setItem('gnames', JSON.stringify(newNAMES));
    localStorage.setItem('gmeta', JSON.stringify(newMETA));
    localStorage.setItem('gfood', JSON.stringify(newFOOD));
    
    if(user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          workouts: newDB, names: newNAMES, meta: newMETA, food: newFOOD
        });
      } catch(e) { console.error("Cloud save failed", e); }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const pass = e.target.password.value;
    setAuthError('');
    try {
      if(isLoginMode) await signInWithEmailAndPassword(auth, email, pass);
      else await createUserWithEmailAndPassword(auth, email, pass);
    } catch(err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if(loading) {
    return (
      <div className="screen active" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',animation:'pulse 1s infinite alternate'}}>
        <div style={{color:'var(--accent)',fontWeight:600,fontSize:'24px',letterSpacing:'1px'}}>💪 LIFETRAKER</div>
      </div>
    );
  }

  if(!user) {
    return (
      <div className="screen active">
        <div className="auth-box">
          <div style={{fontSize: '40px', marginBottom: '10px'}}>💪</div>
          <div className="auth-title">LifeTraker Pro</div>
          <div className="auth-sub">Cloud sync your workouts</div>
          <form onSubmit={handleAuth}>
            <input type="email" name="email" className="auth-input" placeholder="Email address" required />
            <input type="password" name="password" className="auth-input" placeholder="Password" required />
            <button type="submit" className="auth-btn">{isLoginMode ? 'Login' : 'Sign Up'}</button>
          </form>
          <div className="auth-error">{authError}</div>
          <div className="auth-toggle" onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? 'Need an account? Sign up' : 'Have an account? Login'}
          </div>
        </div>
      </div>
    );
  }

  const todayObj = new Date();
  const dateStr = `${todayObj.getDate().toString().padStart(2, '0')},${(todayObj.getMonth()+1).toString().padStart(2, '0')},${todayObj.getFullYear()}`;

  return (
    <div>
      <div className="header">
        <div className="header-left">
          <div className="greeting">Welcome back</div>
          <div className="title">LifeTraker</div>
        </div>
        <div className="header-right">
          <div className="date-chip">{dateStr}</div>
        </div>
      </div>
      <div className="screen active" style={{paddingBottom:'90px'}}>
        {activeTab === 'today' && <Today DB={DB} NAMES={NAMES} META={META} syncData={syncData} FOOD={FOOD} />}
        {activeTab === 'diet' && <Diet FOOD={FOOD} syncData={syncData} DB={DB} NAMES={NAMES} META={META} />}
        {activeTab === 'history' && <History DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} />}
        {activeTab === 'report' && <Report DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} />}
        {activeTab === 'settings' && <Settings NAMES={NAMES} syncData={syncData} DB={DB} META={META} FOOD={FOOD} handleLogout={handleLogout} />}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
