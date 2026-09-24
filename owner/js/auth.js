/**
 * SUBBAYYA GARI HOTEL — OWNER AUTH & SHARED CLIENT LOGIC
 */

// Dynamic Backend Base URL
const BACKEND_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  // If served directly from the backend server port (e.g. 5000) or relative
  if (window.location.port === '5000') {
    return window.location.origin;
  }
  // If hosted on a cloud platform (Render, etc.) without port or on standard port
  if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'file:') {
    return window.location.origin;
  }
  // Local development servers (Live Server 5500, Vite 5173, Next 3000, file://, etc.)
  const host = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'localhost' : (window.location.hostname || 'localhost');
  return `http://${host}:5000`;
})();

const API_BASE = `${BACKEND_BASE}/api`;

// Branch Management Helpers
// Comprehensive List of All Hotel Branches
const ALL_HOTEL_BRANCHES = [
  {
    category: 'Global View',
    branches: [
      { name: 'All Branches', label: '🌐 All Branches (Master View)' }
    ]
  },
  {
    category: 'Customer Site Active Branches',
    branches: [
      { name: 'KPHB Colony', label: '📍 KPHB Colony Branch' },
      { name: 'Kukatpally', label: '📍 Kukatpally Branch' },
      { name: 'Vanasthalipuram', label: '📍 Vanasthalipuram Branch' }
    ]
  }
];

function isSameBranch(branchA, branchB) {
  if (!branchA || !branchB) return false;
  const a = branchA.toLowerCase().trim();
  const b = branchB.toLowerCase().trim();
  if (a === 'all' || a === 'all branches' || b === 'all' || b === 'all branches') return true;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  // KPHP / KPHB alias matching
  if (/kph[pb]/i.test(a) && /kph[pb]/i.test(b)) return true;

  // Vanasthalipuram / Vasanthapuram alias matching
  if ((a.includes('vasanth') || a.includes('vanasthal')) && 
      (b.includes('vasanth') || b.includes('vanasthal'))) return true;

  // Visakhapatnam / Vizag alias matching
  if ((a.includes('vizag') || a.includes('visakha')) && 
      (b.includes('vizag') || b.includes('visakha'))) return true;

  // Kukatpally alias matching
  if (a.includes('kukat') && b.includes('kukat')) return true;

  return false;
}

function getActiveBranch() {
  let branch = sessionStorage.getItem('sgh_owner_branch');
  if (branch) {
    return branch;
  }
  try {
    const userStr = sessionStorage.getItem('sgh_owner_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.branch) {
        sessionStorage.setItem('sgh_owner_branch', user.branch);
        return user.branch;
      }
    }
  } catch (e) {}
  return 'KPHB Colony';
}

function setActiveBranch(branch) {
  if (!branch) return;
  sessionStorage.setItem('sgh_owner_branch', branch);
  try {
    const userStr = sessionStorage.getItem('sgh_owner_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.branch = branch;
      sessionStorage.setItem('sgh_owner_user', JSON.stringify(user));
    }
  } catch (e) {}
  renderActiveBranchBadge();
}

function renderActiveBranchBadge() {
  const activeBranch = getActiveBranch();
  const headerRight = document.querySelector('.admin-header .header-right');
  if (!headerRight) return;

  let badge = document.getElementById('header-branch-pill');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'header-branch-pill';
    badge.className = 'header-branch-pill';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '6px';
    badge.style.background = 'rgba(245, 158, 11, 0.15)';
    badge.style.border = '1px solid rgba(245, 158, 11, 0.4)';
    badge.style.padding = '6px 14px';
    badge.style.borderRadius = '20px';
    badge.style.fontSize = '0.82rem';
    badge.style.color = '#F59E0B';
    badge.style.fontWeight = '700';
    badge.style.cursor = 'pointer';
    badge.title = 'Click to switch active hotel branch';
    badge.onclick = promptSwitchBranch;

    headerRight.insertBefore(badge, headerRight.firstChild);
  }

  const isAll = (activeBranch || '').toLowerCase().includes('all');
  const label = isAll ? '🌐 All Branches' : `📍 ${activeBranch} Branch`;
  badge.innerHTML = `<span>${label}</span> <span style="font-size:0.68rem; opacity:0.8; text-decoration:underline; margin-left:4px;">(Switch)</span>`;
}

