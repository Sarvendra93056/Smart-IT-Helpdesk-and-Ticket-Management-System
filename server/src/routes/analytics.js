import express from 'express';
import db from '../db/index.js';
import { computeTicketSla } from '../services/slaService.js';

const router = express.Router();

/**
 * Enterprise IT Analytics & Reporting Dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const allTickets = await db.query(`SELECT * FROM tickets`);

    let totalCount = allTickets.length;
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let breachedCount = 0;
    let csatTotal = 0;
    let csatCount = 0;
    let totalResolutionMinutes = 0;
    let totalFirstResponseMinutes = 0;
    let responseCount = 0;

    const categoryCounts = { hardware: 0, network: 0, software: 0, access: 0, security: 0, other: 0 };
    const priorityCounts = { 'P1 - Critical': 0, 'P2 - High': 0, 'P3 - Medium': 0, 'P4 - Low': 0 };
    const statusCounts = { 'Open': 0, 'Assigned': 0, 'In Progress': 0, 'Pending User': 0, 'Resolved': 0, 'Closed': 0 };

    const breachedList = [];

    for (const ticket of allTickets) {
      const sla = computeTicketSla(ticket);

      // Status
      if (['Resolved', 'Closed'].includes(ticket.status)) {
        resolvedCount++;
      } else if (ticket.status === 'In Progress') {
        inProgressCount++;
      } else {
        openCount++;
      }

      if (statusCounts[ticket.status] !== undefined) {
        statusCounts[ticket.status]++;
      }

      // Category
      if (categoryCounts[ticket.category] !== undefined) {
        categoryCounts[ticket.category]++;
      } else {
        categoryCounts.other++;
      }

      // Priority
      if (priorityCounts[ticket.priority] !== undefined) {
        priorityCounts[ticket.priority]++;
      }

      // SLA Breaches
      if (sla.isBreached) {
        breachedCount++;
        breachedList.push({
          id: ticket.id,
          title: ticket.title,
          priority: ticket.priority,
          category: ticket.category,
          status: ticket.status,
          breachedByMinutes: Math.abs(sla.minutesLeftResolution),
          created_at: ticket.created_at
        });
      }

      // CSAT
      if (ticket.csat_rating) {
        csatTotal += ticket.csat_rating;
        csatCount++;
      }

      // Resolution Time
      if (ticket.resolution_time_minutes) {
        totalResolutionMinutes += ticket.resolution_time_minutes;
      }

      // First response time
      if (ticket.first_responded_at) {
        const createdMs = new Date(ticket.created_at).getTime();
        const respMs = new Date(ticket.first_responded_at).getTime();
        const diffMins = Math.max(1, Math.round((respMs - createdMs) / (60 * 1000)));
        totalFirstResponseMinutes += diffMins;
        responseCount++;
      }
    }

    // Calculations
    const slaComplianceRate = totalCount > 0 ? (((totalCount - breachedCount) / totalCount) * 100).toFixed(1) : 100;
    const avgFirstResponseMinutes = responseCount > 0 ? Math.round(totalFirstResponseMinutes / responseCount) : 0;
    const avgResolutionHours = resolvedCount > 0 ? (totalResolutionMinutes / resolvedCount / 60).toFixed(1) : 0;
    const avgCsat = csatCount > 0 ? (csatTotal / csatCount).toFixed(1) : '5.0';

    // Team Workload Summary
    const teams = await db.query(
      `SELECT 
        st.id, st.name,
        COUNT(t.id) as total_tickets,
        SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN t.status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as active_tickets,
        SUM(CASE WHEN t.sla_breached = 1 THEN 1 ELSE 0 END) as breached_tickets
       FROM support_teams st
       LEFT JOIN tickets t ON t.team_id = st.id
       GROUP BY st.id`
    );

    res.json({
      kpis: {
        totalTickets: totalCount,
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        resolvedTickets: resolvedCount,
        slaComplianceRate: Number(slaComplianceRate),
        slaBreachedCount: breachedCount,
        avgFirstResponseMinutes,
        avgResolutionHours: Number(avgResolutionHours),
        avgCsat: Number(avgCsat),
        csatResponsesCount: csatCount
      },
      distribution: {
        category: categoryCounts,
        priority: priorityCounts,
        status: statusCounts
      },
      teamPerformance: teams,
      breachedTickets: breachedList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Export tickets as CSV for enterprise reporting
 */
router.get('/export', async (req, res) => {
  try {
    const tickets = await db.query(
      `SELECT 
        t.id, t.title, t.category, t.subcategory, t.priority, t.status,
        creator.name as creator_name,
        assignee.name as assignee_name,
        st.name as team_name,
        t.resolution_time_minutes,
        t.sla_breached,
        t.csat_rating,
        t.created_at,
        t.resolved_at
       FROM tickets t
       LEFT JOIN users creator ON t.created_by_id = creator.id
       LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
       LEFT JOIN support_teams st ON t.team_id = st.id
       ORDER BY t.created_at DESC`
    );

    // Build CSV string
    const headers = [
      'Ticket ID', 'Title', 'Category', 'Subcategory', 'Priority', 'Status',
      'Creator', 'Assignee', 'Support Team', 'Resolution Minutes', 'SLA Breached',
      'CSAT Rating', 'Created At', 'Resolved At'
    ];

    const rows = tickets.map(t => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.category,
      t.subcategory || '',
      t.priority,
      t.status,
      t.creator_name || 'Unknown',
      t.assignee_name || 'Unassigned',
      t.team_name || 'Unassigned',
      t.resolution_time_minutes || '',
      t.sla_breached ? 'YES' : 'NO',
      t.csat_rating || '',
      t.created_at,
      t.resolved_at || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="it-helpdesk-report.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
