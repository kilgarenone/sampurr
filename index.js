window.addEventListener("DOMContentLoaded", () => {
  const downloadButton = document.getElementById("download");
  const playButton = document.getElementById("play");

  const wavesurfer = WaveSurfer.create({
    container: "#waveform",
    waveColor: "violet",
    height: 200,
    progressColor: "purple",
    backend: "MediaElement",
    normalize: true,
    plugins: [
      WaveSurfer.regions.create({
        dragSelection: true,
        deferInit: true,
      }),
      WaveSurferZoomToMousePlugin.create({
        maxPxPerSec: 5000, // default 1000
      }),
    ],
  });

  wavesurfer.on("region-click", function (region, e) {
    e.stopPropagation();
    // Play on click, loop on shift click
    e.shiftKey ? region.playLoop() : region.play();
  });

  wavesurfer.on("ready", () => wavesurfer.playPause());

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
});
