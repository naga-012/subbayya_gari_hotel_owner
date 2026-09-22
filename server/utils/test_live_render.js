const https = require('https');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const postData = options.body ? JSON.stringify(options.body) : null;
    if (postData) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(reqOptions, (res) => {
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

async function testLiveSites() {
  console.log('Testing live Render endpoints...\n');

  // 1. Health check Customer site
  console.log('1. Checking Customer Site: https://subbayyagar-hotel.onrender.com/api/health');
  try {
    const custHealth = await fetchUrl('https://subbayyagar-hotel.onrender.com/api/health');
    console.log('Customer Site Health Status:', custHealth.status, custHealth.data || custHealth.raw.slice(0, 100));
  } catch (e) {
    console.log('Customer health error:', e.message);
  }

  // 2. Health check Owner site
  console.log('\n2. Checking Owner Site: https://subbayya-gari-hotel.onrender.com/api/health');
  try {
    const ownerHealth = await fetchUrl('https://subbayya-gari-hotel.onrender.com/api/health');
    console.log('Owner Site Health Status:', ownerHealth.status, ownerHealth.data || ownerHealth.raw.slice(0, 100));
  } catch (e) {
    console.log('Owner health error:', e.message);
  }

  // 3. Check customer site HTML to see where it sends orders
  console.log('\n3. Inspecting Customer Site HTML / JS config:');
  try {
    const custPage = await fetchUrl('https://subbayyagar-hotel.onrender.com/');
    console.log('Customer Page Status:', custPage.status);
    const matches = custPage.raw.match(/https?:\/\/[^"'\s<>]+/g) || [];
    console.log('URLs found in Customer Page:', [...new Set(matches)]);
  } catch (e) {
    console.log('Error inspecting customer page:', e.message);
  }

  // 4. Test placing order on Customer backend vs Owner backend
  console.log('\n4. Attempting to place order on Customer backend:');
  try {
    const orderPayload = {
      customerName: 'Live Test Customer',
      phone: '9121792433',
      orderType: 'delivery',
      paymentMethod: 'UPI',
      deliveryAddress: {
        address: 'KPHB Phase 1, Hyderabad',
      },
      items: [
        { name: 'Butta Bojanam', price: 515, quantity: 1 }
      ]
    };

    const custOrder = await fetchUrl('https://subbayyagar-hotel.onrender.com/api/orders', {
      method: 'POST',
      body: orderPayload,
    });
    console.log('Customer site order placement response:', custOrder.status, custOrder.data || custOrder.raw.slice(0, 200));

    // Also try placing order directly on Owner backend
    console.log('\n5. Attempting to place order on Owner backend:');
    const ownerOrder = await fetchUrl('https://subbayya-gari-hotel.onrender.com/api/orders', {
      method: 'POST',
      body: orderPayload,
    });
    console.log('Owner site order placement response:', ownerOrder.status, ownerOrder.data || ownerOrder.raw.slice(0, 200));

    // 6. Login to Owner site and fetch orders
    console.log('\n6. Logging in to Owner Dashboard (https://subbayya-gari-hotel.onrender.com/api/auth/login):');
    const loginRes = await fetchUrl('https://subbayya-gari-hotel.onrender.com/api/auth/login', {
      method: 'POST',
      body: {
        email: 'myakallanagarjun09@gmail.com',
        password: '123456',
        role: 'owner',
      },
    });
    console.log('Owner login status:', loginRes.status, loginRes.data?.user?.email);

    if (loginRes.data?.token) {
      const token = loginRes.data.token;
      const getOrdersRes = await fetchUrl('https://subbayya-gari-hotel.onrender.com/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Orders found in Owner Dashboard:', getOrdersRes.data?.count, 'total:', getOrdersRes.data?.total);
      if (getOrdersRes.data?.data) {
        console.log('Recent order numbers in owner dashboard:', getOrdersRes.data.data.slice(0, 5).map(o => ({ orderNumber: o.orderNumber, name: o.customerName, amount: o.totalAmount, status: o.orderStatus })));
      }
    }
  } catch (e) {
    console.log('Error testing orders:', e.message);
  }
}

testLiveSites();
