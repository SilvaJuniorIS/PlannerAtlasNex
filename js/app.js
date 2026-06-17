(function () {
  "use strict";

  let tasks = [];
  let currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let activeView = "calendar";

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();
    fillSelects();
    bindEvents();
    els.quickDate.value = AtlasStorage.toISODate(new Date());
    tasks = await AtlasStorage.loadTasks();
    renderAll();
    registerServiceWorker();
  }

  function cacheElements() {
    [
      "newTaskButton", "exportButton", "importInput", "restoreButton", "filterCategory",
      "filterStatus", "filterSearch", "quickForm", "quickTitle", "quickDate",
      "quickCategory", "quickPriority", "quickRevenue", "calendar", "monthTitle",
      "prevMonthButton", "nextMonthButton", "taskList", "kanbanBoard", "doneCount",
      "doneProgress", "plannedRevenue", "revenueSplit", "currentPhase", "weekFocus",
      "overdueCount", "weekCount", "listSummary", "taskModal", "taskForm", "modalTitle",
      "closeModalButton", "cancelModalButton", "taskId", "taskTitle", "taskDate",
      "taskCategory", "taskPriority", "taskStage", "taskRevenue", "taskNotes"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function fillSelects() {
    const categoryOptions = AtlasTasks.categories.map((category) => `<option>${category}</option>`).join("");
    els.filterCategory.insertAdjacentHTML("beforeend", categoryOptions);
    els.quickCategory.innerHTML = categoryOptions;
    els.taskCategory.innerHTML = categoryOptions;

    const priorityOptions = AtlasTasks.priorities
      .map((priority) => `<option value="${priority.value}">${priority.label}</option>`)
      .join("");
    els.quickPriority.innerHTML = priorityOptions;
    els.quickPriority.value = "medium";
    els.taskPriority.innerHTML = priorityOptions;

    els.taskStage.innerHTML = AtlasTasks.stages
      .map((stage) => `<option value="${stage.value}">${stage.label}</option>`)
      .join("");
  }

  function bindEvents() {
    els.newTaskButton.addEventListener("click", () => openTaskModal());
    els.exportButton.addEventListener("click", () => AtlasStorage.exportTasks(tasks));
    els.importInput.addEventListener("change", importBackup);
    els.restoreButton.addEventListener("click", restoreInitialTasks);
    els.quickForm.addEventListener("submit", addQuickTask);
    els.prevMonthButton.addEventListener("click", () => changeMonth(-1));
    els.nextMonthButton.addEventListener("click", () => changeMonth(1));
    els.filterCategory.addEventListener("change", renderAll);
    els.filterStatus.addEventListener("change", renderAll);
    els.filterSearch.addEventListener("input", renderAll);
    els.taskForm.addEventListener("submit", saveModalTask);
    els.closeModalButton.addEventListener("click", closeTaskModal);
    els.cancelModalButton.addEventListener("click", closeTaskModal);

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && els.taskModal.open) closeTaskModal();
    });
  }

  function getFilters() {
    return {
      category: els.filterCategory.value,
      status: els.filterStatus.value,
      search: els.filterSearch.value
    };
  }

  function renderAll() {
    const filteredTasks = AtlasTasks.filterTasks(tasks, getFilters());
    renderKPIs();
    AtlasCalendar.renderCalendar(els.calendar, els.monthTitle, currentMonth, filteredTasks, (date) => openTaskModal({ date }));
    renderTaskList(filteredTasks);
    renderKanban(filteredTasks);
  }

  function renderKPIs() {
    const metrics = AtlasTasks.calculateMetrics(tasks);
    els.doneCount.textContent = `${metrics.done}/${metrics.total}`;
    els.doneProgress.style.width = `${metrics.percent}%`;
    els.plannedRevenue.textContent = AtlasTasks.brMoney(metrics.plannedRevenue);
    els.revenueSplit.textContent = `${AtlasTasks.brMoney(metrics.doneRevenue)} concluídos · ${AtlasTasks.brMoney(metrics.openRevenue)} em aberto`;
    els.currentPhase.textContent = metrics.phase;
    els.weekFocus.textContent = metrics.focus;
    els.overdueCount.textContent = metrics.overdue;
    els.weekCount.textContent = `${metrics.weekTasks} tarefas nesta semana`;
  }

  function renderTaskList(items) {
    els.listSummary.textContent = `${items.length} ${items.length === 1 ? "tarefa" : "tarefas"}`;
    if (!items.length) {
      els.taskList.innerHTML = `<div class="empty-state">Nenhuma tarefa encontrada para os filtros atuais.</div>`;
      return;
    }

    els.taskList.innerHTML = items.map((task) => `
      <article class="task-card ${task.done ? "done" : ""}">
        <input class="task-check" type="checkbox" ${task.done ? "checked" : ""} data-action="toggle" data-id="${task.id}" aria-label="Alternar conclusão" />
        <div>
          <h3 class="task-title">${AtlasTasks.escapeHtml(task.title)}</h3>
          <div class="meta">
            <span class="tag">${AtlasTasks.formatDate(task.date)}</span>
            <span class="tag">${AtlasTasks.escapeHtml(task.category)}</span>
            <span class="tag ${task.priority}">${AtlasTasks.priorityLabel(task.priority)}</span>
            <span class="tag">${AtlasTasks.stageLabel(task.stage)}</span>
            ${task.revenue > 0 ? `<span class="tag">${AtlasTasks.brMoney(task.revenue)}</span>` : ""}
          </div>
          ${task.notes ? `<p class="task-notes">${AtlasTasks.escapeHtml(task.notes)}</p>` : ""}
        </div>
        <div class="task-actions">
          <button class="btn" type="button" data-action="edit" data-id="${task.id}">Editar</button>
          <button class="btn danger" type="button" data-action="delete" data-id="${task.id}">Excluir</button>
        </div>
      </article>
    `).join("");

    els.taskList.querySelectorAll("[data-action]").forEach((element) => {
      element.addEventListener("click", handleTaskAction);
    });
  }

  function renderKanban(items) {
    els.kanbanBoard.innerHTML = AtlasTasks.stages.map((stage) => {
      const stageTasks = items.filter((task) => task.stage === stage.value || (stage.value === "done" && task.done && task.stage === "todo"));
      const cards = stageTasks.length
        ? stageTasks.map((task) => `
          <article class="kanban-card">
            <strong>${AtlasTasks.escapeHtml(task.title)}</strong>
            <span class="tag ${task.priority}">${AtlasTasks.priorityLabel(task.priority)}</span>
            <span class="tag">${AtlasTasks.formatDate(task.date)}</span>
            <select data-action="move" data-id="${task.id}" aria-label="Mover tarefa">
              ${AtlasTasks.stages.map((item) => `<option value="${item.value}" ${item.value === task.stage ? "selected" : ""}>${item.label}</option>`).join("")}
            </select>
            <button class="btn" type="button" data-action="edit" data-id="${task.id}">Editar</button>
          </article>
        `).join("")
        : `<div class="empty-state">Sem tarefas</div>`;
      return `
        <div class="kanban-column">
          <h3>${stage.label}</h3>
          ${cards}
        </div>
      `;
    }).join("");

    els.kanbanBoard.querySelectorAll("[data-action]").forEach((element) => {
      element.addEventListener("click", handleTaskAction);
      element.addEventListener("change", handleTaskAction);
    });
  }

  function handleTaskAction(event) {
    const action = event.currentTarget.dataset.action;
    const id = event.currentTarget.dataset.id;

    if (action === "toggle") {
      tasks = AtlasTasks.toggleTask(tasks, id);
      persistAndRender();
    }

    if (action === "edit") openTaskModal(tasks.find((task) => task.id === id));

    if (action === "delete") {
      if (confirm("Deseja excluir esta tarefa?")) {
        tasks = AtlasTasks.deleteTask(tasks, id);
        persistAndRender();
      }
    }

    if (action === "move") {
      tasks = AtlasTasks.moveTask(tasks, id, event.currentTarget.value);
      persistAndRender();
    }
  }

  function addQuickTask(event) {
    event.preventDefault();
    const task = AtlasTasks.createTask({
      title: els.quickTitle.value,
      date: els.quickDate.value,
      category: els.quickCategory.value,
      priority: els.quickPriority.value,
      revenue: els.quickRevenue.value,
      stage: "todo"
    });
    if (!task.title) return;
    tasks = AtlasTasks.upsertTask(tasks, task);
    els.quickForm.reset();
    els.quickDate.value = AtlasStorage.toISODate(new Date());
    els.quickPriority.value = "medium";
    persistAndRender();
  }

  function saveModalTask(event) {
    event.preventDefault();
    const current = tasks.find((task) => task.id === els.taskId.value);
    const task = AtlasTasks.createTask({
      id: els.taskId.value || undefined,
      title: els.taskTitle.value,
      date: els.taskDate.value,
      category: els.taskCategory.value,
      priority: els.taskPriority.value,
      stage: els.taskStage.value,
      revenue: els.taskRevenue.value,
      notes: els.taskNotes.value,
      done: current?.done || els.taskStage.value === "done" || els.taskStage.value === "revenue"
    });
    if (!task.title) return;
    tasks = AtlasTasks.upsertTask(tasks, task);
    closeTaskModal();
    persistAndRender();
  }

  function openTaskModal(defaults = {}) {
    const editing = Boolean(defaults.id);
    els.modalTitle.textContent = editing ? "Editar tarefa" : "Nova tarefa";
    els.taskId.value = defaults.id || "";
    els.taskTitle.value = defaults.title || "";
    els.taskDate.value = defaults.date || AtlasStorage.toISODate(new Date());
    els.taskCategory.value = defaults.category || "Prospecção";
    els.taskPriority.value = defaults.priority || "medium";
    els.taskStage.value = defaults.stage || (defaults.done ? "done" : "todo");
    els.taskRevenue.value = defaults.revenue || 0;
    els.taskNotes.value = defaults.notes || "";

    if (typeof els.taskModal.showModal === "function") els.taskModal.showModal();
    else els.taskModal.setAttribute("open", "");
    els.taskTitle.focus();
  }

  function closeTaskModal() {
    if (typeof els.taskModal.close === "function") els.taskModal.close();
    else els.taskModal.removeAttribute("open");
  }

  function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderAll();
  }

  async function restoreInitialTasks() {
    if (!confirm("Isso substituirá as tarefas salvas neste navegador pelas tarefas iniciais. Continuar?")) return;
    tasks = await AtlasStorage.restoreSeed();
    renderAll();
  }

  async function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      tasks = await AtlasStorage.importTasks(file);
      renderAll();
      alert("Backup importado com sucesso.");
    } catch (error) {
      alert("Não foi possível importar este JSON.");
    } finally {
      event.target.value = "";
    }
  }

  function persistAndRender() {
    AtlasStorage.saveTasks(tasks);
    renderAll();
  }

  function setView(view) {
    activeView = view;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === activeView);
    });
    document.querySelectorAll(".view").forEach((section) => {
      section.classList.toggle("active", section.id === `${activeView}View`);
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
