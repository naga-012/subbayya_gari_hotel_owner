const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function inspectCustomerJs() {
  const page = await fetchText('https://subbayyagar-hotel.onrender.com/');
  const scriptSrcs = (page.data.match(/src=["']([^"']+\.js[^"']*)["']/g) || []).map(s => s.replace(/src=["']|["']/g, ''));
  console.log('Script files on customer site:', scriptSrcs);

  for (const src of scriptSrcs) {
    const fullUrl = src.startsWith('http') ? src : `https://subbayyagar-hotel.onrender.com/${src.replace(/^\//, '')}`;
    console.log('\n--- Fetching:', fullUrl);
    const script = await fetchText(fullUrl);
    console.log('Size:', script.data.length);
    
    // Look for fetch('/api/orders') or order payload structure
    const orderMatches = script.data.match(/([a-zA-Z0-9_$]+)\s*:\s*[^,{}]*phone[^,{}]*/gi) || [];
    console.log('Order phone matches:', orderMatches.slice(0, 5));

    const apiMatches = script.data.match(/fetch\([^)]+\)/g) || [];
    console.log('Fetch calls:', apiMatches);

    // Search for POST /api/orders
    const postOrderIndex = script.data.indexOf('/api/orders');
    if (postOrderIndex !== -1) {
      console.log('Context around /api/orders:\n', script.data.substring(Math.max(0, postOrderIndex - 200), postOrderIndex + 400));
    }
  }
}

inspectCustomerJs();
