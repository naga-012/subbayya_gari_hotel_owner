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

async function inspectPayload() {
  const script = await fetchText('https://subbayyagar-hotel.onrender.com/app.js?v=3.5');
  const idx = script.data.indexOf('orderPayload =');
  if (idx !== -1) {
    console.log(script.data.substring(idx - 200, idx + 800));
  } else {
    const idx2 = script.data.indexOf('orderPayload');
    console.log(script.data.substring(idx2 - 100, idx2 + 800));
  }
}

inspectPayload();
