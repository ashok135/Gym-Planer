import React from 'react';

export default function Auth({
  isLoginMode,
  setIsLoginMode,
  handleAuth,
  handleReset,
  authError,
  resetSent,
  setResetSent,
  resetError,
  setResetError
}) {
  return (
    <div className="screen active">
      <div className="auth-box">
        <div className="auth-title">LifeTraker Pro</div>
        <div className="auth-sub">Cloud sync your workouts</div>
        <form onSubmit={handleAuth}>
          <input id="auth-email-input" type="email" name="email" className="auth-input" placeholder="Email address" required />
          <input type="password" name="password" className="auth-input" placeholder="Password" required />
          <button type="submit" className="auth-btn">{isLoginMode ? 'Login' : 'Sign Up'}</button>
        </form>
        {isLoginMode && (
          <div style={{textAlign:'center', marginTop:'10px'}}>
            <span
              onClick={handleReset}
              style={{fontSize:'12px', color:'var(--accent)', cursor:'pointer', textDecoration:'underline', fontWeight:600}}
            >
              Forgot Password?
            </span>
            {resetSent && <div style={{fontSize:'11px', color:'#34D399', marginTop:'6px'}}>✅ Reset email sent! Check your inbox.</div>}
            {resetError && <div style={{fontSize:'11px', color:'var(--red)', marginTop:'6px'}}>{resetError}</div>}
          </div>
        )}
        <div className="auth-error">{authError}</div>
        <div className="auth-toggle" onClick={() => { setIsLoginMode(!isLoginMode); setResetSent(false); setResetError(''); }}>
          {isLoginMode ? 'Need an account? Sign up' : 'Have an account? Login'}
        </div>
      </div>
    </div>
  );
}
