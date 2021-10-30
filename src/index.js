import { BASE_URL } from "./const";
import "./css/index.css";
import "./css/reset.css";
import "./css/wavesurfer.css";
import { initWavesurfer, processAndSetupWaveform } from "./js/wavesurfer";

initWavesurfer();

export const urlForm = document.getElementById("url-form");
export const progressValueEle = document.getElementById("progress-value");
export const progressDescEle = document.getElementById("progress-desc");
export const progressCont = document.getElementById("progress");
export const titleEle = document.getElementById("title");

const decoder = new TextDecoder();

export async function fetchWaveform(url) {
  const response = await fetch(
    `${BASE_URL}/waveform?url=${encodeURIComponent(url)}`
  );
  const reader = response.body.getReader();
  let result = "";
  let isThumbnailParsed = false;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      return { isThumbnailParsed, chunks: result };
    }

    try {
      const chunk = decoder.decode(value, { stream: true });

      result += chunk;

      const {
        errorMessage,
        title,
        thumbnail,
        duration,
        percent,
        data,
        status,
      } = JSON.parse(chunk);

      if (errorMessage) {
        progressDescEle.innerHTML = errorMessage;
      }

      if (percent) {
        progressValueEle.textContent = percent;
      }

      if (title) {
        setupTitle(title);
      }

      if (thumbnail) {
        isThumbnailParsed = true;
        setupThumbnail(thumbnail);
      }

      if (status) {
        progressDescEle.textContent = status;
      }
    } catch (e) {}
  }
}

export function setupTitle(title) {
  titleEle.textContent = title;
  titleEle.classList.add("js-show");
}

export function setupThumbnail(thumbnail) {
  document.documentElement.style.setProperty(
    "--thumbnail-image-url",
    `url(${thumbnail})`
  );

  document.body.classList.remove("js-thumbnail-ready");

  setTimeout(() => {
    document.body.classList.add("js-thumbnail-ready");
  }, 2500);

  progressDescEle.textContent = "Extracting audio";
}

urlForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  this.classList.add("js-hide");

  setTimeout(() => {
    this.hidden = true;
  }, 300);

  progressCont.hidden = false;
  progressCont.classList.add("js-show");

  const data = new FormData(event.target);

  const response = await fetchWaveform(data.get("url"));

  processAndSetupWaveform(response);
});
