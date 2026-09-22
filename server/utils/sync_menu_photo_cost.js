const fs = require('fs');

// ==========================================================================
// 1. UPDATE subbayyagar_hotel/app.js (Customer App)
// ==========================================================================
const customerAppPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/app.js';
let appJs = fs.readFileSync(customerAppPath, 'utf8');

// Replace syncLiveMenuAndSettings with robust dual-backend photo & cost synchronization
const oldSyncMenuStart = 'async function syncLiveMenuAndSettings() {';
const oldSyncMenuEnd = 'window.syncLiveMenuAndSettings = syncLiveMenuAndSettings;';

const newSyncMenuCode = `async function syncLiveMenuAndSettings() {
  try {
    // 1. Fetch live menu from Owner Operations Portal (Render & localhost:5000) and customer backend
    const endpoints = [
      'https://subbayya-gari-hotel.onrender.com/api/menu',
      \`\${BACKEND_BASE}/api/menu\`
    ];
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      endpoints.unshift('http://localhost:5000/api/menu');
    }

    let liveItems = null;
    for (const url of [...new Set(endpoints)]) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json.menu || json.items;
          if (Array.isArray(list) && list.length > 0) {
            liveItems = list;
            break;
          }
        }
      } catch (err) {
        // Continue to next endpoint
      }
    }

    if (Array.isArray(liveItems) && liveItems.length > 0) {
      let hasChanges = false;

      liveItems.forEach(liveItem => {
        const liveId = (liveItem.itemId || liveItem.id || '').toString();
        const liveName = (liveItem.name || '').toLowerCase().trim();
        const liveTelugu = (liveItem.telugu || '').trim();

        // Match locally by id, itemId, english name, or telugu name
        const localItem = MENU_DATA.find(m =>
          (liveId && (m.id === liveId || m.itemId === liveId)) ||
          (liveName && m.name.toLowerCase().trim() === liveName) ||
          (liveTelugu && m.telugu && m.telugu.trim() === liveTelugu)
        );

        if (localItem) {
          const newPrice = Number(liveItem.price);
          const newOrigPrice = liveItem.originalPrice !== undefined && liveItem.originalPrice !== null ? Number(liveItem.originalPrice) : localItem.originalPrice;
          const newImage = liveItem.image || liveItem.photo || liveItem.imageUrl;
          const newStock = liveItem.isAvailable !== undefined ? Boolean(liveItem.isAvailable) : (liveItem.inStock !== undefined ? Boolean(liveItem.inStock) : localItem.inStock);

          // Update Price (Cost)
          if (!isNaN(newPrice) && newPrice > 0 && localItem.price !== newPrice) {
            localItem.price = newPrice;
            hasChanges = true;
          }

          // Update Original / Strikethrough Price
          if (newOrigPrice !== undefined && localItem.originalPrice !== newOrigPrice) {
            localItem.originalPrice = newOrigPrice;
            hasChanges = true;
          }

          // Update Photo / Image
          if (newImage && typeof newImage === 'string' && newImage.trim() && localItem.image !== newImage.trim()) {
            localItem.image = newImage.trim();
            hasChanges = true;
          }

          // Update Stock Availability
          if (newStock !== undefined && localItem.inStock !== newStock) {
            localItem.inStock = newStock;
            hasChanges = true;
          }

          // Update Description if provided
          if (liveItem.description && localItem.description !== liveItem.description) {
            localItem.description = liveItem.description;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        console.log('[Live Menu Sync] Updated menu items (photos & costs) from Owner Portal!');
        renderMenuGrid();
        if (typeof renderRateBoard === 'function') renderRateBoard();
        updateCartBadge();

        // Synchronize active cart items with latest photo and price
        if (Array.isArray(AppState.cart)) {
          AppState.cart.forEach(cartItem => {
            const fresh = MENU_DATA.find(m => m.id === cartItem.id || m.name === cartItem.name);
            if (fresh) {
              cartItem.price = fresh.price;
              if (fresh.image) cartItem.image = fresh.image;
            }
          });
          saveCart();
          updateCartUI();
        }
      }
    }

    // 2. Fetch live settings & announcement banner
    const settingsRes = await fetch(\`\${BACKEND_BASE}/api/settings\`);
    if (settingsRes.ok) {
      const settingsData = await settingsRes.json();
      const settings = settingsData.settings;
      if (settings) {
        const announceTextEl = document.querySelector('.announcement-bar span:nth-child(2)');
        if (announceTextEl && settings.announcementText) {
          announceTextEl.textContent = settings.announcementText;
        }
      }
    }
  } catch (err) {
    // Silent catch
  }
}
window.syncLiveMenuAndSettings = syncLiveMenuAndSettings;`;

const syncStartIdx = appJs.indexOf(oldSyncMenuStart);
const syncEndIdx = appJs.indexOf(oldSyncMenuEnd);

if (syncStartIdx !== -1 && syncEndIdx !== -1) {
  appJs = appJs.substring(0, syncStartIdx) + newSyncMenuCode + appJs.substring(syncEndIdx + oldSyncMenuEnd.length);
  console.log('Successfully updated syncLiveMenuAndSettings in customer app.js');
} else {
  console.log('Could not find syncLiveMenuAndSettings indices in app.js');
}

