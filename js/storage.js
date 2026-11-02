(function () {
  "use strict";

  const STORAGE_KEY = "atlasnex_action_planner_mvp_4_weeks_v2";

  const fallbackSeed = [
    {
      title: "Semana 1: definir problema, público e promessa do MVP",
      date: "2026-08-04",
      category: "AtlasNex",
      priority: "high",
      revenue: 0,
      notes: "Registrar o problema principal, o público inicial, a promessa de resultado e o critério de sucesso do MVP AtlasNex.",
      stage: "todo"
    },
    {
      title: "Escolher a oferta MVP e limitar o escopo",
      date: "2026-08-06",
      category: "Produto",
      priority: "high",
      revenue: 0,
      notes: "Definir uma entrega vendável em até 7 dias e deixar fora tudo que não ajuda vender, entregar ou medir resultado.",
      stage: "todo"
    },
    {
      title: "Semana 2: montar estrutura técnica do MVP",
      date: "2026-08-11",
      category: "SaaS",
      priority: "high",
      revenue: 0,
      notes: "Criar telas base, fluxo principal, persistência e checklist de aceite.",
      stage: "todo"
    },
    {
      title: "Semana 3: convidar 10 pessoas para validar o MVP",
      date: "2026-08-18",
      category: "Prospecção",
      priority: "high",
      revenue: 0,
      notes: "Enviar convites, fazer entrevistas e registrar objeções, pedidos de ajuste e disposição de pagar.",
      stage: "todo"
    },
    {
      title: "Semana 4: fechar primeira venda do MVP",
      date: "2026-08-25",
      category: "Financeiro",
      priority: "high",
      revenue: 997,
      notes: "Fazer follow-up ativo nas propostas e buscar pelo menos uma confirmação paga.",
      stage: "todo"
    },
    {
      title: "Revisar MVP completo e decidir próximos 30 dias",
      date: "2026-08-31",
      category: "AtlasNex",
      priority: "high",
      revenue: 0,
      notes: "Fechar retrospectiva: o que vender, o que cortar, o que automatizar e qual será a próxima oferta AtlasNex.",
      stage: "todo"
    }
  ];

  function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return `task_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + Number(days || 0));
    return next;
  }

  function toISODate(date) {
    const value = new Date(date);
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeTask(task) {
    return {
      id: task.id || makeId(),
      title: String(task.title || "").trim(),
      date: task.date || toISODate(new Date()),
      category: task.category || "Prospecção",
      priority: task.priority || "medium",
      revenue: Number(task.revenue || 0),
      notes: task.notes || "",
      done: Boolean(task.done),
      stage: task.stage || (task.done ? "done" : "todo")
    };
  }

  function buildSeedTasks(seedItems) {
    const today = new Date();
    return seedItems.map((item) => normalizeTask({
      ...item,
      id: makeId(),
      date: item.date || toISODate(addDays(today, item.offsetDays || 0)),
      done: false
    }));
  }

  async function fetchSeedTasks() {
    try {
      const response = await fetch("data/seed-tasks.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Seed indisponível");
      const data = await response.json();
      return Array.isArray(data) ? data : fallbackSeed;
    } catch (error) {
      return fallbackSeed;
    }
  }

  let revision = null;

  async function request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Não foi possível acessar o servidor.");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function loadTasks() {
    const plan = await request("/api/tasks");
    revision = plan.revision;
    if (plan.tasks !== null) return plan.tasks.map(normalizeTask);
    const tasks = buildSeedTasks(await fetchSeedTasks());
    try { await saveTasks(tasks); }
    catch (error) {
      if (error.status === 409) return loadTasks();
      throw error;
    }
    return tasks;
  }

  async function saveTasks(tasks) {
    if (revision === null) throw new Error("Carregue o plano antes de salvar.");
    const result = await request("/api/tasks", {
      method: "PUT",
      body: JSON.stringify({ tasks: tasks.map(normalizeTask), revision })
    });
    revision = result.revision;
  }

  async function restoreSeed() {
    return buildSeedTasks(await fetchSeedTasks());
  }

  function exportTasks(tasks) {
    const payload = {
      app: "AtlasNex Action Planner",
      version: 2,
      plan: "MVP completo em 4 semanas",
      exportedAt: new Date().toISOString(),
      tasks: tasks.map(normalizeTask)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atlasnex-mvp-4-semanas-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importTasks(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const importedTasks = Array.isArray(parsed) ? parsed : parsed.tasks;
          if (!Array.isArray(importedTasks)) throw new Error("Formato inválido");
          const tasks = importedTasks.map(normalizeTask).filter((task) => task.title);
          resolve(tasks);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  window.AtlasStorage = {
    STORAGE_KEY,
    request,
    makeId,
    toISODate,
    loadTasks,
    saveTasks,
    restoreSeed,
    exportTasks,
    importTasks
  };
})();
