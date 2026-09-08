// Formularios (hábitos, tareas, pendientes) en hojas modales.

import { openModal, closeModal, toast } from "./ui.js";
import { COLORS, ICONS, WEEKDAYS, escapeHtml } from "./utils.js";
import { upsertHabit, upsertDailyTask, upsertTodo } from "./store.js";

function chips(list, current, attr = "value") {
  return list
    .map((c) => `<button type="button" class="chip swatch" style="--c:${c}" data-${attr}="${c}" aria-pressed="${c === current}" aria-label="Color ${c}"></button>`)
    .join("");
}

export function habitForm(habit) {
  const h = {
    name: "",
    time: "08:00",
    icon: ICONS[0],
    color: COLORS[0],
    freq: { type: "daily" },
    ...(habit || {}),
  };
  const f = h.freq || { type: "daily" };
  openModal({
    title: habit ? "Editar hábito" : "Nuevo hábito",
    sub: "Hora, identidad visual y frecuencia.",
    body: `
      <div class="field"><label for="h-name">Nombre</label>
        <input id="h-name" value="${escapeHtml(h.name)}" placeholder="Ej. Estudiar IA" maxlength="60" /></div>
      <div class="two">
        <div class="field"><label for="h-time">Hora</label><input id="h-time" type="time" value="${h.time}" /></div>
        <div class="field"><label for="h-freq">Frecuencia</label>
          <select id="h-freq">
            <option value="daily" ${f.type === "daily" ? "selected" : ""}>Todos los días</option>
            <option value="weekdays" ${f.type === "weekdays" ? "selected" : ""}>Días concretos</option>
            <option value="interval" ${f.type === "interval" ? "selected" : ""}>Cada X días</option>
          </select></div>
      </div>
      <div class="field" id="wrap-days" ${f.type === "weekdays" ? "" : "hidden"}>
        <label>Días de la semana</label>
        <div class="chips">${WEEKDAYS.map((d, i) => `<button type="button" class="chip" data-day="${i}" aria-pressed="${(f.days || []).includes(i)}">${d}</button>`).join("")}</div>
      </div>
      <div class="field" id="wrap-every" ${f.type === "interval" ? "" : "hidden"}>
        <label for="h-every">Cada cuántos días</label>
        <input id="h-every" type="number" min="2" max="30" value="${f.every || 2}" />
      </div>
      <div class="field"><label>Icono</label>
        <div class="chips">${ICONS.map((i) => `<button type="button" class="chip ico" data-icon="${i}" aria-pressed="${i === h.icon}">${i}</button>`).join("")}</div></div>
      <div class="field"><label>Color</label><div class="chips">${chips(COLORS, h.color, "color")}</div></div>`,
    actions: `<button class="btn ghost" data-cancel>Cancelar</button><button class="btn primary" data-save>Guardar</button>`,
    onMount(sheet) {
      let icon = h.icon, color = h.color;
      let days = [...(f.days || [1, 2, 3, 4, 5])];

      sheet.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-icon],button[data-color],button[data-day]");
        if (!b) return;
        if (b.dataset.icon) {
          icon = b.dataset.icon;
          sheet.querySelectorAll("[data-icon]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        } else if (b.dataset.color) {
          color = b.dataset.color;
          sheet.querySelectorAll("[data-color]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        } else {
          const d = Number(b.dataset.day);
          days = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
          b.setAttribute("aria-pressed", String(days.includes(d)));
        }
      });

      const sel = sheet.querySelector("#h-freq");
      sel.addEventListener("change", () => {
        sheet.querySelector("#wrap-days").hidden = sel.value !== "weekdays";
        sheet.querySelector("#wrap-every").hidden = sel.value !== "interval";
      });

      sheet.querySelector("[data-cancel]").addEventListener("click", closeModal);
      sheet.querySelector("[data-save]").addEventListener("click", () => {
        const name = sheet.querySelector("#h-name").value.trim();
        if (!name) return toast("Ponle un nombre al hábito");
        const type = sel.value;
        const freq =
          type === "weekdays" ? { type, days: days.length ? days : [1, 2, 3, 4, 5] }
          : type === "interval" ? { type, every: Math.max(2, Number(sheet.querySelector("#h-every").value) || 2) }
          : { type: "daily" };
        upsertHabit({ ...(habit || {}), name, time: sheet.querySelector("#h-time").value || "08:00", icon, color, freq });
        closeModal();
        toast(habit ? "Hábito actualizado" : "Hábito añadido");
      });
    },
  });
}

export function dailyTaskForm(task) {
  openModal({
    title: task ? "Editar tarea diaria" : "Nueva tarea diaria",
    sub: "Se reinicia sola cada día.",
    body: `<div class="field"><label for="t-name">Tarea</label>
      <input id="t-name" value="${escapeHtml(task?.name || "")}" placeholder="Ej. Revisar objetivos" maxlength="80" /></div>`,
    actions: `<button class="btn ghost" data-cancel>Cancelar</button><button class="btn primary" data-save>Guardar</button>`,
    onMount(sheet) {
      sheet.querySelector("[data-cancel]").addEventListener("click", closeModal);
      sheet.querySelector("[data-save]").addEventListener("click", () => {
        const name = sheet.querySelector("#t-name").value.trim();
        if (!name) return toast("Escribe la tarea");
        upsertDailyTask({ ...(task || {}), name });
        closeModal();
        toast("Guardado");
      });
    },
  });
}

export function todoForm(todo) {
  const t = todo || { title: "", priority: "media", due: "" };
  openModal({
    title: todo ? "Editar pendiente" : "Nuevo pendiente",
    sub: "Una sola vez. Con prioridad y fecha límite.",
    body: `
      <div class="field"><label for="p-title">Título</label>
        <input id="p-title" value="${escapeHtml(t.title)}" placeholder="Ej. Terminar informe" maxlength="90" /></div>
      <div class="two">
        <div class="field"><label for="p-pri">Prioridad</label>
          <select id="p-pri">
            ${["alta", "media", "baja"].map((p) => `<option value="${p}" ${t.priority === p ? "selected" : ""}>${p[0].toUpperCase() + p.slice(1)}</option>`).join("")}
          </select></div>
        <div class="field"><label for="p-due">Fecha límite</label><input id="p-due" type="date" value="${t.due || ""}" /></div>
      </div>`,
    actions: `<button class="btn ghost" data-cancel>Cancelar</button><button class="btn primary" data-save>Guardar</button>`,
    onMount(sheet) {
      sheet.querySelector("[data-cancel]").addEventListener("click", closeModal);
      sheet.querySelector("[data-save]").addEventListener("click", () => {
        const title = sheet.querySelector("#p-title").value.trim();
        if (!title) return toast("Escribe el pendiente");
        upsertTodo({
          ...(todo || {}),
          title,
          priority: sheet.querySelector("#p-pri").value,
          due: sheet.querySelector("#p-due").value || "",
        });
        closeModal();
        toast("Guardado");
      });
    },
  });
}
