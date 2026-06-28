// Fallback. En condiciones normales "/" es reescrito a /dashboard.html
// (ver next.config.js → rewrites beforeFiles), así que esta página casi nunca se ve.
export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 40 }}>
      <h1>Consultorio Psicopedagógico</h1>
      <p>
        Abrí el panel en <a href="/dashboard.html">/dashboard.html</a>.
      </p>
    </main>
  );
}
