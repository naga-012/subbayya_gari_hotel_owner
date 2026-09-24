// Customer Support Tickets Management JavaScript

let ticketsData = [];
let currentFilter = 'All';
let currentSearch = '';
let selectedTicket = null;
let socket = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  if (typeof checkOwnerAuth === 'function') {
    const isAuth = await checkOwnerAuth();
    if (!isAuth) return;
  }

  // Populate sidebar owner profile
  if (typeof updateOwnerProfileUI === 'function') {
    updateOwnerProfileUI();
  }

  // Initialize Socket.IO for real-time ticket alerts
  initTicketSocket();

  // Load Tickets
  loadTickets();

  // Prepare customer site widget snippet
  setupWidgetCodeSnippet();
});

function initTicketSocket() {
  if (typeof io !== 'undefined') {
    socket = io();
    socket.emit('join_owner');

    socket.on('new_support_ticket', (data) => {
      console.log(' New support ticket received via Socket.IO:', data);
      playTicketAlertSound();
      showNotification(`🎧 New Ticket ${data.ticket.ticketId}: ${data.ticket.subject}`);
      loadTickets();
    });

    socket.on('support_ticket_updated', (data) => {
      console.log('Ticket updated:', data);
      loadTickets();
    });
  }
}

function playTicketAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio context fallback ignore
  }
}

function showNotification(msg) {
  const banner = document.createElement('div');
  banner.style.position = 'fixed';
  banner.style.bottom = '20px';
  banner.style.right = '20px';
  banner.style.background = 'linear-gradient(135deg, #d4af37, #aa7c11)';
  banner.style.color = '#0d0a07';
  banner.style.padding = '14px 20px';
  banner.style.borderRadius = '10px';
  banner.style.fontWeight = '700';
  banner.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  banner.style.zIndex = '99999';
  banner.innerText = msg;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

async function loadTickets() {
  const tableBody = document.getElementById('tickets-table-body');
  if (!tableBody) return;

  try {
    let url = `/api/tickets?status=${encodeURIComponent(currentFilter)}`;
    if (currentSearch) {
      url += `&search=${encodeURIComponent(currentSearch)}`;
    }

    const token = localStorage.getItem('ownerToken');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.success) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ef4444; padding:30px;">Error: ${result.message}</td></tr>`;
      return;
    }

    ticketsData = result.data || [];
    updateTicketStats(result.stats);
    renderTicketsTable(ticketsData);
  } catch (err) {
    console.error('Failed loading tickets:', err);
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ef4444; padding:30px;">Failed to connect to server.</td></tr>`;
  }
}

function updateTicketStats(stats) {
  if (!stats) return;
  document.getElementById('stat-open-count').innerText = stats.open || 0;
  document.getElementById('stat-progress-count').innerText = stats.inProgress || 0;
  document.getElementById('stat-resolved-count').innerText = stats.resolved || 0;
  document.getElementById('stat-urgent-count').innerText = stats.urgent || 0;

  document.getElementById('count-all').innerText = stats.total || 0;
  document.getElementById('count-open').innerText = stats.open || 0;
  document.getElementById('count-progress').innerText = stats.inProgress || 0;
  document.getElementById('count-resolved').innerText = stats.resolved || 0;
  document.getElementById('count-closed').innerText = stats.closed || 0;

  // Sidebar badge update
  const sidebarBadge = document.getElementById('sidebar-ticket-badge');
  if (sidebarBadge) {
    if (stats.open > 0) {
      sidebarBadge.innerText = stats.open;
      sidebarBadge.style.display = 'inline-block';
    } else {
      sidebarBadge.style.display = 'none';
    }
  }
}

