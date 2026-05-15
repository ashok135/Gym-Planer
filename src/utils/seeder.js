import { dateKey } from '../data';

export const generateSeedData = () => {
  const DB = {};
  const META = {};
  const BUDGET = {};
  const STUDY = {};

  const start = new Date(2026, 0, 1); // Jan 1, 2026
  const end = new Date(2026, 3, 30);   // Apr 30, 2026

  const CATEGORIES = ['food', 'supps', 'transport', 'entertain', 'outside', 'gym', 'others'];
  const SUBJECTS = ['dsa', 'js', 'react', 'interview'];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dk = dateKey(d);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dow = d.getDay();

    // 1. Gym Data (3-4 times a week)
    if ([1, 2, 4, 5].includes(dow)) {
      const vol = 1500 + Math.random() * 2000;
      DB[dk] = {
        'Chest_0': { s: 3, r: 12, w: 40 + Math.random() * 20, done: true },
        'Triceps_0': { s: 3, r: 15, w: 15 + Math.random() * 10, done: true },
        'Back_0': { s: 3, r: 10, w: 50 + Math.random() * 30, done: true }
      };
      META[dk] = {
        mood: ['🔥', '💪', '🙂', '😐'][Math.floor(Math.random() * 4)],
        energy: Math.floor(Math.random() * 3) + 3,
        status: 'Completed',
        bw: (75 + Math.random() * 2).toFixed(1),
        start: '06:30',
        end: '08:00'
      };
    }

    // 2. Budget Data (2-3 transactions per day)
    if (!BUDGET[mk]) BUDGET[mk] = { entries: [], extraIncome: [] };
    if (Math.random() > 0.3) {
      BUDGET[mk].entries.push({
        id: Math.random().toString(36).substr(2, 9),
        category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
        amount: Math.floor(Math.random() * 500) + 50,
        note: 'Seed data',
        date: dk,
        time: '12:00 PM',
        timestamp: d.getTime()
      });
    }
    // Monthly income on 1st
    if (d.getDate() === 1) {
      BUDGET[mk].extraIncome.push({
        id: 'inc_' + mk,
        label: 'Monthly Bonus',
        amount: 5000,
        date: dk,
        timestamp: d.getTime()
      });
    }

    // 3. Study Data (Daily except Sunday)
    if (dow !== 0) {
      STUDY[dk] = {
        sessions: [
          {
            id: 'study_' + dk,
            subjectId: SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
            hours: (2 + Math.random() * 4).toFixed(1),
            learned: 'Topics covered in ' + dk,
            time: '10:00 AM',
            timestamp: d.getTime()
          }
        ]
      };
    }
  }

  return { DB, META, BUDGET, STUDY };
};
