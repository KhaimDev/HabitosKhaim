// Cálculo de progreso, rachas y consistencia.

import { state, dueHabits, isDue } from "./store.js";
import { dateKey, addDays, lastDays } from "./utils.js";

export function dayProgress(key) {
  const due = dueHabits(key);
  const rec = state.history[key];
  const habitsDone = due.filter((h) => rec?.habits?.[h.id]?.done).length;
  const tasks = state.dailyTasks || [];
  const tasksDone = tasks.filter((t) => rec?.tasks?.[t.id]).length;
  const done = habitsDone + tasksDone;
  const total = due.length + tasks.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, complete: total > 0 && done === total };
}

/** Racha global: días consecutivos con todos los hábitos programados hechos. */
export function globalStreak() {
  const today = dateKey();
  let cur = 0;
  let cursor = dayProgress(today).complete ? today : addDays(today, -1);
  for (let i = 0; i < 1000; i++) {
    const p = dayProgress(cursor);
    if (p.total === 0) { cursor = addDays(cursor, -1); continue; }
    if (!p.complete) break;
    cur++;
    cursor = addDays(cursor, -1);
  }

  const keys = Object.keys(state.history).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const p = dayProgress(k);
    if (p.total === 0) continue;
    if (p.complete) {
      run = prev && k === addDays(prev, 1) ? run + 1 : 1;
      best = Math.max(best, run);
      prev = k;
    } else {
      run = 0;
      prev = k;
    }
  }
  return { current: cur, best: Math.max(best, cur) };
}

export function habitStreak(habit) {
  let cur = 0;
  let cursor = dateKey();
  const doneToday = state.history[cursor]?.habits?.[habit.id]?.done;
  if (!doneToday) cursor = addDays(cursor, -1);
  for (let i = 0; i < 1000; i++) {
    if (habit.created && cursor < habit.created) break;
    if (!isDue(habit, cursor)) { cursor = addDays(cursor, -1); continue; }
    if (!state.history[cursor]?.habits?.[habit.id]?.done) break;
    cur++;
    cursor = addDays(cursor, -1);
  }
  return cur;
}

export function consistency(days) {
  const keys = lastDays(days);
  let done = 0, total = 0;
  for (const k of keys) {
    const p = dayProgress(k);
    done += p.done;
    total += p.total;
  }
  return { pct: total ? Math.round((done / total) * 100) : 0, done, total, avg: keys.length ? +(done / keys.length).toFixed(1) : 0 };
}

export function habitRanking() {
  const keys = lastDays(30);
  return state.habits
    .map((h) => {
      let done = 0, due = 0;
      for (const k of keys) {
        if (!isDue(h, k)) continue;
        due++;
        if (state.history[k]?.habits?.[h.id]?.done) done++;
      }
      return { habit: h, done, due, pct: due ? Math.round((done / due) * 100) : 0, misses: due - done, streak: habitStreak(h) };
    })
    .filter((r) => r.due > 0)
    .sort((a, b) => b.pct - a.pct);
}

export function heatmap(days = 119) {
  return lastDays(days).map((k) => {
    const p = dayProgress(k);
    const level = p.total === 0 ? 0 : p.pct === 0 ? 0 : p.pct < 40 ? 1 : p.pct < 70 ? 2 : p.pct < 100 ? 3 : 4;
    return { key: k, level, ...p };
  });
}

export function periodSummary(days) {
  const keys = lastDays(days);
  const active = keys.filter((k) => dayProgress(k).total > 0);
  const perfect = active.filter((k) => dayProgress(k).complete).length;
  return { perfect, active: active.length, ...consistency(days) };
}
