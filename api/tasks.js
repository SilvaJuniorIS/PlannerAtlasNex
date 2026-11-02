const auth = require('../server/auth');
const db = require('../server/db');
const { send, sameOrigin, body } = require('../server/http');
const { validatePlan } = require('../server/validate');
module.exports = async function handler(req,res) {
  try {
    if (!auth.ready()) return send(res,503,{error:'Acesso privado não configurado.'});
    if (!auth.authenticated(req)) return send(res,401,{error:'Entre novamente para acessar o planner.'});
    if (req.method === 'GET') return send(res,200,await db.readPlan());
    if (req.method !== 'PUT') { res.setHeader('Allow','GET, PUT'); return send(res,405,{error:'Método inválido.'}); }
    if (!sameOrigin(req)) return send(res,403,{error:'Origem inválida.'});
    const data = await body(req);
    let tasks;
    try { tasks = validatePlan(data); } catch (error) { return send(res,400,{error:error.message}); }
    const revision = await db.writePlan(tasks,data.revision);
    if (revision === null) return send(res,409,{error:'O plano mudou em outro dispositivo. Recarregue antes de tentar novamente.'});
    return send(res,200,{revision});
  } catch (error) { return send(res,error.status || 503,{error:error.status ? error.message : 'Não foi possível acessar o banco. Tente novamente.'}); }
};