function filterBranchModalList(query) {
  const q = (query || '').toLowerCase().trim();
  const buttons = document.querySelectorAll('.branch-modal-option');
  const categoryHeaders = document.querySelectorAll('.branch-modal-category');

  buttons.forEach(btn => {
    const name = btn.getAttribute('data-branch-name') || '';
    if (!q || name.toLowerCase().includes(q)) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });

  categoryHeaders.forEach(header => {
    const cat = header.getAttribute('data-category');
    const visibleInCat = document.querySelectorAll(`.branch-modal-option[data-category="${cat}"]:not([style*="display: none"])`);
    if (visibleInCat.length === 0) {
      header.style.display = 'none';
    } else {
      header.style.display = 'block';
    }
  });
}

function promptSwitchBranch() {
  const current = getActiveBranch();

  let modal = document.getElementById('branch-switch-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'branch-switch-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(15, 23, 42, 0.45)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    document.body.appendChild(modal);
  }

  let listHtml = '';
  ALL_HOTEL_BRANCHES.forEach(group => {
    listHtml += `
      <div class="branch-modal-category" data-category="${group.category}" style="font-size: 0.72rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.08em; margin: 14px 0 6px 4px;">
        ${group.category}
      </div>
    `;

    group.branches.forEach(b => {
      const isSelected = b.name.toLowerCase() === (current || '').toLowerCase() || 
        ((b.name === 'All Branches' || b.name === 'all') && (current || '').toLowerCase().includes('all'));
      listHtml += `
        <button class="branch-modal-option" data-category="${group.category}" data-branch-name="${b.name}" onclick="selectAndApplyBranch('${b.name}')" style="width: 100%; text-align: left; padding: 12px 16px; margin-bottom: 8px; border-radius: 8px; border: 1px solid ${isSelected ? 'var(--color-gold)' : '#E2E8F0'}; background: ${isSelected ? '#FFF7ED' : '#FFFFFF'}; color: ${isSelected ? 'var(--color-primary)' : '#0F172A'}; font-weight: ${isSelected ? '800' : '600'}; font-size: 0.92rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;">
          <span>${b.label}</span>
          ${isSelected ? '<span style="color:#059669; font-size:0.85rem; font-weight:700;">✓ Active</span>' : ''}
        </button>
      `;
    });
  });

  modal.innerHTML = `
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; padding: 24px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="color: #0F172A; font-size: 1.15rem; font-family: var(--font-heading); margin: 0; display: flex; align-items: center; gap: 8px;">
          <span>🏢</span> Switch Branch
        </h3>
        <button onclick="closeSwitchBranchModal()" style="background: #F1F5F9; border: none; border-radius: 50%; width: 28px; height: 28px; color: #64748B; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>
      <p style="color: #64748B; font-size: 0.82rem; margin-bottom: 12px;">Select which branch orders and kitchen pipeline to manage:</p>
      
      <div style="margin-bottom: 12px;">
        <input 
          id="branch-modal-search" 
          type="text" 
          placeholder="🔍 Search branches (e.g. Kukatpally, Vizag)..." 
          oninput="filterBranchModalList(this.value)"
          style="width: 100%; padding: 10px 14px; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; color: #0F172A; font-size: 0.88rem; outline: none;" 
        />
      </div>

      <div id="branch-modal-list-container" style="overflow-y: auto; max-height: 50vh; padding-right: 6px;">
        ${listHtml}
      </div>

      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #E2E8F0; display: flex; gap: 10px;">
        <button onclick="closeSwitchBranchModal()" class="btn btn-secondary btn-sm" style="flex: 1;">Cancel</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  setTimeout(() => {
    const input = document.getElementById('branch-modal-search');
    if (input) input.focus();
  }, 50);
}

function closeSwitchBranchModal() {
  const modal = document.getElementById('branch-switch-modal');
  if (modal) modal.style.display = 'none';
}

function selectAndApplyBranch(branch) {
  setActiveBranch(branch);
  closeSwitchBranchModal();
  if (typeof updateProfileUI === 'function') {
    const userStr = sessionStorage.getItem('sgh_owner_user');
    if (userStr) {
      try { updateProfileUI(JSON.parse(userStr)); } catch (e) {}
    }
  }
  if (typeof loadOrders === 'function') loadOrders();
  if (typeof loadDashboardData === 'function') loadDashboardData();
  if (typeof loadOrderDetails === 'function') loadOrderDetails();
  if (socket && socket.connected) {
    socket.emit('join_owner', { branch });
  }
}

// Check Authentication on Owner Pages
function checkAuth() {
  // Clear any legacy persistent storage so closing the app always requires login
  localStorage.removeItem('sgh_owner_token');
  localStorage.removeItem('sgh_owner_user');
  localStorage.removeItem('sgh_owner_branch');

  const token = sessionStorage.getItem('sgh_owner_token');
  const userStr = sessionStorage.getItem('sgh_owner_user');

  // If on login page and already logged in, redirect to dashboard
  if (window.location.pathname.includes('login.html')) {
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'owner') {
          window.location.href = 'dashboard.html';
          return;
        }
      } catch (e) {}
    }
    return;
  }

  // On protected owner pages
  if (!token || !userStr) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'owner') {
      logoutOwner();
      return;
    }
    updateProfileUI(user);
  } catch (e) {
    logoutOwner();
  }
}

// Update Owner Profile in Sidebar
function updateProfileUI(user) {
  const nameEl = document.getElementById('owner-user-name');
  const avatarEl = document.getElementById('owner-avatar-letter');
  const roleEl = document.querySelector('.owner-role');
  const activeBranch = getActiveBranch();

  if (nameEl) nameEl.textContent = user.name || 'Owner';
  if (avatarEl) avatarEl.textContent = (user.name || 'O').charAt(0).toUpperCase();
  if (roleEl) {
    roleEl.innerHTML = activeBranch
      ? `📍 <strong style="color:var(--color-gold);">${activeBranch}</strong>`
      : 'Hotel Administrator';
  }

  bindOwnerProfileClick();
  renderActiveBranchBadge();
}

function bindOwnerProfileClick() {
  const profileContainer = document.querySelector('.owner-profile');
  if (profileContainer) {
    profileContainer.style.cursor = 'pointer';
    profileContainer.setAttribute('title', 'Click to view Owner Profile Details');
    profileContainer.onclick = (e) => {
      e.preventDefault();
      openOwnerProfileModal();
    };
  }
}

// Ensure binding also on initial load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindOwnerProfileClick);
  } else {
    bindOwnerProfileClick();
  }
}

// Open Owner Profile Details Modal
function openOwnerProfileModal() {
  let modal = document.getElementById('owner-profile-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'owner-profile-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  let user = null;
  try {
    const raw = sessionStorage.getItem('sgh_owner_user') || localStorage.getItem('sgh_owner_user');
    if (raw) user = JSON.parse(raw);
  } catch (e) {}

  const activeBranch = getActiveBranch() || (user && user.branch) || 'KPHB Colony';
  const ownerName = (user && user.name) || 'G. Subbayya';
  const ownerEmail = (user && user.email) || 'myakalanagarjun09@gmail.com';
  const ownerPhone = (user && user.phone) || '+91 9121792433';
  const avatarLetter = (ownerName || 'G').charAt(0).toUpperCase();
  const ownerRole = (user && user.role === 'owner') ? 'Founder & Hotel Owner' : 'Hotel Administrator';
  const tier = (user && user.tier) || 'Heritage Gold Owner';

  modal.innerHTML = `
    <div class="modal-card profile-modal-card" style="position: relative;" onclick="event.stopPropagation()">
      <!-- TOP BANNER -->
      <div class="profile-modal-banner">
        <div class="profile-modal-avatar">${avatarLetter}</div>
        <div class="profile-modal-header-info">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <h2 class="profile-modal-name">${ownerName}</h2>
            <span class="profile-badge-gold">👑 ${tier}</span>
          </div>
          <div class="profile-modal-tagline">${ownerRole}</div>
          <div style="font-size: 0.74rem; color: #64748B; margin-top: 3px;">
            Subbayya Gari Hotel • Estd. 1950, Kakinada
          </div>
        </div>
        <button onclick="closeOwnerProfileModal()" class="modal-close-btn" style="position: absolute; top: 12px; right: 14px;" title="Close">✕</button>
      </div>

      <!-- BODY DETAILS -->
      <div class="profile-modal-body">
        <div style="margin-bottom: 14px; font-size: 0.76rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
          Owner & Account Credentials
        </div>

        <div class="profile-details-grid">
          <div class="profile-detail-item">
            <div class="profile-detail-label">
              <span>📧</span>
              <span>Official Email</span>
            </div>
            <div class="profile-detail-value" style="font-size: 0.8rem; word-break: break-all;">${ownerEmail}</div>
          </div>

          <div class="profile-detail-item">
            <div class="profile-detail-label">
              <span>📞</span>
              <span>Direct Phone</span>
            </div>
            <div class="profile-detail-value">${ownerPhone}</div>
          </div>

          <div class="profile-detail-item">
            <div class="profile-detail-label">
              <span>📍</span>
              <span>Operating Branch</span>
            </div>
            <div class="profile-detail-value" style="color: var(--color-primary);">${activeBranch}</div>
          </div>

          <div class="profile-detail-item">
            <div class="profile-detail-label">
              <span>🛡️</span>
              <span>Privilege Level</span>
            </div>
            <div class="profile-detail-value" style="color: #059669;">Super Admin / Full Access</div>
          </div>

          <div class="profile-detail-item">
            <div class="profile-detail-label">
              <span>🏢</span>
              <span>Hospitality Network</span>
            </div>
            <div class="profile-detail-value">23 Outlets & Cloud Kitchens</div>
          </div>

          <div class="profile-detail-item">
            <div class="profile-detail-label">
              <span>⚡</span>
              <span>Portal Status</span>
            </div>
            <div class="profile-detail-value" style="color: #059669; display: flex; align-items: center; gap: 6px;">
              <span class="pulse-dot" style="display: inline-block;"></span>
              <span>Active & Synchronized</span>
            </div>
          </div>
        </div>

        <!-- QUICK BRANCH SWITCH CALLOUT -->
        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div>
            <div style="font-size: 0.82rem; font-weight: 800; color: var(--color-primary);">Currently managing: ${activeBranch}</div>
            <div style="font-size: 0.72rem; color: #78350F; margin-top: 2px;">Switch orders, kitchen routing, and reports to any branch</div>
          </div>
          <button onclick="closeOwnerProfileModal(); openSwitchBranchModal();" class="btn btn-primary btn-sm" style="white-space: nowrap;">
            🏢 Change Branch
          </button>
        </div>

        <!-- MODAL FOOTER ACTIONS -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <a href="settings.html" class="btn btn-secondary btn-sm" style="text-decoration: none;">
            ⚙️ Hotel Settings
          </a>
          <div style="display: flex; gap: 8px;">
            <button onclick="closeOwnerProfileModal()" class="btn btn-secondary btn-sm">
              Close
            </button>
            <button onclick="logoutOwner()" class="btn btn-danger btn-sm" title="Sign out of Owner Portal">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');

  modal.onclick = (e) => {
    if (e.target === modal) closeOwnerProfileModal();
  };

  document.removeEventListener('keydown', handleProfileModalEscape);
  document.addEventListener('keydown', handleProfileModalEscape);
}

