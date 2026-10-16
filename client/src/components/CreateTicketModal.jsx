import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Laptop, 
  MapPin, 
  Tag, 
  HelpCircle,
  ThumbsUp
} from 'lucide-react';

import api from '../services/api';

export default function CreateTicketModal({ currentUser, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [deviceTag, setDeviceTag] = useState('IT-MBP-9482');
  const [location, setLocation] = useState('NY HQ - Floor 4');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selfResolved, setSelfResolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const debounceTimerRef = useRef(null);

  // Debounced AI classification call as user types
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (title.length > 5 || description.length > 10) {
      setAiLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const data = await api.classifyAI(title, description);
          if (data) {
            setAiAnalysis(data);
            if (!category) {
              setCategory(data.category);
            }
            if (!priority) {
              setPriority(data.suggestedPriority);
            }
          }
        } catch (err) {
          console.error('AI classify error:', err);
        } finally {
          setAiLoading(false);
        }
      }, 400);
    } else {
      setAiAnalysis(null);
      setAiLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [title, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a summary title and detailed description.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const createdTicket = await api.createTicket({
        title: title.trim(),
        description: description.trim(),
        category: category || 'software',
        priority: priority || 'P3 - Medium',
        created_by_id: currentUser.id,
        device_tag: deviceTag,
        location
      });

      onCreated(createdTicket);
    } catch (err) {
      setError('Error creating ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2 className="modal-title">Raise IT Support Ticket</h2>
            <span className="modal-subtitle">Logged in as {currentUser.name} ({currentUser.department})</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {selfResolved ? (
          <div className="self-resolved-banner">
            <CheckCircle2 size={48} className="text-emerald" />
            <h3>Awesome! Problem Self-Resolved</h3>
            <p>You saved yourself waiting time and helped keep our IT queue clear. No ticket was created.</p>
            <button className="btn btn-primary" onClick={onClose}>
              Back to Helpdesk
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="form-error-alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="form-group">
                <label className="form-label">
                  Issue Summary <span className="text-rose">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cisco AnyConnect VPN handshake fails after macOS update"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description Input */}
              <div className="form-group">
                <label className="form-label">
                  Detailed Description & Error Messages <span className="text-rose">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Please describe what happened, any error codes, and what you were trying to do..."
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* AI Auto-Triage Real-time Box */}
              {(aiAnalysis || aiLoading) && (
                <div className="ai-suggestion-box">
                  <div className="ai-suggestion-header">
                    <div className="ai-tag">
                      <Sparkles size={14} />
                      <span>AI Triage & Self-Service Solution</span>
                    </div>
                    {aiAnalysis && (
                      <span className="ai-confidence-meter">
                        {(aiAnalysis.confidence * 100).toFixed(0)}% Match Confidence
                      </span>
                    )}
                  </div>

                  {aiLoading ? (
                    <div className="ai-loading-text">Analyzing symptoms and searching verified runbooks...</div>
                  ) : aiAnalysis && (
                    <>
                      <div className="ai-prediction-chips">
                        <span className="ai-pill">Category: <strong>{aiAnalysis.category}</strong></span>
                        <span className="ai-pill">Subcategory: <strong>{aiAnalysis.subcategory}</strong></span>
                        <span className="ai-pill">Suggested Priority: <strong>{aiAnalysis.suggestedPriority}</strong></span>
                      </div>

                      {aiAnalysis.matchedSolutions && aiAnalysis.matchedSolutions.length > 0 && (
                        <div className="self-service-card">
                          <h5 className="self-service-title">
                            💡 Try this before submitting — it might solve your issue right now:
                          </h5>
                          <div className="self-service-steps">
                            {aiAnalysis.matchedSolutions[0].steps.slice(0, 3).map((st, i) => (
                              <div key={i} className="self-step-line">{st}</div>
                            ))}
                          </div>
                          <div className="self-service-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm self-resolve-btn"
                              onClick={() => setSelfResolved(true)}
                            >
                              <ThumbsUp size={14} className="text-emerald" />
                              This solved my problem! (Cancel ticket)
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Category & Urgency Pickers */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="hardware">Hardware (Laptop, Monitor, Charger)</option>
                    <option value="network">Network (Wi-Fi, VPN, Connectivity)</option>
                    <option value="software">Software (Apps, OS, Dev Tools)</option>
                    <option value="access">Access & Identity (SSO, Okta, MFA, Permissions)</option>
                    <option value="security">Security (Phishing, Alerts, Stolen Asset)</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency & Impact</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="P1 - Critical">P1 - Critical (Entire office/team blocked, Outage)</option>
                    <option value="P2 - High">P2 - High (Single workflow fully blocked, Deadline today)</option>
                    <option value="P3 - Medium">P3 - Medium (Standard defect or request)</option>
                    <option value="P4 - Low">P4 - Low (Minor cosmetic issue or general inquiry)</option>
                  </select>
                </div>
              </div>

              {/* Asset & Location Metadata */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Device Asset Tag</label>
                  <input
                    type="text"
                    className="form-input"
                    value={deviceTag}
                    onChange={(e) => setDeviceTag(e.target.value)}
                    placeholder="e.g. IT-MBP-9021"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Office / Location</label>
                  <select
                    className="form-select"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="NY HQ - Floor 4">NY HQ - Floor 4</option>
                    <option value="SF Tech Hub - Floor 2">SF Tech Hub - Floor 2</option>
                    <option value="London Canary Wharf">London Canary Wharf</option>
                    <option value="Remote - Americas">Remote - Americas</option>
                    <option value="Remote - EMEA/APAC">Remote - EMEA/APAC</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || !title.trim() || !description.trim()}
              >
                <Send size={16} />
                <span>{submitting ? 'Submitting...' : 'Submit Ticket'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
