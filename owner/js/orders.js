/**
 * SUBBAYYA GARI HOTEL — OWNER ORDERS MANAGEMENT
 */

let currentOrders = [];
let activeOrderType = 'all';

function setOrderTypeTab(type, btnElement) {
  activeOrderType = type;

  // Update tabs UI
  document.querySelectorAll('.order-tab-btn').forEach((b) => b.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    const matchingBtn = document.querySelector(`.order-tab-btn[data-type="${type}"]`);
    if (matchingBtn) matchingBtn.classList.add('active');
  }

  // Update sidebar sub-nav active state
  document.getElementById('nav-all-orders')?.classList.toggle('active', type === 'all');
  document.getElementById('nav-table-orders')?.classList.toggle('active', type === 'dine-in');
  document.getElementById('nav-delivery-orders')?.classList.toggle('active', type === 'delivery');
  document.getElementById('nav-takeaway-orders')?.classList.toggle('active', type === 'takeaway');

  // Sync dropdown filter
  const typeSelect = document.getElementById('filter-type');
  if (typeSelect) {
    typeSelect.value = type;
  }

  // Update Page Title and Subtitle dynamically
  const titleEl = document.getElementById('orders-page-title');
  const subtitleEl = document.getElementById('orders-page-subtitle');
  const cardTitleEl = document.getElementById('table-card-title');
  const cardSubtitleEl = document.getElementById('table-card-subtitle');

  if (type === 'dine-in') {
    if (titleEl) titleEl.innerHTML = '🍽️ Table Reservations & Dine-In';
    if (subtitleEl) subtitleEl.textContent = 'Guest bookings, seating preferences, and banana leaf dining';
    if (cardTitleEl) cardTitleEl.textContent = 'Table Booking Queue';
    if (cardSubtitleEl) cardSubtitleEl.textContent = 'All dine-in guests and table reservations';
  } else if (type === 'delivery') {
    if (titleEl) titleEl.innerHTML = '🛵 Home Delivery Orders';
    if (subtitleEl) subtitleEl.textContent = 'Live doorstep deliveries, customer GPS locations & route status';
    if (cardTitleEl) cardTitleEl.textContent = 'Home Delivery Pipeline';
    if (cardSubtitleEl) cardSubtitleEl.textContent = 'All dispatch & doorstep delivery orders';
  } else if (type === 'takeaway') {
    if (titleEl) titleEl.innerHTML = '🥡 Takeaway & Parcel Orders';
    if (subtitleEl) subtitleEl.textContent = 'Counter pickups, curbside parcels & kitchen prep status';
    if (cardTitleEl) cardTitleEl.textContent = 'Takeaway Orders';
    if (cardSubtitleEl) cardSubtitleEl.textContent = 'Customer self-pickup orders';
  } else {
    if (titleEl) titleEl.innerHTML = 'Customer Orders';
    if (subtitleEl) subtitleEl.textContent = 'Live order pipeline & status management';
    if (cardTitleEl) cardTitleEl.textContent = 'Order Records';
    if (cardSubtitleEl) cardSubtitleEl.textContent = 'Showing matching orders from database';
  }

  // Update browser URL without reload
  const newUrl = new URL(window.location);
  if (type === 'all') {
    newUrl.searchParams.delete('type');
  } else {
    newUrl.searchParams.set('type', type);
  }
  window.history.replaceState({}, '', newUrl);

  loadOrders();
}

