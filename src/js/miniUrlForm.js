import {
  fetchWaveform,
  progressCont,
  progressDescEle,
  progressValueEle,
  titleEle,
} from "../index";
import { sampleForm } from "./sampleForm";
import { processAndSetupWaveform, wavesurfer } from "./wavesurfer";

export const miniUrlForm = document.getElementById("mini-url-form");

export function initMiniUrlForm() {
  miniUrlForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    progressValueEle.textContent = 0;
    progressDescEle.textContent = "Loading";

    wavesurfer.container.classList.remove("js-show");
    wavesurfer.empty();
    wavesurfer.clearRegions();
    wavesurfer.zoom(false); // reset zoom

    sampleForm.hidden = true;

    progressCont.hidden = false;
    progressCont.classList.add("js-show");
    titleEle.classList.remove("js-show");

    const data = new FormData(event.target);

    const response = await fetchWaveform(data.get("url"));

    processAndSetupWaveform(response);
  });
}
