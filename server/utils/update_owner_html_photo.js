const fs = require('fs');
const ownerHtmlPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/owner.html';
let content = fs.readFileSync(ownerHtmlPath, 'utf8');

// Update row HTML in loadMenuData to show item image thumbnail and edit photo button
const oldRow = `          <tr id="menu-row-\${item.id}">
            <td>
              <div style="font-weight: 700; color: white;">\${item.name}</div>
              <div style="font-size: 0.78rem; color: var(--owner-gold);">\${item.telugu || ''}</div>
            </td>`;

const newRow = `          <tr id="menu-row-\${item.id}">
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <img id="img-thumb-\${item.id}" src="\${item.image || 'assets/butta_bhojanam.jpg'}" alt="\${item.name}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; flex-shrink: 0;" onclick="changeItemPhoto('\${item.id}')" title="Click to change photo" />
                <div>
                  <div style="font-weight: 700; color: white;">\${item.name}</div>
                  <div style="font-size: 0.78rem; color: var(--owner-gold);">\${item.telugu || ''}</div>
                  <button type="button" onclick="changeItemPhoto('\${item.id}')" style="background: none; border: none; color: var(--owner-gold); font-size: 0.7rem; cursor: pointer; padding: 0; text-decoration: underline;">📷 Change Photo</button>
                </div>
              </div>
            </td>`;

if (content.includes(oldRow)) {
  content = content.replace(oldRow, newRow);
  console.log('Updated menu table row with photo preview in owner.html');
}

// Add changeItemPhoto and enhance saveItemPrice
const oldSaveFunc = `    async function saveItemPrice(itemId) {
      const priceInput = document.getElementById(\`price-\${itemId}\`);
      const newPrice = Number(priceInput.value);
      if (!newPrice || isNaN(newPrice)) {
        showToast('⚠️ Please enter a valid price');
        return;
      }

      try {
        const res = await fetch(\`\${BACKEND_BASE}/api/menu/update\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId, price: newPrice })
        });
        const data = await res.json();
        if (data.success) {
          showToast(\`🎉 Updated price for \${data.item.name} to ₹\${newPrice}!\`);
        }
      } catch (err) {
        showToast(\`⚠️ Error saving price: \${err.message}\`);
      }
    }`;

const newSaveFunc = `    async function saveItemPrice(itemId) {
      const priceInput = document.getElementById(\`price-\${itemId}\`);
      const newPrice = Number(priceInput.value);
      if (!newPrice || isNaN(newPrice)) {
        showToast('⚠️ Please enter a valid price');
        return;
      }

      const item = activeMenu.find(m => m.id === itemId);
      const payload = { id: itemId, price: newPrice };
      if (item && item.name) payload.name = item.name;

      const endpoints = [
        \`\${BACKEND_BASE}/api/menu/update\`,
        'https://subbayya-gari-hotel.onrender.com/api/menu/update'
      ];
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        endpoints.push('http://localhost:5000/api/menu/update');
      }

      [...new Set(endpoints)].forEach(url => {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      });

      // Broadcast to any open customer tabs immediately
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('sgh_order_channel');
        bc.postMessage({ type: 'menu_updated', timestamp: Date.now() });
      }
      localStorage.setItem('sgh_menu_update_event', JSON.stringify({ type: 'menu_updated', timestamp: Date.now() }));

      showToast(\`🎉 Updated price for \${item?.name || itemId} to ₹\${newPrice}!\`);
    }

    async function changeItemPhoto(itemId) {
      const item = activeMenu.find(m => m.id === itemId);
      const currentUrl = item?.image || '';
      const newUrl = prompt(\`Enter new image/photo URL for "\${item?.name || itemId}":\`, currentUrl);
      if (!newUrl || newUrl.trim() === currentUrl) return;

      const payload = { id: itemId, image: newUrl.trim() };
      if (item && item.name) payload.name = item.name;

      const endpoints = [
        \`\${BACKEND_BASE}/api/menu/update\`,
        'https://subbayya-gari-hotel.onrender.com/api/menu/update'
      ];
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        endpoints.push('http://localhost:5000/api/menu/update');
      }

      [...new Set(endpoints)].forEach(url => {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      });

      if (item) item.image = newUrl.trim();
      const imgEl = document.getElementById(\`img-thumb-\${itemId}\`);
      if (imgEl) imgEl.src = newUrl.trim();

      // Broadcast to any open customer tabs immediately
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('sgh_order_channel');
        bc.postMessage({ type: 'menu_updated', timestamp: Date.now() });
      }
      localStorage.setItem('sgh_menu_update_event', JSON.stringify({ type: 'menu_updated', timestamp: Date.now() }));

      showToast(\`📸 Updated photo for \${item?.name || itemId}!\`);
    }`;

if (content.includes(oldSaveFunc)) {
  content = content.replace(oldSaveFunc, newSaveFunc);
  console.log('Updated saveItemPrice and added changeItemPhoto in owner.html');
}

fs.writeFileSync(ownerHtmlPath, content, 'utf8');
console.log('owner.html saved successfully');
