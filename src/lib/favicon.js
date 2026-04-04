export function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sanitizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeColor(value) {
  if (!value && value !== "") return "";
  const s = String(value).trim();
  // Allow hex (#RGB or #RRGGBB) or rgb()/rgba()
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  const rgb =
    /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|0?\.\d+|1(?:\.0)?))?\s*\)$/i;
  if (hex.test(s) || rgb.test(s)) return escapeXml(s);
  // As a fallback, escape and return empty string to avoid injection
  return "";
}

const FONT_WHITELIST = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Times",
  "Courier New",
  "Courier",
  "sans-serif",
  "serif",
  "monospace",
];

function sanitizeFontFamily(value) {
  if (!value && value !== "") return "sans-serif";
  // Split comma separated families and pick first allowed family or fallback
  const parts = String(value)
    .split(",")
    .map((p) => p.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
  for (const p of parts) {
    if (FONT_WHITELIST.includes(p)) return escapeXml(p);
  }
  // If none matched, allow generic family names if present
  const lower = parts.map((p) => p.toLowerCase());
  for (const generic of ["sans-serif", "serif", "monospace"]) {
    if (lower.includes(generic)) return generic;
  }
  return "sans-serif";
}

export function encodeSvgData(svgMarkup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)
    .replaceAll("'", "%27")
    .replaceAll('"', "%22")}`;
}

export function createInlineFavicon(svgMarkup) {
  return `<link rel="icon" type="image/svg+xml" href="${encodeSvgData(
    svgMarkup,
  )}">`;
}

export function createSvgMarkup(state) {
  // Sanitize attribute values used in the SVG to avoid injection
  const aria = escapeXml(state.content || "Favicon preview");
  const bg = sanitizeColor(state.background);
  const x = sanitizeNumber(state.x, 64);
  const y = sanitizeNumber(state.y, 64);
  const fontSize = sanitizeNumber(state.fontSize, 40);
  const fontFamily = sanitizeFontFamily(state.fontFamily);
  const fill = sanitizeColor(state.fill) || "#000";
  const fontWeight = state.bold ? 700 : 400;

  const safeBackgroundMarkup = state.useBackground
    ? state.backgroundShape === "circle"
      ? `<circle cx="64" cy="64" r="64" fill="${bg}" />`
      : `<rect x="0" y="0" width="128" height="128" fill="${bg}" />`
    : "";

  // Generate a simple, standards-compliant SVG. Export code uses the
  // browser's native rasterizer when producing PNGs so no manual
  // vertical nudges are necessary.
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${aria}">`,
    safeBackgroundMarkup,
    `<text x="${x}" y="${y}" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}" font-weight="${fontWeight}">${escapeXml(
      state.content,
    )}</text>`,
    `</svg>`,
  ].join("");
}

export function downloadBlob(blob, filename) {
  // Create an object URL and trigger a download. Some browsers may not
  // start the download synchronously when `link.click()` returns, so
  // revoking the URL immediately can abort the transfer. Revoke the
  // object URL after a short delay to improve robustness.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  // Trigger download
  link.click();
  link.remove();

  // Give the browser time to start the download before revoking the
  // object URL. 1 second is a conservative default; it's short enough
  // to free resources while avoiding premature revocation.
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      // Swallow errors to avoid breaking callers if revoke fails.
    }
  }, 1000);
}

export function downloadTextFile(
  text,
  filename,
  mimeType = "text/plain;charset=utf-8",
) {
  downloadBlob(new Blob([text], { type: mimeType }), filename);
}

export function canvasToBlob(canvas, mimeType) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType);
  });
}

export function createIcoBlobFromPngBlob(pngBlob, size) {
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

export async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  // Fallback using a hidden textarea. Save and restore the document
  // focus/selection so we don't disrupt the user's interaction. Return
  // an explicit boolean success value and rethrow unexpected errors so
  // callers can surface failures to users.
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  const previousActive = document.activeElement;
  const selection = document.getSelection();
  const savedRanges = [];
  if (selection && selection.rangeCount > 0) {
    for (let i = 0; i < selection.rangeCount; i++) {
      savedRanges.push(selection.getRangeAt(i).cloneRange());
    }
  }

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const result = document.execCommand("copy");
    return !!result;
  } catch (err) {
    // Rethrow so callers can handle/display the error
    throw err;
  } finally {
    // Clean up the temporary element
    textarea.remove();

    // Restore previous focus
    try {
      if (previousActive && typeof previousActive.focus === "function") {
        previousActive.focus();
      }
    } catch (e) {
      // ignore
    }

    // Restore previous selection ranges
    try {
      const sel = document.getSelection();
      if (sel) {
        sel.removeAllRanges();
        for (const r of savedRanges) sel.addRange(r);
      }
    } catch (e) {
      // ignore
    }
  }
}
