// Mensajes cortos, humanos y sin culpa. Se eligen según el estado real del día.

export function dayMessage({ done, total, pct, hour, yesterdayDone }) {
  if (total === 0) return "Tu rutina está vacía. Define <em>una</em> acción y empieza por ahí.";
  if (done === 0 && hour < 10) return "Día en blanco. <em>Una acción</em> cambia el tono del día.";
  if (done === 0) return "Aún no hay marcas. Tu sistema sigue vivo: <em>vuelve con la siguiente acción</em>.";
  if (pct === 100) return "Día cerrado <em>completo</em>. Así se construye una racha.";
  if (pct >= 70) return `Vas en <em>${pct}%</em>. Queda poco para cerrar limpio.`;
  if (yesterdayDone != null && done > yesterdayDone) return "Hoy ejecutaste <em>mejor que ayer</em>. Sigue.";
  if (pct >= 40) return "Mitad del camino. <em>No necesitas perfección; necesitas retorno.</em>";
  return `<em>${done}</em> ya cuenta. La siguiente acción es la que importa.`;
}

export const emptyLine = {
  habits: "Sin hábitos programados hoy. Añade uno en Rutina.",
  pending: "Nada pendiente ahora mismo.",
  done: "Todavía no marcas nada hoy.",
  todos: "Sin pendientes abiertos. Espacio limpio.",
  log: "Aún no hay entradas en tu bitácora.",
};
