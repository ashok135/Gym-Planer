import React, { useState, useEffect, useRef } from 'react';
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
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN } from './data';
import { requestNotificationPermission, scheduleDailyReminders, registerServiceWorker } from './utils/pushNotifications';
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
  const [DIET_PLAN, setDIET_PLAN] = useState(DEFAULT_DIET_PLAN);
  const notifTimers = useRef([]);

  const [workoutPlans, setWorkoutPlans] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gworkoutPlans'));
      return saved || DEFAULT_PLAN;
    } catch(e) {
      return DEFAULT_PLAN;
    }
  });

  const [aiEnabled, setAiEnabled] = useState(() => localStorage.getItem('ai_enabled') === 'true');
  const [profileInfo, setProfileInfo] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gprofileInfo'));
      return {
        name: saved?.name || '',
        resume: saved?.resume || '',
        customLifeNotes: saved?.customLifeNotes || '',
        targetRoles: saved?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'],
        preferredLocations: saved?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'],
        workTypes: saved?.workTypes || ['Remote', 'Hybrid'],
        experienceLevel: saved?.experienceLevel || 'Fresher',
        dailyProteinTarget: Number(saved?.dailyProteinTarget || 100),
        dailyWaterTarget: Number(saved?.dailyWaterTarget || 4),
        dailySleepTarget: Number(saved?.dailySleepTarget || 8)
      };
    } catch(e) {
      return { 
        name: '', 
        resume: '', 
        customLifeNotes: '',
        targetRoles: ['React Developer', 'WordPress Developer', 'Frontend Developer'], 
        preferredLocations: ['Bangalore', 'Chennai', 'Remote'], 
        workTypes: ['Remote', 'Hybrid'],
        experienceLevel: 'Fresher',
        dailyProteinTarget: 100,
        dailyWaterTarget: 4,
        dailySleepTarget: 8
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
            if (data.dietPlan) setDIET_PLAN(data.dietPlan);

            if (data.workoutPlans) {
              setWorkoutPlans(data.workoutPlans);
              localStorage.setItem('gworkoutPlans', JSON.stringify(data.workoutPlans));
            }
            
            // Sync AI settings from Firebase to localStorage if they exist
            if (data.aiSettings) {
              localStorage.setItem('ai_enabled', data.aiSettings.enabled ? 'true' : 'false');
              localStorage.setItem('gemini_api_key', data.aiSettings.apiKey || '');
              localStorage.setItem('openrouter_api_key', data.aiSettings.openrouterKey || '');
              localStorage.setItem('ai_provider', data.aiSettings.provider || 'gemini');
              localStorage.setItem('ai_model', data.aiSettings.model || 'gemini-2.5-flash');
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
                customLifeNotes: data.profileInfo.customLifeNotes || '',
                targetRoles: data.profileInfo.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'],
                preferredLocations: data.profileInfo.preferredLocations || ['Bangalore', 'Chennai', 'Remote'],
                workTypes: data.profileInfo.workTypes || ['Remote', 'Hybrid'],
                experienceLevel: data.profileInfo.experienceLevel || 'Fresher',
                dailyProteinTarget: Number(data.profileInfo.dailyProteinTarget || 100),
                dailyWaterTarget: Number(data.profileInfo.dailyWaterTarget || 4),
                dailySleepTarget: Number(data.profileInfo.dailySleepTarget || 8)
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
          try { const dp = JSON.parse(localStorage.getItem('gdietPlan')); if(dp) setDIET_PLAN(dp); } catch(e) {}
          try {
            const savedPlans = JSON.parse(localStorage.getItem('gworkoutPlans'));
            if (savedPlans) setWorkoutPlans(savedPlans);
          } catch(e) {}
          try {
            const saved = JSON.parse(localStorage.getItem('gprofileInfo'));
            setProfileInfo({
              name: saved?.name || '',
              resume: saved?.resume || '',
              customLifeNotes: saved?.customLifeNotes || '',
              targetRoles: saved?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'],
              preferredLocations: saved?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'],
              workTypes: saved?.workTypes || ['Remote', 'Hybrid'],
              experienceLevel: saved?.experienceLevel || 'Fresher',
              dailyProteinTarget: Number(saved?.dailyProteinTarget || 100),
              dailyWaterTarget: Number(saved?.dailyWaterTarget || 4),
              dailySleepTarget: Number(saved?.dailySleepTarget || 8)
            });
          } catch(e) {}
        }
      }
      setLoading(false);
      // Setup push notifications after login
      if (u) {
        registerServiceWorker();
        requestNotificationPermission().then(granted => {
          if (granted) {
            notifTimers.current.forEach(clearTimeout);
            notifTimers.current = scheduleDailyReminders();
          }
        });
      }
    });
    return unsub;
  }, []);

  const getAiSettingsFromLocalStorage = () => {
    return {
      enabled: localStorage.getItem('ai_enabled') === 'true',
      apiKey: localStorage.getItem('gemini_api_key') || '',
      openrouterKey: localStorage.getItem('openrouter_api_key') || '',
      provider: localStorage.getItem('ai_provider') || 'gemini',
      model: localStorage.getItem('ai_model') || 'gemini-2.5-flash',
      openrouterModel: localStorage.getItem('openrouter_model') || 'openrouter/free',
      persona: localStorage.getItem('ai_persona') || 'Motivational Fitness Coach'
    };
  };

  const syncWorkoutPlans = async (newPlans) => {
    setWorkoutPlans(newPlans);
    localStorage.setItem('gworkoutPlans', JSON.stringify(newPlans));
    if(user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          workouts: DB, names: NAMES, meta: META, food: FOOD, schedule: SCHEDULE,
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: STUDY, studySettings: STUDY_SETTINGS,
          aiSettings: getAiSettingsFromLocalStorage(),
          profileInfo,
          workoutPlans: newPlans
        });
      } catch(e) { console.error("Cloud save failed", e); }
    }
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
          profileInfo,
          workoutPlans
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
          profileInfo,
          workoutPlans
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
          profileInfo,
          workoutPlans
        });
      } catch(e) { console.error("Cloud save failed", e); }
    }
  };

  const syncDietPlan = async (newPlan) => {
    setDIET_PLAN(newPlan);
    localStorage.setItem('gdietPlan', JSON.stringify(newPlan));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          workouts: DB, names: NAMES, meta: META, food: FOOD, schedule: SCHEDULE,
          budget: BUDGET, budgetSettings: BUDGET_SETTINGS, study: STUDY, studySettings: STUDY_SETTINGS,
          aiSettings: getAiSettingsFromLocalStorage(),
          profileInfo,
          workoutPlans,
          dietPlan: newPlan
        });
      } catch(e) { console.error('Cloud save for dietPlan failed', e); }
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
          profileInfo,
          workoutPlans
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
          profileInfo: newProfile,
          workoutPlans
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
        {activeTab === 'today'    && <Today    DB={DB} NAMES={NAMES} META={META} syncData={syncData} FOOD={FOOD} SCHEDULE={SCHEDULE} workoutPlans={workoutPlans} />}
        {activeTab === 'diet'     && <Diet     FOOD={FOOD} syncData={syncData} DB={DB} NAMES={NAMES} META={META} profileInfo={profileInfo} DIET_PLAN={DIET_PLAN} syncDietPlan={syncDietPlan} />}
        {activeTab === 'budget'   && <Budget   BUDGET={BUDGET} syncBudget={syncBudget} BUDGET_SETTINGS={BUDGET_SETTINGS} />}
        {activeTab === 'study'    && <Study    STUDY={STUDY} syncStudy={syncStudy} STUDY_SETTINGS={STUDY_SETTINGS} profileInfo={profileInfo} />}
        {activeTab === 'report'   && <Report   DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} SCHEDULE={SCHEDULE} BUDGET={BUDGET} BUDGET_SETTINGS={BUDGET_SETTINGS} syncBudget={syncBudget} STUDY={STUDY} STUDY_SETTINGS={STUDY_SETTINGS} syncStudy={syncStudy} workoutPlans={workoutPlans} />}
        {activeTab === 'settings' && <Settings NAMES={NAMES} syncData={syncData} DB={DB} META={META} FOOD={FOOD} handleLogout={handleLogout} SCHEDULE={SCHEDULE} BUDGET_SETTINGS={BUDGET_SETTINGS} syncBudget={syncBudget} STUDY_SETTINGS={STUDY_SETTINGS} syncStudy={syncStudy} BUDGET={BUDGET} STUDY={STUDY} syncAiSettings={syncAiSettings} profileInfo={profileInfo} syncProfileInfo={syncProfileInfo} workoutPlans={workoutPlans} syncWorkoutPlans={syncWorkoutPlans} />}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} showNav={showNav} />
      {aiEnabled && <AIChat DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} BUDGET={BUDGET} STUDY={STUDY} SCHEDULE={SCHEDULE} syncAiSettings={syncAiSettings} profileInfo={profileInfo} workoutPlans={workoutPlans} />}
    </div>
  );
}
