// Vistas: Hoy, Rutina, Misiones, Evolución, Bitácora, Sistema.

import { state, dueHabits, day, saveNote } from "./store.js";
import { dayProgress, globalStreak, habitStreak, consistency, habitRanking, heatmap, periodSummary } from "./stats.js";
import { dayMessage, emptyLine } from "./messages.js";
import { dateKey, longDate, shortDate, nowTime, minutes, escapeHtml, svg, WEEKDAYS, addDays } from "./utils.js";

const pct = (n) => `${n}%`;

function habitRow(h, rec, { next = false } = {}) {
  const done = !!rec?.habits?.[h.id]?.done;
  const at = rec?.habits?.[h.id]?.at ? nowTime(new Date(rec.habits[h.id].at)) : null;
  const overdue = !done && minutes(h.time) < minutes(nowTime());
  return `
    <div class="row ${done ? "done" : ""} ${next ? "next" : ""} ${overdue ? "overdue" : ""}">
      <button class="check" style="--c:${h.color}" aria-pressed="${done}" aria-label="Marcar ${escapeHtml(h.name)}"
        data-act="toggle-habit" data-id="${h.id}">${svg.check}</button>
      <div class="row-main">
        <div class="row-name"><span class="ico">${h.icon || "•"}</span><span>${escapeHtml(h.name)}</span></div>
        <div class="row-sub">
          <span class="row-time">${h.time}</span>
          ${done && at ? `<span>· hecho ${at}</span>` : next ? `<span>· siguiente acción</span>` : ""}
        </div>
      </div>
      <span class="dot" style="--c:${h.color}"></span>
    </div>`;
}

function freqLabel(f = { type: "daily" }) {
  if (f.type === "weekdays") return (f.days || []).map((d) => WEEKDAYS[d]).join(" ") || "Sin días";
  if (f.type === "interval") return `Cada ${f.every || 2} días`;
  return "Todos los días";
}

/* ------------------------------- HOY ------------------------------- */
function today() {
  const key = dateKey();
  const rec = day(key);
  const due = dueHabits(key);
  const p = dayProgress(key);
  const streak = globalStreak();
  const yst = dayProgress(addDays(key, -1));

  const pending = due.filter((h) => !rec.habits[h.id]?.done);
  const done = due.filter((h) => rec.habits[h.id]?.done);
  const nowM = minutes(nowTime());
  const nextHabit = pending.find((h) => minutes(h.time) >= nowM) || pending[0];
  const rest = pending.filter((h) => h !== nextHabit);

  const dTasks = state.dailyTasks;
  const openTodos = state.todos.filter((t) => !t.done)
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));

  const msg = dayMessage({ done: p.done, total: p.total, pct: p.pct, hour: new Date().getHours(), yesterdayDone: yst.done });

  return `
  <div class="split">
    <div>
      <section class="card hero">
        <div>
          <div class="row-sub" style="margin-bottom:8px">${longDate(key)}</div>
          <p class="msg">${msg}</p>
        </div>
        <div>
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px">
            <div class="count">${p.done}<small> / ${p.total} ejecutados</small></div>
            <div class="count" style="font-size:22px;color:var(--violet-soft)">${pct(p.pct)}</div>
          </div>
          <div class="bar"><i style="width:${p.pct}%"></i></div>
        </div>
        <div class="hero-meta">
          <span class="pill">Racha global <b>${streak.current} d</b></span>
          <span class="pill accent">Mejor marca <b>${streak.best} d</b></span>
          <span class="pill">Pendientes <b>${openTodos.length}</b></span>
        </div>
      </section>

      ${nextHabit ? `
        <div class="section-title"><h2>Siguiente acción</h2><span>${nextHabit.time}</span></div>
        <div class="stack">${habitRow(nextHabit, rec, { next: true })}</div>` : ""}

      <div class="section-title"><h2>Pendientes de hoy</h2><span>${rest.length}</span></div>
      <div class="stack">${rest.length ? rest.map((h) => habitRow(h, rec)).join("")
        : `<div class="empty">${due.length ? "Todo lo programado está ejecutado." : emptyLine.habits}</div>`}</div>

      ${done.length ? `
        <div class="section-title"><h2>Ejecutado</h2><span>${done.length}</span></div>
        <div class="stack">${done.map((h) => habitRow(h, rec)).join("")}</div>` : ""}
    </div>

    <aside>
      <div class="section-title"><h2>Tareas diarias</h2><span>${dTasks.filter((t) => rec.tasks[t.id]).length}/${dTasks.length}</span></div>
      <div class="stack">
        ${dTasks.length ? dTasks.map((t) => `
          <div class="row ${rec.tasks[t.id] ? "done" : ""}">
            <button class="check" aria-pressed="${!!rec.tasks[t.id]}" data-act="toggle-dtask" data-id="${t.id}" aria-label="Marcar ${escapeHtml(t.name)}">${svg.check}</button>
            <div class="row-main"><div class="row-name"><span>${escapeHtml(t.name)}</span></div>
            <div class="row-sub">Se reinicia mañana</div></div>
            <span></span>
          </div>`).join("") : `<div class="empty">Sin tareas diarias.</div>`}
      </div>

      <div class="section-title"><h2>Pendientes</h2><span>${openTodos.length}</span></div>
      <div class="stack">
        ${openTodos.slice(0, 5).map(todoRow).join("") || `<div class="empty">${emptyLine.todos}</div>`}
      </div>

      <div class="section-title"><h2>Bitácora de hoy</h2><span>${rec.note || rec.notes?.length ? "guardada" : "vacía"}</span></div>
      <button class="btn block" data-act="go-log">${rec.note || rec.notes?.length ? "Editar reflexión de hoy" : "Escribir reflexión de hoy"}</button>
    </aside>
  </div>`;
}

