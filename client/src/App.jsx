import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TicketList from './components/TicketList';
import TicketDetailModal from './components/TicketDetailModal';
import CreateTicketModal from './components/CreateTicketModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TeamsView from './components/TeamsView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import LoginPage from './components/LoginPage';
import { CheckCircle2, LogIn } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('tickets'); // 'tickets' | 'analytics' | 'teams' | 'kb'
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Show temporary toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch users for persona switcher & login
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const users = await res.json();
        setAllUsers(users);

        // Check if user was previously saved in localStorage
        const savedUserJson = localStorage.getItem('nexus_user');
        if (savedUserJson) {
          try {
            const savedUser = JSON.parse(savedUserJson);
            const found = users.find(u => u.id === savedUser.id);
            if (found) {
              setCurrentUser(found);
              return;
            }
          } catch (e) {}
        }

        // Default initial session: Marcus Vance (IT Admin)
        if (!currentUser && users.length > 0) {
          const defaultUser = users.find(u => u.role === 'admin') || users[0];
          setCurrentUser(defaultUser);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Fetch all tickets with SLA status
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  // Fetch teams
  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTickets();
    fetchTeams();

    // Auto-refresh tickets and SLAs every 20 seconds
    const interval = setInterval(() => {
      fetchTickets();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    if (token) localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(user));
    setShowLoginScreen(false);
    showToast(`Welcome back, ${user.name}! Signed in as ${user.role.toUpperCase()}`);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setCurrentUser(null);
    setShowLoginScreen(true);
    showToast('You have been signed out.');
  };

  // Switch demo persona from navbar dropdown
  const handleSwitchUser = async (userId) => {
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        handleLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // Handle created ticket
  const handleTicketCreated = (newTicket) => {
    setIsCreateModalOpen(false);
    fetchTickets();
    showToast(`Ticket ${newTicket.id} created successfully! SLA tracking initiated.`);
    setSelectedTicketId(newTicket.id);
  };

  // If user explicitly opened login screen or is logged out, render the Login Page
  if (showLoginScreen || !currentUser) {
    return (
      <LoginPage 
        allUsers={allUsers}
        onLoginSuccess={handleLoginSuccess}
        onCancel={currentUser ? () => setShowLoginScreen(false) : null}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation & Persona Switcher */}
      <Navbar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenLogin={() => setShowLoginScreen(true)}
        onLogout={handleLogout}
      />

      {/* Main Tab Views */}
      <main className="main-content">
        {currentTab === 'tickets' && (
          <TicketList 
            tickets={tickets}
            currentUser={currentUser || {}}
            onSelectTicket={(id) => setSelectedTicketId(id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsDashboard 
            onSelectTicket={(id) => setSelectedTicketId(id)}
          />
        )}

        {currentTab === 'teams' && (
          <TeamsView />
        )}

        {currentTab === 'kb' && (
          <KnowledgeBaseView />
        )}
      </main>

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <TicketDetailModal 
          ticketId={selectedTicketId}
          currentUser={currentUser || {}}
          allUsers={allUsers}
          teams={teams}
          onClose={() => setSelectedTicketId(null)}
          onRefresh={fetchTickets}
        />
      )}

      {/* Raise Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal 
          currentUser={currentUser || {}}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleTicketCreated}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner">
          <CheckCircle2 size={18} className="text-emerald" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