function closeOwnerProfileModal() {
  const modal = document.getElementById('owner-profile-modal');
  if (modal) modal.classList.remove('active');
  document.removeEventListener('keydown', handleProfileModalEscape);
}

function handleProfileModalEscape(e) {
  if (e.key === 'Escape') closeOwnerProfileModal();
}

window.openOwnerProfileModal = openOwnerProfileModal;
window.closeOwnerProfileModal = closeOwnerProfileModal;

// Owner Logout
function logoutOwner() {
  sessionStorage.removeItem('sgh_owner_token');
  sessionStorage.removeItem('sgh_owner_user');
  sessionStorage.removeItem('sgh_owner_branch');
  localStorage.removeItem('sgh_owner_token');
  localStorage.removeItem('sgh_owner_user');
  localStorage.removeItem('sgh_owner_branch');
  window.location.href = 'login.html';
}

// Authenticated Fetch Helper with Automatic Branch Context
async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem('sgh_owner_token');
  const activeBranch = getActiveBranch();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeBranch && activeBranch !== 'all' ? { 'X-Owner-Branch': activeBranch } : {}),
    ...(options.headers || {}),
  };

  let targetUrl = url.startsWith('http')
    ? url
    : (url.startsWith('/api') ? `${BACKEND_BASE}${url}` : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`);

  // Automatically append branch to GET query parameters if not present
  if ((!options.method || options.method.toUpperCase() === 'GET') && activeBranch && activeBranch.toLowerCase() !== 'all' && activeBranch.toLowerCase() !== 'all branches') {
    if (!targetUrl.includes('branch=')) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${sep}branch=${encodeURIComponent(activeBranch)}`;
    }
  }

  const response = await fetch(targetUrl, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || (data.message && data.message.includes('Owner privileges'))) {
      alert('Session expired or unauthorized. Please login again.');
      logoutOwner();
      return null;
    }
  }

  return response;
}

