import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Key, Sparkles } from 'lucide-react';
import { DEFAULT_PLAN } from '../data';

const GEMINI_KEY_STORAGE = 'gemini_api_key';

export default function AIChat({ DB, NAMES = {}, META, FOOD, BUDGET, STUDY, SCHEDULE, syncAiSettings, profileInfo = { name: '', resume: '' } }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm Lucy 🤖 Ask me anything about your workouts, diet, budget, or study progress!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  const [openrouterKey, setOpenrouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [model, setModel] = useState(() => localStorage.getItem('ai_model') || 'gemini-1.5-flash');
  const [openrouterModel, setOpenrouterModel] = useState(() => localStorage.getItem('openrouter_model') || 'openrouter/free');
  const [persona, setPersona] = useState(() => localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setApiKey(localStorage.getItem(GEMINI_KEY_STORAGE) || '');
      setOpenrouterKey(localStorage.getItem('openrouter_api_key') || '');
      setProvider(localStorage.getItem('ai_provider') || 'gemini');
      setModel(localStorage.getItem('ai_model') || 'gemini-1.5-flash');
      setOpenrouterModel(localStorage.getItem('openrouter_model') || 'openrouter/free');
      setPersona(localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const buildContext = () => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    // 1. Calculate best exercise today based on volume (Sets * Reps * Weight)
    let bestExerciseToday = null;
    let maxVolume = 0;
    const todayWorkouts = DB[todayKey] || {};
    for (const [exKey, exVal] of Object.entries(todayWorkouts)) {
      if (exVal.done) {
        const name = NAMES[exKey] || exKey;
        const volume = (exVal.s || 0) * (exVal.r || 0) * (exVal.w || 0);
        if (volume > maxVolume) {
          maxVolume = volume;
          bestExerciseToday = { name, sets: exVal.s, reps: exVal.r, weight: exVal.w, volume };
        }
      }
    }

    // 2. Scan workouts database backwards to find last workouts for major muscle groups
    const lastWorkouts = { legs: null, chest: null, back: null, shoulders: null, arms: null };
    const sortedDbEntries = Object.entries(DB).sort((a,b) => b[0].localeCompare(a[0])); // latest first

    for (const [date, exercises] of sortedDbEntries) {
      for (const exKey of Object.keys(exercises)) {
        const exName = (NAMES[exKey] || exKey).toLowerCase();
        
        if (!lastWorkouts.legs && (exName.includes('leg') || exName.includes('quad') || exName.includes('squat') || exName.includes('calf') || exName.includes('hamstring') || exName.includes('press'))) {
          lastWorkouts.legs = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k]||k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
        }
        if (!lastWorkouts.chest && (exName.includes('chest') || exName.includes('bench') || exName.includes('press') || exName.includes('pec') || exName.includes('fly'))) {
          if (!exName.includes('leg press')) {
            lastWorkouts.chest = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k]||k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
          }
        }
        if (!lastWorkouts.back && (exName.includes('back') || exName.includes('row') || exName.includes('lat') || exName.includes('pull') || exName.includes('deadlift'))) {
          lastWorkouts.back = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k]||k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
        }
        if (!lastWorkouts.shoulders && (exName.includes('shoulder') || exName.includes('press') || exName.includes('delt') || exName.includes('lateral'))) {
          if (!exName.includes('leg') && !exName.includes('chest') && !exName.includes('bench')) {
            lastWorkouts.shoulders = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k]||k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
          }
        }
        if (!lastWorkouts.arms && (exName.includes('arm') || exName.includes('bicep') || exName.includes('tricep') || exName.includes('curl') || exName.includes('extension'))) {
          lastWorkouts.arms = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k]||k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
        }
      }
    }

    // 3. Budget comparison: Current vs Previous Month
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth()+1).padStart(2,'0')}`;
    
    const currBudgetEntries = BUDGET?.[monthKey]?.entries || [];
    const currSpent = currBudgetEntries.reduce((s,e) => s + Number(e.amount), 0);
    
    const prevBudgetEntries = BUDGET?.[prevMonthKey]?.entries || [];
    const prevSpent = prevBudgetEntries.reduce((s,e) => s + Number(e.amount), 0);

    // 4. Study Subject coverage
    const subjectStats = {};
    const subjectsList = [
      { id: 'dsa', label: 'DSA' },
      { id: 'js', label: 'JavaScript' },
      { id: 'react', label: 'React' },
      { id: 'interview', label: 'Interview Prep' }
    ];
    subjectsList.forEach(sub => {
      subjectStats[sub.id] = { label: sub.label, totalHours: 0, lastDate: 'Never' };
    });
    
    Object.entries(STUDY).forEach(([date, val]) => {
      if (val && val.sessions) {
        val.sessions.forEach(sess => {
          const sId = sess.subjectId;
          if (subjectStats[sId]) {
            subjectStats[sId].totalHours += Number(sess.hours || 0);
            if (subjectStats[sId].lastDate === 'Never' || date > subjectStats[sId].lastDate) {
              subjectStats[sId].lastDate = date;
            }
          }
        });
      }
    });

    const recentWorkouts = Object.entries(DB).slice(-5).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
    const todayMeta = META[todayKey] || {};
    const todayStudy = STUDY?.[todayKey] || {};

    // Yesterday and Tomorrow Calculations
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;

    const getWorkoutForDay = (dateObj) => {
      const dk = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
      const dow = dateObj.getDay();
      
      let planId = SCHEDULE?.thisWeek?.[dk];
      if (planId === undefined) planId = SCHEDULE?.fullTime?.[dow];
      if (planId === undefined) planId = dow;
      
      return DEFAULT_PLAN[planId] || DEFAULT_PLAN[0];
    };

    const yesterdayPlan = getWorkoutForDay(yesterday);
    const todayPlan = getWorkoutForDay(now);
    const tomorrowPlan = getWorkoutForDay(tomorrow);

    const yesterdayLogged = DB[yesterdayKey] || {};
    const yesterdayDetails = Object.keys(yesterdayLogged).filter(k => k !== 'meta' && k !== 'customName').length > 0 
      ? Object.entries(yesterdayLogged).filter(([k]) => k !== 'meta' && k !== 'customName').map(([k,v]) => {
          const name = NAMES[k] || k;
          return `${name}: ${v.s || 0} sets x ${v.r || 0} reps @ ${v.w || 0}kg (${v.done === true ? 'Completed' : (v.done === false ? 'Skipped' : 'Logged')})`;
        }).join(', ')
      : `Rest Day or No workout was logged yet (Scheduled split was: ${yesterdayPlan.label})`;

    const tomorrowDetails = tomorrowPlan.label === 'Rest Day' 
      ? 'Scheduled Rest Day 😴'
      : `Scheduled Split: ${tomorrowPlan.label} (${tomorrowPlan.muscles.map(m => m.name).join(', ')}) consisting of: ${tomorrowPlan.muscles.map(m => m.exercises.join(', ')).join(', ')}`;

    const todayDetails = todayPlan.label === 'Rest Day'
      ? 'Scheduled Rest Day 😴'
      : `Scheduled Split: ${todayPlan.label} (${todayPlan.muscles.map(m => m.name).join(', ')})`;

    return `You are Lucy, a passionate, ultra-friendly, raw, and highly energetic personal coach/assistant acting as: ${persona}.
