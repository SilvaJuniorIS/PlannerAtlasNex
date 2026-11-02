const { createHmac, scryptSync, randomBytes } = require('node:crypto');
const { equal } = require('./http');
const COOKIE = 'atlasnex_session';
function ready() {
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  return /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash) && (process.env.SESSION_SECRET || '').length >= 32;
}
function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function validPassword(password) {
  if (!ready() || typeof password !== 'string' || password.length > 1024) return false;
  const [salt] = process.env.ADMIN_PASSWORD_HASH.split(':');
  return equal(hashPassword(password, salt), process.env.ADMIN_PASSWORD_HASH);
}
function signature(value) {
  return createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('hex');
}
function sessionToken(now = Date.now()) {
  const expires = String(Math.floor(now / 1000) + 12 * 60 * 60);
  return `${expires}.${signature(expires)}`;
}
function authenticated(req) {
  if (!ready()) return false;
  const cookie = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  if (!cookie) return false;
  const [expires, sig] = cookie.slice(COOKIE.length + 1).split('.');
  if (!/^\d+$/.test(expires) || !sig || Number(expires) <= Date.now() / 1000) return false;
  return equal(signature(expires), sig);
}
function setCookie(res, token, clear = false) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 43200}${secure ? '; Secure' : ''}`);
}
module.exports = { ready, hashPassword, validPassword, sessionToken, authenticated, setCookie };
