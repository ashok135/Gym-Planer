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

  // Build a lowercase lookup so old data with mixed casing still resolves correctly
  const memberSet = new Set(members.map(cleanName));

  const filteredExpenses = (activeGroup.expenses || []).filter(e => getMonthStr(e.timestamp) === selectedMonth);

  const netBalances = {};
  members.forEach(m => { netBalances[cleanName(m)] = 0; });
  let totalGroupSpent = 0;

  filteredExpenses.forEach(e => {
    const amt = Number(e.amount);
    // Normalize participant names so stale mixed-case data still matches
    const rawParticipants = (e.splitWith && e.splitWith.length > 0) ? e.splitWith : members;
    const participants = rawParticipants.map(cleanName).filter(p => memberSet.has(p));
    if (participants.length === 0) return;

    const exactShare = amt / participants.length;
    if (e.type !== 'settlement') totalGroupSpent += amt;

    participants.forEach(p => { netBalances[p] -= exactShare; });

    // Normalize paidBy so a name saved before cleanName was applied still matches
    const payer = cleanName(e.paidBy);
    if (netBalances[payer] !== undefined) netBalances[payer] += amt;
  });

  // Round each balance to 2 decimal places to eliminate floating-point drift
  // before deciding who is a creditor vs debtor
  const creditors = []; const debtors = [];
  Object.entries(netBalances).forEach(([member, balance]) => {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) creditors.push({ member, val: rounded });
    else if (rounded < -0.01) debtors.push({ member, val: Math.abs(rounded) });
  });
  creditors.sort((a, b) => b.val - a.val);
  debtors.sort((a, b) => b.val - a.val);

  // Greedy min-transactions debt simplification
  const simplifiedDebts = [];
  let cIdx = 0, dIdx = 0;
  while (cIdx < creditors.length && dIdx < debtors.length) {
    const cred = creditors[cIdx];
    const debt = debtors[dIdx];
    const settleAmt = Math.round(Math.min(cred.val, debt.val) * 100) / 100;
    if (settleAmt > 0.01) {
      simplifiedDebts.push({ from: debt.member, to: cred.member, amount: settleAmt });
    }
    cred.val = Math.round((cred.val - settleAmt) * 100) / 100;
    debt.val = Math.round((debt.val - settleAmt) * 100) / 100;
    // Only advance an index when that side is truly exhausted
    if (cred.val <= 0.01) cIdx++;
    if (debt.val <= 0.01) dIdx++;
  }
  return { netBalances, simplifiedDebts, totalGroupSpent, filteredExpenses };
};
