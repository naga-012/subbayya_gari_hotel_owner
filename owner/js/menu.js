/**
 * SUBBAYYA GARI HOTEL — OWNER MENU MANAGEMENT CONTROLLER
 */

let allMenuItems = [];
let currentCategory = 'all';

async function loadMenu() {
  try {
    const res = await authFetch('/api/menu?all=true');
    if (res && res.ok) {
      const { data } = await res.json();
      allMenuItems = data;
      renderMenu();
    }
  } catch (error) {
    console.error('Error loading menu:', error);
  }
}

function renderMenu() {
  const searchQuery = document.getElementById('search-menu')?.value.toLowerCase().trim() || '';
  const vegOnly = document.getElementById('filter-veg-only')?.checked;
  const container = document.getElementById('menu-grid');
  if (!container) return;

  let filtered = allMenuItems;

  if (currentCategory !== 'all') {
    filtered = filtered.filter((i) => i.category === currentCategory);
  }

  if (searchQuery) {
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(searchQuery) ||
        (i.telugu && i.telugu.toLowerCase().includes(searchQuery)) ||
        (i.description && i.description.toLowerCase().includes(searchQuery))
    );
  }

  if (vegOnly) {
    filtered = filtered.filter((i) => i.isVeg);
  }

  document.getElementById('menu-items-count').textContent = `${filtered.length} Items`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">🍛</div>
        <div>No menu items found for the selected category or search.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map(
      (item) => `
    <div class="card" style="padding: 16px; position: relative; opacity: ${item.isActive ? '1' : '0.5'};">
      <div style="position: relative; border-radius: 10px; overflow: hidden; height: 160px; margin-bottom: 12px;">
        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
        
        <div style="position: absolute; top: 8px; left: 8px; display: flex; gap: 4px;">
          ${item.isBestseller ? `<span style="background: var(--color-gold); color: #0F172A; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">BESTSELLER</span>` : ''}
          ${item.isSpecial ? `<span style="background: var(--color-primary); color: #FFF; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">SPECIAL</span>` : ''}
        </div>

        <div style="position: absolute; top: 8px; right: 8px;">
          <span style="background: ${item.isVeg ? '#10B981' : '#EF4444'}; color: #FFF; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
            ${item.isVeg ? '🟢 VEG' : '🔴 NON-VEG'}
          </span>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: 1rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 2px;">${item.name}</h3>
            ${item.telugu ? `<div style="font-size: 0.78rem; color: var(--color-gold);">${item.telugu}</div>` : ''}
          </div>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-gold);">${formatCurrency(item.price)}</div>
        </div>

        <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 8px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${item.description || 'Authentic Godavari preparation.'}
        </p>

        <div style="font-size: 0.72rem; color: var(--color-text-sub); margin-bottom: 12px;">
          ⏱️ Prep: ${item.preparationTime || '15-20 Mins'} • 🌶️ ${item.spiceLevel || 'Medium'}
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--color-card-border);">
          <!-- Stock Toggle -->
          <label class="switch-label" title="Toggle Stock Availability" style="font-size: 0.78rem;">
            <label class="switch">
              <input type="checkbox" ${item.isAvailable ? 'checked' : ''} onchange="toggleStock('${item._id}', this.checked)">
              <span class="slider"></span>
            </label>
            <span style="color: ${item.isAvailable ? '#10B981' : '#EF4444'}; font-weight: 700;">
              ${item.isAvailable ? 'In Stock' : 'Out of Stock'}
            </span>
          </label>

          <!-- Edit & Delete Buttons -->
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="openEditModal('${item._id}')" title="Edit Item">
              ✏️
            </button>
            <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3);" onclick="deleteItem('${item._id}', '${item.name}')" title="Deactivate Item">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

// Filter Category
function setCategory(category, btnEl) {
  currentCategory = category;
  document.querySelectorAll('.cat-pill').forEach((btn) => btn.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderMenu();
}

// Toggle In-Stock / Out-of-Stock
async function toggleStock(itemId, isAvailable) {
  try {
    const res = await authFetch(`/api/menu/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    });

    if (res && res.ok) {
      // Update local state
      const item = allMenuItems.find((i) => i._id === itemId);
      if (item) item.isAvailable = isAvailable;
      renderMenu();
    } else {
      alert('Failed to update stock status');
      loadMenu();
    }
  } catch (error) {
    console.error('Error toggling stock:', error);
  }
}

