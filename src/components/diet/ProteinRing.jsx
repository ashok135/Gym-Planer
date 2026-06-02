import React from 'react';

export const ProteinRing = ({ totalP, proteinTarget, pct }) => {
  return (
    <div className="food-ring-container scroll-reveal">
      <div className="food-ring" style={{ background: `conic-gradient(var(--accent) ${pct}%, var(--bg3) 0%)` }}>
        <div className="food-ring-inner">
          <div className="food-ring-val">{totalP}g</div>
          <div className="food-ring-label">of {proteinTarget}g Protein</div>
        </div>
      </div>
    </div>
  );
};
