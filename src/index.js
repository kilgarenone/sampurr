import { ZoomToMousePlugin } from "./zoom.js";
import WaveSurfer from "wavesurfer.js";
import RegionPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import "./index.css";

const urlForm = document.getElementById("url-form");
const progressValueEle = document.getElementById("progress-value");
const progressDescEle = document.getElementById("progress-desc");
const progressCont = document.getElementById("progress");
const downloadSampleForm = document.getElementById("download-sample-form");

const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "#eeeeee",
  height: 250,
  progressColor: "#ffc8bb",
  backend: "MediaElement",
  normalize: true,
  interact: false,
  minPxPerSec: 30,
  autoCenter: false,
  cursorColor: "red",
  plugins: [RegionPlugin.create(), ZoomToMousePlugin.create()],
});

wavesurfer.on("region-click", function (region, e) {
  e.stopPropagation();
  e.shiftKey ? region.playLoop() : region.play();
});

wavesurfer.on("waveform-ready", function (e) {
  progressCont.hidden = true;
});

let isCtrlKeyPressed = false;

document.addEventListener("keydown", function onEvent(event) {
  console.log("event:", event);
  console.log("event.key:", event.key);
  if (event.key === " ") {
    wavesurfer.playPause();
  } else if (event.key === "Control") {
    isCtrlKeyPressed = true;
    // Open Menu...
  }
});

downloadSampleForm.addEventListener("submit", (event) => {
  const data = new FormData(event.target);

  const sampleName = data.get("sample-name") || "sample";

  const region = Object.keys(wavesurfer.regions.list).map((id) => {
    const region = wavesurfer.regions.list[id];
    return {
      start: region.start,
      end: region.end,
    };
  })[0];

  // note: Fetch API won't prompt the 'Save as' dialog!
  // read more: https://medium.com/@drevets/you-cant-prompt-a-file-download-with-the-content-disposition-header-using-axios-xhr-sorry-56577aa706d6
  const a = document.createElement("a");
  a.style = "display: none";
  document.body.appendChild(a);
  a.href = `http://localhost:4000/download?start=${region.start}&end=${region.end}&title=${sampleName}`;
  a.download = `${sampleName}.wav`;
  a.click();
  a.remove();
});

const decoder = new TextDecoder();

urlForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  this.classList.add("js-hide");

  setTimeout(() => {
    this.hidden = true;
  }, 300);

  progressCont.hidden = false;
  progressCont.classList.add("js-show");

  document.getElementById("mini-url-form").classList.add("js-show");

  const data = new FormData(event.target);

  fetch(`http://localhost:4000/waveform?url=${data.get("url")}`)
    .then((response) => response.body)
    .then((rb) => {
      const reader = rb.getReader();

      return new ReadableStream({
        start(controller) {
          // The following function handles each data chunk
          function push() {
            // "done" is a Boolean and value a "Uint8Array"
            reader.read().then(({ done, value }) => {
              // If there is no more data to read
              if (done) {
                console.log("done", done);
                controller.close();
                return;
              }

              controller.enqueue(value);

              // Check chunks by logging to the console
              try {
                const { title, thumbnail, duration, percent, data, status } =
                  JSON.parse(decoder.decode(value, { stream: true }));
                if (percent) progressValueEle.textContent = percent;
                if (thumbnail) {
                  document.documentElement.style.setProperty(
                    "--thumbnail-image-url",
                    `url(${thumbnail})`
                  );
                  document.body.classList.add("js-thumbnail-ready");
                  progressDescEle.textContent = "Extracting audio";
                }
                if (status) {
                  progressDescEle.textContent = status;
                }
              } catch (e) {
                console.log("parseerrror:", e);
              }
              // Get the data and send it to the browser via the controller

              push();
            });
          }

          push();
        },
      });
    })
    .then((stream) => {
      // Respond with our stream
      return new Response(stream).text();
    })
    .then((result) => {
      const data = result.split('"}');
      return {
        media: JSON.parse(data[0] + `"}`),
        peaks: JSON.parse(data[data.length - 1]).data,
      };
    })
    .then(({ media, peaks }) => {
      if (media.thumbnail) {
        document.documentElement.style.setProperty(
          "--thumbnail-image-url",
          `url(${media.thumbnail})`
        );
        document.body.classList.add("js-thumbnail-ready");
      }
      // load peaks into wavesurfer.js
      // wavesurfer.load(`http://localhost:4000/${media.id}.wav`, peaks);
      wavesurfer.load(`http://localhost:4000/${"4aeETEoNfOg"}.wav`, peaks);
    })
    .catch((e) => {
      console.error("error", e);
    });
});

