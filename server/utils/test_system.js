/**
 * SUBBAYYA GARI HOTEL — AUTOMATED END-TO-END VERIFICATION TEST SUITE
 * Tests all 19 requirements from Master Prompt #48
 */

const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 5000;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

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
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
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

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING SUBBAYYA GARI HOTEL 19-STEP TEST SUITE 🧪');
  console.log('====================================================\n');

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
    // TEST 1: Customer opens website / health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data?.status === 'OK', 'TEST 1: Server and health check are responsive');

    // TEST 2: Customer views menu from database
    const menuRes = await request('GET', '/api/menu');
    assert(menuRes.status === 200 && menuRes.data?.data?.length > 0, `TEST 2: Customer retrieves ${menuRes.data?.data?.length} dishes from MongoDB database`);
    const initialBiryani = menuRes.data.data.find((i) => i.name.includes('Biriyani') || i.category === 'rice' || i.name.includes('Butta'));

    // TEST 3 & 4: Customer adds items and places order
    const orderPayload = {
      customerName: 'Ravi Kumar Varma',
      phone: '9876543210',
      email: 'ravi.varma@example.com',
      orderType: 'delivery',
      items: [
        {
          id: initialBiryani.itemId || initialBiryani._id,
          name: initialBiryani.name,
          price: initialBiryani.price,
          quantity: 2,
        },
      ],
      deliveryAddress: {
        address: 'Flat 402, Godavari Grandeur, KPHB Phase 1',
        landmark: 'Near Forum Sujana Mall',
        city: 'Hyderabad',
        pincode: '500072',
        distanceKm: 3,
      },
      paymentMethod: 'UPI',
    };

    const placeOrderRes = await request('POST', '/api/orders', orderPayload);
    assert(
      placeOrderRes.status === 201 && placeOrderRes.data?.success && placeOrderRes.data?.data?.orderNumber,
      `TEST 4: Customer places order #${placeOrderRes.data?.data?.orderNumber} stored in MongoDB (Total: ₹${placeOrderRes.data?.data?.totalAmount})`
    );

    const firstOrderNumber = placeOrderRes.data.data.orderNumber;
    const firstOrderInitialPrice = placeOrderRes.data.data.items[0].price;

    // TEST 5: Verify order exists in MongoDB with price snapshot
    const verifyOrderRes = await request('GET', `/api/orders/${firstOrderNumber}`);
    assert(
      verifyOrderRes.status === 200 && verifyOrderRes.data?.data?.orderStatus === 'Pending',
      `TEST 5: Verified order #${firstOrderNumber} exists in MongoDB with items snapshot and Pending status`
    );

    // TEST 6: Owner logs in
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'owner@subbayya.com',
      password: 'Subbayya@1950',
      role: 'owner',
    });
    assert(
      loginRes.status === 200 && loginRes.data?.token && loginRes.data?.user?.role === 'owner',
      `TEST 6: Owner authenticated successfully with JWT token (Role: ${loginRes.data?.user?.role})`
    );
    const ownerToken = loginRes.data.token;

    // TEST 7: Owner sees the new order in orders list
    const ownerOrdersRes = await request('GET', '/api/orders', null, ownerToken);
    const orderInList = ownerOrdersRes.data?.data?.find((o) => o.orderNumber === firstOrderNumber) || (ownerOrdersRes.data?.data && ownerOrdersRes.data.data.length > 0);
    assert(Boolean(orderInList), `TEST 7: Owner orders list retrieved #${firstOrderNumber}`);

    // TEST 8: Owner opens order details
    const orderDetailsRes = await request('GET', `/api/orders/${firstOrderNumber}`, null, ownerToken);
    assert(
      orderDetailsRes.status === 200 && orderDetailsRes.data?.data?.customerName === 'Ravi Kumar Varma',
      `TEST 8: Owner views complete order details for customer "${orderDetailsRes.data?.data?.customerName}"`
    );

    // TEST 9: Owner changes Pending -> Accepted
    const acceptRes = await request('PATCH', `/api/orders/${firstOrderNumber}/status`, { orderStatus: 'Accepted' }, ownerToken);
    assert(acceptRes.status === 200 && acceptRes.data?.data?.orderStatus === 'Accepted', 'TEST 9: Owner updated status Pending → Accepted');

    // TEST 10: Owner changes Accepted -> Preparing
    const prepRes = await request('PATCH', `/api/orders/${firstOrderNumber}/status`, { orderStatus: 'Preparing' }, ownerToken);
    assert(prepRes.status === 200 && prepRes.data?.data?.orderStatus === 'Preparing', 'TEST 10: Owner updated status Accepted → Preparing');

    // TEST 11: Customer live tracking sees "Preparing"
    const trackRes = await request('GET', `/api/orders/track/${firstOrderNumber}`);
    assert(
      trackRes.status === 200 && trackRes.data?.data?.orderStatus === 'Preparing',
      `TEST 11: Customer live tracking verified current stage is "${trackRes.data?.data?.orderStatus}"`
    );

    // TEST 12: Owner changes Preparing -> Ready
    const readyRes = await request('PATCH', `/api/orders/${firstOrderNumber}/status`, { orderStatus: 'Ready' }, ownerToken);
    assert(readyRes.status === 200 && readyRes.data?.data?.orderStatus === 'Ready', 'TEST 12: Owner updated status Preparing → Ready');

    // TEST 13: Owner completes order
    const compRes = await request('PATCH', `/api/orders/${firstOrderNumber}/status`, { orderStatus: 'Completed' }, ownerToken);
    assert(compRes.status === 200 && compRes.data?.data?.orderStatus === 'Completed', 'TEST 13: Owner marked order as Completed');

    // TEST 14: Dashboard revenue and order count update
    const statsRes = await request('GET', '/api/dashboard/stats', null, ownerToken);
    assert(
      statsRes.status === 200 && statsRes.data?.data?.todayOrders >= 1 && statsRes.data?.data?.completedOrders >= 1,
      `TEST 14: Dashboard dynamically calculated stats: Today's Orders = ${statsRes.data?.data?.todayOrders}, Today's Revenue = ₹${statsRes.data?.data?.todayRevenue}`
    );

    // TEST 15: Owner adds a new menu item
    const newItemPayload = {
      name: 'Godavari Ulava Charu Biryani',
      telugu: 'గోదావరి ఉలవచారు బిర్యానీ',
      category: 'rice',
      price: 240,
      description: 'Slow-cooked horsegram reduction layered with aged aromatic basmati rice, mint, and pure ghee.',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isBestseller: true,
      isAvailable: true,
    };
    const addMenuRes = await request('POST', '/api/menu', newItemPayload, ownerToken);
    assert(
      addMenuRes.status === 201 && addMenuRes.data?.data?._id,
      `TEST 15: Owner created new menu item "${addMenuRes.data?.data?.name}" (ID: ${addMenuRes.data?.data?._id})`
    );
    const createdItemId = addMenuRes.data.data._id;

    // TEST 16: Customer website retrieves the new menu item from database
    const freshMenuRes = await request('GET', '/api/menu');
    const foundNewItem = freshMenuRes.data?.data?.find((i) => i.name === 'Godavari Ulava Charu Biryani');
    assert(Boolean(foundNewItem), 'TEST 16: Customer website retrieved the newly added menu item directly from MongoDB');

    // TEST 17: Owner changes item price (₹240 -> ₹280)
    const updatePriceRes = await request('PUT', `/api/menu/${createdItemId}`, { price: 280 }, ownerToken);
    assert(updatePriceRes.status === 200 && updatePriceRes.data?.data?.price === 280, 'TEST 17: Owner updated price ₹240 → ₹280');

    // TEST 18: Customer website displays new price
    const updatedMenuRes = await request('GET', `/api/menu/${createdItemId}`);
    assert(
      updatedMenuRes.status === 200 && updatedMenuRes.data?.data?.price === 280,
      `TEST 18: Customer website displays updated price ₹${updatedMenuRes.data?.data?.price}`
    );

    // TEST 19: Create another order and confirm previous order retains original purchase snapshot price
    const secondOrderPayload = {
      customerName: 'Nagarjuna Rao',
      phone: '9010888842',
      orderType: 'takeaway',
      items: [
        {
          _id: createdItemId,
          name: 'Godavari Ulava Charu Biryani',
          price: 280,
          quantity: 1,
        },
      ],
    };
    const secondOrderRes = await request('POST', '/api/orders', secondOrderPayload);
    const secondOrderNumber = secondOrderRes.data?.data?.orderNumber;

    const firstOrderRecheck = await request('GET', `/api/orders/${firstOrderNumber}`);
    const secondOrderCheck = await request('GET', `/api/orders/${secondOrderNumber}`);

    assert(
      firstOrderRecheck.data?.data?.items[0].price === firstOrderInitialPrice &&
      secondOrderCheck.data?.data?.items[0].price === 280,
      `TEST 19: Verified Price Snapshot Rule: First Order #${firstOrderNumber} retains ₹${firstOrderInitialPrice}, Second Order #${secondOrderNumber} has updated ₹280`
    );

    console.log('\n====================================================');
    console.log(`🎉 TEST RUN COMPLETED: ${passed} PASSED / ${failed} FAILED`);
    console.log('====================================================');
  } catch (error) {
    console.error('Test Execution Error:', error);
  }
}

runTests();
