// Seed enterprise mock data for NexusIT Helpdesk (Used for offline & Vercel deployment)

export const SLA_POLICIES = {
  'P1 - Critical': { responseTimeMinutes: 15, resolutionTimeMinutes: 120 },
  'P2 - High': { responseTimeMinutes: 60, resolutionTimeMinutes: 480 },
  'P3 - Medium': { responseTimeMinutes: 240, resolutionTimeMinutes: 1440 },
  'P4 - Low': { responseTimeMinutes: 480, resolutionTimeMinutes: 2880 }
};

export const initialTeams = [
  {
    id: 1,
    name: 'Tier 1 - Global Service Desk',
    description: 'First-line rapid response, intake triage, general software help, and password resets.',
    specialties: ['First Response', 'Triage', 'Software Provisioning', 'Basic Connectivity'],
    lead_name: 'Alex Torres',
    activeTicketsCount: 2,
    p1TicketsCount: 0,
    breachedTicketsCount: 0,
    members: [
      { id: 4, name: 'Alex Torres', email: 'alex.torres@enterprise.corp', role: 'agent', avatar_color: '#f59e0b' }
    ]
  },
  {
    id: 2,
    name: 'Tier 2 - Hardware & Peripherals',
    description: 'Physical equipment diagnostics, laptop repairs, monitor docking, and fleet depot swaps.',
    specialties: ['MacBook Pro', 'Dell XPS', 'CalDigit Docks', 'Battery Swaps', 'Display Issues'],
    lead_name: 'Priya Patel',
    activeTicketsCount: 2,
    p1TicketsCount: 0,
    breachedTicketsCount: 0,
    members: [
      { id: 3, name: 'Priya Patel', email: 'priya.patel@enterprise.corp', role: 'agent', avatar_color: '#10b981' }
    ]
  },
  {
    id: 3,
    name: 'Tier 3 - Network & Cloud Infrastructure',
    description: 'Corporate VPN gateways, Wi-Fi 802.1X radius, enterprise DNS routing, and firewalls.',
    specialties: ['Cisco AnyConnect', '802.1X Wi-Fi', 'DNS & Routing', 'GlobalProtect', 'Firewall'],
    lead_name: 'David Kim',
    activeTicketsCount: 3,
    p1TicketsCount: 2,
    breachedTicketsCount: 1,
    members: [
      { id: 2, name: 'David Kim', email: 'david.kim@enterprise.corp', role: 'agent', avatar_color: '#0284c7' }
    ]
  },
  {
    id: 4,
    name: 'Tier 3 - Identity, Access & Security (IAM)',
    description: 'Okta SSO, Duo Multi-Factor authentication, AWS IAM roles, and phishing security triage.',
    specialties: ['Okta SSO', 'MFA / Duo', 'AWS IAM', 'Phishing Triage', 'CrowdStrike'],
    lead_name: 'Elena Rostova',
    activeTicketsCount: 2,
    p1TicketsCount: 0,
    breachedTicketsCount: 0,
    members: [
      { id: 5, name: 'Elena Rostova', email: 'elena.rostova@enterprise.corp', role: 'agent', avatar_color: '#8b5cf6' }
    ]
  }
];