// Format Currency
function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

// Format Date Time
function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ==========================================================================
// LOUD CONTINUOUS ORDER ALARM & SOUND MANAGEMENT
// ==========================================================================
let soundEnabled = localStorage.getItem('sgh_sound_enabled') !== 'false';
let orderAlertInterval = null;
let activePendingOrderNumber = null;
let sharedAudioCtx = null;
let titleBlinkInterval = null;
const originalDocTitle = typeof document !== 'undefined' ? document.title : 'Subbayya Gari Hotel - Owner Panel';

function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Unlock audio context on any user interaction to comply with browser autoplay policy
['click', 'touchstart', 'keydown', 'mousedown'].forEach((evt) => {
  document.addEventListener(evt, () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }, { passive: true });
});

function toggleAudioNotification() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('sgh_sound_enabled', soundEnabled);
  const btn = document.getElementById('audio-toggle-btn');
  if (btn) {
    btn.innerHTML = soundEnabled ? '🔔 Sound ON' : '🔕 Sound OFF';
  }
  if (!soundEnabled) {
    stopOrderAlarm();
  }
}

// Play loud, sharp, energetic 4-tone restaurant kitchen order chime & buzzer
function playSingleLoudBeep() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 1. Dual Oscillators for rich, piercing restaurant kitchen chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'square'; // Adds high harmonic cut-through for kitchen noise

    // 4-stage ascending energetic chime: A5 (880Hz) -> D6 (1174Hz) -> G6 (1568Hz) -> C7 (2093Hz)
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1174.66, now + 0.12);
    osc1.frequency.setValueAtTime(1567.98, now + 0.24);
    osc1.frequency.setValueAtTime(2093.00, now + 0.36);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(587.33, now + 0.12);
    osc2.frequency.setValueAtTime(783.99, now + 0.24);
    osc2.frequency.setValueAtTime(1046.50, now + 0.36);

    // High energetic volume gain curve
    gainNode.gain.setValueAtTime(1.0, now);
    gainNode.gain.setValueAtTime(0.85, now + 0.36);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.85);
    osc2.stop(now + 0.85);
  } catch (e) {
    console.log('Audio alert error:', e);
  }
}

