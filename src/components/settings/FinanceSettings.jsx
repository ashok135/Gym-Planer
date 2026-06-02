import React, { useState, useEffect } from 'react';
import { Wallet, Users } from 'lucide-react';
import Accordion from '../shared/Accordion';

const DEFAULT_CATEGORIES = [
  { id: 'food',      label: 'Food',          emoji: '🍕', color: '#FF6B6B' },
  { id: 'supps',     label: 'Supplements',   emoji: '💊', color: '#C8F135' },
  { id: 'transport', label: 'Transport',     emoji: '🚗', color: '#4D9FFF' },
  { id: 'entertain', label: 'Entertainment', emoji: '🎮', color: '#A78BFA' },
  { id: 'outside',   label: 'Eating Out',    emoji: '🍽️', color: '#FB923C' },
  { id: 'gym',       label: 'Gym',           emoji: '🏋️', color: '#34D399' },
  { id: 'others',    label: 'Others',        emoji: '📦', color: '#94A3B8' },
];

const DEFAULT_SPLIT_CATEGORIES = [
  { id: 'food',      label: 'Food & Dining', emoji: '🍕', color: '#FF6B6B' },
  { id: 'rent',      label: 'Rent & Bills',  emoji: '🏠', color: '#4D9FFF' },
  { id: 'transport', label: 'Transport',     emoji: '🚗', color: '#FBBF24' },
  { id: 'groceries', label: 'Groceries',     emoji: '🛒', color: '#34D399' },
  { id: 'entertain', label: 'Entertainment', emoji: '🎮', color: '#A78BFA' },
  { id: 'others',    label: 'Others',        emoji: '📦', color: '#94A3B8' },
];

const CAT_COLORS = ['#FF6B6B','#C8F135','#4D9FFF','#A78BFA','#FB923C','#34D399','#94A3B8','#F472B6','#FBBF24'];

export default function FinanceSettings({ BUDGET_SETTINGS, syncBudget, BUDGET }) {
  const [localIncome, setLocalIncome] = useState(BUDGET_SETTINGS?.income || 22400);
  const [localCategories, setLocalCategories] = useState(BUDGET_SETTINGS?.categories?.length ? BUDGET_SETTINGS.categories : DEFAULT_CATEGORIES);
  const [budgetMsg, setBudgetMsg] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');

  const [localSplitCategories, setLocalSplitCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('g_split_categories');
      return saved ? JSON.parse(saved) : DEFAULT_SPLIT_CATEGORIES;
    } catch (e) { return DEFAULT_SPLIT_CATEGORIES; }
  });
  const [newSplitCatLabel, setNewSplitCatLabel] = useState('');
  const [newSplitCatEmoji, setNewSplitCatEmoji] = useState('📦');
  const [splitCatMsg, setSplitCatMsg] = useState(false);

  useEffect(() => {
    if (BUDGET_SETTINGS) {
      setLocalIncome(BUDGET_SETTINGS.income || 22400);
      if (BUDGET_SETTINGS.categories?.length) {
        setLocalCategories(BUDGET_SETTINGS.categories);
      }
    }
  }, [BUDGET_SETTINGS]);

  const addCategory = () => {
    if (!newCatLabel.trim()) return;
    const newCat = { id: Date.now().toString(), label: newCatLabel.trim(), emoji: newCatEmoji, color: CAT_COLORS[localCategories.length % CAT_COLORS.length] };
    setLocalCategories(prev => [...prev, newCat]);
    setNewCatLabel(''); setNewCatEmoji('📦');
  };

  const removeCategory = (id) => setLocalCategories(prev => prev.filter(c => c.id !== id));

  const saveBudgetSettings = () => {
    const newSettings = { ...BUDGET_SETTINGS, income: Number(localIncome), categories: localCategories };
    syncBudget(BUDGET, newSettings);
    setBudgetMsg(true);
    setTimeout(() => setBudgetMsg(false), 2000);
  };

  const addSplitCategory = () => {
    if (!newSplitCatLabel.trim()) return;
    const newCat = { id: Date.now().toString(), label: newSplitCatLabel.trim(), emoji: newSplitCatEmoji, color: CAT_COLORS[localSplitCategories.length % CAT_COLORS.length] };
    setLocalSplitCategories(prev => [...prev, newCat]);
    setNewSplitCatLabel(''); setNewSplitCatEmoji('📦');
  };

  const removeSplitCategory = (id) => setLocalSplitCategories(prev => prev.filter(c => c.id !== id));

  const saveSplitSettings = () => {
    localStorage.setItem('g_split_categories', JSON.stringify(localSplitCategories));
    setSplitCatMsg(true);
    setTimeout(() => setSplitCatMsg(false), 2000);
  };

  return (
    <>
      {/* 💰 BUDGET DEFAULTS */}
      <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={16} style={{ color: 'var(--accent)' }} /> Budget Defaults</span>} subtitle="Set monthly income and expense categories">
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Monthly Income (₹)</div>
          <input type="number" value={localIncome} onChange={e => setLocalIncome(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '16px', fontWeight: 'bold', boxSizing: 'border-box' }} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', margin: '14px 0 8px' }}>Expense Categories</div>
        {localCategories.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{c.emoji}</span>
              <span style={{ fontSize: '13px', color: c.color, fontWeight: 600 }}>{c.label}</span>
            </div>
            <button onClick={() => removeCategory(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}>Remove</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input type="text" value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} placeholder="Emoji" maxLength={2}
            style={{ width: '44px', padding: '8px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '18px', textAlign: 'center' }} />
          <input type="text" placeholder="Category name" value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} />
          <button onClick={addCategory} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', width: '100%' }}>
          <button className="settings-save" onClick={saveBudgetSettings} style={{
            flex: 1,
            background: budgetMsg ? '#10B981' : 'var(--accent)',
            color: budgetMsg ? '#fff' : '#000',
            boxShadow: budgetMsg ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 'bold'
          }}>
            {budgetMsg ? 'Saved ✓' : 'Save Budget Settings'}
          </button>
        </div>
      </Accordion>

      {/* 💳 SPLIT EXPENSE DEFAULTS */}
      <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} style={{ color: 'var(--accent)' }} /> Split Expense Defaults</span>} subtitle="Manage group expense categories">
        <div style={{ fontSize: '12px', color: 'var(--text2)', margin: '4px 0 8px' }}>Group Expense Categories</div>
        {localSplitCategories.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{c.emoji}</span>
              <span style={{ fontSize: '13px', color: c.color, fontWeight: 600 }}>{c.label}</span>
            </div>
            <button onClick={() => removeSplitCategory(c.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px', padding: '4px 8px' }}>Remove</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input type="text" value={newSplitCatEmoji} onChange={e => setNewSplitCatEmoji(e.target.value)} placeholder="Emoji" maxLength={2}
            style={{ width: '44px', padding: '8px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '18px', textAlign: 'center' }} />
          <input type="text" placeholder="Category name" value={newSplitCatLabel} onChange={e => setNewSplitCatLabel(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} />
          <button onClick={addSplitCategory} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', width: '100%' }}>
          <button className="settings-save" onClick={saveSplitSettings} style={{
            flex: 1,
            background: splitCatMsg ? '#10B981' : 'var(--accent)',
            color: splitCatMsg ? '#fff' : '#000',
            boxShadow: splitCatMsg ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 'bold'
          }}>
            {splitCatMsg ? 'Saved ✓' : 'Save Split Categories'}
          </button>
        </div>
      </Accordion>
    </>
  );
}
