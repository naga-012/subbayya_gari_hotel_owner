const fs = require('fs');

const appJsPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

const targetStr = `  // 2. Fetch from API if still not found
  if (!ord) {
    try {
      const res = await fetch(\`\${BACKEND_BASE}/api/orders\`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          ord = data.orders.find(o => o.id === orderId);
        }
      }
    } catch (e) {
      console.warn('Could not fetch order details from server:', e);
    }
  }`;

const replacementStr = `  // 2. Fetch latest authoritative status directly from API
  try {
    const res = await fetch(\`\${BACKEND_BASE}/api/orders/\${orderId}\`);
    if (res.ok) {
      const apiData = await res.json();
      const serverRaw = apiData.data || apiData.order;
      if (serverRaw) {
        ord = normalizeServerOrder(serverRaw);
      }
    }
  } catch (e) {
    console.warn('Could not fetch latest order status from server:', e);
  }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(appJsPath, content, 'utf8');
  console.log('Updated openOrderDetailsModal with live direct API fetch');
} else {
  console.log('Target not matched in openOrderDetailsModal, checking regex');
  const regex = /\/\/ 2\. Fetch from API if still not found[\s\S]*?console\.warn\('Could not fetch order details from server:', e\);\s*\}\s*\}/;
  if (regex.test(content)) {
    content = content.replace(regex, replacementStr);
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log('Regex replaced in openOrderDetailsModal');
  }
}
