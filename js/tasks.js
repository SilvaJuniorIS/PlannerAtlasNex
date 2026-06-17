(function () {
  "use strict";

  const categories = ["Prospecção", "Conteúdo", "Produto", "Entrega", "Financeiro", "AtlasNex", "SaaS"];
  const priorities = [
    { value: "high", label: "Alta" },
    { value: "medium", label: "Média" },
    { value: "low", label: "Baixa" }
  ];
  const stages = [
    { value: "idea", label: "Ideia" },
    { value: "todo", label: "A fazer" },
    { value: "doing", label: "Em andamento" },
    { value: "done", label: "Concluído" },
    { value: "revenue", label: "Gerou receita" }
  ];

  function brMoney(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatDate(iso) {
    if (!iso) return "Sem data";
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function priorityLabel(priority) {
    return priorities.find((item) => item.value === priority)?.label || "Média";
  }

  function stageLabel(stage) {
    return stages.find((item) => item.value === stage)?.label || "A fazer";
  }

  function createTask(input) {
    return {
      id: input.id || AtlasStorage.makeId(),
      title: String(input.title || "").trim(),
      date: input.date || AtlasStorage.toISODate(new Date()),
      category: input.category || categories[0],
      priority: input.priority || "medium",
      revenue: Number(input.revenue || 0),
      notes: String(input.notes || "").trim(),
      done: Boolean(input.done),
      stage: input.stage || (input.done ? "done" : "todo")
    };
  }

  function upsertTask(tasks, task) {
    const normalized = createTask(task);
    const exists = tasks.some((item) => item.id === normalized.id);
    return exists
      ? tasks.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
      : [...tasks, normalized];
  }

  function deleteTask(tasks, id) {
    return tasks.filter((task) => task.id !== id);
  }

  function toggleTask(tasks, id) {
    return tasks.map((task) => {
      if (task.id !== id) return task;
      const done = !task.done;
      return { ...task, done, stage: done ? "done" : task.stage === "done" ? "todo" : task.stage };
    });
  }

  function moveTask(tasks, id, stage) {
    return tasks.map((task) => task.id === id
      ? { ...task, stage, done: stage === "done" || stage === "revenue" }
      : task);
  }

  function filterTasks(tasks, filters) {
    const term = String(filters.search || "").trim().toLocaleLowerCase("pt-BR");
    return tasks
      .filter((task) => !filters.category || task.category === filters.category)
      .filter((task) => {
        if (filters.status === "open") return !task.done;
        if (filters.status === "done") return task.done;
        return true;
      })
      .filter((task) => {
        if (!term) return true;
        return `${task.title} ${task.notes}`.toLocaleLowerCase("pt-BR").includes(term);
      })
      .sort((a, b) => `${a.date}${a.title}`.localeCompare(`${b.date}${b.title}`, "pt-BR"));
  }

  function calculateMetrics(tasks) {
    const todayIso = AtlasStorage.toISODate(new Date());
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartIso = AtlasStorage.toISODate(weekStart);
    const weekEndIso = AtlasStorage.toISODate(weekEnd);

    const done = tasks.filter((task) => task.done);
    const plannedRevenue = tasks.reduce((sum, task) => sum + Number(task.revenue || 0), 0);
    const doneRevenue = done.reduce((sum, task) => sum + Number(task.revenue || 0), 0);
    const overdue = tasks.filter((task) => !task.done && task.date < todayIso).length;
    const weekTasks = tasks.filter((task) => task.date >= weekStartIso && task.date <= weekEndIso).length;

    return {
      total: tasks.length,
      done: done.length,
      percent: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0,
      plannedRevenue,
      doneRevenue,
      openRevenue: plannedRevenue - doneRevenue,
      overdue,
      weekTasks,
      phase: "Fase 1",
      focus: "Fundação comercial e primeiros clientes"
    };
  }

  window.AtlasTasks = {
    categories,
    priorities,
    stages,
    brMoney,
    formatDate,
    escapeHtml,
    priorityLabel,
    stageLabel,
    createTask,
    upsertTask,
    deleteTask,
    toggleTask,
    moveTask,
    filterTasks,
    calculateMetrics
  };
})();
