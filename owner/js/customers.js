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
        <td colspan="8" style="text-align:center; padding: 40px; color: var(--color-text-muted);">
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

      return `
      <tr>
        <td>
          <span style="font-weight: 800; color: var(--color-gold); font-size: 0.85rem;">${c.customerId}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--color-text-main);">${c.name}</div>
          ${c.isRegistered ? `<span style="font-size: 0.68rem; color: #10B981; font-weight: 700;">Registered User</span>` : `<span style="font-size: 0.68rem; color: var(--color-text-muted);">Guest Guest</span>`}
        </td>
        <td>${c.phone}</td>
        <td>${c.email}</td>
        <td style="text-align: center; font-weight: 800; color: var(--color-gold);">${c.totalOrders}</td>
        <td style="font-weight: 800; color: #10B981;">${formatCurrency(c.totalSpent)}</td>
        <td>
          <div style="font-size: 0.78rem;">${formatDateTime(c.lastOrderDate)}</div>
          ${c.lastOrderNumber ? `<a href="order-details.html?id=${c.lastOrderNumber}" style="font-size:0.72rem; color:var(--color-gold);">Last: #${c.lastOrderNumber}</a>` : ''}
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetails('${c.phone}')">
            View History
          </button>
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

document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
  document.getElementById('search-customers')?.addEventListener('input', () => {
    clearTimeout(window.searchCustTimeout);
    window.searchCustTimeout = setTimeout(loadCustomers, 300);
  });
});
