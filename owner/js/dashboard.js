/**
 * SUBBAYYA GARI HOTEL — OWNER DASHBOARD CONTROLLER
 */

let revenueChart = null;
let topItemsChart = null;

async function loadDashboardData() {
  try {
    // Fetch all dashboard components concurrently in parallel for 4x faster loading
    const [statsResult, revenueResult, topResult, ordersResult] = await Promise.allSettled([
      authFetch('/api/dashboard/stats'),
      authFetch('/api/dashboard/revenue?days=7'),
      authFetch('/api/dashboard/top-items?limit=5'),
      authFetch('/api/orders?limit=8'),
    ]);

    // 1. Process Stats
    if (statsResult.status === 'fulfilled' && statsResult.value && statsResult.value.ok) {
      const { data } = await statsResult.value.json();
      if (data) {
        document.getElementById('stat-today-orders').textContent = data.todayOrders || 0;
        document.getElementById('stat-today-revenue').textContent = formatCurrency(data.todayRevenue || 0);
        document.getElementById('stat-pending-orders').textContent = data.pendingOrders || 0;
        document.getElementById('stat-preparing-orders').textContent = data.preparingOrders || 0;
        document.getElementById('stat-ready-orders').textContent = data.readyOrders || 0;
        document.getElementById('stat-completed-orders').textContent = data.completedOrders || 0;
        document.getElementById('stat-cancelled-orders').textContent = data.cancelledOrders || 0;
        document.getElementById('stat-total-customers').textContent = data.totalCustomers || 0;

        // Pending badge in sidebar
        const pendingBadge = document.getElementById('sidebar-pending-badge');
        if (pendingBadge) {
          if (data.pendingOrders > 0) {
            pendingBadge.style.display = 'inline-block';
            pendingBadge.textContent = data.pendingOrders;
          } else {
            pendingBadge.style.display = 'none';
          }
        }
      }
    }

    // 2. Process Revenue Chart Data
    if (revenueResult.status === 'fulfilled' && revenueResult.value && revenueResult.value.ok) {
      const { data } = await revenueResult.value.json();
      if (data) renderRevenueChart(data);
    }

    // 3. Process Top Items Data
    if (topResult.status === 'fulfilled' && topResult.value && topResult.value.ok) {
      const { data } = await topResult.value.json();
      if (data) renderTopItems(data);
    }

    // 4. Process Recent Orders & Channel Counts
    if (ordersResult.status === 'fulfilled' && ordersResult.value && ordersResult.value.ok) {
      const { data, typeCounts } = await ordersResult.value.json();
      renderRecentOrdersTable(data || []);

      // Synchronize loud continuous sound alarm for any pending orders
      if (typeof syncPendingOrdersAlarm === 'function') {
        syncPendingOrdersAlarm(data || []);
      }

      if (typeCounts) {
        const dineInEl = document.getElementById('dash-dinein-count');
        const deliveryEl = document.getElementById('dash-delivery-count');
        const takeawayEl = document.getElementById('dash-takeaway-count');

        if (dineInEl) dineInEl.textContent = typeCounts.dineIn ?? 0;
        if (deliveryEl) deliveryEl.textContent = typeCounts.delivery ?? 0;
        if (takeawayEl) takeawayEl.textContent = typeCounts.takeaway ?? 0;
      }
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// Render Daily Revenue Trend Chart
function renderRevenueChart(timeline) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const labels = timeline.map((t) => t.label);
  const revenues = timeline.map((t) => t.revenue);
  const orders = timeline.map((t) => t.orders);

  if (revenueChart) {
    revenueChart.destroy();
  }

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue (₹)',
          data: revenues,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#F59E0B',
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#64748B', font: { family: "'Plus Jakarta Sans', sans-serif" } },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` Revenue: ₹${context.raw.toLocaleString('en-IN')}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { color: '#64748B' },
        },
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            color: '#64748B',
            callback: function (value) {
              return '₹' + value;
            },
          },
        },
      },
    },
  });
}

// Render Top Selling Items List
function renderTopItems(items) {
  const container = document.getElementById('top-items-list');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--color-text-muted);">No orders recorded yet</div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-card-border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-weight: 800; font-size: 0.9rem; color: var(--color-gold); width: 20px;">#${idx + 1}</span>
          <img src="${item.image || 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=100&q=80'}" 
               style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" alt="${item.name}">
          <div>
            <div style="font-weight: 700; font-size: 0.88rem; color: var(--color-text-main);">${item.name}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">${item.category.toUpperCase()} • ${item.ordersCount} portions sold</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; color: #10B981; font-size: 0.9rem;">${formatCurrency(item.revenue)}</div>
        </div>
      </div>
    `
    )
    .join('');
}

// Render Recent Orders Table
function renderRecentOrdersTable(orders) {
  const tbody = document.getElementById('recent-orders-tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--color-text-muted);">No recent orders placed today</td></tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const statusClass = order.orderStatus.replace(/\s+/g, '-');
      const itemsList = order.items.map((i) => `${i.name} (×${i.quantity})`).join(', ');

      return `
      <tr>
        <td>
          <a href="order-details.html?id=${order.orderNumber}" style="font-weight: 800; color: var(--color-gold); text-decoration: none;">
            #${order.orderNumber}
          </a>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--color-text-main);">${order.customerName}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${order.phone}</div>
        </td>
        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsList}">
          ${itemsList}
        </td>
        <td>
          <span style="font-size: 0.8rem; font-weight: 600; text-transform: capitalize;">
            ${(order.orderType === 'dine-in' || order.orderType === 'table-booking') ? `🍽️ Table Booking (${order.guestsCount || 1} Guests)` : (order.orderType === 'delivery' ? '🛵 Delivery' : '🥡 Takeaway')}
          </span>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${order.orderStatus}</span>
        </td>
        <td style="font-weight: 800; color: var(--color-text-main);">
          ${formatCurrency(order.totalAmount)}
        </td>
        <td>
          <a href="order-details.html?id=${order.orderNumber}" class="btn btn-secondary btn-sm">
            View Order
          </a>
        </td>
      </tr>
    `;
    })
    .join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  initOwnerSocket(
    () => loadDashboardData(), // On new order
    () => loadDashboardData()  // On status update
  );

  // Fallback periodic polling every 8 seconds
  setInterval(() => {
    loadDashboardData();
  }, 8000);
});
