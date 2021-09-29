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

console.log("wavesurfer:", wavesurfer);
wavesurfer.on("region-click", function (region, e) {
  e.stopPropagation();
  // Play on click, loop on shift click
  e.shiftKey ? region.playLoop() : region.play();
});

wavesurfer.container.addEventListener("dblclick", function (e) {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left; // x position along the waveform
  const percent = x / wavesurfer.container.firstChild.scrollWidth; // 0 to 1 range, 0 = start, 1 = end
  const time = wavesurfer.getDuration() * percent;
  console.log("time:", time);

  wavesurfer.addRegion({
    start: time,
    end: time + 5,
  });
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
      console.log("loaded peaks! sample_rate: " + peaks.sample_rate);

      // load peaks into wavesurfer.js
      wavesurfer.load("http://localhost:4000/bamxPYj0O9M.mp3", peaks.data);
    })
    .catch((e) => {
      console.error("error", e);
    });

  let isDown = false;
  let startX;
  let scrollLeft;

  wavesurfer.container.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - wavesurfer.container.firstChild.offsetLeft;
    scrollLeft = wavesurfer.container.firstChild.scrollLeft;
  });
  wavesurfer.container.addEventListener("mouseleave", () => {
    isDown = false;
  });
  wavesurfer.container.addEventListener("mouseup", () => {
    isDown = false;
  });
  wavesurfer.container.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - wavesurfer.container.firstChild.offsetLeft;
    const walk = (x - startX) * 3; //scroll-fast
    wavesurfer.container.firstChild.scrollLeft = scrollLeft - walk;
    console.log(walk);
  });
});
