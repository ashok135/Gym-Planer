import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_PLAN, DEFAULT_DIET_PLAN, dateKey, formatFull, getDayVol, DAYS_SHORT, MONTHS } from '../data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, XCircle, Dumbbell, Wallet, GraduationCap, TrendingUp, TrendingDown, Trophy, Calendar, Coins, Sparkles, ChevronDown, Users, AlertTriangle } from 'lucide-react';
import History from './History';
import Budget from './Budget';
import Study from './Study';
import { loadMoodEnergyConfig, DEFAULT_MOOD_STAGES, DEFAULT_ENERGY_STAGES } from './settings/MoodEnergySettings';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{background: 'rgba(17,17,17,0.95)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow)', backdropFilter: 'blur(10px)'}}>
        <p style={{color: 'var(--text)', margin: '0 0 5px 0', fontSize: '12px'}}>{payload[0].payload.date}</p>
        <p style={{color: payload[0].color, margin: 0, fontWeight: 'bold'}}>
          {payload[0].name}: {payload[0].value.toLocaleString()}
          {payload[0].name === 'Volume' ? ' kg' : payload[0].name === 'Time' ? ' mins' : 'g'}
        </p>
      </div>
    );
  }
  return null;
};

export default function Report({ DB, NAMES, META, FOOD, SCHEDULE, BUDGET, BUDGET_SETTINGS, syncBudget, STUDY, STUDY_SETTINGS, syncStudy, workoutPlans, DIET_PLAN }) {
  const [activeGroupId, setActiveGroupId] = useState(BUDGET_SETTINGS?.activeGroupId || '');
  const [sharedGroup, setSharedGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [nickname, setNickname] = useState(localStorage.getItem('gsplit_nickname') || '');
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  // Sync settings when they update
  useEffect(() => {
    setActiveGroupId(BUDGET_SETTINGS?.activeGroupId || '');
  }, [BUDGET_SETTINGS]);

  // Real-time Firestore sync
  useEffect(() => {
    if (!activeGroupId) {
      setSharedGroup(null);
      return;
    }
    setGroupLoading(true);
    const docRef = doc(db, "splitGroups", activeGroupId.toLowerCase().trim());
    const unsub = onSnapshot(docRef, docSnap => {
      setGroupLoading(false);
      if (docSnap.exists()) {
        setSharedGroup(docSnap.data());
      } else {
        setSharedGroup(null);
      }
    }, err => {
      console.error(err);
      setGroupLoading(false);
    });
    return () => unsub();
  }, [activeGroupId]);

  const [activeSection, setActiveSection] = useState('gym');
  const [timeRange, setTimeRange] = useState('Today');
  const [budgetRange, setBudgetRange] = useState('Monthly');
  const [studyRange, setStudyRange] = useState('Weekly');
  const [selectedProgressionExercise, setSelectedProgressionExercise] = useState('Barbell Bench Press');

  // ResizeObserver-based chart width — avoids ResponsiveContainer infinite loop
  const chartAreaRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(300);
  useEffect(() => {
    if (!chartAreaRef.current) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && Math.abs(w - chartWidth) > 2) setChartWidth(Math.floor(w));
    });
    observer.observe(chartAreaRef.current);
    setChartWidth(Math.floor(chartAreaRef.current.getBoundingClientRect().width) || 300);
    return () => observer.disconnect();
  }, []);

  const now = new Date();
  let daysToLookBack = 1;
  if(timeRange === 'Weekly') daysToLookBack = 7;
  if(timeRange === 'Monthly') daysToLookBack = 30;
  if(timeRange === 'Yearly') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    daysToLookBack = Math.max(1, Math.ceil(Math.abs(now - startOfYear) / (1000 * 60 * 60 * 24)));
  }
  
  let totalVol = 0, totalDaysAttended = 0, totalPossibleDays = 0;
  let totalProtein = 0, habitWater = 0, habitSleep = 0, habitJunk = 0;
  let totalMinutesSpent = 0;
  
  const chartData = [];
  const monthlyDataMap = {};
  const prs = {};
  const allExercises = {
    'Abs_0': 'Crunches',
    'Abs_1': 'Leg Raises',
    'Abs_2': 'Plank',
    'Progressive_0': 'Back Squat (Heavy)',
    'Progressive_1': 'Deadlift (Heavy)',
    'Progressive_2': 'Overhead Press (Heavy)',
    'Progressive_3': 'Weighted Pull-ups',
    'Progressive_4': 'Barbell Row (Heavy)',
  };

  const gymMonthsData = [];
  const todayKey = dateKey(now);
  for (let m = 0; m < 12; m++) {
    const monthDays = [];
    const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dk = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const entry = DB[dk] || {};
      const vol = getDayVol(entry);
      const meta = META[dk] || {};
      const status = meta.status || '';
      monthDays.push({ dk, vol, status });
    }
    gymMonthsData.push({ name: MONTHS[m].slice(0, 3), days: monthDays });
  }
  Object.values(workoutPlans).forEach(p => p.muscles.forEach(m => m.exercises.forEach((ex, i) => {
    allExercises[`${m.name}_${i}`] = ex;
  })));
  
  Object.keys(DB).forEach(k => {
    const e = DB[k] || {};
    Object.keys(e).filter(ek => !['meta', 'customName', 'done'].includes(ek)).forEach(ek => {
      const v = e[ek];
      if(v.s && v.r && v.w) {
        const weight = parseFloat(v.w) || 0;
        if(!prs[ek] || weight > prs[ek].w) prs[ek] = { w: weight, date: k };
      }
    });
  });
  
  const prEntries = Object.entries(prs).sort((a,b) => b[1].w - a[1].w).slice(0, 3);
  let todayTotalExercises = 0;
  let todayDoneExercises = 0;

  for(let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dateKey(d);
    totalPossibleDays++;
    const entry = DB[k] || {};
    const vol = getDayVol(entry);
    const m = META[k] || {};
    
    if(timeRange === 'Today') {
      let currentPlanId = d.getDay();
      if (SCHEDULE?.fullTime && SCHEDULE.fullTime[currentPlanId] !== undefined) currentPlanId = SCHEDULE.fullTime[currentPlanId];
      if (SCHEDULE?.thisWeek && SCHEDULE.thisWeek[k] !== undefined) currentPlanId = SCHEDULE.thisWeek[k];

      const plan = (Array.isArray(workoutPlans) ? workoutPlans.find(p => p.id === currentPlanId) : workoutPlans[currentPlanId]) || (Array.isArray(workoutPlans) ? workoutPlans[0] : Object.values(workoutPlans)[0]) || { muscles: [] };
      
      if (plan && plan.muscles) {
        plan.muscles.forEach(mu => {
          mu.exercises.forEach((ex, idx) => {
            todayTotalExercises++;
            const ek = `${mu.name}_${idx}`;
            if(entry[ek] && (entry[ek].done || (entry[ek].s && entry[ek].r && entry[ek].w))) {
              todayDoneExercises++;
            }
          });
        });
      }
      if (m.absEnabled || Object.keys(entry).some(key => key.startsWith('Abs_'))) {
        ['Crunches', 'Leg Raises', 'Plank'].forEach((ex, idx) => {
          todayTotalExercises++;
          const ek = `Abs_${idx}`;
          if(entry[ek] && (entry[ek].done || (entry[ek].s && entry[ek].r && entry[ek].w))) {
            todayDoneExercises++;
          }
        });
      }
      if (m.progressiveEnabled || Object.keys(entry).some(key => key.startsWith('Progressive_'))) {
        ['Back Squat (Heavy)', 'Deadlift (Heavy)', 'Overhead Press (Heavy)', 'Weighted Pull-ups', 'Barbell Row (Heavy)'].forEach((ex, idx) => {
          todayTotalExercises++;
          const ek = `Progressive_${idx}`;
          if(entry[ek] && (entry[ek].done || (entry[ek].s && entry[ek].r && entry[ek].w))) {
            todayDoneExercises++;
          }
        });
      }
    }

    if(vol > 0 || m.status === 'Completed' || m.status === 'Partial') {
      totalDaysAttended++;
    }
    
    let mins = 0;
    if (m.start && m.end) {
      const [sh, sm] = m.start.split(':').map(Number);
      const [eh, em] = m.end.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        totalMinutesSpent += mins;
      }
    }
    
    totalVol += vol;
    const f = FOOD[k] || {};
    let p = 0;
    if(f.items) {
      const dietPlan = DIET_PLAN?.[d.getDay()] || DEFAULT_DIET_PLAN[d.getDay()] || DEFAULT_DIET_PLAN[1];
      dietPlan.forEach(meal => meal.items.forEach(item => {
        const valRaw = f.items[item.id];
        let val = 0;
        if (valRaw === true) val = 3;
        else if (valRaw === false || valRaw === undefined) val = 0;
        else val = Number(valRaw);
        
        if (val > 0) {
          p += (item.p * (val / 3));
        }
      }));
    }
    p = Math.round(p * 100) / 100;
    totalProtein += p;
    if(f.water) habitWater++;
    if(f.sleep) habitSleep++;
    if(f.junk) habitJunk++;
    
    if(timeRange === 'Yearly') {
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if(!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { name: MONTHS[d.getMonth()].substring(0,3), date: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, Volume: 0, Protein: 0, Time: 0 };
      }
      monthlyDataMap[monthKey].Volume += vol;
      monthlyDataMap[monthKey].Protein = Math.round((monthlyDataMap[monthKey].Protein + p) * 100) / 100;
      monthlyDataMap[monthKey].Time += mins;
    } else {
      chartData.push({
        name: timeRange === 'Weekly' ? DAYS_SHORT[d.getDay()] : `${d.getDate()}/${d.getMonth()+1}`,
        date: formatFull(d),
        Volume: vol,
        Protein: p,
        Time: mins
      });
    }
  }
  
  const finalChartData = timeRange === 'Yearly' ? Object.values(monthlyDataMap) : chartData;
  const avgP = totalPossibleDays ? Math.round(totalProtein / totalPossibleDays) : 0;
  const pctWater = totalPossibleDays ? Math.round((habitWater / totalPossibleDays) * 100) : 0;
  const pctSleep = totalPossibleDays ? Math.round((habitSleep / totalPossibleDays) * 100) : 0;
  const pctJunk = totalPossibleDays ? Math.round((habitJunk / totalPossibleDays) * 100) : 0;
  const missedDays = totalPossibleDays - totalDaysAttended;
  const pieData = [
    { name: 'Attended', value: totalDaysAttended, color: 'var(--accent)' },
    { name: 'Missed', value: missedDays, color: 'var(--red)' }
  ];

  const muscleCounts = {};
  const bwData = [];

  for(let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dateKey(d);
    const day = DB[k] || {};
    const meta = META[k] || {};

    Object.keys(day).filter(ek => !['meta', 'customName', 'done'].includes(ek)).forEach(ek => {
      const muscle = ek.split('_')[0];
      muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
    });

    if (meta.bw) {
      bwData.push({ date: k, bw: parseFloat(meta.bw) });
    }
  }

  // Mood & Energy Analytics Correlation Data Prep
  const moodEnergyConfig = loadMoodEnergyConfig();
  const energyStages = moodEnergyConfig?.energy || DEFAULT_ENERGY_STAGES;

  const stageStats = [1, 2, 3, 4, 5].map(lvl => ({
    level: `${lvl}/5`,
    label: energyStages[lvl - 1]?.label || `Lvl ${lvl}`,
    avgVolume: 0,
    count: 0,
    totalVol: 0
  }));

  for(let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = dateKey(d);
    const day = DB[k] || {};
    const meta = META[k] || {};
    const vol = getDayVol(day);

    if (vol > 0 && meta.energy !== undefined && meta.status !== 'Skipped') {
      let val = meta.energy;
      if (typeof val === 'number' && val <= 5) {
        // Already on 1-5 scale
      } else {
        // Map 0-100 to 1-5
        if (val <= 20) val = 1;
        else if (val <= 40) val = 2;
        else if (val <= 60) val = 3;
        else if (val <= 80) val = 4;
        else val = 5;
      }
      const lvlIdx = Math.max(1, Math.min(5, Math.round(val))) - 1;
      stageStats[lvlIdx].totalVol += vol;
      stageStats[lvlIdx].count += 1;
    }
  }

  const correlationData = stageStats.map(stat => ({
    level: stat.level,
    'Avg Volume': stat.count > 0 ? Math.round(stat.totalVol / stat.count) : 0,
    count: stat.count,
    name: stat.level,
    date: stat.label
  }));

  const muscleData = Object.entries(muscleCounts).map(([name, value]) => ({ 
    name, 
    value, 
    color: `hsl(${(Object.keys(muscleCounts).indexOf(name) * 137.5) % 360}, 70%, 60%)` 
  }));
  
  const formatTime = (totalMins) => {
    if (totalMins === 0) return '0 hrs';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hrs`;
    return `${h}h ${m}m`;
  };
  
  const pct = totalPossibleDays ? Math.round((totalDaysAttended / totalPossibleDays) * 100) : 0;
  const pctColor = (timeRange === 'Today') ? (totalDaysAttended > 0 ? 'var(--accent)' : 'var(--red)') : (pct >= 50 ? 'var(--accent)' : 'var(--red)');



  return (
    <div id="report-content" style={{padding:'0 0 20px'}}>
      <div style={{padding:'0 10px 16px', display:'flex', justifyContent:'flex-end'}}>
        
      </div>

      <div style={{padding:'0 10px 4px'}}>
        <div className="ai-title" style={{marginBottom:'16px', fontSize:'32px'}}>Reports</div>
        <div style={{display:'flex', gap:'10px', marginBottom:'24px'}}>
          {['gym', 'budget', 'study'].map(id => (
            <div key={id} onClick={() => setActiveSection(id)}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px 4px', borderRadius:'14px', cursor:'pointer', fontSize:'13px', fontWeight: activeSection === id ? 700 : 400,
                background: activeSection === id ? 'var(--accent)' : 'var(--bg3)',
                color: activeSection === id ? '#000' : 'var(--text2)',
                border: '1px solid var(--border2)', transition:'all 0.2s' }}>
              {id === 'gym' && <Dumbbell size={14} />}
              {id === 'budget' && <Wallet size={14} />}
              {id === 'study' && <GraduationCap size={14} />}
              {id === 'gym' ? 'Gym & Diet' : id === 'budget' ? 'Budget' : 'PrepHub'}
            </div>
          ))}
        </div>
      </div>
      {/* BUDGET SECTION IN REPORT */}
      {activeSection === 'budget' && (() => {
        if (activeGroupId && sharedGroup) {
          const groupMembers = sharedGroup.members || [];
          const groupBills = sharedGroup.months?.[selectedMonth]?.bills || [];
          const totalShared = groupBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

          // Balance calculations
          const balances = {};
          groupMembers.forEach(m => { balances[m] = 0; });
          groupBills.forEach(bill => {
            const totalAmount = Number(bill.amount) || 0;
            const payer = bill.paidBy;
            const splitWith = bill.splitWith || [];
            if (splitWith.length === 0) return;
            const share = totalAmount / splitWith.length;
            if (balances[payer] !== undefined) balances[payer] += totalAmount;
            splitWith.forEach(member => {
              if (balances[member] !== undefined) balances[member] -= share;
            });
          });

          // suggested Settlements Minimization
          const creditors = [];
          const debtors = [];
          Object.entries(balances).forEach(([name, bal]) => {
            const val = Math.round(bal * 100) / 100;
            if (val > 0.01) creditors.push({ name, amount: val });
            else if (val < -0.01) debtors.push({ name, amount: Math.abs(val) });
          });
          creditors.sort((a, b) => b.amount - a.amount);
          debtors.sort((a, b) => b.amount - a.amount);

          const settlements = [];
          let cIdx = 0, dIdx = 0;
          const cTemp = creditors.map(c => ({ ...c }));
          const dTemp = debtors.map(d => ({ ...d }));
          while (cIdx < cTemp.length && dIdx < dTemp.length) {
            const creditor = cTemp[cIdx];
            const debtor = dTemp[dIdx];
            const amountToSettle = Math.min(creditor.amount, debtor.amount);
            if (amountToSettle > 0.01) {
              settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: Math.round(amountToSettle * 100) / 100
              });
            }
            creditor.amount -= amountToSettle;
            debtor.amount -= amountToSettle;
            if (creditor.amount <= 0.01) cIdx++;
            if (debtor.amount <= 0.01) dIdx++;
          }

          // Member total contributions
          const contributions = {};
          groupMembers.forEach(m => { contributions[m] = 0; });
          groupBills.forEach(b => {
            if (contributions[b.paidBy] !== undefined) {
              contributions[b.paidBy] += Number(b.amount) || 0;
            }
          });

          // Spenders Leaderboard Calculations
          let majorContributor = null;
          let maxPaid = -1;
          Object.entries(contributions).forEach(([member, amt]) => {
            if (amt > maxPaid) {
              maxPaid = amt;
              majorContributor = member;
            }
          });

          let owesMost = null;
          let minBalance = 1;
          Object.entries(balances).forEach(([member, bal]) => {
            if (bal < minBalance) {
              minBalance = bal;
              owesMost = member;
            }
          });

          // Category Progression Bars Calculations
          const categoriesList = sharedGroup.categories || [
            { id: 'house', label: 'House', emoji: '🏠', color: '#4D9FFF' },
            { id: 'groceries', label: 'Groceries', emoji: '🍎', color: '#34D399' },
            { id: 'zepto', label: 'Zepto', emoji: '⚡', color: '#FBBF24' },
            { id: 'instamart', label: 'Instamart', emoji: '🛵', color: '#FB923C' },
            { id: 'other', label: 'Other', emoji: '📦', color: '#94A3B8' }
          ];

          const categoryTotals = {};
          categoriesList.forEach(cat => {
            categoryTotals[cat.id] = 0;
          });

          groupBills.forEach(bill => {
            const catId = bill.category || 'other';
            if (categoryTotals[catId] === undefined) {
              categoryTotals[catId] = 0;
            }
            categoryTotals[catId] += Number(bill.amount) || 0;
          });

          // Smart Warnings: Zepto + Instamart Delivery Alert (>35%)
          const zeptoAmt = categoryTotals['zepto'] || 0;
          const instamartAmt = categoryTotals['instamart'] || 0;
          const convenienceTotal = zeptoAmt + instamartAmt;
          const conveniencePct = totalShared > 0 ? Math.round((convenienceTotal / totalShared) * 100) : 0;

          // List of available months for selector
          const availableMonths = [];
          const monthTemp = new Date(now);
          for (let i = 0; i < 6; i++) {
            const key = `${monthTemp.getFullYear()}-${String(monthTemp.getMonth() + 1).padStart(2, '0')}`;
            availableMonths.push({
              key,
              label: `${MONTHS[monthTemp.getMonth()]} ${monthTemp.getFullYear()}`
            });
            monthTemp.setMonth(monthTemp.getMonth() - 1);
          }

          return (
            <div style={{ padding: '0 10px' }}>
              {/* 🏡 Collaborative Group Shared Report Dashboard */}
              <div className="scroll-reveal" style={{ 
                marginBottom: '24px', 
                background: 'linear-gradient(135deg, rgba(200,241,53,0.06), rgba(77,159,255,0.04))', 
                borderRadius: '24px', 
                padding: '24px', 
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="dash-glow accent" style={{ opacity: 0.08 }}></div>
                
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '10px', 
                      background: 'rgba(200,241,53,0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid rgba(200,241,53,0.2)'
                    }}>
                      <Users size={18} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                        {sharedGroup.groupName || 'Shared Ledger'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                        ID: {sharedGroup.id}
                      </div>
                    </div>
                  </div>
                  
                  {/* Month Dropdown Selector */}
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        appearance: 'none',
                        background: 'var(--bg3)',
                        border: '1px solid var(--border2)',
                        color: 'var(--text)',
                        padding: '6px 28px 6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {availableMonths.map(m => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} />
                  </div>
                </div>

                {groupBills.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: 'var(--text3)', 
                    padding: '36px 16px', 
                    fontSize: '13px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border2)'
                  }}>
                    <Sparkles size={20} color="var(--text3)" style={{ marginBottom: '8px', opacity: 0.6 }} />
                    <div>No shared bills logged for this month yet.</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>Add split bills in the Budget tab to populate real-time shared reports.</div>
                  </div>
                ) : (
                  <div>
                    {/* Key Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ background: 'var(--bg3)', padding: '16px 14px', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shared Monthly Spend</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent)', marginTop: '6px' }}>
                          ₹{totalShared.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg3)', padding: '16px 14px', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group Size</div>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {groupMembers.length}
                          <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 'normal' }}>friends</span>
                        </div>
                      </div>
                    </div>

                    {/* 🏆 SPENDERS LEADERBOARD */}
                    <div style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border2)', 
                      borderRadius: '18px', 
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Trophy size={14} color="var(--orange)" /> Room Spenders Leaderboard
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Major Contributor Card */}
                        <div style={{ 
                          background: 'rgba(200,241,53,0.03)', 
                          border: '1px solid rgba(200,241,53,0.1)', 
                          borderRadius: '14px', 
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px' }}>🏆</span>
                            <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Major Payer</span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                            {majorContributor === nickname ? 'You' : majorContributor || 'None'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
                            Paid ₹{(maxPaid > -1 ? maxPaid : 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Owes the Most Card */}
                        <div style={{ 
                          background: 'rgba(244,63,94,0.03)', 
                          border: '1px solid rgba(244,63,94,0.1)', 
                          borderRadius: '14px', 
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px' }}>💸</span>
                            <span style={{ fontSize: '10px', color: 'var(--red)', fontWeight: 800, textTransform: 'uppercase' }}>Owes Most</span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                            {owesMost === nickname ? 'You' : owesMost || 'None'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
                            Net: {minBalance < 0 ? `-₹${Math.abs(Math.round(minBalance)).toLocaleString()}` : '₹0'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 📊 CATEGORY PROGRESSION BARS */}
                    <div style={{ 
                      background: 'rgba(0,0,0,0.12)', 
                      padding: '18px', 
                      borderRadius: '18px', 
                      border: '1px solid var(--border2)', 
                      marginBottom: '20px' 
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '14px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={14} color="var(--accent)" /> Shared Spending by Category
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {categoriesList.map(cat => {
                          const amt = categoryTotals[cat.id] || 0;
                          const pct = totalShared > 0 ? Math.round((amt / totalShared) * 100) : 0;
                          if (amt === 0) return null;
                          
                          return (
                            <div key={cat.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '14px' }}>{cat.emoji || '📦'}</span>
                                  <strong>{cat.label}</strong>
                                </span>
                                <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>
                                  ₹{amt.toLocaleString()} <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 'normal', marginLeft: '2px' }}>({pct}%)</span>
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: `${pct}%`, 
                                  height: '100%', 
                                  background: cat.color || '#94A3B8', 
                                  borderRadius: '4px',
                                  transition: 'width 0.8s ease-out'
                                }}></div>
                              </div>
                            </div>
                          );
                        })}
                        {Object.values(categoryTotals).every(v => v === 0) && (
                          <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', padding: '8px 0' }}>
                            All logged expenses are uncategorized.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 🚨 SMART SPENDING ALERT BANNER */}
                    {convenienceTotal > 0 && (
                      <div style={{ 
                        background: conveniencePct > 35 ? 'rgba(244,63,94,0.05)' : 'rgba(52,211,153,0.05)', 
                        border: conveniencePct > 35 ? '1px solid rgba(244,63,94,0.15)' : '1px solid rgba(52,211,153,0.15)', 
                        borderRadius: '18px', 
                        padding: '16px', 
                        marginBottom: '20px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px', 
                          background: conveniencePct > 35 ? 'rgba(244,63,94,0.1)' : 'rgba(52,211,153,0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {conveniencePct > 35 ? (
                            <AlertTriangle size={16} color="var(--red)" />
                          ) : (
                            <CheckCircle2 size={16} color="var(--accent)" />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: conveniencePct > 35 ? 'var(--red)' : 'var(--accent)', marginBottom: '3px' }}>
                            {conveniencePct > 35 ? 'High Convenience Store Spend Warning' : 'Smart Convenience Control'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.4 }}>
                            {conveniencePct > 35 ? (
                              <>
                                Zepto ⚡ & Instamart 🛵 deliveries account for <strong style={{ color: 'var(--red)' }}>{conveniencePct}%</strong> of all group expenses (₹{convenienceTotal.toLocaleString()}). Consolidating grocery orders to reduce checkout markups and delivery fees can save the group significant cash!
                              </>
                            ) : (
                              <>
                                Shared Zepto ⚡ & Instamart 🛵 convenience delivery orders are well-managed at only <strong>{conveniencePct}%</strong> of total shared spending. Awesome job keeping convenience premiums minimal!
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Member Paid Contributions Detail List */}
                    <div style={{ background: 'rgba(0,0,0,0.12)', padding: '18px', borderRadius: '18px', border: '1px solid var(--border2)', marginBottom: '20px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '14px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Coins size={14} color="var(--accent)" /> Contributions & Balances
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {groupMembers.map(m => {
                          const paidAmt = contributions[m] || 0;
                          const bal = Math.round((balances[m] || 0) * 100) / 100;
                          const isOwed = bal > 0.01;
                          const owes = bal < -0.01;
                          
                          return (
                            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                                  {m === nickname ? '👥 You' : m}
                                </span>
                                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                                  Paid: ₹{paidAmt.toLocaleString()}
                                </div>
                              </div>
                              <span style={{ 
                                fontSize: '13px',
                                fontWeight: 900, 
                                color: isOwed ? 'var(--accent)' : owes ? 'var(--red)' : 'var(--text3)'
                              }}>
                                {isOwed ? `+₹${bal.toLocaleString()}` : owes ? `-₹${Math.abs(bal).toLocaleString()}` : 'Settled'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Suggested Dues Settlements Plan */}
                    {settlements.length > 0 && (
                      <div style={{ 
                        background: 'linear-gradient(145deg, rgba(200,241,53,0.05), rgba(77,159,255,0.03))', 
                        padding: '18px', 
                        borderRadius: '18px', 
                        border: '1px solid rgba(200,241,53,0.12)' 
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '10px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={14} color="var(--accent)" /> Repayment Settlements Plan
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {settlements.map((s, idx) => (
                            <div key={idx} style={{ 
                              fontSize: '12px', 
                              color: 'var(--text)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              background: 'rgba(0,0,0,0.1)',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              border: '1px solid var(--border2)'
                            }}>
                              <span style={{ fontSize: '14px' }}>👉</span>
                              <span>
                                <strong>{s.from === nickname ? 'You need to transfer' : `${s.from} pays`}</strong> {s.to === nickname ? 'You' : s.to} <strong style={{ color: 'var(--accent)' }}>₹{s.amount.toLocaleString()}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 📑 Detailed Ledger Section Header */}
              <div style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} /> Shared Ledger Breakdown
              </div>
              
              <Budget BUDGET={BUDGET} syncBudget={syncBudget} BUDGET_SETTINGS={BUDGET_SETTINGS} isReport={true} activeRange={budgetRange} />
            </div>
          );
        } else {
          // Render original/local single user budget report (the existing code) with a Collaborative CTA Callout
          const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const selectedMonthData = BUDGET?.[currentMonthKey] || {};
          const groupMembers = selectedMonthData.groupMembers || ['You', 'Aman', 'Kabir', 'Rohit'];
          const groupBills = selectedMonthData.groupBills || [];
          
          return (
            <div style={{ padding: '0 10px' }}>
              {/* 🚀 GPAY COLLABORATIVE CTA CALLOUT */}
              <div className="scroll-reveal" style={{ 
                background: 'linear-gradient(135deg, rgba(200,241,53,0.08), rgba(77,159,255,0.04))', 
                border: '1px solid rgba(200,241,53,0.15)', 
                borderRadius: '20px', 
                padding: '16px', 
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(200,241,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={20} color="var(--accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)' }}>Go Collaborative!</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px', lineHeight: 1.3 }}>
                    Connect a real-time collaborative GPay-style group split in the <strong>Budget</strong> section to sync bills with friends and unlock detailed shared spender reports, net dues transfer plans, and high-convenience app alerts!
                  </div>
                </div>
              </div>

              {/* 👥 GROUP SPLIT REPORT CARD */}
              <div className="scroll-reveal" style={{ 
                marginBottom: '24px', 
                background: 'linear-gradient(135deg, rgba(200,241,53,0.05), rgba(77,159,255,0.03))', 
                borderRadius: '24px', 
                padding: '20px', 
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Users size={18} color="var(--accent)" />
                  <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Monthly Shared Expenses Report (Local Preview)
                  </div>
                </div>

                {groupBills.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: 'var(--text3)', 
                    padding: '24px 0', 
                    fontSize: '12px',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border2)'
                  }}>
                    No group shared bills logged for {MONTHS[now.getMonth()]} {now.getFullYear()} yet.
                  </div>
                ) : (() => {
                  const totalShared = groupBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
                  
                  // Balance calculations
                  const balances = {};
                  groupMembers.forEach(m => { balances[m] = 0; });
                  groupBills.forEach(bill => {
                    const totalAmount = Number(bill.amount) || 0;
                    const payer = bill.paidBy;
                    const splitWith = bill.splitWith || [];
                    if (splitWith.length === 0) return;
                    const share = totalAmount / splitWith.length;
                    if (balances[payer] !== undefined) balances[payer] += totalAmount;
                    splitWith.forEach(member => {
                      if (balances[member] !== undefined) balances[member] -= share;
                    });
                  });

                  // suggested Settlements Minimization
                  const creditors = [];
                  const debtors = [];
                  Object.entries(balances).forEach(([name, bal]) => {
                    const val = Math.round(bal * 100) / 100;
                    if (val > 0.01) creditors.push({ name, amount: val });
                    else if (val < -0.01) debtors.push({ name, amount: Math.abs(val) });
                  });
                  creditors.sort((a, b) => b.amount - a.amount);
                  debtors.sort((a, b) => b.amount - a.amount);

                  const settlements = [];
                  let cIdx = 0, dIdx = 0;
                  const cTemp = creditors.map(c => ({ ...c }));
                  const dTemp = debtors.map(d => ({ ...d }));
                  while (cIdx < cTemp.length && dIdx < dTemp.length) {
                    const creditor = cTemp[cIdx];
                    const debtor = dTemp[dIdx];
                    const amountToSettle = Math.min(creditor.amount, debtor.amount);
                    if (amountToSettle > 0.01) {
                      settlements.push({
                        from: debtor.name,
                        to: creditor.name,
                        amount: Math.round(amountToSettle * 100) / 100
                      });
                    }
                    creditor.amount -= amountToSettle;
                    debtor.amount -= amountToSettle;
                    if (creditor.amount <= 0.01) cIdx++;
                    if (debtor.amount <= 0.01) dIdx++;
                  }

                  // Member total contributions
                  const contributions = {};
                  groupMembers.forEach(m => { contributions[m] = 0; });
                  groupBills.forEach(b => {
                    if (contributions[b.paidBy] !== undefined) {
                      contributions[b.paidBy] += Number(b.amount) || 0;
                    }
                  });

                  return (
                    <div>
                      {/* Summary row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--bg3)', padding: '14px 12px', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Total Shared Spend</div>
                          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)', marginTop: '4px' }}>
                            ₹{totalShared.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ background: 'var(--bg3)', padding: '14px 12px', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Group Members</div>
                          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', marginTop: '4px' }}>
                            {groupMembers.length}
                          </div>
                        </div>
                      </div>

                      {/* Member Contributions bar graph style list */}
                      <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border2)', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>
                          Total Paid by Member
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {groupMembers.map(m => {
                            const spentAmt = contributions[m] || 0;
                            const pct = totalShared > 0 ? Math.round((spentAmt / totalShared) * 100) : 0;
                            
                            return (
                              <div key={m}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>
                                  <span>{m === 'You' ? '👥 You' : m}</span>
                                  <span style={{ fontWeight: 'bold' }}>₹{spentAmt.toLocaleString()} ({pct}%)</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ 
                                    width: `${pct}%`, 
                                    height: '100%', 
                                    background: m === 'You' ? 'var(--accent)' : 'var(--blue)', 
                                    borderRadius: '3px' 
                                  }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Net Balances List */}
                      <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border2)', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>
                          Outstanding Net Dues
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {groupMembers.map(m => {
                            const bal = Math.round((balances[m] || 0) * 100) / 100;
                            const isOwed = bal > 0.01;
                            const owes = bal < -0.01;
                            
                            return (
                              <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{m === 'You' ? 'You' : m}</span>
                                <span style={{ 
                                  fontWeight: 800, 
                                  color: isOwed ? 'var(--accent)' : owes ? 'var(--red)' : 'var(--text3)'
                                }}>
                                  {isOwed ? `+₹${bal.toLocaleString()}` : owes ? `-₹${Math.abs(bal).toLocaleString()}` : 'Settled'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Suggested Dues Settlements suggestions */}
                      {settlements.length > 0 && (
                        <div style={{ background: 'rgba(200,241,53,0.03)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(200,241,53,0.1)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>
                            Suggested Transfers to Settle Group
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {settlements.map((s, idx) => (
                              <div key={idx} style={{ fontSize: '12px', color: 'var(--text)' }}>
                                • <strong>{s.from === 'You' ? 'You need to pay' : `${s.from} needs to pay`}</strong> {s.to === 'You' ? 'You' : s.to} <strong style={{ color: 'var(--accent)' }}>₹{s.amount.toLocaleString()}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div style={{ height: '20px' }}></div>
              </div>

              <div style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Detailed Monthly Breakdown
              </div>
              
              <Budget BUDGET={BUDGET} syncBudget={syncBudget} BUDGET_SETTINGS={BUDGET_SETTINGS} isReport={true} activeRange={budgetRange} />
            </div>
          );
        }
      })()}

      {/* STUDY SECTION IN REPORT */}
      {activeSection === 'study' && (
        <div style={{ padding: '0 10px' }}>
          <Study STUDY={STUDY} syncStudy={syncStudy} STUDY_SETTINGS={STUDY_SETTINGS} isReport={true} activeRange={studyRange} />
        </div>
      )}

      {activeSection === 'gym' && (
        <div style={{padding:'0 10px'}}>
          <div className="ai-dash-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom:'20px'}}>
            <div>
              <div className="greeting">Performance</div>
              <div className="ai-title">Gym & Diet</div>
            </div>
            <div style={{display: 'flex', background: 'var(--bg3)', borderRadius: '20px', padding: '4px'}}>
              {['Today', 'Weekly', 'Monthly', 'Yearly'].map(tr => (
                <div key={tr} onClick={() => setTimeRange(tr)}
                  style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '16px', cursor: 'pointer',
                    background: timeRange === tr ? 'var(--accent)' : 'transparent',
                    color: timeRange === tr ? '#000' : 'var(--text2)',
                    fontWeight: timeRange === tr ? 'bold' : 'normal', transition: 'all 0.2s' }}>
                  {tr}
                </div>
              ))}
            </div>
          </div>
          
          <div className="dash-grid" style={{marginBottom:'24px'}}>
            <div className="dash-card" style={{background: 'linear-gradient(135deg, var(--bg3), var(--bg2))'}}>
              <div className="dash-glow accent"></div>
              <div className="dash-val" style={{color: pctColor}}>{pct}%</div>
              <div className="dash-label">Consistency Score</div>
              <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                {totalDaysAttended} days finished / {totalPossibleDays} total
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-val">{(totalVol/1000).toFixed(1)}t</div>
              <div className="dash-label">Total Volume</div>
              <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                Avg: {(totalVol / (totalDaysAttended || 1) / 1000).toFixed(1)}t per session
              </div>
            </div>
            {timeRange === 'Today' && (
              <div className="dash-card">
                <div className="dash-val" style={{color: todayDoneExercises >= todayTotalExercises ? 'var(--accent)' : 'var(--orange)'}}>
                  {todayDoneExercises}<span style={{fontSize:'12px', color:'var(--text3)'}}>/{todayTotalExercises}</span>
                </div>
                <div className="dash-label">Exercises Done</div>
                <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                  {Math.round((todayDoneExercises / (todayTotalExercises || 1)) * 100)}% completion
                </div>
              </div>
            )}
            <div className="dash-card">
              <div className="dash-val" style={{color: 'var(--blue)'}}>{formatTime(totalMinutesSpent)}</div>
              <div className="dash-label">Time Invested</div>
              <div style={{fontSize: '10px', color: 'var(--text3)', marginTop: '4px'}}>
                {timeRange} cumulative duration
              </div>
            </div>
          </div>

          {/* Gym Activity Heatmap Card */}
          <div className="dash-card full" style={{ margin: '0 0 24px 0', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>Gym Activity Heatmap</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{now.getFullYear()} Calendar</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', background: 'var(--bg3)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border2)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {gymMonthsData.map(m => (
                <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 'fit-content' }}>
                  <div style={{ fontSize: '8px', color: 'var(--text3)', textAlign: 'center' }}>{m.name}</div>
                  <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '2.5px' }}>
                    {m.days.map(d => {
                      let bgColor = 'rgba(255,255,255,0.05)';
                      if (d.status === 'Skipped') {
                        bgColor = 'rgba(255, 77, 77, 0.4)'; // Red for skipped
                      } else if (d.status === 'Completed' || d.status === 'Partial' || d.vol > 0) {
                        bgColor = `rgba(200, 241, 53, ${Math.min(1, 0.3 + (d.vol / 5000))})`; // Green/accent for completed
                      }
                      return (
                        <div key={d.dk} style={{ 
                          width: '7px', height: '7px', borderRadius: '1px', 
                          background: bgColor,
                          border: d.dk === todayKey ? '1px solid var(--accent)' : 'none'
                        }} title={`${d.dk}: ${d.vol > 0 ? d.vol.toLocaleString() + ' kg' : d.status || 'No session'}`} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '10px', color: 'var(--text3)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'rgba(255,255,255,0.05)' }}></div> Empty/Rest</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'rgba(255, 77, 77, 0.4)' }}></div> Skipped</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'rgba(200, 241, 53, 0.5)' }}></div> Active</div>
            </div>
          </div>

          <div className="dash-grid">
            <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', borderColor: 'var(--border2)'}}>
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div><div className="dash-val" style={{fontSize: '18px'}}>Consistency</div><div className="dash-label">{timeRange} Attendance</div></div>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: pctColor}}>{pct}%</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px'}}>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)'}}><CheckCircle2 size={16} color="var(--accent)"/> {totalDaysAttended} Present</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2)'}}><XCircle size={16} color="var(--red)"/> {missedDays} Absent</div>
                  </div>
                  {timeRange !== 'Today' && (
                    <div style={{width: '90px', height: '90px'}}>
                      <PieChart width={90} height={90}>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={45} stroke="none" cornerRadius={10} paddingAngle={5}>
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', position: 'relative'}}>
                <div className="dash-glow" style={{background: 'var(--orange)', opacity: 0.05, top: 0, right: 0}}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div><div className="dash-val" style={{fontSize: '18px', color: 'var(--orange)'}}>Workout Time</div><div className="dash-label">{timeRange} Timing Trend</div></div>
                  <div style={{textAlign:'right'}}><div className="dash-val" style={{fontSize:'18px', color: 'var(--orange)'}}>{formatTime(totalDaysAttended > 0 ? Math.round(totalMinutesSpent / totalDaysAttended) : 0)}</div><div className="dash-label">Avg Session</div></div>
                </div>
                {timeRange !== 'Today' ? (
                  <div ref={chartAreaRef} style={{width: '100%', height: '100px', marginTop: '16px'}}>
                    <AreaChart width={chartWidth} height={100} data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--orange)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--orange)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Time" stroke="var(--orange)" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" activeDot={{r: 6, fill: 'var(--orange)', stroke: '#000', strokeWidth: 2}} />
                    </AreaChart>
                  </div>
                ) : (
                  <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--orange)', marginTop:'24px', textAlign:'center'}}>{formatTime(totalMinutesSpent)}</div>
                )}
              </div>
            </div>
 
            {timeRange !== 'Today' && (
              <>
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block'}}>
                  <div className="dash-val" style={{fontSize: '18px'}}>Progressive Overload</div>
                  <div className="dash-label">{timeRange} Volume Trend</div>
                  <div style={{width: '100%', height: '220px', marginTop:'20px'}}>
                    <BarChart width={chartWidth} height={220} data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--border2)', opacity: 0.4}} />
                      <Bar dataKey="Volume" fill="var(--accent)" radius={[8, 8, 8, 8]} maxBarSize={timeRange === 'Monthly' ? 8 : 30} />
                    </BarChart>
                  </div>
                </div>
 
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block'}}>
                  <div className="dash-val" style={{fontSize: '18px', color: 'var(--blue)'}}>Nutrition Tracking</div>
                  <div className="dash-label">{timeRange} Protein Intake (g)</div>
                  <div style={{width: '100%', height: '180px', marginTop: '20px'}}>
                    <AreaChart width={chartWidth} height={180} data={finalChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Protein" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorProtein)" />
                    </AreaChart>
                  </div>
                </div>
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block'}}>
                  <div className="dash-val" style={{fontSize: '18px', color: 'var(--accent)'}}>Energy vs. Performance</div>
                  <div className="dash-label">Correlation: Average Workout Volume (kg) by Energy Level</div>
                  <div style={{width: '100%', height: '180px', marginTop: '20px'}}>
                    <BarChart width={chartWidth} height={180} data={correlationData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="level" tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10, fill: 'var(--text2)'}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--border2)', opacity: 0.2}} />
                      <Bar dataKey="Avg Volume" fill="var(--accent)" radius={[8, 8, 8, 8]} maxBarSize={30} />
                    </BarChart>
                  </div>
                </div>

                {/* Muscle Focus and Bodyweight Trend removed as requested */}
              </>
            )}

            {timeRange === 'Today' && (
              <>
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block', borderColor: 'var(--accent)'}}>
                  <div className="dash-glow accent" style={{opacity: 0.1}}></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div><div className="dash-val" style={{fontSize: '18px'}}>Workout Progress</div><div className="dash-label">Completed Exercises</div></div>
                    <div style={{textAlign:'right'}}><div className="dash-val" style={{fontSize:'24px', color:'var(--accent)'}}>{todayDoneExercises} <span style={{fontSize:'16px', color:'var(--text2)'}}>/ {todayTotalExercises}</span></div></div>
                  </div>
                  <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden', marginTop: '16px'}}>
                    <div style={{width: `${todayTotalExercises > 0 ? Math.round((todayDoneExercises/todayTotalExercises)*100) : 0}%`, height: '100%', background: 'var(--accent)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
                  </div>
                </div>
                <div className="dash-card full" style={{background: 'var(--bg3)', padding: '10px', display: 'block', borderColor: 'rgba(77,159,255,0.2)'}}>
                  <div className="dash-glow blue" style={{opacity: 0.1}}></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div><div className="dash-val" style={{fontSize: '18px', color: 'var(--blue)'}}>Protein Goal</div><div className="dash-label">Consumed Today</div></div>
                    <div style={{textAlign:'right'}}><div className="dash-val" style={{fontSize:'24px', color:'var(--blue)'}}>{Math.round(totalProtein * 100) / 100}g <span style={{fontSize:'16px', color:'var(--text2)'}}>/ 100g</span></div></div>
                  </div>
                  <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden', marginTop: '16px'}}>
                    <div style={{width: `${Math.min(100, Math.round((totalProtein/100)*100))}%`, height: '100%', background: 'var(--blue)', transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
                  </div>
                </div>
              </>
            )}
            
            <div className="dash-card full" style={{display: 'block'}}>
              <div className="dash-val" style={{fontSize:'18px', marginBottom: '16px'}}>Habit Consistency</div>
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                {[
                  { label: '💧 Water Habit', color: 'var(--blue)', pct: pctWater },
                  { label: '😴 Sleep Habit', color: 'var(--accent)', pct: pctSleep },
                  { label: '🚫 No Junk Habit', color: 'var(--red)', pct: pctJunk },
                ].map(h => (
                  <div key={h.label}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'var(--text2)', marginBottom:'6px'}}>
                      <span>{h.label}</span><span style={{color:h.color,fontWeight:'bold'}}>{h.pct}%</span>
                    </div>
                    <div style={{width: '100%', height: '8px', background: 'var(--border2)', borderRadius: '10px', overflow: 'hidden'}}>
                      <div style={{width: `${h.pct}%`, height: '100%', background: h.color, transition: 'width 1s ease-out', borderRadius: '10px'}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


          <div style={{marginTop: '40px'}}>
            <div className="dash-val" style={{fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}><Trophy size={18} style={{ color: 'var(--orange)' }} /> Hall of Fame</div>
            <div className="dash-card full" style={{background: 'linear-gradient(145deg, var(--bg3), var(--bg2))', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', display:'block'}}>
              <div className="dash-glow accent" style={{opacity: 0.15}}></div>
              <div className="dash-label" style={{marginBottom: '16px'}}>Top 3 All-Time Heaviest Lifts</div>
              <div className="pr-list" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {prEntries.length ? prEntries.map(([ek, v], idx) => {
                  const name = NAMES[Object.keys(NAMES).find(k => k.endsWith('_' + ek))] || (allExercises[ek] || ek);
                  return (
                    <div key={ek} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={{width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? 'rgba(200, 241, 53, 0.2)' : 'var(--bg)', color: idx === 0 ? 'var(--accent)' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'}}>{idx + 1}</div>
                        <span style={{color: 'var(--text)', fontSize: '14px', fontWeight: 500}}>{name}</span>
                      </div>
                      <span style={{fontWeight: 700, color: 'var(--accent)', fontSize: '16px'}}>{v.w} kg</span>
                    </div>
                  );
                }) : <div style={{textAlign: 'center', color: 'var(--text2)', fontSize: '13px', padding: '20px 0'}}>Log workouts to build your Hall of Fame!</div>}
              </div>
            </div>
          </div>

          <div style={{marginTop: '40px'}}>
            <div className="dash-val" style={{fontSize: '18px', marginBottom: '16px'}}>Workout History</div>
            <History DB={DB} NAMES={NAMES} META={META} FOOD={FOOD} SCHEDULE={SCHEDULE} workoutPlans={workoutPlans} />
          </div>
          <div style={{height:'40px'}}></div>
        </div>
      )}
    </div>
  );
}