function todoRow(t) {
  const late = t.due && t.due < dateKey() && !t.done;
  const color = t.priority === "alta" ? "var(--red)" : t.priority === "media" ? "var(--amber)" : "var(--green)";
  return `
    <div class="row ${t.done ? "done" : ""}">
      <button class="check" style="--c:${color}" aria-pressed="${!!t.done}" data-act="toggle-todo" data-id="${t.id}" aria-label="Completar ${escapeHtml(t.title)}">${svg.check}</button>
      <div class="row-main">
        <div class="row-name"><span>${escapeHtml(t.title)}</span></div>
        <div class="row-sub">
          <span style="color:${color}">${t.priority}</span>
          ${t.due ? `<span>· ${late ? "vencía" : "límite"} ${shortDate(t.due)}</span>` : ""}
        </div>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-act="edit-todo" data-id="${t.id}" aria-label="Editar">${svg.edit}</button>
        <button class="icon-btn danger" data-act="del-todo" data-id="${t.id}" aria-label="Eliminar">${svg.trash}</button>
      </div>
    </div>`;
}

/* ------------------------------ RUTINA ------------------------------ */
function routine() {
  const sorted = [...state.habits];
  return `
    <div class="section-title"><h2>Rutina por hora</h2><span>${sorted.length} hábitos</span></div>
    <button class="btn primary block" data-act="new-habit">${svg.plus} Nuevo hábito</button>
    <div class="stack" style="margin-top:14px">
      ${sorted.length ? sorted.map((h, i) => `
        <div class="row">
          <span class="dot" style="--c:${h.color}"></span>
          <div class="row-main">
            <div class="row-name"><span class="ico">${h.icon || "•"}</span><span>${escapeHtml(h.name)}</span></div>
            <div class="row-sub"><span class="row-time">${h.time}</span><span>· ${freqLabel(h.freq)}</span><span>· racha ${habitStreak(h)} d</span></div>
          </div>
          <div class="row-actions">
            <button class="icon-btn" data-act="up" data-id="${h.id}" ${i === 0 ? "disabled" : ""} aria-label="Subir">${svg.up}</button>
            <button class="icon-btn" data-act="down" data-id="${h.id}" ${i === sorted.length - 1 ? "disabled" : ""} aria-label="Bajar">${svg.down}</button>
            <button class="icon-btn" data-act="edit-habit" data-id="${h.id}" aria-label="Editar">${svg.edit}</button>
            <button class="icon-btn danger" data-act="del-habit" data-id="${h.id}" aria-label="Eliminar">${svg.trash}</button>
          </div>
        </div>`).join("") : `<div class="empty">Aún no hay hábitos. Empieza con uno solo.</div>`}
    </div>`;
}

