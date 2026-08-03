# AtlasNex Action Planner

Aplicação web estática para acompanhar um ciclo de MVP completo da ISJ Representações / AtlasNex em 4 semanas, começando em 04/08/2026 e terminando em 31/08/2026.

## Funcionalidades

- Calendário mensal com navegação por mês e destaque do dia atual.
- Cadastro, edição, exclusão e conclusão de tarefas.
- Checklist filtrável por categoria, status e busca textual.
- Organização por prioridade, categoria, valor financeiro previsto e etapa Kanban.
- KPIs de meta mensal, conclusão, receita planejada, receita concluída, tarefas atrasadas e tarefas da semana.
- Persistência automática via `localStorage`.
- Exportação e importação de backup em JSON.
- Restauração das tarefas iniciais.
- PWA básico com `manifest.json` e service worker para uso offline após o primeiro carregamento.
- Preparado para publicação direta no GitHub Pages.
- Roteiro inicial com 28 tarefas distribuídas entre descoberta, protótipo, validação e lançamento.
- Manual detalhado em `manual.html`.

## Estrutura

```txt
.
├── index.html
├── README.md
├── manifest.json
├── sw.js
├── assets/
│   └── logo-isj.svg
├── css/
│   └── styles.css
├── data/
│   └── seed-tasks.json
└── js/
    ├── app.js
    ├── calendar.js
    ├── storage.js
    └── tasks.js
```

## Como rodar localmente

Abra a pasta do projeto e sirva os arquivos com um servidor estático:

```powershell
python -m http.server 4173
```

Depois acesse `http://localhost:4173`.

## Publicação no GitHub Pages

1. Envie os arquivos para a branch `main`.
2. No GitHub, abra `Settings > Pages`.
3. Em `Build and deployment`, selecione `Deploy from a branch`.
4. Escolha `main` e `/root`.
5. Aguarde a URL pública ser gerada.

## Dados

Os dados ficam salvos no navegador com a chave:

```js
atlasnex_action_planner_v1
```

A versão atual do ciclo MVP usa:

```js
atlasnex_action_planner_mvp_4_weeks_v2
```

Use os botões de exportar e importar JSON para backup ou migração manual entre navegadores.

## Próximos passos sugeridos

- Fechar a primeira venda do MVP e transformar o aprendizado em versão 2.
- Criar autenticação e sincronização por usuário com Supabase.
- Adicionar tabela `tasks` com Row Level Security.
- Evoluir o dashboard financeiro com pipeline, funil e gráfico mensal.
- Transformar o Kanban em fluxo com arrastar e soltar.
