import { SnippetCard } from "./SnippetCard";

export function PreviewPanel({
  svgMarkup,
  inlineLinkMarkup,
  status,
  defaultHeadSnippet,
  defaultManifest,
  exportOptions,
  onCopy,
  onDownloadSvg,
  onDownloadManifest,
  onExport,
}) {
  return (
    <section className="panel preview-panel">
      <h2 className="section-title">Live preview</h2>
      <div className="preview-stage">
        <div className="preview-frame" aria-label="Generated favicon preview">
          <div
            className="preview-surface"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
        <div className="status-pill" aria-live="polite">
          {status}
        </div>
      </div>

      <div className="export-layout">
        <SnippetCard title="SVG source">
          <textarea
            value={svgMarkup}
            readOnly
            rows="3"
            wrap="soft"
            spellCheck="false"
          />
          <div className="button-row">
            <button
              className="action-button"
              onClick={() => onCopy("SVG source", svgMarkup)}
            >
              Copy SVG Source
            </button>
            <button
              className="action-button button-secondary"
              onClick={onDownloadSvg}
            >
              Download SVG
            </button>
          </div>
        </SnippetCard>

        <SnippetCard title="Inline favicon">
          <textarea
            value={inlineLinkMarkup}
            readOnly
            rows="3"
            wrap="soft"
            spellCheck="false"
          />
          <div className="button-row">
            <button
              className="action-button"
              onClick={() => onCopy("inline favicon", inlineLinkMarkup)}
            >
              Copy Inline SVG
            </button>
          </div>
        </SnippetCard>
      </div>

      <article className="snippet-card export-card">
        <div className="snippet-header">
          <h2>Download assets</h2>
        </div>
        <div className="export-grid">
          {exportOptions.map((option) => (
            <button
              key={option.filename}
              className={`export-tile export-${option.accent}`}
              onClick={() => onExport(option)}
              disabled={option.disabled}
              type="button"
            >
              <span className="export-label">{option.label}</span>
              <span className="export-size">{option.size} px</span>
            </button>
          ))}
        </div>
      </article>

      <div className="export-layout export-layout-split">
        <SnippetCard title="Head snippets">
          <textarea
            value={defaultHeadSnippet}
            readOnly
            rows="3"
            wrap="soft"
            spellCheck="false"
          />
          <div className="button-row">
            <button
              className="action-button"
              onClick={() => onCopy("head snippets", defaultHeadSnippet)}
            >
              Copy Head Snippets
            </button>
          </div>
        </SnippetCard>

        <SnippetCard title="Web manifest">
          <textarea
            value={defaultManifest}
            readOnly
            rows="3"
            wrap="soft"
            spellCheck="false"
          />
          <div className="button-row">
            <button
              className="action-button"
              onClick={() => onCopy("manifest JSON", defaultManifest)}
            >
              Copy Manifest JSON
            </button>
            <button
              className="action-button button-secondary"
              onClick={onDownloadManifest}
            >
              Download site.webmanifest
            </button>
          </div>
        </SnippetCard>
      </div>
    </section>
  );
}
