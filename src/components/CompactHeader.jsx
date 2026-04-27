export function CompactHeader({ status }) {
  return (
    <header className="app-header panel">
      <h1 className="app-title">👉👉👉 SVG Favicon Generator 👈👈👈</h1>
      <p className="status-pill app-status" role="status" aria-live="polite">
        {status}
      </p>
    </header>
  );
}
