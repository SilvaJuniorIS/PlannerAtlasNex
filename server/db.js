const { neon } = require('@neondatabase/serverless');
function database() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error('Banco não configurado.'), { status: 503 });
  return neon(process.env.DATABASE_URL);
}
async function readPlan() {
  const sql = database();
  const [row] = await sql`SELECT tasks, revision FROM atlasnex_plan WHERE id = 1`;
  if (!row) throw new Error('Schema ausente.');
  return { tasks: row.tasks, revision: Number(row.revision) };
}
async function writePlan(tasks, revision) {
  const sql = database();
  const [row] = await sql`UPDATE atlasnex_plan SET tasks = ${JSON.stringify(tasks)}::jsonb, revision = revision + 1, updated_at = now() WHERE id = 1 AND revision = ${revision} RETURNING revision`;
  return row ? Number(row.revision) : null;
}
async function loginAllowed(key) {
  const sql = database();
  const [row] = await sql`INSERT INTO atlasnex_login_attempts (key, attempts, window_start) VALUES (${key}, 1, now()) ON CONFLICT (key) DO UPDATE SET attempts = CASE WHEN atlasnex_login_attempts.window_start < now() - interval '15 minutes' THEN 1 ELSE atlasnex_login_attempts.attempts + 1 END, window_start = CASE WHEN atlasnex_login_attempts.window_start < now() - interval '15 minutes' THEN now() ELSE atlasnex_login_attempts.window_start END RETURNING attempts`;
  return row.attempts <= 10;
}
module.exports = { readPlan, writePlan, loginAllowed };
