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
      <div className="preview-layout-grid">
        <div className="export-col">
          <SnippetCard
            title="SVG source"
            actions={
              <>
                <button
                  className="action-button button-secondary"
                  onClick={onDownloadSvg}
                >
                  Download
                </button>
                <button
                  className="action-button"
                  onClick={() => onCopy("SVG source", svgMarkup)}
                >
                  Copy
                </button>
              </>
            }
          >
            <textarea
              value={svgMarkup}
              readOnly
              rows="3"
              wrap="soft"
              spellCheck="false"
            />
          </SnippetCard>

          <SnippetCard
            title="Inline favicon"
            actions={
              <button
                className="action-button"
                onClick={() => onCopy("inline favicon", inlineLinkMarkup)}
              >
                Copy
              </button>
            }
          >
            <textarea
              value={inlineLinkMarkup}
              readOnly
              rows="3"
              wrap="soft"
              spellCheck="false"
            />
          </SnippetCard>

          <SnippetCard
            title="Head snippets"
            actions={
              <button
                className="action-button"
                onClick={() => onCopy("head snippets", defaultHeadSnippet)}
              >
                Copy
              </button>
            }
          >
            <textarea
              value={defaultHeadSnippet}
              readOnly
              rows="3"
              wrap="soft"
              spellCheck="false"
            />
          </SnippetCard>

          <SnippetCard
            title="Web manifest"
            actions={
              <>
                <button
                  className="action-button button-secondary"
                  onClick={onDownloadManifest}
                >
                  Download
                </button>
                <button
                  className="action-button"
                  onClick={() => onCopy("manifest JSON", defaultManifest)}
                >
                  Copy
                </button>
              </>
            }
          >
            <textarea
              value={defaultManifest}
              readOnly
              rows="3"
              wrap="soft"
              spellCheck="false"
            />
          </SnippetCard>
        </div>

        <div className="preview-stage-container">
          <div className="preview-frame" aria-label="Generated favicon preview">
            <div
              className="preview-surface"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          </div>

          <article className="snippet-card export-card">
            <div className="snippet-header">
              <h2>Download</h2>
            </div>
            <div className="export-table-container">
              <table className="export-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {exportOptions.map((option) => (
                    <tr
                      key={option.filename}
                      className={option.disabled ? "disabled" : ""}
                      onClick={() => {
                        if (option.disabled) return;
                        onExport(option);
                      }}
                    >
                      <td className="asset-name">
                        <span
                          className="asset-name-button"
                          type="button"
                          aria-label={`Download ${option.label}`}
                        >
                          {option.label}
                        </span>
                      </td>
                      <td className="asset-size">{option.size}px</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
