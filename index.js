const downloadButton = document.getElementById("download");
const playButton = document.getElementById("play");

const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "violet",
  progressColor: "purple",
  normalize: true,
});

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
