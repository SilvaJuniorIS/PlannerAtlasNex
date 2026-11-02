const { mkdirSync, rmSync, copyFileSync, cpSync } = require('node:fs');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..');
rmSync(resolve(root, 'public'), { recursive: true, force: true });
mkdirSync(resolve(root, 'public'));
for (const file of ['index.html','manual.html','manifest.json','sw.js']) copyFileSync(resolve(root,file),resolve(root,'public',file));
for (const folder of ['assets','css','js','data']) cpSync(resolve(root,folder),resolve(root,'public',folder),{recursive:true});
console.log('Arquivos públicos preparados sem código de servidor ou credenciais.');
