/**
 * SUBBAYYA GARI HOTEL — CUSTOMER MANAGEMENT CONTROLLER
 */

let allCustomers = [];

async function loadCustomers() {
  const searchQuery = document.getElementById('search-customers')?.value.trim() || '';
  const params = new URLSearchParams();
  if (searchQuery) params.append('search', searchQuery);

  try {
    const res = await authFetch(`/api/customers?${params.toString()}`);
    if (res && res.ok) {
      const { data, total } = await res.json();
      allCustomers = data;
      document.getElementById('customers-total-count').textContent = `${total || allCustomers.length} Customers`;
      renderCustomersTable(allCustomers);
    }
  } catch (error) {
    console.error('Error loading customers:', error);
  }
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding: 40px; color: var(--color-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">👥</div>
          <div>No customer profiles found.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customers
    .map((c) => {
      const tierColor = c.tier === 'VIP' ? '#F59E0B' : c.tier === 'Gold' ? '#EAB308' : '#94A3B8';
      const addressText = c.address || 'Hyderabad, Telangana';
      const mapLink = c.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

      return `
      <tr>
        <td>
          <span style="font-weight: 800; color: var(--color-gold); font-size: 0.85rem;">${c.customerId}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--color-text-main);">${c.name}</div>
          ${c.isRegistered ? `<span style="font-size: 0.68rem; color: #10B981; font-weight: 700;">Registered User</span>` : `<span style="font-size: 0.68rem; color: var(--color-text-muted);">Guest Customer</span>`}
        </td>
        <td>${c.phone}</td>
        <td>${c.email}</td>
        <td>
          <div style="font-size: 0.8rem; color: var(--color-text-main); max-width: 220px; line-height: 1.2;">
            📍 ${addressText}
          </div>
          <div style="margin-top: 3px;">
            <a href="${mapLink}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.68rem; color: #60A5FA; background: rgba(59, 130, 246, 0.15); padding: 1px 6px; border-radius: 4px; text-decoration: none; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 700;">
              🗺️ Google Maps ↗
            </a>
          </div>
        </td>
        <td style="text-align: center; font-weight: 800; color: var(--color-gold);">${c.totalOrders}</td>
        <td style="font-weight: 800; color: #10B981;">${formatCurrency(c.totalSpent)}</td>
        <td>
          <div style="font-size: 0.78rem;">${formatDateTime(c.lastOrderDate)}</div>
          ${c.lastOrderNumber ? `<a href="order-details.html?id=${c.lastOrderNumber}" style="font-size:0.72rem; color:var(--color-gold);">Last: #${c.lastOrderNumber}</a>` : ''}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetails('${c.phone}')">
              View Details
            </button>
            <button class="btn btn-primary btn-sm" onclick="openRaiseTicketForCustomer('${escapeHtml(c.name)}', '${escapeHtml(c.phone)}', '${escapeHtml(c.email)}')">
              🎧 Raise Ticket
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

// View Customer Full History in Modal
async function viewCustomerDetails(phone) {
  try {
    const res = await authFetch(`/api/customers/${phone}`);
    if (res && res.ok) {
      const { data } = await res.json();
      renderCustomerModal(data);
    }
  } catch (error) {
    console.error('Error fetching customer profile:', error);
  }
}

function renderCustomerModal(profile) {
  document.getElementById('modal-cust-name').textContent = profile.name;
  document.getElementById('modal-cust-id').textContent = profile.customerId;
  document.getElementById('modal-cust-phone').textContent = profile.phone;
  document.getElementById('modal-cust-email').textContent = profile.email || 'N/A';
  document.getElementById('modal-cust-orders-count').textContent = profile.totalOrders;
  document.getElementById('modal-cust-spent').textContent = formatCurrency(profile.totalSpent);
  document.getElementById('modal-cust-tier').textContent = profile.tier || 'Guest';

  // Customer Location & Address section in Modal
  const addrText = profile.address || (profile.deliveryAddress?.address ? `${profile.deliveryAddress.address}, ${profile.deliveryAddress.city || ''}` : 'Hyderabad, Telangana');
  const fullAddrQuery = profile.deliveryAddress
    ? [profile.deliveryAddress.address, profile.deliveryAddress.landmark, profile.deliveryAddress.city, profile.deliveryAddress.pincode].filter(Boolean).join(', ')
    : addrText;
  const mapUrl = profile.locationUrl || profile.deliveryAddress?.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddrQuery || 'Hyderabad')}`;

  let embedQuery = fullAddrQuery || 'Hyderabad, Telangana';
  if (profile.locationUrl || profile.deliveryAddress?.locationUrl) {
    const rawUrl = profile.locationUrl || profile.deliveryAddress?.locationUrl || '';
    const coordsMatch = rawUrl.match(/q=([-0-9.]+),([-0-9.]+)/) || rawUrl.match(/([-0-9.]+),([-0-9.]+)/);
    if (coordsMatch) {
      embedQuery = `${coordsMatch[1]},${coordsMatch[2]}`;
    }
  }

  const addrEl = document.getElementById('modal-cust-address-text');
  if (addrEl) {
    addrEl.innerHTML = `
      <div style="font-weight: 700; color: #FFF;">📍 ${addrText}</div>
      ${profile.deliveryAddress?.landmark ? `<div style="font-size: 0.78rem; color: var(--color-gold); margin-top: 2px;">🏛️ Landmark: ${profile.deliveryAddress.landmark}</div>` : ''}
    `;
  }

  const mapsBtn = document.getElementById('modal-cust-maps-btn');
  if (mapsBtn) {
    mapsBtn.href = mapUrl;
  }

  const mapIframe = document.getElementById('modal-cust-map-iframe');
  if (mapIframe) {
    mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(embedQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const ordersTbody = document.getElementById('modal-cust-orders-tbody');
  if (profile.orders.length === 0) {
    ordersTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--color-text-muted);">No prior orders</td></tr>`;
  } else {
    ordersTbody.innerHTML = profile.orders
      .map(
        (o) => `
      <tr>
        <td>
          <a href="order-details.html?id=${o.orderNumber}" style="font-weight:800; color:var(--color-gold); text-decoration:none;">
            #${o.orderNumber}
          </a>
        </td>
        <td style="font-size:0.78rem;">${formatDateTime(o.createdAt)}</td>
        <td style="font-size:0.8rem;">${o.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}</td>
        <td style="font-weight:800; color:var(--color-text-main);">${formatCurrency(o.totalAmount)}</td>
        <td><span class="status-badge ${o.orderStatus.replace(/\s+/g, '-')}">${o.orderStatus}</span></td>
      </tr>
    `
      )
      .join('');
  }

  document.getElementById('customer-modal').classList.add('active');
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.remove('active');
}

function openRaiseTicketModal() {
  const form = document.getElementById('raise-ticket-form');
  if (form) form.reset();
  const modal = document.getElementById('raise-ticket-modal');
  if (modal) modal.classList.add('show');
}

function openRaiseTicketForCustomer(name, phone, email) {
  openRaiseTicketModal();
  if (name && name !== 'N/A') document.getElementById('new-cust-name').value = name;
  if (phone && phone !== 'N/A') document.getElementById('new-cust-phone').value = phone;
  if (email && email !== 'N/A') document.getElementById('new-cust-email').value = email;
}

function closeRaiseTicketModal() {
  const modal = document.getElementById('raise-ticket-modal');
  if (modal) modal.classList.remove('show');
}

async function submitNewTicketFromCustomers(e) {
  e.preventDefault();

  const customerName = document.getElementById('new-cust-name').value.trim();
  const phone = document.getElementById('new-cust-phone').value.trim();
  const email = document.getElementById('new-cust-email').value.trim();
  const category = document.getElementById('new-ticket-category').value;
  const orderNumber = document.getElementById('new-ticket-order').value.trim();
  const priority = document.getElementById('new-ticket-priority').value;
  const subject = document.getElementById('new-ticket-subject').value.trim();
  const message = document.getElementById('new-ticket-message').value.trim();

  try {
    const response = await fetch('/api/tickets/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName,
        phone,
        email,
        category,
        orderNumber,
        priority,
        subject,
        message,
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert(` Support Ticket ${result.data.ticketId} Raised Successfully!`);
      closeRaiseTicketModal();
    } else {
      alert(`Failed to create ticket: ${result.message}`);
    }
  } catch (err) {
    console.error('Submit ticket error:', err);
    alert('Error submitting support ticket');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
  document.getElementById('search-customers')?.addEventListener('input', () => {
    clearTimeout(window.searchCustTimeout);
    window.searchCustTimeout = setTimeout(loadCustomers, 300);
  });
});
