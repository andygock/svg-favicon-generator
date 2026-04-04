export function SnippetCard({ title, description, children, actions }) {
  return (
    <article className="snippet-card">
      <div className="snippet-header">
        <div className="snippet-title-group">
          <h2>{title}</h2>
          {description ? <span>{description}</span> : null}
        </div>
        {actions && <div className="snippet-actions">{actions}</div>}
      </div>
      {children}
    </article>
  );
}
