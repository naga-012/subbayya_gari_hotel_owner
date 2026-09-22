const fs = require('fs');

const indexHtmlPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/index.html';
const appJsPath = 'c:/Users/myaka/OneDrive/Desktop/subbayyagar_hotel/app.js';

// 1. Update index.html to include socket.io CDN
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!indexHtml.includes('socket.io')) {
    indexHtml = indexHtml.replace(
      '<script src="app.js',
      '<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>\n  <script src="app.js'
    );
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log('Successfully added socket.io CDN to customer index.html');
  } else {
    console.log('socket.io CDN already present in index.html');
  }
}

// 2. Read app.js and inspect
if (fs.existsSync(appJsPath)) {
  let appJs = fs.readFileSync(appJsPath, 'utf8');
  console.log('Customer app.js length:', appJs.length);
}