Embedded in the user's personal tracking app called LifeTraker.

Here is the user's personal profile and resume information:
- User's Name: ${profileInfo?.name || 'User'}
- User's Resume / Professional Background: ${profileInfo?.resume || 'none provided yet'}

Here is the user's compiled historical and current data. Answer any specific questions about this data accurately:
- Yesterday's Date: ${yesterdayKey}
- Yesterday's Workout Log Details: ${yesterdayDetails}
- Today's Date: ${todayKey}
- Today's Scheduled Split Plan: ${todayDetails}
- Today's Gym Workout Metadata: start=${todayMeta.start || 'not started'}, end=${todayMeta.end || 'not ended'}, energy=${todayMeta.energy || 'none'}/5, status=${todayMeta.status || 'Not started'}
- Today's Gym Exercises: ${JSON.stringify(DB[todayKey] || {})}
- Best Exercise Today (Based on Volume): ${bestExerciseToday ? `${bestExerciseToday.name} (${bestExerciseToday.sets} sets of ${bestExerciseToday.reps} reps at ${bestExerciseToday.weight}kg, Vol: ${bestExerciseToday.volume}kg-reps)` : 'none yet'}
- Tomorrow's Scheduled Workout Details: ${tomorrowDetails}
- Last Workouts by Muscle:
  * Legs: Last done on ${lastWorkouts.legs ? `${lastWorkouts.legs.date} (${lastWorkouts.legs.details})` : 'never'}
  * Chest: Last done on ${lastWorkouts.chest ? `${lastWorkouts.chest.date} (${lastWorkouts.chest.details})` : 'never'}
  * Back: Last done on ${lastWorkouts.back ? `${lastWorkouts.back.date} (${lastWorkouts.back.details})` : 'never'}
  * Shoulders: Last done on ${lastWorkouts.shoulders ? `${lastWorkouts.shoulders.date} (${lastWorkouts.shoulders.details})` : 'never'}
  * Arms: Last done on ${lastWorkouts.arms ? `${lastWorkouts.arms.date} (${lastWorkouts.arms.details})` : 'never'}
