(function () {
  "use strict";

  const STORAGE_KEY = "atlasnex_action_planner_v1";

  const fallbackSeed = [
    {
      title: "Definir a promessa central da AtlasNex",
      offsetDays: 0,
      category: "AtlasNex",
      priority: "high",
      revenue: 0,
      notes: "Escrever uma frase clara: quem ajudamos, que dor resolvemos e qual resultado entregamos.",
      stage: "idea"
    },
    {
      title: "Montar lista de 50 potenciais clientes",
      offsetDays: 1,
      category: "Prospecção",
      priority: "high",
      revenue: 0,
      notes: "Priorizar pequenos negócios locais, prestadores de serviço, clínicas, escritórios, imobiliárias e comércios.",
      stage: "todo"
    },
    {
      title: "Criar oferta Diagnóstico Digital Express",
      offsetDays: 2,
      category: "Produto",
      priority: "high",
      revenue: 297,
      notes: "Definir escopo, preço, entrega, prazo e modelo de relatório.",
      stage: "todo"
    },
    {
      title: "Publicar 5 conteúdos sobre IA prática",
      offsetDays: 3,
      category: "Conteúdo",
      priority: "medium",
      revenue: 0,
      notes: "Conteúdos simples: antes/depois, automação, bastidor, erro comum e oportunidade.",
      stage: "doing"
    },
    {
      title: "Vender primeiro projeto Atlas Flow",
      offsetDays: 7,
      category: "Entrega",
      priority: "high",
      revenue: 2000,
      notes: "Projeto inicial de automação para WhatsApp, formulário, CRM simples ou atendimento.",
      stage: "todo"
    },
    {
      title: "Criar planilha de controle financeiro da transição",
      offsetDays: 8,
      category: "Financeiro",
      priority: "medium",
      revenue: 0,
      notes: "Controlar receita, custos, reserva, investimentos e meta mensal.",
      stage: "todo"
    },
    {
      title: "Desenhar MVP SaaS a partir dos serviços vendidos",
      offsetDays: 21,
      category: "SaaS",
      priority: "medium",
      revenue: 0,
      notes: "Somente avançar para SaaS com base em problema validado e repetido.",
      stage: "idea"
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

  async function loadTasks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedTasks = Array.isArray(parsed) ? parsed : parsed.tasks;
        if (Array.isArray(savedTasks)) return savedTasks.map(normalizeTask);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const seedItems = await fetchSeedTasks();
    const tasks = buildSeedTasks(seedItems);
    saveTasks(tasks);
    return tasks;
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.map(normalizeTask)));
  }

  async function restoreSeed() {
    const seedItems = await fetchSeedTasks();
    const tasks = buildSeedTasks(seedItems);
    saveTasks(tasks);
    return tasks;
  }

  function exportTasks(tasks) {
    const payload = {
      app: "AtlasNex Action Planner",
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: tasks.map(normalizeTask)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atlasnex-action-planner-backup.json";
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
          saveTasks(tasks);
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
    makeId,
    toISODate,
    loadTasks,
    saveTasks,
    restoreSeed,
    exportTasks,
    importTasks
  };
})();
