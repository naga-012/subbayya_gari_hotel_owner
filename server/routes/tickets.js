const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  deleteTicket,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { ownerOnly } = require('../middleware/owner');

// Public route for Customer Site Support Floating Widget JS Bundle
router.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
(function() {
  if (document.getElementById('subbayya-support-fab')) return;

  var css = \`
    #subbayya-support-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999990;
      background: linear-gradient(135deg, #d4af37 0%, #aa7c11 100%);
      color: #0d0a07;
      border: 2px solid #fcf6ba;
      padding: 14px 22px;
      border-radius: 50px;
      font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #subbayya-support-fab:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 15px 35px rgba(212, 175, 55, 0.4);
    }
    #subbayya-support-modal {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      z-index: 999999;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: 'Outfit', sans-serif;
    }
    #subbayya-support-modal.show {
      display: flex;
    }
    .s-support-box {
      background: #14100c;
      border: 1px solid #d4af37;
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      padding: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
      color: #ffffff;
      box-sizing: border-box;
    }
    .s-support-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(212,175,55,0.2);
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .s-support-header h3 {
      margin: 0;
      color: #d4af37;
      font-family: 'Cinzel', serif;
      font-size: 1.2rem;
    }
    .s-support-close {
      background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;
    }
    .s-field { margin-bottom: 14px; }
    .s-field label { display: block; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 5px; font-weight: 600; }
    .s-field input, .s-field select, .s-field textarea {
      width: 100%;
      background: #1e1812;
      border: 1px solid rgba(212,175,55,0.3);
      color: #fff;
      padding: 10px 12px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .s-submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #d4af37, #aa7c11);
      color: #0d0a07;
      font-weight: 700;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 10px;
    }
  \`;

  var style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);

  var fab = document.createElement('button');
  fab.id = 'subbayya-support-fab';
  fab.innerHTML = '🎧 Customer Support';
  fab.onclick = function() {
    document.getElementById('subbayya-support-modal').classList.add('show');
  };
  document.body.appendChild(fab);

  var modal = document.createElement('div');
  modal.id = 'subbayya-support-modal';
  modal.innerHTML = \`
    <div class="s-support-box">
      <div class="s-support-header">
        <h3>🎧 Subbayya Support</h3>
        <button class="s-support-close" onclick="document.getElementById('subbayya-support-modal').classList.remove('show')">✕</button>
      </div>
      <div id="s-support-content">
        <form id="s-support-form">
          <div class="s-field">
            <label>Your Name *</label>
            <input type="text" id="s-name" required placeholder="Enter your full name" />
          </div>
          <div class="s-field">
            <label>Phone Number *</label>
            <input type="tel" id="s-phone" required placeholder="10-digit mobile number" />
          </div>
          <div class="s-field">
            <label>Issue Category</label>
            <select id="s-category">
              <option value="Order Issue">Order Issue</option>
              <option value="Payment & Refund">Payment & Refund</option>
              <option value="Food Quality">Food Quality</option>
              <option value="Delivery Delay">Delivery Delay</option>
              <option value="General Issue" selected>General Issue</option>
              <option value="Feedback / Request">Feedback / Request</option>
            </select>
          </div>
          <div class="s-field">
            <label>Order Number (Optional)</label>
            <input type="text" id="s-order" placeholder="e.g. ORD-1092" />
          </div>
          <div class="s-field">
            <label>Subject *</label>
            <input type="text" id="s-subject" required placeholder="Brief title of issue" />
          </div>
          <div class="s-field">
            <label>Message / Details *</label>
            <textarea id="s-message" rows="3" required placeholder="Describe what you need help with..."></textarea>
          </div>
          <button type="submit" class="s-submit-btn">Submit Support Ticket</button>
        </form>
      </div>
    </div>
  \`;
  document.body.appendChild(modal);

  document.getElementById('s-support-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = this.querySelector('.s-submit-btn');
    btn.disabled = true;
    btn.innerText = 'Submitting...';

    var data = {
      customerName: document.getElementById('s-name').value.trim(),
      phone: document.getElementById('s-phone').value.trim(),
      category: document.getElementById('s-category').value,
      orderNumber: document.getElementById('s-order').value.trim(),
      subject: document.getElementById('s-subject').value.trim(),
      message: document.getElementById('s-message').value.trim()
    };

    fetch('/api/tickets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(res) { return res.json(); })
    .then(function(res) {
      if (res.success) {
        document.getElementById('s-support-content').innerHTML = \`
          <div style="text-align:center; padding: 20px 10px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
            <h3 style="color:#d4af37; margin:0 0 10px 0;">Ticket Raised Successfully!</h3>
            <p style="color:#e2e8f0; font-size:0.95rem;">Your Ticket Reference ID is:</p>
            <div style="font-size: 1.4rem; font-weight:800; color:#34d399; margin: 10px 0; background:rgba(52,211,153,0.1); padding:10px; border-radius:8px; border: 1px dashed #34d399;">
              \${res.data.ticketId}
            </div>
            <p style="color:#94a3b8; font-size:0.85rem;">Our customer support team has received your ticket and will contact you shortly on \${data.phone}.</p>
            <button onclick="document.getElementById('subbayya-support-modal').classList.remove('show')" style="margin-top:15px; background:#d4af37; color:#0d0a07; font-weight:700; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">Done</button>
          </div>
        \`;
      } else {
        alert('Failed to submit ticket: ' + (res.message || 'Unknown error'));
        btn.disabled = false;
        btn.innerText = 'Submit Support Ticket';
      }
    })
    .catch(function(err) {
      console.error(err);
      alert('Network error submitting support ticket');
      btn.disabled = false;
      btn.innerText = 'Submit Support Ticket';
    });
  });
})();
  `);
});

// Public route to raise a ticket (from Customer Site or Widget)
router.post('/create', createTicket);
router.post('/', createTicket);

// Public route to view a ticket status by customer
router.get('/public/:id', getTicketById);

// Protected routes for Owner Portal
router.get('/', protect, ownerOnly, getTickets);
router.get('/:id', protect, ownerOnly, getTicketById);
router.patch('/:id/status', protect, ownerOnly, updateTicketStatus);
router.delete('/:id', protect, ownerOnly, deleteTicket);

module.exports = router;
