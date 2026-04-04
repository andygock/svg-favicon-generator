import { useEffect, useMemo, useState } from "react";
import { Canvg } from "canvg";
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
      <CompactHeader />
      <main className="workspace">
        <ControlPanel
          state={state}
          fontOptions={FONT_OPTIONS}
          onFieldChange={updateField}
        />

        <PreviewPanel
          svgMarkup={svgMarkup}
          inlineLinkMarkup={inlineLinkMarkup}
          status={status}
          defaultHeadSnippet={DEFAULT_HEAD_SNIPPET}
          defaultManifest={DEFAULT_MANIFEST}
          exportOptions={EXPORT_OPTIONS}
          onCopy={handleCopy}
          onDownloadSvg={handleDownloadSvg}
          onDownloadManifest={handleDownloadManifest}
          onExport={handleExport}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
