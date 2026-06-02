export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const cleanName = (name) => (name || '').trim().toLowerCase();
export const getMonthStr = (ts) => new Date(ts).toLocaleString('default', { month: 'long', year: 'numeric' });
export const CURRENT_MONTH = getMonthStr(Date.now());

export const DEFAULT_SPLIT_CATEGORIES = [
  { id: 'food',      label: 'Food & Dining', emoji: '🍕', color: '#FF6B6B' },
  { id: 'rent',      label: 'Rent & Bills',  emoji: '🏠', color: '#4D9FFF' },
  { id: 'transport', label: 'Transport',     emoji: '🚗', color: '#FBBF24' },
  { id: 'groceries', label: 'Groceries',     emoji: '🛒', color: '#34D399' },
  { id: 'entertain', label: 'Entertainment', emoji: '🎮', color: '#A78BFA' },
  { id: 'others',    label: 'Others',        emoji: '📦', color: '#94A3B8' },
];

export const getGroupLedger = (activeGroup, selectedMonth) => {
  if (!activeGroup) return { netBalances: {}, simplifiedDebts: [], totalGroupSpent: 0, filteredExpenses: [] };
  const members = activeGroup.members || [];
  
  const filteredExpenses = (activeGroup.expenses || []).filter(e => getMonthStr(e.timestamp) === selectedMonth);

  const netBalances = {};
  members.forEach(m => { netBalances[m] = 0; });
  let totalGroupSpent = 0;

  filteredExpenses.forEach(e => {
    const amt = Number(e.amount);
    const participants = (e.splitWith && e.splitWith.length > 0) ? e.splitWith : members;
    if (participants.length === 0) return;
    
    const exactShare = amt / participants.length;
    if (e.type !== 'settlement') totalGroupSpent += amt;

    participants.forEach(p => { if (netBalances[p] !== undefined) netBalances[p] -= exactShare; });
    if (netBalances[e.paidBy] !== undefined) netBalances[e.paidBy] += amt;
  });

  const creditors = []; const debtors = [];
  Object.entries(netBalances).forEach(([member, balance]) => {
    if (balance > 0.05) creditors.push({ member, val: balance });
    else if (balance < -0.05) debtors.push({ member, val: Math.abs(balance) });
  });
  creditors.sort((a, b) => b.val - a.val); debtors.sort((a, b) => b.val - a.val);

  const simplifiedDebts = [];
  let cIdx = 0, dIdx = 0;
  while (cIdx < creditors.length && dIdx < debtors.length) {
    const cred = creditors[cIdx]; const debt = debtors[dIdx];
    const settleAmt = Math.min(cred.val, debt.val);
    simplifiedDebts.push({ from: debt.member, to: cred.member, amount: Math.round(settleAmt * 100) / 100 });
    cred.val -= settleAmt; debt.val -= settleAmt;
    if (cred.val < 0.05) cIdx++;
    if (debt.val < 0.05) dIdx++;
  }
  return { netBalances, simplifiedDebts, totalGroupSpent, filteredExpenses };
};
