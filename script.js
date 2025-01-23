document.addEventListener(
  "DOMContentLoaded",
  (function () {
    // svg elements
    const inputSvgText = document.querySelector("#svg text");
    const inputSvgRect = document.querySelector("#svg rect");

    // user inputs
    const inputText = document.getElementById("input");
    const inputFontSize = document.getElementById("font-size");
    const inputSvgSrc = document.getElementById("svg");
    const inputX = document.getElementById("x");
    const inputY = document.getElementById("y");
    const inputFill = document.getElementById("fill");
    const inputBackground = document.getElementById("background");
    const inputFontFamily = document.getElementById("font-family");
    const inputTextArea = document.getElementById("output-text");
    const inputFontWeight = document.getElementById("font-weight");

    function updateSVG() {
      inputSvgText.textContent = inputText.value;
      inputSvgText.setAttribute("font-size", inputFontSize.value);
      inputSvgText.setAttribute("x", inputX.value);
      inputSvgText.setAttribute("y", inputY.value);
      inputSvgText.setAttribute("font-family", inputFontFamily.value);
      inputSvgText.setAttribute("fill", inputFill.value);
      inputSvgText.setAttribute(
        "font-weight",
        inputFontWeight.checked ? "bold" : "normal"
      );
      inputSvgRect.setAttribute("fill", inputBackground.value);

      inputTextArea.textContent = inputSvgSrc.outerHTML
        .split("\n")
        .map((line) => line.trim())
        .join("");
    }

    // event listeners
    inputText.addEventListener("input", updateSVG);
    inputFontSize.addEventListener("input", updateSVG);
    inputX.addEventListener("input", updateSVG);
    inputY.addEventListener("input", updateSVG);
    inputFontFamily.addEventListener("input", updateSVG);
    inputFill.addEventListener("input", updateSVG);
    inputBackground.addEventListener("input", updateSVG);
    inputFontWeight.addEventListener("input", updateSVG);

    updateSVG(); // Initial call to set the SVG text and font size

    // download button
    const downloadButton = document.getElementById("download");
    downloadButton.addEventListener("click", () => {
      const svg = document.querySelector("svg");
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = inputText.value + ".svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });

    // copy svg source button
    const copyButton = document.getElementById("copy");
    copyButton.addEventListener("click", () => {
      const svgData = inputTextArea;
      navigator.clipboard.writeText(svgData).then(
        () => {
          console.log("SVG source copied to clipboard");
        },
        (err) => {
          console.error("Error copying SVG source to clipboard", err);
        }
      );
    });
  })()
);
