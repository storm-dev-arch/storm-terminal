const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const targetDir = 'C:\\Users\\storm\\Desktop\\storm-terminal-github';

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

const ignored = new Set([
  'node_modules',
  'release',
  'dist',
  'dist-electron',
  '.git',
  '.system_generated'
]);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (ignored.has(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(srcDir, targetDir);
console.log(`Successfully copied clean source files to: ${targetDir}`);