- Budget Tracking:
  * This Month (${monthKey}): Total spent = ₹${currSpent} (Income = ₹22400)
  * Last Month (${prevMonthKey}): Total spent = ₹${prevSpent}
- Study Subject Stats & Coverage:
  ${Object.values(subjectStats).map(s => `* ${s.label}: Total hours studied = ${s.totalHours.toFixed(1)} hrs (Last studied: ${s.lastDate})`).join('\n  ')}
- Today's Study Sessions: ${JSON.stringify(todayStudy.sessions || [])}
- Today's Habits: water=${FOOD[todayKey]?.water || 0} glasses, sleep=${FOOD[todayKey]?.sleep || 0} hrs, junk=${FOOD[todayKey]?.junk || 0} items

Guidelines for Lucy:
1. Tone: Be a real buddy/coach—highly energetic, raw, honest, and athletic. Speak to the user by their name (${profileInfo?.name || 'User'}) when appropriate to feel close and personal. It is completely okay to use casual, funny, direct, and slightly raw trainer slang or mild expressions ("get your lazy butt moving", "hell yeah!", "crush this shit", "stop slacking", "no bullshit") to keep it real and friendly.
2. Answering Questions:
   - If they ask about their resume, career goals, or interview preparation, reference the 'User's Resume / Professional Background' details above to offer laser-targeted coaching, mock interview questions, or resume feedback!
   - If they ask about today's workout, highlight today's exercises or the best exercise.
   - If they ask "when did I last do Legs", look at the 'Last Workouts by Muscle' section above and answer exactly.
   - If they ask about budget comparison, compare 'This Month' total spent vs 'Last Month' spent and give sharp, motivating advice.
   - If they ask about study topics to cover, identify which subjects have "Never" been studied, have 0 hours, or have the oldest 'Last studied' date and push them to study those!
