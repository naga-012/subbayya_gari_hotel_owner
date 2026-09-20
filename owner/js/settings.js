/**
 * SUBBAYYA GARI HOTEL — OWNER SETTINGS CONTROLLER
 */

async function loadSettings() {
  try {
    const res = await authFetch('/api/settings');
    if (res && res.ok) {
      const { data } = await res.json();
      populateSettingsForm(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function populateSettingsForm(s) {
  document.getElementById('sett-name').value = s.restaurantName || '';
  document.getElementById('sett-tagline').value = s.tagline || '';
  document.getElementById('sett-phone').value = s.phone || '';
  document.getElementById('sett-email').value = s.email || '';
  document.getElementById('sett-address').value = s.address || '';
  document.getElementById('sett-open-time').value = s.openingTime || '11:00 AM';
  document.getElementById('sett-close-time').value = s.closingTime || '11:00 PM';
  document.getElementById('sett-is-open').checked = Boolean(s.isOpen);
  document.getElementById('sett-closed-msg').value = s.closedMessage || '';
  document.getElementById('sett-delivery-base').value = s.deliveryFeeBase || 30;
  document.getElementById('sett-delivery-per-km').value = s.deliveryFeePerKm || 10;
  document.getElementById('sett-packaging').value = s.packagingFee || 30;
  document.getElementById('sett-tax').value = s.taxPercent || 5;
  document.getElementById('sett-upi-id').value = s.upiId || '';
  document.getElementById('sett-upi-payee').value = s.upiPayeeName || '';

  updateStoreStatusBadge(s.isOpen);
}

function updateStoreStatusBadge(isOpen) {
  const badge = document.getElementById('store-status-display');
  if (badge) {
    if (isOpen) {
      badge.innerHTML = '🟢 Restaurant is OPEN for Orders';
      badge.style.color = '#10B981';
      badge.style.background = 'rgba(16, 185, 129, 0.15)';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    } else {
      badge.innerHTML = '🔴 Restaurant is CLOSED';
      badge.style.color = '#EF4444';
      badge.style.background = 'rgba(239, 68, 68, 0.15)';
      badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }
  }
}

async function saveSettings(e) {
  e.preventDefault();

  const payload = {
    restaurantName: document.getElementById('sett-name').value.trim(),
    tagline: document.getElementById('sett-tagline').value.trim(),
    phone: document.getElementById('sett-phone').value.trim(),
    email: document.getElementById('sett-email').value.trim(),
    address: document.getElementById('sett-address').value.trim(),
    openingTime: document.getElementById('sett-open-time').value.trim(),
    closingTime: document.getElementById('sett-close-time').value.trim(),
    isOpen: document.getElementById('sett-is-open').checked,
    closedMessage: document.getElementById('sett-closed-msg').value.trim(),
    deliveryFeeBase: Number(document.getElementById('sett-delivery-base').value),
    deliveryFeePerKm: Number(document.getElementById('sett-delivery-per-km').value),
    packagingFee: Number(document.getElementById('sett-packaging').value),
    taxPercent: Number(document.getElementById('sett-tax').value),
    upiId: document.getElementById('sett-upi-id').value.trim(),
    upiPayeeName: document.getElementById('sett-upi-payee').value.trim(),
  };

  try {
    const res = await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (res && res.ok) {
      alert('✅ Restaurant Settings Updated Successfully!');
      loadSettings();
    } else {
      const err = await res.json();
      alert(`Error updating settings: ${err.message}`);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  document.getElementById('settings-form')?.addEventListener('submit', saveSettings);
  document.getElementById('sett-is-open')?.addEventListener('change', (e) => {
    updateStoreStatusBadge(e.target.checked);
  });
});
