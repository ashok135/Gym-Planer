import React from 'react';

/* ─── Meme Cat images for MOOD ─── 
   0 = crying/dead   → 100 = absolute euphoria
*/
const MOOD_CATS = [
  {
    // 0-20: Crying sad cat
    img: 'https://i.kym-cdn.com/photos/images/newsfeed/001/505/714/814.jpg',
    label: '💀 I cannot even...',
    color: '#888',
    scale: 0.9,
    rotate: -5,
    filter: 'grayscale(70%) brightness(0.7)',
    animation: 'catSad 2s ease-in-out infinite alternate',
  },
  {
    // 20-40: Grumpy / disappointed cat
    img: 'https://i.kym-cdn.com/entries/icons/original/000/000/774/ihave.jpg',
    label: '😑 Not amused.',
    color: '#aaa',
    scale: 0.93,
    rotate: -2,
    filter: 'grayscale(40%) brightness(0.8)',
    animation: 'none',
  },
  {
    // 40-60: THE POLITE CAT (your meme) — awkward middle
    img: 'https://i.kym-cdn.com/photos/images/original/001/682/293/f40.jpg',
    label: '🙂 Fine I guess...',
    color: '#c8c8cc',
    scale: 1.0,
    rotate: 0,
    filter: 'none',
    animation: 'none',
  },
  {
    // 60-80: Smiling happy cat
    img: 'https://i.kym-cdn.com/photos/images/original/002/197/551/9b9.jpg',
    label: '😄 Actually feeling good!',
    color: '#c8f135',
    scale: 1.04,
    rotate: 2,
    filter: 'brightness(1.1) saturate(1.2)',
    animation: 'none',
  },
  {
    // 80-100: Extremely happy / euphoric cat
    img: 'https://i.kym-cdn.com/photos/images/newsfeed/001/981/356/b5f.jpg',
    label: "🔥 LET'S GOOOOO!!!",
    color: '#ff6b35',
    scale: 1.1,
    rotate: 0,
    filter: 'brightness(1.2) saturate(1.5)',
    animation: 'catHype 0.4s ease-in-out infinite alternate',
  },
];

/* ─── Meme Cat images for ENERGY ─── */
const ENERGY_CATS = [
  {
    // 0-20: Completely flat cat / loaf
    img: 'https://i.kym-cdn.com/photos/images/original/001/560/849/8b8.jpg',
    label: '☠️ I am the floor.',
    color: '#888',
    scale: 0.85,
    rotate: 0,
    filter: 'grayscale(80%) brightness(0.65)',
    animation: 'catFlat 3s ease-in-out infinite alternate',
  },
  {
    // 20-40: Sleepy / half awake cat
    img: 'https://i.kym-cdn.com/photos/images/original/001/194/195/e7c.jpg',
    label: '🥱 5 more minutes...',
    color: '#aaa',
    scale: 0.92,
    rotate: -3,
    filter: 'grayscale(30%) brightness(0.8)',
    animation: 'none',
  },
  {
    // 40-60: Normal alert cat sitting
    img: 'https://i.kym-cdn.com/photos/images/original/001/682/293/f40.jpg',
    label: '⚡ Warming up...',
    color: '#bbb',
    scale: 1.0,
    rotate: 0,
    filter: 'none',
    animation: 'none',
  },
  {
    // 60-80: Excited ready cat
    img: 'https://i.kym-cdn.com/photos/images/original/002/197/551/9b9.jpg',
    label: '💪 Let\'s get it!',
    color: '#c8f135',
    scale: 1.05,
    rotate: 0,
    filter: 'brightness(1.15) saturate(1.3)',
    animation: 'none',
  },
  {
    // 80-100: Zoomies / absolute chaos cat
    img: 'https://i.kym-cdn.com/photos/images/newsfeed/001/981/356/b5f.jpg',
    label: '⚡ ZOOMIES ACTIVATED ⚡',
    color: '#ff6b35',
    scale: 1.12,
    rotate: 0,
    filter: 'brightness(1.3) saturate(1.8) hue-rotate(10deg)',
    animation: 'catZoom 0.25s ease-in-out infinite alternate',
  },
];

