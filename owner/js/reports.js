/**
 * SUBBAYYA GARI HOTEL — OWNER REPORTS & ANALYTICS CONTROLLER
 */

let reportsChart = null;

async function loadReports() {
  const days = document.getElementById('report-range')?.value || '7';

  try {
    // 1. Fetch Revenue Timeline
    const revRes = await authFetch(`/api/dashboard/revenue?days=${days}`);
    if (revRes && revRes.ok) {
      const { data } = await revRes.json();
      renderReportsChart(data);
      calculateReportMetrics(data);
    }

    // 2. Fetch Top Items
    const topRes = await authFetch('/api/dashboard/top-items?limit=10');
    if (topRes && topRes.ok) {
      const { data } = await topRes.json();
      renderReportsTopItems(data);
    }

    // 3. Fetch Order Breakdown Summary
    const sumRes = await authFetch('/api/dashboard/order-summary');
    if (sumRes && sumRes.ok) {
      const { data } = await sumRes.json();
      renderOrderBreakdown(data);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

function calculateReportMetrics(timeline) {
  const totalRev = timeline.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = timeline.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderVal = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;

  document.getElementById('rep-total-revenue').textContent = formatCurrency(totalRev);
  document.getElementById('rep-total-orders').textContent = totalOrders;
  document.getElementById('rep-avg-order-value').textContent = formatCurrency(avgOrderVal);
}

function renderReportsChart(timeline) {
  const ctx = document.getElementById('reportsChart');
  if (!ctx) return;

  const labels = timeline.map((t) => t.label);
  const revenues = timeline.map((t) => t.revenue);
  const orders = timeline.map((t) => t.orders);

  if (reportsChart) {
    reportsChart.destroy();
  }

  reportsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue (₹)',
          data: revenues,
          backgroundColor: 'rgba(217, 119, 6, 0.8)',
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Orders Count',
          data: orders,
          type: 'line',
          borderColor: '#10B981',
          borderWidth: 3,
          tension: 0.3,
          pointBackgroundColor: '#10B981',
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94A3B8', font: { family: "'Plus Jakarta Sans', sans-serif" } },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8' },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94A3B8',
            callback: (v) => '₹' + v,
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#10B981', stepSize: 1 },
        },
      },
    },
  });
}

function renderReportsTopItems(items) {
  const tbody = document.getElementById('report-top-items-tbody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--color-text-muted);">No sales data available</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map(
      (item, idx) => `
    <tr>
      <td style="font-weight: 800; color: var(--color-gold);">#${idx + 1}</td>
      <td>
        <div style="font-weight: 700; color: var(--color-text-main);">${item.name}</div>
      </td>
      <td style="text-transform: uppercase; font-size: 0.75rem; color: var(--color-text-muted);">${item.category}</td>
      <td style="text-align: center; font-weight: 800; color: var(--color-gold);">${item.ordersCount} portions</td>
      <td style="text-align: right; font-weight: 800; color: #10B981;">${formatCurrency(item.revenue)}</td>
    </tr>
  `
    )
    .join('');
}

function renderOrderBreakdown(summary) {
  const typeContainer = document.getElementById('report-by-type');
  if (typeContainer && summary.byType) {
    typeContainer.innerHTML = summary.byType
      .map(
        (t) => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-card-border); font-size: 0.88rem;">
        <span style="text-transform: capitalize; font-weight: 600;">${t._id === 'delivery' ? '🛵 Delivery' : t._id === 'dine-in' ? '🍽️ Dine-In' : '🥡 Takeaway'}</span>
        <span><strong>${t.count} orders</strong> (${formatCurrency(t.total)})</span>
      </div>
    `
      )
      .join('');
  }

  const payContainer = document.getElementById('report-by-payment');
  if (payContainer && summary.byPayment) {
    payContainer.innerHTML = summary.byPayment
      .map(
        (p) => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-card-border); font-size: 0.88rem;">
        <span style="font-weight: 600;">💳 ${p._id || 'UPI'}</span>
        <span><strong>${p.count} orders</strong> (${formatCurrency(p.total)})</span>
      </div>
    `
      )
      .join('');
  }
}

// Print Report
function printReport() {
  window.print();
}

document.addEventListener('DOMContentLoaded', () => {
  loadReports();
  document.getElementById('report-range')?.addEventListener('change', loadReports);
});
