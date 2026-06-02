import React from 'react';
import { Droplets, Moon, Ban } from 'lucide-react';
import { SegmentBar } from './SegmentBar';

const WATER_LABELS = ['0L', '1-2L', '2-3L', '3-4L'];
const SLEEP_LABELS = ['< 5h', '5-6h', '6-7h', '7-8h'];
const JUNK_LABELS  = ['Failed', 'Small Cheat', 'Very Little', 'Perfect'];

export const HabitGrid = ({
  saved,
  getVal,
  handleHabit,
  waterTarget,
  sleepTarget
}) => {
  const getWaterLabel = (level) => {
    if (level === 0) return '0 L';
    if (level === 1) return `1-${Math.round(waterTarget * 0.4)} L`;
    if (level === 2) return `${Math.round(waterTarget * 0.4)}-${Math.round(waterTarget * 0.75)} L`;
    return `${Math.round(waterTarget * 0.75)}+ L (Target: ${waterTarget}L)`;
  };

  const getSleepLabel = (level) => {
    if (level === 0) return `< ${Math.round(sleepTarget * 0.6)} hrs`;
    if (level === 1) return `${Math.round(sleepTarget * 0.6)}-${Math.round(sleepTarget * 0.8)} hrs`;
    if (level === 2) return `${Math.round(sleepTarget * 0.8)}-${sleepTarget} hrs`;
    return `${sleepTarget}+ hrs (Target: ${sleepTarget}h)`;
  };

  return (
    <div className="habit-grid">
      <div className="habit-card scroll-reveal" onClick={() => handleHabit('water', (getVal(saved.water) + 1) % 4)}
        style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="habit-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Droplets size={18} color="var(--blue)" /></div>
          <div className="habit-label" style={{ margin: 0 }}>Water</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>{getWaterLabel(getVal(saved.water))}</div>
          <SegmentBar val={getVal(saved.water)} onChange={(v) => handleHabit('water', v)} color="var(--blue)" />
        </div>
      </div>

      <div className="habit-card scroll-reveal" onClick={() => handleHabit('sleep', (getVal(saved.sleep) + 1) % 4)}
        style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="habit-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Moon size={18} color="var(--accent)" /></div>
          <div className="habit-label" style={{ margin: 0 }}>Sleep</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>{getSleepLabel(getVal(saved.sleep))}</div>
          <SegmentBar val={getVal(saved.sleep)} onChange={(v) => handleHabit('sleep', v)} color="var(--accent)" />
        </div>
      </div>

      <div className="habit-card scroll-reveal" onClick={() => handleHabit('junk', (getVal(saved.junk) + 1) % 4)}
        style={{ gridColumn: '1 / -1', flexDirection: 'row', justifyContent: 'space-between', padding: '16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="habit-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ban size={18} color="var(--red)" /></div>
          <div style={{ textAlign: 'left' }}>
            <div className="habit-label" style={{ margin: 0 }}>No Junk & Reels</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', fontWeight: 600 }}>{JUNK_LABELS[getVal(saved.junk)]}</div>
          </div>
        </div>
        <SegmentBar val={getVal(saved.junk)} onChange={(v) => handleHabit('junk', v)} color="var(--red)" />
      </div>
    </div>
  );
};
