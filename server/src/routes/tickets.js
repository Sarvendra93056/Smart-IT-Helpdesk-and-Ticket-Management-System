import express from 'express';
import db from '../db/index.js';
import { categorizeTicket, getRecommendedTeam } from '../services/aiClassifier.js';
import { calculateDeadlines, computeTicketSla } from '../services/slaService.js';

const router = express.Router();

/**
 * Get all tickets with rich filters and real-time SLA metrics
 */
router.get('/', async (req, res) => {
  try {
    const { category, status, priority, team_id, assigned_to_id, created_by_id, search, sla_status } = req.query;

    let sql = `
      SELECT 
        t.*,
        creator.name as creator_name,
        creator.email as creator_email,
        creator.department as creator_department,
        creator.avatar_color as creator_avatar_color,
        assignee.name as assignee_name,
        assignee.email as assignee_email,
        assignee.avatar_color as assignee_avatar_color,
        st.name as team_name
      FROM tickets t
      LEFT JOIN users creator ON t.created_by_id = creator.id
      LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
      LEFT JOIN support_teams st ON t.team_id = st.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      sql += ` AND t.category = ?`;
      params.push(category);
    }
    if (status && status !== 'all') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority && priority !== 'all') {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (team_id && team_id !== 'all') {
      sql += ` AND t.team_id = ?`;
      params.push(Number(team_id));
    }
    if (assigned_to_id && assigned_to_id !== 'all') {
      sql += ` AND t.assigned_to_id = ?`;
      params.push(Number(assigned_to_id));
    }
    if (created_by_id) {
      sql += ` AND t.created_by_id = ?`;
      params.push(Number(created_by_id));
    }
    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ? OR t.id LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY 
      CASE WHEN t.status IN ('Resolved', 'Closed') THEN 2 ELSE 1 END,
      t.sla_resolution_deadline ASC, 
      t.created_at DESC`;

    const tickets = await db.query(sql, params);

    // Compute live SLA stats for each ticket and check for breach updates
    const processedTickets = [];
    for (const ticket of tickets) {
      const sla = computeTicketSla(ticket);

      // Auto update sla_breached in DB if it transitioned
      if (sla.isBreached && !ticket.sla_breached) {
        await db.query(`UPDATE tickets SET sla_breached = 1 WHERE id = ?`, [ticket.id]);
        ticket.sla_breached = 1;
      }

      // Filter by SLA status if specified
      if (sla_status === 'breached' && !sla.isBreached) continue;
      if (sla_status === 'at_risk' && sla.health !== 'critical') continue;

      processedTickets.push({
        ...ticket,
        sla,
        attachments: ticket.attachments ? JSON.parse(ticket.attachments) : [],
        ai_suggested_solutions: ticket.ai_suggested_solutions ? JSON.parse(ticket.ai_suggested_solutions) : []
      });
    }

    res.json(processedTickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get ticket details by ID with timeline and messages
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await db.queryOne(
      `SELECT 
        t.*,
        creator.name as creator_name,
        creator.email as creator_email,
        creator.department as creator_department,
        creator.avatar_color as creator_avatar_color,
        assignee.name as assignee_name,
        assignee.email as assignee_email,
        assignee.avatar_color as assignee_avatar_color,
        st.name as team_name
      FROM tickets t
      LEFT JOIN users creator ON t.created_by_id = creator.id
      LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
      LEFT JOIN support_teams st ON t.team_id = st.id
      WHERE t.id = ?`,
      [id]
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const sla = computeTicketSla(ticket);

    // Fetch timeline events
    const timeline = await db.query(
      `SELECT tl.*, u.name as user_name, u.role as user_role
       FROM ticket_timeline tl
       LEFT JOIN users u ON tl.user_id = u.id
       WHERE tl.ticket_id = ?
       ORDER BY tl.created_at ASC`,
      [id]
    );

    // Fetch ticket messages (conversations and internal notes)
    const messages = await db.query(
      `SELECT tm.*, u.name as user_name, u.role as user_role, u.avatar_color as user_avatar_color
       FROM ticket_messages tm
       LEFT JOIN users u ON tm.user_id = u.id
       WHERE tm.ticket_id = ?
       ORDER BY tm.created_at ASC`,
      [id]
    );

    res.json({
      ...ticket,
      sla,
      attachments: ticket.attachments ? JSON.parse(ticket.attachments) : [],
      ai_suggested_solutions: ticket.ai_suggested_solutions ? JSON.parse(ticket.ai_suggested_solutions) : [],
      timeline,
      messages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create a new ticket with automatic AI categorization, priority scoring & SLA calculations
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category: manualCategory,
      priority: manualPriority,
      created_by_id,
      device_tag,
      location,
      attachments = []
    } = req.body;

    if (!title || !description || !created_by_id) {
      return res.status(400).json({ error: 'Title, description, and created_by_id are required' });
    }

    // 1. Run AI categorization and solution engine
    const aiAnalysis = categorizeTicket(title, description);

    const finalCategory = manualCategory || aiAnalysis.category;
    const finalSubcategory = aiAnalysis.subcategory;
    const finalPriority = manualPriority || aiAnalysis.suggestedPriority;
    const recommendedTeam = getRecommendedTeam(finalCategory);

    // 2. Generate unique Ticket ID
    const countRow = await db.queryOne(`SELECT COUNT(*) as count FROM tickets`);
    const nextNum = 1010 + Number(countRow?.count || 0) + 1;
    const ticketId = `TICK-${nextNum}`;

    // 3. Calculate SLA deadlines
    const now = new Date();
    const { responseDeadline, resolutionDeadline } = calculateDeadlines(finalPriority, now);

    // 4. Insert ticket
    await db.query(
      `INSERT INTO tickets (
        id, title, description, category, subcategory, priority, status,
        created_by_id, assigned_to_id, team_id, device_tag, location, attachments,
        ai_category, ai_confidence, ai_suggested_priority, ai_suggested_solutions,
        sla_response_deadline, sla_resolution_deadline, sla_breached,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        title,
        description,
        finalCategory,
        finalSubcategory,
        finalPriority,
        'Open',
        created_by_id,
        null, // initially unassigned
        recommendedTeam.id,
        device_tag || 'Standard Device',
        location || 'Corporate Office',
        JSON.stringify(attachments),
        aiAnalysis.category,
        aiAnalysis.confidence,
        aiAnalysis.suggestedPriority,
        JSON.stringify(aiAnalysis.matchedSolutions),
        responseDeadline,
        resolutionDeadline,
        0,
        now.toISOString(),
        now.toISOString()
      ]
    );

    // 5. Add initial timeline events
    await db.query(
      `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
       VALUES (?, ?, 'created', 'Ticket raised by employee', ?)`,
      [ticketId, created_by_id, now.toISOString()]
    );

    await db.query(
      `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
       VALUES (?, 1, 'assigned', ?, ?)`,
      [ticketId, `AI auto-routed ticket to ${recommendedTeam.name} with ${(aiAnalysis.confidence * 100).toFixed(0)}% confidence`, now.toISOString()]
    );

    // Fetch and return the newly created ticket
    const newTicket = await db.queryOne(
      `SELECT t.*, st.name as team_name
       FROM tickets t
       LEFT JOIN support_teams st ON t.team_id = st.id
       WHERE t.id = ?`,
      [ticketId]
    );

    res.status(201).json({
      ...newTicket,
      sla: computeTicketSla(newTicket),
      aiAnalysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Assign or reassign ticket to team & agent
 */
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to_id, team_id, updated_by_id } = req.body;

    const ticket = await db.queryOne(`SELECT * FROM tickets WHERE id = ?`, [id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    let newStatus = ticket.status;
    if (ticket.status === 'Open' && assigned_to_id) {
      newStatus = 'Assigned';
    }

    const now = new Date().toISOString();
    await db.query(
      `UPDATE tickets 
       SET assigned_to_id = ?, team_id = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [assigned_to_id || null, team_id || ticket.team_id, newStatus, now, id]
    );

    let assigneeName = 'Unassigned';
    if (assigned_to_id) {
      const assignee = await db.queryOne(`SELECT name FROM users WHERE id = ?`, [assigned_to_id]);
      assigneeName = assignee ? assignee.name : 'Support Agent';
    }

    await db.query(
      `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
       VALUES (?, ?, 'assigned', ?, ?)`,
      [id, updated_by_id || 1, `Ticket assigned to ${assigneeName}`, now]
    );

    res.json({ message: 'Ticket assigned successfully', assigned_to_id, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update ticket status (e.g. In Progress, Pending User, Resolved, Closed)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, updated_by_id } = req.body;

    const ticket = await db.queryOne(`SELECT * FROM tickets WHERE id = ?`, [id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date();
    let resolvedAt = ticket.resolved_at;
    let resolutionMinutes = ticket.resolution_time_minutes;
    let firstRespondedAt = ticket.first_responded_at;

    // Track first response time if starting work
    if (!firstRespondedAt && ['In Progress', 'Resolved'].includes(status)) {
      firstRespondedAt = now.toISOString();
    }

    // If resolving
    if (['Resolved', 'Closed'].includes(status) && !ticket.resolved_at) {
      resolvedAt = now.toISOString();
      const createdMs = new Date(ticket.created_at).getTime();
      resolutionMinutes = Math.max(1, Math.round((now.getTime() - createdMs) / (1000 * 60)));
    }

    await db.query(
      `UPDATE tickets
       SET status = ?, 
           resolution_notes = COALESCE(?, resolution_notes),
           resolved_at = ?,
           resolution_time_minutes = ?,
           first_responded_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        status,
        resolution_notes || null,
        resolvedAt,
        resolutionMinutes,
        firstRespondedAt,
        now.toISOString(),
        id
      ]
    );

    await db.query(
      `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
       VALUES (?, ?, 'status_change', ?, ?)`,
      [
        id,
        updated_by_id || 1,
        `Status changed from ${ticket.status} to ${status}${resolution_notes ? `: ${resolution_notes}` : ''}`,
        now.toISOString()
      ]
    );

    res.json({
      message: 'Status updated successfully',
      status,
      resolvedAt,
      resolutionMinutes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update ticket priority and recalculate SLA
 */
router.patch('/:id/priority', async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, updated_by_id } = req.body;

    const ticket = await db.queryOne(`SELECT * FROM tickets WHERE id = ?`, [id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { responseDeadline, resolutionDeadline } = calculateDeadlines(priority, ticket.created_at);
    const now = new Date().toISOString();

    await db.query(
      `UPDATE tickets
       SET priority = ?, sla_response_deadline = ?, sla_resolution_deadline = ?, updated_at = ?
       WHERE id = ?`,
      [priority, responseDeadline, resolutionDeadline, now, id]
    );

    await db.query(
      `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
       VALUES (?, ?, 'priority_change', ?, ?)`,
      [id, updated_by_id || 1, `Priority escalated from ${ticket.priority} to ${priority}. SLA adjusted.`, now]
    );

    res.json({ message: 'Priority updated', priority, responseDeadline, resolutionDeadline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add communication message or internal support note
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, message, is_internal = 0 } = req.body;

    if (!message || !user_id) {
      return res.status(400).json({ error: 'Message and user_id are required' });
    }

    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, user_id, message, is_internal ? 1 : 0, now]
    );

    // If agent responded to user, ensure first_responded_at is set
    const user = await db.queryOne(`SELECT role FROM users WHERE id = ?`, [user_id]);
    if (user && user.role !== 'employee') {
      const ticket = await db.queryOne(`SELECT first_responded_at FROM tickets WHERE id = ?`, [id]);
      if (!ticket.first_responded_at) {
        await db.query(`UPDATE tickets SET first_responded_at = ? WHERE id = ?`, [now, id]);
      }
    }

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Submit CSAT (Customer Satisfaction) rating
 */
router.post('/:id/csat', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback, user_id } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    await db.query(
      `UPDATE tickets
       SET csat_rating = ?, csat_feedback = ?
       WHERE id = ?`,
      [rating, feedback || null, id]
    );

    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
       VALUES (?, ?, 'status_change', ?, ?)`,
      [id, user_id || 1, `Employee submitted CSAT rating: ${'★'.repeat(rating)} (${rating}/5)`, now]
    );

    res.json({ message: 'CSAT submitted', rating, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