export const initialUsers = [
  { id: 1, name: 'Marcus Vance', email: 'admin@enterprise.corp', role: 'admin', department: 'IT Operations', team_id: 1, avatar_color: '#4f46e5' },
  { id: 2, name: 'David Kim', email: 'david.kim@enterprise.corp', role: 'agent', department: 'IT Infrastructure', team_id: 3, avatar_color: '#0284c7' },
  { id: 3, name: 'Priya Patel', email: 'priya.patel@enterprise.corp', role: 'agent', department: 'End-User Computing', team_id: 2, avatar_color: '#10b981' },
  { id: 4, name: 'Alex Torres', email: 'alex.torres@enterprise.corp', role: 'agent', department: 'IT Operations', team_id: 1, avatar_color: '#f59e0b' },
  { id: 5, name: 'Elena Rostova', email: 'elena.rostova@enterprise.corp', role: 'agent', department: 'Information Security', team_id: 4, avatar_color: '#8b5cf6' },
  { id: 6, name: 'Sarah Chen', email: 'sarah.chen@enterprise.corp', role: 'employee', department: 'Product Marketing', team_id: null, avatar_color: '#ec4899' },
  { id: 7, name: 'James Wilson', email: 'james.wilson@enterprise.corp', role: 'employee', department: 'Core Engineering', team_id: null, avatar_color: '#06b6d4' },
  { id: 8, name: 'Maya Lin', email: 'maya.lin@enterprise.corp', role: 'employee', department: 'Global Finance', team_id: null, avatar_color: '#14b8a6' },
  { id: 9, name: 'Robert Fox', email: 'robert.fox@enterprise.corp', role: 'employee', department: 'Enterprise Sales', team_id: null, avatar_color: '#e11d48' }
];

const now = new Date();
const subMinutes = (m) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const addMinutes = (m) => new Date(now.getTime() + m * 60 * 1000).toISOString();

