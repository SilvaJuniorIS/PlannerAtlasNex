const { createHmac } = require('node:crypto');
const auth = require('../server/auth');
const db = require('../server/db');
const { send, sameOrigin, body } = require('../server/http');
module.exports = async function handler(req, res) {
  try {
    if (!auth.ready()) return send(res, 503, { error: 'Configure o acesso privado no servidor.' });
    if (req.method === 'GET') return send(res, 200, { authenticated: auth.authenticated(req) });
    if (!['POST','DELETE'].includes(req.method)) { res.setHeader('Allow','GET, POST, DELETE'); return send(res,405,{error:'Método inválido.'}); }
    if (!sameOrigin(req)) return send(res,403,{error:'Origem inválida.'});
    if (req.method === 'DELETE') { auth.setCookie(res,'',true); return send(res,200,{authenticated:false}); }
    const data = await body(req);
    if (typeof data.password !== 'string' || data.password.length > 1024) return send(res,400,{error:'Senha inválida.'});
    // In Vercel, x-vercel-forwarded-for is controlled by the platform.
    const ip = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] || 'unknown' : req.socket?.remoteAddress || 'local';
    const key = createHmac('sha256',process.env.SESSION_SECRET).update(String(ip)).digest('hex');
    if (!await db.loginAllowed(key)) { res.setHeader('Retry-After','900'); return send(res,429,{error:'Muitas tentativas. Aguarde 15 minutos.'}); }
    if (!auth.validPassword(data.password)) return send(res,401,{error:'Senha incorreta.'});
    auth.setCookie(res,auth.sessionToken());
    return send(res,200,{authenticated:true});
  } catch (error) { return send(res,error.status || 503,{error:error.status ? error.message : 'Não foi possível acessar o banco. Verifique a configuração.'}); }
};