/* ─── Map 0-100 slider to a 0-4 stage index + inner progress ─── */
function getStage(value) {
  const idx = Math.min(4, Math.floor(value / 20));
  const innerT = (value % 20) / 20; // 0..1 within the stage
  return { idx, innerT };
}

/* ─── Cat Image with smooth CSS crossfade ─── */
function CatSlider({ value, cats }) {
  const { idx, innerT } = getStage(value);

  return (
    <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto' }}>
      {cats.map((cat, i) => {
        // Determine opacity for smooth crossfade
        let opacity = 0;
        if (i === idx) {
          // Current stage fades OUT toward end
          opacity = i === 4 ? 1 : 1 - innerT * 0.4;
        } else if (i === idx + 1) {
          // Next stage fades IN
          opacity = innerT * 0.9;
        }

        const active = i === idx;
        const catStyle = active ? cat : (cats[Math.min(4, idx + 1)] || cat);
        const lerpScale = active
          ? cat.scale + (innerT * ((cats[Math.min(4, i + 1)]?.scale || cat.scale) - cat.scale))
          : cat.scale;

        return (
          <img
            key={i}
            src={cat.img}
            alt={`cat mood ${i}`}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              border: `3px solid ${active ? cat.color : 'transparent'}`,
              opacity,
              transform: `scale(${cat.scale}) rotate(${cat.rotate}deg)`,
              filter: cat.filter,
              animation: active ? cat.animation : 'none',
              transition: 'opacity 0.25s ease, border-color 0.3s ease, filter 0.4s ease',
              boxShadow: active && value > 60 ? `0 0 ${Math.round(value * 0.3)}px ${cat.color}88` : 'none',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            onError={e => { e.target.src = 'https://placekitten.com/200/200'; }}
          />
        );
      })}
    </div>
  );
}

/* ─── Label ─── */
function getCatLabel(value, cats) {
  const { idx } = getStage(value);
  return cats[idx];
}

