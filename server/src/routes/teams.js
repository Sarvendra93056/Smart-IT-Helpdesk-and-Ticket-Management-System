import express from 'express';
import db from '../db/index.js';

const router = express.Router();

/**
 * Get all support teams with active ticket count and member list
 */
router.get('/', async (req, res) => {
  try {
    const teams = await db.query(`SELECT * FROM support_teams ORDER BY id ASC`);

    const teamsWithDetails = [];
    for (const team of teams) {
      // Get team members
      const members = await db.query(
        `SELECT id, name, email, role, avatar_color 
         FROM users 
         WHERE team_id = ?`,
        [team.id]
      );

      // Active tickets assigned to this team
      const ticketCounts = await db.queryOne(
        `SELECT 
           COUNT(*) as total_active,
           SUM(CASE WHEN priority = 'P1 - Critical' THEN 1 ELSE 0 END) as p1_count,
           SUM(CASE WHEN sla_breached = 1 THEN 1 ELSE 0 END) as breached_count
         FROM tickets 
         WHERE team_id = ? AND status NOT IN ('Resolved', 'Closed')`,
        [team.id]
      );

      teamsWithDetails.push({
        ...team,
        specialties: team.specialties ? JSON.parse(team.specialties) : [],
        members,
        activeTicketsCount: Number(ticketCounts?.total_active || 0),
        p1TicketsCount: Number(ticketCounts?.p1_count || 0),
        breachedTicketsCount: Number(ticketCounts?.breached_count || 0)
      });
    }

    res.json(teamsWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all support agents with their current active workload
 * Useful for intelligent load balancing and 1-click assignment
 */
router.get('/agents', async (req, res) => {
  try {
    const agents = await db.query(
      `SELECT 
        u.id, u.name, u.email, u.department, u.team_id, u.avatar_color,
        st.name as team_name,
        COUNT(CASE WHEN t.status NOT IN ('Resolved', 'Closed') THEN 1 ELSE NULL END) as active_tickets_count
       FROM users u
       LEFT JOIN support_teams st ON u.team_id = st.id
       LEFT JOIN tickets t ON t.assigned_to_id = u.id
       WHERE u.role IN ('agent', 'admin')
       GROUP BY u.id
       ORDER BY active_tickets_count ASC, u.name ASC`
    );

    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