3. Style: Max 3-5 sentences. Keep it punchy, high-impact, and fully friendly!`;
  };

  const [tempKey, setTempKey] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (showKeyInput) {
      const activeKey = provider === 'gemini' ? apiKey : openrouterKey;
      setTempKey(activeKey);
    } else {
      setTempKey('');
    }
  }, [showKeyInput, provider, apiKey, openrouterKey]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const activeKey = provider === 'gemini' ? apiKey : openrouterKey;
    if (!activeKey) { setShowKeyInput(true); return; }

    const userMsg = input.trim();
    setInput('');
    
    // Optimistically update the UI with the user's message
    const updatedMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(updatedMessages);
    setLoading(false); // Reset in case it got stuck
    setLoading(true);

    try {
      const context = buildContext();
      let reply = '';
      
      if (provider === 'gemini') {
        // Construct standard Gemini chat history (alternating user/model role parts)
        const chatContents = [];
        
        // Skip the initial bot greeting at index 0 to ensure alternating pattern starts with user
        const historySlice = updatedMessages.slice(1);
        
        historySlice.forEach(m => {
          chatContents.push({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          });
        });

        // Use systemInstruction for perfect adherence on Gemini 1.5+ models
        const requestBody = {
          contents: chatContents,
          systemInstruction: {
            parts: [{ text: context }]
          }
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        const data = await res.json();
        if (data.error) {
          reply = `⚠️ Gemini API Error: ${data.error.message} (Code: ${data.error.code})`;
        } else {
          reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, couldn't get a response. Please verify your API Key and try again!";
        }
      } else {
        // Construct OpenRouter chat messages array with system context
        const chatMessages = [
          { role: 'system', content: context }
        ];

        // Include all messages except initial bot greeting (handled by standard system system)
        updatedMessages.slice(1).forEach(m => {
          chatMessages.push({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text
          });
        });

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://lifetraker-gym.vercel.app',
            'X-Title': 'LifeTraker Gym'
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: chatMessages
          })
        });

        const data = await res.json();
        if (data.error) {
          reply = `⚠️ OpenRouter API Error: ${data.error.message || JSON.stringify(data.error)}`;
        } else {
          reply = data?.choices?.[0]?.message?.content || "Sorry, couldn't get a response. Please verify your API Key and try again!";
        }
      }
      
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ Connection Error: Failed to connect to ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'}. Please check your internet connection.` }]);
    }
    setLoading(false);
  };

  const saveKey = () => {
    if (tempKey.trim()) {
      const val = tempKey.trim();
      if (provider === 'gemini') {
        setApiKey(val);
        if (syncAiSettings) {
          syncAiSettings({ apiKey: val });
        } else {
          localStorage.setItem(GEMINI_KEY_STORAGE, val);
        }
      } else {
        setOpenrouterKey(val);
        if (syncAiSettings) {
          syncAiSettings({ openrouterKey: val });
        } else {
          localStorage.setItem('openrouter_api_key', val);
        }
      }
      setShowKeyInput(false);
      setTempKey('');
    }
  };

  const activeKeyExists = provider === 'gemini' ? apiKey : openrouterKey;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          style={{ 
            position: 'fixed', 
            bottom: '95px', 
            right: '24px', 
            height: '46px', 
            borderRadius: '23px', 
            padding: '0 16px',
            background: 'var(--bg2)', 
            border: '1px solid var(--border2)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', 
            zIndex: 999, 
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            color: 'var(--text)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text2)' }}>TALK TO LUCY</span>
        </button>
      )}

      {/* Blur Backdrop Glassmorphism Overlay when AI Chat is Open */}
      {open && (
        <div 
          onClick={() => setOpen(false)} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.65)', 
            backdropFilter: 'blur(8px)', 
            WebkitBackdropFilter: 'blur(8px)', 
            zIndex: 998,
            transition: 'all 0.3s ease-in-out'
          }} 
        />
      )}

      {/* Chat Panel */}
      {open && (
        <div style={{ 
          position: 'fixed', 
          bottom: '90px', 
          right: '12px', 
          left: '12px', 
          maxWidth: '500px', 
          margin: '0 auto', 
          background: 'rgba(15, 23, 42, 0.88)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '20px', 
          zIndex: 999, 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', 
          display: 'flex', 
          flexDirection: 'column', 
          maxHeight: '84vh',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Chat Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(200,241,53,0.05), rgba(77,159,255,0.05))', borderRadius: '20px 20px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.02em' }}>Lucy · AI Coach</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{provider === 'gemini' ? 'Gemini AI' : 'OpenRouter AI'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setShowKeyInput(!showKeyInput)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text3)', fontSize: '10px', padding: '4px 8px', cursor: 'pointer' }}><Key size={10}/> API Key</button>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
          </div>

          {/* API Key Input */}
          {showKeyInput && (
            <div style={{ padding: '14px 16px', background: 'rgba(200,241,53,0.03)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', fontWeight: 600 }}>Select AI Provider</div>
                <select 
                  value={provider} 
                  onChange={e => {
                    const val = e.target.value;
                    setProvider(val);
                    if (syncAiSettings) {
                      syncAiSettings({ provider: val });
                    } else {
                      localStorage.setItem('ai_provider', val);
                    }
                  }}
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', outline: 'none' }}
                >
                  <option value="gemini">Google Gemini (Direct)</option>
                  <option value="openrouter">OpenRouter (Free Auto-Router)</option>
                </select>
              </div>

              {provider === 'openrouter' && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', fontWeight: 600 }}>Select OpenRouter Free Model</div>
                  <select 
                    value={openrouterModel} 
                    onChange={e => {
                      const val = e.target.value;
                      setOpenrouterModel(val);
                      if (syncAiSettings) {
                        syncAiSettings({ openrouterModel: val });
                      } else {
                        localStorage.setItem('openrouter_model', val);
                      }
                    }}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', outline: 'none' }}
                  >
                    <option value="openrouter/free">Auto-Select Active Free Model (Highly Recommended!)</option>
                    <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free/Fast)</option>
                  </select>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', fontStyle: 'italic' }}>
                    💡 "Auto-Select" always routes to an active free model even if others are down.
                  </div>
                </div>
              )}

              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>
                {provider === 'gemini' ? (
                  <>Get a free key in 10s at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>aistudio.google.com</a></>
                ) : (
                  <>Get a free key at <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>openrouter.ai</a> (Access Llama 3 / Gemma Free!)</>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="password" placeholder={`Paste ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'} key...`} value={tempKey} onChange={e => setTempKey(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }} />
                <button onClick={saveKey} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Save</button>
              </div>
              {activeKeyExists && <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '6px' }}>✅ Key saved!</div>}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                  color: msg.role === 'user' ? '#000' : 'var(--text)',
                  fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {!activeKeyExists && (
              <div style={{ background: 'rgba(200,241,53,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px dashed var(--border2)', fontSize: '12px', color: 'var(--text2)', marginTop: '8px' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Sparkles size={14}/> Setup AI Coach (Lucy)</div>
                {provider === 'gemini' ? (
                  <>To chat, please create a free Google Gemini key at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}>Google AI Studio</a> and click the 🔑 **API Key** button above to paste it! okey.</>
                ) : (
                  <>To chat, please create a free key at <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}>OpenRouter</a> and click the 🔑 **API Key** button above to paste it! okey.</>
                )}
              </div>
            )}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: '16px 16px 16px 4px', fontSize: '13px', color: 'var(--text3)' }}>
                  ✨ Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask Lucy..."
              style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '20px', color: 'var(--text)', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={sendMessage} disabled={loading}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: loading ? 'var(--border2)' : 'var(--accent)', border: 'none', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={16} color={loading ? 'var(--text3)' : '#000'} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