/* ─── Shared Slider Input ─── */
function AnimSlider({ id, value, onChange, disabled, cats, face }) {
  const cat = getCatLabel(value, cats);

  return (
    <div style={{ padding: '4px 0' }}>
      <style>{`
        @keyframes catSad {
          from { transform: scale(0.88) rotate(-6deg) translateY(0); }
          to   { transform: scale(0.92) rotate(-4deg) translateY(3px); }
        }
        @keyframes catFlat {
          from { transform: scale(0.83) translateY(2px); }
          to   { transform: scale(0.87) translateY(-1px); }
        }
        @keyframes catHype {
          from { transform: scale(1.08) rotate(-3deg); }
          to   { transform: scale(1.13) rotate(3deg); }
        }
        @keyframes catZoom {
          from { transform: scale(1.10) rotate(-4deg) translateX(-3px); }
          to   { transform: scale(1.15) rotate(4deg) translateX(3px); }
        }
        .meme-slider-track {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
        }
        .meme-slider-track:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }
        .meme-slider-track::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 3px solid #111;
          box-shadow: 0 0 10px rgba(200,241,53,0.5);
        }
        .meme-slider-track::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 3px solid #111;
          box-shadow: 0 0 10px rgba(200,241,53,0.5);
        }
      `}</style>

      {/* Cat image crossfade display */}
      <div style={{ marginBottom: '10px' }}>
        <CatSlider value={value} cats={cats} />
      </div>

      {/* Meme label */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: cat.color,
        letterSpacing: '0.03em',
        marginBottom: '10px',
        minHeight: '16px',
        transition: 'color 0.35s ease',
        fontWeight: 400,
      }}>
        {cat.label}
      </div>

      {/* Slider */}
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        disabled={disabled}
        onChange={e => onChange(parseInt(e.target.value))}
        className="meme-slider-track"
        style={{
          background: `linear-gradient(to right, ${cat.color} 0%, ${cat.color} ${value}%, rgba(255,255,255,0.08) ${value}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />

      {/* End labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text3)' }}>
        <span>{face === 'mood' ? '💀 Dead' : '☠️ Flat'}</span>
        <span>{face === 'mood' ? '🔥 LFG' : '⚡ Zoom'}</span>
      </div>
    </div>
  );
}

/* ─── Main SessionMeta ─── */
export default function SessionMeta({ meta, isSkipped, handleMetaChange }) {
  // Convert legacy emoji mood → numeric
  const MOOD_EMOJI_MAP = { '😴': 5, '😐': 25, '🙂': 55, '🔥': 80, '💪': 100 };
  const rawMood = meta.mood;
  let moodVal = typeof rawMood === 'number'
    ? rawMood
    : (MOOD_EMOJI_MAP[rawMood] ?? 50);

  // Convert legacy 1-5 energy → 0-100
  const rawEnergy = meta.energy;
  let energyVal = typeof rawEnergy === 'number' && rawEnergy <= 5
    ? Math.round((rawEnergy / 5) * 100)
    : (typeof rawEnergy === 'number' ? rawEnergy : 50);

  return (
    <div className="session-meta">
      {/* Top meta grid */}
      <div className="meta-grid">
        <div className="meta-group">
          <div className="meta-label">Status</div>
          <select className="meta-input" value={meta.status || 'Completed'} onChange={e => handleMetaChange('status', e.target.value)}>
            <option value="Completed">Completed</option>
            <option value="Partial">Partial</option>
            <option value="Skipped">Skipped</option>
          </select>
        </div>
        <div className="meta-group">
          <div className="meta-label">Body Weight (kg)</div>
          <input type="number" step="0.1" className="meta-input" value={meta.bw || ''} onChange={e => handleMetaChange('bw', e.target.value)} placeholder="e.g. 75.5" disabled={isSkipped} />
        </div>
        <div className="meta-group">
          <div className="meta-label">Start Time</div>
          <input type="time" className="meta-input" value={meta.start || ''} onChange={e => handleMetaChange('start', e.target.value)} disabled={isSkipped} />
        </div>
        <div className="meta-group">
          <div className="meta-label">End Time</div>
          <input type="time" className="meta-input" value={meta.end || ''} onChange={e => handleMetaChange('end', e.target.value)} disabled={isSkipped} />
        </div>
      </div>

      {/* ─── MEME CAT SLIDERS ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          margin: '16px 0 4px',
          opacity: isSkipped ? 0.4 : 1,
          transition: 'opacity 0.3s',
          pointerEvents: isSkipped ? 'none' : 'auto',
        }}
      >
        {/* MOOD CAT */}
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '14px 12px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '10px' }}>
            Mood
          </div>
          <AnimSlider
            id="mood-slider"
            value={moodVal}
            onChange={v => handleMetaChange('mood', v)}
            disabled={isSkipped}
            cats={MOOD_CATS}
            face="mood"
          />
        </div>

        {/* ENERGY CAT */}
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          borderRadius: '16px',
          padding: '14px 12px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '10px' }}>
            Energy
          </div>
          <AnimSlider
            id="energy-slider"
            value={energyVal}
            onChange={v => handleMetaChange('energy', v)}
            disabled={isSkipped}
            cats={ENERGY_CATS}
            face="energy"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="meta-group" style={{ marginTop: '8px' }}>
        <div className="meta-label">Notes</div>
        <textarea className="notes-input" value={meta.notes || ''} onChange={e => handleMetaChange('notes', e.target.value)} placeholder="How did it feel?" />
      </div>
    </div>
  );
}
