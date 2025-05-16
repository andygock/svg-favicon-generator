import { Canvg } from "canvg";
import { parseICO } from "icojs/browser";

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

    // pwa checkbox
    const inputIsPwa = document.getElementById("is-pwa");

    function updatePwaControls() {
      // Example: Show/hide manifest output based on PWA selection
      const manifestSection = document.getElementById("manifest");
      const manifestLine = `<link rel="manifest" href="/site.webmanifest">`;
      if (inputIsPwa.checked) {
        if (manifestSection) manifestSection.style.display = "block";

        // append manifest line to the head
        const manifestTextArea = document.getElementById("output-head");
        manifestTextArea.textContent += manifestLine;

        // any element with "pwa" as a class, must be made visible
        const pwaElements = document.querySelectorAll(".pwa");
        pwaElements.forEach((element) => {
          // remove the "hide" class name to make it visible, if it exists
          element.classList.remove("hide");
        });
      } else {
        if (manifestSection) manifestSection.style.display = "none";

        // remove manifest line from the head
        const manifestTextArea = document.getElementById("output-head");
        const manifestContent = manifestTextArea.textContent;
        const manifestLineIndex = manifestContent.indexOf(manifestLine);
        if (manifestLineIndex !== -1) {
          manifestTextArea.textContent = manifestContent.slice(
            0,
            manifestLineIndex
          );
        }

        // any element with "pwa" as a class, must be hidden
        const pwaElements = document.querySelectorAll(".pwa");
        pwaElements.forEach((element) => {
          // add the class name "hide" to hide it, do not change display
          element.classList.add("hide");
        });
      }
    }

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
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        // Modern API
        navigator.clipboard.writeText(text).catch((err) => {
          console.error("Error copying text to clipboard", err);
        });
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback: Oops, unable to copy", err);
        }
        document.body.removeChild(textarea);
      }
    }

    function createInlineFavicon(svgString) {
      const encodedSvg = encodeURIComponent(svgString)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");
      const dataUrl = `data:image/svg+xml,${encodedSvg}`;
      return `<link rel="icon" type="image/svg+xml" href="${dataUrl}" />`;
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

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }

    function downloadTextAsFile(
      text,
      filename,
      type = "text/plain;charset=utf-8"
    ) {
      const blob = new Blob([text], { type });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }

    //
    // event listeners
    //
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

    // PWA checkbox
    inputIsPwa.addEventListener("change", updatePwaControls);

    //
    // copy buttons
    //
    setupCopyButton("copy-svg", () => svgTextArea.textContent);
    setupCopyButton("copy-link", () =>
      createInlineFavicon(svgTextArea.textContent)
    );
    setupCopyButton("copy-head", () => {
      const text = document.getElementById("output-head").textContent;
      return text;
    });
    setupCopyButton("copy-manifest", () => {
      const text = document.getElementById("output-manifest").textContent;
      return text;
    });

    updateSvg();
    updateBackgroundControls();
    updatePwaControls();

    //
    // download buttons
    //

    // download SVG button
    const downloadButton = document.getElementById("download-svg");
    downloadButton.addEventListener("click", () => {
      const svgContent = document.getElementById("output-svg").textContent;
      const svgBlob = new Blob([svgContent], {
        type: "image/svg+xml;charset=utf-8",
      });
      downloadBlob(svgBlob, "icon.svg");
    });

    // download button for site.webmanifest
    const downloadManifestButton = document.getElementById("download-manifest");
    downloadManifestButton.addEventListener("click", () => {
      const manifestContent =
        document.getElementById("output-manifest").textContent;
      downloadTextAsFile(
        manifestContent,
        "site.webmanifest",
        "application/manifest+json"
      );
    });

    // download buttons for ICO and PNGs
    Array.from(document.querySelectorAll(".download-pngs button")).forEach(
      (button) => {
        button.addEventListener("click", async () => {
          const size = parseInt(button.dataset.size);
          const filename = button.dataset.filename;
          let svgContent = document.getElementById("output-svg").textContent;

          // Set SVG width/height to match canvas size, think we can leave the viewBox alone
          svgContent = svgContent
            .replace(/width="[^"]*"/, `width="${size}"`)
            .replace(/height="[^"]*"/, `height="${size}"`);

          // create hidden canvas
          const canvas = document.createElement("canvas");
          canvas.style.display = "none";
          document.body.appendChild(canvas);

          // set canvas size
          canvas.width = size;
          canvas.height = size;

          // Render SVG to canvas and download PNG as binary
          await Canvg.fromString(canvas.getContext("2d"), svgContent, {
            ignoreMouse: true,
            ignoreAnimation: true,
          }).render();

          if (filename.endsWith(".png")) {
            // convert canvas to PNG format
            canvas.toBlob((blob) => {
              if (!blob) {
                alert("Failed to generate PNG.");
                document.body.removeChild(canvas);
                return;
              }

              // download PNG file
              downloadBlob(blob, filename);
            }, "image/png");
          } else if (filename.endsWith(".ico")) {
            // convert canvas to ICO format
            // https://github.com/egy186/icojs
            canvas.toBlob(async (canvasBlob) => {
              if (!canvasBlob) {
                alert("Failed to generate ICO.");
                document.body.removeChild(canvas);
                return;
              }

              const arrayBuffer = await canvasBlob.arrayBuffer();

              // returns Uint8Array in .data
              const icoData = (await parseICO(arrayBuffer))?.[0]?.data;
              if (!icoData) {
                alert("Failed to parse ICO data.");
                document.body.removeChild(canvas);
                return;
              }

              // download ICO file
              const blob = new Blob([icoData], {
                type: "image/x-icon",
              });
              downloadBlob(blob, filename);
            });
          } else if (filename.endsWith(".svg")) {
            // download SVG file
            downloadTextAsFile(svgContent, filename, "image/svg+xml");
          }

          // remove canvas, if it exists
          if (canvas?.parentNode) {
            document.body.removeChild(canvas);
          }
        });
      }
    );
  })()
);
