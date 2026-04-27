import { useEffect, useMemo, useState } from "react";
import { CompactHeader } from "./components/CompactHeader";
import { ControlPanel } from "./components/ControlPanel";
import { Footer } from "./components/Footer";
import { PreviewPanel } from "./components/PreviewPanel";
import {
  DEFAULT_HEAD_SNIPPET,
  DEFAULT_MANIFEST,
  DEFAULT_STATE,
  DEFAULT_STATUS,
  EXPORT_OPTIONS,
  FONT_OPTIONS,
} from "./constants";
import {
  canvasToBlob,
  copyText,
  createIcoBlobFromPngBlob,
  createInlineFavicon,
  createSvgMarkup,
  downloadBlob,
  downloadTextFile,
  encodeSvgData,
} from "./lib/favicon";

function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);

  const svgMarkup = useMemo(() => createSvgMarkup(state), [state]);
  const inlineLinkMarkup = useMemo(
    () => createInlineFavicon(svgMarkup),
    [svgMarkup],
  );
  const svgDataUrl = useMemo(() => encodeSvgData(svgMarkup), [svgMarkup]);

  const headSnippet = useMemo(() => {
    if (state.includePwa) return DEFAULT_HEAD_SNIPPET;
    return DEFAULT_HEAD_SNIPPET.split("\n")
      .filter((l) => !l.includes('rel="manifest"'))
      .join("\n");
  }, [state.includePwa]);

  const exportOptionsComputed = useMemo(() => {
    const manifestOption = {
      label: "site.webmanifest",
      size: "-",
      filename: "site.webmanifest",
      type: "manifest",
      accent: "ghost",
    };

    // When PWA is disabled, exclude the PWA-only PNG assets
    const filtered = EXPORT_OPTIONS.filter((opt) => {
      if (!state.includePwa) {
        return (
          opt.filename !== "icon-192.png" && opt.filename !== "icon-512.png"
        );
      }
      return true;
    });

    return state.includePwa ? [...filtered, manifestOption] : filtered;
  }, [state.includePwa]);

  useEffect(() => {
    // Generate a PNG favicon from the live preview SVG so the browser
    // tab icon matches the rendered preview. Use devicePixelRatio to
    // produce a crisp icon on high-DPI displays.
    let cancelled = false;

    (async () => {
      const faviconLink = document.getElementById("favicon");
      if (!faviconLink) return;

      // Default to the SVG data URL as a fallback
      let href = svgDataUrl;

      try {
        const previewSvg = document.querySelector(".preview-surface svg");
        let serialized = svgMarkup;
        if (previewSvg) {
          const clone = previewSvg.cloneNode(true);
          clone.setAttribute("width", "128");
          clone.setAttribute("height", "128");

          const textEls = clone.querySelectorAll("text, tspan");
          const srcTextEls = previewSvg.querySelectorAll("text, tspan");
          for (let i = 0; i < textEls.length; i++) {
            const dst = textEls[i];
            const src = srcTextEls[i] || dst;
            const cs = window.getComputedStyle(src);
            const inline = [];
            if (cs.fontFamily) inline.push(`font-family: ${cs.fontFamily}`);
            if (cs.fontSize) inline.push(`font-size: ${cs.fontSize}`);
            if (cs.fontWeight) inline.push(`font-weight: ${cs.fontWeight}`);
            if (cs.fontStyle) inline.push(`font-style: ${cs.fontStyle}`);
            if (cs.letterSpacing)
              inline.push(`letter-spacing: ${cs.letterSpacing}`);
            if (cs.fill) inline.push(`fill: ${cs.fill}`);
            const ta = src.getAttribute("text-anchor") || cs.textAnchor;
            if (ta) dst.setAttribute("text-anchor", ta);
            const db =
              src.getAttribute("dominant-baseline") || cs.dominantBaseline;
            if (db) dst.setAttribute("dominant-baseline", db);
            if (inline.length) dst.setAttribute("style", inline.join("; "));
          }

          serialized = new XMLSerializer().serializeToString(clone);
        }

        const svgBlob = new Blob([serialized], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        try {
          const ratio = Math.max(1, window.devicePixelRatio || 1);
          const size = 64; // base favicon size; browser will scale as needed
          const canvas = document.createElement("canvas");
          canvas.width = size * ratio;
          canvas.height = size * ratio;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas unavailable");

          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              try {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = () =>
              reject(new Error("Failed to load SVG for favicon"));
            img.src = url;
          });

          // Use PNG data URL for favicon to ensure consistent tab rendering
          href = canvas.toDataURL("image/png");
        } finally {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // Keep fallback href (svgDataUrl)
      }

      if (!cancelled) faviconLink.setAttribute("href", href);
    })();

    return () => {
      cancelled = true;
    };
  }, [svgDataUrl, svgMarkup]);

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

  // Keep downloaded package names filesystem-safe across Windows, macOS,
  // and Linux. The source glyph can contain characters that are legal in the
  // SVG preview but invalid or awkward in filenames, so we normalize and
  // strip the common forbidden cases before adding the .zip extension.
  const sanitizeFilenameBase = (value, fallback = "content") => {
    const forbidden = '<>:"/\\|?*';
    const cleaned = Array.from(String(value ?? "").normalize("NFKD"))
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code >= 32 && code !== 127 && !forbidden.includes(character);
      })
      .join("")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+/, "")
      .replace(/^-+|-+$/g, "")
      .trim();

    return cleaned || fallback;
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

    if (option.type === "manifest") {
      handleDownloadManifest();
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

      // Rasterize the SVG using the browser's native renderer by
      // creating an object URL for the SVG markup and drawing the
      // resulting image into the canvas. This avoids font/measurement
      // differences introduced by JS-based renderers (e.g. Canvg).
      // Prefer serializing the live preview SVG and inlining computed
      // styles so exported SVG uses the same font metrics and styling
      // as the DOM preview. Fall back to `exportMarkup` if preview
      // isn't available.
      let serialized = exportMarkup;
      try {
        const previewSvg = document.querySelector(".preview-surface svg");
        if (previewSvg) {
          const clone = previewSvg.cloneNode(true);

          // Ensure explicit size attributes so rasterization scales predictably
          clone.setAttribute("width", "128");
          clone.setAttribute("height", "128");

          // Inline computed styles for textual elements to preserve
          // font-family, font-size, font-weight, fill, and baseline
          // behavior when the SVG is loaded off-document.
          const textEls = clone.querySelectorAll("text, tspan");
          const srcTextEls = previewSvg.querySelectorAll("text, tspan");
          for (let i = 0; i < textEls.length; i++) {
            const dst = textEls[i];
            const src = srcTextEls[i] || dst;
            const cs = window.getComputedStyle(src);
            const inline = [];
            if (cs.fontFamily) inline.push(`font-family: ${cs.fontFamily}`);
            if (cs.fontSize) inline.push(`font-size: ${cs.fontSize}`);
            if (cs.fontWeight) inline.push(`font-weight: ${cs.fontWeight}`);
            if (cs.fontStyle) inline.push(`font-style: ${cs.fontStyle}`);
            if (cs.letterSpacing)
              inline.push(`letter-spacing: ${cs.letterSpacing}`);
            if (cs.fill) inline.push(`fill: ${cs.fill}`);
            // Preserve text-anchor/dominant-baseline if present on source
            const ta = src.getAttribute("text-anchor") || cs.textAnchor;
            if (ta) dst.setAttribute("text-anchor", ta);
            const db =
              src.getAttribute("dominant-baseline") || cs.dominantBaseline;
            if (db) dst.setAttribute("dominant-baseline", db);

            if (inline.length) dst.setAttribute("style", inline.join("; "));
          }

          // Serialize using XMLSerializer for robust escaping
          serialized = new XMLSerializer().serializeToString(clone);
        }
      } catch (e) {
        // If anything fails, fall back to the generated markup
        serialized = exportMarkup;
      }

      const svgBlob = new Blob([serialized], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      try {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              context.clearRect(0, 0, canvas.width, canvas.height);
              context.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = (e) => reject(new Error("Failed to load SVG image."));
          // Use object URL to ensure the browser rasterizes the provided SVG
          img.src = url;
        });
      } finally {
        // Revoke the object URL regardless of success/failure
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      }

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

  const handleDownloadAll = async () => {
    notify("Preparing download...");
    setDownloadAllLoading(true);
    try {
      const files = {};
      const enc = new TextEncoder();

      // Core text assets
      files["icon.svg"] = enc.encode(svgMarkup);
      files["inline-favicon.txt"] = enc.encode(inlineLinkMarkup);
      files["head-snippet.txt"] = enc.encode(headSnippet);
      if (state.includePwa) {
        files["site.webmanifest"] = enc.encode(DEFAULT_MANIFEST);
      }

      // Rasterized assets (png / ico) from export options
      for (const option of exportOptionsComputed) {
        if (option.disabled) continue;
        if (option.type === "svg" || option.type === "manifest") continue;

        const exportMarkup = svgMarkup
          .replace('width="128"', `width="${option.size}"`)
          .replace('height="128"', `height="${option.size}"`);

        const svgBlob = new Blob([exportMarkup], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = option.size;
                canvas.height = option.size;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas unavailable");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const pngBlob = await canvasToBlob(canvas, "image/png");
                if (!pngBlob) throw new Error("Unable to create PNG");

                if (option.type === "png") {
                  const ab = await pngBlob.arrayBuffer();
                  files[option.filename] = new Uint8Array(ab);
                  resolve();
                } else if (option.type === "ico") {
                  const icoBlob = await createIcoBlobFromPngBlob(
                    pngBlob,
                    option.size,
                  );
                  const ab = await icoBlob.arrayBuffer();
                  files[option.filename] = new Uint8Array(ab);
                  resolve();
                } else {
                  resolve();
                }
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = () => reject(new Error("Failed to load SVG image."));
            img.src = url;
          });
        } finally {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            // ignore
          }
        }
      }

      // Load fflate only when needed and create a high-compression zip
      const { zipSync } = await import("fflate");
      const zipData = zipSync(files, { level: 9 });
      const zipBlob = new Blob([zipData], { type: "application/zip" });

      // Default filename should be {content}.zip; fall back to 'content'
      const safeName = sanitizeFilenameBase(state.content);
      const filename = `${safeName}.zip`;
      downloadBlob(zipBlob, filename);
      notify(`Downloaded ${filename}.`);
    } catch (err) {
      console.error(err);
      notify("Could not create package.");
    } finally {
      setDownloadAllLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <CompactHeader status={status} />
      <main className="workspace">
        <ControlPanel
          state={state}
          fontOptions={FONT_OPTIONS}
          onFieldChange={updateField}
        />

        <PreviewPanel
          svgMarkup={svgMarkup}
          inlineLinkMarkup={inlineLinkMarkup}
          defaultHeadSnippet={headSnippet}
          includePwa={state.includePwa}
          defaultManifest={DEFAULT_MANIFEST}
          exportOptions={exportOptionsComputed}
          onCopy={handleCopy}
          onDownloadSvg={handleDownloadSvg}
          onDownloadManifest={handleDownloadManifest}
          onExport={handleExport}
          onDownloadAll={handleDownloadAll}
          downloadAllLoading={downloadAllLoading}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
