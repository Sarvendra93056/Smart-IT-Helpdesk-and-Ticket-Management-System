// Client-side AI Categorization & Resolution Engine

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
    keywords: ['laptop', 'macbook', 'dell', 'thinkpad', 'screen', 'keyboard', 'battery', 'monitor', 'hardware', 'usb', 'dock', 'charger', 'mouse', 'webcam']
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
      '1. Open Terminal and verify network reachability: `ping 8.8.8.8`',
      '2. Clear cached credentials: In AnyConnect gear preferences -> Clear Credentials.',
      '3. Restart the VPN daemon service: Run `sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd` (macOS).',
      '4. If using IPv6 home router, temporarily set DNS to 1.1.1.1 and reconnect to `vpn.corporate.internal`.'
    ],
    quickCommands: ['sudo launchctl kickstart -k system/com.cisco.anyconnect.vpnagentd', 'scutil --dns'],
    estimatedSelfResolutionMinutes: 5
  },
  wifi: {
    title: 'Corporate 802.1X Wi-Fi Profile & Certificate Refresh',
    confidence: 0.91,
    steps: [
      '1. Forget the network: Wi-Fi Settings -> Corp-Secure -> Forget Network.',
      '2. Check Keychain Access: Ensure Corp-WiFi Certificate is not expired.',
      '3. Reconnect using corporate email and SSO password.',
      '4. Flush DNS resolver cache: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`.'
    ],
    quickCommands: ['sudo dscacheutil -flushcache', 'sudo killall -HUP mDNSResponder'],
    estimatedSelfResolutionMinutes: 3
  },
  battery: {
    title: 'MacBook Power Management & SMC Controller Reset',
    confidence: 0.93,
    steps: [
      '1. Check battery health: System Settings -> Battery -> Battery Health.',
      '2. Test with official Apple 96W power adapter directly plugged into left port.',
      '3. Perform an SMC controller reset.',
      '4. IMPORTANT: If physical swelling or chassis gap is observed, stop charging immediately.'
    ],
    quickCommands: ['system_profiler SPPowerDataType'],
    estimatedSelfResolutionMinutes: 8
  },
  docker: {
    title: 'Docker Desktop Engine Reset & Resource Allocation',
    confidence: 0.92,
    steps: [
      '1. Check running socket: `docker info` in Terminal.',
      '2. Clean stale builder cache and hanging containers: `docker system prune -f --volumes`',
      '3. In Docker Settings -> Resources, allocate at least 8GB RAM.',
      '4. Verify enterprise corporate SSO sign-in.'
    ],
    quickCommands: ['docker system prune -f --volumes'],
    estimatedSelfResolutionMinutes: 5
  },
  sso: {
    title: 'Okta SSO Session Loop & MFA Device Reset Runbook',
    confidence: 0.95,
    steps: [
      '1. Open an Incognito window to rule out stale browser cookies.',
      '2. Clear site data for `*.okta.com` and corporate identity provider.',
      '3. If Duo push fails, verify phone time is set to "Automatic Network Time".',
      '4. If locked out, use self-service unlock portal at `identity.corporate.internal/unlock`.'
    ],
    quickCommands: ['chrome://settings/clearBrowserData'],
    estimatedSelfResolutionMinutes: 4
  }
};

export function categorizeTicketLocal(title = '', description = '') {
  const combinedText = `${title} ${description}`.toLowerCase();

  const scores = {};
  for (const [catKey, cfg] of Object.entries(CATEGORY_RULES)) {
    let score = 0;
    for (const kw of cfg.keywords) {
      if (combinedText.includes(kw)) score += kw.length > 5 ? 2.5 : 1.5;
    }
    scores[catKey] = score;
  }

  let topCategory = 'software';
  let highestScore = 0;
  for (const [cat, s] of Object.entries(scores)) {
    if (s > highestScore) {
      highestScore = s;
      topCategory = cat;
    }
  }

  const catCfg = CATEGORY_RULES[topCategory] || CATEGORY_RULES.software;
  let topSubcategory = catCfg.defaultSubcategory;
  let subScoreMax = 0;

  for (const sub of catCfg.subcategories) {
    let subScore = 0;
    for (const kw of sub.keywords) {
      if (combinedText.includes(kw)) subScore += 2;
    }
    if (subScore > subScoreMax) {
      subScoreMax = subScore;
      topSubcategory = sub.name;
    }
  }

  const criticalSignals = ['entire team', 'outage', 'production down', 'cannot work', 'urgent', 'blocked entirely'];
  const highSignals = ['blocking', 'battery swelling', 'cannot login', 'deadline today', 'high priority'];

  let priority = 'P3 - Medium';
  let confidence = Math.min(0.98, Math.max(0.72, 0.70 + (highestScore * 0.04)));

  if (criticalSignals.some(s => combinedText.includes(s))) {
    priority = 'P1 - Critical';
    confidence = Math.max(confidence, 0.95);
  } else if (highSignals.some(s => combinedText.includes(s))) {
    priority = 'P2 - High';
    confidence = Math.max(confidence, 0.88);
  }

  let matchedSolutions = [];
  if (combinedText.includes('vpn') || combinedText.includes('anyconnect')) matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.vpn);
  if (combinedText.includes('wifi') || combinedText.includes('wi-fi') || combinedText.includes('network')) matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.wifi);
  if (combinedText.includes('battery') || combinedText.includes('charge')) matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.battery);
  if (combinedText.includes('docker')) matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.docker);
  if (combinedText.includes('sso') || combinedText.includes('okta') || combinedText.includes('mfa')) matchedSolutions.push(KNOWLEDGE_BASE_SOLUTIONS.sso);

  if (matchedSolutions.length === 0) {
    matchedSolutions.push({
      title: `General Diagnostic for ${topCategory.toUpperCase()} - ${topSubcategory}`,
      confidence: 0.82,
      steps: [
        '1. Gather system telemetry: Note operating system version and error dialog timestamps.',
        '2. Perform soft system restart to release stale file locks and daemons.',
        '3. Inspect device management agent (Jamf / Intune) compliance status in Company Portal.'
      ],
      quickCommands: ['uptime', 'uname -a'],
      estimatedSelfResolutionMinutes: 10
    });
  }

  let recommendedTeam = { id: 1, name: 'Tier 1 - Global Service Desk' };
  if (topCategory === 'hardware') recommendedTeam = { id: 2, name: 'Tier 2 - Hardware & Peripherals' };
  else if (topCategory === 'network') recommendedTeam = { id: 3, name: 'Tier 3 - Network & Cloud Infrastructure' };
  else if (topCategory === 'access' || topCategory === 'security') recommendedTeam = { id: 4, name: 'Tier 3 - Identity, Access & Security (IAM)' };

  return {
    category: topCategory,
    subcategory: topSubcategory,
    suggestedPriority: priority,
    confidence: Number(confidence.toFixed(2)),
    matchedSolutions,
    recommendedTeam
  };
}
