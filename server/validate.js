function validatePlan(data) {
  if (!data || !Number.isSafeInteger(data.revision) || data.revision < 0 || !Array.isArray(data.tasks) || data.tasks.length > 2000) throw new Error('Plano inválido (máximo de 2.000 tarefas).');
  const ids = new Set();
  for (const t of data.tasks) {
    if (!t || typeof t.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(t.id) || ids.has(t.id)) throw new Error('Identificador inválido ou duplicado.');
    ids.add(t.id);
    for (const [key, max] of [['title',500],['notes',10000],['category',100]]) {
      if (typeof t[key] !== 'string' || t[key].length > max || (key === 'title' && !t[key].trim())) throw new Error('Texto da tarefa inválido.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date) || !Number.isFinite(Date.parse(t.date)) || new Date(t.date).toISOString().slice(0,10) !== t.date) throw new Error('Data inválida.');
    if (!['high','medium','low'].includes(t.priority) || !['idea','todo','doing','done','revenue'].includes(t.stage) || typeof t.done !== 'boolean' || typeof t.revenue !== 'number' || !Number.isFinite(t.revenue) || t.revenue < 0 || t.revenue > 1e12) throw new Error('Campos da tarefa inválidos.');
  }
  return data.tasks.map(({id,title,date,category,priority,revenue,notes,done,stage}) => ({id,title,date,category,priority,revenue,notes,done,stage}));
}
module.exports = { validatePlan };
