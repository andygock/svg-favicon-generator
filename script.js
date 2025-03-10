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
    const svgTextArea = document.getElementById("output-svg");
    const inputBackgroundShape = document.getElementById("background-shape");

    // checkboxes
    const inputBold = document.getElementById("font-weight-bold");
    const inputUseBackground = document.getElementById("use-background");

    function updateSvg() {
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

      svgTextArea.textContent = svgContent;
      updateLinkTextArea(svgTextArea.textContent);

      // set favicon for this page
      const encodedSvg = encodeURIComponent(svgContent)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");
      const dataUrl = `data:image/svg+xml,${encodedSvg}`;
      favicon.href = dataUrl;
    } // updateSVG()

    function updateBackgroundControls() {
      const bgControls = document.querySelectorAll(".background-control");
      bgControls.forEach((control) => {
        control.style.display = inputUseBackground.checked ? "block" : "none";
      });
    } // updateBackgroundControls()

    // event listeners
    inputText.addEventListener("input", updateSvg);
    inputFontSize.addEventListener("input", updateSvg);
    inputX.addEventListener("input", updateSvg);
    inputY.addEventListener("input", updateSvg);
    inputFontFamily.addEventListener("input", updateSvg);
    inputFill.addEventListener("input", updateSvg);
    inputBackground.addEventListener("input", updateSvg);
    inputBold.addEventListener("input", updateSvg);
    inputUseBackground.addEventListener("input", () => {
      updateBackgroundControls();
      updateSvg();
    });
    inputBackgroundShape.addEventListener("input", updateSvg);

    updateSvg();
    updateBackgroundControls();

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(
        () => {
          console.log("Text copied to clipboard successfully!");
        },
        (err) => {
          console.error("Error copying text to clipboard", err);
        }
      );
    }

    function createInlineFavicon(svgString) {
      // Encode the SVG string into a data URL
      const encodedSvg = encodeURIComponent(svgString)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");

      const dataUrl = `data:image/svg+xml,${encodedSvg}`;

      // Return the favicon link element as a string
      return `<link id="favicon" rel="icon" type="image/svg+xml" href="${dataUrl}" />`;
    }

    function updateLinkTextArea(svgString) {
      const svgData = svgString;
      const inlineFavicon = createInlineFavicon(svgData);
      const outputLink = document.getElementById("output-link");
      outputLink.textContent = inlineFavicon;
    }

    function setupCopyButton(buttonId, getText) {
      const button = document.getElementById(buttonId);
      button.addEventListener("click", () => {
        const text = getText();
        copyToClipboard(text);
        const previousText = button.textContent;
        const previousWidth = button.clientWidth;
        button.style.width = previousWidth + "px";
        button.textContent = "Copied!";
        button.disabled = true;
        setTimeout(() => {
          button.textContent = previousText;
          button.disabled = false;
          button.style.width = "";
        }, 1000);
      });
    }

    setupCopyButton("copy-svg", () => svgTextArea.textContent);
    setupCopyButton("copy-link", () =>
      createInlineFavicon(svgTextArea.textContent)
    );

    // download button
    const downloadButton = document.getElementById("download");
    downloadButton.addEventListener("click", () => {
      const svgContent = document.getElementById("output-svg").textContent;
      const svgBlob = new Blob([svgContent], {
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
  })()
);
