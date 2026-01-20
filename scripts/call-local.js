/**
 * Test script for calling getProEphemeris locally (emulator)
 * 
 * Usage:
 *   node scripts/call-local.js
 * 
 * Requires:
 *   - Firebase emulators running (firebase emulators:start)
 *   - Valid Firebase Auth ID token (get from AURA app or Firebase Auth)
 */

const https = require('https');

const EMULATOR_HOST = 'localhost';
const EMULATOR_PORT = 5001;
const PROJECT_ID = 'aura-2ca80'; // Adjust to your project

// TODO: Replace with actual ID token from Firebase Auth
const ID_TOKEN = 'YOUR_ID_TOKEN_HERE';

const requestData = {
  data: {
    utcISO: '1992-03-30T08:30:00.000Z',
    zodiacSystem: 'tropical',
    bodies: ['Chiron', 'Ceres'],
    wantSpeed: true,
    debug: true,
  },
};

const postData = JSON.stringify(requestData);

const options = {
  hostname: EMULATOR_HOST,
  port: EMULATOR_PORT,
  path: `/${PROJECT_ID}/us-central1/getProEphemeris`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    Authorization: `Bearer ${ID_TOKEN}`,
  },
};

console.log(`[call-local] Calling getProEphemeris on emulator...`);
console.log(`[call-local] Request:`, JSON.stringify(requestData, null, 2));

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log(`[call-local] Response:`, JSON.stringify(response, null, 2));
    } catch (err) {
      console.error(`[call-local] Parse error:`, err);
      console.log(`[call-local] Raw response:`, data);
    }
  });
});

req.on('error', (err) => {
  console.error(`[call-local] Request error:`, err);
});

req.write(postData);
req.end();