// Open Add Modal
function openAddModal() {
  document.getElementById('menu-form').reset();
  document.getElementById('menu-item-id').value = '';
  document.getElementById('modal-menu-title').textContent = 'Add New Menu Item';
  document.getElementById('item-image').value = 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80';
  document.getElementById('menu-modal').classList.add('active');
}

// Open Edit Modal
function openEditModal(itemId) {
  const item = allMenuItems.find((i) => i._id === itemId);
  if (!item) return;

  document.getElementById('menu-item-id').value = item._id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-telugu').value = item.telugu || '';
  document.getElementById('item-category').value = item.category;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-original-price').value = item.originalPrice || '';
  document.getElementById('item-image').value = item.image;
  document.getElementById('item-preptime').value = item.preparationTime || '15-20 Mins';
  document.getElementById('item-spice').value = item.spiceLevel || 'medium';
  document.getElementById('item-is-veg').checked = Boolean(item.isVeg);
  document.getElementById('item-is-bestseller').checked = Boolean(item.isBestseller);
  document.getElementById('item-is-special').checked = Boolean(item.isSpecial);
  document.getElementById('item-description').value = item.description || '';

  document.getElementById('modal-menu-title').textContent = `Edit Item: ${item.name}`;
  document.getElementById('menu-modal').classList.add('active');
}

function closeMenuModal() {
  document.getElementById('menu-modal').classList.remove('active');
}

// Save Item (Create or Update)
async function saveMenuItem(e) {
  e.preventDefault();
  const id = document.getElementById('menu-item-id').value;

  const payload = {
    name: document.getElementById('item-name').value.trim(),
    telugu: document.getElementById('item-telugu').value.trim(),
    category: document.getElementById('item-category').value,
    price: Number(document.getElementById('item-price').value),
    originalPrice: document.getElementById('item-original-price').value ? Number(document.getElementById('item-original-price').value) : null,
    image: document.getElementById('item-image').value.trim(),
    preparationTime: document.getElementById('item-preptime').value.trim(),
    spiceLevel: document.getElementById('item-spice').value,
    isVeg: document.getElementById('item-is-veg').checked,
    isBestseller: document.getElementById('item-is-bestseller').checked,
    isSpecial: document.getElementById('item-is-special').checked,
    description: document.getElementById('item-description').value.trim(),
  };

  try {
    const url = id ? `/api/menu/${id}` : '/api/menu';
    const method = id ? 'PUT' : 'POST';

    const res = await authFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (res && res.ok) {
      closeMenuModal();
      loadMenu();
      alert(`Item "${payload.name}" saved successfully!`);
    } else {
      const err = await res.json();
      alert(`Error saving item: ${err.message}`);
    }
  } catch (error) {
    console.error('Error saving menu item:', error);
  }
}

// Deactivate / Soft Delete
async function deleteItem(itemId, name) {
  if (!confirm(`Are you sure you want to deactivate "${name}"? It will no longer be visible to customers, but previous orders will remain intact.`)) {
    return;
  }

  try {
    const res = await authFetch(`/api/menu/${itemId}`, { method: 'DELETE' });
    if (res && res.ok) {
      loadMenu();
    } else {
      const err = await res.json();
      alert(`Error: ${err.message}`);
    }
  } catch (error) {
    console.error('Error deleting item:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  document.getElementById('search-menu')?.addEventListener('input', renderMenu);
  document.getElementById('filter-veg-only')?.addEventListener('change', renderMenu);
  document.getElementById('menu-form')?.addEventListener('submit', saveMenuItem);
});
