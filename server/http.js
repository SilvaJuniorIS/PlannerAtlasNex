const { timingSafeEqual } = require('node:crypto');
function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
async function body(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) throw Object.assign(new Error('Use JSON.'), { status: 415 });
  if (req.body !== undefined) {
    const value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(value)) > 1000000) throw Object.assign(new Error('Arquivo muito grande.'), { status: 413 });
    return value;
  }
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (Buffer.byteLength(data) > 1000000) throw Object.assign(new Error('Arquivo muito grande.'), { status: 413 });
  }
  try { return JSON.parse(data); } catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
}
function equal(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
module.exports = { send, sameOrigin, body, equal };
