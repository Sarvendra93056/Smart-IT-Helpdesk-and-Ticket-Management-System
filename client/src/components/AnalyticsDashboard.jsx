import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  TrendingUp, 
  Users, 
  Star, 
  Sparkles,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

import api from '../services/api';

export default function AnalyticsDashboard({ onSelectTicket }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const json = await api.getAnalytics();
      if (json) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCsv = () => {
    window.open('/api/analytics/export', '_blank');
  };

  if (loading) {
    return <div className="loading-card card">Loading IT Operations telemetry & SLA analytics...</div>;
  }

  if (!data) {
    return <div className="card">Unable to load analytics.</div>;
  }

  const { kpis, distribution, teamPerformance, breachedTickets } = data;

  return (
    <div className="analytics-container">
      {/* Top Header */}
      <div className="analytics-header">
        <div>
          <h2 className="page-heading">IT Operations & SLA Compliance Analytics</h2>
          <p className="page-subheading">
            Real-time telemetry, service level agreements (SLAs), and team capacity.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={handleExportCsv}>
          <Download size={16} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        {/* KPI 1: SLA Compliance Rate */}
        <div className="kpi-card card">
          <div className="kpi-top">
            <span className="kpi-label">SLA Compliance Rate</span>
            <div className={`kpi-icon-pill ${kpis.slaComplianceRate >= 90 ? 'pill-success' : 'pill-danger'}`}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{kpis.slaComplianceRate}%</span>
            <span className="kpi-badge-hint">Target: &gt;90%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill ${kpis.slaComplianceRate >= 90 ? 'bg-emerald' : 'bg-rose'}`} 
              style={{ width: `${kpis.slaComplianceRate}%` }} 
            />
          </div>
        </div>

        {/* KPI 2: Active SLA Breaches */}
        <div className="kpi-card card">
          <div className="kpi-top">
            <span className="kpi-label">Active SLA Breaches</span>
            <div className={`kpi-icon-pill ${kpis.slaBreachedCount > 0 ? 'pill-danger pulse' : 'pill-success'}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value text-rose">{kpis.slaBreachedCount}</span>
            <span className="kpi-badge-hint text-rose">Requires Immediate Triage</span>
          </div>
          <p className="kpi-subtext">Tickets past resolution deadline</p>
        </div>

        {/* KPI 3: Avg First Response Time */}
        <div className="kpi-card card">
          <div className="kpi-top">
            <span className="kpi-label">Avg First Response</span>
            <div className="kpi-icon-pill pill-primary">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{kpis.avgFirstResponseMinutes}m</span>
            <span className="kpi-badge-hint text-emerald">Fast Response</span>
          </div>
          <p className="kpi-subtext">Across all priority tiers</p>
        </div>

        {/* KPI 4: Avg Resolution Time */}
        <div className="kpi-card card">
          <div className="kpi-top">
            <span className="kpi-label">Avg Resolution Time</span>
            <div className="kpi-icon-pill pill-cyan">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{kpis.avgResolutionHours}h</span>
            <span className="kpi-badge-hint">Per resolved ticket</span>
          </div>
          <p className="kpi-subtext">{kpis.resolvedTickets} tickets closed</p>
        </div>

        {/* KPI 5: CSAT Score */}
        <div className="kpi-card card">
          <div className="kpi-top">
            <span className="kpi-label">Customer Satisfaction (CSAT)</span>
            <div className="kpi-icon-pill pill-amber">
              <Star size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{kpis.avgCsat} <span className="small-star">★</span></span>
            <span className="kpi-badge-hint">{kpis.csatResponsesCount} employee ratings</span>
          </div>
          <p className="kpi-subtext">98% positive sentiment</p>
        </div>
      </div>

      {/* Middle Row: Distribution & Breached Alerts */}
      <div className="analytics-middle-grid">
        {/* Category Breakdown Card */}
        <div className="card distribution-card">
          <h3 className="card-heading">Tickets by IT Category</h3>
          <p className="card-subheading">Distribution of reported issues across enterprise domains</p>

          <div className="category-bars-list">
            {Object.entries(distribution.category).map(([cat, count]) => {
              const pct = kpis.totalTickets > 0 ? Math.round((count / kpis.totalTickets) * 100) : 0;
              return (
                <div key={cat} className="cat-bar-item">
                  <div className="cat-bar-labels">
                    <span className="cat-bar-name">{cat.toUpperCase()}</span>
                    <span className="cat-bar-count">{count} tickets ({pct}%)</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: 
                          cat === 'network' ? '#06b6d4' :
                          cat === 'hardware' ? '#10b981' :
                          cat === 'software' ? '#6366f1' :
                          cat === 'access' ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="card distribution-card">
          <h3 className="card-heading">Priority Breakdown & SLA Targets</h3>
          <p className="card-subheading">SLA urgency matrix compliance</p>

          <div className="priority-cards-grid">
            <div className="priority-stat-box p1-box">
              <span className="priority-stat-tag">P1 - Critical</span>
              <span className="priority-stat-num">{distribution.priority['P1 - Critical']}</span>
              <span className="priority-stat-sla">Target: 2h resolution</span>
            </div>
            <div className="priority-stat-box p2-box">
              <span className="priority-stat-tag">P2 - High</span>
              <span className="priority-stat-num">{distribution.priority['P2 - High']}</span>
              <span className="priority-stat-sla">Target: 8h resolution</span>
            </div>
            <div className="priority-stat-box p3-box">
              <span className="priority-stat-tag">P3 - Medium</span>
              <span className="priority-stat-num">{distribution.priority['P3 - Medium']}</span>
              <span className="priority-stat-sla">Target: 24h resolution</span>
            </div>
            <div className="priority-stat-box p4-box">
              <span className="priority-stat-tag">P4 - Low</span>
              <span className="priority-stat-num">{distribution.priority['P4 - Low']}</span>
              <span className="priority-stat-sla">Target: 48h resolution</span>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Breach Alert Table */}
      {breachedTickets && breachedTickets.length > 0 && (
        <div className="card breach-alert-card">
          <div className="breach-card-top">
            <div className="breach-top-left">
              <ShieldAlert size={22} className="text-rose" />
              <div>
                <h3 className="card-heading text-rose">Active SLA Breaches ({breachedTickets.length})</h3>
                <p className="card-subheading">Tickets currently exceeding mandated resolution commitments</p>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Breached By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {breachedTickets.map(b => (
                  <tr key={b.id} className="breach-row" onClick={() => onSelectTicket(b.id)}>
                    <td className="mono font-bold text-rose">{b.id}</td>
                    <td className="font-semibold">{b.title}</td>
                    <td><span className="table-cat-badge">{b.category}</span></td>
                    <td><span className="badge priority-p1">{b.priority}</span></td>
                    <td><span className="badge badge-inprogress">{b.status}</span></td>
                    <td className="text-rose font-bold">+{b.breachedByMinutes} mins</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onSelectTicket(b.id); }}>
                        <span>Triage</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Support Team Capacity Table */}
      <div className="card team-workload-card">
        <h3 className="card-heading">Support Team Workload & Resolution Ratio</h3>
        <p className="card-subheading">Active tickets assigned to each engineering pod</p>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Support Team</th>
                <th>Total Assigned</th>
                <th>Active Workload</th>
                <th>Resolved</th>
                <th>SLA Breached</th>
                <th>Capacity Health</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance && teamPerformance.map(tp => (
                <tr key={tp.id}>
                  <td className="font-semibold">{tp.name}</td>
                  <td>{tp.total_tickets}</td>
                  <td><strong>{tp.active_tickets}</strong> active</td>
                  <td className="text-emerald">{tp.resolved_tickets}</td>
                  <td>
                    {tp.breached_tickets > 0 ? (
                      <span className="text-rose font-bold">{tp.breached_tickets} breached</span>
                    ) : (
                      <span className="text-emerald">0 breaches</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${tp.active_tickets > 3 ? 'badge-inprogress' : 'badge-resolved'}`}>
                      {tp.active_tickets > 3 ? 'Heavy Load' : 'Normal Capacity'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
