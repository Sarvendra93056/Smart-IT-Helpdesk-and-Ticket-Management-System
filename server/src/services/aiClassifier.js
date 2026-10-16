// Smart AI Categorization & Resolution Engine for Enterprise IT Helpdesk

const CATEGORY_RULES = {
  hardware: {
    name: 'hardware',
    subcategories: [
      { name: 'Laptop Battery & Power', keywords: ['battery', 'charge', 'charger', 'swelling', 'drain', 'power adapter', 'magsafe', 'shut off', 'wont turn on'] },
      { name: 'Display & External Monitors', keywords: ['monitor', 'screen', 'display', 'flicker', 'hdmi', 'displayport', 'resolution', 'black screen', 'ghosting', 'second monitor'] },
      { name: 'Peripherals & Docking Station', keywords: ['keyboard', 'mouse', 'trackpad', 'dock', 'caldigit', 'hub', 'usb-c', 'camera', 'webcam', 'microphone', 'headset', 'bluetooth'] },
      { name: 'Thermal & System Performance', keywords: ['fan', 'loud', 'overheat', 'thermal', 'throttling', 'freeze', 'kernel panic', 'slow macbook', 'hot'] }
    ],
    defaultSubcategory: 'Hardware & Laptop Issue',
    keywords: ['laptop', 'macbook', 'dell', 'thinkpad', 'screen', 'keyboard', 'battery', 'monitor', 'hardware', 'usb', 'dock', 'charger', 'charger', 'mouse', 'webcam']
  },
  network: {
    name: 'network',
    subcategories: [
      { name: 'VPN & Remote Gateway', keywords: ['vpn', 'cisco', 'anyconnect', 'globalprotect', 'tunnel', 'gateway', 'handshake', 'remote connection', 'split tunnel'] },
      { name: 'Office Wi-Fi & 802.1X', keywords: ['wifi', 'wi-fi', 'corp-wifi', 'ssid', 'disconnect', 'certificate', 'radius', 'signal', 'wlan', 'captive'] },
      { name: 'DNS & Internet Connectivity', keywords: ['dns', 'ping', 'packet loss', 'speed', 'slow internet', 'unreachable', 'resolve', 'ethernet', 'lan', 'ip address'] }
    ],
    defaultSubcategory: 'Network & Connectivity',
    keywords: ['wifi', 'wi-fi', 'vpn', 'cisco', 'internet', 'network', 'ethernet', 'dns', 'ip', 'bandwidth', 'disconnect', 'packet loss', 'gateway', 'timeout']
  },
  software: {
    name: 'software',
    subcategories: [
      { name: 'Developer Tooling & Containers', keywords: ['docker', 'kubernetes', 'git', 'github', 'vscode', 'intellij', 'terminal', 'node', 'python', 'npm', 'build error'] },
      { name: 'Collaboration & Productivity', keywords: ['slack', 'zoom', 'teams', 'outlook', 'email', 'excel', 'word', 'office 365', 'google workspace', 'notion'] },
      { name: 'OS & System Software', keywords: ['macos', 'sequoia', 'sonoma', 'windows 11', 'update loop', 'crash', 'freeze', 'app store', 'license', 'activation'] }
    ],
    defaultSubcategory: 'Software Application',
    keywords: ['software', 'app', 'crash', 'docker', 'vscode', 'slack', 'zoom', 'license', 'install', 'update', 'macos', 'windows', 'excel', 'git', 'error code']
  },
  access: {
    name: 'access',
    subcategories: [
      { name: 'SSO & Okta Authentication', keywords: ['sso', 'okta', 'single sign-on', 'login loop', 'session expired', 'credentials', 'password reset', 'forgot password'] },
      { name: 'Multi-Factor Auth (MFA / 2FA)', keywords: ['mfa', '2fa', 'authenticator', 'duo', 'yubikey', 'push notification', 'new phone', 'sms code'] },
      { name: 'System Permissions & IAM Roles', keywords: ['permission', 'access denied', 'unauthorized', 'aws role', 'jira access', 'github org', 'shared drive', 'admin rights'] }
    ],
    defaultSubcategory: 'Identity & Access Management',
    keywords: ['access', 'password', 'login', 'sso', 'okta', 'mfa', '2fa', 'permission', 'locked', 'reset', 'auth', 'role', 'account', 'badge']
  },
  security: {
    name: 'security',
    subcategories: [
      { name: 'Phishing & Email Threat', keywords: ['phishing', 'suspicious email', 'fake invoice', 'spoof', 'wire transfer', 'impersonation'] },
      { name: 'Endpoint Protection & Alerts', keywords: ['crowdstrike', 'falcon', 'antivirus', 'malware', 'trojan', 'quarantine', 'security alert', 'bitlocker'] },
      { name: 'Credential Leak & Lost Device', keywords: ['lost laptop', 'stolen', 'lost badge', 'compromised', 'token leak', 'unauthorized device'] }
    ],
    defaultSubcategory: 'Information Security',
    keywords: ['security', 'phishing', 'suspicious', 'malware', 'hacked', 'stolen', 'lost', 'crowdstrike', 'virus', 'breach', 'leak']
  }
};

