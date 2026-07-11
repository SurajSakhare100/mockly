import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

// ─── Google Icon ────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23zM5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63zM12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [view, setView] = useState('signin');
  const [user, setUser] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // ── Toast helper ──
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Save session ──
  const saveSession = (token, userData) => {
    localStorage.setItem('mockly_token', token);
    localStorage.setItem('mockly_user', JSON.stringify(userData));
    setUser(userData);
    setView('dashboard');
  };

  // ── Restore session on mount ──
  useEffect(() => {
    const token = localStorage.getItem('mockly_token');
    const storedUser = localStorage.getItem('mockly_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setView('dashboard');
    }
  }, []);

  // ── Reset form on view change ──
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  }, [view]);

  // ── Initialise Google Identity Services ──
  const initGoogle = useCallback(() => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      callback: handleGoogleCallback,
    });
    const container = document.getElementById('google-btn-container');
    if (container) {
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        theme: 'filled_black',
        size: 'large',
        width: container.offsetWidth || 336,
        text: view === 'signup' ? 'signup_with' : 'signin_with',
        logo_alignment: 'center',
      });
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Wait for GIS script to load then initialise
    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [initGoogle, view]);

  // ── Google credential callback ──
  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
      showToast(`Welcome, ${data.user.name}!`);
      saveSession(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Email Sign In ──
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sign in failed');
      showToast(`Welcome back, ${data.user.name}!`);
      saveSession(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Email Sign Up ──
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      showToast('Account created successfully!');
      saveSession(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Out ──
  const handleSignOut = () => {
    localStorage.removeItem('mockly_token');
    localStorage.removeItem('mockly_user');
    setUser(null);
    setView('signin');
    showToast('Signed out successfully');
    if (window.google) window.google.accounts.id.disableAutoSelect();
  };

  const getInitial = () =>
    user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U';

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* Toast */}
      {toast && (
        <div className="toast">
          <span className="status-indicator"></span>
          {toast}
        </div>
      )}

      {/* ── Sign In ── */}
      {view === 'signin' && (
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <div className="logo" style={{ textAlign: 'center', marginBottom: '8px' }}>MOCKLY</div>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your Mockly account</p>
            </div>

            {/* Google Button rendered by GIS SDK */}
            <div id="google-btn-container" style={{ width: '100%', minHeight: '44px', marginBottom: '20px' }}>
              {googleLoading && (
                <button className="btn btn-google" disabled>
                  <span className="spinner"></span>
                  Connecting to Google...
                </button>
              )}
            </div>

            <div className="divider">or continue with email</div>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSignIn}>
              <div className="form-group">
                <label className="form-label" htmlFor="signin-email">Email Address</label>
                <input
                  id="signin-email"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signin-password">Password</label>
                <input
                  id="signin-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-footer">
                <a href="#forgot" className="forgot-password" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Sign In'}
              </button>
            </form>

            <div className="auth-switch">
              Don't have an account?
              <a href="#signup" className="auth-switch-link"
                onClick={(e) => { e.preventDefault(); setView('signup'); }}>
                Sign Up
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign Up ── */}
      {view === 'signup' && (
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              <div className="logo" style={{ textAlign: 'center', marginBottom: '8px' }}>MOCKLY</div>
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">Get started with Mockly for free</p>
            </div>

            <div id="google-btn-container" style={{ width: '100%', minHeight: '44px', marginBottom: '20px' }}>
              {googleLoading && (
                <button className="btn btn-google" disabled>
                  <span className="spinner"></span>
                  Connecting to Google...
                </button>
              )}
            </div>

            <div className="divider">or continue with email</div>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSignUp}>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  className="form-input"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  className="form-input"
                  placeholder="min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Create Account'}
              </button>
            </form>

            <div className="auth-switch">
              Already have an account?
              <a href="#signin" className="auth-switch-link"
                onClick={(e) => { e.preventDefault(); setView('signin'); }}>
                Sign In
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Dashboard ── */}
      {view === 'dashboard' && (
        <div className="dashboard-container">
          <nav className="dashboard-nav">
            <div className="logo">MOCKLY</div>
            <div className="user-menu">
              <div className="user-info">
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" className="avatar" style={{ objectFit: 'cover' }} />
                  : <div className="avatar">{getInitial()}</div>
                }
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {user?.name || user?.email}
                </span>
              </div>
              <button className="btn-outline" onClick={handleSignOut}>Sign Out</button>
            </div>
          </nav>

          <main className="dashboard-main">
            <header className="dashboard-header">
              <h2 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || 'Developer'}</h2>
              <p className="welcome-subtitle">Here's the live status of your Mockly workspace.</p>
            </header>

            <section className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-title">Total API Requests</div>
                <div className="card-value">24,402</div>
                <div className="card-trend">↑ 12.4% from last week</div>
              </div>
              <div className="dashboard-card">
                <div className="card-title">Avg. Latency</div>
                <div className="card-value">12ms</div>
                <div className="card-trend">↓ 2ms faster than last week</div>
              </div>
              <div className="dashboard-card">
                <div className="card-title">Service Status</div>
                <div className="card-value" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="status-indicator"></span>Operational
                </div>
                <div className="card-trend">All 15 endpoints healthy</div>
              </div>
            </section>

            <section className="dashboard-card">
              <div className="card-title" style={{ marginBottom: '20px' }}>Recent Endpoint Calls</div>
              <div className="activity-list">
                {[
                  { method: 'GET', path: '/api/v1/users', time: 'Just now', code: '200 OK', color: '#fff' },
                  { method: 'POST', path: '/api/v1/auth/google', time: '3 mins ago', code: '201 Created', color: '#fff' },
                  { method: 'GET', path: '/api/v1/settings', time: '12 mins ago', code: '304 Not Modified', color: '#666' },
                  { method: 'DELETE', path: '/api/v1/mock/84fa', time: '1 hr ago', code: '204 No Content', color: '#666' },
                ].map((item, i) => (
                  <div className="activity-item" key={i}>
                    <div className="activity-details">
                      <span className="activity-name">
                        <span style={{ color: '#888', marginRight: 8 }}>{item.method}</span>{item.path}
                      </span>
                      <span className="activity-time">{item.time}</span>
                    </div>
                    <span className="activity-amount" style={{ color: item.color }}>{item.code}</span>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
