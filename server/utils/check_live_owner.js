const https = require('https');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + (parsed.search || ''),
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
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function checkOwnerPanel() {
  const loginRes = await fetchUrl('https://subbayya-gari-hotel.onrender.com/api/auth/login', {
    method: 'POST',
    body: {
      email: 'myakallanagarjun09@gmail.com',
      password: '123456',
      role: 'owner',
    },
  });

  const token = loginRes.data?.token;
  console.log('Owner logged in:', loginRes.data?.user?.name, loginRes.data?.user?.email);

  const ordersRes = await fetchUrl('https://subbayya-gari-hotel.onrender.com/api/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('\n--- Orders in Owner Panel (https://subbayya-gari-hotel.onrender.com/dashboard.html) ---');
  console.log('Total Orders:', ordersRes.data?.total);
  ordersRes.data?.data?.forEach((o) => {
    console.log(`• Order #${o.orderNumber} | Customer: ${o.customerName} (${o.phone}) | Type: ${o.orderType} | Items: ${o.items?.map(i => i.name).join(', ')} | Status: ${o.orderStatus} | Total: ₹${o.totalAmount}`);
  });
}

checkOwnerPanel();
