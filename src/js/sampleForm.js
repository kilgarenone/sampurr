import { BASE_URL } from "../const";
import { state } from "../state";
import { wavesurfer } from "./wavesurfer";

export const sampleForm = document.getElementById("download-sample-form");

export function initSampleForm() {
  sampleForm.addEventListener("submit", (event) => {
    const data = new FormData(event.target);

    const sampleName = data.get("sample-name") || "sample";

    const region = Object.keys(wavesurfer.regions.list).map((id) => {
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
    a.href = `${BASE_URL}/download?start=${region.start}&end=${
      region.end + 0.05
    }&title=${sampleName}&id=${state.mediaID}`;
    a.download = `${sampleName}.wav`;
    a.click();
    a.remove();
  });
}