const KNOWLEDGE_BASE_SOLUTIONS = {
  vpn: {
    title: 'Cisco AnyConnect / VPN Gateway Troubleshooting',
    confidence: 0.94,
    steps: [
      '1. Open Terminal / Command Prompt and verify network reachability: `ping 8.8.8.8`',
      '2. Clear cached credentials: In Cisco AnyConnect, disconnect and click the gear icon -> Clear Credentials.',
      '3. Restart the VPN daemon service: Run `sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd` (macOS) or restart Cisco AnyConnect Service via services.msc (Windows).',
      '4. If using home Wi-Fi with IPv6 enabled, temporarily switch DNS to 1.1.1.1 and retry connecting to gateway `vpn.corporate.internal`.'
    ],
    quickCommands: ['sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd', 'scutil --dns', 'killall -HUP mDNSResponder'],
    estimatedSelfResolutionMinutes: 5
  },
  wifi: {
    title: 'Corporate 802.1X Wi-Fi Profile & Certificate Refresh',
    confidence: 0.91,
    steps: [
      '1. Forget the network: Go to Wi-Fi Settings -> Corp-Secure -> Forget Network.',
      '2. Check Keychain Access: Search for "Corp-WiFi Certificate" and ensure it is not expired.',
      '3. Reconnect to Corp-Secure using your corporate email and current SSO password (not local laptop PIN).',
      '4. Flush the DNS resolver cache: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`.'
    ],
    quickCommands: ['sudo dscacheutil -flushcache', 'sudo killall -HUP mDNSResponder'],
    estimatedSelfResolutionMinutes: 3
  },
  battery: {
    title: 'MacBook Power Management & SMC Controller Reset',
    confidence: 0.93,
    steps: [
      '1. Check battery cycle health: Click Apple Menu -> System Settings -> Battery -> Battery Health.',
      '2. Disconnect high-draw USB-C hubs and test with official 96W Apple power adapter directly in left-side port.',
      '3. Perform an SMC / Power controller reset (for Apple Silicon, simply shut down and keep closed for 30s; for Intel, hold Shift+Ctrl+Option+Power for 10s).',
      '4. IMPORTANT: If physical swelling or chassis bulging is observed, stop charging immediately and submit for priority hardware depot swap.'
    ],
    quickCommands: ['system_profiler SPPowerDataType | grep -A 8 "Health Information"'],
    estimatedSelfResolutionMinutes: 8
  },
  docker: {
    title: 'Docker Desktop Engine Reset & Resource Allocation',
    confidence: 0.92,
    steps: [
      '1. Check running socket: `docker info` or restart Docker Desktop from Applications.',
      '2. Clean stale builder cache and hanging containers: `docker system prune -f --volumes`',
      '3. In Docker Settings -> Resources -> Virtual Disk, increase disk limit or click "Clean / Purge data".',
      '4. Verify enterprise license: Settings -> Sign In with Corporate SSO to avoid rate limits.'
    ],
    quickCommands: ['docker system prune -f --volumes', 'docker ps -a'],
    estimatedSelfResolutionMinutes: 5
  },
  sso: {
    title: 'Okta SSO Session Loop & MFA Device Reset Runbook',
    confidence: 0.95,
    steps: [
      '1. Open an Incognito / Private window to rule out stale browser cookies.',
      '2. Clear site data for `*.okta.com` and your corporate identity provider.',
      '3. If Duo / Okta Verify push fails, ensure your phone time is set to "Automatic Network Time".',
      '4. If locked out after 3 invalid attempts, contact Tier 1 support or use the self-service SMS unlock portal at `identity.corporate.internal/unlock`.'
    ],
    quickCommands: ['chrome://settings/clearBrowserData'],
    estimatedSelfResolutionMinutes: 4
  },
  generic_monitor: {
    title: 'External Monitor Resolution & Thunderbolt Handshake',
    confidence: 0.88,
    steps: [
      '1. Unplug the USB-C / Thunderbolt dock from the laptop, wait 5 seconds, and reconnect firmly.',
      '2. Open Displays Settings -> Hold `Option` key and click "Detect Displays".',
      '3. Lower refresh rate from 144Hz to 60Hz to test cable signal integrity.',
      '4. Swap video cable (DP/HDMI) or test directly with dedicated USB-C to HDMI adapter.'
    ],
    quickCommands: ['system_profiler SPDisplaysDataType'],
    estimatedSelfResolutionMinutes: 5
  }
};

/**
 * Intelligent categorization and recommendation algorithm
 */
