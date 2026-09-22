const https = require('https');

function fetchJson(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(body);
    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testCustomerAppOrder() {
  const payload = {
    id: 'SGH-690226',
    createdAt: new Date().toISOString(),
    status: 'Received',
    customerName: 'Nagarjuna (Naga)',
    customerPhone: '9121792433',
    customerEmail: 'myakallanagarjun09@gmail.com',
    orderType: 'takeaway',
    branchName: 'KPHB COLONY, HYDERABAD',
    items: [
      { id: '1', name: 'Gongura Pulihora Half', price: 100, qty: 1 }
    ],
    subtotal: 100,
    packagingFee: 0,
    deliveryFee: 0,
    discount: 0,
    grandTotal: 100,
    paymentMethod: 'Paid Online / Verified',
    paymentStatus: 'Paid',
    pickupSlot: 'ASAP (15-20 Mins)'
  };

  console.log('Sending to https://subbayyagar-hotel.onrender.com/api/orders ...');
  const res1 = await fetchJson('https://subbayyagar-hotel.onrender.com/api/orders', payload);
  console.log('Response from subbayyagar-hotel:', res1);

  console.log('\nSending to https://subbayya-gari-hotel.onrender.com/api/orders ...');
  const res2 = await fetchJson('https://subbayya-gari-hotel.onrender.com/api/orders', payload);
  console.log('Response from subbayya-gari-hotel:', res2);
}

testCustomerAppOrder();
