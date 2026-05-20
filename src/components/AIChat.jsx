import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Key, Sparkles } from 'lucide-react';

const GEMINI_KEY_STORAGE = 'gemini_api_key';

export default function AIChat({ DB, META, FOOD, BUDGET, STUDY, SCHEDULE, syncAiSettings }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm Lucy 🤖 Ask me anything about your workouts, diet, budget, or study progress!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  const [openrouterKey, setOpenrouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [model, setModel] = useState(() => localStorage.getItem('ai_model') || 'gemini-1.5-flash');
  const [openrouterModel, setOpenrouterModel] = useState(() => localStorage.getItem('openrouter_model') || 'openrouter/free');
  const [persona, setPersona] = useState(() => localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      setApiKey(localStorage.getItem(GEMINI_KEY_STORAGE) || '');
      setOpenrouterKey(localStorage.getItem('openrouter_api_key') || '');
      setProvider(localStorage.getItem('ai_provider') || 'gemini');
      setModel(localStorage.getItem('ai_model') || 'gemini-1.5-flash');
      setOpenrouterModel(localStorage.getItem('openrouter_model') || 'openrouter/free');
      setPersona(localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const buildContext = () => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    const recentWorkouts = Object.entries(DB).slice(-7).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
    const todayMeta = META[todayKey] || {};
    const budgetMonth = BUDGET?.[monthKey] || {};
    const todayStudy = STUDY?.[todayKey] || {};

    return `You are Lucy, an AI coach acting as: ${persona}.
Embedded in a personal tracking app called LifeTraker.
The user's data:
- Today: ${todayKey}
- Today workout meta: start=${todayMeta.start}, end=${todayMeta.end}, energy=${todayMeta.energy}/5, status=${todayMeta.status}
- Recent workout entries (last 7 days): ${recentWorkouts || 'none'}
- Budget this month: spent=₹${(budgetMonth.entries||[]).reduce((s,e)=>s+Number(e.amount),0)}, income=₹22400, entries=${JSON.stringify(budgetMonth.entries?.slice(-5)||[])}
- Study today: ${JSON.stringify(todayStudy.sessions||[])}
- Habits today: water=${FOOD[todayKey]?.water||0}, sleep=${FOOD[todayKey]?.sleep||0}, junk=${FOOD[todayKey]?.junk||0}

Answer the user's question concisely (2-4 sentences max). Be motivating and specific. Use emojis. Speak in the tone of your defined persona.`;
  };

  const [tempKey, setTempKey] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    if (showKeyInput) {
      const activeKey = provider === 'gemini' ? apiKey : openrouterKey;
      setTempKey(activeKey);
    } else {
      setTempKey('');
    }
  }, [showKeyInput, provider, apiKey, openrouterKey]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const activeKey = provider === 'gemini' ? apiKey : openrouterKey;
    if (!activeKey) { setShowKeyInput(true); return; }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const context = buildContext();
      let reply = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: context + '\n\nUser: ' + userMsg }] }]
          })
        });
        const data = await res.json();
        if (data.error) {
          reply = `⚠️ Gemini API Error: ${data.error.message} (Code: ${data.error.code})`;
        } else {
          reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, couldn't get a response. Please verify your API Key and try again!";
        }
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://lifetraker-gym.vercel.app',
            'X-Title': 'LifeTraker Gym'
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [
              { role: 'system', content: context },
              { role: 'user', content: userMsg }
            ]
          })
        });
        const data = await res.json();
        if (data.error) {
          reply = `⚠️ OpenRouter API Error: ${data.error.message || JSON.stringify(data.error)}`;
        } else {
          reply = data?.choices?.[0]?.message?.content || "Sorry, couldn't get a response. Please verify your API Key and try again!";
        }
      }
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ Connection Error: Failed to connect to ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'}. Please check your internet connection.` }]);
    }
    setLoading(false);
  };

  const saveKey = () => {
    if (tempKey.trim()) {
      const val = tempKey.trim();
      if (provider === 'gemini') {
        setApiKey(val);
        if (syncAiSettings) {
          syncAiSettings({ apiKey: val });
        } else {
          localStorage.setItem(GEMINI_KEY_STORAGE, val);
        }
      } else {
        setOpenrouterKey(val);
        if (syncAiSettings) {
          syncAiSettings({ openrouterKey: val });
        } else {
          localStorage.setItem('openrouter_api_key', val);
        }
      }
      setShowKeyInput(false);
      setTempKey('');
    }
  };

  const activeKeyExists = provider === 'gemini' ? apiKey : openrouterKey;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          style={{ 
            position: 'fixed', 
            bottom: '95px', 
            right: '24px', 
            height: '46px', 
            borderRadius: '23px', 
            padding: '0 16px',
            background: 'var(--bg2)', 
            border: '1px solid var(--border2)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', 
            zIndex: 999, 
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            color: 'var(--text)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text2)' }}>TALK TO LUCY</span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div style={{ position: 'fixed', bottom: '80px', right: '12px', left: '12px', maxWidth: '500px', margin: '0 auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
          {/* Chat Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(200,241,53,0.05), rgba(77,159,255,0.05))', borderRadius: '20px 20px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.02em' }}>Lucy · AI Coach</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{provider === 'gemini' ? 'Gemini AI' : 'OpenRouter AI'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setShowKeyInput(!showKeyInput)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text3)', fontSize: '10px', padding: '4px 8px', cursor: 'pointer' }}><Key size={10}/> API Key</button>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
          </div>

          {/* API Key Input */}
          {showKeyInput && (
            <div style={{ padding: '14px 16px', background: 'rgba(200,241,53,0.03)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', fontWeight: 600 }}>Select AI Provider</div>
                <select 
                  value={provider} 
                  onChange={e => {
                    const val = e.target.value;
                    setProvider(val);
                    if (syncAiSettings) {
                      syncAiSettings({ provider: val });
                    } else {
                      localStorage.setItem('ai_provider', val);
                    }
                  }}
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', outline: 'none' }}
                >
                  <option value="gemini">Google Gemini (Direct)</option>
                  <option value="openrouter">OpenRouter (Free Auto-Router)</option>
                </select>
              </div>

              {provider === 'openrouter' && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px', fontWeight: 600 }}>Select OpenRouter Free Model</div>
                  <select 
                    value={openrouterModel} 
                    onChange={e => {
                      const val = e.target.value;
                      setOpenrouterModel(val);
                      if (syncAiSettings) {
                        syncAiSettings({ openrouterModel: val });
                      } else {
                        localStorage.setItem('openrouter_model', val);
                      }
                    }}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', outline: 'none' }}
                  >
                    <option value="openrouter/free">Auto-Select Active Free Model (Highly Recommended!)</option>
                    <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free/Fast)</option>
                  </select>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', fontStyle: 'italic' }}>
                    💡 "Auto-Select" always routes to an active free model even if others are down.
                  </div>
                </div>
              )}

              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>
                {provider === 'gemini' ? (
                  <>Get a free key in 10s at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>aistudio.google.com</a></>
                ) : (
                  <>Get a free key at <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>openrouter.ai</a> (Access Llama 3 / Gemma Free!)</>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="password" placeholder={`Paste ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'} key...`} value={tempKey} onChange={e => setTempKey(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }} />
                <button onClick={saveKey} style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Save</button>
              </div>
              {activeKeyExists && <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '6px' }}>✅ Key saved!</div>}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                  color: msg.role === 'user' ? '#000' : 'var(--text)',
                  fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {!activeKeyExists && (
              <div style={{ background: 'rgba(200,241,53,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px dashed var(--border2)', fontSize: '12px', color: 'var(--text2)', marginTop: '8px' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Sparkles size={14}/> Setup AI Coach (Lucy)</div>
                {provider === 'gemini' ? (
                  <>To chat, please create a free Google Gemini key at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}>Google AI Studio</a> and click the 🔑 **API Key** button above to paste it! okey.</>
                ) : (
                  <>To chat, please create a free key at <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}>OpenRouter</a> and click the 🔑 **API Key** button above to paste it! okey.</>
                )}
              </div>
            )}
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
              placeholder="Ask Lucy..."
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