/* ----------------------------- MISIONES ----------------------------- */
function missions() {
  const key = dateKey();
  const rec = day(key);
  const open = state.todos.filter((t) => !t.done).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  const closed = state.todos.filter((t) => t.done);

  return `
  <div class="split">
    <div>
      <div class="section-title"><h2>Pendientes únicos</h2><span>${open.length} abiertos</span></div>
      <button class="btn primary block" data-act="new-todo">${svg.plus} Nuevo pendiente</button>
      <div class="stack" style="margin-top:14px">
        ${open.map(todoRow).join("") || `<div class="empty">${emptyLine.todos}</div>`}
      </div>
      ${closed.length ? `
        <div class="section-title"><h2>Cerrados</h2><span>${closed.length}</span></div>
        <div class="stack">${closed.slice(-8).reverse().map(todoRow).join("")}</div>` : ""}
    </div>
    <aside>
      <div class="section-title"><h2>Tareas diarias</h2><span>repetibles</span></div>
      <button class="btn block" data-act="new-dtask">${svg.plus} Nueva tarea diaria</button>
      <div class="stack" style="margin-top:14px">
        ${state.dailyTasks.map((t) => `
          <div class="row ${rec.tasks[t.id] ? "done" : ""}">
            <button class="check" aria-pressed="${!!rec.tasks[t.id]}" data-act="toggle-dtask" data-id="${t.id}" aria-label="Marcar">${svg.check}</button>
            <div class="row-main"><div class="row-name"><span>${escapeHtml(t.name)}</span></div>
              <div class="row-sub">Se reinicia cada día</div></div>
            <div class="row-actions">
              <button class="icon-btn" data-act="edit-dtask" data-id="${t.id}" aria-label="Editar">${svg.edit}</button>
              <button class="icon-btn danger" data-act="del-dtask" data-id="${t.id}" aria-label="Eliminar">${svg.trash}</button>
            </div>
          </div>`).join("") || `<div class="empty">Sin tareas diarias.</div>`}
      </div>
      <p class="note" style="margin-top:16px">Hábitos = tu rutina fija por hora. Tareas diarias = se repiten y se reinician. Pendientes = una sola vez, con fecha límite.</p>
    </aside>
  </div>`;
}

