import bcrypt from 'bcryptjs';
import db from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDbAndSeed() {
  console.log('[DB Init] Reading schema.sql...');
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await db.executeRaw(schemaSql);

  // Check if already seeded
  const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
  const count = Number(usersCount[0]?.count || 0);

  if (count > 0) {
    console.log('[DB Init] Database already initialized with users.');
    return;
  }

  console.log('[DB Init] Seeding enterprise IT Helpdesk data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Support Teams
  const teams = [
    {
      id: 1,
      name: 'Tier 1 - Global Service Desk',
      description: 'First-line rapid response, intake triage, general software help, and password resets.',
      specialties: JSON.stringify(['First Response', 'Triage', 'Software Provisioning', 'Basic Connectivity']),
      lead_name: 'Alex Torres'
    },
    {
      id: 2,
      name: 'Tier 2 - Hardware & Peripherals',
      description: 'Physical equipment diagnostics, laptop repairs, monitor docking, and fleet depot swaps.',
      specialties: JSON.stringify(['MacBook Pro', 'Dell XPS', 'CalDigit Docks', 'Battery Swaps', 'Display Issues']),
      lead_name: 'Priya Patel'
    },
    {
      id: 3,
      name: 'Tier 3 - Network & Cloud Infrastructure',
      description: 'Corporate VPN gateways, Wi-Fi 802.1X radius, enterprise DNS routing, and firewalls.',
      specialties: JSON.stringify(['Cisco AnyConnect', '802.1X Wi-Fi', 'DNS & Routing', 'GlobalProtect', 'Firewall']),
      lead_name: 'David Kim'
    },
    {
      id: 4,
      name: 'Tier 3 - Identity, Access & Security (IAM)',
      description: 'Okta SSO, Duo Multi-Factor authentication, AWS IAM roles, and phishing security triage.',
      specialties: JSON.stringify(['Okta SSO', 'MFA / Duo', 'AWS IAM', 'Phishing Triage', 'CrowdStrike']),
      lead_name: 'Elena Rostova'
    }
  ];

  for (const team of teams) {
    await db.query(
      `INSERT INTO support_teams (id, name, description, specialties, lead_name)
       VALUES (?, ?, ?, ?, ?)`,
      [team.id, team.name, team.description, team.specialties, team.lead_name]
    );
  }

  // 2. Users (Admin, Agents, Employees)
  const users = [
    // Admin
    { id: 1, name: 'Marcus Vance', email: 'admin@enterprise.corp', role: 'admin', department: 'IT Operations', team_id: 1, avatar_color: '#4f46e5' },
    // IT Agents
    { id: 2, name: 'David Kim', email: 'david.kim@enterprise.corp', role: 'agent', department: 'IT Infrastructure', team_id: 3, avatar_color: '#0284c7' },
    { id: 3, name: 'Priya Patel', email: 'priya.patel@enterprise.corp', role: 'agent', department: 'End-User Computing', team_id: 2, avatar_color: '#10b981' },
    { id: 4, name: 'Alex Torres', email: 'alex.torres@enterprise.corp', role: 'agent', department: 'IT Operations', team_id: 1, avatar_color: '#f59e0b' },
    { id: 5, name: 'Elena Rostova', email: 'elena.rostova@enterprise.corp', role: 'agent', department: 'Information Security', team_id: 4, avatar_color: '#8b5cf6' },
    // Employees
    { id: 6, name: 'Sarah Chen', email: 'sarah.chen@enterprise.corp', role: 'employee', department: 'Product Marketing', team_id: null, avatar_color: '#ec4899' },
    { id: 7, name: 'James Wilson', email: 'james.wilson@enterprise.corp', role: 'employee', department: 'Core Engineering', team_id: null, avatar_color: '#06b6d4' },
    { id: 8, name: 'Maya Lin', email: 'maya.lin@enterprise.corp', role: 'employee', department: 'Global Finance', team_id: null, avatar_color: '#14b8a6' },
    { id: 9, name: 'Robert Fox', email: 'robert.fox@enterprise.corp', role: 'employee', department: 'Enterprise Sales', team_id: null, avatar_color: '#e11d48' }
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, department, team_id, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, passwordHash, u.role, u.department, u.team_id, u.avatar_color]
    );
  }

  // 3. Knowledge Base Articles
  const kbArticles = [
    {
      id: 1,
      title: 'Fixing Cisco AnyConnect Handshake and Certificate Errors',
      category: 'network',
      keywords: 'vpn, cisco, anyconnect, certificate, timeout, gateway, connection failed',
      summary: 'Step-by-step procedure to clear expired SSL profiles and kickstart the background VPN agent daemon on macOS and Windows.',
      steps: JSON.stringify([
        'Terminate AnyConnect GUI completely.',
        'macOS: Run `sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd` in Terminal.',
        'Windows: Press Win+R, launch `services.msc`, right click Cisco AnyConnect Secure Mobility Agent -> Restart.',
        'Verify your connection server is set to `vpn.corporate.internal` and log in via your SSO Okta credential.'
      ]),
      verified_solutions_count: 84
    },
    {
      id: 2,
      title: 'MacBook Battery Swelling & Rapid Drain Protocol',
      category: 'hardware',
      keywords: 'battery, swelling, macbook, charger, hot, drain, trackpad click failure',
      summary: 'Safety protocol for identifying lithium battery swelling and arranging rapid depot hardware replacement.',
      steps: JSON.stringify([
        'Inspect trackpad: If the trackpad is stiff or unable to click, internal battery expansion is present.',
        'Disconnect power adapter immediately and do not charge further.',
        'Save open work and perform a clean shutdown.',
        'Bring device to Tier 2 Hardware Desk (Room 412) or request express courier depot box.'
      ]),
      verified_solutions_count: 42
    },
    {
      id: 3,
      title: 'Corporate 802.1X Wi-Fi Re-Authentication',
      category: 'network',
      keywords: 'wifi, corp-secure, certificate, 802.1x, radius, disconnected, internet',
      summary: 'How to refresh network certificates and resolve the 802.1x authentication rejection.',
      steps: JSON.stringify([
        'Open Wi-Fi Settings -> Select "Corp-Secure" -> Click Forget Network.',
        'Open Keychain Access / Certificate Store and delete expired "Enterprise-CA" user certs.',
        'Reconnect to "Corp-Secure", enter your corporate email and current password.',
        'Accept the new certificate fingerprint and click Trust.'
      ]),
      verified_solutions_count: 129
    },
    {
      id: 4,
      title: 'Docker Desktop Engine Hung or Resource Starvation',
      category: 'software',
      keywords: 'docker, hung, cpu 100, memory leak, containers, socket error',
      summary: 'Resolving Docker VM deadlock and pruning stale images to free up host CPU and RAM.',
      steps: JSON.stringify([
        'Run `docker system prune -f --volumes` to wipe orphaned containers and anonymous volumes.',
        'Open Docker Desktop Settings -> Resources -> Set RAM to 8GB and CPUs to 4.',
        'Click Troubleshoot icon (bug icon in top right) -> Restart Docker Desktop.',
        'If engine fails to respond, run `pkill -9 Docker` and re-launch.'
      ]),
      verified_solutions_count: 67
    },
    {
      id: 5,
      title: 'Okta SSO Endless Loop & Session Invalidation',
      category: 'access',
      keywords: 'okta, sso, login loop, redirect, 400 error, session expired',
      summary: 'Fixing browser token mismatches causing continuous redirection back to login screen.',
      steps: JSON.stringify([
        'Open Chrome Settings -> Privacy and Security -> Clear Browsing Data.',
        'Select "Cookies and other site data" -> Search for "okta" and "corporate.internal" -> Delete.',
        'Flush DNS cache via Terminal: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`.',
        'Reopen browser in fresh window and authenticate with hardware MFA security key.'
      ]),
      verified_solutions_count: 153
    }
  ];

  for (const kb of kbArticles) {
    await db.query(
      `INSERT INTO knowledge_base (id, title, category, keywords, summary, steps, verified_solutions_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kb.id, kb.title, kb.category, kb.keywords, kb.summary, kb.steps, kb.verified_solutions_count]
    );
  }

  // 4. SLA Policies
  const slaPolicies = [
    { id: 1, priority: 'P1 - Critical', response: 15, resolution: 120, description: 'Outage / critical team blocker / severe security risk (24/7 on-call)' },
    { id: 2, priority: 'P2 - High', response: 60, resolution: 480, description: 'Significant performance degradation or single critical path workflow blocked' },
    { id: 3, priority: 'P3 - Medium', response: 240, resolution: 1440, description: 'Standard IT issue, peripheral defect, or non-blocking request' },
    { id: 4, priority: 'P4 - Low', response: 480, resolution: 2880, description: 'Inquiry, minor cosmetic glitch, or future scheduling request' }
  ];

  for (const p of slaPolicies) {
    await db.query(
      `INSERT INTO sla_policies (id, priority, response_time_minutes, resolution_time_minutes, description)
       VALUES (?, ?, ?, ?, ?)`,
      [p.id, p.priority, p.response, p.resolution, p.description]
    );
  }

  // 5. Seed Realistic Tickets with diverse SLA states
  const now = new Date();
  const subMinutes = (mins) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
  const addMinutes = (mins) => new Date(now.getTime() + mins * 60 * 1000).toISOString();

  const tickets = [
    {
      id: 'TICK-1001',
      title: 'Cisco AnyConnect VPN handshake failure after macOS update',
      description: 'Since upgrading to macOS Sequoia this morning, AnyConnect gets stuck on "Establishing VPN - Activating VPN adapter" and then times out with error code 442. I am blocked from accessing staging and customer databases.',
      category: 'network',
      subcategory: 'VPN & Remote Gateway',
      priority: 'P1 - Critical',
      status: 'In Progress',
      created_by_id: 6, // Sarah Chen
      assigned_to_id: 2, // David Kim
      team_id: 3, // Network team
      device_tag: 'IT-MBP-9041',
      location: 'Remote - New York',
      ai_category: 'network',
      ai_confidence: 0.96,
      ai_suggested_priority: 'P1 - Critical',
      ai_suggested_solutions: JSON.stringify(['Run sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd', 'Re-import Root Certificate in System Keychain']),
      created_at: subMinutes(45),
      sla_response_deadline: subMinutes(30),
      sla_resolution_deadline: addMinutes(75), // 75 mins remaining
      first_responded_at: subMinutes(38),
      sla_breached: 0
    },
    {
      id: 'TICK-1002',
      title: 'MacBook Pro trackpad stiff & battery swelling noticeable at seam',
      description: 'I noticed my MacBook trackpad cannot be clicked anymore and the bottom aluminum case has a 2mm gap near the front lip. System information says "Service Recommended" on battery condition.',
      category: 'hardware',
      subcategory: 'Laptop Battery & Power',
      priority: 'P2 - High',
      status: 'In Progress',
      created_by_id: 7, // James Wilson
      assigned_to_id: 3, // Priya Patel
      team_id: 2, // Hardware team
      device_tag: 'IT-MBP-8120',
      location: 'NY HQ - Floor 4',
      ai_category: 'hardware',
      ai_confidence: 0.98,
      ai_suggested_priority: 'P2 - High',
      ai_suggested_solutions: JSON.stringify(['Immediately cease charging to prevent thermal expansion', 'Issue loaner laptop from IT Depot']),
      created_at: subMinutes(110),
      sla_response_deadline: subMinutes(50),
      sla_resolution_deadline: addMinutes(370), // ~6 hours remaining
      first_responded_at: subMinutes(95),
      sla_breached: 0
    },
    {
      id: 'TICK-1003',
      title: 'Docker Desktop hangs indefinitely on startup, CPU pinned at 380%',
      description: 'Docker Desktop 4.34 fails to start the hypervisor VM. In Activity Monitor, `com.docker.backend` is spinning at maximum CPU and fans are screaming. Pruning images did not resolve.',
      category: 'software',
      subcategory: 'Developer Tooling & Containers',
      priority: 'P3 - Medium',
      status: 'Open',
      created_by_id: 7, // James Wilson
      assigned_to_id: null,
      team_id: 1,
      device_tag: 'IT-MBP-8120',
      location: 'Remote - Boston',
      ai_category: 'software',
      ai_confidence: 0.94,
      ai_suggested_priority: 'P3 - Medium',
      ai_suggested_solutions: JSON.stringify(['Clean / Purge data in Docker Settings', 'Purge stale qemu/hyperkit sockets']),
      created_at: subMinutes(80),
      sla_response_deadline: addMinutes(160),
      sla_resolution_deadline: addMinutes(1360),
      first_responded_at: null,
      sla_breached: 0
    },
    {
      id: 'TICK-1004',
      title: 'Okta SSO infinite redirect loop when opening Jira Cloud',
      description: 'Every time I open Jira or Confluence, the browser bounces between okta.enterprise.corp and atlassian.net 15 times before showing "HTTP 400 Bad Request: Request Header Or Cookie Too Large".',
      category: 'access',
      subcategory: 'SSO & Okta Authentication',
      priority: 'P2 - High',
      status: 'Assigned',
      created_by_id: 8, // Maya Lin
      assigned_to_id: 5, // Elena Rostova
      team_id: 4,
      device_tag: 'WS-DELL-3011',
      location: 'SF Tech Hub - Floor 2',
      ai_category: 'access',
      ai_confidence: 0.95,
      ai_suggested_priority: 'P2 - High',
      ai_suggested_solutions: JSON.stringify(['Clear cookies for domain *.okta.com and *.atlassian.net', 'Reset IdP session token']),
      created_at: subMinutes(140),
      sla_response_deadline: subMinutes(80),
      sla_resolution_deadline: addMinutes(340),
      first_responded_at: subMinutes(115),
      sla_breached: 0
    },
    {
      id: 'TICK-1005',
      title: 'Production VPN Gateway London Node Unreachable - SLA Breached',
      description: 'All 45 team members at the London Canary Wharf office cannot access enterprise intranet through gateway lon-vpn-01. Packets dropping at edge router.',
      category: 'network',
      subcategory: 'VPN & Remote Gateway',
      priority: 'P1 - Critical',
      status: 'In Progress',
      created_by_id: 9, // Robert Fox
      assigned_to_id: 2, // David Kim
      team_id: 3,
      device_tag: 'GW-LON-EDGE',
      location: 'London Canary Wharf Office',
      ai_category: 'network',
      ai_confidence: 0.99,
      ai_suggested_priority: 'P1 - Critical',
      ai_suggested_solutions: JSON.stringify(['Failover traffic to lon-vpn-02 secondary cluster', 'Inspect BGP route advertisement on transit router']),
      created_at: subMinutes(190), // raised 3+ hours ago
      sla_response_deadline: subMinutes(175),
      sla_resolution_deadline: subMinutes(70), // Breached 70 mins ago!
      first_responded_at: subMinutes(180),
      sla_breached: 1
    },
    {
      id: 'TICK-1006',
      title: 'Suspicious invoice email impersonating CFO received by finance team',
      description: 'Received email from "richard.cfo@enterprise-finance-corp.com" with a password-protected zip file requesting immediate wire settlement for vendor invoice.',
      category: 'security',
      subcategory: 'Phishing & Email Threat',
      priority: 'P1 - Critical',
      status: 'Resolved',
      created_by_id: 8, // Maya Lin
      assigned_to_id: 5, // Elena Rostova
      team_id: 4,
      device_tag: 'WS-DELL-3011',
      location: 'SF Tech Hub',
      ai_category: 'security',
      ai_confidence: 0.98,
      ai_suggested_priority: 'P1 - Critical',
      ai_suggested_solutions: JSON.stringify(['Purge email across all M365 tenant mailboxes', 'Block sending IP range in Proofpoint gateway']),
      created_at: subMinutes(300),
      sla_response_deadline: subMinutes(285),
      sla_resolution_deadline: subMinutes(180),
      first_responded_at: subMinutes(295),
      resolved_at: subMinutes(220),
      resolution_time_minutes: 80,
      resolution_notes: 'Confirmed phishing domain spoof. Tenant-wide quarantine rule executed. Malicious sender IP blocked on Palo Alto firewall.',
      sla_breached: 0,
      csat_rating: 5,
      csat_feedback: 'Fantastic and rapid response from the security team. Caught it within 10 minutes!'
    },
    {
      id: 'TICK-1007',
      title: 'External 4K Studio Display flickering when connected via Thunderbolt hub',
      description: 'The Studio Display goes black for 2 seconds every few minutes when typing or opening heavy graphics apps. Cable swapped, but issue continues.',
      category: 'hardware',
      subcategory: 'Display & External Monitors',
      priority: 'P3 - Medium',
      status: 'Resolved',
      created_by_id: 6, // Sarah Chen
      assigned_to_id: 3, // Priya Patel
      team_id: 2,
      device_tag: 'IT-MBP-9041',
      location: 'NY HQ - Floor 4',
      ai_category: 'hardware',
      ai_confidence: 0.91,
      ai_suggested_priority: 'P3 - Medium',
      ai_suggested_solutions: JSON.stringify(['Update CalDigit dock firmware to v42', 'Switch refresh rate from variable to 60Hz']),
      created_at: subMinutes(700),
      sla_response_deadline: subMinutes(460),
      sla_resolution_deadline: subMinutes(0),
      first_responded_at: subMinutes(650),
      resolved_at: subMinutes(450),
      resolution_time_minutes: 250,
      resolution_notes: 'Replaced faulty Thunderbolt 4 passive cable with an active 40Gbps cable. Firmware updated on dock. Display stable for 2 hours testing.',
      sla_breached: 0,
      csat_rating: 5,
      csat_feedback: 'Priya fixed this quickly with a certified cable replacement. Working smoothly!'
    },
    {
      id: 'TICK-1008',
      title: 'Need AWS IAM read-only role for data engineering staging cluster',
      description: 'I need assume-role permissions for `arn:aws:iam::123456789012:role/DataEng-Staging-Read` to debug nightly ETL pipeline failures.',
      category: 'access',
      subcategory: 'System Permissions & IAM Roles',
      priority: 'P3 - Medium',
      status: 'Open',
      created_by_id: 7, // James Wilson
      assigned_to_id: null,
      team_id: 4,
      device_tag: 'IT-MBP-8120',
      location: 'Remote - Boston',
      ai_category: 'access',
      ai_confidence: 0.93,
      ai_suggested_priority: 'P3 - Medium',
      ai_suggested_solutions: JSON.stringify(['Verify manager approval in ServiceNow IAM catalog', 'Attach Okta group DataEng-Staging-Viewers']),
      created_at: subMinutes(60),
      sla_response_deadline: addMinutes(180),
      sla_resolution_deadline: addMinutes(1380),
      first_responded_at: null,
      sla_breached: 0
    },
    {
      id: 'TICK-1009',
      title: 'Wi-Fi 802.1X certificate renewal failed on 4th floor conference rooms',
      description: 'Devices in conference rooms 4A, 4B, and 4C are repeatedly dropping off the Corp-Secure SSID and prompting for unknown certificate trust.',
      category: 'network',
      subcategory: 'Office Wi-Fi & 802.1X',
      priority: 'P2 - High',
      status: 'In Progress',
      created_by_id: 9, // Robert Fox
      assigned_to_id: 2, // David Kim
      team_id: 3,
      device_tag: 'AP-NY-FL4-C',
      location: 'NY HQ - Floor 4',
      ai_category: 'network',
      ai_confidence: 0.97,
      ai_suggested_priority: 'P2 - High',
      ai_suggested_solutions: JSON.stringify(['Re-distribute Intermediate CA certificate via Jamf', 'Restart Aruba AP Controller profile']),
      created_at: subMinutes(450), // Raised 7.5 hours ago (8 hr resolution SLA!)
      sla_response_deadline: subMinutes(390),
      sla_resolution_deadline: addMinutes(30), // Only 30 mins left! AT RISK!
      first_responded_at: subMinutes(420),
      sla_breached: 0
    }
  ];

  for (const t of tickets) {
    await db.query(
      `INSERT INTO tickets (
        id, title, description, category, subcategory, priority, status,
        created_by_id, assigned_to_id, team_id, device_tag, location,
        ai_category, ai_confidence, ai_suggested_priority, ai_suggested_solutions,
        resolution_notes, resolution_time_minutes, first_responded_at, resolved_at,
        sla_response_deadline, sla_resolution_deadline, sla_breached, csat_rating, csat_feedback,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, t.title, t.description, t.category, t.subcategory, t.priority, t.status,
        t.created_by_id, t.assigned_to_id, t.team_id, t.device_tag, t.location,
        t.ai_category, t.ai_confidence, t.ai_suggested_priority, t.ai_suggested_solutions,
        t.resolution_notes || null, t.resolution_time_minutes || null,
        t.first_responded_at || null, t.resolved_at || null,
        t.sla_response_deadline, t.sla_resolution_deadline, t.sla_breached,
        t.csat_rating || null, t.csat_feedback || null,
        t.created_at, t.created_at
      ]
    );

    // Seed activity timeline for ticket
    await db.query(
      `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
       VALUES (?, ?, 'created', 'Ticket created by user', ?)`,
      [t.id, t.created_by_id, t.created_at]
    );

    if (t.assigned_to_id) {
      await db.query(
        `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
         VALUES (?, 1, 'assigned', 'Assigned to support agent', ?)`,
        [t.id, t.created_at]
      );
    }

    if (t.first_responded_at) {
      await db.query(
        `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
         VALUES (?, ?, 'status_change', 'First response initiated by agent', ?)`,
        [t.id, t.assigned_to_id || 1, t.first_responded_at]
      );
    }

    if (t.sla_breached) {
      await db.query(
        `INSERT INTO ticket_timeline (ticket_id, user_id, action_type, message, created_at)
         VALUES (?, 1, 'sla_breach', 'SLA resolution deadline breached by 70 minutes. Escalated to Tier 3 Lead.', ?)`,
        [t.id, t.sla_resolution_deadline]
      );
    }
  }

  // 6. Seed sample communication messages
  await db.query(
    `INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal, created_at)
     VALUES (?, ?, ?, 0, ?)`,
    ['TICK-1001', 2, 'Hi Sarah, David from Infrastructure here. I see your Sequoia upgrade triggered the AnyConnect 442 socket lock. Could you try running the terminal command `sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd`?', subMinutes(35)]
  );

  await db.query(
    `INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal, created_at)
     VALUES (?, ?, ?, 1, ?)`,
    ['TICK-1001', 2, 'INTERNAL NOTE: Sequoia changed socket permissions for /var/run/vpnagent. We may need to push a mobileconfig profile via Jamf if more users upgrade today.', subMinutes(30)]
  );

  await db.query(
    `INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal, created_at)
     VALUES (?, ?, ?, 0, ?)`,
    ['TICK-1001', 6, 'Thanks David! I ran the command and entered my admin password. It restarted the daemon and I was able to connect to the staging gateway!', subMinutes(15)]
  );

  console.log('[DB Init] Seeding completed successfully!');
}

export default initDbAndSeed;