export const initialTickets = [
  {
    id: 'TICK-1001',
    title: 'Cisco AnyConnect VPN handshake failure after macOS update',
    description: 'Since upgrading to macOS Sequoia this morning, AnyConnect gets stuck on "Establishing VPN - Activating VPN adapter" and then times out with error code 442. I am blocked from accessing staging and customer databases.',
    category: 'network',
    subcategory: 'VPN & Remote Gateway',
    priority: 'P1 - Critical',
    status: 'In Progress',
    created_by_id: 6,
    creator_name: 'Sarah Chen',
    creator_email: 'sarah.chen@enterprise.corp',
    creator_department: 'Product Marketing',
    creator_avatar_color: '#ec4899',
    assigned_to_id: 2,
    assignee_name: 'David Kim',
    team_id: 3,
    team_name: 'Tier 3 - Network & Cloud Infrastructure',
    device_tag: 'IT-MBP-9041',
    location: 'Remote - New York',
    ai_category: 'network',
    ai_confidence: 0.96,
    ai_suggested_priority: 'P1 - Critical',
    ai_suggested_solutions: [
      {
        title: 'Cisco AnyConnect / VPN Gateway Troubleshooting',
        steps: [
          '1. Run sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd in Terminal.',
          '2. Clear cached credentials in AnyConnect gear preferences.',
          '3. Check system keychain certificate validity.'
        ],
        quickCommands: ['sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd', 'scutil --dns']
      }
    ],
    resolution_notes: null,
    resolution_time_minutes: null,
    first_responded_at: subMinutes(38),
    resolved_at: null,
    sla_response_deadline: subMinutes(30),
    sla_resolution_deadline: addMinutes(75),
    sla_breached: 0,
    created_at: subMinutes(45),
    updated_at: subMinutes(45),
    timeline: [
      { id: 1, user_name: 'Sarah Chen', message: 'Ticket raised by employee', created_at: subMinutes(45) },
      { id: 2, user_name: 'NexusIT AI', message: 'AI auto-routed ticket to Network Infrastructure (96% confidence)', created_at: subMinutes(45) }
    ],
    messages: [
      { id: 1, user_name: 'David Kim', user_role: 'agent', message: 'Hi Sarah, David from Infrastructure here. Please try running `sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd` in Terminal.', is_internal: 0, created_at: subMinutes(35) },
      { id: 2, user_name: 'David Kim', user_role: 'agent', message: 'INTERNAL NOTE: Sequoia changed socket permissions for /var/run/vpnagent. We may need to push a mobileconfig profile via Jamf.', is_internal: 1, created_at: subMinutes(30) },
      { id: 3, user_name: 'Sarah Chen', user_role: 'employee', message: 'Thanks David! I ran the command and it restarted the daemon. Connecting to staging now!', is_internal: 0, created_at: subMinutes(15) }
    ]
  },
  {
    id: 'TICK-1002',
    title: 'MacBook Pro trackpad stiff & battery swelling noticeable at seam',
    description: 'I noticed my MacBook trackpad cannot be clicked anymore and the bottom aluminum case has a 2mm gap near the front lip. System information says "Service Recommended" on battery condition.',
    category: 'hardware',
    subcategory: 'Laptop Battery & Power',
    priority: 'P2 - High',
    status: 'In Progress',
    created_by_id: 7,
    creator_name: 'James Wilson',
    creator_email: 'james.wilson@enterprise.corp',
    creator_department: 'Core Engineering',
    creator_avatar_color: '#06b6d4',
    assigned_to_id: 3,
    assignee_name: 'Priya Patel',
    team_id: 2,
    team_name: 'Tier 2 - Hardware & Peripherals',
    device_tag: 'IT-MBP-8120',
    location: 'NY HQ - Floor 4',
    ai_category: 'hardware',
    ai_confidence: 0.98,
    ai_suggested_priority: 'P2 - High',
    ai_suggested_solutions: [
      {
        title: 'MacBook Power Management & SMC Controller Reset',
        steps: [
          '1. Cease charging immediately to prevent cell expansion.',
          '2. Shut down device and store on non-flammable surface.',
          '3. Exchange for immediate loaner laptop at IT Depot (Room 412).'
        ],
        quickCommands: ['system_profiler SPPowerDataType']
      }
    ],
    resolution_notes: null,
    resolution_time_minutes: null,
    first_responded_at: subMinutes(95),
    resolved_at: null,
    sla_response_deadline: subMinutes(50),
    sla_resolution_deadline: addMinutes(370),
    sla_breached: 0,
    created_at: subMinutes(110),
    updated_at: subMinutes(110),
    timeline: [
      { id: 1, user_name: 'James Wilson', message: 'Ticket raised by employee', created_at: subMinutes(110) }
    ],
    messages: []
  },
  {
    id: 'TICK-1005',
    title: 'Production VPN Gateway London Node Unreachable - SLA Breached',
    description: 'All 45 team members at the London Canary Wharf office cannot access enterprise intranet through gateway lon-vpn-01. Packets dropping at edge router.',
    category: 'network',
    subcategory: 'VPN & Remote Gateway',
    priority: 'P1 - Critical',
    status: 'In Progress',
    created_by_id: 9,
    creator_name: 'Robert Fox',
    creator_email: 'robert.fox@enterprise.corp',
    creator_department: 'Enterprise Sales',
    creator_avatar_color: '#e11d48',
    assigned_to_id: 2,
    assignee_name: 'David Kim',
    team_id: 3,
    team_name: 'Tier 3 - Network & Cloud Infrastructure',
    device_tag: 'GW-LON-EDGE',
    location: 'London Canary Wharf Office',
    ai_category: 'network',
    ai_confidence: 0.99,
    ai_suggested_priority: 'P1 - Critical',
    ai_suggested_solutions: [
      {
        title: 'BGP Routing & Cluster Failover Protocol',
        steps: [
          '1. Failover London traffic to lon-vpn-02 secondary cluster.',
          '2. Inspect BGP route advertisements on transit interface.',
          '3. Verify IPsec tunnel keepalive status.'
        ],
        quickCommands: ['ping -c 5 10.200.0.1', 'traceroute lon-vpn-01']
      }
    ],
    resolution_notes: null,
    resolution_time_minutes: null,
    first_responded_at: subMinutes(180),
    resolved_at: null,
    sla_response_deadline: subMinutes(175),
    sla_resolution_deadline: subMinutes(70),
    sla_breached: 1,
    created_at: subMinutes(190),
    updated_at: subMinutes(190),
    timeline: [
      { id: 1, user_name: 'Robert Fox', message: 'Ticket raised by employee', created_at: subMinutes(190) },
      { id: 2, user_name: 'NexusIT System', message: 'SLA resolution deadline breached by 70 minutes. Escalated to Tier 3 Lead.', created_at: subMinutes(70) }
    ],
    messages: []
  },
  {
    id: 'TICK-1006',
    title: 'Suspicious invoice email impersonating CFO received by finance team',
    description: 'Received email from "richard.cfo@enterprise-finance-corp.com" with a password-protected zip file requesting immediate wire settlement for vendor invoice.',
    category: 'security',
    subcategory: 'Phishing & Email Threat',
    priority: 'P1 - Critical',
    status: 'Resolved',
    created_by_id: 8,
    creator_name: 'Maya Lin',
    creator_email: 'maya.lin@enterprise.corp',
    creator_department: 'Global Finance',
    creator_avatar_color: '#14b8a6',
    assigned_to_id: 5,
    assignee_name: 'Elena Rostova',
    team_id: 4,
    team_name: 'Tier 3 - Identity, Access & Security (IAM)',
    device_tag: 'WS-DELL-3011',
    location: 'SF Tech Hub',
    ai_category: 'security',
    ai_confidence: 0.98,
    ai_suggested_priority: 'P1 - Critical',
    ai_suggested_solutions: [],
    resolution_notes: 'Confirmed phishing domain spoof. Tenant-wide quarantine rule executed. Malicious sender IP blocked on Palo Alto firewall.',
    resolution_time_minutes: 80,
    first_responded_at: subMinutes(295),
    resolved_at: subMinutes(220),
    sla_response_deadline: subMinutes(285),
    sla_resolution_deadline: subMinutes(180),
    sla_breached: 0,
    csat_rating: 5,
    csat_feedback: 'Fantastic and rapid response from the security team. Caught it within 10 minutes!',
    created_at: subMinutes(300),
    updated_at: subMinutes(220),
    timeline: [],
    messages: []
  }
];

