import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Laptop, 
  Wifi, 
  Terminal, 
  KeyRound, 
  ShieldCheck, 
  HelpCircle,
  Sparkles,
  User,
  ArrowUpDown
} from 'lucide-react';

const CATEGORY_ICONS = {
  hardware: Laptop,
  network: Wifi,
  software: Terminal,
  access: KeyRound,
  security: ShieldCheck,
  other: HelpCircle
};

export default function TicketList({ tickets, currentUser, onSelectTicket, onOpenCreateModal }) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'mine' | 'unassigned' | 'sla_risk'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText = `${t.id} ${t.title} ${t.description} ${t.creator_name || ''} ${t.assignee_name || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // Filter Mode
    if (filterMode === 'mine') {
      const isMine = t.created_by_id === currentUser.id || t.assigned_to_id === currentUser.id;
      if (!isMine) return false;
    } else if (filterMode === 'unassigned') {
      if (t.assigned_to_id !== null) return false;
    } else if (filterMode === 'sla_risk') {
      if (!t.sla?.isBreached && t.sla?.health !== 'critical') return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const getCategoryIcon = (category) => {
    const IconComponent = CATEGORY_ICONS[category] || HelpCircle;
    return <IconComponent size={14} />;
  };

  const getPriorityClass = (priority) => {
    if (priority.includes('P1')) return 'priority-p1';
    if (priority.includes('P2')) return 'priority-p2';
    if (priority.includes('P3')) return 'priority-p3';
    return 'priority-p4';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Open': return 'badge-open';
      case 'Assigned': return 'badge-assigned';
      case 'In Progress': return 'badge-inprogress';
      case 'Pending User': return 'badge-pending';
      case 'Resolved': return 'badge-resolved';
      case 'Closed': return 'badge-closed';
      default: return 'badge-open';
    }
  };

  const getSlaClass = (sla) => {
    if (sla.isBreached) return 'sla-breached';
    if (sla.health === 'critical') return 'sla-critical';
    if (sla.health === 'warning') return 'sla-warning';
    return 'sla-healthy';
  };

  return (
    <div className="ticket-list-container">
      {/* Search & Top Action Bar */}
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tickets by ID, keyword, requester, or symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className="filter-dropdowns">
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="P1 - Critical">P1 - Critical</option>
            <option value="P2 - High">P2 - High</option>
            <option value="P3 - Medium">P3 - Medium</option>
            <option value="P4 - Low">P4 - Low</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending User">Pending User</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Primary Scope Tabs */}
      <div className="filter-pills-row">
        <div className="scope-pills">
          <button 
            className={`scope-pill ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All Tickets ({tickets.length})
          </button>
          <button 
            className={`scope-pill ${filterMode === 'mine' ? 'active' : ''}`}
            onClick={() => setFilterMode('mine')}
          >
            My Tickets ({tickets.filter(t => t.created_by_id === currentUser.id || t.assigned_to_id === currentUser.id).length})
          </button>
          <button 
            className={`scope-pill ${filterMode === 'unassigned' ? 'active' : ''}`}
            onClick={() => setFilterMode('unassigned')}
          >
            Unassigned Queue ({tickets.filter(t => !t.assigned_to_id).length})
          </button>
          <button 
            className={`scope-pill danger-pill ${filterMode === 'sla_risk' ? 'active' : ''}`}
            onClick={() => setFilterMode('sla_risk')}
          >
            <AlertTriangle size={14} />
            SLA At Risk / Breached ({tickets.filter(t => t.sla?.isBreached || t.sla?.health === 'critical').length})
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="category-pills">
          {['all', 'hardware', 'network', 'software', 'access', 'security'].map(cat => (
            <button
              key={cat}
              className={`cat-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Grid / List */}
      <div className="tickets-grid">
        {filteredTickets.length === 0 ? (
          <div className="empty-state card">
            <HelpCircle size={44} className="empty-icon" />
            <h3>No tickets found</h3>
            <p>No tickets matched your current search filters.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              setSearch('');
              setFilterMode('all');
              setCategoryFilter('all');
              setPriorityFilter('all');
              setStatusFilter('all');
            }}>
              Reset all filters
            </button>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              className={`ticket-card ${ticket.sla?.isBreached ? 'card-breached' : ''}`}
              onClick={() => onSelectTicket(ticket.id)}
            >
              <div className="ticket-card-top">
                <div className="ticket-id-tag">
                  <span className="id-number">{ticket.id}</span>
                  <span className="category-pill">
                    {getCategoryIcon(ticket.category)}
                    <span>{ticket.subcategory || ticket.category}</span>
                  </span>
                </div>

                <div className="ticket-top-badges">
                  {/* Priority */}
                  <span className={`badge ${getPriorityClass(ticket.priority)}`}>
                    {ticket.priority.split(' - ')[0]}
                  </span>

                  {/* Status */}
                  <span className={`badge ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="ticket-title">{ticket.title}</h3>
              <p className="ticket-desc-snippet">{ticket.description}</p>

              {/* AI Auto-Triage Tag */}
              {ticket.ai_confidence > 0 && (
                <div className="ai-detected-tag">
                  <Sparkles size={13} className="ai-sparkle-icon" />
                  <span>AI Classified: {ticket.ai_category} ({(ticket.ai_confidence * 100).toFixed(0)}% match)</span>
                </div>
              )}

              {/* Footer with SLA Badge & Assignee info */}
              <div className="ticket-card-footer">
                <div className="user-info-snippet">
                  <div 
                    className="avatar-xs"
                    style={{ backgroundColor: ticket.creator_avatar_color || '#4f46e5' }}
                    title={`Requester: ${ticket.creator_name} (${ticket.creator_department})`}
                  >
                    {ticket.creator_name ? ticket.creator_name.charAt(0) : 'U'}
                  </div>
                  <div className="names-box">
                    <span className="creator-text">{ticket.creator_name}</span>
                    <span className="assignee-text">
                      {ticket.assignee_name ? `Assignee: ${ticket.assignee_name}` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* SLA Badge */}
                {ticket.sla && (
                  <div 
                    className={`sla-badge ${getSlaClass(ticket.sla)}`}
                    title={`Resolution Deadline: ${new Date(ticket.sla_resolution_deadline).toLocaleString()}`}
                  >
                    <Clock size={13} />
                    <span>{ticket.sla.badgeText}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
