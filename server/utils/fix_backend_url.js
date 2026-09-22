const fs = require('fs');

const files = [
  'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/app.js',
  'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/login.html',
  'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/owner.html'
];

const exactBackendUrl = 'https://subbayya-gari-hotel.onrender.com';

const newCode = `const BACKEND_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '5000')
  ? window.location.origin
  : '${exactBackendUrl}';`;

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace any version of BACKEND_BASE definition
  const regex = /const BACKEND_BASE = [\s\S]*?'https:\/\/subbayya-gari-hotel\.onrender\.com'\);/g;
  if (regex.test(content)) {
    content = content.replace(regex, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated BACKEND_BASE in:', filePath);
  } else {
    console.log('Regex did not match in:', filePath);
  }
});
