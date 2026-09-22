const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('🌾 SUBBAYYA GARI HOTEL — AUTOMATED FULL SYSTEM TEST SUITE 🌾');
  console.log('===============================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Health & Server Status ---');
    const health = await request('GET', '/api/health');
    assert('Health endpoint status 200', health.status === 200, JSON.stringify(health.body));
    assert('Database connected', health.body.database === 'connected', `DB state: ${health.body.database}`);
    assert('Restaurant title matches', health.body.restaurant === 'Subbayya Gari Hotel');

    // 2. Auth - Owner Login
    console.log('\n--- 2. Authentication & Authorization ---');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'myakallanagarjun09@gmail.com',
      password: '123456',
    });
    assert('Owner Login returns 200', loginRes.status === 200, JSON.stringify(loginRes.body));
    const token = loginRes.body.token;
    assert('JWT Token received', !!token);

    // 3. Auth - Get Profile
    const meRes = await request('GET', '/api/auth/me', null, token);
    assert('Protected /api/auth/me returns 200', meRes.status === 200);
    assert('Owner profile verified', meRes.body.user && meRes.body.user.role === 'owner');

    // 4. Menu Items
    console.log('\n--- 3. Menu Management API ---');
    const menuRes = await request('GET', '/api/menu');
    assert('Fetch public menu returns 200', menuRes.status === 200);
    const menuItems = menuRes.body.data || [];
    assert(`Menu items returned (${menuItems.length} items)`, menuItems.length > 0);

    // Create a new test menu item
    const newMenuItem = {
      name: 'Test Butta Bhojanam Special',
      telugu: 'టెస్ట్ బుట్ట భోజనం',
      description: 'Authentic royal traditional Godavari feast',
      category: 'butta',
      price: 349,
      originalPrice: 400,
      isVeg: true,
      isAvailable: true,
      spiceLevel: 'medium',
      preparationTime: '15-20 Mins',
    };
    const createMenuRes = await request('POST', '/api/menu', newMenuItem, token);
    assert('Create Menu Item returns 201', createMenuRes.status === 201);
    const createdItemId = createMenuRes.body.data ? createMenuRes.body.data._id : null;

    if (createdItemId) {
      // Toggle Availability Status
      const toggleRes = await request('PATCH', `/api/menu/${createdItemId}/status`, { isAvailable: false }, token);
      assert('Toggle Menu Item Availability (Out of Stock)', toggleRes.status === 200 && toggleRes.body.data.isAvailable === false);

      // Update Menu Item
      const updateRes = await request('PUT', `/api/menu/${createdItemId}`, { price: 379 }, token);
      assert('Update Menu Item Price', updateRes.status === 200 && updateRes.body.data.price === 379);

      // Soft delete test menu item
      const deleteMenuRes = await request('DELETE', `/api/menu/${createdItemId}`, null, token);
      assert('Deactivate Menu Item (Soft Delete)', deleteMenuRes.status === 200);
    }

    // 5. Orders API
    console.log('\n--- 4. Orders Lifecycle & Real-time Management ---');
    const sampleItem = menuItems[0] || { _id: createdItemId, name: 'Meal', price: 200 };
    const orderPayload = {
      customer: {
        name: 'Automated Tester',
        phone: '9876543210',
        email: 'tester@example.com',
      },
      orderType: 'dine-in',
      tableNumber: 'T-12',
      items: [
        {
          menuItemId: sampleItem._id,
          name: sampleItem.name,
          price: sampleItem.price,
          quantity: 2,
        },
      ],
      paymentMethod: 'UPI',
      notes: 'Automated test order with traditional leaf',
    };

    const createOrderRes = await request('POST', '/api/orders', orderPayload);
    assert('Create Order returns 201', createOrderRes.status === 201);
    const createdOrder = createOrderRes.body.data;
    const orderNumber = createdOrder ? createdOrder.orderNumber : null;
    const orderId = createdOrder ? createdOrder._id : null;

    if (orderNumber) {
      // Public Tracking
      const trackRes = await request('GET', `/api/orders/track/${orderNumber}`);
      assert('Public Track Order by OrderNumber', trackRes.status === 200);
      assert('Tracking details match order', trackRes.body.data && trackRes.body.data.orderNumber === orderNumber);
    }

    if (orderId) {
      // Update Order Status to Preparing
      const statusRes = await request('PATCH', `/api/orders/${orderId}/status`, { orderStatus: 'Preparing' }, token);
      assert('Update Order Status to Preparing', statusRes.status === 200 && statusRes.body.data.orderStatus === 'Preparing');

      // Update Order Status to Ready
      const readyRes = await request('PATCH', `/api/orders/${orderId}/status`, { orderStatus: 'Ready' }, token);
      assert('Update Order Status to Ready', readyRes.status === 200 && readyRes.body.data.orderStatus === 'Ready');

      // Update Order Status to Completed
      const completeRes = await request('PATCH', `/api/orders/${orderId}/status`, { orderStatus: 'Completed' }, token);
      assert('Update Order Status to Completed', completeRes.status === 200 && completeRes.body.data.orderStatus === 'Completed');

      // Update Table Number
      const tableRes = await request('PATCH', `/api/orders/${orderId}/table`, { tableNumber: 'T-15' }, token);
      assert('Update Order Table Number to T-15', tableRes.status === 200 && tableRes.body.data.tableNumber === 'T-15');

      // Update Payment Status
      const paymentRes = await request('PATCH', `/api/orders/${orderId}/payment`, { paymentStatus: 'Paid' }, token);
      assert('Update Payment Status to Paid', paymentRes.status === 200 && paymentRes.body.data.paymentStatus === 'Paid');

      // Fetch Owner Orders List
      const ordersListRes = await request('GET', '/api/orders', null, token);
      assert('Owner Fetch Orders List', ordersListRes.status === 200 && Array.isArray(ordersListRes.body.data));
    }

    // 6. Customers API
    console.log('\n--- 5. Customers Management API ---');
    const customersRes = await request('GET', '/api/customers', null, token);
    assert('Get Customers list returns 200', customersRes.status === 200);
    assert('Customers data contains list and stats', customersRes.body.data !== undefined);

    // 7. Dashboard API
    console.log('\n--- 6. Dashboard Analytics & Reports API ---');
    const statsRes = await request('GET', '/api/dashboard/stats', null, token);
    assert('Get Dashboard KPI Stats returns 200', statsRes.status === 200);

    const revenueRes = await request('GET', '/api/dashboard/revenue', null, token);
    assert('Get Revenue Trend Analytics returns 200', revenueRes.status === 200);

    const topItemsRes = await request('GET', '/api/dashboard/top-items', null, token);
    assert('Get Top Selling Items Analytics returns 200', topItemsRes.status === 200);

    const orderSummaryRes = await request('GET', '/api/dashboard/order-summary', null, token);
    assert('Get Order Summary Analytics returns 200', orderSummaryRes.status === 200);

    // 8. Settings API
    console.log('\n--- 7. Restaurant Settings API ---');
    const settingsRes = await request('GET', '/api/settings', null, token);
    assert('Get Restaurant Settings returns 200', settingsRes.status === 200);
    assert('Settings contains restaurant config', settingsRes.body.data && settingsRes.body.data.restaurantName !== undefined);

    // 9. Static Frontend Pages
    console.log('\n--- 8. Frontend Static Pages Delivery ---');
    const pages = [
      { path: '/', label: 'Root Index Redirect' },
      { path: '/dashboard.html', label: 'Dashboard Page' },
      { path: '/orders.html', label: 'Live Orders Page' },
      { path: '/order-details.html', label: 'Order Details Page' },
      { path: '/menu.html', label: 'Menu Management Page' },
      { path: '/customers.html', label: 'Customers Page' },
      { path: '/reports.html', label: 'Reports & Analytics Page' },
      { path: '/settings.html', label: 'Settings Page' },
      { path: '/login.html', label: 'Owner Login Page' },
    ];
    for (const page of pages) {
      const pageRes = await request('GET', page.path);
      assert(`Frontend page loads: ${page.label} (${page.path})`, pageRes.status === 200);
    }

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
