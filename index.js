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
  // pixelRatio: 1,
  minPxPerSec: 30,
  autoCenter: false,
  plugins: [
    WaveSurfer.regions.create({
      dragSelection: true,
      deferInit: true,
    }),
    ZoomToMousePlugin.create({
      maxPxPerSec: 5000, // default 1000
    }),
  ],
});

wavesurfer.on("region-click", function (region, e) {
  e.stopPropagation();
  // Play on click, loop on shift click
  e.shiftKey ? region.playLoop() : region.play();
});

// wavesurfer.on("ready", () => wavesurfer.playPause());

// let slider = document.querySelector('[data-action="zoom"]');

// slider.value = wavesurfer.params.minPxPerSec;
// slider.min = wavesurfer.params.minPxPerSec;
// // Allow extreme zoom-in, to see individual samples
// slider.max = 1000;

// slider.addEventListener("input", function () {
//   wavesurfer.zoom(Number(this.value));
// });

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
      console.log("loaded peaks! sample_rate: " + peaks.sample_rate);

      // load peaks into wavesurfer.js
      wavesurfer.load("http://localhost:4000/bamxPYj0O9M.mp3", peaks.data);
      wavesurfer.initPlugin("regions");
    })
    .catch((e) => {
      console.error("error", e);
    });
});
