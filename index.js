import { ZoomToMousePlugin } from "./modules/zoom.js";

const downloadButton = document.getElementById("download");
const playButton = document.getElementById("play");
const downloadSampleButton = document.getElementById("download-sample");

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
  e.stopPropagation();
  e.shiftKey ? region.playLoop() : region.play();
});

playButton.addEventListener("click", () => {
  wavesurfer.playPause();
});

downloadSampleButton.addEventListener("click", () => {
  const { start, end } = Object.keys(wavesurfer.regions.list).map((id) => {
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
  // TODO: custom sample's title
  a.href = `http://localhost:4000/download?start=${start}&end=${end}&title=noshit`;
  // TODO: need to match the title above
  a.download = "noshit.wav";
  a.click();
  a.remove();
});

const decoder = new TextDecoder();

downloadButton.addEventListener("click", async () => {
  const response = await fetch("http://localhost:4000/haha");
  const reader = response.body.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    try {
      const { title, thumbnail, duration, percent, data } = JSON.parse(
        decoder.decode(value)
      );
      console.log("percent:", percent);
      if (data) {
        wavesurfer.load("http://localhost:4000/bamxPYj0O9M.wav", data);
      }
    } catch (e) {}
  }
  // fetch("http://localhost:4000/haha")
  //   .then((response) => response.body)
  //   .then((rb) => {
  //     const reader = rb.getReader();

  //     return new ReadableStream({
  //       start(controller) {
  //         // The following function handles each data chunk
  //         function push() {
  //           // "done" is a Boolean and value a "Uint8Array"
  //           reader.read().then(({ done, value }) => {
  //             // If there is no more data to read
  //             if (done) {
  //               console.log("done", done);
  //               controller.close();
  //               return;
  //             }
  //             // Get the data and send it to the browser via the controller
  //             controller.enqueue(value);
  //             // Check chunks by logging to the console
  //             try {
  //               const decodedhunk = JSON.parse(decoder.decode(value));
  //               console.log("progress:", progress);
  //             } catch (e) {}

  //             push();
  //           });
  //         }

  //         push();
  //       },
  //     });
  //   })
  // .then((stream) => {
  //   // Respond with our stream
  //   return new Response(stream, {
  //     headers: { "Content-Type": "application/json" },
  //   }).text();
  // })
  // .then((result) => {
  //   // Do things with result
  //   console.log(result);
  // });
  // .then((body) => {
  //   // const reader = body.getReader();
  //   // load peaks into wavesurfer.js
  //   // wavesurfer.load("http://localhost:4000/bamxPYj0O9M.mp3", peaks.data);
  // })
  // .catch((e) => {
  //   console.error("error", e);
  // });
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
let startY = 0;
let mouseX = 0;
let mouseY = 0;

wavesurfer.container.addEventListener("click", function (e) {
  maybeDoubleClickDragging = true;
  wavesurfer.container.removeEventListener("mousemove", handleMousemove);

  if (mouseX > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const duration = wavesurfer.getDuration();

    const waveFormContainerScrollLeft =
      wavesurfer.container.firstChild.scrollLeft; // the <wave />
    const waveFormContainerScrollWidth =
      wavesurfer.container.firstChild.scrollWidth; // the <wave />

    const startPercentX =
      (startX + waveFormContainerScrollLeft) / waveFormContainerScrollWidth; // 0 to 1 range, 0 = start, 1 = end
    const startTime = duration * startPercentX;

    const startPercentX2 =
      (mouseX + waveFormContainerScrollLeft) / waveFormContainerScrollWidth; // 0 to 1 range, 0 = start, 1 = end
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
    ctx.strokeRect(startX, 0, width, 200);

    return;
  }

  if (!isDown) return;

  const x = e.pageX - wavesurfer.container.firstChild.offsetLeft;
  const walk = (x - scrollStartX) * 3; //scroll-fast
  wavesurfer.container.firstChild.scrollLeft = scrollLeft - walk;
}
