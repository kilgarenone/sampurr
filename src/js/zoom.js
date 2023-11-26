import BasePlugin from "wavesurfer.js/dist/base-plugin"
import { state } from "../state"
import { BASE_URL } from "../const"

export class ZoomToMousePlugin extends BasePlugin {
  static create() {
    return new ZoomToMousePlugin()
  }

  constructor() {
    super()

    this.params = {
      maxPxPerSec: 150,
    }
    this.currentZoom = 0
    // this.wavesurfer = null
    this.mouseDuration = null
    this.container = document.getElementById("waveform")
  }

  zoomToMouse(pxPerSec) {
    // if (!pxPerSec) {
    //   this.wavesurfer.params.minPxPerSec =
    //     this.wavesurfer.defaultParams.minPxPerSec
    //   this.wavesurfer.params.scrollParent = false
    // } else {
    //   this.wavesurfer.params.minPxPerSec = pxPerSec
    //   this.wavesurfer.params.scrollParent = true
    // }
    // replace this with wavesurfer.current.load(audioUrl, peaks)
    // this.wavesurfer.drawBuffer()
    // console.log(state)
    // this.wavesurfer.load(`${BASE_URL}/${state.mediaID}.wav`, state.peaks)

    this.wavesurfer.zoom(pxPerSec)
    this.wavesurfer.seekTo(
      this.wavesurfer.getCurrentTime() / this.wavesurfer.getDuration()
    )
    // this.wavesurfer.drawer.recenter(this.mouseDuration)
  }

  _onWaveFormMouseWheelEvent(event) {
    event.preventDefault()

    const maxZoom = this.params.maxPxPerSec

    if (event.wheelDelta > 0) {
      // zoom in
      this.currentZoom = Math.min(this.currentZoom + 10, maxZoom)
    } else {
      // zoom out
      this.currentZoom = Math.max(this.currentZoom - 10, 0)
    }

    this.zoomToMouse(this.currentZoom)
  }

  _onWaveFormMouseMove(e) {
    // const ev = this.wavesurfer.drawer.handleEvent(e)
    // this.mouseDuration = ev
  }

  onInit() {
    this.container.addEventListener(
      "wheel",
      this._onWaveFormMouseWheelEvent.bind(this)
    )
    this.container.addEventListener(
      "mousemove",
      this._onWaveFormMouseMove.bind(this)
    )
  }

  destroy() {
    this.container.removeEventListener(
      "wheel",
      this._onWaveFormMouseWheelEvent.bind(this)
    )

    this.container.removeEventListener(
      "mousemove",
      this._onWaveFormMouseMove.bind(this)
    )
  }
}
