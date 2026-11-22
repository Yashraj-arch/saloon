const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- 1. Installing frontend dependencies ---');
execSync('npm --prefix frontend install', { stdio: 'inherit' });

console.log('--- 2. Building frontend Vite SPA ---');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

console.log('--- 3. Copying frontend/dist to root public/ ---');
const distDir = path.join(__dirname, 'frontend', 'dist');
const publicDir = path.join(__dirname, 'public');

if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.cpSync(distDir, publicDir, { recursive: true });

console.log('--- Build and copy to public/ completed successfully! ---');
