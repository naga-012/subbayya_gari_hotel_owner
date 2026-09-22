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
