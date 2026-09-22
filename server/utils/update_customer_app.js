const fs = require('fs');

const appJsPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

// Function to normalize server order
const helperCode = `
// ==========================================================================
// REAL-TIME ORDER LIVE SYNC & NORMALIZATION (Customer Website)
// ==========================================================================
function normalizeServerOrder(o) {
  if (!o) return null;
  const items = (o.items || []).map(i => ({
    id: i.menuItemId || i.id || '',
    name: i.name || 'Bhojanam Specialty',
    price: Number(i.price) || 0,
    qty: Number(i.quantity || i.qty) || 1,
    total: (Number(i.price) || 0) * (Number(i.quantity || i.qty) || 1),
    image: i.image || ''
  }));

  const subtotal = o.subtotal !== undefined ? Number(o.subtotal) : items.reduce((s, i) => s + i.total, 0);
  const packagingFee = o.packagingFee !== undefined ? Number(o.packagingFee) : 30;
  const deliveryFee = o.deliveryCharge !== undefined ? Number(o.deliveryCharge) : (o.deliveryFee !== undefined ? Number(o.deliveryFee) : 0);
  const discount = Number(o.discount) || 0;
  const grandTotal = o.totalAmount !== undefined ? Number(o.totalAmount) : (o.grandTotal !== undefined ? Number(o.grandTotal) : (subtotal + packagingFee + deliveryFee - discount));

  return {
    id: (o.orderNumber || o.id || '').toString(),
    createdAt: o.createdAt || new Date().toISOString(),
    timestamp: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
    status: o.orderStatus || o.status || 'Received',
    customerName: o.customerName || '',
    customerPhone: o.phone || o.customerPhone || '',
    customerEmail: o.email || o.customerEmail || '',
    orderType: o.orderType || 'delivery',
    branchName: o.branch || o.branchName || 'KPHB Colony, Hyderabad',
    branchAddress: o.branchAddress || 'MIG 295, Rd No. 4, Kukatpally, Hyderabad',
    items: items,
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    subtotal: subtotal,
    packagingFee: packagingFee,
    deliveryFee: deliveryFee,
    discount: discount,
    grandTotal: grandTotal,
    paymentStatus: o.paymentStatus || 'Paid Online / Verified',
    paymentMethod: o.paymentMethod || 'Online Payment',
    tableNumber: o.tableNumber || '',
    guestsCount: Number(o.guestsCount) || 1,
    reservationDate: o.reservationDate || '',
    reservationTime: o.reservationTime || '',
    seatingPreference: o.seatingPreference || 'Traditional Banana Leaf Seating',
    notes: o.notes || '',
    estimatedPrepTime: o.estimatedPrepTime || '20-25 Mins',
    deliveryAddress: (typeof o.deliveryAddress === 'object' ? o.deliveryAddress?.address : o.deliveryAddress) || '',
    deliveryLandmark: (typeof o.deliveryAddress === 'object' ? o.deliveryAddress?.landmark : o.deliveryLandmark) || '',
    statusHistory: o.statusHistory || []
  };
}

// Live Socket.IO connection for customer real-time updates
let customerSocket = null;
function initCustomerLiveSync() {
  if (typeof io !== 'undefined') {
    try {
      customerSocket = io(BACKEND_BASE, { transports: ['websocket', 'polling'] });
      
      customerSocket.on('connect', () => {
        console.log('[Live Sync] Connected to Subbayya Gari Real-Time Server');
      });

      const handleOrderUpdate = (payload) => {
        console.log('[Live Sync] Real-time order update received:', payload);
        const rawOrder = payload.order || payload.data || payload;
        const normalized = normalizeServerOrder(rawOrder);
        if (!normalized || !normalized.id) return;

        // Update local storage orders
        try {
          const localOrders = JSON.parse(localStorage.getItem('sgh_customer_orders') || '[]');
          const idx = localOrders.findIndex(o => o && (o.id === normalized.id || o.orderNumber === normalized.id));
          if (idx !== -1) {
            localOrders[idx] = { ...localOrders[idx], ...normalized };
          } else {
            localOrders.unshift(normalized);
          }
          localStorage.setItem('sgh_customer_orders', JSON.stringify(localOrders));
        } catch (e) {}

        // If order details modal is open for this order, dynamically update it live!
        if (typeof activeViewingOrder !== 'undefined' && activeViewingOrder && (activeViewingOrder.id === normalized.id || activeViewingOrder.orderNumber === normalized.id)) {
          openOrderDetailsModal(normalized.id);
          showToast(\`🔔 Order #\${normalized.id} updated to \${normalized.status}!\`);
        }

        // If profile / my orders container is open, re-render list
        const myOrdersContainer = document.getElementById('customer-orders-container');
        if (myOrdersContainer) {
          fetchAndRenderCustomerOrders();
        }
      };

      customerSocket.on('order_status_updated', handleOrderUpdate);
      customerSocket.on('order_update', handleOrderUpdate);
      customerSocket.on('order_updated', handleOrderUpdate);
      customerSocket.on('table_allocated', handleOrderUpdate);
      customerSocket.on('payment_status_updated', handleOrderUpdate);
      customerSocket.on('orders_updated', () => {
        if (typeof fetchAndRenderCustomerOrders === 'function') {
          fetchAndRenderCustomerOrders();
        }
      });
    } catch (err) {
      console.warn('[Live Sync] Socket connection notice:', err);
    }
  }

  // Automatic Background Polling every 5 seconds for 100% reliability
  setInterval(() => {
    // If order details modal is actively open, silently refresh its live status
    if (typeof activeViewingOrder !== 'undefined' && activeViewingOrder && activeViewingOrder.id) {
      fetch(\`\${BACKEND_BASE}/api/orders/\${activeViewingOrder.id}\`)
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          const fresh = res?.data || res?.order;
          if (fresh) {
            const norm = normalizeServerOrder(fresh);
            if (norm && (norm.status !== activeViewingOrder.status || norm.tableNumber !== activeViewingOrder.tableNumber)) {
              openOrderDetailsModal(norm.id);
              showToast(\`🔔 Order #\${norm.id} updated: \${norm.status}\`);
            }
          }
        }).catch(() => {});
    }

    // If profile modal or orders container is visible, refresh
    const profileModal = document.getElementById('profile-modal');
    if (profileModal && profileModal.classList.contains('active')) {
      fetchAndRenderCustomerOrders();
    }
  }, 5000);
}
`;