// Start continuous loud order alarm until accepted
function startLoudOrderAlarm(order, pendingCount = 1) {
  if (!order || !order.orderNumber) return;
  activePendingOrderNumber = order.orderNumber;

  // Stop any previous ringing interval
  if (orderAlertInterval) {
    clearInterval(orderAlertInterval);
    orderAlertInterval = null;
  }

  // Play immediately and repeat continuously every 1.3s until accepted
  playSingleLoudBeep();
  if (soundEnabled) {
    orderAlertInterval = setInterval(() => {
      playSingleLoudBeep();
    }, 1300);
  }

  // Blinking browser tab title
  if (titleBlinkInterval) clearInterval(titleBlinkInterval);
  let blinkFlag = false;
  titleBlinkInterval = setInterval(() => {
    blinkFlag = !blinkFlag;
    document.title = blinkFlag
      ? `🚨 NEW ORDER #${order.orderNumber} - ACCEPT NOW!`
      : `🔔 (${pendingCount} PENDING) Subbayya Gari Hotel`;
  }, 900);

  showOrderAlertBanner(order, pendingCount);
}

// Stop loud order alarm
function stopOrderAlarm() {
  if (orderAlertInterval) {
    clearInterval(orderAlertInterval);
    orderAlertInterval = null;
  }
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
    document.title = originalDocTitle;
  }
  activePendingOrderNumber = null;

  const banner = document.getElementById('order-alert-banner');
  if (banner) {
    banner.classList.remove('show');
  }
}

