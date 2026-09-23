/**
 * SUBBAYYA GARI HOTEL — BRANCH NORMALIZATION & ROUTING HELPER
 * Ensures orders placed by customers are accurately routed to the selected branch
 * (e.g. KPHP -> KPHB branch, Vasanthapuram -> Vanasthalipuram branch, Kukatpally -> Kukatpally branch)
 */

function normalizeBranchName(rawBranch) {
  if (!rawBranch || typeof rawBranch !== 'string') return 'KPHB Colony, Hyderabad';
  const trimmed = rawBranch.trim();
  if (!trimmed) return 'KPHB Colony, Hyderabad';

  // KPHP / KPHB Colony
  if (/kph[pb]/i.test(trimmed)) {
    return 'KPHB Colony, Hyderabad';
  }
  // Vasanthapuram / Vanasthalipuram
  if (/vasanth|vanasthal/i.test(trimmed)) {
    return 'Vanasthalipuram, Hyderabad';
  }
  // Kukatpally
  if (/kukat/i.test(trimmed)) {
    return 'Kukatpally, Hyderabad';
  }
  // Ameerpet
  if (/ameerp/i.test(trimmed)) {
    return 'Ameerpet, Hyderabad';
  }
  // Madhapur
  if (/madhapur/i.test(trimmed)) {
    return 'Madhapur, Hyderabad';
  }
  // Kondapur
  if (/konda/i.test(trimmed)) {
    return 'Kondapur, Hyderabad';
  }
  // Gachibowli
  if (/gachi/i.test(trimmed)) {
    return 'Gachibowli, Hyderabad';
  }
  // Dilsukhnagar
  if (/dilsukh|dilshuk/i.test(trimmed)) {
    return 'Dilsukhnagar, Hyderabad';
  }
  // Secunderabad
  if (/secunder/i.test(trimmed)) {
    return 'Secunderabad, Hyderabad';
  }
  // Attapur
  if (/attapur/i.test(trimmed)) {
    return 'Attapur, Hyderabad';
  }
  // Chanda Nagar
  if (/chanda/i.test(trimmed)) {
    return 'Chanda Nagar, Hyderabad';
  }
  // AS Rao Nagar
  if (/as\s*rao/i.test(trimmed)) {
    return 'AS Rao Nagar, Hyderabad';
  }
  // Warangal
  if (/warangal/i.test(trimmed)) {
    return 'Warangal';
  }
  // Kakinada
  if (/kakinada/i.test(trimmed)) {
    return 'Kakinada (Main)';
  }
  // Rajahmundry
  if (/rajah/i.test(trimmed)) {
    return 'Rajahmundry';
  }
  // Vijayawada
  if (/vijayaw/i.test(trimmed)) {
    return 'Vijayawada';
  }
  // Vizag / Visakhapatnam
  if (/visakha|vizag/i.test(trimmed)) {
    return 'Visakhapatnam (Vizag)';
  }
  // Guntur
  if (/guntur/i.test(trimmed)) {
    return 'Guntur';
  }
  // Tirupati
  if (/tirupati/i.test(trimmed)) {
    return 'Tirupati';
  }
  // Nellore
  if (/nellore/i.test(trimmed)) {
    return 'Nellore';
  }
  // Eluru
  if (/eluru/i.test(trimmed)) {
    return 'Eluru';
  }
  // Bengaluru
  if (/bengal|bangal/i.test(trimmed)) {
    return 'Bengaluru';
  }

  return trimmed;
}

function getBranchRegex(branchName) {
  if (!branchName || typeof branchName !== 'string') return null;
  const b = branchName.trim();
  if (!b || b.toLowerCase() === 'all' || b.toLowerCase() === 'all branches') return null;

  if (/kph[pb]/i.test(b)) {
    return /kph[pb]/i;
  }
  if (/vasanth|vanasthal/i.test(b)) {
    return /(vanasthal|vasanth|vasant)/i;
  }
  if (/kukat/i.test(b)) {
    return /kukat/i;
  }
  if (/visakha|vizag/i.test(b)) {
    return /(visakha|vizag)/i;
  }
  if (/bengal|bangal/i.test(b)) {
    return /(bengal|bangal)/i;
  }

  const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(',')[0].trim();
  return new RegExp(escaped, 'i');
}

function getBranchRoomKey(branchName) {
  if (!branchName || typeof branchName !== 'string') return null;
  const b = branchName.trim().toLowerCase();
  if (!b || b === 'all' || b === 'all branches') return null;

  if (/kph[pb]/i.test(b)) return 'kphb';
  if (/vasanth|vanasthal/i.test(b)) return 'vanasthalipuram';
  if (/kukat/i.test(b)) return 'kukatpally';
  if (/ameerp/i.test(b)) return 'ameerpet';
  if (/madhapur/i.test(b)) return 'madhapur';
  if (/konda/i.test(b)) return 'kondapur';
  if (/gachi/i.test(b)) return 'gachibowli';
  if (/dilsukh|dilshuk/i.test(b)) return 'dilsukhnagar';
  if (/secunder/i.test(b)) return 'secunderabad';
  if (/attapur/i.test(b)) return 'attapur';
  if (/chanda/i.test(b)) return 'chandanagar';
  if (/as\s*rao/i.test(b)) return 'asraonagar';
  if (/warangal/i.test(b)) return 'warangal';
  if (/kakinada/i.test(b)) return 'kakinada';
  if (/rajah/i.test(b)) return 'rajahmundry';
  if (/vijayaw/i.test(b)) return 'vijayawada';
  if (/visakha|vizag/i.test(b)) return 'vizag';
  if (/guntur/i.test(b)) return 'guntur';
  if (/tirupati/i.test(b)) return 'tirupati';
  if (/nellore/i.test(b)) return 'nellore';
  if (/eluru/i.test(b)) return 'eluru';
  if (/bengal|bangal/i.test(b)) return 'bengaluru';

  return b.replace(/[^a-z0-9]/g, '');
}

function isMatchingBranch(branchA, branchB) {
  if (!branchA || !branchB) return false;
  const a = branchA.toLowerCase().trim();
  const b = branchB.toLowerCase().trim();
  if (a === 'all' || a === 'all branches' || b === 'all' || b === 'all branches') return true;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  if (/kph[pb]/i.test(a) && /kph[pb]/i.test(b)) return true;
  if (/vasanth|vanasthal/i.test(a) && /vasanth|vanasthal/i.test(b)) return true;
  if (/kukat/i.test(a) && /kukat/i.test(b)) return true;
  if (/visakha|vizag/i.test(a) && /visakha|vizag/i.test(b)) return true;
  if (/bengal|bangal/i.test(a) && /bengal|bangal/i.test(b)) return true;

  return false;
}

module.exports = {
  normalizeBranchName,
  getBranchRegex,
  getBranchRoomKey,
  isMatchingBranch,
};
