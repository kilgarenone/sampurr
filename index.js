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
  responsive: true,
  plugins: [WaveSurfer.regions.create(), ZoomToMousePlugin.create()],
});

wavesurfer.on("region-click", function (region, e) {
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
let startX;
let scrollLeft;
let maybeDoubleClickDragging = false;
let maybeDoubleClickDraggingTimeout;

wavesurfer.container.addEventListener("click", function (e) {
  maybeDoubleClickDragging = true;

  // const rect = e.target.getBoundingClientRect();
  // const x = e.clientX - rect.left; // x position along the waveform
  // const percent = x / wavesurfer.container.firstChild.scrollWidth; // 0 to 1 range, 0 = start, 1 = end
  // const time = wavesurfer.getDuration() * percent;
  // wavesurfer.addRegion({
  //   start: time,
  //   end: time + 5,
  // });
});

wavesurfer.container.addEventListener("mousedown", (e) => {
  if (maybeDoubleClickDragging) {
    clearTimeout(maybeDoubleClickDraggingTimeout);
    return;
  }

  isDown = true;
  startX = e.pageX - wavesurfer.container.firstChild.offsetLeft;
  scrollLeft = wavesurfer.container.firstChild.scrollLeft;
});

wavesurfer.container.addEventListener("mouseleave", () => {
  isDown = false;
});

wavesurfer.container.addEventListener("mouseup", (event) => {
  maybeDoubleClickDraggingTimeout = setTimeout(() => {
    maybeDoubleClickDragging = false;
  }, 200);

  isDown = false;
});

wavesurfer.container.addEventListener("mousemove", (e) => {
  if (!isDown) return;

  e.preventDefault();
  const x = e.pageX - wavesurfer.container.firstChild.offsetLeft;
  const walk = (x - startX) * 3; //scroll-fast
  wavesurfer.container.firstChild.scrollLeft = scrollLeft - walk;
});
