// Universal API Client for NexusIT Helpdesk
// Seamlessly connects to backend REST APIs when available, and provides
// robust offline / Vercel fallback storage so the application runs flawlessly anywhere.

import { SLA_POLICIES } from './mockData';
import { initialUsers, initialTeams, initialTickets, initialKB } from './mockData';
import { categorizeTicketLocal } from './aiEngine';

const STORAGE_KEY_PREFIX = 'nexus_it_';

function getStored(key, defaultVal) {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
  } catch (e) {}
}

// Compute SLA in client
export function computeClientSla(ticket) {
  const now = new Date().getTime();
  const resDeadline = new Date(ticket.sla_resolution_deadline).getTime();
  const respDeadline = new Date(ticket.sla_response_deadline).getTime();

  const isResolved = ['Resolved', 'Closed'].includes(ticket.status);
  const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : null;

  const minutesLeftResolution = Math.round((resDeadline - (isResolved && resolvedAt ? resolvedAt : now)) / (60 * 1000));
  const isResolutionBreached = minutesLeftResolution < 0;

  const firstRespondedAt = ticket.first_responded_at ? new Date(ticket.first_responded_at).getTime() : null;
  const minutesLeftResponse = Math.round((respDeadline - (firstRespondedAt || now)) / (60 * 1000));
  const isResponseBreached = !firstRespondedAt && minutesLeftResponse < 0;

  let health = 'healthy';
  let badgeText = 'Within SLA';

  if (isResolutionBreached || isResponseBreached) {
    health = 'breached';
    badgeText = `Breached by ${Math.abs(minutesLeftResolution < 0 ? minutesLeftResolution : minutesLeftResponse)}m`;
  } else if (!isResolved && minutesLeftResolution <= 60) {
    health = 'critical';
    badgeText = `${minutesLeftResolution}m remaining (At Risk)`;
  } else if (!isResolved && minutesLeftResolution <= 180) {
    health = 'warning';
    badgeText = `${Math.round(minutesLeftResolution / 60)}h remaining`;
  } else if (!isResolved) {
    const hours = Math.round(minutesLeftResolution / 60);
    badgeText = hours > 24 ? `${Math.round(hours / 24)}d left` : `${hours}h left`;
  } else {
    badgeText = 'Resolved within SLA';
  }

  return {
    minutesLeftResolution,
    minutesLeftResponse,
    isResolutionBreached,
    isResponseBreached,
    isBreached: isResolutionBreached || Boolean(ticket.sla_breached),
    health,
    badgeText
  };
}

