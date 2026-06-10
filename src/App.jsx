import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import Auth from './components/layout/Auth';
import AppHeader from './components/layout/AppHeader';
import AppBackground from './components/layout/AppBackground';
import BottomNav from './components/layout/BottomNav';
import Today from './components/today';
import Diet from './components/diet';
import Report from './components/report';
import Settings from './components/settings';
import Budget from './components/budget';
import Study from './components/study';
import AIChat from './components/AIChat';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN, THEMES } from './data';
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

const sanitizeForFirestore = (val) => {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore).filter(v => v !== undefined);
  }
  if (typeof val === 'object') {
    const res = {};
    Object.keys(val).forEach(k => {
      const v = sanitizeForFirestore(val[k]);
      if (v !== undefined) {
        res[k] = v;
      }
    });
    return res;
  }
  return val;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('gm_active_theme') || 'cyber-lime';
  });

  useEffect(() => {
    const applyTheme = (themeId) => {
      const t = THEMES.find(item => item.id === themeId) || THEMES[0];
      const root = document.documentElement;
      Object.keys(t.colors).forEach(key => {
        root.style.setProperty(`--${key}`, t.colors[key]);
      });
    };
    applyTheme(activeTheme);
    localStorage.setItem('gm_active_theme', activeTheme);
  }, [activeTheme]);
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
  const [syncError, setSyncError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [splitCategories, setSplitCategories] = useState(null);
  const [moodEnergyConfig, setMoodEnergyConfig] = useState(null);
  const [statusResponses, setStatusResponses] = useState(null);
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



  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleStatusEvent = (e) => {
      const status = e.detail; // 'Completed', 'Partial', 'Skipped'
      let config = {
        Completed: "Super, Vera level! 💪 Today's workout is complete, you are absolutely crushing it!",
        Partial: "Paravala, half workout is better than no workout! 👍 Keep moving!",
        Skipped: "Enna ya achu? Somaari! Are you ashamed? 💀 Let's get back to it tomorrow!"
      };
      try {
        const saved = JSON.parse(localStorage.getItem('gstatus_responses_config'));
        if (saved) {
          config = { ...config, ...saved };
        }
      } catch (err) {
        console.error(err);
      }
      
      const message = config[status];
      if (message) {
        setToast({ message, status });
      }
    };

    window.addEventListener('workoutStatusChanged', handleStatusEvent);
    return () => window.removeEventListener('workoutStatusChanged', handleStatusEvent);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleStorage = () => {
      setAiEnabled(localStorage.getItem('ai_enabled') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Scroll Reveal Animation Observer with automatic MutationObserver!
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -10px 0px' });

    const observeNewElements = () => {
      const elements = document.querySelectorAll('.scroll-reveal:not(.reveal-active)');
      elements.forEach(el => {
        observer.observe(el);
        // Fallback for above-the-fold content: trigger immediately if in viewport
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
          el.classList.add('reveal-active');
        }
      });
    };

    // Run initially
    observeNewElements();

    // Watch for any sub-tab changes, modal opens or dynamic items mounting
    const mutationObserver = new MutationObserver(() => {
      observeNewElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let unsubSnapshot = null;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(u) {
        // Load offline cache immediately to bypass splash screen quickly
        try {
          const lDb = localStorage.getItem('gdb'); if (lDb) setDB(JSON.parse(lDb));
          const lNames = localStorage.getItem('gnames'); if (lNames) setNAMES(JSON.parse(lNames));
          const lMeta = localStorage.getItem('gmeta'); if (lMeta) setMETA(JSON.parse(lMeta));
          const lFood = localStorage.getItem('gfood'); if (lFood) setFOOD(JSON.parse(lFood));
          const lSched = localStorage.getItem('gschedule'); if (lSched) setSCHEDULE(JSON.parse(lSched));
          const lBudget = localStorage.getItem('gbudget'); if (lBudget) setBUDGET(JSON.parse(lBudget));
          const lBudgetSet = localStorage.getItem('gbudgetSettings'); if (lBudgetSet) setBUDGET_SETTINGS(JSON.parse(lBudgetSet));
          const lStudy = localStorage.getItem('gstudy'); if (lStudy) setSTUDY(JSON.parse(lStudy));
          const lStudySet = localStorage.getItem('gstudySettings'); if (lStudySet) setSTUDY_SETTINGS(JSON.parse(lStudySet));
          const lDiet = localStorage.getItem('gdietPlan'); if (lDiet) setDIET_PLAN(JSON.parse(lDiet));
          const lPlans = localStorage.getItem('gworkoutPlans'); if (lPlans) setWorkoutPlans(JSON.parse(lPlans));
          const lProfile = localStorage.getItem('gprofileInfo'); if (lProfile) setProfileInfo(JSON.parse(lProfile));
          const lSplitCats = localStorage.getItem('g_split_categories'); if (lSplitCats) setSplitCategories(JSON.parse(lSplitCats));
          const lMoodEnergy = localStorage.getItem('gmood_energy_config'); if (lMoodEnergy) setMoodEnergyConfig(JSON.parse(lMoodEnergy));
          const lStatusResponses = localStorage.getItem('gstatus_responses_config'); if (lStatusResponses) setStatusResponses(JSON.parse(lStatusResponses));
        } catch (e) {
          console.error("Local cache load failed", e);
        }

        if (unsubSnapshot) unsubSnapshot();
        unsubSnapshot = onSnapshot(doc(db, "users", u.uid), (docSnap) => {
          if(docSnap.exists()) {
            const data = docSnap.data();
            setDB(data.workouts || {});
            setNAMES(data.names || {});
            setMETA(data.meta || {});
            setFOOD(data.food || {});
            let loadedSched = data.schedule && data.schedule.fullTime ? data.schedule : { fullTime: {}, thisWeek: {} };
            if (loadedSched.fullTime && (loadedSched.fullTime[4] === 1 || loadedSched.fullTime[5] === 2 || loadedSched.fullTime[6] === 3)) {
              const updatedFullTime = { ...loadedSched.fullTime };
              if (updatedFullTime[4] === 1) updatedFullTime[4] = 4;
              if (updatedFullTime[5] === 2) updatedFullTime[5] = 5;
              if (updatedFullTime[6] === 3) updatedFullTime[6] = 6;
              loadedSched = { ...loadedSched, fullTime: updatedFullTime };
            }
            setSCHEDULE(loadedSched);
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

            if (data.splitCategories) {
              setSplitCategories(data.splitCategories);
              localStorage.setItem('g_split_categories', JSON.stringify(data.splitCategories));
              window.dispatchEvent(new Event('splitCategoriesUpdated'));
            }
            if (data.moodEnergyConfig) {
              setMoodEnergyConfig(data.moodEnergyConfig);
              localStorage.setItem('gmood_energy_config', JSON.stringify(data.moodEnergyConfig));
              window.dispatchEvent(new Event('moodEnergyConfigUpdated'));
            }
            if (data.statusResponses) {
              setStatusResponses(data.statusResponses);
              localStorage.setItem('gstatus_responses_config', JSON.stringify(data.statusResponses));
              window.dispatchEvent(new Event('statusResponsesUpdated'));
            }
            if (data.activeTheme) {
              setActiveTheme(data.activeTheme);
              localStorage.setItem('gm_active_theme', data.activeTheme);
            }

            // Sync database with localStorage cache
            localStorage.setItem('gdb', JSON.stringify(data.workouts || {}));
            localStorage.setItem('gnames', JSON.stringify(data.names || {}));
            localStorage.setItem('gmeta', JSON.stringify(data.meta || {}));
            localStorage.setItem('gfood', JSON.stringify(data.food || {}));
            localStorage.setItem('gschedule', JSON.stringify(loadedSched));
            localStorage.setItem('gbudget', JSON.stringify(data.budget || {}));
            localStorage.setItem('gbudgetSettings', JSON.stringify(data.budgetSettings || DEFAULT_BUDGET_SETTINGS));
            localStorage.setItem('gstudy', JSON.stringify(data.study || {}));
            localStorage.setItem('gstudySettings', JSON.stringify(data.studySettings || DEFAULT_STUDY_SETTINGS));
            localStorage.setItem('gdietPlan', JSON.stringify(data.dietPlan || DEFAULT_DIET_PLAN));
          } else {
            // Reset state if doc snap does not exist
            setDB({});
            setNAMES({});
            setMETA({});
            setFOOD({});
            setSCHEDULE({ fullTime: {}, thisWeek: {} });
            setBUDGET({});
            setBUDGET_SETTINGS(DEFAULT_BUDGET_SETTINGS);
            setSTUDY({});
            setSTUDY_SETTINGS(DEFAULT_STUDY_SETTINGS);
            setDIET_PLAN(DEFAULT_DIET_PLAN);
            setWorkoutPlans(DEFAULT_PLAN);
            setProfileInfo({
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
            });
            
            const keysToRemove = [
              'gdb', 'gnames', 'gmeta', 'gfood', 'gschedule', 'gbudget', 
              'gbudgetSettings', 'gstudy', 'gstudySettings', 'gdietPlan', 
              'gworkoutPlans', 'gprofileInfo', 'g_split_active_group', 
              'g_split_active_member', 'g_split_joined_groups',
              'g_split_categories', 'gmood_energy_config', 'gstatus_responses_config'
            ];
            keysToRemove.forEach(k => localStorage.removeItem(k));
          }
          setLoading(false);
        }, (error) => {
          console.error("Cloud subscription failed", error);
          setSyncError(error.message || String(error));
          setLoading(false);
        });
      } else {
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = null;
        }
        // User logged out, clean up states
        setDB({});
        setNAMES({});
        setMETA({});
        setFOOD({});
        setSCHEDULE({ fullTime: {}, thisWeek: {} });
        setBUDGET({});
        setBUDGET_SETTINGS(DEFAULT_BUDGET_SETTINGS);
        setSTUDY({});
        setSTUDY_SETTINGS(DEFAULT_STUDY_SETTINGS);
        setDIET_PLAN(DEFAULT_DIET_PLAN);
        setWorkoutPlans(DEFAULT_PLAN);
        setProfileInfo({
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
        });
        setLoading(false);
      }
      if (u && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    });

    return () => {
      unsub();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  useEffect(() => {
    console.log("DB_BUDGET_VALUE:", JSON.stringify(BUDGET));
    console.log("LOCAL_BUDGET_VALUE:", localStorage.getItem('gbudget'));
  }, [BUDGET]);

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

  const saveToFirestore = async (overrideFields = {}) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const defaultPayload = {
        workouts: DB,
        names: NAMES,
        meta: META,
        food: FOOD,
        schedule: SCHEDULE,
        budget: BUDGET,
        budgetSettings: BUDGET_SETTINGS,
        study: STUDY,
        studySettings: STUDY_SETTINGS,
        dietPlan: DIET_PLAN,
        aiSettings: getAiSettingsFromLocalStorage(),
        profileInfo,
        workoutPlans,
        splitCategories,
        moodEnergyConfig,
        statusResponses,
        activeTheme
      };
      const mergedPayload = { ...defaultPayload, ...overrideFields };
      const payload = sanitizeForFirestore(mergedPayload);
      await setDoc(doc(db, "users", user.uid), payload);
      setSyncError(null);
      setLastSyncedTime(new Date().toLocaleTimeString());
    } catch(e) {
      console.error("Cloud save failed", e);
      setSyncError(e.message || String(e));
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWorkoutPlans = async (newPlans) => {
    setWorkoutPlans(newPlans);
    localStorage.setItem('gworkoutPlans', JSON.stringify(newPlans));
    await saveToFirestore({ workoutPlans: newPlans });
  };

  const syncData = async (newDB, newNAMES, newMETA, newFOOD, newSCHEDULE = SCHEDULE) => {
    setDB(newDB); setNAMES(newNAMES); setMETA(newMETA); setFOOD(newFOOD); setSCHEDULE(newSCHEDULE);
    localStorage.setItem('gdb', JSON.stringify(newDB));
    localStorage.setItem('gnames', JSON.stringify(newNAMES));
    localStorage.setItem('gmeta', JSON.stringify(newMETA));
    localStorage.setItem('gfood', JSON.stringify(newFOOD));
    localStorage.setItem('gschedule', JSON.stringify(newSCHEDULE));
    await saveToFirestore({ workouts: newDB, names: newNAMES, meta: newMETA, food: newFOOD, schedule: newSCHEDULE });
  };

  const syncBudget = async (newBudget, newSettings = BUDGET_SETTINGS) => {
    setBUDGET(newBudget); setBUDGET_SETTINGS(newSettings);
    localStorage.setItem('gbudget', JSON.stringify(newBudget));
    localStorage.setItem('gbudgetSettings', JSON.stringify(newSettings));
    await saveToFirestore({ budget: newBudget, budgetSettings: newSettings });
  };

  const syncStudy = async (newStudy, newSettings = STUDY_SETTINGS) => {
    setSTUDY(newStudy); setSTUDY_SETTINGS(newSettings);
    localStorage.setItem('gstudy', JSON.stringify(newStudy));
    localStorage.setItem('gstudySettings', JSON.stringify(newSettings));
    await saveToFirestore({ study: newStudy, studySettings: newSettings });
  };

  const syncDietPlan = async (newPlan) => {
    setDIET_PLAN(newPlan);
    localStorage.setItem('gdietPlan', JSON.stringify(newPlan));
    await saveToFirestore({ dietPlan: newPlan });
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

    await saveToFirestore({ aiSettings: getAiSettingsFromLocalStorage() });
  };

  const syncProfileInfo = async (newProfile) => {
    setProfileInfo(newProfile);
    localStorage.setItem('gprofileInfo', JSON.stringify(newProfile));
    await saveToFirestore({ profileInfo: newProfile });
  };

  const syncSplitCategories = async (newCats) => {
    setSplitCategories(newCats);
    localStorage.setItem('g_split_categories', JSON.stringify(newCats));
    await saveToFirestore({ splitCategories: newCats });
  };

  const syncMoodEnergyConfig = async (newCfg) => {
    setMoodEnergyConfig(newCfg);
    localStorage.setItem('gmood_energy_config', JSON.stringify(newCfg));
    await saveToFirestore({ moodEnergyConfig: newCfg });
    window.dispatchEvent(new Event('moodEnergyConfigUpdated'));
  };

  const syncStatusResponses = async (newResp) => {
    setStatusResponses(newResp);
    localStorage.setItem('gstatus_responses_config', JSON.stringify(newResp));
    await saveToFirestore({ statusResponses: newResp });
    window.dispatchEvent(new Event('statusResponsesUpdated'));
  };

  const syncTheme = async (newTheme) => {
    setActiveTheme(newTheme);
    localStorage.setItem('gm_active_theme', newTheme);
    await saveToFirestore({ activeTheme: newTheme });
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

  const handleLogout = async () => {
    await signOut(auth);
    // Reset React state values to clean default values
    setDB({});
    setNAMES({});
    setMETA({});
    setFOOD({});
    setSCHEDULE({ fullTime: {}, thisWeek: {} });
    setBUDGET({});
    setBUDGET_SETTINGS(DEFAULT_BUDGET_SETTINGS);
    setSTUDY({});
    setSTUDY_SETTINGS(DEFAULT_STUDY_SETTINGS);
    setDIET_PLAN(DEFAULT_DIET_PLAN);
    setWorkoutPlans(DEFAULT_PLAN);
    setProfileInfo({
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
    });
    
    // Clear localStorage values to ensure no leakage between accounts
    const keysToRemove = [
      'gdb', 'gnames', 'gmeta', 'gfood', 'gschedule', 'gbudget', 
      'gbudgetSettings', 'gstudy', 'gstudySettings', 'gdietPlan', 
      'gworkoutPlans', 'gprofileInfo', 'g_split_active_group', 
      'g_split_active_member', 'g_split_joined_groups',
      'g_split_categories', 'gmood_energy_config', 'gstatus_responses_config'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  };

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
      <Auth 
        isLoginMode={isLoginMode} 
        setIsLoginMode={setIsLoginMode} 
        handleAuth={handleAuth} 
        handleReset={handleReset} 
        authError={authError} 
        resetSent={resetSent} 
        setResetSent={setResetSent} 
        resetError={resetError} 
        setResetError={setResetError} 
      />
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

  const tabBackgrounds = {
    today: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
    diet: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop',
    budget: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
    study: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop',
    report: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    settings: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'
  };

  const displayName = profileInfo?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'Athlete');

  return (
    <div className="app">
      <AppBackground activeTab={activeTab} />
      <AppHeader 
        displayName={displayName} 
        dateStr={dateStr} 
        isSyncing={isSyncing} 
        syncError={syncError} 
        lastSyncedTime={lastSyncedTime} 
        onSync={() => saveToFirestore()} 
      />
      <div className="screen active" onScroll={handleScroll} style={{paddingBottom:'90px', flex:1, overflowY:'auto'}}>
        {activeTab === 'today'    && <Today    DB={DB} NAMES={NAMES} META={META} syncData={syncData} FOOD={FOOD} SCHEDULE={SCHEDULE} workoutPlans={workoutPlans} />}
        {activeTab === 'diet'     && <Diet     FOOD={FOOD} syncData={syncData} DB={DB} NAMES={NAMES} META={META} profileInfo={profileInfo} DIET_PLAN={DIET_PLAN} syncDietPlan={syncDietPlan} syncProfileInfo={syncProfileInfo} />}
        {activeTab === 'budget'   && <Budget   BUDGET={BUDGET} syncBudget={syncBudget} BUDGET_SETTINGS={BUDGET_SETTINGS} profileInfo={profileInfo} />}
        {activeTab === 'study'    && <Study    STUDY={STUDY} syncStudy={syncStudy} STUDY_SETTINGS={STUDY_SETTINGS} profileInfo={profileInfo} />}
        {activeTab === 'report'   && <Report   DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} SCHEDULE={SCHEDULE} BUDGET={BUDGET} BUDGET_SETTINGS={BUDGET_SETTINGS} syncBudget={syncBudget} STUDY={STUDY} STUDY_SETTINGS={STUDY_SETTINGS} syncStudy={syncStudy} workoutPlans={workoutPlans} DIET_PLAN={DIET_PLAN} />}
        {activeTab === 'settings' && <Settings NAMES={NAMES} syncData={syncData} DB={DB} META={META} FOOD={FOOD} handleLogout={handleLogout} SCHEDULE={SCHEDULE} BUDGET_SETTINGS={BUDGET_SETTINGS} syncBudget={syncBudget} STUDY_SETTINGS={STUDY_SETTINGS} syncStudy={syncStudy} BUDGET={BUDGET} STUDY={STUDY} syncAiSettings={syncAiSettings} profileInfo={profileInfo} syncProfileInfo={syncProfileInfo} workoutPlans={workoutPlans} syncWorkoutPlans={syncWorkoutPlans} DIET_PLAN={DIET_PLAN} syncDietPlan={syncDietPlan} user={user} activeTheme={activeTheme} setActiveTheme={syncTheme} syncSplitCategories={syncSplitCategories} syncMoodEnergyConfig={syncMoodEnergyConfig} syncStatusResponses={syncStatusResponses} />}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} showNav={showNav} />
      {aiEnabled && <AIChat DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} BUDGET={BUDGET} STUDY={STUDY} SCHEDULE={SCHEDULE} syncAiSettings={syncAiSettings} profileInfo={profileInfo} workoutPlans={workoutPlans} />}
      {toast && (
        <div 
          className="lucy-snackbar"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${
              toast.status === 'Completed' ? '#10B981' : (toast.status === 'Partial' ? 'var(--accent)' : 'var(--red)')
            }`,
            borderRadius: '14px',
            padding: '14px 20px',
            color: 'var(--text)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.4), 0 0 15px rgba(255,255,255,0.02)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '90%',
            width: '360px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              color: toast.status === 'Completed' ? '#10B981' : (toast.status === 'Partial' ? 'var(--accent)' : 'var(--red)'), 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              marginBottom: '4px'
            }}>
              Coach Lucy Reacts
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', lineHeight: 1.4 }}>
              {toast.message}
            </div>
          </div>
          
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text3)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              marginLeft: '6px'
            }}
          >
            ✕
          </button>
        </div>
      )}
      <PWAInstallPrompt />
    </div>
  );
}