async function loadOrders() {
  const status = document.getElementById('filter-status')?.value || 'all';
  const orderType = activeOrderType || document.getElementById('filter-type')?.value || 'all';
  const paymentStatus = document.getElementById('filter-payment')?.value || 'all';
  const dateRange = document.getElementById('filter-date')?.value || 'all';
  const search = document.getElementById('search-orders')?.value || '';

  const params = new URLSearchParams();
  if (status !== 'all') params.append('status', status);
  if (orderType !== 'all') params.append('orderType', orderType);
  if (paymentStatus !== 'all') params.append('paymentStatus', paymentStatus);
  if (dateRange !== 'all') params.append('dateRange', dateRange);
  if (search.trim()) params.append('search', search.trim());

  const tbody = document.getElementById('orders-tbody');

  try {
    const res = await authFetch(`/api/orders?${params.toString()}`);
    if (res && res.ok) {
      const { data, total, typeCounts } = await res.json();
      currentOrders = data || [];
      const totalCountEl = document.getElementById('orders-total-count');
      if (totalCountEl) totalCountEl.textContent = total !== undefined ? total : currentOrders.length;

      // Update Live Badges with active/not-completed counts
      if (typeCounts) {
        const badgeAll = document.getElementById('badge-all');
        const badgeDineIn = document.getElementById('badge-dinein');
        const badgeDelivery = document.getElementById('badge-delivery');
        const badgeTakeaway = document.getElementById('badge-takeaway');

        if (badgeAll) badgeAll.textContent = typeCounts.all ?? 0;
        if (badgeDineIn) badgeDineIn.textContent = typeCounts.dineIn ?? 0;
        if (badgeDelivery) badgeDelivery.textContent = typeCounts.delivery ?? 0;
        if (badgeTakeaway) badgeTakeaway.textContent = typeCounts.takeaway ?? 0;
      }

      renderTableHeader(orderType);
      renderOrdersTable(currentOrders, orderType);
    } else {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align:center; padding: 40px; color: var(--color-text-sub);">
              <div style="font-size: 1.6rem; margin-bottom: 8px;">⚠️ Unable to Fetch Orders</div>
              <p style="font-size: 0.85rem; color: var(--color-text-muted);">Please make sure you are logged in as Owner.</p>
              <button onclick="loadOrders()" class="btn btn-primary btn-sm" style="margin-top: 10px;">🔄 Refresh Orders</button>
            </td>
          </tr>
        `;
      }
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding: 40px; color: var(--color-text-sub);">
            <div style="font-size: 1.6rem; margin-bottom: 8px;">🔌 Connection Error</div>
            <p style="font-size: 0.85rem; color: var(--color-text-muted);">Failed to connect to backend server.</p>
            <button onclick="loadOrders()" class="btn btn-primary btn-sm" style="margin-top: 10px;">🔄 Try Again</button>
          </td>
        </tr>
      `;
    }
  }
}

// Render dynamic table headers based on the active category
// Render dynamic table headers based on the active category
function renderTableHeader(orderType) {
  const thead = document.getElementById('orders-thead');
  if (!thead) return;

  if (orderType === 'dine-in') {
    thead.innerHTML = `
      <tr>
        <th>Booking Ref</th>
        <th>Guest Details</th>
        <th>Date & Slot</th>
        <th>Guests & Seating</th>
        <th>Table</th>
        <th>Reserved Feast</th>
        <th>Bill & Payment</th>
        <th>Status</th>
        <th style="text-align: right;">Actions</th>
      </tr>
    `;
  } else if (orderType === 'delivery') {
    thead.innerHTML = `
      <tr>
        <th>Order ID</th>
        <th>Customer</th>
        <th>Date & Time</th>
        <th>Delivery Destination</th>
        <th>Dishes Ordered</th>
        <th>Bill & Payment</th>
        <th>Status</th>
        <th style="text-align: right;">Actions</th>
      </tr>
    `;
  } else if (orderType === 'takeaway') {
    thead.innerHTML = `
      <tr>
        <th>Order ID</th>
        <th>Customer</th>
        <th>Date & Time</th>
        <th>Pickup Slot</th>
        <th>Dishes Ordered</th>
        <th>Bill & Payment</th>
        <th>Status</th>
        <th style="text-align: right;">Actions</th>
      </tr>
    `;
  } else {
    thead.innerHTML = `
      <tr>
        <th>Order ID</th>
        <th>Customer</th>
        <th>Date & Time</th>
        <th>Channel</th>
        <th>Items Snapshot</th>
        <th>Bill & Payment</th>
        <th>Status</th>
        <th style="text-align: right;">Actions</th>
      </tr>
    `;
  }
}

