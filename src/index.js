import WaveSurfer from "wavesurfer.js";
import RegionPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import { ZoomToMousePlugin } from "./zoom.js";
import { getStartTime, round } from "./functions.js";

import "./css/reset.css";
import "./css/wavesurfer.css";
import "./css/index.css";

const urlForm = document.getElementById("url-form");
const miniUrlForm = document.getElementById("mini-url-form");
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

const canvas = document.createElement("canvas");
canvas.id = "canvas";
const { width, height, left, top } =
  wavesurfer.container.getBoundingClientRect();
let offsetX = left;
let offsetY = top;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "#000";
ctx.lineWidth = 2;

wavesurfer.container.appendChild(canvas);

let MEDIA_ID = "";
let isCtrlKeyPressed = false;
let maybeDoubleClickDragging = false;
let isDown = false;
let scrollStartX = 0;
let scrollLeft = 0;
let maybeDoubleClickDraggingTimeout = null;
let startX = 0;
let seekX = 0;
let startY = 0;
let mouseX = 0;
let mouseY = 0;

wavesurfer.on("region-click", function (region, e) {
  e.stopPropagation();
  region.play();
});

wavesurfer.on("waveform-ready", function (e) {
  progressCont.hidden = true;
});

document.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    wavesurfer.playPause();
  } else if (event.key === "Control") {
    isCtrlKeyPressed = true;
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
  a.href = `http://localhost:4000/download?start=${region.start}&end=${region.end}&title=${sampleName}&id=${MEDIA_ID}`;
  a.download = `${sampleName}.flac`;
  a.click();
  a.remove();
});

miniUrlForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  progressValueEle.textContent = 0;
  progressDescEle.textContent = "Loading";

  wavesurfer.empty();
  wavesurfer.clearRegions();
  wavesurfer.setCursorColor("transparent");

  downloadSampleForm.hidden = true;

  progressCont.hidden = false;
  progressCont.classList.add("js-show");

  const data = new FormData(event.target);

  // const response = await fetchWaveform(data.get("url"));

  // processAndSetupWaveform(response);
});

const decoder = new TextDecoder();

async function fetchWaveform(url) {
  const response = await fetch(`http://localhost:4000/waveform?url=${url}`);
  const reader = response.body.getReader();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) return result;

    try {
      const chunk = decoder.decode(value, { stream: true });

      result += chunk;

      const { title, thumbnail, duration, percent, data, status } =
        JSON.parse(chunk);

      if (percent) {
        progressValueEle.textContent = percent;
      }

      if (thumbnail) {
        document.documentElement.style.setProperty(
          "--thumbnail-image-url",
          `url(${thumbnail})`
        );

        document.body.classList.add("js-in-app");

        document.body.classList.remove("js-thumbnail-ready");

        setTimeout(() => {
          document.body.classList.add("js-thumbnail-ready");
        }, 2500);

        progressDescEle.textContent = "Extracting audio";
      }

      if (status) {
        progressDescEle.textContent = status;
      }
    } catch (e) {
      console.log("e:", e);
    }
  }
}

function processAndSetupWaveform(chunks) {
  const data = chunks.split('"}');
  const media = JSON.parse(data[0] + `"}`);
  const peaks = JSON.parse(data[data.length - 1]).data;

  downloadSampleForm.reset();
  miniUrlForm.reset();

  miniUrlForm.classList.add("js-show");

  // unblur so user can start using keyboard shoftcut unaffected
  document.activeElement.blur();

  wavesurfer.setCursorColor("red");

  MEDIA_ID = media.id;
  // load peaks into wavesurfer.js
  wavesurfer.load(`http://localhost:4000/${MEDIA_ID}.flac`, peaks);
}

urlForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  this.classList.add("js-hide");

  setTimeout(() => {
    this.hidden = true;
  }, 300);

  progressCont.hidden = false;
  progressCont.classList.add("js-show");

  const data = new FormData(event.target);

  const response = await fetchWaveform(data.get("url"));

  processAndSetupWaveform(response);
});

wavesurfer.container.addEventListener("click", function (e) {
  maybeDoubleClickDragging = true;
  wavesurfer.container.removeEventListener("mousemove", handleMousemove);

  if (isCtrlKeyPressed) {
    seekX = parseInt(e.clientX - offsetX);
    const duration = wavesurfer.getDuration();

    const startTime = getStartTime(seekX, wavesurfer);

    wavesurfer.seekTo(startTime / duration);
    isCtrlKeyPressed = false;
  }

  if (mouseX > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const duration = wavesurfer.getDuration();
    const startTime = getStartTime(startX, wavesurfer);

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
    isCtrlKeyPressed = false;
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
    ctx.strokeRect(startX, -10, width, 300);

    return;
  }

  if (!isDown) return;

  const x = e.pageX - wavesurfer.container.firstChild.offsetLeft;
  const walk = (x - scrollStartX) * 3; //scroll-fast
  wavesurfer.container.firstChild.scrollLeft = scrollLeft - walk;
}
