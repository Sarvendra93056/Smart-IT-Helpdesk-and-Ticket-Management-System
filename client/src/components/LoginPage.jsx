import React, { useState, useEffect } from 'react';
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
  KeyRound,
  UserCheck,
  Zap,
  X
} from 'lucide-react';
import api from '../services/api';
import { initialUsers } from '../services/mockData';

export default function LoginPage({ allUsers: passedUsers, onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('admin@enterprise.corp');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usersList, setUsersList] = useState(passedUsers && passedUsers.length > 0 ? passedUsers : initialUsers);

  useEffect(() => {
    if (passedUsers && passedUsers.length > 0) {
      setUsersList(passedUsers);
    } else {
      api.getUsers().then(users => {
        if (users && users.length > 0) setUsersList(users);
      });
    }
  }, [passedUsers]);

  // Handle standard email/password login
  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.login(email.trim(), password.trim());
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Default password is password123');
    } finally {
      setLoading(false);
    }
  };

  // Quick autofill buttons
  const handleAutofill = (demoEmail, demoPwd = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPwd);
    setError('');
  };

  // Quick 1-click demo login
  const handleQuickLogin = async (user) => {
    setEmail(user.email);
    setPassword('password123');
    setLoading(true);
    setError('');

    try {
      const data = await api.switchUser(user.id);
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError('Failed to switch persona: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bypass / Instant Guest entry as Director
  const handleDirectEntry = () => {
    const adminUser = usersList.find(u => u.role === 'admin') || usersList[0];
    onLoginSuccess(adminUser, 'demo-guest-token');
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
            <p className="login-form-sub">Enter credentials or choose 1-click access below</p>
          </div>

          {/* Credentials Info Notice */}
          <div className="credentials-info-banner">
            <div className="cred-banner-title">
              <KeyRound size={15} className="text-primary" />
              <span>Default Credentials Available:</span>
            </div>
            <div className="cred-chips-row">
              <button 
                type="button" 
                className="cred-chip-btn"
                onClick={() => handleAutofill('admin@enterprise.corp', 'password123')}
                title="Click to auto-fill Admin"
              >
                👑 Admin: <strong>admin@enterprise.corp</strong>
              </button>
              <button 
                type="button" 
                className="cred-chip-btn"
                onClick={() => handleAutofill('david.kim@enterprise.corp', 'password123')}
                title="Click to auto-fill Agent"
              >
                🛠️ Agent: <strong>david.kim@enterprise.corp</strong>
              </button>
              <button 
                type="button" 
                className="cred-chip-btn"
                onClick={() => handleAutofill('sarah.chen@enterprise.corp', 'password123')}
                title="Click to auto-fill Employee"
              >
                👤 Employee: <strong>sarah.chen@enterprise.corp</strong>
              </button>
            </div>
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
              <div className="label-with-link">
                <label className="form-label" htmlFor="login-email">Corporate Email Address</label>
                {email && (
                  <button 
                    type="button" 
                    className="clear-field-btn"
                    onClick={() => setEmail('')}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="login-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  className="form-input with-left-icon"
                  placeholder="e.g. admin@enterprise.corp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ pointerEvents: 'auto', cursor: 'text', position: 'relative', zIndex: 2 }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-link">
                <label className="form-label" htmlFor="login-password">Password</label>
                <span className="pwd-hint">Password: password123</span>
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input with-left-icon with-right-icon"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ pointerEvents: 'auto', cursor: 'text', position: 'relative', zIndex: 2 }}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ zIndex: 3 }}
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

          {/* Quick Direct Access Button */}
          <button
            type="button"
            className="btn btn-secondary direct-access-btn"
            onClick={handleDirectEntry}
            style={{ width: '100%', marginTop: '12px' }}
          >
            <Zap size={16} className="text-amber" />
            <span>Instant Access as IT Admin (No Password Needed)</span>
          </button>

          {/* Divider */}
          <div className="login-divider">
            <span>OR 1-CLICK DEMO ACCESS</span>
          </div>

          {/* Quick Demo Personas */}
          <div className="quick-personas-section">
            <p className="quick-personas-label">
              Click any profile below to sign in instantly as that persona:
            </p>
            <div className="demo-personas-grid">
              {usersList.slice(0, 5).map(u => (
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
                      {u.role.toUpperCase()} • {u.department}
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
