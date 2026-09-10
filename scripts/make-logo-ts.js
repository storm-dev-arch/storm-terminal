const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'logo.png');
const buf = fs.readFileSync(pngPath);
const base64 = buf.toString('base64');
const dataUri = `data:image/png;base64,${base64}`;

const tsContent = `// Auto-generated embedded STORM Logo Data URI - guaranteed to load under any protocol (file://, http://)
export const STORM_LOGO = '${dataUri}';
export default STORM_LOGO;
`;

const tsPath = path.join(__dirname, '..', 'src', 'renderer', 'assets', 'logo.ts');
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log('Successfully wrote src/renderer/assets/logo.ts (chars:', dataUri.length, ')');
