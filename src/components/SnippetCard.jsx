export function SnippetCard({ title, description, children }) {
  return (
    <article className="snippet-card">
      <div className="snippet-header">
        <h2>{title}</h2>
        {description ? <span>{description}</span> : null}
      </div>
      {children}
    </article>
  );
}
