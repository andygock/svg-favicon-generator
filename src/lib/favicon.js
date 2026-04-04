export function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
