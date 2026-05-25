import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlusCircle, Trash2, BookOpen, Clock, CheckCircle, ChevronLeft, ChevronRight, BarChart as BarChartIcon, Calendar, X, Sparkles, Brain, Code, Cpu, Award } from 'lucide-react';
import { MONTHS, DAYS_SHORT } from '../data';
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import JobBoard from './study/JobBoard';

const DEFAULT_SUBJECTS = [
  { id: 'dsa',      label: 'DSA',             emoji: '🧠', color: '#A78BFA' },
  { id: 'js',       label: 'JavaScript',      emoji: '⚡', color: '#FBBF24' },
  { id: 'react',    label: 'React',           emoji: '⚛️',  color: '#4D9FFF' },
  { id: 'interview',label: 'Interview Prep', emoji: '🤝', color: '#34D399' },
];

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

const renderSubjectIcon = (id, fallback, size = 16, style = {}) => {
  if (id === 'dsa') return <Brain size={size} style={{ verticalAlign: 'middle', ...style }} />;
  if (id === 'js') return <Code size={size} style={{ verticalAlign: 'middle', ...style }} />;
  if (id === 'react') return <Cpu size={size} style={{ verticalAlign: 'middle', ...style }} />;
  if (id === 'interview') return <Award size={size} style={{ verticalAlign: 'middle', ...style }} />;
  return <span style={{ fontSize: `${size}px`, verticalAlign: 'middle', ...style }}>{fallback}</span>;
};

