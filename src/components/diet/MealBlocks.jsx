import React from 'react';
import { Pencil } from 'lucide-react';
import { SegmentBar } from './SegmentBar';

export const MealBlocks = ({
  dietPlan,
  saved,
  getVal,
  handleCheck,
  renameBox,
  toggleRename,
  renameInput,
  setRenameInput,
  saveRename
}) => {
  if (dietPlan.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: '14px' }}>
        📋 No meal plan for today.<br />Go to <strong>Plan Builder</strong> to set up your meals!
      </div>
    );
  }

  return (
    <>
      {dietPlan.map(meal => (
        <div className="meal-block scroll-reveal" key={meal.id || meal.meal}>
          <div className="meal-header">{meal.meal}</div>
          {(meal.items || []).map(item => {
            const val        = getVal(saved.items && saved.items[item.id]);
            const customName = (saved.custom && saved.custom[item.id]) ? saved.custom[item.id] : item.name;
            const FOOD_LABELS = ['None', '1/3', '2/3', 'Full'];
            return (
              <React.Fragment key={item.id}>
                <div className="food-item" onClick={() => handleCheck(item.id, (val + 1) % 4)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: val > 0 ? 'var(--accent)' : 'var(--text3)', fontWeight: 700, width: '32px', textAlign: 'right', marginRight: '8px' }}>
                      {FOOD_LABELS[val]}
                    </div>
                    <SegmentBar val={val} onChange={(v) => handleCheck(item.id, v)} color="var(--accent)" />
                  </div>
                  <div className="food-name-wrap" style={{ marginLeft: '12px' }}>
                    <div className="food-name" style={{ opacity: val === 0 ? 0.6 : 1, transition: 'opacity 0.2s' }}>{customName}</div>
                    <button className="rename-today-btn" onClick={(e) => { e.stopPropagation(); toggleRename(item.id, customName); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={11} /></button>
                  </div>
                  <div className="food-macros">{item.p > 0 ? Math.round(item.p * (val / 3)) + 'g P' : ''}</div>
                </div>
                {renameBox === item.id && (
                  <div className="rename-input-box open">
                    <input type="text" className="rename-input" value={renameInput} onChange={e => setRenameInput(e.target.value)} placeholder="Rename for today" />
                    <button className="rename-save" onClick={() => saveRename(item.id)}>Apply</button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </>
  );
};
