import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, BookOpen, Clock, CheckCircle, ChevronLeft, ChevronRight, BarChart as BarChartIcon, Calendar, X, Sparkles } from 'lucide-react';
import { MONTHS, DAYS_SHORT } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, ReferenceLine } from 'recharts';

const DEFAULT_SUBJECTS = [
  { id: 'dsa',      label: 'DSA',             emoji: '🧠', color: '#A78BFA' },
  { id: 'js',       label: 'JavaScript',      emoji: '⚡', color: '#FBBF24' },
  { id: 'react',    label: 'React',           emoji: '⚛️',  color: '#4D9FFF' },
  { id: 'interview',label: 'Interview Prep', emoji: '🤝', color: '#34D399' },
];

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

const getJobSuggestions = (input) => {
  const clean = input.trim();
  if (!clean) {
    return [
      'React Developer', 'WordPress Developer', 'Frontend Developer', 
      'Fullstack Developer', 'Node.js Developer', 'Django Developer', 
      'UI/UX Designer', 'Mobile App Developer'
    ];
  }
  const lower = clean.toLowerCase();
  if (lower.startsWith('re') || lower.includes('react')) {
    return ['React Developer', 'React Engineer', 'React Frontend Developer', 'React Native Developer', 'React.js Specialist', 'Senior React Developer', 'Fullstack React Developer'];
  }
  if (lower.startsWith('wo') || lower.includes('word') || lower.includes('wp')) {
    return ['WordPress Developer', 'WordPress Plugin Developer', 'WordPress Theme Developer', 'WordPress Web Designer', 'WordPress Elementor Specialist', 'WordPress WooCommerce Developer', 'WordPress Theme Architect'];
  }
  if (lower.startsWith('fr') || lower.includes('front')) {
    return ['Frontend Developer', 'Frontend Engineer', 'Frontend React Developer', 'Frontend UI Developer', 'Senior Frontend Engineer'];
  }
  if (lower.startsWith('py') || lower.includes('python') || lower.includes('dj')) {
    return ['Python Developer', 'Django Developer', 'Python Django Engineer', 'Python Backend Developer', 'Python Data Scientist'];
  }
  if (lower.startsWith('no') || lower.includes('node')) {
    return ['Node.js Developer', 'Node.js Backend Developer', 'Fullstack Node.js Developer', 'Node.js Software Engineer'];
  }
  if (lower.startsWith('ph') || lower.includes('php') || lower.includes('lar')) {
    return ['PHP Developer', 'Laravel Developer', 'PHP Laravel Developer', 'Fullstack PHP Developer', 'Laravel Web Developer'];
  }
  if (lower.startsWith('ui') || lower.includes('ux') || lower.includes('des')) {
    return ['UI/UX Designer', 'User Interface Designer', 'User Experience Designer', 'Web Designer', 'Product Designer'];
  }
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return [
    `${capitalized} Developer`,
    `${capitalized} Engineer`,
    `Senior ${capitalized} Developer`,
    `Junior ${capitalized} Developer`,
    `${capitalized} Consultant`,
    `Fullstack ${capitalized} Developer`,
    `${capitalized} Technical Specialist`
  ];
};

const getCitySuggestions = (input) => {
  const clean = input.trim();
  if (!clean) {
    return ['Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Noida', 'Remote'];
  }
  const lower = clean.toLowerCase();
  const list = ['Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Noida', 'Gurgaon', 'Kolkata', 'San Francisco', 'New York', 'London', 'Remote'];
  return list.filter(item => item.toLowerCase().includes(lower));
};

