import React, { useState } from 'react';
import { dateKey } from '../../data';
import { ProteinRing } from './ProteinRing';
import { HabitGrid } from './HabitGrid';
import { MealBlocks } from './MealBlocks';

export default function DietLog({ FOOD, syncData, DB, NAMES, META, profileInfo, DIET_PLAN }) {
  const today      = new Date();
  const dow        = today.getDay();
  const key        = dateKey(today);

  const dietPlan   = DIET_PLAN?.[dow] || [];
  const saved      = FOOD[key] || { items: {}, water: 0, sleep: 0, junk: 0, custom: {} };

  const [renameBox, setRenameBox]     = useState(null);
  const [renameInput, setRenameInput] = useState('');

  const getVal = (v) => {
    if (v === true)  return 3;
    if (v === false || v === undefined) return 0;
    return Number(v);
  };

  const toggleRename = (id, currentName) => {
    setRenameBox(renameBox === id ? null : id);
    setRenameInput(currentName);
  };

  const saveRename = (id) => {
    if (!renameInput.trim()) return;
    const newFood = { ...FOOD };
    if (!newFood[key]) newFood[key] = { items: {}, water: 0, sleep: 0, junk: 0, custom: {} };
    if (!newFood[key].custom) newFood[key].custom = {};
    newFood[key].custom[id] = renameInput.trim();
    syncData(DB, NAMES, META, newFood);
    setRenameBox(null);
  };

  const handleCheck = (id, newVal) => {
    const newFood = { ...FOOD };
    if (!newFood[key]) newFood[key] = { items: {}, water: 0, sleep: 0, junk: 0, custom: {} };
    if (!newFood[key].items) newFood[key].items = {};
    newFood[key].items[id] = newVal;
    syncData(DB, NAMES, META, newFood);
  };

  const handleHabit = (type, newVal) => {
    const newFood = { ...FOOD };
    if (!newFood[key]) newFood[key] = { items: {}, water: 0, sleep: 0, junk: 0, custom: {} };
    newFood[key][type] = newVal;
    syncData(DB, NAMES, META, newFood);
  };

  let totalP = 0;
  dietPlan.forEach(meal => {
    (meal.items || []).forEach(item => {
      if (saved.items) {
        const val = getVal(saved.items[item.id]);
        if (val > 0) totalP += (item.p * (val / 3));
      }
    });
  });
  totalP = Math.round(totalP);

  const proteinTarget = Number(profileInfo?.dailyProteinTarget || 100);
  const waterTarget   = Number(profileInfo?.dailyWaterTarget   || 4);
  const sleepTarget   = Number(profileInfo?.dailySleepTarget   || 8);
  const pct           = Math.min(100, Math.round((totalP / proteinTarget) * 100));

  return (
    <div id="food-content" style={{ padding: '0 0 20px' }}>
      <ProteinRing 
        totalP={totalP} 
        proteinTarget={proteinTarget} 
        pct={pct} 
      />

      <HabitGrid 
        saved={saved} 
        getVal={getVal} 
        handleHabit={handleHabit} 
        waterTarget={waterTarget} 
        sleepTarget={sleepTarget} 
      />

      <MealBlocks 
        dietPlan={dietPlan} 
        saved={saved} 
        getVal={getVal} 
        handleCheck={handleCheck} 
        renameBox={renameBox} 
        toggleRename={toggleRename} 
        renameInput={renameInput} 
        setRenameInput={setRenameInput} 
        saveRename={saveRename} 
      />

      <div style={{ height: '20px' }} />
    </div>
  );
}
