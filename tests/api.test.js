const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const auth = require('../server/auth');
const db = require('../server/db');
const tasksHandler = require('../api/tasks');
const sessionHandler = require('../api/session');
const { validatePlan } = require('../server/validate');
const password = randomBytes(24).toString('hex');
process.env.ADMIN_PASSWORD_HASH = auth.hashPassword(password);
process.env.SESSION_SECRET = randomBytes(32).toString('hex');
const task = { id:'test-task', title:'Teste', date:'2026-11-02', category:'AtlasNex', priority:'high', revenue:0, notes:'', done:false, stage:'todo' };
function response() {
 return { headers:{}, setHeader(k,v) { this.headers[k]=v; }, end(data) { this.data=JSON.parse(data); } };
}
function request(method, data, authenticated=true) {
 return { method, body:data, headers:{host:'localhost:3000',origin:'http://localhost:3000','content-type':'application/json',cookie:authenticated ? `atlasnex_session=${auth.sessionToken()}` : ''}, socket:{remoteAddress:'127.0.0.1'} };
}
test('session password, signature and expiry checks', () => {
 assert.equal(auth.validPassword(password),true);
 assert.equal(auth.validPassword('wrong'),false);
 assert.equal(auth.authenticated(request('GET')),true);
 const req=request('GET');req.headers.cookie='atlasnex_session='+auth.sessionToken(Date.now()-86400000);
 assert.equal(auth.authenticated(req),false);
 req.headers.cookie='atlasnex_session=99999999999.forged';assert.equal(auth.authenticated(req),false);
});
test('API rejects anonymous access and cross-origin writes before querying database', async () => {
 let res=response();await tasksHandler(request('GET',null,false),res);assert.equal(res.statusCode,401);
 const req=request('PUT',{tasks:[task],revision:0});req.headers.origin='https://attacker.example';
 res=response();await tasksHandler(req,res);assert.equal(res.statusCode,403);
});
test('validation rejects duplicate IDs, injected IDs, invalid dates and non-finite amounts', () => {
 for (const list of [[task,task],[{...task,id:'"><script>'}],[{...task,date:'2026-02-31'}],[{...task,revenue:Infinity}]]) assert.throws(()=>validatePlan({tasks:list,revision:0}));
 assert.deepEqual(validatePlan({tasks:[task],revision:0}),[task]);
});
test('API reads, writes and refuses stale revisions with repository test double', async () => {
 const original={...db};let stored=null,revision=0;
 db.readPlan=async()=>({tasks:stored,revision});
 db.writePlan=async(tasks,expected)=>{if(expected!==revision)return null;stored=tasks;return ++revision;};
 try {
  let res=response();await tasksHandler(request('GET'),res);assert.equal(res.data.tasks,null);
  res=response();await tasksHandler(request('PUT',{tasks:[task],revision:0}),res);assert.equal(res.statusCode,200);assert.equal(res.data.revision,1);
  res=response();await tasksHandler(request('PUT',{tasks:[],revision:0}),res);assert.equal(res.statusCode,409);
  res=response();await tasksHandler(request('GET'),res);assert.deepEqual(res.data.tasks,[task]);
 } finally { Object.assign(db,original); }
});
test('login requires correct password, rate limit and logout clears cookie', async () => {
 const original=db.loginAllowed;db.loginAllowed=async()=>true;
 try {
  let res=response();await sessionHandler(request('POST',{password:'wrong'},false),res);assert.equal(res.statusCode,401);
  res=response();await sessionHandler(request('POST',{password},false),res);assert.equal(res.statusCode,200);assert.match(res.headers['Set-Cookie'],/HttpOnly/);
  db.loginAllowed=async()=>false;
  res=response();await sessionHandler(request('POST',{password},false),res);assert.equal(res.statusCode,429);
  res=response();await sessionHandler(request('DELETE'),res);assert.match(res.headers['Set-Cookie'],/Max-Age=0/);
 } finally { db.loginAllowed=original; }
});

test('Vercel password configuration accepts correct password and rejects weak configuration', async () => {
 const hash = process.env.ADMIN_PASSWORD_HASH;
 const previous = process.env.ADMIN_PASSWORD;
 const original = db.loginAllowed;
 delete process.env.ADMIN_PASSWORD_HASH;
 process.env.ADMIN_PASSWORD = password;
 db.loginAllowed = async () => true;
 try {
  assert.equal(auth.ready(), true);
  assert.equal(auth.validPassword(password), true);
  assert.equal(auth.validPassword('wrong'), false);
  const res = response();
  await sessionHandler(request('POST', { password }, false), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], /HttpOnly/);
  process.env.ADMIN_PASSWORD = 'short';
  assert.equal(auth.ready(), false);
  process.env.ADMIN_PASSWORD = password;
  process.env.ADMIN_PASSWORD_HASH = 'invalid';
  assert.equal(auth.ready(), false);
 } finally {
  process.env.ADMIN_PASSWORD_HASH = hash;
  if (previous === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previous;
  db.loginAllowed = original;
 }
});
