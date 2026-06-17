(function () {
  "use strict";

  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const priorityColors = {
    high: "#fb7185",
    medium: "#d4af37",
    low: "#22c55e"
  };

  function renderCalendar(container, titleElement, date, tasks, onDayClick) {
    container.innerHTML = "";
    const monthName = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    titleElement.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    weekdays.forEach((weekday) => {
      const cell = document.createElement("div");
      cell.className = "weekday";
      cell.textContent = weekday;
      container.appendChild(cell);
    });

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const todayIso = AtlasStorage.toISODate(new Date());

    for (let index = 0; index < 42; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const iso = AtlasStorage.toISODate(day);
      const dayTasks = tasks.filter((task) => task.date === iso);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "day";
      button.setAttribute("aria-label", `Adicionar tarefa em ${day.toLocaleDateString("pt-BR")}`);
      if (day.getMonth() !== date.getMonth()) button.classList.add("out");
      if (iso === todayIso) button.classList.add("today");
      button.addEventListener("click", () => onDayClick(iso));

      const dots = dayTasks
        .slice(0, 4)
        .map((task) => `<i class="dot" style="background:${priorityColors[task.priority] || priorityColors.medium}"></i>`)
        .join("");
      const miniTasks = dayTasks
        .slice(0, 3)
        .map((task) => `<span class="mini-task">${AtlasTasks.escapeHtml(task.title)}</span>`)
        .join("");

      button.innerHTML = `
        <span class="day-number">
          <span>${day.getDate()}</span>
          <span class="day-dots">${dots}</span>
        </span>
        ${miniTasks}
      `;
      container.appendChild(button);
    }
  }

  window.AtlasCalendar = {
    renderCalendar
  };
})();