let isDown = false;
let scrollStartX = 0;
let scrollLeft = 0;

let maybeDoubleClickDragging = false;
let maybeDoubleClickDraggingTimeout = null;

const canvas = document.createElement("canvas");
canvas.id = "canvas";
const { width, height, left, top } =
  wavesurfer.container.getBoundingClientRect();
canvas.width = width;
canvas.height = height;
wavesurfer.container.appendChild(canvas);

const ctx = canvas.getContext("2d");
ctx.strokeStyle = "blue";
ctx.lineWidth = 3;
let offsetX = left;
let offsetY = top;
let startX = 0;
let seekX = 0;
let startY = 0;
let mouseX = 0;
let mouseY = 0;

function round(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

function getStartTime(clickX) {
  const duration = wavesurfer.getDuration();

  const startPercentX =
    (clickX + wavesurfer.container.firstChild.scrollLeft) /
    wavesurfer.container.firstChild.scrollWidth; // 0 to 1 range, 0 = start, 1 = end
  const startTime = duration * startPercentX;

  return startTime;
}

wavesurfer.container.addEventListener("click", function (e) {
  maybeDoubleClickDragging = true;
  wavesurfer.container.removeEventListener("mousemove", handleMousemove);

  if (isCtrlKeyPressed) {
    seekX = parseInt(e.clientX - offsetX);
    const duration = wavesurfer.getDuration();

    const startTime = getStartTime(seekX);
    console.log("startTime:", startTime);

    wavesurfer.seekTo(startTime / duration);
    isCtrlKeyPressed = false;
  }

  if (mouseX > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const duration = wavesurfer.getDuration();
    const startTime = getStartTime(startX);

    const startPercentX2 =
      (mouseX + wavesurfer.container.firstChild.scrollLeft) /
      wavesurfer.container.firstChild.scrollWidth; // 0 to 1 range, 0 = start, 1 = end
    const endTime = duration * startPercentX2;

    wavesurfer.addRegion({
      start: round(startTime, 3),
      end: round(endTime, 3),
    });

    downloadSampleForm.hidden = false;

    mouseX = 0;
  }
});

wavesurfer.container.addEventListener("mousedown", (e) => {
  e.preventDefault();
  e.stopPropagation();

  wavesurfer.container.addEventListener("mousemove", handleMousemove);
  wavesurfer.container.addEventListener("mouseup", handleMouseup);
  wavesurfer.container.addEventListener("mouseleave", handleMouseLeave);

  if (maybeDoubleClickDragging) {
    wavesurfer.clearRegions();

    clearTimeout(maybeDoubleClickDraggingTimeout);
    // save the starting x/y of the rectangle
    startX = parseInt(e.clientX - offsetX);

    return;
  }

  isDown = true;
  scrollStartX = e.pageX - wavesurfer.container.firstChild.offsetLeft;
  scrollLeft = wavesurfer.container.firstChild.scrollLeft;
});

function handleMouseLeave() {
  isDown = false;
}

function handleMouseup(e) {
  e.preventDefault();
  e.stopPropagation();

  maybeDoubleClickDraggingTimeout = setTimeout(() => {
    maybeDoubleClickDragging = false;
  }, 200);

  isDown = false;

  wavesurfer.container.removeEventListener("mousemove", handleMousemove);
  wavesurfer.container.removeEventListener("mouseup", handleMouseup);
  wavesurfer.container.removeEventListener("mouseleave", handleMouseLeave);
}

function handleMousemove(e) {
  e.preventDefault();
  e.stopPropagation();

  if (maybeDoubleClickDragging) {
    // get the current mouse position
    mouseX = parseInt(e.clientX - offsetX);
    // calculate the rectangle width/height based
    // on starting vs current mouse position
    let width = mouseX - startX;

    // clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw a new rect from the start position
    // to the current mouse position
    ctx.strokeRect(startX, 0, width, 300);

    return;
  }

  if (!isDown) return;

  const x = e.pageX - wavesurfer.container.firstChild.offsetLeft;
  const walk = (x - scrollStartX) * 3; //scroll-fast
  wavesurfer.container.firstChild.scrollLeft = scrollLeft - walk;
}
