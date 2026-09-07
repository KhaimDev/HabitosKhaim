// Estado + persistencia en localStorage. Fuente única de verdad.

import { uid, dateKey, parseKey, addDays } from "./utils.js";

const KEY = "khaim.execution.system.v1";

const seedHabits = () => [
  { id: uid(), name: "Levantarme", time: "07:00", icon: "🌅", color: "#ffb545", freq: { type: "daily" }, created: dateKey() },
  { id: uid(), name: "Ejercicio", time: "07:15", icon: "🏋", color: "#4be3a2", freq: { type: "daily" }, created: dateKey() },
  { id: uid(), name: "Estudiar IA", time: "09:00", icon: "🧠", color: "#7c5cff", freq: { type: "daily" }, created: dateKey() },
  { id: uid(), name: "Práctica de programación", time: "14:00", icon: "💻", color: "#4aa8ff", freq: { type: "daily" }, created: dateKey() },
  { id: uid(), name: "Leer", time: "18:00", icon: "📘", color: "#f472d0", freq: { type: "daily" }, created: dateKey() },
  { id: uid(), name: "Revisar mi día", time: "21:00", icon: "🌙", color: "#7c5cff", freq: { type: "daily" }, created: dateKey() },
];

function blank() {
  return {
    version: 1,
    owner: "Khaim",
    habits: seedHabits(),
    dailyTasks: [
      { id: uid(), name: "Escribir 3 prioridades del día", created: dateKey() },
    ],
    todos: [],
    history: {},
    lastOpen: dateKey(),
  };
}

export let state = blank();

const listeners = new Set();
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("No se pudo guardar", e);
  }
  listeners.forEach((fn) => fn());
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...blank(), ...parsed };
      state.habits ||= [];
      state.dailyTasks ||= [];
      state.todos ||= [];
      state.history ||= {};
    }
  } catch (e) {
    console.warn("Datos corruptos, se inicia limpio", e);
  }
  rollover();
  return state;
}

export function replaceState(next) {
  state = { ...blank(), ...next };
  rollover();
  save();
}

export function resetAll() {
  state = blank();
  save();
}

/* ---------- días ---------- */

/** ¿Un hábito aplica en esta fecha? */
export function isDue(habit, key) {
  const f = habit.freq || { type: "daily" };
  if (habit.created && key < habit.created) return false;
  if (f.type === "daily") return true;
  if (f.type === "weekdays") return (f.days || []).includes(parseKey(key).getDay());
  if (f.type === "interval") {
    const every = Math.max(1, Number(f.every) || 2);
    const base = habit.created || key;
    const diff = Math.round((parseKey(key) - parseKey(base)) / 86400000);
    return diff >= 0 && diff % every === 0;
  }
  return true;
}

export function dueHabits(key) {
  return state.habits
    .filter((h) => isDue(h, key))
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}

/** Registro del día; se crea si no existe (nunca borra historial). */
export function day(key = dateKey()) {
  if (!state.history[key]) {
    state.history[key] = { habits: {}, tasks: {}, note: null };
  }
  const d = state.history[key];
  d.habits ||= {};
  d.tasks ||= {};
  return d;
}

/** Compara la fecha actual con la última: abre el día nuevo. */
export function rollover() {
  const today = dateKey();
  day(today);
  if (state.lastOpen !== today) {
    state.lastOpen = today;
  }
  save();
  return today;
}

/* ---------- acciones ---------- */

export function toggleHabit(id, key = dateKey()) {
  const d = day(key);
  if (d.habits[id]?.done) delete d.habits[id];
  else d.habits[id] = { done: true, at: new Date().toISOString() };
  save();
}

export function toggleDailyTask(id, key = dateKey()) {
  const d = day(key);
  d.tasks[id] = !d.tasks[id];
  if (!d.tasks[id]) delete d.tasks[id];
  save();
}

export function saveNote(key, note) {
  const d = day(key);
  const empty = !note || Object.values(note).every((v) => !String(v || "").trim());
  d.note = empty ? null : { ...note, updated: new Date().toISOString() };
  save();
}

export function upsertHabit(habit) {
  const i = state.habits.findIndex((h) => h.id === habit.id);
  if (i >= 0) state.habits[i] = { ...state.habits[i], ...habit };
  else state.habits.push({ ...habit, id: uid(), created: dateKey() });
  save();
}

export const removeHabit = (id) => {
  state.habits = state.habits.filter((h) => h.id !== id);
  save();
};

export function moveHabit(id, dir) {
  const i = state.habits.findIndex((h) => h.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= state.habits.length) return;
  [state.habits[i], state.habits[j]] = [state.habits[j], state.habits[i]];
  save();
}

export function upsertDailyTask(task) {
  const i = state.dailyTasks.findIndex((t) => t.id === task.id);
  if (i >= 0) state.dailyTasks[i] = { ...state.dailyTasks[i], ...task };
  else state.dailyTasks.push({ ...task, id: uid(), created: dateKey() });
  save();
}

export const removeDailyTask = (id) => {
  state.dailyTasks = state.dailyTasks.filter((t) => t.id !== id);
  save();
};

export function upsertTodo(todo) {
  const i = state.todos.findIndex((t) => t.id === todo.id);
  if (i >= 0) state.todos[i] = { ...state.todos[i], ...todo };
  else state.todos.push({ ...todo, id: uid(), done: false, created: dateKey() });
  save();
}

export function toggleTodo(id) {
  const t = state.todos.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.doneAt = t.done ? new Date().toISOString() : null;
  save();
}

export const removeTodo = (id) => {
  state.todos = state.todos.filter((t) => t.id !== id);
  save();
};

export { KEY, addDays };
