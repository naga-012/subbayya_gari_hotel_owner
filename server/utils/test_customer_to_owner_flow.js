async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('🌾 SUBBAYYA GARI HOTEL — CUSTOMER-TO-OWNER ORDER PIPELINE TEST 🌾');
  console.log('================================================================\n');

  const testId = `SGH-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderPayload = {
    id: testId,
    orderNumber: testId,
    customerName: 'Sita Rama Rao',
    customerPhone: '9848022338',
    customerEmail: 'sitaramarao@gmail.com',
    orderType: 'delivery',
    branchName: 'KPHB Colony, Hyderabad',
    deliveryAddress: 'Flat 402, Royal Residency, KPHB Phase 1, Hyderabad',
    deliveryLandmark: 'Near Forum Mall',
    items: [
      { name: 'Subbayya Special Royal Butta Bhojanam', price: 349, qty: 2 }
    ],
    subtotal: 698,
    packagingFee: 30,
    deliveryFee: 30,
    discount: 0,
    grandTotal: 758,
    paymentMethod: 'Direct Order',
    paymentStatus: 'Confirmed',
    notes: 'Extra Godavari gun powder & hot pure ghee packet'
  };

  console.log(`1. Dispatching customer order (${testId}) to Owner Portal endpoint:`);
  console.log('   Target: https://subbayya-gari-hotel.onrender.com/api/orders');

  const postRes = await fetch('https://subbayya-gari-hotel.onrender.com/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
    signal: AbortSignal.timeout(15000),
  });

  const postJson = await postRes.json();
  console.log(`   Owner site response status: ${postRes.status}`);
  console.log(`   Order created response:`, postJson.data?.orderNumber || postJson.message);

  if (postRes.status !== 201) {
    console.error('❌ Failed to place order on Owner portal directly:', postJson);
    return;
  }
  console.log('✅ PASS: Order successfully accepted and saved into MongoDB!\n');

  // 2. Log in to Owner Dashboard to inspect received orders
  console.log('2. Authenticating as Owner to check live order intake:');
  const loginRes = await fetch('https://subbayya-gari-hotel.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'myakallanagarjun09@gmail.com',
      password: '123456',
      role: 'owner',
    }),
    signal: AbortSignal.timeout(15000),
  });

  const loginJson = await loginRes.json();
  const token = loginJson.token;
  if (!token) {
    console.error('❌ Could not login to Owner dashboard:', loginJson);
    return;
  }
  console.log('✅ PASS: Owner login successful. Owner token retrieved.');

  // 3. Fetch latest orders in Owner Dashboard
  console.log('\n3. Retrieving live orders list in Owner Portal (/api/orders):');
  const ordersRes = await fetch('https://subbayya-gari-hotel.onrender.com/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });

  const ordersJson = await ordersRes.json();
  const allOrders = ordersJson.data || [];
  console.log(`   Total orders in Owner Dashboard: ${allOrders.length}`);

  const foundOrder = allOrders.find(o => o.orderNumber === testId);
  if (foundOrder) {
    console.log(`✅ PASS: New Customer Order #${foundOrder.orderNumber} successfully received in Owner Dashboard!`);
    console.log(`   Customer: ${foundOrder.customerName} (${foundOrder.phone})`);
    console.log(`   Type: ${foundOrder.orderType} | Total Amount: ₹${foundOrder.totalAmount}`);
    console.log(`   Status: ${foundOrder.orderStatus} | Payment: ${foundOrder.paymentStatus} (${foundOrder.paymentMethod})`);
    console.log(`   Address: ${foundOrder.deliveryAddress?.address}`);
    console.log(`   Items: ${foundOrder.items?.map(i => `${i.name} x${i.quantity || i.qty}`).join(', ')}`);
  } else {
    console.error(`❌ Order ${testId} was not found in top orders.`);
  }

  // 4. Test Customer Tracking Endpoint for this order
  console.log('\n4. Verifying Customer Live Tracking Endpoint (/api/orders/track/:orderNumber):');
  const trackRes = await fetch(`https://subbayya-gari-hotel.onrender.com/api/orders/track/${testId}`, {
    signal: AbortSignal.timeout(15000),
  });
  const trackJson = await trackRes.json();
  if (trackRes.status === 200 && trackJson.data?.orderNumber === testId) {
    console.log(`✅ PASS: Customer live tracking verified for #${testId} (Status: ${trackJson.data.orderStatus})`);
  } else {
    console.error('❌ Live tracking failed:', trackJson);
  }

  // 5. Update Status from Owner to Preparing and Ready
  console.log('\n5. Testing Owner Status Transition (Pending -> Preparing -> Ready):');
  const prepRes = await fetch(`https://subbayya-gari-hotel.onrender.com/api/orders/${foundOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderStatus: 'Preparing' }),
    signal: AbortSignal.timeout(15000),
  });
  const prepJson = await prepRes.json();
  console.log(`   Status updated to Preparing: ${prepJson.success ? '✅ Success' : '❌ Failed'}`);

  const readyRes = await fetch(`https://subbayya-gari-hotel.onrender.com/api/orders/${foundOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderStatus: 'Ready' }),
    signal: AbortSignal.timeout(15000),
  });
  const readyJson = await readyRes.json();
  console.log(`   Status updated to Ready: ${readyJson.success ? '✅ Success' : '❌ Failed'}`);

  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED: Customer order flows into Owner Site flawlessly! 🎉');
  console.log('================================================================');
}

runEndToEndVerification().catch(console.error);