export const initialKB = [
  {
    id: 1,
    title: 'Fixing Cisco AnyConnect Handshake and Certificate Errors',
    category: 'network',
    keywords: 'vpn, cisco, anyconnect, certificate, timeout, gateway, connection failed',
    summary: 'Step-by-step procedure to clear expired SSL profiles and kickstart the background VPN agent daemon on macOS and Windows.',
    steps: [
      'Terminate AnyConnect GUI completely.',
      'macOS: Run `sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd` in Terminal.',
      'Windows: Press Win+R, launch `services.msc`, right click Cisco AnyConnect Secure Mobility Agent -> Restart.',
      'Verify connection server is set to `vpn.corporate.internal` and authenticate via SSO Okta.'
    ],
    verified_solutions_count: 84
  },
  {
    id: 2,
    title: 'MacBook Battery Swelling & Rapid Drain Protocol',
    category: 'hardware',
    keywords: 'battery, swelling, macbook, charger, hot, drain, trackpad click failure',
    summary: 'Safety protocol for identifying lithium battery swelling and arranging rapid depot hardware replacement.',
    steps: [
      'Inspect trackpad: If trackpad is stiff or unable to click, internal battery expansion is present.',
      'Disconnect power adapter immediately and do not charge further.',
      'Perform clean shutdown and bring device to Tier 2 Hardware Desk (Room 412).'
    ],
    verified_solutions_count: 42
  },
  {
    id: 3,
    title: 'Corporate 802.1X Wi-Fi Re-Authentication',
    category: 'network',
    keywords: 'wifi, corp-secure, certificate, 802.1x, radius, disconnected, internet',
    summary: 'How to refresh network certificates and resolve the 802.1x authentication rejection.',
    steps: [
      'Open Wi-Fi Settings -> Select "Corp-Secure" -> Click Forget Network.',
      'Open Keychain Access / Certificate Store and delete expired "Enterprise-CA" user certs.',
      'Reconnect to "Corp-Secure", enter corporate email and current password.',
      'Accept new certificate fingerprint and click Trust.'
    ],
    verified_solutions_count: 129
  }
];
