import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import Accordion from '../shared/Accordion';

export default function AISettings({ syncAiSettings }) {
  const [localAiEnabled, setLocalAiEnabled] = useState(() => localStorage.getItem('ai_enabled') === 'true');
  const [localAiKey, setLocalAiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [localAiModel, setLocalAiModel] = useState(() => {
    const saved = localStorage.getItem('ai_model');
    if (saved === 'gemini-1.5-flash' || saved === 'gemini-pro') {
      localStorage.setItem('ai_model', 'gemini-2.5-flash');
      return 'gemini-2.5-flash';
    }
    return saved || 'gemini-2.5-flash';
  });
  const [localAiPersona, setLocalAiPersona] = useState(() => localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
  const [localProvider, setLocalProvider] = useState(() => localStorage.getItem('ai_provider') || 'gemini');
  const [localOpenrouterKey, setLocalOpenrouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [localOpenrouterModel, setLocalOpenrouterModel] = useState(() => localStorage.getItem('openrouter_model') || 'openrouter/free');
  const [localPineconeApiKey, setLocalPineconeApiKey] = useState(() => localStorage.getItem('pinecone_api_key') || import.meta.env.VITE_PINECONE_API_KEY || '');
  const [localPineconeHost, setLocalPineconeHost] = useState(() => localStorage.getItem('pinecone_host') || import.meta.env.VITE_PINECONE_HOST || '');

  useEffect(() => {
    const handleStorage = () => {
      setLocalAiEnabled(localStorage.getItem('ai_enabled') === 'true');
      setLocalAiKey(localStorage.getItem('gemini_api_key') || '');
      const savedModel = localStorage.getItem('ai_model');
      if (savedModel === 'gemini-1.5-flash' || savedModel === 'gemini-pro') {
        localStorage.setItem('ai_model', 'gemini-2.5-flash');
        setLocalAiModel('gemini-2.5-flash');
      } else {
        setLocalAiModel(savedModel || 'gemini-2.5-flash');
      }
      setLocalAiPersona(localStorage.getItem('ai_persona') || 'Motivational Fitness Coach');
      setLocalProvider(localStorage.getItem('ai_provider') || 'gemini');
      setLocalOpenrouterKey(localStorage.getItem('openrouter_api_key') || '');
      setLocalOpenrouterModel(localStorage.getItem('openrouter_model') || 'openrouter/free');
      setLocalPineconeApiKey(localStorage.getItem('pinecone_api_key') || import.meta.env.VITE_PINECONE_API_KEY || '');
      setLocalPineconeHost(localStorage.getItem('pinecone_host') || import.meta.env.VITE_PINECONE_HOST || '');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSetting = (key, value) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <Accordion title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bot size={16} style={{ color: 'var(--accent)' }} /> AI Coach Settings</span>} subtitle="Configure your personal AI assistant">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Enable AI Coach</div>
          <div onClick={() => {
            const newVal = !localAiEnabled;
            setLocalAiEnabled(newVal);
            if (syncAiSettings) {
              syncAiSettings({ enabled: newVal });
            } else {
              updateSetting('ai_enabled', newVal ? 'true' : 'false');
            }
          }} style={{ width: '44px', height: '24px', background: localAiEnabled ? 'var(--accent)' : 'var(--bg3)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid var(--border2)' }}>
            <div style={{ width: '18px', height: '18px', background: localAiEnabled ? '#000' : 'var(--text3)', borderRadius: '50%', position: 'absolute', top: '2px', left: localAiEnabled ? '22px' : '3px', transition: 'all 0.3s' }}></div>
          </div>
        </div>
      </div>

      {/* AI Provider Selector */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Select AI Provider</div>
        <select 
          value={localProvider} 
          onChange={e => {
            const val = e.target.value;
            setLocalProvider(val);
            if (syncAiSettings) {
              syncAiSettings({ provider: val });
            } else {
              updateSetting('ai_provider', val);
            }
          }}
          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
        >
          <option value="gemini">Google Gemini (Direct)</option>
          <option value="openrouter">OpenRouter (Free Auto-Router)</option>
        </select>
      </div>

      {/* Gemini Configuration */}
      {localProvider === 'gemini' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Gemini API Key</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>
              Get a free key in 10s at <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>aistudio.google.com</a>
            </div>
            <input type="password" value={localAiKey} onChange={e => {
              const val = e.target.value;
              setLocalAiKey(val);
              if (syncAiSettings) {
                syncAiSettings({ apiKey: val });
              } else {
                updateSetting('gemini_api_key', val);
              }
            }} placeholder="Paste your Gemini key here"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Gemini Model</div>
            <select value={localAiModel} onChange={e => {
              const val = e.target.value;
              setLocalAiModel(val);
              if (syncAiSettings) {
                syncAiSettings({ model: val });
              } else {
                updateSetting('ai_model', val);
              }
            }} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (🚀 Lightning Fast/Free)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Advanced/Free)</option>
            </select>
          </div>
        </>
      )}

      {/* OpenRouter Configuration */}
      {localProvider === 'openrouter' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>OpenRouter API Key</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>
              Get a free key at <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}>openrouter.ai</a> (Access Llama 3 / Gemma Free!)
            </div>
            <input type="password" value={localOpenrouterKey} onChange={e => {
              const val = e.target.value;
              setLocalOpenrouterKey(val);
              if (syncAiSettings) {
                syncAiSettings({ openrouterKey: val });
              } else {
                updateSetting('openrouter_api_key', val);
              }
            }} placeholder="Paste your OpenRouter key here"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>OpenRouter Free Model</div>
            <select value={localOpenrouterModel} onChange={e => {
              const val = e.target.value;
              setLocalOpenrouterModel(val);
              if (syncAiSettings) {
                syncAiSettings({ openrouterModel: val });
              } else {
                updateSetting('openrouter_model', val);
              }
            }} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}>
              <option value="openrouter/free">Auto Free-Router (Finds best free model)</option>
              <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free)</option>
              <option value="google/gemma-2-9b-it:free">Gemma 2 9B IT (Free)</option>
              <option value="microsoft/phi-3-medium-128k-instruct:free">Phi 3 Medium Instruct (Free)</option>
            </select>
          </div>
        </>
      )}

      {/* Pinecone Vector RAG Config */}
      <div style={{ marginBottom: '16px', borderTop: '1px dashed var(--border2)', paddingTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>Pinecone RAG Storage (Optional)</div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px' }}>Pinecone API Key</div>
          <input type="password" value={localPineconeApiKey} onChange={e => {
            const val = e.target.value;
            setLocalPineconeApiKey(val);
            if (syncAiSettings) {
              syncAiSettings({ pineconeApiKey: val });
            } else {
              updateSetting('pinecone_api_key', val);
            }
          }} placeholder="Paste your Pinecone API key here"
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px' }}>Pinecone Index Host URL</div>
          <input type="text" value={localPineconeHost} onChange={e => {
            const val = e.target.value;
            setLocalPineconeHost(val);
            if (syncAiSettings) {
              syncAiSettings({ pineconeHost: val });
            } else {
              updateSetting('pinecone_host', val);
            }
          }} placeholder="https://your-index.svc.pinecone.io"
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
        </div>
      </div>

      {/* AI Persona Selector */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Coach Persona</div>
        <select value={localAiPersona} onChange={e => {
          const val = e.target.value;
          setLocalAiPersona(val);
          if (syncAiSettings) {
            syncAiSettings({ persona: val });
          } else {
            updateSetting('ai_persona', val);
          }
        }} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}>
          <option value="Motivational Fitness Coach">Motivational Fitness Coach (Encouraging & high energy)</option>
          <option value="Strict Military Drill Sergeant">Strict Military Drill Sergeant (Hardcore, no-nonsense)</option>
          <option value="Calm Zen Gym Master">Calm Zen Gym Master (Mindful, philosophical)</option>
          <option value="Sarcastic Fitness Critic">Sarcastic Fitness Critic (Humorous, dry wit)</option>
        </select>
      </div>
    </Accordion>
  );
}
