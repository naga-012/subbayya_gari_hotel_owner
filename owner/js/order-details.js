/**
 * SUBBAYYA GARI HOTEL — ORDER DETAILS & RECEIPT CONTROLLER
 */

let activeOrder = null;

async function loadOrderDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    alert('No order ID provided');
    window.location.href = 'orders.html';
    return;
  }

  try {
    const res = await authFetch(`/api/orders/${orderId}`);
    if (res && res.ok) {
      const { data } = await res.json();
      activeOrder = data;
      renderOrderUI(activeOrder);
    } else {
      alert('Order not found');
      window.location.href = 'orders.html';
    }
  } catch (error) {
    console.error('Error loading order details:', error);
  }
}

function renderOrderUI(order) {
  // Page Title & Header
  document.getElementById('detail-order-number').textContent = `#${order.orderNumber}`;
  document.getElementById('detail-created-at').textContent = formatDateTime(order.createdAt);
  
  const statusBadge = document.getElementById('detail-status-badge');
  const statusClass = order.orderStatus.replace(/\s+/g, '-');
  statusBadge.className = `status-badge ${statusClass}`;
  statusBadge.textContent = order.orderStatus;

  // Customer Info
  document.getElementById('detail-customer-name').textContent = order.customerName;
  document.getElementById('detail-customer-phone').textContent = order.phone;
  document.getElementById('detail-customer-email').textContent = order.email || 'N/A';

  // Customer Address in Customer Card
  const custAddrRow = document.getElementById('detail-cust-address-row');
  const custAddrEl = document.getElementById('detail-customer-address');
  const orderCustAddr = order.deliveryAddress?.address || '';
  if (custAddrRow && custAddrEl) {
    if (orderCustAddr) {
      custAddrRow.style.display = 'block';
      const custMapLink = order.deliveryAddress?.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderCustAddr)}`;
      custAddrEl.innerHTML = `
        <span>${orderCustAddr}</span>
        <a href="${custMapLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block; margin-left:6px; color:#60A5FA; text-decoration:none; font-weight:700;">
          🗺️ View Map ↗
        </a>
      `;
    } else {
      custAddrRow.style.display = 'none';
    }
  }

  // Order Type & Branch
  const typeEl = document.getElementById('detail-order-type');
  typeEl.textContent = order.orderType.toUpperCase();
  document.getElementById('detail-branch').textContent = order.branch || 'KPHB Colony, Hyderabad';

  // Delivery / Dine-in / Takeaway specific fields
  const deliveryCard = document.getElementById('detail-delivery-section');
  const mapEmbedWrapper = document.getElementById('detail-map-embed-wrapper');
  const mapIframe = document.getElementById('detail-map-iframe');
  const distEl = document.getElementById('detail-delivery-distance');

  if (order.orderType === 'delivery') {
    deliveryCard.style.display = 'block';
    const addr = order.deliveryAddress;
    const fullAddrQuery = [addr?.address, addr?.landmark, addr?.city || 'Hyderabad', addr?.pincode].filter(Boolean).join(', ');
    const mapUrl = addr?.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddrQuery || 'Hyderabad')}`;

    // Determine query for Google Maps embed iframe
    let embedQuery = fullAddrQuery || 'Hyderabad, Telangana';
    if (addr?.locationUrl) {
      // Check if locationUrl contains lat,lng coordinates
      const coordsMatch = addr.locationUrl.match(/q=([-0-9.]+),([-0-9.]+)/) || addr.locationUrl.match(/([-0-9.]+),([-0-9.]+)/);
      if (coordsMatch) {
        embedQuery = `${coordsMatch[1]},${coordsMatch[2]}`;
      }
    }

    document.getElementById('detail-delivery-addr').innerHTML = `
      <div style="font-size: 1.05rem; font-weight: 700; color: #FFF; line-height: 1.3;">
        📍 ${addr?.address || 'Doorstep Delivery'}
      </div>
      <div style="font-size: 0.85rem; color: var(--color-gold); margin-top: 4px;">
        ${addr?.landmark ? '🏛️ Landmark: ' + addr.landmark + ', ' : ''}${addr?.city || 'Hyderabad'}${addr?.pincode ? ' - ' + addr.pincode : ''}
      </div>
    `;
    document.getElementById('detail-delivery-landmark').textContent = '';
    document.getElementById('detail-delivery-city').textContent = '';

    if (distEl) {
      const km = addr?.distanceKm || 2;
      distEl.textContent = `🛵 Est. Distance: ~${km} km from Kitchen (${order.branch || 'KPHB'})`;
    }

    const mapsBtn = document.getElementById('detail-maps-btn');
    if (mapsBtn) {
      mapsBtn.href = mapUrl;
      mapsBtn.target = '_blank';
      mapsBtn.style.display = 'inline-flex';
      mapsBtn.innerHTML = '🗺️ Open in Google Maps / Live GPS Navigation ↗';
    }

    if (mapEmbedWrapper && mapIframe) {
      mapEmbedWrapper.style.display = 'block';
      mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(embedQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
  } else if (order.orderType === 'dine-in' || order.orderType === 'table-booking') {
    deliveryCard.style.display = 'block';
    if (mapEmbedWrapper) mapEmbedWrapper.style.display = 'none';
    if (distEl) distEl.textContent = '';
    typeEl.textContent = 'TABLE BOOKING';
    typeEl.style.background = 'rgba(245, 158, 11, 0.2)';
    typeEl.style.color = 'var(--color-gold)';
    typeEl.style.border = '1px solid rgba(245, 158, 11, 0.4)';

    document.getElementById('detail-delivery-addr').innerHTML = `
      <div style="background: rgba(245, 158, 11, 0.08); padding: 14px; border-radius: 8px; border-left: 3px solid var(--color-gold); margin-top: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 800; color: var(--color-gold); font-size: 1.05rem;">
            🍽️ Table Reservation (${order.guestsCount || 1} Guests)
          </div>
          <span style="background: ${order.tableNumber ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${order.tableNumber ? '#34D399' : 'var(--color-gold)'}; font-weight: 800; font-size: 0.82rem; padding: 2px 10px; border-radius: 6px; border: 1px solid ${order.tableNumber ? '#10B981' : 'var(--color-gold)'};">
            ${order.tableNumber ? `🪑 Table #${order.tableNumber}` : '⚠️ No Table Assigned'}
          </span>
        </div>

        <div style="margin-top: 6px; font-size: 0.85rem; color: var(--color-text-main);">
          <strong>📅 Date & Time:</strong> ${order.reservationDate ? `${order.reservationDate} at ${order.reservationTime || ''}` : order.pickupTime}
        </div>
        <div style="margin-top: 4px; font-size: 0.85rem; color: var(--color-text-main);">
          <strong>🌿 Seating:</strong> ${order.seatingPreference || 'Traditional Banana Leaf Seating'}
        </div>
        ${order.notes ? `<div style="margin-top: 4px; font-size: 0.82rem; color: var(--color-text-muted);"><strong>📝 Note:</strong> ${order.notes}</div>` : ''}

        <!-- TABLE NUMBER ALLOCATOR SECTION -->
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(245, 158, 11, 0.3);">
          <div style="font-size: 0.78rem; font-weight: 800; color: var(--color-gold); text-transform: uppercase; margin-bottom: 6px;">
            🪑 Allocate / Change Table Number:
          </div>
          
          <!-- Quick Preset Buttons -->
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
              .map(
                (t) => `
              <button onclick="setDetailTable('${t}')" class="btn btn-sm" style="padding: 3px 8px; font-size: 0.75rem; background: ${order.tableNumber === String(t) ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.08)'}; color: ${order.tableNumber === String(t) ? '#000' : '#FFF'}; border: 1px solid ${order.tableNumber === String(t) ? 'var(--color-gold)' : 'var(--color-card-border)'};">
                T-${t}
              </button>
            `
              )
              .join('')}
          </div>

          <!-- Custom Table Input -->
          <div style="display: flex; gap: 8px;">
            <input type="text" id="custom-table-input" class="form-control" style="padding: 6px 10px; font-size: 0.85rem;" placeholder="e.g. 5, VIP-1, A2" value="${order.tableNumber || ''}" />
            <button class="btn btn-primary btn-sm" onclick="saveCustomTable()" style="white-space: nowrap;">
              Save Table
            </button>
          </div>
        </div>

      </div>
    `;
    document.getElementById('detail-delivery-landmark').textContent = '';
    document.getElementById('detail-delivery-city').textContent = '';
    document.getElementById('detail-maps-btn').style.display = 'none';
  } else {
    deliveryCard.style.display = 'block';
    if (mapEmbedWrapper) mapEmbedWrapper.style.display = 'none';
    if (distEl) distEl.textContent = '';
    document.getElementById('detail-delivery-addr').innerHTML = `<strong style="color:var(--color-primary); font-size:1.1rem;">🥡 Restaurant Takeaway / Curbside</strong>`;
    document.getElementById('detail-delivery-landmark').textContent = `Pickup Slot: ${order.pickupTime || 'ASAP (15-20 Mins)'}`;
    document.getElementById('detail-delivery-city').textContent = order.vehicleNote ? `Vehicle Note: ${order.vehicleNote}` : '';
    document.getElementById('detail-maps-btn').style.display = 'none';
  }

  // Items Snapshot Table
  const itemsTbody = document.getElementById('detail-items-tbody');
  itemsTbody.innerHTML = order.items
    .map(
      (item) => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--color-text-main);">${item.name}</div>
          ${item.telugu ? `<div style="font-size:0.75rem; color: var(--color-gold);">${item.telugu}</div>` : ''}
        </td>
        <td style="text-align: center; font-weight: 800; color: var(--color-gold);">${item.quantity}</td>
        <td style="text-align: right;">${formatCurrency(item.price)}</td>
        <td style="text-align: right; font-weight: 800; color: var(--color-text-main);">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  // Cost Calculations
  document.getElementById('detail-subtotal').textContent = formatCurrency(order.subtotal);
  document.getElementById('detail-packaging').textContent = formatCurrency(order.packagingFee);
  document.getElementById('detail-delivery-fee').textContent = formatCurrency(order.deliveryCharge);
  document.getElementById('detail-discount').textContent = `- ${formatCurrency(order.discount)}`;
  document.getElementById('detail-grand-total').textContent = formatCurrency(order.totalAmount);

  // Payment Status
  document.getElementById('detail-payment-method').textContent = order.paymentMethod;
  const paymentSelect = document.getElementById('detail-payment-status');
  if (paymentSelect) paymentSelect.value = order.paymentStatus;

  // Status History Timeline
  renderStatusHistory(order.statusHistory || []);
}

function renderStatusHistory(history) {
  const container = document.getElementById('detail-timeline');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `<div style="color:var(--color-text-muted); font-size:0.85rem;">No history records</div>`;
    return;
  }

  container.innerHTML = history
    .map(
      (h) => `
      <div style="display: flex; gap: 14px; margin-bottom: 16px; position: relative;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--color-gold); margin-top: 5px; flex-shrink: 0; box-shadow: 0 0 8px var(--color-gold);"></div>
        <div>
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--color-text-main);">${h.status}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${formatDateTime(h.timestamp)}</div>
          ${h.note ? `<div style="font-size: 0.8rem; color: var(--color-text-sub); margin-top: 2px;">${h.note}</div>` : ''}
        </div>
      </div>
    `
    )
    .join('');
}

// Update Status Action Handler
async function updateStatus(newStatus) {
  if (!activeOrder) return;
  if (typeof stopOrderAlarm === 'function') {
    stopOrderAlarm();
  }
  const note = prompt(`Enter optional note for transition to "${newStatus}":`, `Status changed to ${newStatus}`);

  try {
    const res = await authFetch(`/api/orders/${activeOrder.orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: newStatus, note }),
    });

    if (res && res.ok) {
      loadOrderDetails();
    } else {
      const err = await res.json();
      alert(`Error updating status: ${err.message}`);
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

// Update Payment Status Handler
async function onPaymentStatusChange() {
  if (!activeOrder) return;
  const newStatus = document.getElementById('detail-payment-status').value;

  try {
    const res = await authFetch(`/api/orders/${activeOrder.orderNumber}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus: newStatus }),
    });

    if (res && res.ok) {
      alert(`Payment status updated to ${newStatus}`);
      loadOrderDetails();
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
}

// Update Table Allocation Handlers
async function setDetailTable(tableNumber) {
  if (!activeOrder) return;
  try {
    const res = await authFetch(`/api/orders/${activeOrder.orderNumber}/table`, {
      method: 'PATCH',
      body: JSON.stringify({ tableNumber: String(tableNumber).trim() }),
    });

    if (res && res.ok) {
      loadOrderDetails();
    } else {
      const err = await res.json();
      alert(`Error assigning table: ${err.message}`);
    }
  } catch (error) {
    console.error('Error assigning table:', error);
  }
}

async function saveCustomTable() {
  if (!activeOrder) return;
  const input = document.getElementById('custom-table-input');
  const tableVal = input ? input.value.trim() : '';

  if (!tableVal) {
    alert('Please enter a valid table number or name');
    return;
  }

  setDetailTable(tableVal);
}

// Print Order Receipt
function printOrderReceipt() {
  if (!activeOrder) return;

  const printArea = document.getElementById('printable-receipt-content');
  if (!printArea) return;

  const itemsHtml = activeOrder.items
    .map(
      (item) => `
      <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
        <span>${item.name} × ${item.quantity}</span>
        <span>₹${item.subtotal}</span>
      </div>
    `
    )
    .join('');

  printArea.innerHTML = `
    <div style="text-align:center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
      <h2 style="font-size:16px; margin:0;">SUBBAYYA GARI HOTEL</h2>
      <p style="margin:2px 0; font-size:11px;">Authentic Andhra Bhojanam Since 1950</p>
      <p style="margin:2px 0; font-size:10px;">Helpline: 9010 888 842 | KPHB, Hyderabad</p>
    </div>

    <div style="font-size:11px; margin-bottom: 8px;">
      <div><strong>Order No:</strong> #${activeOrder.orderNumber}</div>
      <div><strong>Date:</strong> ${formatDateTime(activeOrder.createdAt)}</div>
      <div><strong>Customer:</strong> ${activeOrder.customerName} (${activeOrder.phone})</div>
      <div><strong>Type:</strong> ${activeOrder.orderType.toUpperCase()}</div>
      ${activeOrder.orderType === 'delivery' ? `<div><strong>Address:</strong> ${activeOrder.deliveryAddress?.address || ''}</div>` : ''}
      ${activeOrder.orderType === 'dine-in' ? `<div><strong>Table No:</strong> ${activeOrder.tableNumber || '1'}</div>` : ''}
    </div>

    <div style="border-top:1px dashed #000; border-bottom:1px dashed #000; padding: 6px 0; margin-bottom: 8px; font-size:11px;">
      ${itemsHtml}
    </div>

    <div style="font-size:11px; margin-bottom: 10px;">
      <div style="display:flex; justify-content:space-between;"><span>Item Subtotal:</span><span>₹${activeOrder.subtotal}</span></div>
      <div style="display:flex; justify-content:space-between;"><span>Packaging:</span><span>₹${activeOrder.packagingFee}</span></div>
      ${activeOrder.deliveryCharge > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Delivery Fee:</span><span>₹${activeOrder.deliveryCharge}</span></div>` : ''}
      ${activeOrder.discount > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Discount:</span><span>-₹${activeOrder.discount}</span></div>` : ''}
      <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px; margin-top:4px; border-top:1px solid #000; padding-top:4px;">
        <span>GRAND TOTAL:</span><span>₹${activeOrder.totalAmount}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:4px;">
        <span>Payment:</span><span>${activeOrder.paymentMethod} (${activeOrder.paymentStatus})</span>
      </div>
    </div>

    <div style="text-align:center; font-size:10px; border-top: 1px dashed #000; padding-top: 6px;">
      <div>Thank you for dining with Subbayya Gari Godavari Bhojanam!</div>
      <div>Ghee Podi • Butta Bhojanam • Pootharekulu</div>
    </div>
  `;

  window.print();
}

document.addEventListener('DOMContentLoaded', () => {
  loadOrderDetails();
  initOwnerSocket(
    null,
    (updated) => {
      if (activeOrder && (updated.orderNumber === activeOrder.orderNumber || updated.orderId === activeOrder._id)) {
        loadOrderDetails();
      }
    }
  );
});
