import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khaim · Sistema de Ejecución" },
      {
        name: "description",
        content:
          "Sistema personal de hábitos, disciplina y progreso diario: rutina por hora, misiones, rachas y bitácora. Funciona sin servidor.",
      },
      { property: "og:title", content: "Khaim · Sistema de Ejecución" },
      {
        property: "og:description",
        content:
          "Rutina por hora, misiones, rachas y bitácora diaria. Todo guardado en tu navegador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/index.html"
      title="Khaim · Sistema de Ejecución"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        background: "#08080c",
      }}
    />
  );
}
