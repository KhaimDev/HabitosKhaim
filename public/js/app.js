// Arranque, navegación y delegación de eventos.

import {
  load, save, state, subscribe, rollover,
  toggleHabit, toggleDailyTask, toggleTodo,
  removeHabit, moveHabit, removeDailyTask, removeTodo,
} from "./store.js";
import { VIEWS, mountLog } from "./views.js";
import { habitForm, dailyTaskForm, todoForm } from "./forms.js";
import { exportData, importData, wipeData } from "./backup.js";
import { confirmSheet, toast } from "./ui.js";
import { dayProgress } from "./stats.js";
import { dateKey, longDate, nowTime } from "./utils.js";

let current = localStorage.getItem("khaim.view") || "today";

const viewEl = () => document.getElementById("view");

function navHtml() {
  return Object.entries(VIEWS)
    .map(([k, v]) => `<button class="tab" data-view="${k}" ${k === current ? 'aria-current="page"' : ""}>${v.icon}<span>${v.label}</span></button>`)
    .join("");
}

function renderNav() {
  const html = navHtml();
  document.getElementById("tabbar").innerHTML = html;
  document.getElementById("sidenav").innerHTML = html;
}

function renderTop() {
  const p = dayProgress(dateKey());
  document.getElementById("topbar-date").textContent = longDate(dateKey());
  document.getElementById("clock").textContent = nowTime();
  const ring = document.getElementById("topbar-ring");
  ring.style.setProperty("--p", p.pct);
  document.getElementById("topbar-pct").textContent = `${p.pct}%`;
}

function render() {
  const el = viewEl();
  el.innerHTML = VIEWS[current].render();
  if (current === "log") mountLog(el);
  renderNav();
  renderTop();
}

function go(view) {
  current = view;
  localStorage.setItem("khaim.view", view);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- eventos ---------- */
document.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-view]");
  if (tab) return go(tab.dataset.view);

  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const { act, id } = btn.dataset;

  switch (act) {
    case "toggle-habit": {
      toggleHabit(id);
      const h = state.habits.find((x) => x.id === id);
      const p = dayProgress(dateKey());
      if (p.complete) toast("Día completo. Racha viva.");
      else if (h) toast(`${h.name} · ${p.done}/${p.total}`);
      break;
    }
    case "toggle-dtask": toggleDailyTask(id); break;
    case "toggle-todo": toggleTodo(id); break;
    case "new-habit": habitForm(); break;
    case "edit-habit": habitForm(state.habits.find((h) => h.id === id)); break;
    case "del-habit": {
      const h = state.habits.find((x) => x.id === id);
      confirmSheet({
        title: `Eliminar “${h?.name || ""}”`,
        sub: "El hábito desaparece de tu rutina. El historial de días anteriores se conserva.",
        confirmLabel: "Eliminar",
        onConfirm: () => { removeHabit(id); toast("Hábito eliminado"); },
      });
      break;
    }
    case "up": moveHabit(id, -1); break;
    case "down": moveHabit(id, 1); break;
    case "new-dtask": dailyTaskForm(); break;
    case "edit-dtask": dailyTaskForm(state.dailyTasks.find((t) => t.id === id)); break;
    case "del-dtask": removeDailyTask(id); toast("Tarea eliminada"); break;
    case "new-todo": todoForm(); break;
    case "edit-todo": todoForm(state.todos.find((t) => t.id === id)); break;
    case "del-todo": removeTodo(id); toast("Pendiente eliminado"); break;
    case "go-log": go("log"); break;
    case "save-note": toast("Bitácora guardada"); break;
    case "export": exportData(); break;
    case "import": document.getElementById("import-file").click(); break;
    case "wipe": wipeData(); break;
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "import-file" && e.target.files?.[0]) {
    importData(e.target.files[0]);
    e.target.value = "";
  }
});

subscribe(() => render());

/* reloj + cambio de día automático */
setInterval(() => {
  renderTop();
  if (state.lastOpen !== dateKey()) { rollover(); render(); }
}, 20000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.lastOpen !== dateKey()) { rollover(); render(); }
});

load();
render();
