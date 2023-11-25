import { getStartTime } from "../functions"
import { state } from "../state"
import { sampleForm } from "./sampleForm"
import { canvas, ctx, wavesurfer } from "./wavesurfer"

function handleWaveformClick(e) {
  state.maybeDoubleClickDragging = true
  wavesurfer.container.removeEventListener("mousemove", handleMousemove)

  if (state.isCtrlKeyPressed) {
    state.seekX = parseInt(e.clientX - state.offsetX)
    const duration = wavesurfer.getDuration()

    const startTime = getStartTime(state.seekX, wavesurfer)

    wavesurfer.seekTo(startTime / duration)
    state.isCtrlKeyPressed = false
  }

  if (state.mouseX > 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const duration = wavesurfer.getDuration()
    const startTime = getStartTime(state.startX, wavesurfer)

    const startPercentX2 =
      (state.mouseX + wavesurfer.container.firstChild.scrollLeft) /
      wavesurfer.container.firstChild.scrollWidth // 0 to 1 range, 0 = start, 1 = end
    const endTime = duration * startPercentX2

    wavesurfer.addRegion({
      start: startTime,
      end: endTime,
    })

    sampleForm.hidden = false

    state.mouseX = 0
  }
}

function handleWaveformMousedown(e) {
  e.preventDefault()
  e.stopPropagation()

  wavesurfer.container.addEventListener("mousemove", handleMousemove)
  wavesurfer.container.addEventListener("mouseup", handleMouseup)
  wavesurfer.container.addEventListener("mouseleave", handleMouseLeave)

  if (state.maybeDoubleClickDragging) {
    wavesurfer.clearRegions()

    clearTimeout(state.maybeDoubleClickDraggingTimeout)
    // save the starting x/y of the rectangle
    state.startX = parseInt(e.clientX - state.offsetX)

    return
  }

  state.isDown = true
  state.scrollStartX = e.pageX - wavesurfer.container.firstChild.offsetLeft
  state.scrollLeft = wavesurfer.container.firstChild.scrollLeft
}

function handleMouseLeave() {
  state.isDown = false
}

function handleMouseup(e) {
  e.preventDefault()
  e.stopPropagation()

  state.maybeDoubleClickDraggingTimeout = setTimeout(() => {
    state.maybeDoubleClickDragging = false
  }, 200)

  state.isDown = false

  wavesurfer.container.removeEventListener("mousemove", handleMousemove)
  wavesurfer.container.removeEventListener("mouseup", handleMouseup)
  wavesurfer.container.removeEventListener("mouseleave", handleMouseLeave)
}

function handleMousemove(e) {
  e.preventDefault()
  e.stopPropagation()

  if (state.maybeDoubleClickDragging) {
    // get the current mouse position
    state.mouseX = parseInt(e.clientX - state.offsetX)
    // calculate the rectangle width/height based
    // on starting vs current mouse position
    let width = state.mouseX - state.startX

    // clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // draw a new rect from the start position
    // to the current mouse position
    ctx.strokeRect(state.startX, -10, width, 300)

    return
  }

  if (!state.isDown) return

  const x = e.pageX - wavesurfer.container.firstChild.offsetLeft
  const walk = (x - state.scrollStartX) * 3 //scroll-fast
  wavesurfer.container.firstChild.scrollLeft = state.scrollLeft - walk
}

export function initWaveform() {
  wavesurfer.container.addEventListener("click", handleWaveformClick)
  wavesurfer.container.addEventListener("mousedown", handleWaveformMousedown)
}
