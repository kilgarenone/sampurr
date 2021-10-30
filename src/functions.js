export function getStartTime(clickX, wavesurfer) {
  const duration = wavesurfer.getDuration();

  const startPercentX =
    (clickX + wavesurfer.container.firstChild.scrollLeft) /
    wavesurfer.container.firstChild.scrollWidth; // 0 to 1 range, 0 = start, 1 = end
  const startTime = duration * startPercentX;

  return startTime;
}
