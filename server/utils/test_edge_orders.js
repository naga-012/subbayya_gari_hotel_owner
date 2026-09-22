const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 5000;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runEdgeTests() {
  console.log('===========================================================');
  console.log('🧪 TESTING CUSTOMER ORDER RECEPTION & OWNER NOTIFICATIONS 🧪');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} — ${details}`);
      failed++;
    }
  }

  try {
    // 1. Owner Login
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'myakallanagarjun09@gmail.com',
      password: 'Subbayya@1950',
      role: 'owner',
    });
    let ownerToken = loginRes.data?.token;
    if (!ownerToken) {
      const fallbackLogin = await request('POST', '/api/auth/login', {
        email: 'owner@subbayya.com',
        password: 'Subbayya@1950',
        role: 'owner',
      });
      ownerToken = fallbackLogin.data?.token;
    }
    assert(Boolean(ownerToken), '1. Owner authenticated successfully');

    // 2. Customer places Delivery Order with 'COD' payment method
    const deliveryOrder = {
      name: 'Priya Sharma',
      mobile: '9876500001',
      email: 'priya.sharma@test.com',
      type: 'delivery',
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      address: {
        street: 'Plot 45, Jubilee Hills Rd 36',
        landmark: 'Opposite Park Hyatt',
        city: 'Hyderabad',
        zip: '500033',
        distanceKm: 4,
      },
      cart: [
        { name: 'Kakinada Kaja', price: 180, qty: 2 },
        { name: 'Pulihora', price: 150, qty: 1 },
      ],
    };

    const resDel = await request('POST', '/api/orders', deliveryOrder);
    assert(
      resDel.status === 201 && resDel.data?.success && resDel.data?.data?.orderNumber,
      `2. Delivery Order created #${resDel.data?.data?.orderNumber} with COD payment and custom fields (Total: ₹${resDel.data?.data?.totalAmount})`
    );
    const delOrderNum = resDel.data?.data?.orderNumber;

    // 3. Customer places Table Booking / Dine-In order
    const tableOrder = {
      customerName: 'Anil Reddy',
      phone: '9876500002',
      orderType: 'dine-in',
      paymentMethod: 'Pay at Hotel',
      guestsCount: 4,
      reservationDate: '2026-09-22',
      reservationTime: '01:30 PM',
      seatingPreference: 'Traditional Banana Leaf Seating',
      items: [
        { name: 'Subbayya Gari Special Butta Bhojanam', price: 350, quantity: 4 },
      ],
    };

    const resTable = await request('POST', '/api/orders', tableOrder);
    assert(
      resTable.status === 201 && resTable.data?.success && resTable.data?.data?.orderNumber,
      `3. Table Booking created #${resTable.data?.data?.orderNumber} for 4 Guests (Total: ₹${resTable.data?.data?.totalAmount})`
    );
    const tableOrderNum = resTable.data?.data?.orderNumber;

    // 4. Customer places Takeaway order with online UPI
    const takeawayOrder = {
      customerName: 'Suresh Babu',
      phone: '9876500003',
      orderType: 'takeaway',
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      pickupSlot: '20 Mins',
      items: [
        { name: 'Avakaya Biryani', price: 260, quantity: 2 },
      ],
    };

    const resTake = await request('POST', '/api/orders', takeawayOrder);
    assert(
      resTake.status === 201 && resTake.data?.success && resTake.data?.data?.orderNumber,
      `4. Takeaway Order created #${resTake.data?.data?.orderNumber} paid via UPI (Total: ₹${resTake.data?.data?.totalAmount})`
    );
    const takeOrderNum = resTake.data?.data?.orderNumber;

    // 5. Owner retrieves orders list - verify all 3 new orders are present
    const ownerOrders = await request('GET', '/api/orders', null, ownerToken);
    const list = ownerOrders.data?.data || [];
    const foundDel = list.some((o) => o.orderNumber === delOrderNum);
    const foundTable = list.some((o) => o.orderNumber === tableOrderNum);
    const foundTake = list.some((o) => o.orderNumber === takeOrderNum);

    assert(
      foundDel && foundTable && foundTake,
      `5. Owner orders queue verified: received Delivery (#${delOrderNum}), Table Booking (#${tableOrderNum}), Takeaway (#${takeOrderNum})`
    );

    // 6. Owner updates status for delivery order (Pending -> Accepted -> Out for Delivery)
    const acceptRes = await request('PATCH', `/api/orders/${delOrderNum}/status`, { orderStatus: 'Accepted' }, ownerToken);
    assert(acceptRes.status === 200 && acceptRes.data?.data?.orderStatus === 'Accepted', `6. Owner Accepted Delivery Order #${delOrderNum}`);

    const dispatchRes = await request('PATCH', `/api/orders/${delOrderNum}/status`, { orderStatus: 'Out for Delivery' }, ownerToken);
    assert(dispatchRes.status === 200 && dispatchRes.data?.data?.orderStatus === 'Out for Delivery', `7. Owner Dispatched Delivery Order #${delOrderNum}`);

    // 7. Customer tracks status
    const trackRes = await request('GET', `/api/orders/track/${delOrderNum}`);
    assert(
      trackRes.status === 200 && trackRes.data?.data?.orderStatus === 'Out for Delivery',
      `8. Customer live tracking verified: status is "Out for Delivery"`
    );

    // 8. Owner allocates table to Dine-in order
    const tableAllocRes = await request('PATCH', `/api/orders/${tableOrderNum}/table`, { tableNumber: '7' }, ownerToken);
    assert(
      tableAllocRes.status === 200 && tableAllocRes.data?.data?.tableNumber === '7',
      `9. Owner assigned Table #7 to Dine-in Order #${tableOrderNum}`
    );

    // 9. Dashboard statistics dynamically update
    const statsRes = await request('GET', '/api/dashboard/stats', null, ownerToken);
    assert(
      statsRes.status === 200 && statsRes.data?.data?.todayOrders >= 3,
      `10. Dashboard stats dynamically updated: Today's Orders = ${statsRes.data?.data?.todayOrders}, Total Revenue = ₹${statsRes.data?.data?.todayRevenue}`
    );

    console.log('\n===========================================================');
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED / ${failed} FAILED`);
    console.log('===========================================================');
  } catch (error) {
    console.error('Edge Test Error:', error);
  }
}

runEdgeTests();
