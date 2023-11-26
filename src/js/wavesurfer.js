// import RegionPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import { BASE_URL } from "../const"
import { state } from "../state"
import { progressCont, setupThumbnail, setupTitle } from "../index"
import { initMiniUrlForm, miniUrlForm } from "./miniUrlForm"
import { initSampleForm, sampleForm } from "./sampleForm"
import { initWaveform } from "./waveform"
import { ZoomToMousePlugin } from "./zoom"

export let wavesurfer
export let canvas
export let ctx

export async function initWavesurfer() {
  const [{ default: WaveSurfer }, { default: RegionPlugin }] =
    await Promise.all([
      import("wavesurfer.js"),
      import("wavesurfer.js/dist/plugins/regions.esm.js"),
      // import("wavesurfer.js/dist/plugins/zoom.esm.js"),
    ])

  wavesurfer = WaveSurfer.create({
    container: "#waveform",
    waveColor: "#FFF59D",
    height: 450,
    progressColor: "#ffc8bb",
    // fillParent: true,
    // backend: "MediaElement",
    normalize: true,
    interact: false,
    // minPxPerSec: 20,
    autoCenter: false,
    cursorColor: "red",
    plugins: [RegionPlugin.create(), ZoomToMousePlugin.create()],
  })

  wavesurfer.container = document.querySelector("#waveform")

  const { width, height, left, top } =
    wavesurfer.container.getBoundingClientRect()

  // canvas for drawing boundaries of sample
  canvas = document.createElement("canvas")
  canvas.id = "canvas"
  canvas.width = width
  canvas.height = height
  state.offsetX = left

  ctx = canvas.getContext("2d")
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2

  wavesurfer.container.appendChild(canvas)

  wavesurfer.on("region-click", function (region, e) {
    e.stopPropagation()
    region.play()
  })

  wavesurfer.on("ready", function (e) {
    progressCont.hidden = true
  })
}

function handleKeydown(event) {
  if (event.target.tagName === "INPUT") return

  if (event.key === " ") {
    wavesurfer.playPause()
  } else if (event.key === "Control" || event.key === "Meta") {
    state.isCtrlKeyPressed = true
  }
}

function handleKeyup(event) {
  if (event.key === "Control") {
    state.isCtrlKeyPressed = false
  }
}

export function processAndSetupWaveform({ isThumbnailParsed, chunks }) {
  try {
    const data = chunks.split('"}')
    const media = JSON.parse(data[0] + `"}`)
    const peaks = JSON.parse(data[data.length - 1]).data

    if (!isThumbnailParsed) {
      setupThumbnail(media.thumbnail)
      setupTitle(media.title)
    }

    document.addEventListener("keydown", handleKeydown)
    document.addEventListener("keyup", handleKeyup)

    initMiniUrlForm(wavesurfer)
    initSampleForm(wavesurfer)
    initWaveform(wavesurfer)

    sampleForm.reset()
    miniUrlForm.reset()

    miniUrlForm.classList.add("js-show")

    // unblur so user can start using keyboard shoftcut unaffected
    document.activeElement.blur()

    wavesurfer.setOptions({ cursorColor: "red", height: 450 })

    state.mediaID = media.id

    wavesurfer.container.classList.add("js-show")

    state.peaks = peaks

    // load peaks into wavesurfer.js
    wavesurfer.load(`${BASE_URL}/${state.mediaID}.wav`, peaks)
  } catch (error) {}
}
