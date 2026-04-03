// scripts/start-websocket.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, '../server.ts');

console.log('🚀 Starting Unified Next.js + WebSocket Server...');

const wsProcess = spawn('node', ['--experimental-strip-types', serverPath], {
    stdio: 'inherit',
    shell: true
});

wsProcess.on('error', (err) => {
    console.error('❌ Failed to start WebSocket process:', err);
});

process.on('SIGINT', () => {
    wsProcess.kill('SIGINT');
    process.exit();
});

process.on('SIGTERM', () => {
    wsProcess.kill('SIGTERM');
    process.exit();
});
