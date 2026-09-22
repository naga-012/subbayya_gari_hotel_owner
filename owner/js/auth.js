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

// Check Authentication on Owner Pages
function checkAuth() {
  const token = localStorage.getItem('sgh_owner_token');
  const userStr = localStorage.getItem('sgh_owner_user');

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
  if (nameEl) nameEl.textContent = user.name || 'Owner';
  if (avatarEl) avatarEl.textContent = (user.name || 'O').charAt(0).toUpperCase();
}

// Owner Logout
function logoutOwner() {
  localStorage.removeItem('sgh_owner_token');
  localStorage.removeItem('sgh_owner_user');
  window.location.href = 'login.html';
}

// Authenticated Fetch Helper
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('sgh_owner_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const targetUrl = url.startsWith('http')
    ? url
    : (url.startsWith('/api') ? `${BACKEND_BASE}${url}` : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`);

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

// Unlock audio context on first user interaction to comply with browser autoplay policy
['click', 'touchstart', 'keydown'].forEach((evt) => {
  document.addEventListener(evt, () => {
    getAudioContext();
  }, { once: true });
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

// Play loud dual-tone kitchen buzzer chime
function playSingleLoudBeep() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // High energetic alert frequencies (880Hz A5 + 1318.5Hz E6)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
    osc1.frequency.setValueAtTime(1760, ctx.currentTime + 0.24);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.12);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.24);

    // Loud volume (gain 0.95)
    gain.gain.setValueAtTime(0.95, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.7);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.log('Audio alert error:', e);
  }
}

// Start continuous loud order alarm until accepted
function startLoudOrderAlarm(order) {
  activePendingOrderNumber = order.orderNumber;

  // Stop any previous ringing interval
  if (orderAlertInterval) {
    clearInterval(orderAlertInterval);
    orderAlertInterval = null;
  }

  // Play immediately and loop every 1.2s until accepted
  playSingleLoudBeep();
  if (soundEnabled) {
    orderAlertInterval = setInterval(() => {
      playSingleLoudBeep();
    }, 1200);
  }

  showOrderAlertBanner(order);
}

// Stop loud order alarm
function stopOrderAlarm() {
  if (orderAlertInterval) {
    clearInterval(orderAlertInterval);
    orderAlertInterval = null;
  }
  activePendingOrderNumber = null;

  const banner = document.getElementById('order-alert-banner');
  if (banner) {
    banner.classList.remove('show');
  }
}

// Accept order directly from the alert banner & stop sound
async function acceptOrderFromAlert(orderNumber) {
  stopOrderAlarm();

  try {
    const res = await authFetch(`/api/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: 'Accepted', note: 'Accepted by owner via quick alert' }),
    });

    if (res && res.ok) {
      // If loadOrders or loadDashboardData exists on current page, refresh
      if (typeof loadOrders === 'function') loadOrders();
      if (typeof loadDashboardData === 'function') loadDashboardData();
      if (typeof loadOrderDetails === 'function') loadOrderDetails();
    }
  } catch (e) {
    console.error('Error accepting order from alert:', e);
  }
}

// Show Floating Notification Banner with Accept button
function showOrderAlertBanner(order) {
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

  banner.innerHTML = `
    <div class="alert-icon-ring">🔔</div>
    <div class="alert-info">
      <div class="alert-title">🔔 NEW INCOMING ORDER #${order.orderNumber}</div>
      <div class="alert-text"><strong>${order.customerName}</strong> • ${formatCurrency(order.totalAmount)}</div>
      <div style="font-size: 0.75rem; color: var(--color-gold); margin-top: 2px;">${typeLabel}</div>
    </div>
    <div class="alert-actions">
      <button class="btn-alert-accept" onclick="acceptOrderFromAlert('${order.orderNumber}')">
        ✅ Accept Order & Stop Sound
      </button>
      <div style="display: flex; gap: 6px; margin-top: 4px;">
        <a href="order-details.html?id=${order.orderNumber}" class="btn-alert-view" style="flex: 1;">View Details</a>
        <button class="btn-alert-view" onclick="stopOrderAlarm()" style="cursor: pointer;" title="Mute alarm without accepting">🔕 Mute</button>
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
      socket.emit('join_owner');
    });

    socket.on('reconnect', () => {
      console.log('[Socket] Reconnected to server');
      socket.emit('join_owner');
      if (typeof onNewOrderCallback === 'function') onNewOrderCallback();
    });

    const handleNewOrder = (data) => {
      console.log('[Socket] New Order Received:', data);
      const orderData = (data && data.order) ? data.order : data;
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
      if (data && data.orderStatus && data.orderStatus !== 'Pending') {
        stopOrderAlarm();
      }
      if (typeof onStatusUpdateCallback === 'function') {
        onStatusUpdateCallback(data);
      }
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
