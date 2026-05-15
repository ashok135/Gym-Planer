import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const GEMINI_KEY_STORAGE = 'gemini_api_key';

export default function AIChat({ DB, META, FOOD, BUDGET, STUDY, SCHEDULE }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your AI Coach 🤖 Ask me anything about your workouts, diet, budget, or study progress!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const buildContext = () => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    const recentWorkouts = Object.entries(DB).slice(-7).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
    const todayMeta = META[todayKey] || {};
    const budgetMonth = BUDGET?.[monthKey] || {};
    const todayStudy = STUDY?.[todayKey] || {};

    return `You are an AI fitness and life coach embedded in a personal tracking app called LifeTraker.
The user's data:
- Today: ${todayKey}
- Today workout meta: start=${todayMeta.start}, end=${todayMeta.end}, energy=${todayMeta.energy}/5, status=${todayMeta.status}
- Recent workout entries (last 7 days): ${recentWorkouts || 'none'}
- Budget this month: spent=₹${(budgetMonth.entries||[]).reduce((s,e)=>s+Number(e.amount),0)}, income=₹22400, entries=${JSON.stringify(budgetMonth.entries?.slice(-5)||[])}
- Study today: ${JSON.stringify(todayStudy.sessions||[])}
- Habits today: water=${FOOD[todayKey]?.water||0}, sleep=${FOOD[todayKey]?.sleep||0}, junk=${FOOD[todayKey]?.junk||0}

Answer the user's question concisely (2-4 sentences max). Be motivating and specific. Use emojis. Speak in a friendly coaching tone.`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!apiKey) { setShowKeyInput(true); return; }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const context = buildContext();
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context + '\n\nUser: ' + userMsg }] }]
        })
      });
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, couldn't get a response. Try again!";
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: "⚠️ Error connecting to AI. Check your API key in Settings." }]);
    }
    setLoading(false);
  };

  const saveKey = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey.trim());
      localStorage.setItem(GEMINI_KEY_STORAGE, tempKey.trim());
      setShowKeyInput(false);
      setTempKey('');
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          style={{ position: 'fixed', bottom: '90px', right: '20px', width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #4D9FFF)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(167,139,250,0.5)', zIndex: 999, animation: 'pulse 2s infinite alternate' }}>
          <MessageCircle size={24} color="#fff" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div style={{ position: 'fixed', bottom: '80px', right: '12px', left: '12px', maxWidth: '500px', margin: '0 auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
          {/* Chat Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(77,159,255,0.1))', borderRadius: '20px 20px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="#A78BFA" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>AI Coach</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Powered by Gemini</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setShowKeyInput(!showKeyInput)} style={{ background: 'transparent', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text3)', fontSize: '10px', padding: '4px 8px', cursor: 'pointer' }}>🔑 API Key</button>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
          </div>

          {/* API Key Input */}
          {showKeyInput && (
            <div style={{ padding: '12px 16px', background: 'rgba(167,139,250,0.05)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>
                Get free key at <span style={{ color: '#A78BFA' }}>aistudio.google.com</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="password" placeholder="Paste Gemini API key..." value={tempKey} onChange={e => setTempKey(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }} />
                <button onClick={saveKey} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Save</button>
              </div>
              {apiKey && <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '6px' }}>✅ Key saved!</div>}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                  color: msg.role === 'user' ? '#000' : 'var(--text)',
                  fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: '16px 16px 16px 4px', fontSize: '13px', color: 'var(--text3)' }}>
                  ✨ Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask your AI coach..."
              style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '20px', color: 'var(--text)', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={sendMessage} disabled={loading}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: loading ? 'var(--border2)' : 'var(--accent)', border: 'none', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={16} color={loading ? 'var(--text3)' : '#000'} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
