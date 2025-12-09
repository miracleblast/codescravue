// test-vite.js in your project root
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
  rejectUnauthorized: false // Don't reject self-signed certs
};

https.get('https://localhost:3000', options, (res) => {
  console.log('✅ Vite server is responding');
  console.log('Status:', res.statusCode);
  res.on('data', (chunk) => {
    console.log('Received chunk of', chunk.length, 'bytes');
  });
}).on('error', (err) => {
  console.error('❌ Cannot connect to Vite:', err.message);
  console.log('Check if Vite is running with: npm run dev');
});