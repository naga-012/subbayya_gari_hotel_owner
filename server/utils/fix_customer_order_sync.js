const fs = require('fs');

// 1. Update app.js in subbayyagar_hotel
const appJsPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/app.js';
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Fix proceedToCheckout: replace placeOrder(true, 'Direct Order', 'Confirmed') with finalizePaymentAndPlaceOrder
const oldCheckoutCall = "placeOrder(true, 'Direct Order', 'Confirmed');";
if (appJs.includes(oldCheckoutCall)) {
  appJs = appJs.replace(oldCheckoutCall, "finalizePaymentAndPlaceOrder('Direct Order', 'Confirmed');");
  console.log('Fixed proceedToCheckout call in app.js');
} else {
  console.log('Direct string match for oldCheckoutCall not found');
}

// Add placeOrder helper definition if not already present
if (!appJs.includes('function placeOrder(')) {
  const placeOrderDef = `
function placeOrder(isDirect, customMethod, customStatus) {
  return finalizePaymentAndPlaceOrder(customMethod || 'Direct Order', customStatus || 'Confirmed');
}
window.placeOrder = placeOrder;
`;
  appJs = appJs.replace('window.proceedToCheckout = proceedToCheckout;', 'window.proceedToCheckout = proceedToCheckout;\n' + placeOrderDef);
  console.log('Added placeOrder definition to app.js');
}

// Update multi-backend dispatch in finalizePaymentAndPlaceOrder
const oldSyncFetch = `  // Asynchronously send to Server Orders Database
  fetch(\`\${BACKEND_BASE}/api/orders\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  }).then(r => r.json()).then(resData => {
    console.log('[Order Sync] Saved successfully to backend database:', resData);
  }).catch(err => {
    console.warn('[Order Sync] Backend sync failed, kept locally:', err);
  });`;

const newSyncFetch = `  // Asynchronously send to Server Orders Database & Owner Management Operations Portal
  const targetEndpoints = [
    \`\${BACKEND_BASE}/api/orders\`,
    'https://subbayya-gari-hotel.onrender.com/api/orders'
  ];
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    targetEndpoints.push('http://localhost:5000/api/orders');
  }
  const uniqueEndpoints = [...new Set(targetEndpoints)];

  uniqueEndpoints.forEach(endpointUrl => {
    fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).then(r => r.ok ? r.json() : null).then(resData => {
      if (resData) console.log(\`[Order Sync] Saved successfully to \${endpointUrl}:\`, resData);
    }).catch(err => {
      console.warn(\`[Order Sync] Sync notice for \${endpointUrl}:\`, err.message);
    });
  });`;

if (appJs.includes(oldSyncFetch)) {
  appJs = appJs.replace(oldSyncFetch, newSyncFetch);
  console.log('Updated order dispatch in app.js');
} else {
  console.log('Warning: oldSyncFetch pattern not matched exactly, checking alternative');
}

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('app.js saved successfully');

// 2. Update api/orders.js in subbayyagar_hotel
const ordersApiPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/api/orders.js';
let ordersApi = fs.readFileSync(ordersApiPath, 'utf8');

const targetBroadcast = `      // Broadcast live to Owner portal & Customer sites
      broadcastOrderUpdate('order_created', newOrder);`;

const newBroadcastWithFwd = `      // Broadcast live to Owner portal & Customer sites
      broadcastOrderUpdate('order_created', newOrder);

      // Asynchronously forward customer order to Owner Operations Portal (subbayya-gari-hotel.onrender.com)
      try {
        const https = require('https');
        const http = require('http');
        const fwdPayload = JSON.stringify(newOrder);
        const forwardToOwner = (targetUrl) => {
          try {
            const u = new URL(targetUrl);
            const client = u.protocol === 'https:' ? https : http;
            const fReq = client.request({
              hostname: u.hostname,
              port: u.port || (u.protocol === 'https:' ? 443 : 80),
              path: u.pathname,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(fwdPayload),
              },
              timeout: 6000,
            }, (fRes) => {
              console.log(\`[Orders Forward] Forwarded \${newOrder.id} to \${targetUrl}: status \${fRes.statusCode}\`);
            });
            fReq.on('error', (e) => console.warn(\`[Orders Forward Error] \${targetUrl}:\`, e.message));
            fReq.write(fwdPayload);
            fReq.end();
          } catch (err) {
            console.warn(\`[Orders Forward Error] \${targetUrl}:\`, err.message);
          }
        };

        forwardToOwner('https://subbayya-gari-hotel.onrender.com/api/orders');
        forwardToOwner('http://127.0.0.1:5000/api/orders');
      } catch (fwdErr) {
        console.warn('[Orders Forward Error]:', fwdErr.message);
      }`;

if (!ordersApi.includes('subbayya-gari-hotel.onrender.com/api/orders')) {
  if (ordersApi.includes(targetBroadcast)) {
    ordersApi = ordersApi.replace(targetBroadcast, newBroadcastWithFwd);
    fs.writeFileSync(ordersApiPath, ordersApi, 'utf8');
    console.log('orders.js updated with owner forwarding');
  } else {
    console.log('targetBroadcast not found in orders.js');
  }
} else {
  console.log('orders.js already has owner forwarding');
}
