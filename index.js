const downloadButton = document.getElementById("download");
const playButton = document.getElementById("play");

const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "violet",
  height: 200,
  progressColor: "purple",
  normalize: true,
  plugins: [
    WaveSurfer.regions.create({
      dragSelection: true,
    }),
  ],
});

wavesurfer.on("region-updated", console.log);

playButton.addEventListener("click", () => {
  wavesurfer.play();
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
});
