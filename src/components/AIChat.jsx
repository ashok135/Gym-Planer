import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Key, Sparkles, Copy, Check } from 'lucide-react';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN } from '../data';

const GEMINI_KEY_STORAGE = 'gemini_api_key';

const renderMessageContent = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentTable = null;
  let currentList = null;
  let isNumberedList = false;

  const parseInlineStyles = (str) => {
    if (typeof str !== 'string') return str;
    const parts = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} style={{ fontWeight: '800', color: 'var(--accent)' }}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : str;
  };

  const flushTable = (key) => {
    if (!currentTable || currentTable.length === 0) return null;
    const tableLines = currentTable;
    currentTable = null;

    // Filter out rows that are only hyphens, colons, pipes (e.g. |---|---|)
    const activeLines = tableLines.filter(line => {
      const clean = line.replace(/[|\s-:]/g, '');
      return clean.length > 0;
    });

    if (activeLines.length === 0) return null;

    const rows = activeLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts[0] === '') parts.shift();
      if (parts[parts.length - 1] === '') parts.pop();
      return parts;
    });

    // Check if the original table had a separator row as the second row
    const hasSeparator = tableLines[1] && /^[|\s-:]+$/.test(tableLines[1].trim());
    const headers = hasSeparator ? rows[0] : null;
    const bodyRows = hasSeparator ? rows.slice(1) : rows;

    return (
      <div key={key} style={{ overflowX: 'auto', margin: '8px 0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
          {headers && (
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {parseInlineStyles(h)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    {parseInlineStyles(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const flushList = (key) => {
    if (!currentList || currentList.length === 0) return null;
    const listItems = currentList;
    currentList = null;

    if (isNumberedList) {
      return (
        <ol key={key} style={{ paddingLeft: '20px', margin: '6px 0', listStyleType: 'decimal', color: 'var(--text)' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{parseInlineStyles(item)}</li>
          ))}
        </ol>
      );
    } else {
      return (
        <ul key={key} style={{ paddingLeft: '20px', margin: '6px 0', listStyleType: 'disc', color: 'var(--text)' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{parseInlineStyles(item)}</li>
          ))}
        </ul>
      );
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // Check if line is a table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (currentList) {
        elements.push(flushList(`list-${idx}`));
      }
      if (!currentTable) {
        currentTable = [];
      }
      currentTable.push(line);
      continue;
    }

    if (currentTable) {
      elements.push(flushTable(`table-${idx}`));
    }

    // Check for unordered lists
    const bulletMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || isNumberedList) {
        if (currentList) elements.push(flushList(`list-${idx}`));
        currentList = [];
        isNumberedList = false;
      }
      currentList.push(bulletMatch[2]);
      continue;
    }

    // Check for numbered lists
    const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (!currentList || !isNumberedList) {
        if (currentList) elements.push(flushList(`list-${idx}`));
        currentList = [];
        isNumberedList = true;
      }
      currentList.push(numberMatch[2]);
      continue;
    }

    if (currentList) {
      elements.push(flushList(`list-${idx}`));
    }

    if (trimmed === '') {
      elements.push(<div key={`space-${idx}`} style={{ height: '6px' }} />);
    } else {
      elements.push(
        <div key={`p-${idx}`} style={{ margin: '3px 0' }}>
          {parseInlineStyles(line)}
        </div>
      );
    }
  }

  if (currentTable) {
    elements.push(flushTable(`table-end`));
  }
  if (currentList) {
    elements.push(flushList(`list-end`));
  }

  return elements;
};

const CopyButton = ({ text, isUser }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      let textToCopy = text;

      if (text) {
        // 1. Check for multi-line markdown code blocks: ``` ... ```
        const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
        const blockMatches = [...text.matchAll(codeBlockRegex)];
        
        if (blockMatches.length > 0) {
          textToCopy = blockMatches.map(m => m[1].trim()).join('\n\n');
        } else {
          // 2. Check for inline code backticks: `code`
          const inlineCodeRegex = /`([^`\n]+)`/g;
          const inlineMatches = [...text.matchAll(inlineCodeRegex)];
          
          if (inlineMatches.length > 0) {
            textToCopy = inlineMatches.map(m => m[1].trim()).join('\n');
          }
        }
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        position: 'absolute',
        top: '6px',
        right: '6px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isUser ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
        transition: 'all 0.2s ease-in-out',
        outline: 'none'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = isUser ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = isUser ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = isUser ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} strokeWidth={2.5} color={isUser ? '#000' : 'var(--accent)'} /> : <Copy size={12} strokeWidth={2} />}
    </button>
  );
};

export default function AIChat({ DB, NAMES = {}, META, FOOD, BUDGET, STUDY, SCHEDULE, syncAiSettings, profileInfo = { name: '', resume: '' }, userId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm Lucy 🤖 Ask me anything about your workouts, diet, budget, personal information or study progress!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  const [openrouterKey, setOpenrouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem('ai_model');
    if (saved === 'gemini-1.5-flash' || saved === 'gemini-pro') {
      localStorage.setItem('ai_model', 'gemini-2.5-flash');
      return 'gemini-2.5-flash';
    }
    return saved || 'gemini-2.5-flash';
  });
  const [openrouterModel, setOpenrouterModel] = useState(() => localStorage.getItem('openrouter_model') || 'openrouter/free');
  const [persona, setPersona] = useState(() => localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
  const [pineconeKey, setPineconeKey] = useState(() => localStorage.getItem('pinecone_api_key') || import.meta.env.VITE_PINECONE_API_KEY || '');
  const [pineconeHost, setPineconeHost] = useState(() => localStorage.getItem('pinecone_host') || import.meta.env.VITE_PINECONE_HOST || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setApiKey(localStorage.getItem(GEMINI_KEY_STORAGE) || '');
      setOpenrouterKey(localStorage.getItem('openrouter_api_key') || '');
      setProvider(localStorage.getItem('ai_provider') || 'gemini');
      const savedModel = localStorage.getItem('ai_model');
      if (savedModel === 'gemini-1.5-flash' || savedModel === 'gemini-pro') {
        localStorage.setItem('ai_model', 'gemini-2.5-flash');
        setModel('gemini-2.5-flash');
      } else {
        setModel(savedModel || 'gemini-2.5-flash');
      }
      setOpenrouterModel(localStorage.getItem('openrouter_model') || 'openrouter/free');
      setPersona(localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
      setPineconeKey(localStorage.getItem('pinecone_api_key') || import.meta.env.VITE_PINECONE_API_KEY || '');
      setPineconeHost(localStorage.getItem('pinecone_host') || import.meta.env.VITE_PINECONE_HOST || '');
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

    const allExercises = {};
    Object.values(DEFAULT_PLAN).forEach(plan => {
      if (plan.muscles) {
        plan.muscles.forEach(m => {
          m.exercises.forEach((ex, idx) => {
            allExercises[`${m.name}_${idx}`] = ex;
          });
        });
      }
    });
    ['Back Squat (Heavy)', 'Deadlift (Heavy)', 'Overhead Press (Heavy)', 'Weighted Pull-ups', 'Barbell Row (Heavy)'].forEach((ex, idx) => {
      allExercises[`Progressive_${idx}`] = ex;
    });

    for (const [date, exercises] of sortedDbEntries) {
      for (const exKey of Object.keys(exercises)) {
        const defaultName = allExercises[exKey] || exKey;
        const resolvedName = NAMES[exKey] || defaultName;
        const exName = resolvedName.toLowerCase();
        
        if (!lastWorkouts.legs && (exName.includes('leg') || exName.includes('quad') || exName.includes('squat') || exName.includes('calf') || exName.includes('hamstring') || exName.includes('press'))) {
          lastWorkouts.legs = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k] || allExercises[k] || k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
        }
        if (!lastWorkouts.chest && (exName.includes('chest') || exName.includes('bench') || exName.includes('press') || exName.includes('pec') || exName.includes('fly'))) {
          if (!exName.includes('leg press')) {
            lastWorkouts.chest = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k] || allExercises[k] || k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
          }
        }
        if (!lastWorkouts.back && (exName.includes('back') || exName.includes('row') || exName.includes('lat') || exName.includes('pull') || exName.includes('deadlift'))) {
          lastWorkouts.back = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k] || allExercises[k] || k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
        }
        if (!lastWorkouts.shoulders && (exName.includes('shoulder') || exName.includes('press') || exName.includes('delt') || exName.includes('lateral'))) {
          if (!exName.includes('leg') && !exName.includes('chest') && !exName.includes('bench')) {
            lastWorkouts.shoulders = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k] || allExercises[k] || k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
          }
        }
        if (!lastWorkouts.arms && (exName.includes('arm') || exName.includes('bicep') || exName.includes('tricep') || exName.includes('curl') || exName.includes('extension'))) {
          lastWorkouts.arms = { date, details: Object.entries(exercises).map(([k,v]) => `${NAMES[k] || allExercises[k] || k}: ${v.s}x${v.r}@${v.w}kg`).join(', ') };
        }
      }
    }

    // Helper to calculate total protein for a specific date key using the FOOD object
    const calculateDailyProtein = (dk) => {
      const dayData = FOOD[dk];
      if (!dayData || !dayData.items) return 0;
      
      const dObj = new Date(dk);
      const dow = dObj.getDay();
      const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
      
      let totalP = 0;
      dietPlan.forEach(meal => {
        meal.items.forEach(item => {
          const val = dayData.items[item.id];
          let portionRatio = 0;
          if (val === true) portionRatio = 1;
          else if (val === false || val === undefined) portionRatio = 0;
          else portionRatio = Number(val) / 3;

          totalP += (item.p * portionRatio);
        });
      });
      return Math.round(totalP);
    };

    // Calculate daily protein for the last 7 logged days
    const last7DaysProtein = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      
      // Look up logged meals
      const loggedMeals = [];
      const dayData = FOOD[dk];
      if (dayData && dayData.items) {
        const dow = d.getDay();
        const dietPlan = DEFAULT_DIET_PLAN[dow] || DEFAULT_DIET_PLAN[1];
        dietPlan.forEach(meal => {
          meal.items.forEach(item => {
            const val = dayData.items[item.id];
            if (val && val > 0) {
              const portionStr = val === true || val === 3 ? 'Full' : (val === 2 ? '2/3' : '1/3');
              const customName = (dayData.custom && dayData.custom[item.id]) ? dayData.custom[item.id] : item.name;
              loggedMeals.push(`${customName} (${portionStr} portion, ~${Math.round(item.p * (Number(val)/3))}g P)`);
            }
          });
        });
      }

      const dailyP = calculateDailyProtein(dk);
      if (dailyP > 0 || FOOD[dk]) {
        last7DaysProtein.push({
          date: dk,
          protein: dailyP,
          isHigh: dailyP >= 70, // High protein threshold
          meals: loggedMeals
        });
      }
    }
    const proteinHistoryString = last7DaysProtein.map(day => 
      `* ${day.date}: ${day.protein}g Protein ${day.isHigh ? '🔥 (HIGH PROTEIN)' : ''} [Meals logged: ${day.meals.join(', ') || 'No specific meals logged, but custom values exist'}]`
    ).join('\n  ');

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
          const name = NAMES[k] || allExercises[k] || k;
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

Here is the user's personal profile, career background, and fitness preferences:
- User's Name: ${profileInfo?.name || 'User'}
- User's Career Resume / Professional Background: ${profileInfo?.resume || 'none provided yet'}
- User's Fitness Goals, Diet, & Custom Life Notes: ${profileInfo?.customLifeNotes || 'none provided yet'}

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
  * This Month (${monthKey}): Total spent = ₹${currSpent} (My Personal Monthly Salary/Income = ₹22400)
  * Last Month (${prevMonthKey}): Total spent = ₹${prevSpent}
- Study Subject Stats & Coverage:
  ${Object.values(subjectStats).map(s => `* ${s.label}: Total hours studied = ${s.totalHours.toFixed(1)} hrs (Last studied: ${s.lastDate})`).join('\n  ')}
- Today's Study Sessions: ${JSON.stringify(todayStudy.sessions || [])}
- Today's Habits: water=${FOOD[todayKey]?.water || 0} glasses, sleep=${FOOD[todayKey]?.sleep || 0} hrs, junk=${FOOD[todayKey]?.junk || 0} items
- Recent Protein & Meal Logs (Past 7 Days):
  ${proteinHistoryString || 'No protein or food logs recorded yet.'}

Guidelines for Lucy:
1. Tone: Be a real buddy/coach—highly energetic, raw, honest, and athletic. Speak to the user by their name (${profileInfo?.name || 'User'}) when appropriate to feel close and personal. It is completely okay to use casual, funny, direct, and slightly raw trainer slang or mild expressions ("get your lazy butt moving", "hell yeah!", "crush this shit", "stop slacking", "no bullshit") to keep it real and friendly.
2. Answering Questions:
   - If they ask about their resume, career goals, or interview preparation, reference the 'User's Resume / Professional Background' details above to offer laser-targeted coaching, mock interview questions, or resume feedback!
   - If they ask about today's workout, highlight today's exercises or the best exercise.
   - If they ask "when did I last do Legs", look at the 'Last Workouts by Muscle' section above and answer exactly.
   - If they ask about budget comparison, compare 'This Month' total spent vs 'Last Month' spent and give sharp, motivating advice.
   - If they ask about study topics to cover, identify which subjects have "Never" been studied, have 0 hours, or have the oldest 'Last studied' date and push them to study those!
   - If they ask "when did I eat high protein" or query their diet or protein history, inspect the 'Recent Protein & Meal Logs' listed above. List the exact dates where they ate high protein (>= 70g) or what they ate, celebrate their discipline, and push them to keep hit their macros!
3. Style: Keep responses motivating, friendly, and highly engaging.
4. Formatting: When presenting lists, comparisons, exercise splits, study stats, numbers, addresses, contact details, or any structured comparative data, ALWAYS format it inside a clean Markdown table (using '| Header 1 | Header 2 |' style). This renders as a beautiful interactive table for the user!

--- RAW APP DATA ---
(Use this raw JSON data to answer any specific historical queries about dates, past workouts, diet logs, or expenses that aren't covered in the summaries above)
- Default Exercise Names: ${JSON.stringify(allExercises)}
- All Workouts: ${JSON.stringify(DB)}
- All Food/Diet Logs: ${JSON.stringify(FOOD)}
- All Budget/Expense Logs: ${JSON.stringify(BUDGET)}
- All Study Sessions: ${JSON.stringify(STUDY)}
--------------------`;
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

    const updatedMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);

    // Add a placeholder bot message we'll stream into
    const botMsgIndex = updatedMessages.length; // position after push
    setMessages(prev => [...prev, { role: 'bot', text: '', streaming: true }]);

    try {
      let retrievedContext = '';
      if (pineconeKey && pineconeHost && apiKey) {
        try {
          const embedRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text: userMsg }] }
              })
            }
          );
          if (embedRes.ok) {
            const embedData = await embedRes.json();
            const queryVector = embedData.embedding?.values;
            
            if (queryVector) {
              const pineconeRes = await fetch(`${pineconeHost}/query`, {
                method: 'POST',
                headers: {
                  'Api-Key': pineconeKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  vector: queryVector,
                  topK: 5,
                  includeMetadata: true,
                  namespace: userId || undefined
                })
              });
              if (pineconeRes.ok) {
                const pineconeData = await pineconeRes.json();
                const matches = pineconeData.matches || [];
                if (matches.length > 0) {
                  retrievedContext = "\n\n=== RETRIEVED HISTORY FROM PINECONE (RELEVANT CONTEXT) ===\n" +
                    matches.map(m => `[Log Date: ${m.metadata?.date || 'N/A'} | Type: ${m.metadata?.category || 'N/A'}]\n${m.metadata?.content || ''}`).join('\n\n') +
                    "\n=======================================================\n";
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching Pinecone context:', err);
        }
      }

      let context = buildContext();
      if (retrievedContext) {
        context += retrievedContext;
      }

      if (provider === 'gemini') {
        const chatContents = [];
        const historySlice = updatedMessages.slice(1);
        historySlice.forEach(m => {
          chatContents.push({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          });
        });

        const requestBody = {
          contents: chatContents,
          systemInstruction: { parts: [{ text: context }] }
        };

        // Use streamGenerateContent endpoint for real-time streaming
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          setMessages(prev => prev.map((m, i) => i === botMsgIndex
            ? { role: 'bot', text: `⚠️ Gemini Error: ${errData?.error?.message || res.statusText}`, streaming: false }
            : m));
          setLoading(false);
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let   buffer  = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete last line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const chunk = JSON.parse(jsonStr);
              const token = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (token) {
                setMessages(prev => prev.map((m, i) =>
                  i === botMsgIndex
                    ? { ...m, text: m.text + token }
                    : m
                ));
              }
            } catch (_) { /* malformed chunk — skip */ }
          }
        }

        // Mark streaming as done
        setMessages(prev => prev.map((m, i) =>
          i === botMsgIndex ? { ...m, streaming: false } : m
        ));

      } else {
        // OpenRouter streaming via SSE
        const chatMessages = [{ role: 'system', content: context }];
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
            messages: chatMessages,
            stream: true
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setMessages(prev => prev.map((m, i) => i === botMsgIndex
            ? { role: 'bot', text: `⚠️ OpenRouter Error: ${errData?.error?.message || res.statusText}`, streaming: false }
            : m));
          setLoading(false);
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let   buffer  = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const chunk = JSON.parse(jsonStr);
              const token = chunk?.choices?.[0]?.delta?.content || '';
              if (token) {
                setMessages(prev => prev.map((m, i) =>
                  i === botMsgIndex
                    ? { ...m, text: m.text + token }
                    : m
                ));
              }
            } catch (_) { /* malformed chunk — skip */ }
          }
        }

        setMessages(prev => prev.map((m, i) =>
          i === botMsgIndex ? { ...m, streaming: false } : m
        ));
      }
    } catch (e) {
      setMessages(prev => prev.map((m, i) =>
        i === botMsgIndex
          ? { role: 'bot', text: `⚠️ Connection Error: ${e.message || 'Failed to connect. Check your internet.'}`, streaming: false }
          : m
      ));
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
            bottom: 'calc(95px + env(safe-area-inset-bottom))', 
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
          bottom: 'calc(90px + env(safe-area-inset-bottom))', 
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
                <button onClick={() => setShowKeyInput(false)} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
              </div>
              {activeKeyExists && <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '6px' }}>✅ Key saved!</div>}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  width: msg.role === 'user' ? 'auto' : '100%',
                  maxWidth: msg.role === 'user' ? '85%' : '100%', 
                  padding: '12px 32px 12px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                  color: msg.role === 'user' ? '#000' : 'var(--text)',
                  fontSize: '13px', 
                  lineHeight: 1.5, 
                  whiteSpace: 'pre-wrap',
                  position: 'relative',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)'
                }}>
                  {msg.role === 'user' ? msg.text : renderMessageContent(msg.text)}
                  {!msg.streaming && (
                    <CopyButton text={msg.text} isUser={msg.role === 'user'} />
                  )}
                  {msg.streaming && (
                    <span className="claude-pulse-dot" />
                  )}
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
