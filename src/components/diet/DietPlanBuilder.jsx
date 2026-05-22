import React, { useState, useCallback } from 'react';
import { DAYS_FULL } from '../../data';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, RotateCcw, Pencil, Utensils } from 'lucide-react';

// ---------- tiny helpers ----------
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const MEAL_SUGGESTIONS = [
  'Morning', 'Mid-Morning', 'Lunch', 'Pre-Workout',
  'Post-Workout', 'Evening Snack', 'Dinner', 'Night Snack'
];

const FOOD_SUGGESTIONS = [
  { name: '3 Eggs (Boiled/Omelette)', p: 18 },
  { name: '2 Bananas', p: 2 },
  { name: 'Oats with Milk', p: 10 },
  { name: '100g Chicken Breast', p: 31 },
  { name: '100g Paneer', p: 18 },
  { name: '50g Soya Chunks', p: 26 },
  { name: 'Dal / Sambar (1 bowl)', p: 6 },
  { name: '300g Cooked Rice', p: 8 },
  { name: 'Chapati (2 pcs)', p: 6 },
  { name: '1 Cup Curd', p: 5 },
  { name: 'Peanuts (handful)', p: 7 },
  { name: 'Whey Protein Shake', p: 24 },
  { name: 'Black Coffee', p: 0 },
  { name: '1 Apple', p: 0 },
  { name: 'Mixed Veg Salad', p: 2 },
];

// Day tab labels
const DAY_TABS = [
  { dow: 1, short: 'Mon', full: 'Monday' },
  { dow: 2, short: 'Tue', full: 'Tuesday' },
  { dow: 3, short: 'Wed', full: 'Wednesday' },
  { dow: 4, short: 'Thu', full: 'Thursday' },
  { dow: 5, short: 'Fri', full: 'Friday' },
  { dow: 6, short: 'Sat', full: 'Saturday' },
  { dow: 0, short: 'Sun', full: 'Sunday' },
];

// ---------- sub-components ----------