/* ---------------------------- EVOLUCIÓN ---------------------------- */
function evolution() {
  const s = globalStreak();
  const c7 = consistency(7), c30 = consistency(30), c90 = consistency(90);
  const week = periodSummary(7), month = periodSummary(30);
  const rank = habitRanking();
  const cells = heatmap(119);
  const todayKey = dateKey();

  return `
    <div class="section-title"><h2>Estado del sistema</h2><span>últimos 90 días</span></div>
    <div class="grid">
      <div class="stat"><div class="k">Racha actual</div><div class="v violet">${s.current} d</div></div>
      <div class="stat"><div class="k">Mejor marca</div><div class="v accent">${s.best} d</div></div>
      <div class="stat"><div class="k">Promedio diario</div><div class="v">${c30.avg}</div></div>
      <div class="stat"><div class="k">Consistencia 7d</div><div class="v">${c7.pct}%</div></div>
    </div>

    <div class="section-title"><h2>Consistencia</h2></div>
    <div class="grid three">
      <div class="stat"><div class="k">7 días</div><div class="v">${c7.pct}%</div><div class="row-sub">${c7.done}/${c7.total} acciones</div></div>
      <div class="stat"><div class="k">30 días</div><div class="v">${c30.pct}%</div><div class="row-sub">${c30.done}/${c30.total} acciones</div></div>
      <div class="stat"><div class="k">90 días</div><div class="v">${c90.pct}%</div><div class="row-sub">${c90.done}/${c90.total} acciones</div></div>
    </div>

    <div class="section-title"><h2>Mapa de actividad</h2><span>17 semanas</span></div>
    <div class="card" style="padding:16px">
      <div class="heat">
        ${cells.map((c) => `<i data-l="${c.level}" ${c.key === todayKey ? "data-today" : ""} title="${shortDate(c.key)} · ${c.done}/${c.total} (${c.pct}%)"></i>`).join("")}
      </div>
      <div class="legend">menos
        <i style="background:rgba(255,255,255,.05)"></i>
        <i style="background:rgba(124,92,255,.28)"></i>
        <i style="background:rgba(124,92,255,.52)"></i>
        <i style="background:rgba(124,92,255,.78)"></i>
        <i style="background:#7c5cff"></i> más
      </div>
    </div>

    <div class="section-title"><h2>Resumen</h2></div>
    <div class="grid">
      <div class="stat"><div class="k">Semana</div><div class="v">${week.perfect}<small style="font-size:14px;color:var(--dim)"> días completos</small></div><div class="row-sub">${week.done} acciones ejecutadas</div></div>
      <div class="stat"><div class="k">Mes</div><div class="v">${month.perfect}<small style="font-size:14px;color:var(--dim)"> días completos</small></div><div class="row-sub">${month.done} acciones ejecutadas</div></div>
    </div>

    <div class="section-title"><h2>Hábitos más consistentes</h2><span>30 días</span></div>
    <div class="mini-list">
      ${rank.slice(0, 4).map((r) => `<div class="mini"><span>${r.habit.icon || "•"} ${escapeHtml(r.habit.name)}</span><span>${r.pct}% · racha ${r.streak}d</span></div>`).join("") || `<div class="empty">Sin datos todavía.</div>`}
    </div>

    ${rank.some((r) => r.misses > 0) ? `
      <div class="section-title"><h2>Donde más fallas</h2><span>sin culpa, solo dato</span></div>
      <div class="mini-list">
        ${[...rank].sort((a, b) => b.misses - a.misses).slice(0, 3)
          .map((r) => `<div class="mini"><span>${r.habit.icon || "•"} ${escapeHtml(r.habit.name)}</span><span>${r.misses} sin marcar</span></div>`).join("")}
      </div>` : ""}
  `;
}

