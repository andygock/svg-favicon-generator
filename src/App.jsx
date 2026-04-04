import { useEffect, useMemo, useState } from "react";
import { Canvg } from "canvg";

const DEFAULT_HEAD_SNIPPET = `<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="64x64">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

const DEFAULT_MANIFEST = `{
  "icons": [
    { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/icon-mask.png", "type": "image/png", "sizes": "512x512", "purpose": "maskable" },
    { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" }
  ]
}`;

const FONT_OPTIONS = [
  {
    label: "Roboto",
    value: "Roboto, sans-serif",
  },
  {
    label: "Roboto Mono",
    value: "Roboto Mono, monospace",
  },
  {
    label: "Sans Serif",
    value: "sans-serif",
  },
];

const EXPORT_OPTIONS = [
  {
    label: "favicon.ico",
    size: 64,
    filename: "favicon.ico",
    type: "ico",
    accent: "primary",
  },
  {
    label: "apple-touch-icon.png",
    size: 180,
    filename: "apple-touch-icon.png",
    type: "png",
    accent: "secondary",
  },
  {
    label: "icon.svg",
    size: 128,
    filename: "icon.svg",
    type: "svg",
    accent: "primary",
  },
  {
    label: "icon-192.png",
    size: 192,
    filename: "icon-192.png",
    type: "png",
    accent: "secondary",
  },
  {
    label: "icon-512.png",
    size: 512,
    filename: "icon-512.png",
    type: "png",
    accent: "secondary",
  },
  {
    label: "icon-mask.png",
    size: 512,
    filename: "icon-mask.png",
    type: "png",
    accent: "ghost",
    disabled: true,
  },
];

const DEFAULT_STATE = {
  content: "A",
  fontSize: 96,
  x: 64,
  y: 74,
  fontFamily: FONT_OPTIONS[0].value,
  fill: "#111111",
  bold: false,
  useBackground: true,
  backgroundShape: "rect",
  background: "#f5f5f5",
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function encodeSvgData(svgMarkup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)
    .replaceAll("'", "%27")
    .replaceAll('"', "%22")}`;
}

function createInlineFavicon(svgMarkup) {
  return `<link rel="icon" type="image/svg+xml" href="${encodeSvgData(
    svgMarkup,
  )}">`;
}

function createSvgMarkup(state) {
  const backgroundMarkup = state.useBackground
    ? state.backgroundShape === "circle"
      ? `<circle cx="64" cy="64" r="64" fill="${state.background}" />`
      : `<rect x="0" y="0" width="128" height="128" fill="${state.background}" />`
    : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${escapeXml(
      state.content || "Favicon preview",
    )}">`,
    backgroundMarkup,
    `<text x="${state.x}" y="${state.y}" dominant-baseline="middle" text-anchor="middle" font-size="${state.fontSize}" font-family="${state.fontFamily}" fill="${state.fill}" font-weight="${state.bold ? 700 : 400}">${escapeXml(
      state.content,
    )}</text>`,
    `</svg>`,
  ].join("");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadTextFile(
  text,
  filename,
  mimeType = "text/plain;charset=utf-8",
) {
  downloadBlob(new Blob([text], { type: mimeType }), filename);
}

function canvasToBlob(canvas, mimeType) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType);
  });
}

