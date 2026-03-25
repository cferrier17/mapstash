export default function Home() {
  return (
    <main>
      <section className="card">
        <p className="eyebrow">Mapstash backend</p>
        <h1>Next.js API workspace initialized.</h1>
        <p>
          This app is ready to host your backend routes, server actions, and
          integrations separately from the Vite frontend.
        </p>
        <p>
          A first health endpoint is available at <code>/api/health</code>.
        </p>
        <ul>
          <li>Use `src/app/api/*/route.ts` for HTTP endpoints.</li>
          <li>Use `src/lib/` for shared server-side utilities.</li>
          <li>Use environment variables in `.env.local` when needed.</li>
        </ul>
      </section>
    </main>
  )
}