export default function Study({ STUDY, syncStudy, STUDY_SETTINGS, isReport, activeRange: propRange, profileInfo = { name: '', resume: '', targetRoles: ['React Developer', 'WordPress Developer', 'Frontend Developer'], preferredLocations: ['Bangalore', 'Chennai', 'Remote'], workTypes: ['Remote', 'Hybrid'] } }) {
  const now = new Date();
  const todayKey = dateKey(now);

  const subjects = STUDY_SETTINGS?.subjects?.length ? STUDY_SETTINGS.subjects : DEFAULT_SUBJECTS;
  const dailyTarget = STUDY_SETTINGS?.dailyTarget || 4;

  const todayData = STUDY[todayKey] || {};
  const [activeRange, setActiveRange] = useState(propRange || 'Weekly');
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now));
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // AI Study Companion States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState(null);

  // Live Job Matches States
  const [jobs, setJobs] = useState([]);
  const [jobToast, setJobToast] = useState(null);

  const selectedRoles = profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'];
  const preferredLocs = profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'];
  const workModes = profileInfo?.workTypes || ['Remote', 'Hybrid'];

  const [activeSearchRole, setActiveSearchRole] = useState(selectedRoles[0] || 'React Developer');
  const [activeSearchLoc, setActiveSearchLoc] = useState(preferredLocs[0] || 'Remote');
  const [activeSearchMode, setActiveSearchMode] = useState(workModes[0] || 'Remote');
  const [activeSearchExp, setActiveSearchExp] = useState(profileInfo?.experienceLevel || 'Fresher');
  const [customSearchRole, setCustomSearchRole] = useState('');
  const [customSearchLoc, setCustomSearchLoc] = useState('');
  const [roleFocused, setRoleFocused] = useState(false);
  const [locFocused, setLocFocused] = useState(false);

  const generateSimulatedJobs = () => {
    const companies = ['Google', 'Meta', 'Stripe', 'Netflix', 'Airbnb', 'Automattic', 'WP Engine', 'Supabase', 'Vercel', 'Figma', 'Spotify', 'Uber'];
    const colors = ['#A78BFA', '#34D399', '#4D9FFF', '#FB923C', '#F472B6'];
    
    return selectedRoles.map((role, idx) => {
      const company = companies[Math.floor((idx * 7 + 3) % companies.length)];
      const color = colors[idx % colors.length];
      const location = preferredLocs[Math.floor((idx * 3 + 1) % preferredLocs.length)];
      const mode = workModes[Math.floor((idx * 2 + 5) % workModes.length)];
      const cleanRole = role.replace(/Developer/i, '').replace(/Engineer/i, '').trim();

      const searchLoc = location === 'Remote' ? '' : location;
      const searchMode = mode === 'Remote' ? 'Remote' : mode === 'Hybrid' ? 'Hybrid' : '';

      return {
        id: idx + 1,
        company,
        title: `${role} (${mode})`,
        type: cleanRole,
        ago: `${(idx + 1) * 7} mins ago`,
        color,
        link: `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(role + ' ' + mode)}&location=${encodeURIComponent(searchLoc || 'Remote')}`
      };
    });
  };

  useEffect(() => {
    setJobs(generateSimulatedJobs().slice(0, 3));
    if (selectedRoles.length > 0) setActiveSearchRole(selectedRoles[0]);
    if (preferredLocs.length > 0) setActiveSearchLoc(preferredLocs[0]);
    if (workModes.length > 0) setActiveSearchMode(workModes[0]);
    setActiveSearchExp(profileInfo?.experienceLevel || 'Fresher');
  }, [profileInfo]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const pool = generateSimulatedJobs();
      if (pool.length === 0) return;
      const randomJob = pool[Math.floor(Math.random() * pool.length)];
      const newJob = {
        ...randomJob,
        id: Date.now(),
        ago: 'Just now'
      };

      setJobs(prev => [newJob, ...prev.slice(0, 3)]);
      setJobToast(newJob);
      setTimeout(() => setJobToast(null), 5000);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`💼 Job Match: ${newJob.title}`, {
            body: `New opening at ${newJob.company} matches your target roles and modes!`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3256/3256093.png'
          });
        } catch(err) { console.error("Web Push failed", err); }
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [profileInfo]);

  const generateQuiz = async () => {
    setAiLoading(true);
    setAiContent(null);
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-1.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');
      
      if (!apiKey) throw new Error('No API Key');

      let profileText = '';
      try {
        const prof = JSON.parse(localStorage.getItem('gprofileInfo'));
        if (prof) profileText = `for a student named ${prof.name || 'User'} who has resume: ${prof.resume || ''}`;
      } catch(e) {}

      const prompt = `Generate a single challenging multiple choice quiz question about advanced JavaScript or React ${profileText}. 
Return the output strictly in the following JSON format:
{
  "question": "The question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option A", 
  "explanation": "Detailed explanation of why this answer is correct..."
}`;

      let resultText = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await res.json();
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      }

      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setAiContent({
        type: 'quiz',
        question: parsed.question,
        options: parsed.options,
        answer: parsed.answer,
        explanation: parsed.explanation,
        selectedOption: null,
        showExplanation: false
      });
    } catch(e) {
      console.error(e);
      setAiContent({
        type: 'error',
        text: '⚠️ Make sure you have configured a valid API Key in the AI Coach settings first!'
      });
    }
    setAiLoading(false);
  };

  const generateTip = async () => {
    setAiLoading(true);
    setAiContent(null);
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-1.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');

      if (!apiKey) throw new Error('No API Key');

      let profileText = '';
      try {
        const prof = JSON.parse(localStorage.getItem('gprofileInfo'));
        if (prof) profileText = `Customize it for a candidate named ${prof.name || 'User'} with resume details: ${prof.resume || ''}`;
      } catch(e) {}

      const prompt = `Give a single highly practical and unique interview preparation tip for JavaScript or React developers. ${profileText} Keep it encouraging and direct. Speak as a premium career mentor. Try to make it feel fresh and highly actionable. Max 4 sentences.`;

      let resultText = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await res.json();
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      }

      setAiContent({
        type: 'tip',
        text: resultText.trim()
      });
    } catch(e) {
      console.error(e);
      setAiContent({
        type: 'error',
        text: '⚠️ Make sure you have configured a valid API Key in the AI Coach settings first!'
      });
    }
    setAiLoading(false);
  };
  
  useEffect(() => {
    if (propRange) setActiveRange(propRange);
  }, [propRange]);

  const changeMonth = (offset) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    setSelectedMonth(monthKey(d));
  };
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ subjectId: subjects[0]?.id || 'dsa', hours: '1', learned: '' });
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const [modalDay, setModalDay] = useState(null);
  const [limit, setLimit] = useState(20);

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Range-based stats for Dashboard
  const getRangeStats = (range) => {
    let hrs = 0, count = 0;
    Object.entries(STUDY).forEach(([dk, dayData]) => {
      const d = new Date(dk);
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      const mk = monthKey(d);
      const [selY, selM] = selectedMonth.split('-').map(Number);
      
      if (range === 'Today' && dk !== todayKey) return;
      if (range === 'Weekly' && diff > 7) return;
      if (range === 'Monthly' && mk !== selectedMonth) return;
      if (range === 'Yearly' && d.getFullYear() !== selY) return;
      
      const sessions = dayData.sessions || [];
      hrs += sessions.reduce((s, e) => s + Number(e.hours), 0);
      count += sessions.length;
    });
    return { hrs, count };
  };

  const stats = getRangeStats(activeRange);
  const rangeHours = stats.hrs;
  const rangeSessions = stats.count;
  
  const targetHrs = activeRange === 'Today' ? dailyTarget : (activeRange === 'Weekly' ? dailyTarget * 7 : (activeRange === 'Monthly' ? dailyTarget * 30 : dailyTarget * 365));
  const progressPct = Math.min(100, Math.round((rangeHours / targetHrs) * 100));


  const subjectHours = {};
  subjects.forEach(s => { subjectHours[s.id] = 0; });
  
  Object.entries(STUDY).forEach(([dk, dayData]) => {
    const d = new Date(dk);
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    const mk = monthKey(d);
    
    let include = false;
    if (activeRange === 'Today' && dk === todayKey) include = true;
    if (activeRange === 'Weekly' && diff <= 7) include = true;
    if (activeRange === 'Monthly' && mk === selectedMonth) include = true;
    if (activeRange === 'Yearly' && d.getFullYear() === now.getFullYear()) include = true;

    if (include) {
      (dayData.sessions || []).forEach(s => {
        subjectHours[s.subjectId] = (subjectHours[s.subjectId] || 0) + Number(s.hours);
      });
    }
  });

  const addSession = () => {
    if (!addForm.hours || isNaN(addForm.hours) || Number(addForm.hours) <= 0) return;
    const d = new Date();
    const dk = dateKey(d);
    const tm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const ts = d.getTime();

    const newSession = {
      id: ts.toString(),
      subjectId: addForm.subjectId,
      hours: Number(addForm.hours),
      learned: addForm.learned.trim(),
      time: tm,
      timestamp: ts
    };

    const targetDayData = STUDY[dk] || { sessions: [] };
    const newStudy = { ...STUDY, [dk]: { ...targetDayData, sessions: [...(targetDayData.sessions || []), newSession] } };
    syncStudy(newStudy);
    setAddForm({ subjectId: subjects[0]?.id || 'dsa', hours: '1', learned: '' });
    setShowAdd(false);
  };

  const deleteSession = (id, dk) => {
    const targetDay = STUDY[dk];
    if (!targetDay) return;
    const newStudy = { 
      ...STUDY, 
      [dk]: { 
        ...targetDay, 
        sessions: (targetDay.sessions || []).filter(s => s.id !== id) 
      } 
    };
    syncStudy(newStudy);
  };

  // Full 12-Month GitHub-style Activity Grid logic
  const monthsData = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(now.getFullYear(), m, 1);
    const monthDays = [];
    const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dk = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hrs = ((STUDY[dk]?.sessions || []).reduce((s, e) => s + Number(e.hours), 0));
      monthDays.push({ dk, hrs });
    }
    monthsData.push({ name: MONTHS[m].slice(0, 3), days: monthDays });
  }

  // History Data logic
  const historyDataMap = {};
  Object.entries(STUDY).forEach(([dk, dayData]) => {
    const sessions = dayData.sessions || [];
    if (sessions.length === 0) return;

    const [y, mStr, dStr] = dk.split('-');
    const yr = parseInt(y);
    const mo = parseInt(mStr) - 1;
    const mk = `${y}-${mStr}`;

    // Filter logic: Respect range and selection
    let include = false;
    if (historyStart || historyEnd) {
      include = (!historyStart || dk >= historyStart) && (!historyEnd || dk <= historyEnd);
    } else if (showAllHistory) {
      include = true;
    } else {
      if (activeRange === 'Today' && dk === todayKey) include = true;
      if (activeRange === 'Weekly') {
        const diff = (now - new Date(dk)) / (1000 * 60 * 60 * 24);
        if (diff <= 7) include = true;
      }
      if (activeRange === 'Monthly' && mk === selectedMonth) include = true;
      if (activeRange === 'Yearly' && y === selectedMonth.split('-')[0]) include = true;
    }

    if (!include) return;

    if (!historyDataMap[mk]) {
      historyDataMap[mk] = { yr, mo, days: {} };
    }

    const totalHrs = sessions.reduce((s, e) => s + Number(e.hours), 0);
    historyDataMap[mk].days[dk] = { 
      dk, 
      totalHrs, 
      sessions: sessions.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)) 
    };
  });

  const sortedHistory = Object.values(historyDataMap).sort((a, b) => (b.yr - a.yr) || (b.mo - a.mo));
  sortedHistory.forEach(month => {
    month.dayList = Object.values(month.days).sort((a, b) => b.dk.localeCompare(a.dk));
  });

  // Analytics for Report
  const chartData = [];
  if (isReport) {
    const [selY, selM] = selectedMonth.split('-').map(Number);
    const rollingDays = activeRange === 'Today' ? 1 : activeRange === 'Weekly' ? 7 : activeRange === 'Monthly' ? 30 : 365;
    
    for (let i = rollingDays - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const dk = dateKey(d);
      const dayStats = STUDY[dk] || { sessions: [] };
      const totalHrs = (dayStats.sessions || []).reduce((s, e) => s + Number(e.hours), 0);
      
      chartData.push({
        name: activeRange === 'Weekly' ? DAYS_SHORT[d.getDay()] : `${d.getDate()}/${d.getMonth()+1}`,
        hours: totalHrs,
        date: dk
      });
    }
  }

  const pieData = subjects.map(s => ({
    name: s.label,
    value: subjectHours[s.id] || 0,
    color: s.color
  })).filter(d => d.value > 0);

  const statusEmoji = progressPct >= 100 ? '🔥' : progressPct >= 50 ? '⚡' : '📚';
  const statusColor = progressPct >= 100 ? 'var(--accent)' : progressPct >= 50 ? 'var(--orange)' : 'var(--blue)';

  const renderModal = () => {
    if (!modalDay) return null;
    const d = new Date(modalDay.dk);
    const sessions = modalDay.sessions.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

    return (
      <div className="modal-overlay open" onClick={(e) => { if(e.target.className.includes('modal-overlay')) setModalDay(null); }}>
        <div className="modal">
          <div className="modal-handle"></div>
          <button className="modal-close" onClick={() => setModalDay(null)}>×</button>
          <div className="modal-title">{modalDay.dk === todayKey ? 'Today' : DAYS_SHORT[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]}</div>
          <div className="modal-sub">Total Study: {modalDay.totalHrs.toFixed(1)} hrs</div>
          
          <div style={{ marginTop: '20px' }}>
            {sessions.map(s => {
              const sub = subjects.find(x => x.id === s.subjectId) || subjects[0];
              return (
                <div key={s.id} style={{ padding: '12px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--border2)', borderLeft: `3px solid ${sub.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span>{sub.emoji}</span>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: sub.color }}>{sub.label}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>{s.time}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.hours}h session</div>
                      {s.learned && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', fontStyle: 'italic' }}>💡 {s.learned}</div>}
                    </div>
                    <button onClick={() => { deleteSession(s.id, modalDay.dk); setModalDay(prev => ({...prev, sessions: prev.sessions.filter(x => x.id !== s.id), totalHrs: prev.totalHrs - s.hours})); }} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="study-content" style={{ padding: '20px 0' }}>
      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }} className="hide-scroll">
          {(() => {
            const months = [];
            for (let i = 0; i < 6; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const mk = monthKey(d);
              months.push({ mk, label: `${MONTHS[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}` });
            }
            return months.map(m => (
              <div key={m.mk} onClick={() => { setSelectedMonth(m.mk); setActiveRange('Monthly'); }}
                style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer',
                  background: selectedMonth === m.mk ? 'var(--accent)' : 'var(--bg3)',
                  color: selectedMonth === m.mk ? '#000' : 'var(--text3)',
                  border: '1px solid var(--border2)', fontWeight: selectedMonth === m.mk ? 700 : 400 }}>
                {m.label}
              </div>
            ));
          })()}
        </div>
      </div>

      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: '20px', padding: '4px', width: 'fit-content' }}>
          {['Today', 'Weekly', 'Monthly', 'Yearly'].map(tr => (
            <div key={tr} onClick={() => setActiveRange(tr)}
              style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '16px', cursor: 'pointer',
                background: activeRange === tr ? 'var(--accent)' : 'transparent',
                color: activeRange === tr ? '#000' : 'var(--text2)',
                fontWeight: activeRange === tr ? 'bold' : 'normal', transition: 'all 0.2s' }}>
              {tr}
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '0 20px 20px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '8px' }}>{activeRange} Progress</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: statusColor }}>{formatDuration(rangeHours)} <span style={{fontSize:'14px', color:'var(--text3)', fontWeight: 400}}>/ {targetHrs}h</span></div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>{rangeSessions} total sessions • {progressPct}% complete</div>
          </div>
          <div style={{ width: '60px', height: '60px', position: 'relative' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={statusColor} strokeWidth="3"
                strokeDasharray={`${progressPct} 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: statusColor }}>{progressPct}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {subjects.map(sub => {
            const hrs = subjectHours[sub.id] || 0;
            const subPct = Math.min(100, Math.round((hrs / (targetHrs / subjects.length || 1)) * 100));
            return (
              <div key={sub.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>{sub.emoji} {sub.label}</span>
                  <span style={{ color: sub.color, fontWeight: 700 }}>{formatDuration(hrs)}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${subPct}%`, height: '100%', background: sub.color, borderRadius: '4px', transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ margin: '0 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>Activity Heatmap</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{now.getFullYear()} Calendar</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', background: 'var(--bg3)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border2)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {monthsData.map(m => (
            <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 'fit-content' }}>
              <div style={{ fontSize: '8px', color: 'var(--text3)', textAlign: 'center' }}>{m.name}</div>
              <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '2px' }}>
                {m.days.map(d => (
                  <div key={d.dk} style={{ 
                    width: '6px', height: '6px', borderRadius: '1px', 
                    background: d.hrs > 0 ? `rgba(200, 241, 53, ${Math.min(1, 0.2 + (d.hrs/dailyTarget))})` : 'rgba(255,255,255,0.05)',
                    border: d.dk === todayKey ? '1px solid var(--accent)' : 'none'
                  }} title={`${d.dk}: ${d.hrs}h`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🧠 AI STUDY COMPANION & QUIZ */}
      <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BookOpen size={18} color="var(--accent)" />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>🧠 AI Study Companion</div>
        </div>
        
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px' }}>
          Generate custom quizzes or get expert interview advice tailored precisely to your background!
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button onClick={generateQuiz} disabled={aiLoading}
            style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--accent)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', outline: 'none' }}>
            ⚡ JS/React Quiz
          </button>
          <button onClick={generateTip} disabled={aiLoading}
            style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--accent)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', outline: 'none' }}>
            🤝 Interview Tip
          </button>
        </div>

        {aiLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '10px' }}>
            <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}></div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Consulting Lucy...</div>
          </div>
        )}

        {aiContent && aiContent.type === 'quiz' && (
          <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>❓ {aiContent.question}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {aiContent.options.map((opt, idx) => {
                const isSelected = aiContent.selectedOption === opt;
                const isAnswer = opt === aiContent.answer;
                const showCorrect = aiContent.selectedOption !== null && isAnswer;
                const showWrong = isSelected && !isAnswer;

                let optBg = 'var(--bg)';
                let optBorder = 'var(--border2)';
                let optColor = 'var(--text)';

                if (isSelected) {
                  optBg = 'rgba(200, 241, 53, 0.1)';
                  optBorder = 'var(--accent)';
                }
                if (aiContent.selectedOption !== null) {
                  if (isAnswer) {
                    optBg = 'rgba(52, 211, 153, 0.15)';
                    optBorder = '#34D399';
                    optColor = '#34D399';
                  } else if (isSelected) {
                    optBg = 'rgba(244, 114, 182, 0.15)';
                    optBorder = '#F472B6';
                    optColor = '#F472B6';
                  }
                }

                return (
                  <button key={idx} disabled={aiContent.selectedOption !== null}
                    onClick={() => setAiContent(prev => ({ ...prev, selectedOption: opt, showExplanation: true }))}
                    style={{ width: '100%', padding: '10px 14px', background: optBg, border: `1px solid ${optBorder}`, borderRadius: '10px', color: optColor, fontSize: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontWeight: isSelected ? 'bold' : 'normal', outline: 'none' }}>
                    {opt} {showCorrect && ' ✓'} {showWrong && ' ✗'}
                  </button>
                );
              })}
            </div>

            {aiContent.showExplanation && (
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                💡 <strong>Explanation:</strong> {aiContent.explanation}
              </div>
            )}
          </div>
        )}

        {aiContent && aiContent.type === 'tip' && (
          <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border2)', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} color="var(--accent)" />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>Expert Interview Prep Tip</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
              {aiContent.text}
            </div>
          </div>
        )}

        {aiContent && aiContent.type === 'error' && (
          <div style={{ padding: '12px', background: 'rgba(244,114,182,0.1)', border: '1px solid #F472B6', borderRadius: '12px', fontSize: '12px', color: '#F472B6' }}>
            {aiContent.text}
          </div>
        )}
      </div>

      {/* 💼 LIVE JOB MATCHES & TRACKER */}
      <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--blue)" />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              💼 Live Job Matches ({preferredLocs.join(', ')})
            </div>
          </div>
          <span className="live-badge" style={{ fontSize: '8px', padding: '3px 8px', background: 'rgba(52, 211, 153, 0.1)', color: '#34D399', borderRadius: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>Live Scanner</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '16px' }}>
          Auto-scanning major job portals for active posts matching your custom target roles, preferred cities, and work modes. Enable browser permissions to get push notifications!
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {jobs.map(job => (
            <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="job-card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '14px', textDecoration: 'none', transition: 'all 0.2s' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', background: `rgba(255,255,255,0.05)`, color: job.color, borderRadius: '6px', border: `1px solid ${job.color}33` }}>
                    {job.type}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)' }}>{job.company}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{job.title}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{job.ago}</span>
                <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 'bold' }}>Apply ➔</span>
              </div>
            </a>
          ))}
        </div>

        {/* 🔍 Dynamic Multi-Platform Search Console */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border2)', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={16} color="var(--accent)" />
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>🔎 Dynamic Multi-Platform Search Console</div>
          </div>
          
          {/* Target Role Pills */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Select Target Role:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedRoles.map(role => (
                <div key={role} onClick={() => {
                  setActiveSearchRole(role);
                  setCustomSearchRole('');
                }}
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', background: (activeSearchRole === role && !customSearchRole) ? 'var(--accent)' : 'var(--bg3)', color: (activeSearchRole === role && !customSearchRole) ? '#000' : 'var(--text2)', border: `1px solid ${(activeSearchRole === role && !customSearchRole) ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700, transition: 'all 0.2s' }}>
                  {role}
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Location Pills */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Select Preferred City:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {preferredLocs.map(loc => (
                <div key={loc} onClick={() => {
                  setActiveSearchLoc(loc);
                  setCustomSearchLoc('');
                }}
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', background: (activeSearchLoc === loc && !customSearchLoc) ? '#4D9FFF' : 'var(--bg3)', color: (activeSearchLoc === loc && !customSearchLoc) ? '#000' : 'var(--text2)', border: `1px solid ${(activeSearchLoc === loc && !customSearchLoc) ? '#4D9FFF' : 'var(--border2)'}`, fontWeight: 700, transition: 'all 0.2s' }}>
                  📍 {loc}
                </div>
              ))}
            </div>
          </div>

          {/* Work Mode Selector */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Select Work Mode:</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {workModes.map(mode => (
                <div key={mode} onClick={() => setActiveSearchMode(mode)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', cursor: 'pointer', background: activeSearchMode === mode ? 'var(--accent)' : 'var(--bg3)', color: activeSearchMode === mode ? '#000' : 'var(--text2)', border: `1px solid ${activeSearchMode === mode ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700, transition: 'all 0.2s' }}>
                  {mode === 'Remote' ? '🏠 Remote' : mode === 'Hybrid' ? '🤝 Hybrid' : '🏢 On-site'}
                </div>
              ))}
            </div>
          </div>

          {/* Experience Level Selector */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Select Experience Level:</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'Fresher', label: '🎓 Fresher' },
                { id: '1-2 Years', label: '⚡ 1-2 Years' },
                { id: '3+ Years', label: '🚀 3+ Years' }
              ].map(level => (
                <div key={level.id} onClick={() => setActiveSearchExp(level.id)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', cursor: 'pointer', background: activeSearchExp === level.id ? 'var(--accent)' : 'var(--bg3)', color: activeSearchExp === level.id ? '#000' : 'var(--text2)', border: `1px solid ${activeSearchExp === level.id ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700, transition: 'all 0.2s' }}>
                  {level.label}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Search (Ad-hoc override) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Custom Job Name:</div>
              <input type="text" placeholder="e.g. Python Dev" value={customSearchRole} 
                onChange={e => setCustomSearchRole(e.target.value)}
                onFocus={() => setRoleFocused(true)}
                onBlur={() => setTimeout(() => setRoleFocused(false), 200)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', boxSizing: 'border-box' }} />
              {roleFocused && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '120px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  {getJobSuggestions(customSearchRole).map(item => (
                    <div key={item} onMouseDown={() => {
                      setCustomSearchRole(item);
                      setRoleFocused(false);
                    }}
                      style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text2)', cursor: 'pointer', borderBottom: '1px solid var(--border2)', background: 'transparent', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}>
                      🔍 {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Custom City:</div>
              <input type="text" placeholder="e.g. Delhi, London" value={customSearchLoc} 
                onChange={e => setCustomSearchLoc(e.target.value)}
                onFocus={() => setLocFocused(true)}
                onBlur={() => setTimeout(() => setLocFocused(false), 200)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', boxSizing: 'border-box' }} />
              {locFocused && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '120px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  {getCitySuggestions(customSearchLoc).map(item => (
                    <div key={item} onMouseDown={() => {
                      setCustomSearchLoc(item);
                      setLocFocused(false);
                    }}
                      style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text2)', cursor: 'pointer', borderBottom: '1px solid var(--border2)', background: 'transparent', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}>
                      📍 {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Job Query Summary */}
          {(() => {
            const finalRole = customSearchRole.trim() || activeSearchRole;
            const finalLoc = customSearchLoc.trim() || activeSearchLoc;
            
            // Map experience level to search keywords nicely
            const expKeyword = activeSearchExp === 'Fresher' 
              ? 'fresher' 
              : activeSearchExp === '1-2 Years' 
                ? 'junior' 
                : 'senior';

            const queryKeywords = `${finalRole} ${activeSearchMode} ${expKeyword}`;
            const queryLocation = finalLoc === 'Remote' ? '' : finalLoc;

            return (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '10px', background: 'rgba(200, 241, 53, 0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(200, 241, 53, 0.1)' }}>
                  🚀 Launching: <span style={{ color: '#fff' }}>"{finalRole}"</span> for <span style={{ color: '#fff' }}>{activeSearchExp}</span> in <span style={{ color: '#fff' }}>"{finalLoc}"</span> ({activeSearchMode})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <a href={`https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(queryKeywords)}&location=${encodeURIComponent(queryLocation || 'Remote')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(10, 102, 194, 0.1)', border: '1px solid rgba(10, 102, 194, 0.3)', borderRadius: '10px', color: '#0A66C2', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold', transition: 'all 0.2s' }}>
                    🔵 LinkedIn
                  </a>
                  <a href={`https://www.indeed.com/jobs?q=${encodeURIComponent(queryKeywords)}&l=${encodeURIComponent(queryLocation || 'Remote')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(37, 87, 224, 0.1)', border: '1px solid rgba(37, 87, 224, 0.3)', borderRadius: '10px', color: '#2557E0', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold', transition: 'all 0.2s' }}>
                    🔵 Indeed
                  </a>
                  <a href={`https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(finalRole + ' ' + finalLoc + ' ' + activeSearchMode + ' ' + expKeyword)}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(20, 168, 0, 0.1)', border: '1px solid rgba(20, 168, 0, 0.3)', borderRadius: '10px', color: '#14A800', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold', transition: 'all 0.2s' }}>
                    🔵 Upwork
                  </a>
                  <a href={`https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(queryKeywords)}&location=${encodeURIComponent(queryLocation || 'Remote')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(0, 178, 169, 0.1)', border: '1px solid rgba(0, 178, 169, 0.3)', borderRadius: '10px', color: '#00B2A9', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold', transition: 'all 0.2s' }}>
                    🔵 ZipRecruiter
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Slide-in Job Notification Toast Overlay */}
      {jobToast && (
        <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: '380px', background: 'rgba(17,17,17,0.95)', border: '1px solid var(--accent)', borderRadius: '16px', padding: '16px', zIndex: 300, display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 8px 32px rgba(200,241,53,0.15)', animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(200,241,53,0.1)', color: 'var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>💼</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>New Job Discovered!</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{jobToast.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>at {jobToast.company} • Matching profile</div>
          </div>
          <a href={jobToast.link} target="_blank" rel="noopener noreferrer" onClick={() => setJobToast(null)}
            style={{ padding: '6px 12px', background: 'var(--accent)', color: '#000', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}>
            Apply
          </a>
        </div>
      )}


      {!isReport && (
        <>
          <div style={{ padding: '0 20px', marginBottom: '24px' }}>
            <button onClick={() => setShowAdd(!showAdd)}
              style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(200,241,53,0.2)' }}>
              <PlusCircle size={18} /> Log Study Session
            </button>
          </div>

          {showAdd && (
            <div style={{ margin: '0 20px 24px', background: 'var(--bg3)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border2)' }}>
              <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>New Session</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {subjects.map(s => (
                  <div key={s.id} onClick={() => setAddForm(f => ({ ...f, subjectId: s.id }))}
                    style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: addForm.subjectId === s.id ? s.color : 'var(--bg)', color: addForm.subjectId === s.id ? '#000' : 'var(--text2)', fontWeight: 700, border: `1px solid ${addForm.subjectId === s.id ? s.color : 'var(--border2)'}`, transition: 'all 0.2s' }}>
                    {s.emoji} {s.label}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Select Hours</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[0.5, 1, 1.5, 2, 2.5, 3, 4].map(h => (
                    <div key={h} onClick={() => setAddForm(f => ({ ...f, hours: h.toString() }))}
                      style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: addForm.hours == h ? 'var(--accent)' : 'var(--bg)', color: addForm.hours == h ? '#000' : 'var(--text2)', border: `1px solid ${addForm.hours == h ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700 }}>
                      {h}h
                    </div>
                  ))}
                </div>
              </div>
              <textarea placeholder="What topic did you cover?" value={addForm.learned} onChange={e => setAddForm(f => ({ ...f, learned: e.target.value }))}
                rows={2} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addSession} style={{ flex: 1, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Save Entry</button>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {isReport && (
        <div style={{ padding: '0 20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="dash-card full" style={{ background: 'var(--bg3)', padding: '20px', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChartIcon size={18} color="var(--blue)" />
              <div style={{ fontSize: '15px', fontWeight: 700 }}>Study Trend</div>
            </div>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHrs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid var(--border2)', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="hours" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorHrs)" />
                  <ReferenceLine y={dailyTarget} label={{ position: 'right', value: 'GOAL', fill: 'var(--accent)', fontSize: 8 }} stroke="var(--accent)" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-card full" style={{ background: 'var(--bg3)', padding: '20px', display: 'block' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Subject Mix</div>
            <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '160px' }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                    <span style={{ fontSize: '10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{d.name}: {d.value.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>History</div>
            <div onClick={() => setShowAllHistory(!showAllHistory)} 
              style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', 
                background: showAllHistory ? 'var(--accent)' : 'var(--bg3)', 
                color: showAllHistory ? '#000' : 'var(--text2)', 
                border: '1px solid var(--border2)', fontWeight: showAllHistory ? 'bold' : 'normal' }}>
              {showAllHistory ? 'Showing All' : 'Show All Time'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showDateFilter ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg3)', padding: '2px 6px', borderRadius: '20px', border: '1px solid var(--border2)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <div style={{display:'flex', alignItems:'center', background:'var(--bg)', borderRadius:'18px', padding:'4px 10px', gap:'8px'}}>
                  <Calendar size={12} color="var(--accent)" />
                  <input type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '10px', outline: 'none', width: '85px', cursor:'pointer' }} />
                  <div style={{width:'1px', height:'12px', background:'var(--border2)'}}></div>
                  <input type="date" value={historyEnd} onChange={e => setHistoryEnd(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '10px', outline: 'none', width: '85px', cursor:'pointer' }} />
                  <X size={12} onClick={() => setShowDateFilter(false)} style={{cursor:'pointer', color:'var(--text3)'}} />
                </div>
              </div>
            ) : (
              <div onClick={() => setShowDateFilter(true)} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg3)', padding: '8px 16px', borderRadius: '16px', border: '1px solid var(--border2)', cursor: 'pointer', fontSize: '12px', color: 'var(--text2)' }}>
                <Calendar size={14} /> <span>Filter Dates</span>
              </div>
            )}
          </div>
        </div>

        {sortedHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg3)', borderRadius: '20px', border: '1px dashed var(--border2)', color: 'var(--text3)', fontSize: '14px' }}>
            No study sessions recorded.
          </div>
        )}

        {sortedHistory.map(month => (
          <div key={`${month.yr}-${month.mo}`} style={{ marginBottom: '24px' }}>
            <div className="month-label" style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {MONTHS[month.mo]} {month.yr}
            </div>
            {month.dayList.map(day => {
              const d = new Date(day.dk);
              return (
                <div key={day.dk} className="history-day has-data" onClick={() => setModalDay(day)} style={{ marginBottom: '12px' }}>
                  <div className="hday-top" style={{ marginBottom: '0' }}>
                    <div className="hday-date" style={{ fontSize: '13px', fontWeight: 700 }}>
                      {day.dk === todayKey ? 'Today — ' : ''}{DAYS_SHORT[d.getDay()]}, {d.getDate()} {MONTHS[month.mo].slice(0,3)}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: day.totalHrs >= dailyTarget ? 'var(--accent)' : 'var(--blue)' }}>
                        {day.totalHrs.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                  <div className="hday-focus" style={{ marginTop: '8px' }}>
                    {day.sessions.length} Sessions • {day.sessions.map(s => subjects.find(x => x.id === s.subjectId)?.emoji).slice(0, 5).join(' ')}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {renderModal()}
      </div>
      <div style={{ height: '40px' }} />
    </div>
  );
}