// Add real-time socket and broadcast listeners for menu updates in app.js
if (!appJs.includes("customerSocket.on('menu_updated'")) {
  const socketMenuHooks = `
      // Real-time menu updates (Photo, Cost, Stock) from Owner Portal
      const handleMenuChange = (payload) => {
        console.log('[Live Sync] Menu update broadcast received:', payload);
        syncLiveMenuAndSettings();
      };
      customerSocket.on('menu_updated', handleMenuChange);
      customerSocket.on('menu_item_updated', handleMenuChange);
      customerSocket.on('menu_item_created', handleMenuChange);
      customerSocket.on('menu_change', handleMenuChange);
      customerSocket.on('menu_refresh', handleMenuChange);
`;
  appJs = appJs.replace("customerSocket.on('order_status_updated', handleOrderUpdate);", socketMenuHooks + "\n      customerSocket.on('order_status_updated', handleOrderUpdate);");
  console.log('Added socket listeners for menu changes in app.js');
}

// Add cross-tab listener for menu changes
if (!appJs.includes("sgh_menu_update_event")) {
  const crossTabMenuListener = `
// Cross-tab instant synchronization for menu changes
window.addEventListener('storage', (e) => {
  if (e.key === 'sgh_menu_update_event') {
    syncLiveMenuAndSettings();
  }
});
if (sghBroadcast) {
  sghBroadcast.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'menu_updated') {
      syncLiveMenuAndSettings();
    }
  });
}
`;
  appJs = appJs + '\n' + crossTabMenuListener;
  console.log('Added cross-tab listener for menu changes in app.js');
}

fs.writeFileSync(customerAppPath, appJs, 'utf8');
console.log('customer app.js saved successfully');

// ==========================================================================
// 2. UPDATE subbayyagar_hotel/api/menu.js (Customer Backend Menu API)
// ==========================================================================
const customerMenuApiPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/api/menu.js';
let menuApi = fs.readFileSync(customerMenuApiPath, 'utf8');

// In updateMenuItemHandler, add support for image, originalPrice, telugu, and dual data/menu response
const oldUpdateHandlerStart = 'updateMenuItemHandler: (req, res) => {';
const oldUpdateHandlerEnd = 'resetMenuHandler: (req, res) => {';

const newUpdateHandlerCode = `updateMenuItemHandler: (req, res) => {
    try {
      const { id, price, originalPrice, inStock, isAvailable, isBestseller, name, description, image, photo, imageUrl } = req.body || {};

      if (!id && !name) {
        return res.status(400).json({ success: false, error: 'Item ID or name is required.' });
      }

      const menu = getMenu();
      const targetId = (id || '').toString();
      const targetName = (name || '').toLowerCase().trim();

      const itemIndex = menu.findIndex(item =>
        (targetId && item.id === targetId) ||
        (targetName && item.name.toLowerCase().trim() === targetName) ||
        (targetId && item.name.toLowerCase().trim() === targetId.toLowerCase().trim())
      );

      if (itemIndex === -1) {
        return res.status(404).json({ success: false, error: \`Item with id \${id || name} not found.\` });
      }

      const item = menu[itemIndex];
      if (price !== undefined && !isNaN(Number(price))) item.price = Number(price);
      if (originalPrice !== undefined && !isNaN(Number(originalPrice))) item.originalPrice = Number(originalPrice);
      if (inStock !== undefined) item.inStock = Boolean(inStock);
      if (isAvailable !== undefined) item.inStock = Boolean(isAvailable);
      if (isBestseller !== undefined) item.isBestseller = Boolean(isBestseller);
      if (name) item.name = name;
      if (description) item.description = description;

      const newImg = image || photo || imageUrl;
      if (newImg && typeof newImg === 'string' && newImg.trim()) {
        item.image = newImg.trim();
      }

      menu[itemIndex] = item;
      saveMenu(menu);

      console.log(\`[Menu Updated by Owner] \${item.name} (\${item.id}): Price=₹\${item.price}, Photo=\${item.image ? item.image.slice(0, 40) + '...' : 'none'}, inStock=\${item.inStock}\`);

      res.json({
        success: true,
        message: \`Updated \${item.name} successfully!\`,
        item,
        data: item
      });
    } catch (err) {
      console.error('Error updating menu item:', err);
      res.status(500).json({ success: false, error: 'Server error updating menu item' });
    }
  },

  `;

const uStartIdx = menuApi.indexOf(oldUpdateHandlerStart);
const uEndIdx = menuApi.indexOf(oldUpdateHandlerEnd);

if (uStartIdx !== -1 && uEndIdx !== -1) {
  menuApi = menuApi.substring(0, uStartIdx) + newUpdateHandlerCode + menuApi.substring(uEndIdx);
  console.log('Successfully updated updateMenuItemHandler in customer api/menu.js');
}

// In getMenuHandler, return both data and menu
menuApi = menuApi.replace(
  "menu\n    });",
  "menu,\n      data: menu\n    });"
);

fs.writeFileSync(customerMenuApiPath, menuApi, 'utf8');
console.log('customer api/menu.js saved successfully');
