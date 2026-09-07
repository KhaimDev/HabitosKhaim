# Khaim · Sistema de Ejecución

Aplicación web personal de hábitos, disciplina y progreso diario. HTML, CSS y JavaScript puro, sin servidor ni base de datos: todo se guarda en `localStorage`, en tu navegador.

## Contenido

```
public/app/
  index.html          # estructura y carga de la app
  css/styles.css      # sistema visual (tema oscuro permanente)
  js/
    app.js            # arranque, navegación y eventos
    store.js          # estado + persistencia en localStorage
    stats.js          # progreso, rachas, consistencia, mapa de calor
    views.js          # Hoy, Rutina, Misiones, Evolución, Bitácora, Sistema
    forms.js          # formularios de hábitos, tareas y pendientes
    backup.js         # exportar / importar / borrar
    messages.js       # mensajes según el estado real del día
    ui.js             # modales, confirmaciones y avisos
    utils.js          # fechas locales, formato e iconos
```

## Uso local

No requiere compilación. Abre `public/app/index.html` con un servidor estático (los módulos ES no funcionan con `file://`):

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000/public/app/
```

## Publicar en GitHub Pages

1. Copia el contenido de `public/app/` a la raíz del repositorio (o a una carpeta `docs/`).
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)` o `/docs`, según dónde dejaste los archivos.
4. Guarda. En un par de minutos tu sistema estará en `https://<usuario>.github.io/<repo>/`.

Todas las rutas son relativas, así que funciona en subcarpetas sin ajustes.

## Secciones

- **Hoy** — centro de mando: mensaje del día, siguiente acción, pendientes, ejecutado, racha y bitácora rápida.
- **Rutina** — crear, editar, reordenar y eliminar hábitos (hora, icono, color, frecuencia).
- **Misiones** — tareas diarias repetibles y pendientes únicos con prioridad y fecha límite.
- **Evolución** — rachas, consistencia de 7/30/90 días, promedio, resúmenes y mapa de actividad.
- **Bitácora** — reflexión diaria guardada junto al registro de su fecha.
- **Sistema** — respaldo, restauración y borrado.

## Respaldo

- **Exportar mi sistema**: descarga un `.json` con hábitos, tareas, historial y notas.
- **Restaurar respaldo**: importa ese `.json`. Reemplaza por completo los datos actuales, con aviso previo.
- **Borrar todos los datos**: reinicio total, con confirmación explícita.

Los datos viven solo en este navegador y este dispositivo. No se sincronizan entre equipos ni navegadores, y se pierden si borras los datos del sitio: exporta un respaldo con regularidad.

## Cómo funciona el día

Al abrir, la app compara la fecha local con la última registrada. Si es un día nuevo, crea un registro limpio con los hábitos que aplican y las tareas diarias reiniciadas. El historial anterior nunca se borra automáticamente.
