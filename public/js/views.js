import { state, actionItems } from "./store.js";
import { dayProgress, globalStreak } from "./stats.js";
import { dateKey, longDate, escapeHtml, svg } from "./utils.js";

const greeting = () => new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches";

function deckCard(item) {
  if (!item) return `<article class="deck-card deck-empty"><span>✦</span><h2>Día completo</h2><p>Tu sistema está al día, Villa.</p></article>`;
  return `<article class="deck-card" data-card data-kind="${item.kind}" data-id="${item.id}" style="--card:${item.color}">
    <div class="card-sheen"></div><div class="card-top"><span>${item.kind === "habit" ? "HÁBITO" : "TAREA DIARIA"}</span><span>PENDIENTE</span></div>
    <div class="card-icon">${item.icon}</div><h2>${escapeHtml(item.name)}</h2><p class="card-time">${item.time}</p>
    <div class="card-hint"><span>↑</span> DESLIZA HACIA ARRIBA PARA CUMPLIR</div></article>`;
}

function home() {
  const key = dateKey(), progress = dayProgress(key), streak = globalStreak();
  const actions = actionItems(key);
  const active = actions.filter((x) => !x.done && (!x.snoozedUntil || new Date(x.snoozedUntil) <= new Date()));
  const snoozed = actions.filter((x) => !x.done && x.snoozedUntil && new Date(x.snoozedUntil) > new Date());
  const next = active[0];
  return `<section class="welcome"><p>${longDate(key)}</p><h1>${greeting()}, <em>Villa.</em></h1><div class="welcome-stats"><span><b>${progress.pct}%</b> completado</span><span><b>${streak.current}d</b> de racha</span></div></section>
  <section class="deck-zone"><div class="deck-label"><span>ACCIÓN ACTUAL</span><span>${progress.done}/${progress.total}</span></div><div class="deck-stack"><div class="deck-back back-2"></div><div class="deck-back back-1"></div>${deckCard(next)}</div>
  ${next ? `<div class="deck-actions"><button data-act="snooze" data-kind="${next.kind}" data-id="${next.id}" data-hours="1">+1 HORA</button><button data-act="snooze" data-kind="${next.kind}" data-id="${next.id}" data-hours="4">+4 HORAS</button></div>` : ""}
  ${snoozed.length ? `<p class="snoozed-note">${snoozed.length} acción${snoozed.length > 1 ? "es" : ""} vuelve${snoozed.length === 1 ? "" : "n"} más tarde.</p>` : ""}</section>`;
}

function row(item, type) {
  return `<article class="manage-row ${item.done ? "is-complete" : ""}"><div class="manage-icon" style="--row:${item.color || "#b15cff"}">${item.icon || "✓"}</div><div><h3>${escapeHtml(item.name)}</h3><p>${item.done ? "Completado hoy" : type === "habit" ? item.time : "Tarea diaria"}</p></div><div class="row-buttons"><button data-act="complete" data-kind="${type}" data-id="${item.id}" aria-label="${item.done ? "Marcar pendiente" : "Cumplir"}">${svg.check}</button><button data-act="edit-${type}" data-id="${item.id}" aria-label="Editar">${svg.edit}</button><button data-act="delete-${type}" data-id="${item.id}" aria-label="Eliminar">${svg.trash}</button></div></article>`;
}

function habits() { const today = actionItems(dateKey()); const items = state.habits.map((habit) => ({ ...habit, done: !!today.find((item) => item.kind === "habit" && item.id === habit.id)?.done })); return `<section class="page-title"><p>CONFIGURACIÓN PERSONAL</p><h1>Hábitos</h1><button class="add-button" data-act="new-habit">${svg.plus} Nuevo hábito</button></section><section class="manage-list">${items.length ? items.map((h, index) => `${row(h, "habit").replace("</div></article>", `<button data-act="move-up" data-id="${h.id}" ${index === 0 ? "disabled" : ""} aria-label="Subir">↑</button><button data-act="move-down" data-id="${h.id}" ${index === items.length - 1 ? "disabled" : ""} aria-label="Bajar">↓</button></div></article>`)}`).join("") : `<p class="empty-state">Crea tu primer hábito.</p>`}</section>`; }
function tasks() { return `<section class="page-title"><p>ACCIONES REPETIBLES</p><h1>Tareas diarias</h1><button class="add-button" data-act="new-task">${svg.plus} Nueva tarea</button></section><section class="manage-list">${state.dailyTasks.length ? state.dailyTasks.map((t) => row(t, "task")).join("") : `<p class="empty-state">No tienes tareas diarias.</p>`}</section>`; }
function todoRow(todo) { return `<article class="manage-row ${todo.done ? "is-done" : ""}"><div class="manage-icon todo-icon">◆</div><div><h3>${escapeHtml(todo.title)}</h3><p>${todo.priority || "media"}${todo.due ? ` · ${todo.due}` : ""}</p></div><div class="row-buttons"><button data-act="toggle-todo" data-id="${todo.id}" aria-label="Cumplir">${svg.check}</button><button data-act="edit-todo" data-id="${todo.id}" aria-label="Editar">${svg.edit}</button><button data-act="delete-todo" data-id="${todo.id}" aria-label="Eliminar">${svg.trash}</button></div></article>`; }
function todos() { const open = state.todos.filter((t) => !t.done), closed = state.todos.filter((t) => t.done); return `<section class="page-title"><p>NO AFECTAN TU RACHA</p><h1>Pendientes</h1><button class="add-button" data-act="new-todo">${svg.plus} Nuevo pendiente</button></section><section class="manage-list">${open.length ? open.map(todoRow).join("") : `<p class="empty-state">No hay pendientes abiertos.</p>`}</section>${closed.length ? `<p class="list-caption">COMPLETADOS</p><section class="manage-list">${closed.map(todoRow).join("")}</section>` : ""}`; }
function settings() { return `<section class="page-title"><p>VILLA // PERSONAL</p><h1>Ajustes</h1></section><section class="settings-card"><h3>Tus datos</h3><p>Villa guarda cada cambio automáticamente en este dispositivo.</p><details><summary>Recuperación de emergencia</summary><div class="recovery"><button data-act="export">Exportar copia</button><button data-act="import">Restaurar copia</button><input type="file" id="import-file" accept="application/json" hidden /></div></details></section>`; }

export const VIEWS = { home: { label: "Inicio", icon: "⌂", render: home }, habits: { label: "Hábitos", icon: "◈", render: habits }, tasks: { label: "Diarias", icon: "✓", render: tasks }, todos: { label: "Pendientes", icon: "◆", render: todos }, settings: { label: "Ajustes", icon: "⚙", render: settings } };
