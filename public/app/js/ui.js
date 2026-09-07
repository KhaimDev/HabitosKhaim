// Primitivas de interfaz: modales, toasts, confirmaciones.

const modalRoot = () => document.getElementById("modal-root");

export function closeModal() {
  const r = modalRoot();
  r.hidden = true;
  r.innerHTML = "";
}

/**
 * Abre una hoja modal.
 * @param {{title:string, sub?:string, body:string, actions?:string, onMount?:Function}} opts
 */
export function openModal({ title, sub = "", body, actions = "", onMount }) {
  const r = modalRoot();
  r.innerHTML = `
    <div class="scrim" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${title}">
      <h3>${title}</h3>
      ${sub ? `<p class="sub">${sub}</p>` : ""}
      <div class="sheet-body">${body}</div>
      <div class="sheet-actions">${actions}</div>
    </div>`;
  r.hidden = false;
  r.querySelector("[data-close]").addEventListener("click", closeModal);
  onMount?.(r.querySelector(".sheet"));
  const first = r.querySelector("input, textarea, select");
  first?.focus();
}

export function confirmSheet({ title, sub, danger = true, confirmLabel = "Confirmar", onConfirm }) {
  openModal({
    title,
    sub,
    body: "",
    actions: `
      <button class="btn ghost" data-cancel>Cancelar</button>
      <button class="btn ${danger ? "danger" : "primary"}" data-ok>${confirmLabel}</button>`,
    onMount(sheet) {
      sheet.querySelector("[data-cancel]").addEventListener("click", closeModal);
      sheet.querySelector("[data-ok]").addEventListener("click", () => {
        closeModal();
        onConfirm();
      });
    },
  });
}

export function toast(msg) {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .25s";
    setTimeout(() => el.remove(), 260);
  }, 2100);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalRoot().hidden) closeModal();
});
