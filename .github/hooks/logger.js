const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'security.log');

const eventType = process.argv[2] || 'unknown';

const logEntry = {
  event: eventType,
  timestamp: new Date().toISOString(),
  user: process.env.USER || 'copilot-agent',
  details: process.argv.slice(3)
};

fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

console.log(`[LOGGED]: ${eventType}`);