function renderTicketsTable(tickets) {
  const tableBody = document.getElementById('tickets-table-body');
  if (!tableBody) return;

  if (!tickets || tickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No support tickets found matching criteria.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = tickets.map((t) => {
    const formattedDate = new Date(t.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const statusClass = `status-${(t.status || 'Open').replace(/\s+/g, '-')}`;
    const priorityClass = `prio-${t.priority || 'Medium'}`;

    return `
      <tr>
        <td>
          <strong style="color: #D97706; font-family: monospace; font-size: 0.95rem;">${t.ticketId}</strong>
        </td>
        <td>
          <div style="font-weight: 700; color: #0F172A;">${escapeHtml(t.customerName)}</div>
          <div style="font-size: 0.8rem; color: #D97706; font-weight: 600;">📞 ${escapeHtml(t.phone)}</div>
          ${t.email ? `<div style="font-size: 0.75rem; color: #64748B;">✉️ ${escapeHtml(t.email)}</div>` : ''}
        </td>
        <td>
          <span style="font-size: 0.82rem; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 4px 8px; border-radius: 6px; color: #334155; font-weight: 600;">
            ${escapeHtml(t.category)}
          </span>
        </td>
        <td style="max-width: 250px;">
          <div style="font-weight: 600; color: #0F172A; font-size: 0.9rem; margin-bottom: 2px;">${escapeHtml(t.subject)}</div>
          <div style="font-size: 0.8rem; color: #64748B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(t.message)}
          </div>
        </td>
        <td>
          ${t.orderNumber ? `<a href="orders.html?search=${encodeURIComponent(t.orderNumber)}" style="color: #D97706; font-weight:700; font-size: 0.85rem; text-decoration: underline;">${escapeHtml(t.orderNumber)}</a>` : '<span style="color: #94A3B8; font-size: 0.8rem;">-</span>'}
        </td>
        <td>
          <span class="badge-priority ${priorityClass}">${t.priority || 'Medium'}</span>
        </td>
        <td>
          <span class="badge-status ${statusClass}">${t.status || 'Open'}</span>
        </td>
        <td style="font-size: 0.8rem; color: #64748B; white-space: nowrap;">
          ${formattedDate}
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary" onclick="openTicketDetailsModal('${t.ticketId}')" style="padding: 6px 12px; font-size: 0.8rem;">
            🔍 View / Action
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function setTicketFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadTickets();
}

let searchTimeout = null;
function handleTicketSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = document.getElementById('ticket-search-input').value.trim();
    loadTickets();
  }, 300);
}

function openTicketDetailsModal(ticketId) {
  const ticket = ticketsData.find((t) => t.ticketId === ticketId);
  if (!ticket) return;

  selectedTicket = ticket;

  document.getElementById('modal-ticket-id').innerText = `Ticket ${ticket.ticketId}`;
  
  const statusBadge = document.getElementById('modal-ticket-status-badge');
  const statusClass = `status-${(ticket.status || 'Open').replace(/\s+/g, '-')}`;
  statusBadge.className = `badge-status ${statusClass}`;
  statusBadge.innerText = ticket.status;

  document.getElementById('modal-customer-name').innerText = ticket.customerName;
  document.getElementById('modal-customer-contact').innerText = `${ticket.phone} ${ticket.email ? `• ${ticket.email}` : ''}`;
  document.getElementById('modal-ticket-category').innerText = ticket.category;
  document.getElementById('modal-order-number').innerText = ticket.orderNumber || 'None';
  document.getElementById('modal-ticket-subject').innerText = ticket.subject;
  document.getElementById('modal-ticket-message').innerText = ticket.message;

  document.getElementById('modal-update-status').value = ticket.status || 'Open';
  document.getElementById('modal-update-priority').value = ticket.priority || 'Medium';
  document.getElementById('modal-owner-notes').value = ticket.ownerNotes || '';

  const modal = document.getElementById('ticket-details-modal');
  if (modal) modal.classList.add('show');
}

async function saveTicketChanges() {
  if (!selectedTicket) return;

  const newStatus = document.getElementById('modal-update-status').value;
  const newPriority = document.getElementById('modal-update-priority').value;
  const newOwnerNotes = document.getElementById('modal-owner-notes').value;

  try {
    const token = localStorage.getItem('ownerToken');
    const response = await fetch(`/api/tickets/${selectedTicket.ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: newStatus,
        priority: newPriority,
        ownerNotes: newOwnerNotes,
      }),
    });

    const result = await response.json();
    if (result.success) {
      showNotification(`Ticket ${selectedTicket.ticketId} updated to ${newStatus}`);
      closeModal('ticket-details-modal');
      loadTickets();
    } else {
      alert(`Error updating ticket: ${result.message}`);
    }
  } catch (err) {
    console.error('Save ticket error:', err);
    alert('Failed to update ticket. Check connection.');
  }
}

async function deleteCurrentTicket() {
  if (!selectedTicket) return;
  if (!confirm(`Are you sure you want to permanently delete Ticket ${selectedTicket.ticketId}?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('ownerToken');
    const response = await fetch(`/api/tickets/${selectedTicket.ticketId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (result.success) {
      showNotification(`Ticket ${selectedTicket.ticketId} deleted`);
      closeModal('ticket-details-modal');
      loadTickets();
    } else {
      alert(`Error deleting ticket: ${result.message}`);
    }
  } catch (err) {
    console.error('Delete ticket error:', err);
    alert('Failed to delete ticket');
  }
}

function openRaiseTicketModal() {
  const form = document.getElementById('raise-ticket-form');
  if (form) form.reset();
  const modal = document.getElementById('raise-ticket-modal');
  if (modal) modal.classList.add('show');
}

async function submitNewTicket(e) {
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
      showNotification(` Support Ticket ${result.data.ticketId} Created!`);
      closeModal('raise-ticket-modal');
      loadTickets();
    } else {
      alert(`Failed to create ticket: ${result.message}`);
    }
  } catch (err) {
    console.error('Submit ticket error:', err);
    alert('Error submitting support ticket');
  }
}

function openWidgetCodeModal() {
  const modal = document.getElementById('widget-code-modal');
  if (modal) modal.classList.add('show');
}

function setupWidgetCodeSnippet() {
  const snippetElem = document.getElementById('widget-snippet-text');
  if (!snippetElem) return;

  const origin = window.location.origin;

  const code = `<!-- Subbayya Gari Hotel Customer Support Widget -->
<div id="subbayya-support-widget-root"></div>
<script>
(function() {
  var serverUrl = "${origin}";
  var script = document.createElement("script");
  script.src = serverUrl + "/api/tickets/widget.js";
  script.async = true;
  document.body.appendChild(script);
})();
</script>`;

  snippetElem.value = code;
}

function copyWidgetSnippet() {
  const snippetElem = document.getElementById('widget-snippet-text');
  if (!snippetElem) return;
  snippetElem.select();
  document.execCommand('copy');
  showNotification('📋 Widget code copied to clipboard!');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('show');
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