// Synchronize pending orders with the loud alarm
function syncPendingOrdersAlarm(ordersList) {
  if (!Array.isArray(ordersList)) return;
  const pending = ordersList.filter(
    (o) => o && (o.orderStatus === 'Pending' || o.status === 'Pending' || o.status === 'Received')
  );

  if (pending.length > 0) {
    // If not currently alarming or alarmed order was accepted, alarm on the latest pending order
    if (!orderAlertInterval || !activePendingOrderNumber || !pending.some(p => p.orderNumber === activePendingOrderNumber)) {
      startLoudOrderAlarm(pending[0], pending.length);
    } else {
      // Update banner with current count
      showOrderAlertBanner(pending[0], pending.length);
    }
  } else {
    // All orders accepted or completed
    if (orderAlertInterval) {
      stopOrderAlarm();
    }
  }
}

// Accept order directly from the alert banner & stop sound
async function acceptOrderFromAlert(orderNumber) {
  try {
    const res = await authFetch(`/api/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: 'Accepted', note: 'Accepted by owner via quick alert' }),
    });

    if (res && res.ok) {
      // Refresh active page data
      if (typeof loadOrders === 'function') loadOrders();
      if (typeof loadDashboardData === 'function') loadDashboardData();
      if (typeof loadOrderDetails === 'function') loadOrderDetails();

      // Check if there are remaining pending orders
      const checkRes = await authFetch('/api/orders?status=Pending');
      if (checkRes && checkRes.ok) {
        const { data } = await checkRes.json();
        syncPendingOrdersAlarm(data || []);
      } else {
        stopOrderAlarm();
      }
    }
  } catch (e) {
    console.error('Error accepting order from alert:', e);
    stopOrderAlarm();
  }
}

// Show Floating Notification Banner with Accept button
function showOrderAlertBanner(order, pendingCount = 1) {
  let banner = document.getElementById('order-alert-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'order-alert-banner';
    banner.className = 'order-alert-banner';
    document.body.appendChild(banner);
  }

  const typeLabel =
    order.orderType === 'dine-in' || order.orderType === 'table-booking'
      ? `🍽️ Table Booking (${order.guestsCount || 1} Guests)`
      : order.orderType === 'delivery'
      ? '🛵 Home Delivery'
      : '🥡 Takeaway';

  const countBadge = pendingCount > 1 ? `<span style="background:#EF4444; color:#fff; font-size:0.75rem; padding:2px 8px; border-radius:12px; margin-left:6px;">${pendingCount} Pending</span>` : '';

  banner.innerHTML = `
    <div class="alert-icon-ring">🔔</div>
    <div class="alert-info">
      <div class="alert-title">🔔 NEW INCOMING ORDER #${order.orderNumber} ${countBadge}</div>
      <div class="alert-text"><strong>${order.customerName}</strong> • ${formatCurrency(order.totalAmount)}</div>
      <div style="font-size: 0.75rem; color: var(--color-gold); margin-top: 2px;">${typeLabel}</div>
    </div>
    <div class="alert-actions">
      <button class="btn-alert-accept" onclick="acceptOrderFromAlert('${order.orderNumber}')" style="background:#10B981; color:#fff; font-weight:800; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-size:0.9rem; box-shadow:0 0 15px rgba(16,185,129,0.5); display:flex; align-items:center; gap:6px; width:100%; justify-content:center;">
        ✅ Accept Order & Stop Sound
      </button>
      <div style="display: flex; gap: 6px; margin-top: 6px;">
        <a href="order-details.html?id=${order.orderNumber}" class="btn-alert-view" style="flex: 1; text-align:center; padding:6px; background:rgba(255,255,255,0.1); color:#fff; border-radius:6px; text-decoration:none; font-size:0.78rem;">View Details</a>
        <button class="btn-alert-view" onclick="stopOrderAlarm()" style="cursor: pointer; padding:6px 12px; background:rgba(239,68,68,0.2); color:#FCA5A5; border:1px solid rgba(239,68,68,0.4); border-radius:6px; font-size:0.78rem;" title="Mute alarm without accepting">🔕 Mute</button>
      </div>
    </div>
  `;

  banner.classList.add('show');
}

// Socket.IO Client for Real-Time Updates
let socket = null;
function initOwnerSocket(onNewOrderCallback, onStatusUpdateCallback) {
  if (typeof io !== 'undefined') {
    const socketOrigin = BACKEND_BASE || undefined;
    socket = socketOrigin ? io(socketOrigin, { transports: ['websocket', 'polling'] }) : io({ transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      socket.emit('join_owner', { branch: getActiveBranch() });
    });

    socket.on('reconnect', () => {
      console.log('[Socket] Reconnected to server');
      socket.emit('join_owner', { branch: getActiveBranch() });
      if (typeof onNewOrderCallback === 'function') onNewOrderCallback();
    });

    const handleNewOrder = (data) => {
      console.log('[Socket] New Order Received:', data);
      const orderData = (data && data.order) ? data.order : data;
      if (!orderData) return;

      const activeBranch = getActiveBranch();
      if (activeBranch && activeBranch.toLowerCase() !== 'all' && activeBranch.toLowerCase() !== 'all branches') {
        const orderBranch = orderData.branch || '';
        if (!isSameBranch(orderBranch, activeBranch)) {
          console.log(`[Socket] Order #${orderData.orderNumber} belongs to '${orderData.branch}', ignored for current active branch '${activeBranch}'`);
          return;
        }
      }

      if (orderData && orderData.orderNumber) {
        startLoudOrderAlarm(orderData);
      }
      if (typeof onNewOrderCallback === 'function') {
        onNewOrderCallback(orderData);
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_created', handleNewOrder);

    const handleStatusUpdate = (data) => {
      console.log('[Socket] Order Status Updated:', data);
      const orderData = (data && data.order) ? data.order : data;
      const activeBranch = getActiveBranch();
      if (orderData && activeBranch && activeBranch.toLowerCase() !== 'all' && activeBranch.toLowerCase() !== 'all branches') {
        const orderBranch = orderData.branch || '';
        if (orderBranch && !isSameBranch(orderBranch, activeBranch)) {
          return;
        }
      }

      if (typeof onStatusUpdateCallback === 'function') {
        onStatusUpdateCallback(data);
      }
      // Check remaining pending orders after status change
      authFetch('/api/orders?status=Pending').then(r => r ? r.json() : null).then(res => {
        if (res && res.data) {
          syncPendingOrdersAlarm(res.data);
        }
      }).catch(() => {});
    };

    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('order_update', handleStatusUpdate);
    socket.on('order_updated', handleStatusUpdate);
    socket.on('orders_updated', (data) => {
      if (typeof onStatusUpdateCallback === 'function') {
        onStatusUpdateCallback(data);
      }
    });
  }
}

// Mobile sidebar toggle
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// Run auth check on script load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (audioBtn) {
    audioBtn.innerHTML = soundEnabled ? '🔔 Sound ON' : '🔕 Sound OFF';
  }
});
