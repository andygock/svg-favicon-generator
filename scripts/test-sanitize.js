const path = require("path");
const { pathToFileURL } = require("url");

async function run() {
  const fileUrl = pathToFileURL(
    path.resolve(__dirname, "../src/lib/favicon.js"),
  ).href;
  const mod = await import(fileUrl);
  const { createSvgMarkup } = mod;

  const maliciousState = {
    content: "X",
    useBackground: true,
    backgroundShape: "rect",
    background: "url(javascript:alert(1))",
    x: "64",
    y: "64",
    fontSize: "40",
    fontFamily: 'Arial\" onload=alert(1) "',
    fill: "rgba(0,0,0,1)",
    bold: false,
  };

  const svg = createSvgMarkup(maliciousState);

  if (svg.includes("onload") || svg.includes("javascript:")) {
    console.error("Sanitization failed: found unsafe tokens in SVG");
    console.error(svg);
    process.exit(1);
  }

  console.log("Sanitization smoke test passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
