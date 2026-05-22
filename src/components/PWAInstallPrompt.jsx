import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, PlusSquare } from 'lucide-react';

const SafariShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px', color: '#3897f0' }}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const runningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
    
    setIsStandalone(runningStandalone);

    // 2. Check if user is on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsIOS(iosDevice);

    // 3. Listen for the native PWA install prompt (Android, Chrome, Windows/macOS Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Delay showing the prompt by 3 seconds for a premium user experience
      const dismissedTime = localStorage.getItem('pwa_prompt_dismissed_time');
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      if (!dismissedTime || (now - Number(dismissedTime)) > threeDays) {
        if (!runningStandalone) {
          const timer = setTimeout(() => setShowPrompt(true), 3000);
          return () => clearTimeout(timer);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Handle iOS-specific display conditions (Safari only, not standalone)
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|optios/.test(userAgent);
    if (iosDevice && isSafari && !runningStandalone) {
      const dismissedTime = localStorage.getItem('pwa_prompt_dismissed_time');
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      if (!dismissedTime || (now - Number(dismissedTime)) > threeDays) {
        const timer = setTimeout(() => setShowPrompt(true), 4000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native browser install dialog
    deferredPrompt.prompt();
    
    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear deferred prompt so it can only be used once
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed_time', String(Date.now()));
    setShowPrompt(false);
  };

  // If already standalone or prompt is hidden, do not render
  if (isStandalone || !showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92%',
      maxWidth: '460px',
      background: 'rgba(16, 16, 16, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(200, 241, 53, 0.25)',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: 'slideUpPrompt 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      {/* Dynamic Keyframes Animation injected inline */}
      <style>{`
        @keyframes slideUpPrompt {
          from {
            transform: translate(-50%, 100px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(200, 241, 53, 0.1)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Download App</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Install LifeTraker on your device</div>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'var(--text2)',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content Customization based on OS */}
      {isIOS ? (
        // iOS Safari Flow Guidance
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
            To install on your iPhone, follow these quick steps:
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            padding: '10px',
            fontSize: '12px',
            color: 'var(--text)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', width: '22px', height: '22px', borderRadius: '50%', fontSize: '10px', fontWeight: 700 }}>1</div>
              <span>Tap the share button below <SafariShareIcon /> in Safari.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', width: '22px', height: '22px', borderRadius: '50%', fontSize: '10px', fontWeight: 700 }}>2</div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare size={14} style={{ color: 'var(--accent)', marginLeft: '2px' }} />.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', width: '22px', height: '22px', borderRadius: '50%', fontSize: '10px', fontWeight: 700 }}>3</div>
              <span>Tap <strong>"Add"</strong> in the top right corner to install!</span>
            </div>
          </div>
        </div>
      ) : (
        // Android / Windows / macOS Native App prompt
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
            Enjoy full-screen, native offline tracking, push alerts, and direct home screen access!
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              style={{
                flex: 1,
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: deferredPrompt ? 1 : 0.6
              }}
            >
              <Download size={14} strokeWidth={2.5} />
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text2)',
                border: '1px solid var(--border2)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Not Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
