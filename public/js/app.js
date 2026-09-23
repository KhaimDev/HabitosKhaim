import { load, state, subscribe, rollover, toggleHabit, toggleDailyTask, toggleTodo, snoozeAction, removeHabit, removeDailyTask, removeTodo, moveHabit } from "./store.js";
import { VIEWS } from "./views.js";
import { habitForm, dailyTaskForm, todoForm } from "./forms.js";
import { exportData, importData } from "./backup.js";
import { toast, confirmSheet } from "./ui.js";
import { dateKey, nowTime } from "./utils.js";

const savedView = localStorage.getItem("khaim.view");
let current = VIEWS[savedView] ? savedView : "home";
const view = () => document.getElementById("view");

function renderNav() {
  document.getElementById("tabbar").innerHTML = Object.entries(VIEWS).map(([key, item]) => `<button class="tab ${key === current ? "active" : ""}" data-view="${key}"><span>${item.icon}</span>${item.label}</button>`).join("");
}
function renderHeader() {
  document.getElementById("app-header").innerHTML = `<div class="mini-brand"><span class="mini-logo">V</span><span>VILLA</span></div><span class="mini-time">${nowTime()}</span>`;
}
function render() { view().innerHTML = VIEWS[current].render(); renderNav(); renderHeader(); }
function go(next) { current = next; localStorage.setItem("khaim.view", next); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

function actComplete(kind, id) { kind === "habit" ? toggleHabit(id) : toggleDailyTask(id); toast("Acción cumplida"); }
function undoComplete(kind, id) { kind === "habit" ? toggleHabit(id) : toggleDailyTask(id); toast("Marcada como pendiente"); }

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-view]"); if (tab) return go(tab.dataset.view);
  const button = event.target.closest("[data-act]"); if (!button) return;
  const { act, id, kind, hours } = button.dataset;
  if (act === "complete") return actComplete(kind, id);
  if (act === "undo-complete") return undoComplete(kind, id);
  if (act === "snooze") { snoozeAction(kind, id, Number(hours)); return toast(`Vuelve en ${hours} hora${hours === "1" ? "" : "s"}`); }
  if (act === "new-habit") return habitForm();
  if (act === "new-task") return dailyTaskForm();
  if (act === "new-todo") return todoForm();
  if (act === "edit-habit") return habitForm(state.habits.find((x) => x.id === id));
  if (act === "edit-task") return dailyTaskForm(state.dailyTasks.find((x) => x.id === id));
  if (act === "edit-todo") return todoForm(state.todos.find((x) => x.id === id));
  if (act === "toggle-todo") return toggleTodo(id);
  if (act === "delete-habit") return confirmSheet({ title: "Eliminar hábito", sub: "Se conserva su historial anterior.", confirmLabel: "Eliminar", onConfirm: () => removeHabit(id) });
  if (act === "delete-task") return confirmSheet({ title: "Eliminar tarea diaria", sub: "Se elimina de tus próximas acciones.", confirmLabel: "Eliminar", onConfirm: () => removeDailyTask(id) });
  if (act === "delete-todo") return confirmSheet({ title: "Eliminar pendiente", sub: "Esta acción no se puede deshacer.", confirmLabel: "Eliminar", onConfirm: () => removeTodo(id) });
  if (act === "move-up") return moveHabit(id, -1);
  if (act === "move-down") return moveHabit(id, 1);
  if (act === "export") return exportData();
  if (act === "import") return document.getElementById("import-file")?.click();
});
document.addEventListener("change", (event) => { if (event.target.id === "import-file" && event.target.files?.[0]) { importData(event.target.files[0]); event.target.value = ""; } });

let pointerStart = null;
document.addEventListener("pointerdown", (event) => { const card = event.target.closest("[data-card]"); if (card) { pointerStart = { card, y: event.clientY }; card.setPointerCapture?.(event.pointerId); } });
document.addEventListener("pointermove", (event) => { if (!pointerStart) return; const move = Math.min(0, event.clientY - pointerStart.y); pointerStart.card.style.setProperty("transform", `translate3d(0, ${move}px, 42px) rotateX(${move / 18}deg) rotateY(${move / 30}deg)`, "important"); });
document.addEventListener("pointerup", (event) => { if (!pointerStart) return; const { card, y } = pointerStart; const up = event.clientY - y < -95; pointerStart = null; card.style.removeProperty("transform"); if (up) actComplete(card.dataset.kind, card.dataset.id); });
document.addEventListener("pointercancel", () => { if (!pointerStart) return; pointerStart.card.style.removeProperty("transform"); pointerStart = null; });

function beginAccess() {
  document.getElementById("access-screen").classList.add("access-complete");
  setTimeout(() => { document.getElementById("access-screen").hidden = true; document.getElementById("app-shell").hidden = false; render(); }, 420);
}
let holdTimer, holding = false;
const fingerprint = document.getElementById("fingerprint");
const accessVideo = document.querySelector(".access-video");
if (accessVideo) accessVideo.playbackRate = 1.25;
const startHold = () => { if (holding) return; holding = true; fingerprint.classList.add("holding"); document.getElementById("access-status").textContent = "VERIFICANDO ACCESO"; holdTimer = setTimeout(beginAccess, 3000); };
const stopHold = () => { if (!holding) return; holding = false; clearTimeout(holdTimer); fingerprint.classList.remove("holding"); document.getElementById("access-status").textContent = "INICIANDO SISTEMA PERSONAL"; };
fingerprint.addEventListener("pointerdown", startHold); ["pointerup", "pointercancel", "pointerleave"].forEach((name) => fingerprint.addEventListener(name, stopHold));

load();
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
subscribe(render); setInterval(() => { if (state.lastOpen !== dateKey()) { rollover(); render(); } else if (!document.getElementById("app-shell").hidden) renderHeader(); }, 20000);
