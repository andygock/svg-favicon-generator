export const DEFAULT_HEAD_SNIPPET = `<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="64x64">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

export const DEFAULT_MANIFEST = `{
  "icons": [
    { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/icon-mask.png", "type": "image/png", "sizes": "512x512", "purpose": "maskable" },
    { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" }
  ]
}`;

export const FONT_OPTIONS = [
  //   {
  //     label: "Roboto",
  //     value: "Roboto, sans-serif",
  //   },
  //   {
  //     label: "Roboto Mono",
  //     value: "Roboto Mono, monospace",
  //   },
  {
    label: "Sans Serif",
    value: "sans-serif",
  },
];

export const EXPORT_OPTIONS = [
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

export const DEFAULT_STATE = {
  content: "😊",
  fontSize: 92,
  x: 64,
  y: 74,
  fontFamily: FONT_OPTIONS[0].value,
  fill: "#111111",
  bold: false,
  useBackground: false,
  backgroundShape: "rect",
  background: "#ffffff",
};

export const DEFAULT_STATUS = "Ready.";
