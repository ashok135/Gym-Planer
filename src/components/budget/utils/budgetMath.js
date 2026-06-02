export const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const getRolloverBalance = (targetMonthKey, BUDGET, BUDGET_SETTINGS) => {
  if (!BUDGET) return 0;
  let rolloverSum = 0;
  const [targetY, targetM] = targetMonthKey.split('-').map(Number);

  Object.entries(BUDGET || {}).forEach(([mk, md]) => {
    const [y, m] = mk.split('-').map(Number);
    if (y < targetY || (y === targetY && m < targetM)) {
      let monthIncome = BUDGET_SETTINGS?.income || 22400;
      (md.extraIncome || []).forEach(i => {
        if (!i.isLoan && !i.label?.toLowerCase().includes('loan')) {
          monthIncome += Number(i.amount);
        }
      });

      let monthSpent = 0;
      (md.entries || []).forEach(e => {
        monthSpent += Number(e.amount);
      });

      rolloverSum += (monthIncome - monthSpent);
    }
  });

  const allKeys = Object.keys(BUDGET || {});
  if (allKeys.length > 0) {
    allKeys.sort();
    const [oldestY, oldestM] = allKeys[0].split('-').map(Number);
    let currY = oldestY;
    let currM = oldestM;
    while (currY < targetY || (currY === targetY && currM < targetM)) {
      const currKey = `${currY}-${String(currM).padStart(2, '0')}`;
      if (!BUDGET[currKey]) {
        rolloverSum += (BUDGET_SETTINGS?.income || 22400);
      }
      currM++;
      if (currM > 12) {
        currM = 1;
        currY++;
      }
    }
  }

  return rolloverSum;
};

export const getFilteredData = (range, isPrevious, selectedMonth, BUDGET, BUDGET_SETTINGS, CATEGORIES, now) => {
  let spent = 0, income = 0;
  const catTotals = {};
  CATEGORIES.forEach(c => { catTotals[c.id] = 0; });
  const rangeEntries = [];

  const offset = isPrevious ? (range === 'Today' ? 1 : range === 'Weekly' ? 7 : range === 'Monthly' ? 30 : 365) : 0;
  const days = range === 'Today' ? 1 : range === 'Weekly' ? 7 : range === 'Monthly' ? 30 : 365;

  let startRange, endRange;
  const [selY, selM] = selectedMonth.split('-').map(Number);

  if (range === 'Monthly') {
    startRange = new Date(selY, selM - 1 - (isPrevious ? 1 : 0), 1);
    endRange = new Date(selY, selM - (isPrevious ? 1 : 0), 0, 23, 59, 59);
  } else if (range === 'Yearly') {
    startRange = new Date(selY - (isPrevious ? 1 : 0), 0, 1);
    endRange = new Date(selY - (isPrevious ? 1 : 0), 11, 31, 23, 59, 59);
  } else {
    startRange = new Date(now);
    startRange.setHours(0, 0, 0, 0);
    startRange.setDate(now.getDate() - offset - days);
    endRange = new Date(now);
    endRange.setHours(23, 59, 59, 999);
    endRange.setDate(now.getDate() - offset);
  }

  Object.entries(BUDGET || {}).forEach(([mk, md]) => {
    (md.entries || []).forEach(e => {
      const d = new Date(e.date);
      if (d >= startRange && d <= endRange) {
        const amt = Number(e.amount);
        spent += amt;
        if (!isPrevious) {
          rangeEntries.push(e);
          catTotals[e.category] = (catTotals[e.category] || 0) + amt;
        }
      }
    });
    (md.extraIncome || []).forEach(i => {
      const d = new Date(i.date);
      if (d >= startRange && d <= endRange) {
        if (!i.isLoan && !i.label?.toLowerCase().includes('loan')) {
          income += Number(i.amount);
        }
      }
    });
  });

  for (let y = startRange.getFullYear(); y <= endRange.getFullYear(); y++) {
    const startM = (y === startRange.getFullYear()) ? startRange.getMonth() : 0;
    const endM = (y === endRange.getFullYear()) ? endRange.getMonth() : 11;
    for (let m = startM; m <= endM; m++) {
      const payoutDate = new Date(y, m, 1);
      if (payoutDate >= startRange && payoutDate <= endRange) {
        income += (BUDGET_SETTINGS?.income || 22400);
      }
    }
  }

  if (range === 'Monthly') {
    const evalMonthKey = monthKey(new Date(selY, selM - 1 - (isPrevious ? 1 : 0), 1));
    if (BUDGET?.[evalMonthKey]?.rolloverClaimed === true) {
      income += getRolloverBalance(evalMonthKey, BUDGET, BUDGET_SETTINGS);
    }
  }

  return { spent, income, catTotals, rangeEntries };
};
