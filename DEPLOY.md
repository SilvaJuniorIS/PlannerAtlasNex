# Publicar AtlasNex na Vercel com Neon

Use as mesmas contas, mas crie projetos separados para o AtlasNex. Esta versão é um painel privado com uma senha compartilhada e um plano único; não oferece contas individuais. As tarefas ficam no Neon, com leitura ao entrar/recarregar e proteção contra sobrescrever uma revisão antiga. Não há sincronização em tempo real nem gravação offline.

## 1. Enviar o código

Revise as alterações e envie esta versão ao repositório SilvaJuniorIS/PlannerAtlasNex. Os arquivos novos e modificados precisam estar no GitHub antes de importar na Vercel. Nunca envie .env.local ou credenciais. O workflow antigo de GitHub Pages não executa as APIs e não serve esta versão completa.

## 2. Criar o Neon

No console do Neon, crie um projeto `atlasnex`, escolha uma região próxima da região das funções Vercel e use uma branch de produção dedicada. Em Connect, copie a conexão PostgreSQL com SSL e mantenha-a privada. Não reutilize o banco de outros aplicativos.

Crie `.env.local` na raiz, seguindo `.env.example`, e coloque a conexão em `DATABASE_URL`. Instale e prepare o schema:

```bash
npm ci --cache /tmp/atlasnex-npm-cache
npm run db:setup
```

O comando cria `atlasnex_plan` e `atlasnex_login_attempts`, preserva registros existentes e pode ser repetido. Ele precisa de uma conexão Neon real acessível. Não execute testes com o banco de produção.

## 3. Configurar o acesso privado

Escolha uma senha única com pelo menos 16 caracteres. Em um terminal Bash confiável, na raiz do projeto, gere o hash sem colocar a senha no histórico:

```bash
read -rs -p 'Senha do painel: ' ATLAS_PASSWORD
printf '\n'
printf '%s' "$ATLAS_PASSWORD" | npm run --silent password:hash
unset ATLAS_PASSWORD
```

Guarde o resultado como `ADMIN_PASSWORD_HASH` nas variáveis privadas do projeto Vercel. Não é a senha original. Gere `SESSION_SECRET` com um gerador de segredos; por exemplo, execute localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use valores exclusivos deste projeto. Alterar SESSION_SECRET encerra todas as sessões. Para revogar acesso ao trocar a senha, troque também SESSION_SECRET. Sessões duram 12 horas. O login permite até 10 tentativas por endereço em uma janela de 15 minutos, persistidas no banco.

## 4. Criar a Vercel

Importe o repositório em um novo projeto `atlasnex`. Selecione framework Other e a raiz do repositório. O arquivo vercel.json define a instalação, o build e a pasta public; não selecione exportação estática que elimine as funções em api/.

Em Settings > Environment Variables configure:

| Nome | Conteúdo privado |
| --- | --- |
| DATABASE_URL | Conexão PostgreSQL do Neon com SSL |
| ADMIN_PASSWORD_HASH | Hash gerado no passo 3 |
| SESSION_SECRET | Segredo aleatório exclusivo |

Configure Production antes de publicar. Para Preview/Development, use banco/branch Neon separado e outros segredos; não exponha dados de produção em previews. Não prefixe essas variáveis com NEXT_PUBLIC_, VITE_ ou outro prefixo de exposição ao navegador.

Publique na Vercel. Se as variáveis forem alteradas depois, faça novo deployment. As APIs são funções Node e o frontend é estático. O build copia apenas os arquivos públicos, sem código de servidor, documentos internos ou .env.

## 5. Validar e migrar dados

Abra o domínio HTTPS gerado, entre e confirme as 28 tarefas iniciais. Crie uma tarefa, abra em outro navegador/dispositivo, entre e confira a tarefa. Recarregue a página para buscar alterações de outro dispositivo. Saia e confirme que o acesso ao plano exige login.

Os dados antigos de localStorage não são enviados automaticamente. No site antigo, exporte JSON. No site novo, use Importar JSON; confirme apenas depois de conferir o backup, pois ele substitui o plano compartilhado. Guarde uma cópia do backup antes da migração. Restaurar iniciais também substitui o plano de todos os dispositivos.

Se outro dispositivo tiver alterado o plano, um salvamento antigo recebe conflito, sem sobrescrever o banco. A interface oferece baixar uma cópia da tentativa e permite atualizar a página antes de repetir a edição.

## Desenvolvimento e validação

Use o checkout existente, sem criar worktrees para preparar o ambiente. Após configurar `.env.local`, execute `npm run dev` (porta 3000 por padrão). `npm test` verifica autenticação, autorização, validação e conflitos com um substituto de banco em memória. `npm run build` prepara public/. Os testes não validam a conta Neon nem a publicação Vercel; esses passos exigem os acessos reais e as verificações do passo 5.
