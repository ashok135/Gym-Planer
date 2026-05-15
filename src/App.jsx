import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import BottomNav from './components/BottomNav';
import Today from './components/Today';
import Diet from './components/Diet';
import Report from './components/Report';
import Settings from './components/Settings';
import Budget from './components/Budget';
import Study from './components/Study';
import AIChat from './components/AIChat';
import './index.css';

const DEFAULT_BUDGET_SETTINGS = { income: 22400, currency: '₹' };
const DEFAULT_STUDY_SETTINGS = {
  dailyTarget: 4,
  subjects: [
    { id: 'dsa',   label: 'DSA',        emoji: '🧠', color: '#A78BFA' },
    { id: 'js',    label: 'JavaScript',  emoji: '⚡', color: '#FBBF24' },
    { id: 'react', label: 'React',       emoji: '⚛️',  color: '#4D9FFF' },
  ]
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = React.useRef(0);
  
  const [activeTab, setActiveTab] = useState('today');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  
  const [DB, setDB] = useState({});
  const [NAMES, setNAMES] = useState({});
  const [META, setMETA] = useState({});
  const [FOOD, setFOOD] = useState({});
  const [SCHEDULE, setSCHEDULE] = useState({ fullTime: {}, thisWeek: {} });
  const [BUDGET, setBUDGET] = useState({});
  const [BUDGET_SETTINGS, setBUDGET_SETTINGS] = useState(DEFAULT_BUDGET_SETTINGS);
  const [STUDY, setSTUDY] = useState({});
  const [STUDY_SETTINGS, setSTUDY_SETTINGS] = useState(DEFAULT_STUDY_SETTINGS);

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
            setSCHEDULE(data.schedule || { fullTime: {}, thisWeek: {} });
            setBUDGET(data.budget || {});
            setBUDGET_SETTINGS(data.budgetSettings || DEFAULT_BUDGET_SETTINGS);
            setSTUDY(data.study || {});
            setSTUDY_SETTINGS(data.studySettings || DEFAULT_STUDY_SETTINGS);
          }
        } catch(e) {
          console.error("Cloud fetch failed, using local", e);
          setDB(JSON.parse(localStorage.getItem('gdb')||'{}'));
          setNAMES(JSON.parse(localStorage.getItem('gnames')||'{}'));
          setMETA(JSON.parse(localStorage.getItem('gmeta')||'{}'));
          setFOOD(JSON.parse(localStorage.getItem('gfood')||'{}'));
          setSCHEDULE(JSON.parse(localStorage.getItem('gschedule')||'{"fullTime":{},"thisWeek":{}}'));
          setBUDGET(JSON.parse(localStorage.getItem('gbudget')||'{}'));
          setBUDGET_SETTINGS(JSON.parse(localStorage.getItem('gbudgetSettings')||JSON.stringify(DEFAULT_BUDGET_SETTINGS)));
          setSTUDY(JSON.parse(localStorage.getItem('gstudy')||'{}'));
          setSTUDY_SETTINGS(JSON.parse(localStorage.getItem('gstudySettings')||JSON.stringify(DEFAULT_STUDY_SETTINGS)));
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const syncData = async (newDB, newNAMES, newMETA, newFOOD, newSCHEDULE = SCHEDULE) => {
    setDB(newDB); setNAMES(newNAMES); setMETA(newMETA); setFOOD(newFOOD); setSCHEDULE(newSCHEDULE);
    localStorage.setItem('gdb', JSON.stringify(newDB));
    localStorage.setItem('gnames', JSON.stringify(newNAMES));
    localStorage.setItem('gmeta', JSON.stringify(newMETA));
    localStorage.setItem('gfood', JSON.stringify(newFOOD));
    localStorage.setItem('gschedule', JSON.stringify(newSCHEDULE));
    if(user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          workouts: newDB, names: newNAMES, meta: newMETA, food: newFOOD, schedule: newSCHEDULE,
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: STUDY, studySettings: STUDY_SETTINGS
        });
      } catch(e) { console.error("Cloud save failed", e); }
    }
  };

  const syncBudget = async (newBudget, newSettings = BUDGET_SETTINGS) => {
    setBUDGET(newBudget); setBUDGET_SETTINGS(newSettings);
    localStorage.setItem('gbudget', JSON.stringify(newBudget));
    localStorage.setItem('gbudgetSettings', JSON.stringify(newSettings));
    if(user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          workouts: DB, names: NAMES, meta: META, food: FOOD, schedule: SCHEDULE,
          budget: newBudget, budgetSettings: newSettings, study: STUDY, studySettings: STUDY_SETTINGS
        });
      } catch(e) { console.error("Cloud save failed", e); }
    }
  };

  const syncStudy = async (newStudy, newSettings = STUDY_SETTINGS) => {
    setSTUDY(newStudy); setSTUDY_SETTINGS(newSettings);
    localStorage.setItem('gstudy', JSON.stringify(newStudy));
    localStorage.setItem('gstudySettings', JSON.stringify(newSettings));
    if(user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          workouts: DB, names: NAMES, meta: META, food: FOOD, schedule: SCHEDULE,
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: newStudy, studySettings: newSettings
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

  const handleLogout = async () => { await signOut(auth); };

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
  const dateStr = `${todayObj.getDate().toString().padStart(2, '0')}-${(todayObj.getMonth()+1).toString().padStart(2, '0')}-${todayObj.getFullYear()}`;

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) setShowNav(false);
    else if (currentScrollY < lastScrollY.current) setShowNav(true);
    lastScrollY.current = currentScrollY;
  };

  const displayName = user?.email ? user.email.split('@')[0] : 'Athlete';

  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <div className="greeting">Welcome back</div>
          <div className="title" style={{textTransform:'capitalize'}}>{displayName}</div>
        </div>
        <div className="header-right">
          <div className="date-chip">{dateStr}</div>
        </div>
      </div>
      <div className="screen active" onScroll={handleScroll} style={{paddingBottom:'90px', flex:1, overflowY:'auto'}}>
        {activeTab === 'today'    && <Today    DB={DB} NAMES={NAMES} META={META} syncData={syncData} FOOD={FOOD} SCHEDULE={SCHEDULE} />}
        {activeTab === 'diet'     && <Diet     FOOD={FOOD} syncData={syncData} DB={DB} NAMES={NAMES} META={META} />}
        {activeTab === 'budget'   && <Budget   BUDGET={BUDGET} syncBudget={syncBudget} BUDGET_SETTINGS={BUDGET_SETTINGS} />}
        {activeTab === 'study'    && <Study    STUDY={STUDY} syncStudy={syncStudy} STUDY_SETTINGS={STUDY_SETTINGS} />}
        {activeTab === 'report'   && <Report   DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} SCHEDULE={SCHEDULE} />}
        {activeTab === 'settings' && <Settings NAMES={NAMES} syncData={syncData} DB={DB} META={META} FOOD={FOOD} handleLogout={handleLogout} SCHEDULE={SCHEDULE} BUDGET_SETTINGS={BUDGET_SETTINGS} syncBudget={syncBudget} STUDY_SETTINGS={STUDY_SETTINGS} syncStudy={syncStudy} BUDGET={BUDGET} STUDY={STUDY} />}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} showNav={showNav} />
      <AIChat DB={DB} META={META} FOOD={FOOD} BUDGET={BUDGET} STUDY={STUDY} SCHEDULE={SCHEDULE} />
    </div>
  );
}
