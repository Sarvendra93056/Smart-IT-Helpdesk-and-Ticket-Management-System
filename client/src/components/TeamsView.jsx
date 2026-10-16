import React, { useState, useEffect } from 'react';
import { Users, Shield, Headphones, Laptop, Wifi, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

import api from '../services/api';

export default function TeamsView() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await api.getTeams();
        if (data) {
          setTeams(data);
        }
      } catch (err) {
        console.error('Failed to load teams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return <div className="card loading-card">Loading support team rosters and workload metrics...</div>;
  }

  const getTeamIcon = (teamId) => {
    switch (teamId) {
      case 1: return <Headphones size={24} className="text-amber" />;
      case 2: return <Laptop size={24} className="text-emerald" />;
      case 3: return <Wifi size={24} className="text-cyan" />;
      case 4: return <KeyRound size={24} className="text-violet" />;
      default: return <Users size={24} />;
    }
  };

  return (
    <div className="teams-view-container">
      <div className="teams-header">
        <h2 className="page-heading">IT Support Teams & Workload Distribution</h2>
        <p className="page-subheading">
          Engineering teams handling tier 1-3 incidents, escalations, and hardware depot requests.
        </p>
      </div>

      <div className="teams-grid">
        {teams.map(team => (
          <div key={team.id} className="card team-card">
            <div className="team-card-top">
              <div className="team-icon-box">
                {getTeamIcon(team.id)}
              </div>
              <div className="team-top-info">
                <h3 className="team-name">{team.name}</h3>
                <span className="team-lead">Lead: {team.lead_name}</span>
              </div>
            </div>

            <p className="team-desc">{team.description}</p>

            {/* Specialties */}
            <div className="specialties-section">
              <span className="spec-label">Domain Specialties:</span>
              <div className="spec-chips">
                {team.specialties && team.specialties.map((spec, i) => (
                  <span key={i} className="spec-chip">{spec}</span>
                ))}
              </div>
            </div>

            {/* Workload Stats */}
            <div className="team-metrics-row">
              <div className="metric-col">
                <span className="metric-val text-primary">{team.activeTicketsCount}</span>
                <span className="metric-lbl">Active Incidents</span>
              </div>
              <div className="metric-col">
                <span className={`metric-val ${team.p1TicketsCount > 0 ? 'text-rose' : 'text-muted'}`}>
                  {team.p1TicketsCount}
                </span>
                <span className="metric-lbl">P1 Critical</span>
              </div>
              <div className="metric-col">
                <span className={`metric-val ${team.breachedTicketsCount > 0 ? 'text-rose' : 'text-emerald'}`}>
                  {team.breachedTicketsCount}
                </span>
                <span className="metric-lbl">SLA Breaches</span>
              </div>
            </div>

            {/* Roster */}
            <div className="team-roster">
              <span className="roster-title">Assigned Specialists ({team.members?.length || 0}):</span>
              <div className="members-list">
                {team.members && team.members.map(member => (
                  <div key={member.id} className="member-pill">
                    <div 
                      className="avatar-xs" 
                      style={{ backgroundColor: member.avatar_color || '#4f46e5' }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span className="member-name">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