/* ----------------------------- BITÁCORA ----------------------------- */
function log() {
  const key = dateKey();
  const rec = day(key);
  const n = rec.note || rec.notes?.[rec.notes.length - 1] || {};
  const past = Object.entries(state.history)
    .flatMap(([entryKey, value]) => {
      const notes = Array.isArray(value.notes) ? value.notes : value.note ? [value.note] : [];
      return notes.map((note) => ({ key: entryKey, note }));
    })
    .sort((a, b) => (b.note.updated || b.key).localeCompare(a.note.updated || a.key))
    .slice(0, 30);

  return `
  <div class="split">
    <div>
      <div class="section-title"><h2>Reflexión de hoy</h2><span>${longDate(key)}</span></div>
      <div class="card" style="padding:18px">
        <div class="field"><label for="n1">Qué aprendí hoy</label><textarea id="n1" placeholder="Una idea concreta.">${escapeHtml(n.learned || "")}</textarea></div>
        <div class="field"><label for="n2">Cómo me sentí</label><textarea id="n2" placeholder="Sin filtro.">${escapeHtml(n.felt || "")}</textarea></div>
        <div class="field"><label for="n3">Qué obstáculo apareció</label><textarea id="n3" placeholder="Qué te frenó.">${escapeHtml(n.obstacle || "")}</textarea></div>
        <div class="field"><label for="n4">Qué haré mejor mañana</label><textarea id="n4" placeholder="Un ajuste, no diez.">${escapeHtml(n.better || "")}</textarea></div>
        <button class="btn primary block" data-act="save-note">Guardar en la bitácora</button>
      </div>
    </div>
    <aside>
      <div class="section-title"><h2>Historial</h2><span>${past.length}</span></div>
      <div class="stack">
        ${past.length ? past.map(({ key: entryKey, note }) => {
          const p = dayProgress(entryKey);
          return `<article class="entry">
            <h4>${longDate(entryKey)} · ${p.done}/${p.total}</h4>
            ${note.learned ? `<p><b>Aprendí:</b> ${escapeHtml(note.learned)}</p>` : ""}
            ${note.felt ? `<p><b>Sentí:</b> ${escapeHtml(note.felt)}</p>` : ""}
            ${note.obstacle ? `<p><b>Obstáculo:</b> ${escapeHtml(note.obstacle)}</p>` : ""}
            ${note.better ? `<p><b>Mañana:</b> ${escapeHtml(note.better)}</p>` : ""}
          </article>`;
        }).join("") : `<div class="empty">${emptyLine.log}</div>`}
      </div>
    </aside>
  </div>`;
}

/* ------------------------------ SISTEMA ------------------------------ */
function system() {
  const days = Object.keys(state.history).length;
  return `
    <div class="section-title"><h2>Tu sistema</h2><span>v1</span></div>
    <div class="grid three">
      <div class="stat"><div class="k">Hábitos</div><div class="v">${state.habits.length}</div></div>
      <div class="stat"><div class="k">Días registrados</div><div class="v">${days}</div></div>
      <div class="stat"><div class="k">Pendientes</div><div class="v">${state.todos.filter((t) => !t.done).length}</div></div>
    </div>

    <div class="section-title"><h2>Respaldo</h2></div>
    <div class="card" style="padding:18px;display:grid;gap:12px">
      <button class="btn primary block" data-act="export">Exportar mi sistema (JSON)</button>
      <button class="btn block" data-act="import">Restaurar respaldo</button>
      <input type="file" id="import-file" accept="application/json" hidden />
      <p class="note">Al restaurar, el respaldo <b>reemplaza por completo</b> los datos actuales. Exporta antes si tienes dudas.</p>
    </div>

    <div class="section-title"><h2>Dónde viven tus datos</h2></div>
    <div class="card" style="padding:18px">
      <p class="note">Todo se guarda localmente en este navegador y en este dispositivo (localStorage). No hay servidor ni cuenta: nadie más ve tu información, pero tampoco se sincroniza entre dispositivos ni navegadores hasta que conectes una base de datos en el futuro. Si borras los datos del navegador, se pierde el historial: exporta un respaldo cada cierto tiempo.</p>
    </div>

    <div class="section-title"><h2>Zona sensible</h2></div>
    <button class="btn danger block" data-act="wipe">Borrar todos los datos</button>
  `;
}

export const VIEWS = {
  today: { label: "Hoy", icon: svg.today, render: today },
  routine: { label: "Rutina", icon: svg.routine, render: routine },
  missions: { label: "Misiones", icon: svg.missions, render: missions },
  evolution: { label: "Evolución", icon: svg.evolution, render: evolution },
  log: { label: "Bitácora", icon: svg.log, render: log },
  system: { label: "Sistema", icon: svg.system, render: system },
};

export function mountLog(el) {
  el.querySelector("[data-act='save-note']")?.addEventListener("click", () => {
    saveNote(dateKey(), {
      learned: el.querySelector("#n1").value.trim(),
      felt: el.querySelector("#n2").value.trim(),
      obstacle: el.querySelector("#n3").value.trim(),
      better: el.querySelector("#n4").value.trim(),
    });
  });
}