function createIcoBlobFromPngBlob(pngBlob, size) {
  return pngBlob.arrayBuffer().then((buffer) => {
    const pngBytes = new Uint8Array(buffer);
    const header = new ArrayBuffer(22);
    const view = new DataView(header);
    const bytes = new Uint8Array(header);

    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, 1, true);
    bytes[6] = size === 256 ? 0 : size;
    bytes[7] = size === 256 ? 0 : size;
    bytes[8] = 0;
    bytes[9] = 0;
    view.setUint16(10, 1, true);
    view.setUint16(12, 32, true);
    view.setUint32(14, pngBytes.length, true);
    view.setUint32(18, header.byteLength, true);

    const icoBytes = new Uint8Array(header.byteLength + pngBytes.length);
    icoBytes.set(new Uint8Array(header), 0);
    icoBytes.set(pngBytes, header.byteLength);

    return new Blob([icoBytes], { type: "image/x-icon" });
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

function Button({ children, className = "", ...props }) {
  return (
    <button className={`action-button ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [status, setStatus] = useState("Ready to edit.");

  const svgMarkup = useMemo(() => createSvgMarkup(state), [state]);
  const inlineLinkMarkup = useMemo(
    () => createInlineFavicon(svgMarkup),
    [svgMarkup],
  );
  const svgDataUrl = useMemo(() => encodeSvgData(svgMarkup), [svgMarkup]);

  useEffect(() => {
    const faviconLink = document.getElementById("favicon");
    if (faviconLink) {
      faviconLink.setAttribute("href", svgDataUrl);
    }
  }, [svgDataUrl]);

  const updateField = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setState((current) => ({
      ...current,
      [key]:
        key === "fontSize" || key === "x" || key === "y"
          ? Number(value)
          : value,
    }));
  };

  const notify = (message) => {
    setStatus(message);
  };

  const handleCopy = async (label, text) => {
    try {
      await copyText(text);
      notify(`Copied ${label}.`);
    } catch (error) {
      console.error(error);
      notify(`Could not copy ${label}.`);
    }
  };

  const handleDownloadSvg = () => {
    downloadTextFile(svgMarkup, "icon.svg", "image/svg+xml;charset=utf-8");
    notify("Downloaded icon.svg.");
  };

  const handleDownloadManifest = () => {
    downloadTextFile(
      DEFAULT_MANIFEST,
      "site.webmanifest",
      "application/manifest+json",
    );
    notify("Downloaded site.webmanifest.");
  };

  const handleExport = async (option) => {
    if (option.disabled) {
      return;
    }

    try {
      if (option.type === "svg") {
        handleDownloadSvg();
        return;
      }

      const exportMarkup = svgMarkup
        .replace('width="128"', `width="${option.size}"`)
        .replace('height="128"', `height="${option.size}"`);

      const canvas = document.createElement("canvas");
      canvas.width = option.size;
      canvas.height = option.size;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas rendering is unavailable.");
      }

      await Canvg.fromString(context, exportMarkup, {
        ignoreMouse: true,
        ignoreAnimation: true,
      }).render();

      const pngBlob = await canvasToBlob(canvas, "image/png");
      if (!pngBlob) {
        throw new Error(`Unable to create ${option.filename}.`);
      }

      if (option.type === "png") {
        downloadBlob(pngBlob, option.filename);
        notify(`Downloaded ${option.filename}.`);
        return;
      }

      if (option.type === "ico") {
        const icoBlob = await createIcoBlobFromPngBlob(pngBlob, option.size);
        downloadBlob(icoBlob, option.filename);
        notify(`Downloaded ${option.filename}.`);
      }
    } catch (error) {
      console.error(error);
      notify(`Export failed for ${option.filename}.`);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero panel">
        <div className="eyebrow">Favicon generator</div>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>SVG Favicon Generator</h1>
            <p>Generate and export favicon assets from one plain workspace.</p>
          </div>
          <div className="hero-meta">
            <span>Emoji</span>
            <span>Unicode</span>
            <span>Text</span>
            <span>SVG</span>
            <span>PNG</span>
            <span>ICO</span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel controls-panel">
          <section className="control-group">
            <div className="section-kicker">Glyph</div>
            <label className="field field-text">
              <span className="field-label">Content</span>
              <input
                type="text"
                value={state.content}
                placeholder="Enter a letter or symbol"
                onChange={updateField("content")}
              />
            </label>

            <label className="field field-range">
              <div className="field-head">
                <span className="field-label">Font size</span>
                <span className="field-value">{state.fontSize}</span>
              </div>
              <input
                type="range"
                min="72"
                max="200"
                step="1"
                value={state.fontSize}
                onChange={updateField("fontSize")}
              />
            </label>

            <label className="field field-range">
              <div className="field-head">
                <span className="field-label">X</span>
                <span className="field-value">{state.x}</span>
              </div>
              <input
                type="range"
                min="0"
                max="128"
                step="1"
                value={state.x}
                onChange={updateField("x")}
              />
            </label>

            <label className="field field-range">
              <div className="field-head">
                <span className="field-label">Y</span>
                <span className="field-value">{state.y}</span>
              </div>
              <input
                type="range"
                min="0"
                max="128"
                step="1"
                value={state.y}
                onChange={updateField("y")}
              />
            </label>
          </section>

          <section className="control-group">
            <div className="section-kicker">Typography</div>
            <label className="field">
              <span className="field-label">Font family</span>
              <select
                value={state.fontFamily}
                onChange={updateField("fontFamily")}
              >
                {FONT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-inline">
              <span className="field-label">Bold</span>
              <input
                type="checkbox"
                checked={state.bold}
                onChange={updateField("bold")}
              />
            </label>

            <label className="field field-inline">
              <span className="field-label">Fill</span>
              <input
                type="color"
                value={state.fill}
                onChange={updateField("fill")}
              />
            </label>
          </section>

          <section className="control-group">
            <div className="section-kicker">Backdrop</div>
            <label className="field field-inline">
              <span className="field-label">Use background</span>
              <input
                type="checkbox"
                checked={state.useBackground}
                onChange={updateField("useBackground")}
              />
            </label>

            <label className="field">
              <span className="field-label">Background shape</span>
              <select
                value={state.backgroundShape}
                onChange={updateField("backgroundShape")}
                disabled={!state.useBackground}
              >
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </label>

            <label className="field field-inline">
              <span className="field-label">Background color</span>
              <input
                type="color"
                value={state.background}
                onChange={updateField("background")}
                disabled={!state.useBackground}
              />
            </label>
          </section>
        </aside>

        <section className="panel preview-panel">
          <div className="section-kicker">Live preview</div>
          <div className="preview-stage">
            <div
              className="preview-frame"
              aria-label="Generated favicon preview"
            >
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
            <article className="snippet-card">
              <div className="snippet-header">
                <h2>SVG source</h2>
                <span>Copy or download the raw markup.</span>
              </div>
              <textarea
                value={svgMarkup}
                readOnly
                rows="7"
                spellCheck="false"
              />
              <div className="button-row">
                <Button onClick={() => handleCopy("SVG source", svgMarkup)}>
                  Copy SVG Source
                </Button>
                <Button
                  className="button-secondary"
                  onClick={handleDownloadSvg}
                >
                  Download SVG
                </Button>
              </div>
            </article>

            <article className="snippet-card">
              <div className="snippet-header">
                <h2>Inline favicon</h2>
                <span>Drop this into any document head.</span>
              </div>
              <textarea
                value={inlineLinkMarkup}
                readOnly
                rows="7"
                spellCheck="false"
              />
              <div className="button-row">
                <Button
                  onClick={() => handleCopy("inline favicon", inlineLinkMarkup)}
                >
                  Copy as Inline SVG Favicon
                </Button>
              </div>
            </article>
          </div>

          <article className="snippet-card export-card">
            <div className="snippet-header">
              <h2>Download assets</h2>
              <span>Generate the favicon set in one pass.</span>
            </div>
            <div className="export-grid">
              {EXPORT_OPTIONS.map((option) => (
                <button
                  key={option.filename}
                  className={`export-tile export-${option.accent}`}
                  onClick={() => handleExport(option)}
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
            <article className="snippet-card">
              <div className="snippet-header">
                <h2>Head snippets</h2>
                <span>Recommended links for a basic favicon stack.</span>
              </div>
              <textarea
                value={DEFAULT_HEAD_SNIPPET}
                readOnly
                rows="6"
                spellCheck="false"
              />
              <div className="button-row">
                <Button
                  onClick={() =>
                    handleCopy("head snippets", DEFAULT_HEAD_SNIPPET)
                  }
                >
                  Copy Head Snippets
                </Button>
              </div>
            </article>

            <article className="snippet-card">
              <div className="snippet-header">
                <h2>Web manifest</h2>
                <span>Manifest payload used by the export set.</span>
              </div>
              <textarea
                value={DEFAULT_MANIFEST}
                readOnly
                rows="9"
                spellCheck="false"
              />
              <div className="button-row">
                <Button
                  onClick={() => handleCopy("manifest JSON", DEFAULT_MANIFEST)}
                >
                  Copy Manifest JSON
                </Button>
                <Button
                  className="button-secondary"
                  onClick={handleDownloadManifest}
                >
                  Download site.webmanifest
                </Button>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>&copy; Andy Gock</span>
        <a href="https://gock.net/" target="_blank" rel="noreferrer">
          Author site
        </a>
        <a
          href="https://github.com/andygock/svg-favicon-generator/"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;