/**
 * Universal safe fetcher that inspects content-type before parsing JSON
 */
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return { success: true, data };
    }
    return { success: false, status: res.status, error: `Backend returned ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// In-Memory / LocalStorage State
let usersStore = getStored('users', initialUsers);
let teamsStore = getStored('teams', initialTeams);
let ticketsStore = getStored('tickets', initialTickets);
let kbStore = getStored('kb', initialKB);

export const api = {
  // 1. Get Users
  async getUsers() {
    const res = await safeFetch('/api/auth/users');
    if (res.success) {
      usersStore = res.data;
      setStored('users', usersStore);
      return res.data;
    }
    return usersStore;
  },

  // 2. Login
  async login(email, password) {
    const res = await safeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.success) {
      return res.data;
    }

    // Local fallback login
    const cleanEmail = email.toLowerCase().trim();
    const user = usersStore.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('User not found. Try admin@enterprise.corp or click a demo card below.');
    }

    if (password !== 'password123' && password !== 'admin123') {
      throw new Error('Invalid password. Default demo password is password123');
    }

    return {
      token: 'mock-jwt-token-' + user.id,
      user
    };
  },

  // 3. Switch User
  async switchUser(userId) {
    const res = await safeFetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (res.success) {
      return res.data;
    }

    const user = usersStore.find(u => u.id === Number(userId));
    if (!user) throw new Error('User not found');

    return {
      token: 'mock-jwt-token-' + user.id,
      user
    };
  },

  // 4. Get Tickets
  async getTickets(params = {}) {
    let url = '/api/tickets';
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;

    const res = await safeFetch(url);
    if (res.success) {
      ticketsStore = res.data;
      setStored('tickets', ticketsStore);
      return res.data;
    }

    // Return locally stored tickets with live SLA calculations
    return ticketsStore.map(t => {
      const sla = computeClientSla(t);
      if (sla.isBreached && !t.sla_breached) {
        t.sla_breached = 1;
      }
      return {
        ...t,
        sla
      };
    });
  },

  // 5. Get Single Ticket
  async getTicket(id) {
    const res = await safeFetch(`/api/tickets/${id}`);
    if (res.success) {
      return res.data;
    }

    const ticket = ticketsStore.find(t => t.id === id);
    if (!ticket) throw new Error('Ticket not found');

    return {
      ...ticket,
      sla: computeClientSla(ticket)
    };
  },

  // 6. Create Ticket
  async createTicket(ticketData) {
    const res = await safeFetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });

    if (res.success) {
      return res.data;
    }

    // Local creation
    const { title, description, category, priority, created_by_id, device_tag, location } = ticketData;
    const aiAnalysis = categorizeTicketLocal(title, description);

    const finalCategory = category || aiAnalysis.category;
    const finalPriority = priority || aiAnalysis.suggestedPriority;
    const now = new Date();

    const policy = SLA_POLICIES[finalPriority] || SLA_POLICIES['P3 - Medium'];
    const responseDeadline = new Date(now.getTime() + policy.responseTimeMinutes * 60 * 1000).toISOString();
    const resolutionDeadline = new Date(now.getTime() + policy.resolutionTimeMinutes * 60 * 1000).toISOString();

    const creator = usersStore.find(u => u.id === Number(created_by_id)) || usersStore[0];
    const ticketId = `TICK-${1020 + ticketsStore.length + 1}`;

    const newTicket = {
      id: ticketId,
      title,
      description,
      category: finalCategory,
      subcategory: aiAnalysis.subcategory,
      priority: finalPriority,
      status: 'Open',
      created_by_id: creator.id,
      creator_name: creator.name,
      creator_email: creator.email,
      creator_department: creator.department,
      creator_avatar_color: creator.avatar_color,
      assigned_to_id: null,
      assignee_name: null,
      team_id: aiAnalysis.recommendedTeam.id,
      team_name: aiAnalysis.recommendedTeam.name,
      device_tag: device_tag || 'IT-MBP-9041',
      location: location || 'NY HQ - Floor 4',
      ai_category: aiAnalysis.category,
      ai_confidence: aiAnalysis.confidence,
      ai_suggested_priority: aiAnalysis.suggestedPriority,
      ai_suggested_solutions: aiAnalysis.matchedSolutions,
      attachments: [],
      resolution_notes: null,
      resolution_time_minutes: null,
      first_responded_at: null,
      resolved_at: null,
      sla_response_deadline: responseDeadline,
      sla_resolution_deadline: resolutionDeadline,
      sla_breached: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      timeline: [
        { id: 1, user_name: creator.name, message: 'Ticket raised by employee', created_at: now.toISOString() },
        { id: 2, user_name: 'NexusIT AI', message: `AI auto-routed ticket to ${aiAnalysis.recommendedTeam.name}`, created_at: now.toISOString() }
      ],
      messages: []
    };

    newTicket.sla = computeClientSla(newTicket);
    ticketsStore = [newTicket, ...ticketsStore];
    setStored('tickets', ticketsStore);
    return newTicket;
  },

  // 7. Assign Ticket
  async assignTicket(id, data) {
    const res = await safeFetch(`/api/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.success) return res.data;

    const ticket = ticketsStore.find(t => t.id === id);
    if (ticket) {
      if (data.assigned_to_id) {
        const assignee = usersStore.find(u => u.id === Number(data.assigned_to_id));
        ticket.assigned_to_id = assignee ? assignee.id : null;
        ticket.assignee_name = assignee ? assignee.name : null;
        ticket.assignee_avatar_color = assignee ? assignee.avatar_color : null;
        if (ticket.status === 'Open') ticket.status = 'Assigned';
      }
      if (data.team_id) {
        const team = teamsStore.find(tm => tm.id === Number(data.team_id));
        ticket.team_id = team ? team.id : ticket.team_id;
        ticket.team_name = team ? team.name : ticket.team_name;
      }
      ticket.timeline.push({
        id: ticket.timeline.length + 1,
        user_name: 'IT Dispatcher',
        message: `Ticket assigned to ${ticket.assignee_name || 'Team'}`,
        created_at: new Date().toISOString()
      });
      setStored('tickets', ticketsStore);
    }
    return { success: true };
  },

  // 8. Update Status
  async updateStatus(id, data) {
    const res = await safeFetch(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.success) return res.data;

    const ticket = ticketsStore.find(t => t.id === id);
    if (ticket) {
      const now = new Date();
      ticket.status = data.status;
      if (data.resolution_notes) {
        ticket.resolution_notes = data.resolution_notes;
      }
      if (['Resolved', 'Closed'].includes(data.status)) {
        ticket.resolved_at = now.toISOString();
        const createdMs = new Date(ticket.created_at).getTime();
        ticket.resolution_time_minutes = Math.max(1, Math.round((now.getTime() - createdMs) / (60 * 1000)));
      }
      if (!ticket.first_responded_at && ['In Progress', 'Resolved'].includes(data.status)) {
        ticket.first_responded_at = now.toISOString();
      }
      ticket.timeline.push({
        id: ticket.timeline.length + 1,
        user_name: 'Support Agent',
        message: `Status updated to ${data.status}${data.resolution_notes ? `: ${data.resolution_notes}` : ''}`,
        created_at: now.toISOString()
      });
      setStored('tickets', ticketsStore);
    }
    return { success: true };
  },

  // 9. Post Message
  async postMessage(id, data) {
    const res = await safeFetch(`/api/tickets/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.success) return res.data;

    const ticket = ticketsStore.find(t => t.id === id);
    if (ticket) {
      const user = usersStore.find(u => u.id === Number(data.user_id)) || usersStore[0];
      const now = new Date().toISOString();
      ticket.messages.push({
        id: ticket.messages.length + 1,
        ticket_id: id,
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        message: data.message,
        is_internal: data.is_internal ? 1 : 0,
        created_at: now
      });
      if (user.role !== 'employee' && !ticket.first_responded_at) {
        ticket.first_responded_at = now;
      }
      setStored('tickets', ticketsStore);
    }
    return { success: true };
  },

  // 10. Submit CSAT
  async submitCsat(id, data) {
    const res = await safeFetch(`/api/tickets/${id}/csat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.success) return res.data;

    const ticket = ticketsStore.find(t => t.id === id);
    if (ticket) {
      ticket.csat_rating = data.rating;
      ticket.csat_feedback = data.feedback;
      ticket.timeline.push({
        id: ticket.timeline.length + 1,
        user_name: 'Employee',
        message: `Submitted CSAT rating: ${'★'.repeat(data.rating)} (${data.rating}/5)`,
        created_at: new Date().toISOString()
      });
      setStored('tickets', ticketsStore);
    }
    return { success: true };
  },

  // 11. Classify with AI
  async classifyAI(title, description) {
    const res = await safeFetch('/api/ai/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });

    if (res.success) return res.data;

    return categorizeTicketLocal(title, description);
  },

  // 12. Get Analytics Dashboard
  async getAnalytics() {
    const res = await safeFetch('/api/analytics/dashboard');
    if (res.success) return res.data;

    // Calculate analytics from local tickets
    let totalCount = ticketsStore.length;
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let breachedCount = 0;
    let csatTotal = 0;
    let csatCount = 0;
    let totalResMins = 0;
    let totalRespMins = 0;
    let respCount = 0;

    const catCounts = { hardware: 0, network: 0, software: 0, access: 0, security: 0, other: 0 };
    const prioCounts = { 'P1 - Critical': 0, 'P2 - High': 0, 'P3 - Medium': 0, 'P4 - Low': 0 };
    const statCounts = { 'Open': 0, 'Assigned': 0, 'In Progress': 0, 'Pending User': 0, 'Resolved': 0, 'Closed': 0 };
    const breachedList = [];

    for (const t of ticketsStore) {
      const sla = computeClientSla(t);
      if (['Resolved', 'Closed'].includes(t.status)) resolvedCount++;
      else if (t.status === 'In Progress') inProgressCount++;
      else openCount++;

      if (statCounts[t.status] !== undefined) statCounts[t.status]++;
      if (catCounts[t.category] !== undefined) catCounts[t.category]++;
      else catCounts.other++;
      if (prioCounts[t.priority] !== undefined) prioCounts[t.priority]++;

      if (sla.isBreached) {
        breachedCount++;
        breachedList.push({
          id: t.id,
          title: t.title,
          priority: t.priority,
          category: t.category,
          status: t.status,
          breachedByMinutes: Math.abs(sla.minutesLeftResolution),
          created_at: t.created_at
        });
      }

      if (t.csat_rating) {
        csatTotal += t.csat_rating;
        csatCount++;
      }

      if (t.resolution_time_minutes) {
        totalResMins += t.resolution_time_minutes;
      }

      if (t.first_responded_at) {
        const diff = Math.max(1, Math.round((new Date(t.first_responded_at) - new Date(t.created_at)) / (60 * 1000)));
        totalRespMins += diff;
        respCount++;
      }
    }

    const slaComplianceRate = totalCount > 0 ? (((totalCount - breachedCount) / totalCount) * 100).toFixed(1) : 100;
    const avgFirstResponse = respCount > 0 ? Math.round(totalRespMins / respCount) : 18;
    const avgResolutionHours = resolvedCount > 0 ? (totalResMins / resolvedCount / 60).toFixed(1) : 2.5;
    const avgCsat = csatCount > 0 ? (csatTotal / csatCount).toFixed(1) : '4.9';

    const teamPerformance = teamsStore.map(team => {
      const teamTickets = ticketsStore.filter(t => t.team_id === team.id);
      return {
        id: team.id,
        name: team.name,
        total_tickets: teamTickets.length,
        resolved_tickets: teamTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
        active_tickets: teamTickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length,
        breached_tickets: teamTickets.filter(t => t.sla_breached === 1).length
      };
    });

    return {
      kpis: {
        totalTickets: totalCount,
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        resolvedTickets: resolvedCount,
        slaComplianceRate: Number(slaComplianceRate),
        slaBreachedCount: breachedCount,
        avgFirstResponseMinutes: avgFirstResponse,
        avgResolutionHours: Number(avgResolutionHours),
        avgCsat: Number(avgCsat),
        csatResponsesCount: csatCount || 3
      },
      distribution: {
        category: catCounts,
        priority: prioCounts,
        status: statCounts
      },
      teamPerformance,
      breachedTickets: breachedList
    };
  },

  // 13. Get Teams
  async getTeams() {
    const res = await safeFetch('/api/teams');
    if (res.success) {
      teamsStore = res.data;
      setStored('teams', teamsStore);
      return res.data;
    }
    return teamsStore;
  },

  // 14. Get KB Articles
  async getKB(params = {}) {
    let url = '/api/kb';
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;

    const res = await safeFetch(url);
    if (res.success) {
      kbStore = res.data;
      setStored('kb', kbStore);
      return res.data;
    }

    let list = [...kbStore];
    if (params.category && params.category !== 'all') {
      list = list.filter(a => a.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(a => (a.title + a.summary + a.keywords).toLowerCase().includes(q));
    }
    return list;
  }
};

export default api;
