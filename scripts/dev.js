const http = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname } = require('node:path');
const routes = { '/api/session': require('../api/session'), '/api/tasks': require('../api/tasks') };
const root = resolve(__dirname,'..');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
http.createServer(async (req,res) => {
  try {
    const path = new URL(req.url,'http://localhost').pathname;
    if (routes[path]) return await routes[path](req,res);
    const name = path === '/' ? '/index.html' : path;
    if (!/^\/(index\.html|manual\.html|manifest\.json|sw\.js|(?:assets|css|js|data)\/[a-zA-Z0-9_.-]+)$/.test(name)) { res.writeHead(404); return res.end('Não encontrado'); }
    const content = await readFile(resolve(root,'.'+name));
    res.setHeader('Content-Type',types[extname(name)] || 'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.end(content);
  } catch { res.writeHead(500); res.end('Erro ao atender solicitação.'); }
}).listen(Number(process.env.PORT || 3000),'127.0.0.1',()=>console.log('Servidor de desenvolvimento iniciado.'));
