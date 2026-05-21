import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Accordion({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '12px', borderRadius: '14px', border: '1px solid var(--border2)', overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'var(--bg3)', cursor: 'pointer', userSelect: 'none' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <ChevronDown size={18} color="var(--text3)" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
      </div>
      {open && <div style={{ padding: '16px 18px', background: 'var(--bg)' }}>{children}</div>}
    </div>
  );
}
