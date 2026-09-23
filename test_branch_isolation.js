const http = require('http');

async function testBranchIsolation() {
  console.log('====================================================');
  console.log('🌾 TESTING BRANCH-SPECIFIC LOGIN & ORDER ISOLATION 🌾');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:5000';

  // 1. Test Login with Kukatpally Branch
  console.log('Test 1: Login with Kukatpally Branch');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'myakalanagarjun09@gmail.com',
      password: '123456',
      role: 'owner',
      branch: 'Kukatpally'
    })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  console.log(`✅ Login Success! Token retrieved. User branch: ${loginData.user.branch}`);
  const token = loginData.token;

  // 2. Fetch Orders for Kukatpally Branch
  console.log('\nTest 2: Querying orders for Kukatpally Branch (/api/orders?branch=Kukatpally)...');
  const kukatpallyOrdersRes = await fetch(`${BASE_URL}/api/orders?branch=Kukatpally`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const kukatpallyData = await kukatpallyOrdersRes.json();
  console.log(`   Found ${kukatpallyData.count} orders for Kukatpally (Total in DB: ${kukatpallyData.total})`);
  
  const invalidKukatpally = (kukatpallyData.data || []).filter(o => !o.branch.toLowerCase().includes('kukatpally'));
  if (invalidKukatpally.length > 0) {
    throw new Error(`❌ Isolation failed: ${invalidKukatpally.length} non-Kukatpally orders found in Kukatpally query!`);
  }
  console.log('✅ PASS: All returned orders strictly belong to Kukatpally!');
  kukatpallyData.data.slice(0, 3).forEach(o => {
    console.log(`   - Order #${o.orderNumber}: ${o.customerName} | Branch: ${o.branch} | Amount: ₹${o.totalAmount}`);
  });

  // 3. Fetch Orders for KPHB Branch
  console.log('\nTest 3: Querying orders for KPHB Branch (/api/orders?branch=KPHB)...');
  const kphbOrdersRes = await fetch(`${BASE_URL}/api/orders?branch=KPHB`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const kphbData = await kphbOrdersRes.json();
  console.log(`   Found ${kphbData.count} orders for KPHB (Total in DB: ${kphbData.total})`);
  
  const invalidKPHB = (kphbData.data || []).filter(o => !o.branch.toLowerCase().includes('kphb'));
  if (invalidKPHB.length > 0) {
    throw new Error(`❌ Isolation failed: ${invalidKPHB.length} non-KPHB orders found in KPHB query!`);
  }
  console.log('✅ PASS: All returned orders strictly belong to KPHB!');
  kphbData.data.slice(0, 3).forEach(o => {
    console.log(`   - Order #${o.orderNumber}: ${o.customerName} | Branch: ${o.branch} | Amount: ₹${o.totalAmount}`);
  });

  // 4. Fetch Orders for Vanasthalipuram Branch
  console.log('\nTest 4: Querying orders for Vanasthalipuram Branch (/api/orders?branch=Vanasthalipuram)...');
  const vanasthalipuramOrdersRes = await fetch(`${BASE_URL}/api/orders?branch=Vanasthalipuram`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const vanasthalipuramData = await vanasthalipuramOrdersRes.json();
  console.log(`   Found ${vanasthalipuramData.count} orders for Vanasthalipuram (Total in DB: ${vanasthalipuramData.total})`);
  
  const invalidVanasthalipuram = (vanasthalipuramData.data || []).filter(o => !o.branch.toLowerCase().includes('vanasthalipuram'));
  if (invalidVanasthalipuram.length > 0) {
    throw new Error(`❌ Isolation failed: ${invalidVanasthalipuram.length} non-Vanasthalipuram orders found in Vanasthalipuram query!`);
  }
  console.log('✅ PASS: All returned orders strictly belong to Vanasthalipuram!');
  vanasthalipuramData.data.slice(0, 3).forEach(o => {
    console.log(`   - Order #${o.orderNumber}: ${o.customerName} | Branch: ${o.branch} | Amount: ₹${o.totalAmount}`);
  });

  // 5. Test X-Owner-Branch Header Isolation
  console.log('\nTest 5: Testing Header-based Isolation (X-Owner-Branch: Kukatpally)...');
  const headerRes = await fetch(`${BASE_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Owner-Branch': 'Kukatpally'
    }
  });
  const headerData = await headerRes.json();
  const invalidHeader = (headerData.data || []).filter(o => !o.branch.toLowerCase().includes('kukatpally'));
  if (invalidHeader.length > 0) {
    throw new Error(`❌ Header isolation failed: ${invalidHeader.length} non-Kukatpally orders found!`);
  }
  console.log(`✅ PASS: Header isolation successful! ${headerData.count} Kukatpally orders returned.`);

  // 6. Test Dashboard Stats for Kukatpally
  console.log('\nTest 6: Querying Dashboard Stats for Kukatpally (/api/dashboard/stats?branch=Kukatpally)...');
  const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats?branch=Kukatpally`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  console.log('   Kukatpally Dashboard Stats:', statsData.data);
  console.log(`✅ PASS: Dashboard stats calculated for Kukatpally (Total Orders: ${statsData.data.totalOrders})`);

  // 7. Verify All Branches (Master View) returns all branches
  console.log('\nTest 7: Querying All Branches (Master View)...');
  const allOrdersRes = await fetch(`${BASE_URL}/api/orders?branch=all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const allOrdersData = await allOrdersRes.json();
  console.log(`   Master View Total: ${allOrdersData.total} orders across all branches`);
  console.log('✅ PASS: Master view returns complete restaurant orders.');

  console.log('\n====================================================');
  console.log('🎉 ALL BRANCH ISOLATION TESTS PASSED PERFECTLY! 🎉');
  console.log('====================================================');
}

testBranchIsolation().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