function renderOrdersTable(orders, orderType) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    const emptyMsg =
      orderType === 'dine-in'
        ? 'No table bookings found'
        : orderType === 'delivery'
        ? 'No home delivery orders found'
        : orderType === 'takeaway'
        ? 'No takeaway orders found'
        : 'No orders found matching the current filters';

    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding: 30px; color: var(--color-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">
            ${orderType === 'dine-in' ? '🍽️' : orderType === 'delivery' ? '🛵' : orderType === 'takeaway' ? '🥡' : '📋'}
          </div>
          <div style="font-size: 0.95rem; font-weight: 600;">${emptyMsg}</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const statusClass = order.orderStatus.replace(/\s+/g, '-');
      const itemsHtml = order.items
        .map((i) => `<div style="font-size: 0.78rem; line-height: 1.3;">• ${i.name} <strong style="color:var(--color-gold);">×${i.quantity}</strong></div>`)
        .join('');

      let quickNextAction = '';
      if (order.orderStatus === 'Pending') {
        quickNextAction = `<button class="btn btn-sm btn-primary" style="padding: 3px 8px; font-size: 0.72rem;" onclick="quickUpdateStatus('${order.orderNumber}', 'Accepted')">Accept</button>`;
      } else if (order.orderStatus === 'Accepted') {
        const nextLabel = (order.orderType === 'dine-in' || order.orderType === 'table-booking') ? 'Seat' : 'Cook';
        quickNextAction = `<button class="btn btn-sm" style="background:#8B5CF6; color:#FFF; padding: 3px 8px; font-size: 0.72rem;" onclick="quickUpdateStatus('${order.orderNumber}', 'Preparing')">${nextLabel}</button>`;
      } else if (order.orderStatus === 'Preparing') {
        const nextLabel = (order.orderType === 'dine-in' || order.orderType === 'table-booking') ? 'Serve' : 'Ready';
        quickNextAction = `<button class="btn btn-sm" style="background:#06B6D4; color:#FFF; padding: 3px 8px; font-size: 0.72rem;" onclick="quickUpdateStatus('${order.orderNumber}', 'Ready')">${nextLabel}</button>`;
      } else if (order.orderStatus === 'Ready') {
        if (order.orderType === 'delivery') {
          quickNextAction = `<button class="btn btn-sm" style="background:#EC4899; color:#FFF; padding: 3px 8px; font-size: 0.72rem;" onclick="quickUpdateStatus('${order.orderNumber}', 'Out for Delivery')">Dispatch</button>`;
        } else {
          quickNextAction = `<button class="btn btn-sm btn-success" style="padding: 3px 8px; font-size: 0.72rem;" onclick="quickUpdateStatus('${order.orderNumber}', 'Completed')">Complete</button>`;
        }
      } else if (order.orderStatus === 'Out for Delivery') {
        quickNextAction = `<button class="btn btn-sm btn-success" style="padding: 3px 8px; font-size: 0.72rem;" onclick="quickUpdateStatus('${order.orderNumber}', 'Completed')">Complete</button>`;
      }

      // Specialized row content depending on current view mode
      if (orderType === 'dine-in') {
        return `
        <tr>
          <td>
            <a href="order-details.html?id=${order.orderNumber}" class="order-id-badge">
              #${order.orderNumber}
            </a>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-text-main); font-size: 0.85rem;">${order.customerName}</div>
            <a href="tel:${order.phone}" style="font-size: 0.72rem; color: var(--color-gold); text-decoration: none;">📞 ${order.phone}</a>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-gold); font-size: 0.78rem; white-space: nowrap;">📅 ${order.reservationDate || 'Today'}</div>
            <div style="font-size: 0.72rem; color: var(--color-text-sub); white-space: nowrap;">⏰ ${order.reservationTime || order.pickupTime || '1:00 PM'}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: var(--color-text-main); font-size: 0.8rem; white-space: nowrap;">👥 ${order.guestsCount || 1} Guests</div>
            <div style="font-size: 0.7rem; color: var(--color-gold);">${order.seatingPreference || 'Banana Leaf'}</div>
          </td>
          <td>
            ${order.tableNumber ? `
              <div style="display:inline-flex; align-items:center; gap:2px; background:rgba(245,158,11,0.2); color:var(--color-gold); font-weight:800; font-size:0.75rem; padding:2px 6px; border-radius:5px; border:1px solid rgba(245,158,11,0.4); white-space:nowrap;">
                🪑 T-${order.tableNumber}
              </div>
              <div>
                <button onclick="allocateTable('${order.orderNumber}', '${order.tableNumber}')" style="background:transparent; border:none; color:var(--color-text-muted); font-size:0.68rem; cursor:pointer; text-decoration:underline;" title="Change Table">Change</button>
              </div>
            ` : `
              <button onclick="allocateTable('${order.orderNumber}', '')" style="background:rgba(245,158,11,0.15); color:var(--color-gold); border:1px dashed var(--color-gold); font-size:0.7rem; padding:2px 6px; border-radius:5px; cursor:pointer; font-weight:700; white-space:nowrap;">
                🪑 + Assign
              </button>
            `}
          </td>
          <td>
            <div>${itemsHtml}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: var(--color-text-main); font-size: 0.85rem; white-space: nowrap;">
              ${formatCurrency(order.totalAmount)}
            </div>
            <div style="margin-top: 2px;">
              <span class="payment-badge ${order.paymentStatus}" style="font-size: 0.65rem; padding: 1px 5px;">${order.paymentStatus}</span>
            </div>
          </td>
          <td>
            <span class="status-badge ${statusClass}" style="font-size: 0.7rem; padding: 2px 6px;">${order.orderStatus}</span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;">
              ${quickNextAction}
              <a href="order-details.html?id=${order.orderNumber}" class="btn btn-secondary btn-sm" style="padding: 3px 6px; font-size: 0.72rem;">
                View
              </a>
            </div>
          </td>
        </tr>
      `;
      }

      if (orderType === 'delivery') {
        const addr = order.deliveryAddress;
        const fullAddrQuery = [addr?.address, addr?.landmark, addr?.city || 'Hyderabad', addr?.pincode].filter(Boolean).join(', ');
        const mapUrl = addr?.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddrQuery || 'Hyderabad')}`;

        return `
        <tr>
          <td>
            <a href="order-details.html?id=${order.orderNumber}" class="order-id-badge">
              #${order.orderNumber}
            </a>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-text-main); font-size: 0.85rem;">${order.customerName}</div>
            <a href="tel:${order.phone}" style="font-size: 0.72rem; color: var(--color-gold); text-decoration: none;">📞 ${order.phone}</a>
          </td>
          <td>
            <div style="font-size: 0.75rem; color: var(--color-text-sub); white-space: nowrap;">${formatDateTime(order.createdAt)}</div>
          </td>
          <td>
            <div style="font-size: 0.8rem; font-weight: 700; color: #FFF; line-height: 1.2;">📍 ${addr?.address || 'Doorstep Delivery'}</div>
            <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px;">
              ${addr?.landmark ? '🏛️ ' + addr.landmark + ', ' : ''}${addr?.city || 'Hyderabad'}${addr?.pincode ? ' - ' + addr.pincode : ''}
            </div>
            <div style="margin-top: 3px;">
              <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.68rem; color: #60A5FA; background: rgba(59, 130, 246, 0.15); padding: 1px 6px; border-radius: 4px; text-decoration: none; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 700;">
                🗺️ Exact GPS / Map ↗
              </a>
            </div>
          </td>
          <td>
            <div>${itemsHtml}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: var(--color-text-main); font-size: 0.85rem; white-space: nowrap;">
              ${formatCurrency(order.totalAmount)}
            </div>
            <div style="margin-top: 2px;">
              <span class="payment-badge ${order.paymentStatus}" style="font-size: 0.65rem; padding: 1px 5px;">${order.paymentStatus}</span>
            </div>
          </td>
          <td>
            <span class="status-badge ${statusClass}" style="font-size: 0.7rem; padding: 2px 6px;">${order.orderStatus}</span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;">
              ${quickNextAction}
              <a href="order-details.html?id=${order.orderNumber}" class="btn btn-secondary btn-sm" style="padding: 3px 6px; font-size: 0.72rem;">
                View
              </a>
            </div>
          </td>
        </tr>
      `;
      }

      if (orderType === 'takeaway') {
        return `
        <tr>
          <td>
            <a href="order-details.html?id=${order.orderNumber}" class="order-id-badge">
              #${order.orderNumber}
            </a>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-text-main); font-size: 0.85rem;">${order.customerName}</div>
            <a href="tel:${order.phone}" style="font-size: 0.72rem; color: var(--color-gold); text-decoration: none;">📞 ${order.phone}</a>
          </td>
          <td>
            <div style="font-size: 0.75rem; color: var(--color-text-sub); white-space: nowrap;">${formatDateTime(order.createdAt)}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: #34D399; font-size: 0.78rem; white-space: nowrap;">⏰ ${order.pickupTime || 'ASAP'}</div>
            ${order.vehicleNote ? `<div style="font-size: 0.7rem; color: var(--color-text-muted);">🚗 ${order.vehicleNote}</div>` : ''}
          </td>
          <td>
            <div>${itemsHtml}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: var(--color-text-main); font-size: 0.85rem; white-space: nowrap;">
              ${formatCurrency(order.totalAmount)}
            </div>
            <div style="margin-top: 2px;">
              <span class="payment-badge ${order.paymentStatus}" style="font-size: 0.65rem; padding: 1px 5px;">${order.paymentStatus}</span>
            </div>
          </td>
          <td>
            <span class="status-badge ${statusClass}" style="font-size: 0.7rem; padding: 2px 6px;">${order.orderStatus}</span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;">
              ${quickNextAction}
              <a href="order-details.html?id=${order.orderNumber}" class="btn btn-secondary btn-sm" style="padding: 3px 6px; font-size: 0.72rem;">
                View
              </a>
            </div>
          </td>
        </tr>
      `;
      }

      // Default All Orders View
      let typeBadge = '';
      if (order.orderType === 'dine-in' || order.orderType === 'table-booking') {
        typeBadge = `
          <div>
            <span style="display: inline-block; background: rgba(245, 158, 11, 0.15); color: var(--color-gold); font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; border: 1px solid rgba(245, 158, 11, 0.3); white-space: nowrap;">
              🍽️ Table ${order.tableNumber ? '#' + order.tableNumber : 'Booking'}
            </span>
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--color-text-main); margin-top: 2px; white-space: nowrap;">
              👥 ${order.guestsCount || 1} Guests
            </div>
          </div>
        `;
      } else if (order.orderType === 'delivery') {
        typeBadge = `
          <div>
            <span style="display: inline-block; background: rgba(59, 130, 246, 0.15); color: #60A5FA; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; white-space: nowrap;">
              🛵 Delivery
            </span>
          </div>
        `;
      } else {
        typeBadge = `
          <div>
            <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34D399; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; white-space: nowrap;">
              🥡 Takeaway
            </span>
          </div>
        `;
      }

      return `
      <tr>
        <td>
          <a href="order-details.html?id=${order.orderNumber}" class="order-id-badge">
            #${order.orderNumber}
          </a>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--color-text-main); font-size: 0.85rem;">${order.customerName}</div>
          <a href="tel:${order.phone}" style="font-size: 0.72rem; color: var(--color-gold); text-decoration: none;">📞 ${order.phone}</a>
        </td>
        <td>
          <div style="font-size: 0.75rem; color: var(--color-text-sub); white-space: nowrap;">${formatDateTime(order.createdAt)}</div>
        </td>
        <td>
          ${typeBadge}
        </td>
        <td>
          <div>${itemsHtml}</div>
        </td>
        <td>
          <div style="font-weight: 800; color: var(--color-text-main); font-size: 0.85rem; white-space: nowrap;">
            ${formatCurrency(order.totalAmount)}
          </div>
          <div style="margin-top: 2px;">
            <span class="payment-badge ${order.paymentStatus}" style="font-size: 0.65rem; padding: 1px 5px;">${order.paymentStatus}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${statusClass}" style="font-size: 0.7rem; padding: 2px 6px;">${order.orderStatus}</span>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;">
            ${quickNextAction}
            <a href="order-details.html?id=${order.orderNumber}" class="btn btn-secondary btn-sm" style="padding: 3px 6px; font-size: 0.72rem;">
              View
            </a>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

