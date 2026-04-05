import { SnippetCard } from "./SnippetCard";
import CopyButton from "./CopyButton";

export function PreviewPanel({
  svgMarkup,
  inlineLinkMarkup,
  status,
  defaultHeadSnippet,
  includePwa,
  defaultManifest,
  exportOptions,
  onCopy,
  onDownloadSvg,
  onDownloadManifest,
  onExport,
  onDownloadAll,
  downloadAllLoading,
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
                <CopyButton onClick={() => onCopy("SVG source", svgMarkup)}>
                  Copy
                </CopyButton>
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
              <CopyButton
                onClick={() => onCopy("inline favicon", inlineLinkMarkup)}
              >
                Copy
              </CopyButton>
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
              <CopyButton
                onClick={() => onCopy("head snippets", defaultHeadSnippet)}
              >
                Copy
              </CopyButton>
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
          {includePwa && (
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
                  <CopyButton
                    onClick={() => onCopy("manifest JSON", defaultManifest)}
                  >
                    Copy
                  </CopyButton>
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
          )}
        </div>

        <div className="preview-stage-container">
          <div className="preview-frame" aria-label="Generated favicon preview">
            <div
              className="preview-surface"
              dangerouslySetInnerHTML={{ __html: svgMarkup || "" }}
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
                      {
                        // if manifest is included, size should be empty string
                        option.filename === "site.webmanifest" ? (
                          <td className="asset-size"></td>
                        ) : (
                          <td className="asset-size">{option.size}px</td>
                        )
                      }
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="export-actions" style={{ marginTop: 12 }}>
              <button
                className="action-button button-primary"
                onClick={onDownloadAll}
                aria-label="Download all visible assets"
                disabled={!!downloadAllLoading}
              >
                {downloadAllLoading ? "Loading..." : "Download all"}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