export function categorizeTicket(title = '', description = '') {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // 1. Calculate category scores based on keyword density and weights
  const scores = {};
  for (const [categoryKey, config] of Object.entries(CATEGORY_RULES)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (combinedText.includes(kw)) {
        score += kw.length > 5 ? 2.5 : 1.5;
      }
    }
    scores[categoryKey] = score;
  }

  // Find highest scoring category
  let topCategory = 'software'; // default fallback
  let highestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      topCategory = cat;
    }
  }

  // If score is 0, default to 'other' or 'software'
  if (highestScore === 0) {
    topCategory = 'software';
  }

  // 2. Determine Subcategory
  const categoryConfig = CATEGORY_RULES[topCategory] || CATEGORY_RULES.software;
  let topSubcategory = categoryConfig.defaultSubcategory;
  let subScoreMax = 0;

  for (const sub of categoryConfig.subcategories) {
    let subScore = 0;
    for (const kw of sub.keywords) {
      if (combinedText.includes(kw)) {
        subScore += 2;
      }
    }
    if (subScore > subScoreMax) {
      subScoreMax = subScore;
      topSubcategory = sub.name;
    }
  }

  // 3. Priority Detection (Enterprise SLA scoring)
  const criticalSignals = [
    'entire team', 'all users', 'production down', 'cannot work', 'outage',
    'security breach', 'stolen laptop', 'ransomware', 'critical client meeting',
    'blocked entirely', 'urgent deadline', 'sev 1', 'p1'
  ];
  const highSignals = [
    'blocking', 'urgent', 'executive', 'presentation', 'cannot login', 'broken',
    'battery swelling', 'danger', 'failing', 'deadline today', 'high priority'
  ];
  const lowSignals = [
    'when you have time', 'question', 'feature request', 'information', 'how do i',
    'inquiry', 'not urgent', 'minor cosmetic'
  ];

  let priority = 'P3 - Medium'; // Standard SLA default
  let confidence = Math.min(0.98, Math.max(0.72, 0.70 + (highestScore * 0.04)));

  if (criticalSignals.some(s => combinedText.includes(s))) {
    priority = 'P1 - Critical';
    confidence = Math.max(confidence, 0.95);
  } else if (highSignals.some(s => combinedText.includes(s))) {
    priority = 'P2 - High';
    confidence = Math.max(confidence, 0.88);
  } else if (lowSignals.some(s => combinedText.includes(s))) {
    priority = 'P4 - Low';
  } else if (topCategory === 'security') {
    priority = 'P2 - High';
  }

  // 4. Match Knowledge Base & Runbooks
  let matchedSolutions = [];
  if (combinedText.includes('vpn') || combinedText.includes('anyconnect')) {
    matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.vpn);
  }
  if (combinedText.includes('wifi') || combinedText.includes('wi-fi') || combinedText.includes('network') || combinedText.includes('internet')) {
    matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.wifi);
  }
  if (combinedText.includes('battery') || combinedText.includes('charge') || combinedText.includes('power')) {
    matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.battery);
  }
  if (combinedText.includes('docker') || combinedText.includes('container')) {
    matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.docker);
  }
  if (combinedText.includes('sso') || combinedText.includes('okta') || combinedText.includes('mfa') || combinedText.includes('login') || combinedText.includes('password')) {
    matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.sso);
  }
  if (combinedText.includes('monitor') || combinedText.includes('screen') || combinedText.includes('display')) {
    matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.generic_monitor);
  }

  // Fallback solution if none matched specifically
  if (matchedSolutions.length === 0) {
    matchedSolutions.push({
      title: `General Diagnostic for ${topCategory.toUpperCase()} - ${topSubcategory}`,
      confidence: 0.80,
      steps: [
        '1. Gather system telemetry: Note operating system version, active network interface, and error dialog timestamps.',
        '2. Perform soft system restart to release file handles and stale daemon locks.',
        '3. Inspect device management agent (Jamf / Intune) compliance status in Company Portal.',
        '4. Escalate to the assigned support tier if issue persists past initial triage.'
      ],
      quickCommands: ['uptime', 'uname -a'],
      estimatedSelfResolutionMinutes: 10
    });
  }

  // 5. Generate Agent Troubleshooting Checklist & Draft Reply
  const draftReply = `Hello, thank you for reaching out to IT Support. 

I have reviewed your ticket regarding "${title}". Based on our initial telemetry diagnosis, this appears to be related to ${topSubcategory}.

Please try the following quick resolution steps:
${matchedSolutions[0].steps.slice(0, 3).join('\n')}

I will keep this ticket assigned to our team and monitor for your update. Please let us know if these steps resolve the issue!`;

  return {
    category: topCategory,
    subcategory: topSubcategory,
    suggestedPriority: priority,
    confidence: Number(confidence.toFixed(2)),
    matchedSolutions,
    recommendedTeam: getRecommendedTeam(topCategory),
    agentPlaybook: {
      draftReply,
      diagnosticSteps: matchedSolutions[0].steps,
      quickCommands: matchedSolutions[0].quickCommands || []
    }
  };
}

/**
 * Map category to appropriate IT team
 */
export function getRecommendedTeam(category) {
  switch (category) {
    case 'hardware':
      return { id: 2, name: 'Tier 2 - Hardware & Peripherals' };
    case 'network':
      return { id: 3, name: 'Tier 3 - Network & Cloud Infrastructure' };
    case 'access':
    case 'security':
      return { id: 4, name: 'Tier 3 - Identity, Access & Security (IAM)' };
    case 'software':
    default:
      return { id: 1, name: 'Tier 1 - Global Service Desk' };
  }
}

export default {
  categorizeTicket,
  getRecommendedTeam
};
