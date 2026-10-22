/**
 * Собирает один автономный HTML для GitHub Release / офлайн-скачивания.
 * Исходники для разработки и Pages остаются модульными (index.html + css/ + js/).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const pkg = JSON.parse(read('package.json'));
const css = read('css/app.css');
const scripts = [
  'js/state.js',
  'js/utils.js',
  'js/parser.js',
  'js/chunks.js',
  'js/storage.js',
  'js/player.js',
  'js/files.js',
  'js/ui.js',
  'js/pwa.js',
  'js/main.js'
].map(read).join('\n\n');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="css\/app\.css">\s*/i, `<style>\n${css}\n</style>\n`);
html = html.replace(
  /<!-- Порядок скриптов[\s\S]*?<script src="js\/main\.js"><\/script>/i,
  `<script>\n${scripts}\n</script>`
);

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const outName = `IziBook-v${pkg.version}.html`;
const outPath = path.join(outDir, outName);
fs.writeFileSync(outPath, html);
console.log('Wrote', path.relative(root, outPath), `(${html.length} bytes)`);
