// Enterprise SLA Calculation and Monitoring Service

export const SLA_POLICIES = {
  'P1 - Critical': {
    priority: 'P1 - Critical',
    responseTimeMinutes: 15,
    resolutionTimeMinutes: 120, // 2 hours
    description: 'Critical business blocker / system outage / urgent client impact (24/7 on-call)'
  },
  'P2 - High': {
    priority: 'P2 - High',
    responseTimeMinutes: 60, // 1 hour
    resolutionTimeMinutes: 480, // 8 hours (same-day)
    description: 'Significant performance degradation or single critical workflow blocked'
  },
  'P3 - Medium': {
    priority: 'P3 - Medium',
    responseTimeMinutes: 240, // 4 hours
    resolutionTimeMinutes: 1440, // 24 hours (1 business day)
    description: 'Standard IT service request, peripheral issue, or non-blocking defect'
  },
  'P4 - Low': {
    priority: 'P4 - Low',
    responseTimeMinutes: 480, // 8 hours
    resolutionTimeMinutes: 2880, // 48 hours (2 business days)
    description: 'General inquiry, minor cosmetic issue, or future provisioning request'
  }
};

/**
 * Calculate SLA deadlines for a newly raised ticket
 */
export function calculateDeadlines(priority, startTime = new Date()) {
  const policy = SLA_POLICIES[priority] || SLA_POLICIES['P3 - Medium'];
  const startMs = new Date(startTime).getTime();

  const responseDeadline = new Date(startMs + policy.responseTimeMinutes * 60 * 1000);
  const resolutionDeadline = new Date(startMs + policy.resolutionTimeMinutes * 60 * 1000);

  return {
    responseDeadline: responseDeadline.toISOString(),
    resolutionDeadline: resolutionDeadline.toISOString(),
    policy
  };
}

/**
 * Compute real-time SLA metrics for an individual ticket
 */
export function computeTicketSla(ticket) {
  const now = new Date().getTime();
  const resDeadline = new Date(ticket.sla_resolution_deadline).getTime();
  const respDeadline = new Date(ticket.sla_response_deadline).getTime();

  const isResolved = ['Resolved', 'Closed'].includes(ticket.status);
  const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : null;

  // Resolution SLA check
  const minutesLeftResolution = Math.round((resDeadline - (isResolved && resolvedAt ? resolvedAt : now)) / (60 * 1000));
  const isResolutionBreached = minutesLeftResolution < 0;

  // Response SLA check
  const firstRespondedAt = ticket.first_responded_at ? new Date(ticket.first_responded_at).getTime() : null;
  const minutesLeftResponse = Math.round((respDeadline - (firstRespondedAt || now)) / (60 * 1000));
  const isResponseBreached = !firstRespondedAt && minutesLeftResponse < 0;

  // Overall ticket SLA status
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

export default {
  SLA_POLICIES,
  calculateDeadlines,
  computeTicketSla
};
