const fs = require('fs');
const path = require('path');

// Ensure build and public directories exist
const buildDir = path.join(__dirname, '..', 'build');
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const src = path.join(__dirname, '..', 'ico.png');
fs.copyFileSync(src, path.join(buildDir, 'icon.png'));
fs.copyFileSync(src, path.join(publicDir, 'ico.png'));
fs.copyFileSync(src, path.join(publicDir, 'icon.png'));
console.log('Copied ico.png to build/icon.png and public/ico.png');
