import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck, 
  UserPlus, 
  Laptop, 
  MapPin, 
  Calendar, 
  Star, 
  Lock, 
  MessageSquare, 
  History,
  Play,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';

export default function TicketDetailModal({ 
  ticketId, 
  currentUser, 
  allUsers, 
  teams, 
  onClose, 
  onRefresh 
}) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState('discussion'); // 'discussion' | 'ai_assistant' | 'timeline'
  
  // Message input state
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Status update state
  const [resolving, setResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  // CSAT state
  const [csatRating, setCsatRating] = useState(5);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);

  // Assignment state
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');

  // Fetch full ticket details
  const fetchTicketDetails = async () => {
    try {
      const data = await api.getTicket(ticketId);
      if (data) {
        setTicket(data);
        setSelectedTeamId(data.team_id || '');
        setSelectedAgentId(data.assigned_to_id || '');
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  // Handle Send Message / Internal Note
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await api.postMessage(ticketId, {
        user_id: currentUser.id,
        message: newMessage.trim(),
        is_internal: isInternal ? 1 : 0
      });

      setNewMessage('');
      fetchTicketDetails();
      onRefresh();
    } catch (err) {
      console.error('Failed to post message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Assignment
  const handleAssign = async () => {
    try {
      await api.assignTicket(ticketId, {
        team_id: selectedTeamId ? Number(selectedTeamId) : null,
        assigned_to_id: selectedAgentId ? Number(selectedAgentId) : null,
        updated_by_id: currentUser.id
      });

      fetchTicketDetails();
      onRefresh();
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    }
  };

  // Handle Status Update
  const handleStatusChange = async (newStatus, notes = null) => {
    try {
      await api.updateStatus(ticketId, {
        status: newStatus,
        resolution_notes: notes,
        updated_by_id: currentUser.id
      });

      setResolving(false);
      setResolutionNotes('');
      fetchTicketDetails();
      onRefresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Handle Priority Escalation
  const handlePriorityChange = async (newPriority) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority: newPriority,
          updated_by_id: currentUser.id
        })
      });

      if (res.ok) {
        fetchTicketDetails();
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  // Handle CSAT rating submit
  const handleCsatSubmit = async () => {
    setSubmittingCsat(true);
    try {
      await api.submitCsat(ticketId, {
        rating: csatRating,
        feedback: csatFeedback,
        user_id: currentUser.id
      });

      fetchTicketDetails();
      onRefresh();
    } catch (err) {
      console.error('Failed to submit CSAT:', err);
    } finally {
      setSubmittingCsat(false);
    }
  };

  // Copy command to clipboard
  const handleCopyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  // Insert AI draft reply
  const handleInsertDraftReply = (text) => {
    setNewMessage(text);
    setActiveRightTab('discussion');
    setIsInternal(false);
  };

  if (!ticketId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="loading-box">Loading ticket details...</div>
        ) : !ticket ? (
          <div className="loading-box">Ticket not found</div>
        ) : (
          <>
            {/* Modal Top Header */}
            <div className="modal-header">
              <div className="modal-header-left">
                <span className="ticket-modal-id">{ticket.id}</span>
                <span className={`badge ${
                  ticket.priority.includes('P1') ? 'priority-p1' : 
                  ticket.priority.includes('P2') ? 'priority-p2' : 
                  ticket.priority.includes('P3') ? 'priority-p3' : 'priority-p4'
                }`}>
                  {ticket.priority}
                </span>
                <span className={`badge badge-${ticket.status.toLowerCase().replace(/\s+/g, '')}`}>
                  {ticket.status}
                </span>

                {ticket.sla && (
                  <span className={`sla-badge ${
                    ticket.sla.isBreached ? 'sla-breached' : 
                    ticket.sla.health === 'critical' ? 'sla-critical' : 
                    ticket.sla.health === 'warning' ? 'sla-warning' : 'sla-healthy'
                  }`}>
                    <Clock size={13} />
                    <span>{ticket.sla.badgeText}</span>
                  </span>
                )}
              </div>

              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Split Modal Body */}
            <div className="detail-split-body">
              {/* Left Pane: Ticket Information, SLAs, Workflows */}
              <div className="detail-left-pane">
                <h2 className="detail-title">{ticket.title}</h2>

                {/* Metadata Chips */}
                <div className="detail-meta-row">
                  <div className="meta-chip">
                    <Laptop size={14} />
                    <span>Asset: <strong>{ticket.device_tag || 'Standard Asset'}</strong></span>
                  </div>
                  <div className="meta-chip">
                    <MapPin size={14} />
                    <span>Location: <strong>{ticket.location || 'HQ Office'}</strong></span>
                  </div>
                  <div className="meta-chip">
                    <Calendar size={14} />
                    <span>Raised: <strong>{new Date(ticket.created_at).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Description Card */}
                <div className="detail-section">
                  <h4 className="section-subtitle">Problem Description</h4>
                  <div className="detail-description-card">
                    {ticket.description}
                  </div>
                </div>

                {/* SLA Tracking Card */}
                <div className="detail-section">
                  <h4 className="section-subtitle">SLA & Resolution Commitments</h4>
                  <div className={`sla-card-box ${ticket.sla?.isBreached ? 'sla-breached-bg' : ''}`}>
                    <div className="sla-row">
                      <div className="sla-field">
                        <span className="sla-field-label">Resolution Deadline:</span>
                        <span className="sla-field-val">
                          {new Date(ticket.sla_resolution_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="sla-field">
                        <span className="sla-field-label">First Response Target:</span>
                        <span className="sla-field-val">
                          {ticket.first_responded_at ? (
                            <span className="text-emerald">✓ Responded in {Math.round((new Date(ticket.first_responded_at) - new Date(ticket.created_at))/(60*1000))}m</span>
                          ) : (
                            <span>{new Date(ticket.sla_response_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {ticket.sla?.isBreached && (
                      <div className="sla-breach-callout">
                        <AlertTriangle size={16} />
                        <span>SLA Resolution breached by {Math.abs(ticket.sla.minutesLeftResolution)} minutes. Escalated to Tier 3 Lead.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team & Agent Assignment Bar (for Admins / Agents) */}
                <div className="detail-section">
                  <div className="section-header-flex">
                    <h4 className="section-subtitle">Assignment & Dispatch</h4>
                    {ticket.ai_category && (
                      <span className="ai-hint">
                        <Sparkles size={12} />
                        Auto-routed to {ticket.team_name || 'Support'}
                      </span>
                    )}
                  </div>

                  <div className="assign-controls-grid">
                    <div>
                      <label className="input-sublabel">Support Team</label>
                      <select 
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="form-select form-select-sm"
                      >
                        <option value="">Unassigned Team</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="input-sublabel">Assigned Specialist</label>
                      <select 
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="form-select form-select-sm"
                      >
                        <option value="">Unassigned Specialist</option>
                        {allUsers.filter(u => u.role !== 'employee').map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm assign-apply-btn"
                      onClick={handleAssign}
                    >
                      <UserPlus size={14} />
                      Update
                    </button>
                  </div>
                </div>

                {/* Action Workflow Controls */}
                <div className="detail-section">
                  <h4 className="section-subtitle">Workflow Actions</h4>
                  <div className="action-buttons-flow">
                    {ticket.status !== 'In Progress' && ticket.status !== 'Resolved' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('In Progress')}
                      >
                        <Play size={14} />
                        Mark In Progress
                      </button>
                    )}

                    {ticket.status === 'In Progress' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('Pending User')}
                      >
                        <Clock size={14} />
                        Wait on User Info
                      </button>
                    )}

                    {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => setResolving(true)}
                      >
                        <CheckCircle2 size={14} />
                        Resolve Ticket
                      </button>
                    )}

                    {ticket.status === 'Resolved' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('Closed')}
                      >
                        Close Ticket
                      </button>
                    )}

                    {['Resolved', 'Closed'].includes(ticket.status) && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('In Progress', 'Ticket reopened for further verification')}
                      >
                        <RotateCcw size={14} />
                        Reopen Ticket
                      </button>
                    )}
                  </div>

                  {/* Resolution Input Drawer */}
                  {resolving && (
                    <div className="resolution-input-card">
                      <label className="form-label">Root Cause & Resolution Notes (Mandatory for SLA closure):</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="Detail how the issue was fixed (e.g. Cleared cached Kerberos ticket, swapped 100W power delivery cable)..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                      />
                      <div className="resolution-btns">
                        <button className="btn btn-secondary btn-sm" onClick={() => setResolving(false)}>
                          Cancel
                        </button>
                        <button 
                          className="btn btn-success btn-sm"
                          disabled={!resolutionNotes.trim()}
                          onClick={() => handleStatusChange('Resolved', resolutionNotes)}
                        >
                          Confirm & Resolve
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Display existing resolution notes */}
                  {ticket.resolution_notes && (
                    <div className="existing-resolution-notes">
                      <span className="res-badge">✓ Resolution Recorded</span>
                      <p className="res-text">{ticket.resolution_notes}</p>
                      {ticket.resolution_time_minutes && (
                        <span className="res-time-text">Total resolution time: {ticket.resolution_time_minutes} minutes</span>
                      )}
                    </div>
                  )}
                </div>

                {/* CSAT Rating Section (if resolved) */}
                {['Resolved', 'Closed'].includes(ticket.status) && (
                  <div className="detail-section csat-section">
                    <h4 className="section-subtitle">Customer Satisfaction (CSAT)</h4>
                    {ticket.csat_rating ? (
                      <div className="csat-display-card">
                        <div className="stars-row">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              size={20} 
                              className={star <= ticket.csat_rating ? 'star-filled' : 'star-empty'} 
                            />
                          ))}
                          <span className="csat-score-text">({ticket.csat_rating}/5 Stars)</span>
                        </div>
                        {ticket.csat_feedback && (
                          <blockquote className="csat-quote">"{ticket.csat_feedback}"</blockquote>
                        )}
                      </div>
                    ) : (
                      <div className="csat-input-card">
                        <p className="csat-prompt">Please rate the IT support you received:</p>
                        <div className="stars-picker">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${star <= csatRating ? 'active' : ''}`}
                              onClick={() => setCsatRating(star)}
                            >
                              <Star size={24} />
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Optional feedback comments..."
                          className="form-input form-input-sm"
                          value={csatFeedback}
                          onChange={(e) => setCsatFeedback(e.target.value)}
                        />
                        <button 
                          className="btn btn-primary btn-sm"
                          disabled={submittingCsat}
                          onClick={handleCsatSubmit}
                        >
                          Submit CSAT
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Pane: AI Co-Pilot & Communications / Timeline */}
              <div className="detail-right-pane">
                {/* Right Pane Tabs */}
                <div className="right-nav-tabs">
                  <button 
                    className={`right-tab-btn ${activeRightTab === 'discussion' ? 'active' : ''}`}
                    onClick={() => setActiveRightTab('discussion')}
                  >
                    <MessageSquare size={15} />
                    <span>Updates ({ticket.messages?.length || 0})</span>
                  </button>

                  <button 
                    className={`right-tab-btn ai-tab-btn ${activeRightTab === 'ai_assistant' ? 'active' : ''}`}
                    onClick={() => setActiveRightTab('ai_assistant')}
                  >
                    <Sparkles size={15} />
                    <span>AI Co-Pilot</span>
                  </button>

                  <button 
                    className={`right-tab-btn ${activeRightTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveRightTab('timeline')}
                  >
                    <History size={15} />
                    <span>Audit Trail</span>
                  </button>
                </div>

                {/* Tab 1: Discussion Thread & Internal Notes */}
                {activeRightTab === 'discussion' && (
                  <div className="discussion-container">
                    <div className="messages-stream">
                      {ticket.messages && ticket.messages.length > 0 ? (
                        ticket.messages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`message-bubble ${msg.is_internal ? 'internal-bubble' : 'public-bubble'}`}
                          >
                            <div className="message-header">
                              <span className="msg-user-name">
                                {msg.is_internal && <Lock size={12} className="inline-lock" />}
                                {msg.user_name} ({msg.user_role})
                              </span>
                              <span className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="message-text">{msg.message}</div>
                            {msg.is_internal === 1 && (
                              <div className="internal-flag-tag">🔒 Internal Support Note (Invisible to employee)</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-messages-text">
                          No messages yet. Send an update or internal note below.
                        </div>
                      )}
                    </div>

                    {/* Message Composer */}
                    <form className="message-composer" onSubmit={handleSendMessage}>
                      {currentUser.role !== 'employee' && (
                        <div className="internal-toggle-row">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                            />
                            <span>Internal Team Note (Private to IT agents & admins)</span>
                          </label>
                        </div>
                      )}

                      <div className="composer-input-group">
                        <textarea
                          placeholder={isInternal ? "Write private note for team (e.g. escalated to Tier 3 on-call)..." : "Write response or question for requester..."}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={3}
                          className={`form-textarea composer-area ${isInternal ? 'internal-border' : ''}`}
                        />
                        <button 
                          type="submit" 
                          className={`btn ${isInternal ? 'btn-secondary' : 'btn-primary'} composer-send-btn`}
                          disabled={sendingMessage || !newMessage.trim()}
                        >
                          <Send size={16} />
                          <span>Send</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tab 2: AI Co-Pilot Diagnostic Assistant */}
                {activeRightTab === 'ai_assistant' && (
                  <div className="ai-copilot-container">
                    <div className="ai-summary-header">
                      <div className="ai-sparkle-pill">
                        <Sparkles size={16} />
                        <span>AI Diagnostic Telemetry</span>
                      </div>
                      <span className="ai-match-confidence">
                        Confidence: {(ticket.ai_confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="ai-box-detail">
                      <div className="ai-diagnosis-title">
                        Identified Issue: <strong>{ticket.subcategory || ticket.ai_category}</strong>
                      </div>
                      <p className="ai-diagnosis-body">
                        AI pattern matching has mapped this symptom to verified enterprise runbooks.
                      </p>

                      {/* Diagnostic Steps / Runbook */}
                      {ticket.ai_suggested_solutions && ticket.ai_suggested_solutions.length > 0 && (
                        <div className="runbook-steps-list">
                          <h5 className="runbook-heading">Recommended Troubleshooting Procedure:</h5>
                          {ticket.ai_suggested_solutions[0].steps ? (
                            ticket.ai_suggested_solutions[0].steps.map((step, idx) => (
                              <div key={idx} className="runbook-step-item">
                                {step}
                              </div>
                            ))
                          ) : (
                            ticket.ai_suggested_solutions.map((sol, idx) => (
                              <div key={idx} className="runbook-step-item">
                                {sol}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Quick Commands with 1-click copy */}
                      {ticket.ai_suggested_solutions?.[0]?.quickCommands && (
                        <div className="quick-commands-section">
                          <h5 className="runbook-heading">One-Click Terminal Diagnostic Commands:</h5>
                          {ticket.ai_suggested_solutions[0].quickCommands.map((cmd, idx) => (
                            <div key={idx} className="code-command-snippet">
                              <code>{cmd}</code>
                              <button 
                                className="copy-btn"
                                onClick={() => handleCopyCmd(cmd)}
                                title="Copy command to clipboard"
                              >
                                {copiedCmd === cmd ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Draft Response Generator */}
                      <div className="draft-reply-section">
                        <h5 className="runbook-heading">Smart AI Draft Reply:</h5>
                        <p className="draft-explainer">
                          Generate an immediate professional response pre-populated with diagnostic guidance:
                        </p>
                        <button 
                          className="btn btn-ai btn-sm insert-draft-btn"
                          onClick={() => {
                            const steps = ticket.ai_suggested_solutions?.[0]?.steps || [];
                            const draft = `Hello ${ticket.creator_name || 'there'},\n\nThank you for reaching out to IT Support. I've reviewed your ticket regarding "${ticket.title}".\n\nTo expedite resolution, could you please try the following steps:\n${steps.slice(0, 3).join('\n')}\n\nI will keep this ticket assigned and monitor for your update!`;
                            handleInsertDraftReply(draft);
                          }}
                        >
                          <Sparkles size={14} />
                          Insert AI Draft Response into Updates
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Timeline & Audit Trail */}
                {activeRightTab === 'timeline' && (
                  <div className="timeline-container">
                    <div className="timeline">
                      {ticket.timeline && ticket.timeline.map(item => (
                        <div key={item.id} className="timeline-item">
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <span className="timeline-time">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                            <div className="timeline-text">
                              <strong>{item.user_name || 'System'}:</strong> {item.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