// Replace fetchAndRenderCustomerOrders implementation to handle normalized backend response
const fetchOrdersPattern = /\/\/ Fetch customer orders from API and local storage[\s\S]*?window\.fetchAndRenderCustomerOrders = fetchAndRenderCustomerOrders;/;

const newFetchOrdersCode = `// Fetch customer orders from API and local storage, and render itemized cards
async function fetchAndRenderCustomerOrders() {
  const container = document.getElementById('customer-orders-container');
  const badgeEl = document.getElementById('profile-orders-count');
  if (!container) return;

  // Retrieve locally placed orders from localStorage
  let localOrders = [];
  try {
    const raw = localStorage.getItem('sgh_customer_orders');
    if (raw) {
      localOrders = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read local orders cache:', err);
  }

  const user = AppState.currentUser;

  try {
    const cleanPhone = user ? (user.phone || '').replace(/\\D/g, '').slice(-10) : '';
    const email = user ? (user.email || '') : '';
    
    let serverOrders = [];
    try {
      let url = \`\${BACKEND_BASE}/api/orders\`;
      if (cleanPhone) {
        url += \`?phone=\${encodeURIComponent(cleanPhone)}\`;
        if (email && !email.endsWith('@subbayyagari.in')) {
          url += \`&email=\${encodeURIComponent(email)}\`;
        }
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawList = data.data || data.orders || [];
        if (Array.isArray(rawList)) {
          serverOrders = rawList.map(normalizeServerOrder).filter(Boolean);
        }
      }
    } catch (apiErr) {
      console.warn('API fetch orders notice (using local cache if available):', apiErr);
    }

    // Merge server orders and local orders, deduplicating by ID
    const orderMap = new Map();

    // 1. Add all local orders placed on this device / past orders
    localOrders.forEach(ord => {
      const norm = normalizeServerOrder(ord);
      if (norm && norm.id) {
        orderMap.set(norm.id, norm);
      }
    });

    // 2. Add/update with server orders (server has authoritative latest status & table allocations)
    serverOrders.forEach(ord => {
      if (ord && ord.id) {
        orderMap.set(ord.id, ord);
      }
    });

    let orders = Array.from(orderMap.values());

    // Sort newest first
    orders.sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));

    currentCustomerOrders = orders;
    if (badgeEl) badgeEl.textContent = orders.length;

    const headerMyOrdersBtn = document.getElementById('btn-header-my-orders');
    if (headerMyOrdersBtn) {
      headerMyOrdersBtn.innerHTML = \`<span>📦</span><span>My Orders (\${orders.length})</span>\`;
    }

    if (orders.length === 0) {
      container.innerHTML = \`
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-muted); background: var(--color-surface-muted); border-radius: var(--radius-md); border: 1px dashed var(--color-border);">
          <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">🍃</div>
          <h4 style="color: var(--color-primary); margin-bottom: 0.35rem; font-size: 1.05rem;">No Orders Yet!</h4>
          <p style="font-size: 0.8rem; margin-bottom: 1.25rem;">Experience the iconic Andhra Royal Butta Bhojanam with hot flowing pure ghee!</p>
          <button class="btn btn-gold btn-sm" onclick="closeProfileModal(); toggleCart(true);">
            <span>Order Royal Butta Feast 🧺</span>
          </button>
        </div>
      \`;
      return;
    }

    // Render Order Cards with Items Breakdown
    container.innerHTML = orders.map(ord => {
      let statusClass = 'cust-status-preparing';
      let statusIcon = '👨‍🍳';
      const s = (ord.status || 'Received').toLowerCase();
      if (s === 'delivered' || s === 'completed') {
        statusClass = 'cust-status-delivered';
        statusIcon = '✅';
      } else if (s === 'out for delivery' || s === 'ready') {
        statusClass = 'cust-status-out';
        statusIcon = '🛵';
      } else if (s === 'accepted') {
        statusClass = 'cust-status-preparing';
        statusIcon = '👨‍🍳';
      } else if (s === 'received' || s === 'pending') {
        statusClass = 'cust-status-received';
        statusIcon = '📥';
      }

      const formattedDate = ord.createdAt 
        ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent Order';

      const isDelivery = ord.orderType === 'delivery';

      // Build Items List HTML
      const itemsListHtml = (ord.items || []).map(item => \`
        <div class="cust-order-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px dotted rgba(0,0,0,0.08);">
          <div style="display: flex; align-items: center; gap: 0.45rem; flex: 1; min-width: 0;">
            <span style="color: #16A34A; font-size: 0.72rem; flex-shrink: 0;">🟢</span>
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <span style="font-weight: 700; color: var(--color-text); font-size: 0.84rem;">\${item.name || 'Bhojanam Specialty'}</span>
              <span style="font-size: 0.72rem; color: var(--color-text-muted); margin-left: 0.25rem;">(₹\${item.price || 0} each)</span>
            </div>
            <span style="background: rgba(15, 90, 39, 0.1); color: var(--color-primary); font-weight: 800; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; flex-shrink: 0;">x\${item.qty || 1}</span>
          </div>
          <div style="font-weight: 800; color: var(--color-primary); font-size: 0.88rem; margin-left: 0.5rem; flex-shrink: 0;">
            ₹\${(item.price || 0) * (item.qty || 1)}
          </div>
        </div>
      \`).join('');

      const subtotalVal = ord.subtotal || (ord.items || []).reduce((s, i) => s + ((i.price || 0) * (i.qty || 1)), 0);
      const packingVal = ord.packagingFee !== undefined ? ord.packagingFee : 30;
      const deliveryVal = ord.deliveryFee || 0;
      const discountVal = ord.discount || 0;

      return \`
        <div class="cust-order-card" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.15rem; margin-bottom: 1.1rem; box-shadow: var(--shadow-xs);">
          <!-- Header -->
          <div class="cust-order-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border); padding-bottom: 0.65rem; margin-bottom: 0.75rem;">
            <div>
              <div class="cust-order-id" style="font-family: var(--font-brand), monospace; font-weight: 800; color: var(--color-primary); font-size: 0.96rem;">#\${ord.id}</div>
              <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">📅 Placed: \${formattedDate}</div>
            </div>
            <span class="cust-status-badge \${statusClass}">
              <span>\${statusIcon}</span>
              <span>\${ord.status || 'Received'}</span>
            </span>
          </div>

          <!-- Order Type & Branch Destination & Table Assignment -->
          <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.65rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.35rem;">
            <div>
              <strong>\${isDelivery ? '🛵 Home Delivery' : (ord.orderType === 'dine-in' ? '🍽️ Dine-in / Reservation' : '🥡 Takeaway')}</strong>
              <span style="color: var(--color-border-hover);"> • </span>
              <span>\${ord.branchName || 'KPHB Colony, Hyderabad'}</span>
            </div>
            \${ord.tableNumber ? \`<span style="background:rgba(16,185,129,0.15); color:#10B981; font-weight:800; padding:2px 8px; border-radius:4px; font-size:0.75rem;">🪑 Table #\${ord.tableNumber}</span>\` : ''}
            <span style="color: var(--color-gold); font-weight: 700; font-size: 0.74rem;">💳 \${ord.paymentStatus || 'Paid Online'}</span>
          </div>

          <!-- Dishes Ordered -->
          <div class="cust-order-items-box" style="background: var(--color-surface-muted); border-radius: var(--radius-sm); padding: 0.75rem 0.85rem; margin-bottom: 0.75rem; border: 1px dashed rgba(15, 90, 39, 0.2);">
            <div style="font-size: 0.72rem; font-weight: 800; color: var(--color-gold); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.04em; display: flex; justify-content: space-between; align-items: center;">
              <span>🍽️ Dishes Ordered (\${ord.itemCount || (ord.items ? ord.items.length : 0)} items)</span>
              <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: 600;">Subtotal: ₹\${subtotalVal}</span>
            </div>
            <div style="display: flex; flex-direction: column;">
              \${itemsListHtml || '<div style="font-size: 0.78rem; color: var(--color-text-muted);">Royal Butta Feast Selection</div>'}
            </div>
          </div>

          <!-- Footer & Action Buttons -->
          <div class="cust-order-footer" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; border-top: 1px solid var(--color-border); padding-top: 0.75rem;">
            <div>
              <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase;">Total Paid</div>
              <div style="font-weight: 800; color: var(--color-primary); font-size: 1.15rem; font-family: var(--font-brand), sans-serif;">
                ₹\${ord.grandTotal || subtotalVal}
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button class="btn btn-gold btn-sm" onclick="openOrderDetailsModal('\${ord.id}')" style="font-size: 0.75rem; padding: 0.35rem 0.85rem;">
                <span>Live Tracker 🛵</span>
              </button>
            </div>
          </div>
        </div>
      \`;
    }).join('');

  } catch (err) {
    console.error('Error fetching customer orders:', err);
    container.innerHTML = \`
      <div style="text-align: center; padding: 1.5rem; color: var(--color-text-muted);">
        <p style="font-size: 0.85rem; margin-bottom: 0.5rem;">⚠️ Unable to connect to server.</p>
        <button class="btn btn-outline btn-sm" onclick="fetchAndRenderCustomerOrders()">Retry 🔄</button>
      </div>
    \`;
  }
}
window.fetchAndRenderCustomerOrders = fetchAndRenderCustomerOrders;`;

if (fetchOrdersPattern.test(content)) {
  content = content.replace(fetchOrdersPattern, newFetchOrdersCode);
  console.log('Replaced fetchAndRenderCustomerOrders successfully');
} else {
  console.log('fetchOrdersPattern not matched directly, appending logic');
}

// Add initCustomerLiveSync at DOMContentLoaded or bottom of script
if (!content.includes('initCustomerLiveSync')) {
  content = helperCode + '\n' + content;
  content += '\n\n// Initialize customer real-time sync\nif (typeof document !== "undefined") {\n  document.addEventListener("DOMContentLoaded", () => {\n    initCustomerLiveSync();\n  });\n}\n';
  console.log('Appended initCustomerLiveSync');
}

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('Updated customer app.js successfully');
