const fs = require('fs');

const customerAppPath = 'C:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/app.js';
let content = fs.readFileSync(customerAppPath, 'utf8');

// Replace any remaining fetch calls with mismatched quotes
content = content.replace(/fetch\(\`\$\{BACKEND_BASE\}\/api\/([^\`\'\"]+)[\'\"]\s*,/g, "fetch(`${BACKEND_BASE}/api/$1`,");
content = content.replace(/fetch\(\`\$\{BACKEND_BASE\}\/api\/([^\`\'\"]+)[\'\"]\s*\)/g, "fetch(`${BACKEND_BASE}/api/$1`)");
content = content.replace(/fetch\(\'\$\{BACKEND_BASE\}\/api\/([^\`\'\"]+)[\'\"]\s*,/g, "fetch(`${BACKEND_BASE}/api/$1`,");
content = content.replace(/fetch\(\'\$\{BACKEND_BASE\}\/api\/([^\`\'\"]+)[\'\"]\s*\)/g, "fetch(`${BACKEND_BASE}/api/$1`)");

fs.writeFileSync(customerAppPath, content, 'utf8');
console.log('Cleaned mismatched fetch strings!');