export default function Study({ STUDY = {}, syncStudy, STUDY_SETTINGS, isReport, activeRange: propRange, profileInfo }) {
  const now = new Date();
  const todayKey = dateKey(now);

  const subjects = STUDY_SETTINGS?.subjects?.length ? STUDY_SETTINGS.subjects : DEFAULT_SUBJECTS;
  const dailyTarget = Number(STUDY_SETTINGS?.dailyTarget || 4);

  const todayData = STUDY[todayKey] || {};
  const [activeRange, setActiveRange] = useState(propRange || 'Weekly');
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now));
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [activeSpace, setActiveSpace] = useState('learning');

  // AI Study Companion States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState(null);

  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState(null);

  const startMockInterview = async () => {
    setAiLoading(true);
    setAiContent(null);
    setInterviewFeedback(null);
    setUserAnswer('');
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');

      if (!apiKey) throw new Error('No API Key');

      const targetRolesStr = profileInfo?.targetRoles?.join(', ') || 'Frontend Developer';
      const resumeStr = profileInfo?.resume || 'Student ready to work';

      const prompt = `Act as an expert technical interviewer for roles: ${targetRolesStr}.
Candidate Resume: ${resumeStr}.

Generate a single challenging technical interview question tailored to the candidate's target roles and experience.
Be direct and ask only the question. Avoid greetings or conversational filler. Ask about specific technical concepts, patterns, architecture, coding tradeoffs, or performance optimizations.`;

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

      setInterviewQuestion(resultText.trim());
      setAiContent({ type: 'interview' });
    } catch(e) {
      console.error(e);
      setAiContent({
        type: 'error',
        text: '⚠️ Make sure you have configured a valid API Key in the AI Coach settings first!'
      });
    }
    setAiLoading(false);
  };

  const evaluateAnswer = async () => {
    if (!userAnswer.trim()) return;
    setInterviewLoading(true);
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');

      if (!apiKey) throw new Error('No API Key');

      const prompt = `Evaluate this candidate's technical interview answer.
Question: ${interviewQuestion}
Candidate's Answer: ${userAnswer}

Provide a detailed evaluation in this strict JSON format:
{
  "grade": "A|B|C|D|F",
  "score": "Out of 100",
  "strengths": "What they explained well...",
  "weaknesses": "What concepts or keywords they missed or got wrong...",
  "modelAnswer": "How a perfect senior engineer would answer this question...",
  "critique": "A brief encouraging mentoring note..."
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
      setInterviewFeedback(parsed);
    } catch(e) {
      console.error(e);
      alert('Failed to evaluate answer. Make sure response is standard JSON. Please try again!');
    }
    setInterviewLoading(false);
  };

  const preferredLocs = profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'];

  const generateQuiz = async () => {
    setAiLoading(true);
    setAiContent(null);
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');
      
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
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');

      if (!apiKey) throw new Error('No API Key');

      let profileText = '';
      try {
        const prof = JSON.parse(localStorage.getItem('gprofileInfo'));
        if (prof) profileText = `Customize it for a candidate named ${prof.name || 'User'} with resume details: ${prof.resume || ''}`;
      } catch(e) {}

      const prompt = `Give a single highly practical and unique interview preparation tip for JavaScript or React developers. ${profileText} Keep it encouraging and direct. Speak as a career mentor. Try to make it feel fresh and highly actionable. Max 4 sentences.`;

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

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ subjectId: subjects[0]?.id || 'dsa', hours: '1', learned: '' });
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const [modalDay, setModalDay] = useState(null);

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

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

  // Activity Heatmap
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

  // History Data
  const historyDataMap = {};
  Object.entries(STUDY).forEach(([dk, dayData]) => {
    const sessions = dayData.sessions || [];
    if (sessions.length === 0) return;

    const [y, mStr, dStr] = dk.split('-');
    const yr = parseInt(y);
    const mo = parseInt(mStr) - 1;
    const mk = `${y}-${mStr}`;

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

  // Analytics
  const chartData = [];
  if (isReport) {
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

  const maxHrs = chartData.length > 0 ? Math.max(...chartData.map(d => d.hours), 0) : 0;
  const yAxisMax = Math.max(dailyTarget, maxHrs, 1);

  const chartMargin = useMemo(() => ({ top: 5, right: 0, left: -25, bottom: 0 }), []);
  const axisTick = useMemo(() => ({ fontSize: 10, fill: 'var(--text2)' }), []);
  const yAxisDomain = useMemo(() => [0, yAxisMax], [yAxisMax]);
  const tooltipStyle = useMemo(() => ({ background: '#111', border: '1px solid var(--border2)', borderRadius: '8px', fontSize: '12px' }), []);
  const refLineLabel = useMemo(() => ({ position: 'right', value: 'GOAL', fill: 'var(--accent)', fontSize: 8 }), []);

  const chartContainerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && Math.abs(w - chartWidth) > 2) setChartWidth(Math.floor(w));
    });
    observer.observe(chartContainerRef.current);
    setChartWidth(Math.floor(chartContainerRef.current.getBoundingClientRect().width) || 300);
    return () => observer.disconnect();
  }, [chartWidth]);

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
                        <span>{renderSubjectIcon(sub.id, sub.emoji, 14)}</span>
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
    <div id="study-content" style={{ padding: '0 0 20px' }}>
      
      {/* PrepHub Study Card Banner with abstract workspace / coding matrix library background */}
      {!isReport && (
        <div 
          className="scroll-reveal" 
          style={{
            margin: '0 20px 24px',
            padding: '24px 20px',
            borderRadius: 'var(--radius)',
            backgroundImage: 'linear-gradient(to right, rgba(18, 18, 20, 0.95) 45%, rgba(18, 18, 20, 0.45) 100%), url(https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            PrepHub Career Accelerator
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Learning Space</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Log study hours, track mock coding interviews, and review target role jobs.</div>
        </div>
      )}

      {/* Sleek Sub-space Switcher */}
      {!isReport && (
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg3)', 
            borderRadius: '16px', 
            padding: '4px', 
            border: '1px solid var(--border2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <button 
              onClick={() => setActiveSpace('learning')}
              style={{ 
                flex: 1, 
                padding: '10px', 
                borderRadius: '12px', 
                border: 'none', 
                background: activeSpace === 'learning' ? 'var(--accent)' : 'transparent',
                color: activeSpace === 'learning' ? '#000' : 'var(--text2)',
                fontWeight: 700, 
                fontSize: '12px', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                transition: 'all 0.2s ease-in-out' 
              }}
            >
              <BookOpen size={15} /> Learning Space
            </button>
            <button 
              onClick={() => setActiveSpace('interview')}
              style={{ 
                flex: 1, 
                padding: '10px', 
                borderRadius: '12px', 
                border: 'none', 
                background: activeSpace === 'interview' ? 'var(--accent)' : 'transparent',
                color: activeSpace === 'interview' ? '#000' : 'var(--text2)',
                fontWeight: 700, 
                fontSize: '12px', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                transition: 'all 0.2s ease-in-out' 
              }}
            >
              <Sparkles size={15} /> Interview Prep
            </button>
          </div>
        </div>
      )}

      {/* 📖 LEARNING SPACE */}
      {(activeSpace === 'learning' || isReport) && (
        <>
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{renderSubjectIcon(sub.id, sub.emoji, 14)} {sub.label}</span>
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
            <div style={{ display: 'flex', gap: '12px', background: 'var(--bg3)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border2)', overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scroll">
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

          {/* Log Study Session Actions */}
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
                        style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', background: addForm.subjectId === s.id ? s.color : 'var(--bg)', color: addForm.subjectId === s.id ? '#000' : 'var(--text2)', fontWeight: 700, border: `1px solid ${addForm.subjectId === s.id ? s.color : 'var(--border2)'}`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderSubjectIcon(s.id, s.emoji, 13)} {s.label}
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

          {/* Trend Chart & Subject Mix (if isReport is true) */}
          {isReport && (
            <div style={{ padding: '0 20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="dash-card full" style={{ background: 'var(--bg3)', padding: '20px', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BarChartIcon size={18} color="var(--blue)" />
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>Study Trend</div>
                </div>
                <div ref={chartContainerRef} style={{ width: '100%', height: '180px' }}>
                  <AreaChart width={chartWidth} height={180} data={chartData} margin={chartMargin}>
                    <defs>
                      <linearGradient id="colorHrs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis domain={yAxisDomain} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="hours" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorHrs)" isAnimationActive={false} />
                    <ReferenceLine y={dailyTarget} label={refLineLabel} stroke="var(--accent)" strokeDasharray="3 3" />
                  </AreaChart>
                </div>
              </div>
              <div className="dash-card full" style={{ background: 'var(--bg3)', padding: '20px', display: 'block' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Subject Mix</div>
                <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pieData.length > 0 ? (
                    <>
                      <div style={{ width: '50%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PieChart width={140} height={180}>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </div>
                      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '160px' }}>
                        {pieData.map(d => (
                          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                            <span style={{ fontSize: '10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{d.name}: {d.value.toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>
                      📚 No subject mix logs yet.<br />Add a study session to see analytics!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History */}
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
                      <div className="hday-focus" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{day.sessions.length} Sessions •</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {day.sessions.slice(0, 5).map((s, idx) => {
                            const sub = subjects.find(x => x.id === s.subjectId) || subjects[0];
                            return (
                              <span key={idx} style={{ color: sub.color, display: 'inline-flex', alignItems: 'center' }}>
                                {renderSubjectIcon(sub.id, sub.emoji, 12)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {renderModal()}
          </div>
        </>
      )}

      {/* 💼 INTERVIEW PREP & JOBS */}
      {(activeSpace === 'interview' && !isReport) && (
        <>
          {/* AI STUDY COMPANION & QUIZ */}
          <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BookOpen size={18} color="var(--accent)" />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>🧠 AI Study Companion</div>
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px' }}>
              Generate custom quizzes, get expert tips, or start an AI Mock Interview tailored to your resume!
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button onClick={generateQuiz} disabled={aiLoading}
                style={{ flex: 1, minWidth: '100px', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--accent)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', outline: 'none' }}>
                ⚡ JS/React Quiz
              </button>
              <button onClick={generateTip} disabled={aiLoading}
                style={{ flex: 1, minWidth: '100px', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--accent)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', outline: 'none' }}>
                🤝 Interview Tip
              </button>
              <button onClick={startMockInterview} disabled={aiLoading || interviewLoading}
                style={{ flex: 1, minWidth: '120px', padding: '10px 12px', background: 'var(--accent)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', outline: 'none' }}>
                🎯 Mock Interview
              </button>
            </div>

            {(aiLoading || interviewLoading) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '10px' }}>
                <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}></div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Consulting Lucy...</div>
              </div>
            )}

            {aiContent && aiContent.type === 'interview' && (
              <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💬 Question from Lucy</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px', lineHeight: 1.4 }}>
                  {interviewQuestion}
                </div>

                {!interviewFeedback ? (
                  <>
                    <textarea placeholder="Type your detailed answer here... (explain concepts, mention keywords, discuss trade-offs)" value={userAnswer}
                      onChange={e => setUserAnswer(e.target.value)} rows={4}
                      style={{ width: '100%', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={evaluateAnswer} disabled={!userAnswer.trim() || interviewLoading}
                      style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: userAnswer.trim() ? 'pointer' : 'not-allowed', opacity: userAnswer.trim() ? 1 : 0.6 }}>
                      Submit Answer & Get Grade
                    </button>
                  </>
                ) : (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900 }}>
                        {interviewFeedback.grade}
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Evaluation Score</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{interviewFeedback.score}%</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                      <div style={{ color: '#34D399', fontWeight: 700, marginBottom: '4px' }}>🟢 Strengths:</div>
                      <p style={{ color: 'var(--text2)', margin: '0 0 10px 0' }}>{interviewFeedback.strengths}</p>

                      <div style={{ color: '#F472B6', fontWeight: 700, marginBottom: '4px' }}>🔴 Areas to Improve:</div>
                      <p style={{ color: 'var(--text2)', margin: '0 0 10px 0' }}>{interviewFeedback.weaknesses}</p>

                      <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>💡 Model Answer:</div>
                      <p style={{ color: 'var(--text2)', margin: '0 0 12px 0', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--accent)', fontStyle: 'italic' }}>
                        {interviewFeedback.modelAnswer}
                      </p>

                      <div style={{ color: 'var(--text3)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                        👩‍🏫 <strong>Lucy's Mentoring Note:</strong> {interviewFeedback.critique}
                      </div>
                    </div>

                    <button onClick={startMockInterview}
                      style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '10px', color: 'var(--text)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                      🔄 Try Another Question
                    </button>
                  </div>
                )}
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

          {/* 💼 LIVE JOB MATCHES */}
          <JobBoard profileInfo={profileInfo} />
        </>
      )}

      <div style={{ height: '40px' }} />
    </div>
  );
}
