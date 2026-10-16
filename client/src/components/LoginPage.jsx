import React, { useState } from 'react';
import { 
  Ticket, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export default function LoginPage({ allUsers, onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('admin@enterprise.corp');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle standard email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.token);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid credentials. Default password is password123');
      }
    } catch (err) {
      setError('Network connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click demo login
  const handleQuickLogin = (user) => {
    setEmail(user.email);
    setPassword('password123');
    // Direct switch
    fetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
      .then(res => res.json())
      .then(data => {
        onLoginSuccess(data.user, data.token);
      })
      .catch(err => {
        setError('Failed to switch persona: ' + err.message);
      });
  };

  return (
    <div className="login-page-container">
      <div className="login-card-wrapper">
        {/* Brand Banner */}
        <div className="login-brand-header">
          <div className="login-logo-badge">
            <Ticket size={28} />
          </div>
          <h1 className="login-title">NexusIT Portal</h1>
          <p className="login-subtitle">
            Enterprise IT Helpdesk, SLA Monitoring & Incident Resolution
          </p>
        </div>

        {/* Login Box */}
        <div className="login-box card">
          <div className="login-box-header">
            <h2 className="login-form-heading">Sign in to your account</h2>
            <p className="login-form-sub">Use corporate email or select a demo role below</p>
          </div>

          {error && (
            <div className="form-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Corporate Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="form-input with-left-icon"
                  placeholder="name@enterprise.corp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-link">
                <label className="form-label">Password</label>
                <span className="pwd-hint">Default: password123</span>
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-left-icon with-right-icon"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-options-row">
              <label className="checkbox-remember">
                <input type="checkbox" defaultChecked />
                <span>Remember this terminal</span>
              </label>
              <span className="sso-badge">
                <ShieldCheck size={14} className="text-emerald" />
                SAML / SSO Enabled
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with Credentials'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>OR 1-CLICK DEMO ACCESS</span>
          </div>

          {/* Quick Demo Personas */}
          <div className="quick-personas-section">
            <p className="quick-personas-label">
              Instant access as an IT persona to test different workflows:
            </p>
            <div className="demo-personas-grid">
              {allUsers.slice(0, 5).map(u => (
                <button
                  key={u.id}
                  type="button"
                  className="demo-persona-card"
                  onClick={() => handleQuickLogin(u)}
                  title={`Sign in instantly as ${u.name}`}
                >
                  <div
                    className="avatar-xs"
                    style={{ backgroundColor: u.avatar_color || '#4f46e5' }}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div className="demo-persona-info">
                    <span className="demo-p-name">{u.name}</span>
                    <span className={`user-role-badge role-${u.role}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </div>
                  <ArrowRight size={14} className="demo-p-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="login-footer">
          <div className="security-guarantees">
            <span className="sec-item"><ShieldCheck size={14} /> SOC2 Type II Certified</span>
            <span className="sec-dot">•</span>
            <span className="sec-item">256-bit AES Encryption</span>
            <span className="sec-dot">•</span>
            <span className="sec-item">Enterprise SLA Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
