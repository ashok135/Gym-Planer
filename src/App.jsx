import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
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
    { id: 'dsa',       label: 'DSA',             emoji: '🧠', color: '#A78BFA' },
    { id: 'js',        label: 'JavaScript',      emoji: '⚡', color: '#FBBF24' },
    { id: 'react',     label: 'React',           emoji: '⚛️',  color: '#4D9FFF' },
    { id: 'interview', label: 'Interview Prep', emoji: '🤝', color: '#34D399' },
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
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  
  const [DB, setDB] = useState({});
  const [NAMES, setNAMES] = useState({});
  const [META, setMETA] = useState({});
  const [FOOD, setFOOD] = useState({});
  const [SCHEDULE, setSCHEDULE] = useState({ fullTime: {}, thisWeek: {} });
  const [BUDGET, setBUDGET] = useState({});
  const [BUDGET_SETTINGS, setBUDGET_SETTINGS] = useState(DEFAULT_BUDGET_SETTINGS);
  const [STUDY, setSTUDY] = useState({});
  const [STUDY_SETTINGS, setSTUDY_SETTINGS] = useState(DEFAULT_STUDY_SETTINGS);

  const [aiEnabled, setAiEnabled] = useState(() => localStorage.getItem('ai_enabled') === 'true');
  const [profileInfo, setProfileInfo] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gprofileInfo'));
      return {
        name: saved?.name || '',
        resume: saved?.resume || '',
        targetRoles: saved?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'],
        preferredLocations: saved?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'],
        workTypes: saved?.workTypes || ['Remote', 'Hybrid'],
        experienceLevel: saved?.experienceLevel || 'Fresher'
      };
    } catch(e) {
      return { 
        name: '', 
        resume: '', 
        targetRoles: ['React Developer', 'WordPress Developer', 'Frontend Developer'], 
        preferredLocations: ['Bangalore', 'Chennai', 'Remote'], 
        workTypes: ['Remote', 'Hybrid'],
        experienceLevel: 'Fresher'
      };
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      setAiEnabled(localStorage.getItem('ai_enabled') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
            
            // Sync AI settings from Firebase to localStorage if they exist
            if (data.aiSettings) {
              localStorage.setItem('ai_enabled', data.aiSettings.enabled ? 'true' : 'false');
              localStorage.setItem('gemini_api_key', data.aiSettings.apiKey || '');
              localStorage.setItem('openrouter_api_key', data.aiSettings.openrouterKey || '');
              localStorage.setItem('ai_provider', data.aiSettings.provider || 'gemini');
              localStorage.setItem('ai_model', data.aiSettings.model || 'gemini-1.5-flash');
              localStorage.setItem('openrouter_model', data.aiSettings.openrouterModel || 'openrouter/free');
              localStorage.setItem('ai_persona', data.aiSettings.persona || 'Motivational Fitness Coach');
              setAiEnabled(data.aiSettings.enabled);
              window.dispatchEvent(new Event('storage'));
            }
            
            // Sync Profile Info from Firebase if it exists
            if (data.profileInfo) {
              const info = {
                name: data.profileInfo.name || '',
                resume: data.profileInfo.resume || '',
                targetRoles: data.profileInfo.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'],
                preferredLocations: data.profileInfo.preferredLocations || ['Bangalore', 'Chennai', 'Remote'],
                workTypes: data.profileInfo.workTypes || ['Remote', 'Hybrid'],
                experienceLevel: data.profileInfo.experienceLevel || 'Fresher'
              };
              setProfileInfo(info);
              localStorage.setItem('gprofileInfo', JSON.stringify(info));
            }
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
          try {
            const saved = JSON.parse(localStorage.getItem('gprofileInfo'));
            setProfileInfo({
              name: saved?.name || '',
              resume: saved?.resume || '',
              targetRoles: saved?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'],
              preferredLocations: saved?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'],
              workTypes: saved?.workTypes || ['Remote', 'Hybrid'],
              experienceLevel: saved?.experienceLevel || 'Fresher'
            });
          } catch(e) {}
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const getAiSettingsFromLocalStorage = () => {
    return {
      enabled: localStorage.getItem('ai_enabled') === 'true',
      apiKey: localStorage.getItem('gemini_api_key') || '',
      openrouterKey: localStorage.getItem('openrouter_api_key') || '',
      provider: localStorage.getItem('ai_provider') || 'gemini',
      model: localStorage.getItem('ai_model') || 'gemini-1.5-flash',
      openrouterModel: localStorage.getItem('openrouter_model') || 'openrouter/free',
      persona: localStorage.getItem('ai_persona') || 'Motivational Fitness Coach'
    };
  };

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
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: STUDY, studySettings: STUDY_SETTINGS,
          aiSettings: getAiSettingsFromLocalStorage(),
          profileInfo
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
          budget: newBudget, budgetSettings: newSettings, study: STUDY, studySettings: STUDY_SETTINGS,
          aiSettings: getAiSettingsFromLocalStorage(),
          profileInfo
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
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: newStudy, studySettings: newSettings,
          aiSettings: getAiSettingsFromLocalStorage(),
          profileInfo
        });
      } catch(e) { console.error("Cloud save failed", e); }
    }
  };

  const syncAiSettings = async (newSettings) => {
    if (newSettings.enabled !== undefined) localStorage.setItem('ai_enabled', newSettings.enabled ? 'true' : 'false');
    if (newSettings.apiKey !== undefined) localStorage.setItem('gemini_api_key', newSettings.apiKey);
    if (newSettings.openrouterKey !== undefined) localStorage.setItem('openrouter_api_key', newSettings.openrouterKey);
    if (newSettings.provider !== undefined) localStorage.setItem('ai_provider', newSettings.provider);
    if (newSettings.model !== undefined) localStorage.setItem('ai_model', newSettings.model);
    if (newSettings.openrouterModel !== undefined) localStorage.setItem('openrouter_model', newSettings.openrouterModel);
    if (newSettings.persona !== undefined) localStorage.setItem('ai_persona', newSettings.persona);

    setAiEnabled(localStorage.getItem('ai_enabled') === 'true');
    window.dispatchEvent(new Event('storage'));

    if(user) {
      try {
        const mergedSettings = getAiSettingsFromLocalStorage();
        await setDoc(doc(db, "users", user.uid), {
          workouts: DB, names: NAMES, meta: META, food: FOOD, schedule: SCHEDULE,
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: STUDY, studySettings: STUDY_SETTINGS,
          aiSettings: mergedSettings,
          profileInfo
        });
      } catch(e) { console.error("Cloud save for AI settings failed", e); }
    }
  };

  const syncProfileInfo = async (newProfile) => {
    setProfileInfo(newProfile);
    localStorage.setItem('gprofileInfo', JSON.stringify(newProfile));
    if(user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          workouts: DB, names: NAMES, meta: META, food: FOOD, schedule: SCHEDULE,
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: STUDY, studySettings: STUDY_SETTINGS,
          aiSettings: getAiSettingsFromLocalStorage(),
          profileInfo: newProfile
        });
      } catch(e) { console.error("Cloud save for profile failed", e); }
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email-input')?.value;
    if (!email) { setResetError('Enter your email above first.'); return; }
    setResetError(''); setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch(err) {
      setResetError(err.message.replace('Firebase: ', ''));
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
      <div className="splash-bg">
        <div className="splash-ring">
          <div className="splash-core">
            {/* Beautiful Custom SVG Animated Barbell Logo */}
            <svg className="splash-icon" viewBox="0 0 24 24">
              <path d="M5 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm19-6a2 2 0 1 0-4 0 2 2 0 0 0 4 0zm0 6a2 2 0 1 0-4 0 2 2 0 0 0 4 0zm-18-5h1c.6 0 1-.4 1-1V8c0-.6-.4-1-1-1H6c-.6 0-1 .4-1 1v1c0 .6.4 1 1 1zm11 0h1c.6 0 1-.4 1-1V8c0-.6-.4-1-1-1h-1c-.6 0-1 .4-1 1v1c0 .6.4 1 1 1zM7 11h10v2H7zM5 14h2v-4H5zm12 0h2v-4h-2z" />
            </svg>
          </div>
        </div>
        <div className="splash-title">
          {"LIFETRAKER".split("").map((letter, index) => (
            <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
              {letter}
            </span>
          ))}
        </div>
        <div className="splash-tagline">Trust the Process</div>
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
            <input id="auth-email-input" type="email" name="email" className="auth-input" placeholder="Email address" required />
            <input type="password" name="password" className="auth-input" placeholder="Password" required />
            <button type="submit" className="auth-btn">{isLoginMode ? 'Login' : 'Sign Up'}</button>
          </form>
          {isLoginMode && (
            <div style={{textAlign:'center', marginTop:'10px'}}>
              <span
                onClick={handleReset}
                style={{fontSize:'12px', color:'var(--accent)', cursor:'pointer', textDecoration:'underline', fontWeight:600}}
              >
                Forgot Password?
              </span>
              {resetSent && <div style={{fontSize:'11px', color:'#34D399', marginTop:'6px'}}>✅ Reset email sent! Check your inbox.</div>}
              {resetError && <div style={{fontSize:'11px', color:'var(--red)', marginTop:'6px'}}>{resetError}</div>}
            </div>
          )}
          <div className="auth-error">{authError}</div>
          <div className="auth-toggle" onClick={() => { setIsLoginMode(!isLoginMode); setResetSent(false); setResetError(''); }}>
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
        {activeTab === 'study'    && <Study    STUDY={STUDY} syncStudy={syncStudy} STUDY_SETTINGS={STUDY_SETTINGS} profileInfo={profileInfo} />}
        {activeTab === 'report'   && <Report   DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} SCHEDULE={SCHEDULE} BUDGET={BUDGET} BUDGET_SETTINGS={BUDGET_SETTINGS} syncBudget={syncBudget} STUDY={STUDY} STUDY_SETTINGS={STUDY_SETTINGS} syncStudy={syncStudy} />}
        {activeTab === 'settings' && <Settings NAMES={NAMES} syncData={syncData} DB={DB} META={META} FOOD={FOOD} handleLogout={handleLogout} SCHEDULE={SCHEDULE} BUDGET_SETTINGS={BUDGET_SETTINGS} syncBudget={syncBudget} STUDY_SETTINGS={STUDY_SETTINGS} syncStudy={syncStudy} BUDGET={BUDGET} STUDY={STUDY} syncAiSettings={syncAiSettings} profileInfo={profileInfo} syncProfileInfo={syncProfileInfo} />}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} showNav={showNav} />
      {aiEnabled && <AIChat DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} BUDGET={BUDGET} STUDY={STUDY} SCHEDULE={SCHEDULE} syncAiSettings={syncAiSettings} profileInfo={profileInfo} />}
    </div>
  );
}
