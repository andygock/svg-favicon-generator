document.addEventListener(
  "DOMContentLoaded",
  (function () {
    // current favicon
    const favicon = document.getElementById("favicon");

    // svg elements
    const inputSvgText = document.querySelector("#svg text");
    const inputSvgRect = document.querySelector("#svg rect");
    const inputSvgCircle = document.querySelector("#svg circle");

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
    const inputBackgroundShape = document.getElementById("background-shape");

    // checkboxes
    const inputBold = document.getElementById("font-weight-bold");
    const inputUseBackground = document.getElementById("use-background");

    function updateSVG() {
      inputSvgText.textContent = inputText.value;
      inputSvgText.setAttribute("font-size", inputFontSize.value);
      inputSvgText.setAttribute("x", inputX.value);
      inputSvgText.setAttribute("y", inputY.value);
      inputSvgText.setAttribute("font-family", inputFontFamily.value);
      inputSvgText.setAttribute("fill", inputFill.value);
      inputSvgText.setAttribute(
        "font-weight",
        inputBold.checked ? "bold" : "normal"
      );

      if (inputUseBackground.checked) {
        // enable background controls
        inputBackground.disabled = false;
        inputBackgroundShape.disabled = false;

        // make background shape visible
        switch (inputBackgroundShape.value) {
          case "rect":
            inputSvgRect.setAttribute("visibility", "visible");
            inputSvgCircle.setAttribute("visibility", "hidden");
            break;
          case "circle":
            inputSvgRect.setAttribute("visibility", "hidden");
            inputSvgCircle.setAttribute("visibility", "visible");
            break;
          default:
            // hide all
            inputSvgRect.setAttribute("visibility", "hidden");
            inputSvgCircle.setAttribute("visibility", "hidden");
            break;
        }

        // fill background color
        inputSvgRect.setAttribute("fill", inputBackground.value);
        inputSvgCircle.setAttribute("fill", inputBackground.value);
      } else {
        // hide background, all of them
        inputSvgRect.setAttribute("visibility", "hidden");
        inputSvgCircle.setAttribute("visibility", "hidden");

        // disable background controls
        inputBackground.disabled = true;
        inputBackgroundShape.disabled = true;
      }

      const svgContent = inputSvgSrc.outerHTML
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => {
          // remove rect and and circle if not used
          if (line.includes("<rect ") && line.includes('visibility="hidden"')) {
            return false;
          }
          if (
            line.includes("<circle ") &&
            line.includes('visibility="hidden"')
          ) {
            return false;
          }
          return true;
        })
        .join("");

      inputTextArea.textContent = svgContent;

      // base64 encode the svg text content and set as favicon
      const svgDataEncoded = btoa(unescape(encodeURIComponent(svgContent)));
      const svgDataUri = "data:image/svg+xml;base64," + svgDataEncoded;
      favicon.href = svgDataUri;
    } // updateSVG()

    function updateBackgroundControls() {
      const bgControls = document.querySelectorAll(".background-control");
      bgControls.forEach((control) => {
        control.style.display = inputUseBackground.checked ? "block" : "none";
      });
    } // updateBackgroundControls()

    // event listeners
    inputText.addEventListener("input", updateSVG);
    inputFontSize.addEventListener("input", updateSVG);
    inputX.addEventListener("input", updateSVG);
    inputY.addEventListener("input", updateSVG);
    inputFontFamily.addEventListener("input", updateSVG);
    inputFill.addEventListener("input", updateSVG);
    inputBackground.addEventListener("input", updateSVG);
    inputBold.addEventListener("input", updateSVG);
    inputUseBackground.addEventListener("input", () => {
      updateBackgroundControls();
      updateSVG();
    });
    inputBackgroundShape.addEventListener("input", updateSVG);

    updateSVG();
    updateBackgroundControls();

    // download button
    const downloadButton = document.getElementById("download");
    downloadButton.addEventListener("click", () => {
      const svgBlob = new Blob([inputTextArea.textContent], {
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
      const svgData = inputTextArea.textContent;
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
