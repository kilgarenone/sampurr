import { ZoomToMousePlugin } from "./modules/zoom.js";

const downloadButton = document.getElementById("download");
const playButton = document.getElementById("play");

const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "violet",
  height: 200,
  progressColor: "purple",
  backend: "MediaElement",
  normalize: true,
  interact: false,
  minPxPerSec: 30,
  autoCenter: false,
  // responsive: true,
  plugins: [WaveSurfer.regions.create(), ZoomToMousePlugin.create()],
});

wavesurfer.on("region-click", function (region, e) {
  console.log("region:", region);
  e.stopPropagation();
  e.shiftKey ? region.playLoop() : region.play();
});

playButton.addEventListener("click", () => {
  wavesurfer.playPause();
});

downloadButton.addEventListener("click", () => {
  fetch("http://localhost:4000/haha")
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then((peaks) => {
      // load peaks into wavesurfer.js
      wavesurfer.load("http://localhost:4000/bamxPYj0O9M.mp3", peaks.data);
    })
    .catch((e) => {
      console.error("error", e);
    });
});

let isDown = false;
let scrollStartX;
let scrollLeft;

let maybeDoubleClickDragging = false;
let maybeDoubleClickDraggingTimeout = null;

const canvas = document.createElement("canvas");
canvas.id = "canvas";
const { width, height, left, top } =
  wavesurfer.container.getBoundingClientRect();
canvas.width = width;
canvas.height = height;
wavesurfer.container.appendChild(canvas);

var ctx = canvas.getContext("2d");
ctx.strokeStyle = "blue";
ctx.lineWidth = 3;
var offsetX = left;
var offsetY = top;
var startX;
var startY;
let mouseX;
let mouseY;

wavesurfer.container.addEventListener("click", function (e) {
  maybeDoubleClickDragging = true;
  wavesurfer.container.removeEventListener("mousemove", handleMousemove);

  if (mouseX > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const duration = wavesurfer.getDuration();
    const startPercentX =
      (startX + wavesurfer.container.firstChild.scrollLeft) /
      wavesurfer.container.firstChild.scrollWidth; // 0 to 1 range, 0 = start, 1 = end
    const startTime = duration * startPercentX;
    const startPercentX2 =
      (mouseX + wavesurfer.container.firstChild.scrollLeft) /
      wavesurfer.container.firstChild.scrollWidth; // 0 to 1 range, 0 = start, 1 = end
    const endTime = duration * startPercentX2;

    wavesurfer.addRegion({
      start: startTime,
      end: endTime,
    });

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
    console.log("maybeDoubleClickDragging:", maybeDoubleClickDragging);
    // get the current mouse position
    mouseX = parseInt(e.clientX - offsetX);
    // calculate the rectangle width/height based
    // on starting vs current mouse position
    var width = mouseX - startX;

    // clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw a new rect from the start position
    // to the current mouse position
    ctx.strokeRect(startX, 0, width, 200);

    return;
  }

  if (!isDown) return;

  const x = e.pageX - wavesurfer.container.firstChild.offsetLeft;
  const walk = (x - scrollStartX) * 3; //scroll-fast
  wavesurfer.container.firstChild.scrollLeft = scrollLeft - walk;
}