// Quick Status Transition
async function quickUpdateStatus(orderNumber, newStatus) {
  if (typeof stopOrderAlarm === 'function') {
    stopOrderAlarm();
  }

  try {
    const res = await authFetch(`/api/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: newStatus }),
    });

    if (res && res.ok) {
      loadOrders();
    } else {
      const err = await res.json();
      alert(`Error updating status: ${err.message}`);
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

// Export Filtered Orders to CSV
function exportOrdersToCSV() {
  if (currentOrders.length === 0) {
    alert('No orders available to export!');
    return;
  }

  const headers = [
    'Order ID',
    'Customer Name',
    'Phone',
    'Date & Time',
    'Order Type',
    'Items',
    'Subtotal',
    'Delivery Charge',
    'Total Amount',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'Delivery Address / Table',
  ];

  const rows = currentOrders.map((order) => {
    const itemsStr = order.items.map((i) => `${i.name} x ${i.quantity}`).join('; ');
    const address =
      order.orderType === 'delivery'
        ? order.deliveryAddress?.address || 'N/A'
        : order.orderType === 'dine-in'
        ? `Table ${order.tableNumber || '1'} (${order.guestsCount || 1} Guests)`
        : 'Takeaway';

    return [
      order.orderNumber,
      `"${order.customerName.replace(/"/g, '""')}"`,
      order.phone,
      `"${formatDateTime(order.createdAt)}"`,
      order.orderType,
      `"${itemsStr.replace(/"/g, '""')}"`,
      order.subtotal,
      order.deliveryCharge,
      order.totalAmount,
      order.paymentMethod,
      order.paymentStatus,
      order.orderStatus,
      `"${address.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Subbayya_Gari_Orders_${activeOrderType}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Allocate Table Number for Dine-In / Table Booking
async function allocateTable(orderNumber, currentTable) {
  const table = prompt(`Enter Table Number to allocate for Order #${orderNumber}:`, currentTable || '1');
  if (table === null) return; // cancelled

  try {
    const res = await authFetch(`/api/orders/${orderNumber}/table`, {
      method: 'PATCH',
      body: JSON.stringify({ tableNumber: table.trim() }),
    });

    if (res && res.ok) {
      loadOrders();
    } else {
      const err = await res.json();
      alert(`Error allocating table: ${err.message}`);
    }
  } catch (error) {
    console.error('Error allocating table:', error);
  }
}

// Set up listeners and initial load
document.addEventListener('DOMContentLoaded', () => {
  // Read query params for initial tab filter and filters
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type') || 'all';
  const initialStatus = urlParams.get('status');
  const initialDate = urlParams.get('date');

  if (initialStatus && document.getElementById('filter-status')) {
    document.getElementById('filter-status').value = initialStatus;
  }
  if (initialDate && document.getElementById('filter-date')) {
    document.getElementById('filter-date').value = initialDate;
  }

  setOrderTypeTab(initialType);

  // Filter change listeners
  document.getElementById('filter-status')?.addEventListener('change', loadOrders);
  document.getElementById('filter-type')?.addEventListener('change', (e) => {
    setOrderTypeTab(e.target.value);
  });
  document.getElementById('filter-payment')?.addEventListener('change', loadOrders);
  document.getElementById('filter-date')?.addEventListener('change', loadOrders);
  document.getElementById('search-orders')?.addEventListener('input', () => {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(loadOrders, 300);
  });

  initOwnerSocket(
    () => loadOrders(),
    () => loadOrders()
  );
});

