import React from 'react';
import { 
  ShieldAlert, 
  PlusCircle, 
  Ticket, 
  BarChart3, 
  Users, 
  BookOpen, 
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentUser, 
  allUsers, 
  onSwitchUser, 
  onOpenCreateModal 
}) {
  return (
    <header className="topbar">
      <div className="logo-area" onClick={() => setCurrentTab('tickets')}>
        <div className="logo-badge">
          <Ticket size={22} />
        </div>
        <div>
          <div className="logo-text">NexusIT</div>
          <div className="logo-subtext">Smart Enterprise Helpdesk</div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button 
          className={`nav-tab-btn ${currentTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setCurrentTab('tickets')}
        >
          <Ticket size={17} />
          <span>Tickets</span>
        </button>

        <button 
          className={`nav-tab-btn ${currentTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setCurrentTab('analytics')}
        >
          <BarChart3 size={17} />
          <span>SLA Analytics</span>
        </button>

        <button 
          className={`nav-tab-btn ${currentTab === 'teams' ? 'active' : ''}`}
          onClick={() => setCurrentTab('teams')}
        >
          <Users size={17} />
          <span>Support Teams</span>
        </button>

        <button 
          className={`nav-tab-btn ${currentTab === 'kb' ? 'active' : ''}`}
          onClick={() => setCurrentTab('kb')}
        >
          <BookOpen size={17} />
          <span>Runbooks & KB</span>
        </button>
      </nav>

      <div className="user-persona-area">
        {/* Quick Demo Persona Switcher */}
        <div className="persona-switcher" title="Switch persona to test Employee, Agent, or Admin experience">
          <span className="persona-label">Persona:</span>
          <select 
            className="persona-select"
            value={currentUser?.id || ''}
            onChange={(e) => onSwitchUser(Number(e.target.value))}
          >
            <optgroup label="IT Administrators">
              {allUsers.filter(u => u.role === 'admin').map(u => (
                <option key={u.id} value={u.id}>
                  👑 {u.name} (IT Admin)
                </option>
              ))}
            </optgroup>
            <optgroup label="IT Support Specialists">
              {allUsers.filter(u => u.role === 'agent').map(u => (
                <option key={u.id} value={u.id}>
                  🛠️ {u.name} ({u.department})
                </option>
              ))}
            </optgroup>
            <optgroup label="Employees (Requesters)">
              {allUsers.filter(u => u.role === 'employee').map(u => (
                <option key={u.id} value={u.id}>
                  👤 {u.name} ({u.department})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Current User Pill */}
        {currentUser && (
          <div className="user-badge">
            <div 
              className="avatar-circle"
              style={{ backgroundColor: currentUser.avatar_color || '#4f46e5' }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="user-info-text">
              <span className="user-name">{currentUser.name}</span>
              <span className={`user-role-badge role-${currentUser.role}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          <PlusCircle size={18} />
          <span>Raise Ticket</span>
        </button>
      </div>
    </header>
  );
}
