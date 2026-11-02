const { neon } = require('@neondatabase/serverless');
(async () => {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL em .env.local ou no ambiente.');
  const sql = neon(process.env.DATABASE_URL);
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS atlasnex_plan (id integer PRIMARY KEY CHECK (id = 1), tasks jsonb, revision integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now())`,
    sql`INSERT INTO atlasnex_plan (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
    sql`CREATE TABLE IF NOT EXISTS atlasnex_login_attempts (key text PRIMARY KEY, attempts integer NOT NULL, window_start timestamptz NOT NULL)`
  ]);
  console.log('Schema AtlasNex preparado; dados existentes preservados.');
})().catch(() => { console.error('Falha ao preparar o schema. Verifique DATABASE_URL, acesso ao Neon e permissões de criação de tabelas.'); process.exitCode = 1; });
