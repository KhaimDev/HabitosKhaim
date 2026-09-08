// Exportar / importar / borrar el sistema.

import { state, replaceState, resetAll } from "./store.js";
import { confirmSheet, toast } from "./ui.js";
import { dateKey } from "./utils.js";

export function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `khaim-sistema-${dateKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Respaldo descargado");
}

export function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(String(reader.result));
    } catch {
      return toast("El archivo no es un respaldo válido");
    }
    if (!data || typeof data !== "object" || !("habits" in data)) return toast("El archivo no es un respaldo válido");
    confirmSheet({
      title: "Restaurar respaldo",
      sub: "Esto reemplazará por completo tus hábitos, tareas, historial y notas actuales. La acción no se puede deshacer.",
      confirmLabel: "Reemplazar todo",
      onConfirm() {
        replaceState(data);
        toast("Sistema restaurado");
      },
    });
  };
  reader.readAsText(file);
}

export function wipeData() {
  confirmSheet({
    title: "Borrar todos los datos",
    sub: "Se eliminarán hábitos, tareas, historial y bitácora de este navegador. Exporta un respaldo antes si quieres conservarlo.",
    confirmLabel: "Borrar todo",
    onConfirm() {
      resetAll();
      toast("Sistema reiniciado");
    },
  });
}