function FoodItemRow({ item, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [protein, setProtein] = useState(String(item.p));
  const [showSugg, setShowSugg] = useState(false);

  const save = () => {
    onUpdate({ ...item, name: name.trim() || item.name, p: Number(protein) || 0 });
    setEditing(false);
    setShowSugg(false);
  };

  if (!editing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', background: 'var(--bg)', borderRadius: '12px',
        marginBottom: '8px', border: '1px solid var(--border2)'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{item.name}</div>
          {item.p > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>{item.p}g protein</div>
          )}
        </div>
        <button onClick={() => setEditing(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '13px', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Pencil size={12} />
        </button>
        <button onClick={onRemove}
          style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}>
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px 14px', background: 'rgba(200,241,53,0.05)', border: '1px solid var(--accent)',
      borderRadius: '12px', marginBottom: '8px', position: 'relative'
    }}>
      {/* Food name input with suggestions */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setShowSugg(e.target.value.length > 0); }}
          onFocus={() => setShowSugg(true)}
          placeholder="Food name..."
          style={{
            width: '100%', padding: '8px 12px', background: 'var(--bg)',
            border: '1px solid var(--border2)', borderRadius: '10px',
            color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none'
          }}
        />
        {showSugg && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '10px',
            maxHeight: '160px', overflowY: 'auto', marginTop: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            {FOOD_SUGGESTIONS
              .filter(s => s.name.toLowerCase().includes(name.toLowerCase()))
              .map((s, i) => (
                <div key={i}
                  onClick={() => { setName(s.name); setProtein(String(s.p)); setShowSugg(false); }}
                  style={{
                    padding: '9px 14px', fontSize: '12px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border2)',
                    color: 'var(--text)', display: 'flex', justifyContent: 'space-between'
                  }}
                >
                  <span>{s.name}</span>
                  {s.p > 0 && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>{s.p}g P</span>}
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Protein input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="number" min="0" max="200"
          value={protein}
          onChange={e => setProtein(e.target.value)}
          placeholder="Protein (g)"
          style={{
            flex: 1, padding: '8px 12px', background: 'var(--bg)',
            border: '1px solid var(--border2)', borderRadius: '10px',
            color: 'var(--text)', fontSize: '13px', outline: 'none'
          }}
        />
        <button onClick={save}
          style={{
            padding: '8px 16px', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer'
          }}>
          Done
        </button>
        <button onClick={() => { setEditing(false); setShowSugg(false); }}
          style={{ padding: '8px 12px', background: 'var(--bg3)', color: 'var(--text3)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' }}>
          ✕
        </button>
      </div>
    </div>
  );
}

function MealBlock({ meal, onUpdate, onRemove, isOpen, onToggle }) {
  const [newFoodName, setNewFoodName]   = useState('');
  const [newFoodP, setNewFoodP]         = useState('');
  const [showAddFood, setShowAddFood]   = useState(false);
  const [showFoodSugg, setShowFoodSugg] = useState(false);

  const addFood = () => {
    if (!newFoodName.trim()) return;
    const newItem = { id: uid(), name: newFoodName.trim(), p: Number(newFoodP) || 0 };
    onUpdate({ ...meal, items: [...(meal.items || []), newItem] });
    setNewFoodName('');
    setNewFoodP('');
    setShowAddFood(false);
    setShowFoodSugg(false);
  };

  const updateItem = (itemId, updated) => {
    onUpdate({ ...meal, items: meal.items.map(it => it.id === itemId ? updated : it) });
  };

  const removeItem = (itemId) => {
    onUpdate({ ...meal, items: meal.items.filter(it => it.id !== itemId) });
  };

  const totalP = (meal.items || []).reduce((sum, it) => sum + (Number(it.p) || 0), 0);

  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: '20px', marginBottom: '14px',
      border: '1px solid var(--border2)', overflow: 'hidden'
    }}>
      {/* Meal Header */}
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px', cursor: 'pointer',
        background: isOpen ? 'rgba(200,241,53,0.06)' : 'transparent'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)'
          }} />
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>{meal.meal}</span>
          <span style={{ fontSize: '11px', color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: '20px' }}>
            {meal.items?.length || 0} items
          </span>
          {totalP > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>{totalP}g P</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }}>
            <Trash2 size={15} />
          </button>
          {isOpen ? <ChevronUp size={18} color="var(--text3)" /> : <ChevronDown size={18} color="var(--text3)" />}
        </div>
      </div>

      {/* Meal Body */}
      {isOpen && (
        <div style={{ padding: '0 18px 18px' }}>
          {/* Food Items */}
          {(meal.items || []).map(item => (
            <FoodItemRow
              key={item.id}
              item={item}
              onUpdate={(updated) => updateItem(item.id, updated)}
              onRemove={() => removeItem(item.id)}
            />
          ))}

          {/* Add Food */}
          {showAddFood ? (
            <div style={{
              padding: '14px', background: 'rgba(200,241,53,0.05)',
              border: '1px solid var(--accent)', borderRadius: '14px', marginBottom: '10px',
              position: 'relative'
            }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  value={newFoodName}
                  onChange={e => { setNewFoodName(e.target.value); setShowFoodSugg(e.target.value.length > 0); }}
                  onFocus={() => setShowFoodSugg(true)}
                  placeholder="Food name..."
                  style={{
                    width: '100%', padding: '8px 12px', background: 'var(--bg)',
                    border: '1px solid var(--border2)', borderRadius: '10px',
                    color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none'
                  }}
                />
                {showFoodSugg && newFoodName && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '10px',
                    maxHeight: '140px', overflowY: 'auto', marginTop: '4px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                  }}>
                    {FOOD_SUGGESTIONS
                      .filter(s => s.name.toLowerCase().includes(newFoodName.toLowerCase()))
                      .map((s, i) => (
                        <div key={i}
                          onClick={() => { setNewFoodName(s.name); setNewFoodP(String(s.p)); setShowFoodSugg(false); }}
                          style={{
                            padding: '9px 14px', fontSize: '12px', cursor: 'pointer',
                            borderBottom: '1px solid var(--border2)',
                            color: 'var(--text)', display: 'flex', justifyContent: 'space-between'
                          }}
                        >
                          <span>{s.name}</span>
                          {s.p > 0 && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>{s.p}g P</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number" min="0"
                  value={newFoodP}
                  onChange={e => setNewFoodP(e.target.value)}
                  placeholder="Protein (g)"
                  style={{
                    flex: 1, padding: '8px 12px', background: 'var(--bg)',
                    border: '1px solid var(--border2)', borderRadius: '10px',
                    color: 'var(--text)', fontSize: '13px', outline: 'none'
                  }}
                />
                <button onClick={addFood}
                  style={{ padding: '8px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  Add
                </button>
                <button onClick={() => { setShowAddFood(false); setShowFoodSugg(false); }}
                  style={{ padding: '8px 12px', background: 'var(--bg3)', color: 'var(--text3)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddFood(true)} style={{
              width: '100%', padding: '10px', background: 'transparent',
              border: '1px dashed var(--border2)', borderRadius: '12px',
              color: 'var(--text3)', fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <Plus size={14} /> Add Food Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- main component ----------
export default function DietPlanBuilder({ DIET_PLAN, syncDietPlan }) {
  const today      = new Date();
  const todayDow   = today.getDay();

  const [selectedDay, setSelectedDay]   = useState(todayDow);
  const [openMeals, setOpenMeals]       = useState({});
  const [showAddMeal, setShowAddMeal]   = useState(false);
  const [newMealName, setNewMealName]   = useState('');
  const [showMealSugg, setShowMealSugg] = useState(false);
  const [saveMsg, setSaveMsg]           = useState(false);

  // Current day's plan
  const dayPlan = (DIET_PLAN && DIET_PLAN[selectedDay]) ? DIET_PLAN[selectedDay] : [];

  const toggleMeal = (mealId) => {
    setOpenMeals(prev => ({ ...prev, [mealId]: !prev[mealId] }));
  };

  // Update a meal in the current day
  const updateMeal = useCallback((mealId, updated) => {
    const newDay  = dayPlan.map(m => m.id === mealId ? updated : m);
    const newPlan = { ...(DIET_PLAN || {}), [selectedDay]: newDay };
    syncDietPlan(newPlan);
  }, [dayPlan, selectedDay, DIET_PLAN, syncDietPlan]);

  const removeMeal = useCallback((mealId) => {
    const newDay  = dayPlan.filter(m => m.id !== mealId);
    const newPlan = { ...(DIET_PLAN || {}), [selectedDay]: newDay };
    syncDietPlan(newPlan);
  }, [dayPlan, selectedDay, DIET_PLAN, syncDietPlan]);

  const addMeal = () => {
    if (!newMealName.trim()) return;
    const newMeal = { id: uid(), meal: newMealName.trim(), items: [] };
    const newDay  = [...dayPlan, newMeal];
    const newPlan = { ...(DIET_PLAN || {}), [selectedDay]: newDay };
    syncDietPlan(newPlan);
    setOpenMeals(prev => ({ ...prev, [newMeal.id]: true }));
    setNewMealName('');
    setShowAddMeal(false);
    setShowMealSugg(false);
  };

  // Copy today's plan to all days
  const copyToAllDays = () => {
    const allDays = { 0: dayPlan, 1: dayPlan, 2: dayPlan, 3: dayPlan, 4: dayPlan, 5: dayPlan, 6: dayPlan };
    syncDietPlan(allDays);
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2500);
  };

  // Total protein for this day
  const dayTotalP = dayPlan.reduce((sum, m) =>
    sum + (m.items || []).reduce((s, it) => s + (Number(it.p) || 0), 0), 0);

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '22px', fontWeight: 400,
          background: 'linear-gradient(90deg, #C8F135, #4D9FFF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Utensils size={20} style={{ color: 'var(--accent)' }} /> Diet Plan Builder
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          Customise your meals for each day of the week
        </div>
      </div>

      {/* Day Selector */}
      <div style={{
        display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px',
        scrollbarWidth: 'none', marginBottom: '20px'
      }}>
        {DAY_TABS.map(({ dow, short, full }) => {
          const isToday = dow === todayDow;
          const isActive = dow === selectedDay;
          return (
            <div key={dow} onClick={() => setSelectedDay(dow)} style={{
              minWidth: '54px', textAlign: 'center', padding: '10px 8px',
              borderRadius: '16px', cursor: 'pointer', flexShrink: 0,
              background: isActive ? 'var(--accent)' : 'var(--bg3)',
              color: isActive ? '#000' : isToday ? 'var(--accent)' : 'var(--text2)',
              border: isActive ? 'none' : isToday ? '1px solid var(--accent)' : '1px solid var(--border2)',
              fontWeight: isActive || isToday ? 700 : 400,
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '11px' }}>{short}</div>
              {isToday && !isActive && (
                <div style={{ width: '4px', height: '4px', background: 'var(--accent)', borderRadius: '50%', margin: '4px auto 0' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Day Stats Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg2)', borderRadius: '16px', padding: '14px 18px',
        marginBottom: '16px', border: '1px solid var(--border2)'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>
            {DAY_TABS.find(d => d.dow === selectedDay)?.full}'s Plan
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>
            {dayTotalP}g protein
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{dayPlan.length} meals configured</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copyToAllDays}
            title="Apply this day's plan to all 7 days"
            style={{
              padding: '8px 12px', background: 'var(--bg3)', color: 'var(--text2)',
              border: '1px solid var(--border2)', borderRadius: '10px',
              fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
            }}>
            <RotateCcw size={12} /> Copy to All Days
          </button>
        </div>
      </div>

      {saveMsg && (
        <div style={{
          background: 'rgba(200,241,53,0.15)', border: '1px solid var(--accent)',
          borderRadius: '12px', padding: '10px 16px', marginBottom: '16px',
          fontSize: '13px', color: 'var(--accent)', textAlign: 'center'
        }}>
          ✅ Plan copied to all 7 days!
        </div>
      )}

      {/* Meal Blocks */}
      {dayPlan.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px 20px', background: 'var(--bg2)',
          borderRadius: '20px', border: '1px dashed var(--border2)',
          color: 'var(--text3)', fontSize: '14px', marginBottom: '20px'
        }}>
          🍽️ No meals yet for {DAY_TABS.find(d => d.dow === selectedDay)?.full}.<br />
          <span style={{ fontSize: '12px' }}>Tap "Add Meal" below to get started!</span>
        </div>
      )}

      {dayPlan.map(meal => (
        <MealBlock
          key={meal.id}
          meal={meal}
          isOpen={!!openMeals[meal.id]}
          onToggle={() => toggleMeal(meal.id)}
          onUpdate={(updated) => updateMeal(meal.id, updated)}
          onRemove={() => removeMeal(meal.id)}
        />
      ))}

      {/* Add Meal */}
      {showAddMeal ? (
        <div style={{
          background: 'var(--bg2)', borderRadius: '18px', padding: '18px',
          border: '1px solid var(--accent)', marginBottom: '16px', position: 'relative'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>Add a Meal</div>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              value={newMealName}
              onChange={e => { setNewMealName(e.target.value); setShowMealSugg(e.target.value.length >= 0); }}
              onFocus={() => setShowMealSugg(true)}
              placeholder="e.g. Breakfast, Pre-Workout..."
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg)',
                border: '1px solid var(--border2)', borderRadius: '12px',
                color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box', outline: 'none'
              }}
            />
            {showMealSugg && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '12px',
                marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                {MEAL_SUGGESTIONS
                  .filter(s => !newMealName || s.toLowerCase().includes(newMealName.toLowerCase()))
                  .map((s, i) => (
                    <div key={i}
                      onClick={() => { setNewMealName(s); setShowMealSugg(false); }}
                      style={{
                        padding: '10px 14px', fontSize: '13px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border2)', color: 'var(--text)'
                      }}>
                      {s}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addMeal}
              style={{ flex: 1, padding: '11px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
              Add Meal
            </button>
            <button onClick={() => { setShowAddMeal(false); setShowMealSugg(false); setNewMealName(''); }}
              style={{ padding: '11px 18px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddMeal(true)} style={{
          width: '100%', padding: '14px',
          background: 'var(--accent)', color: '#000', border: 'none',
          borderRadius: '16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 16px rgba(200,241,53,0.25)'
        }}>
          <Plus size={18} /> Add Meal
        </button>
      )}

      <div style={{ height: '40px' }} />
    </div>
  );
}
