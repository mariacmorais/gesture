// clip-config.js
window.ANNOTATION_CLIPS = [
  {
    id: "clip_01",
    label: "Clip 1",
    src: "https://raw.githubusercontent.com/mariacmorais/mariacmorais.github.io/main/Video_01_K_02.mp4",
    poster: "",
    prompt: "Please describe what you observed in this clip.", // You can change this later
  },
  {
    id: "clip_02",
    label: "Clip 2",
    src: "https://raw.githubusercontent.com/mariacmorais/mariacmorais.github.io/main/Video_02_K_03.mp4",
    poster: "",
    prompt: "Briefly explain the key event in this video.", // Customizable prompt
  },
];

window.ANNOTATION_SUBMISSION = {
  endpoint: "", // <-- submission endpoint here
  method: "POST",
  headers: {
    "Accept": "application/json",
  },
  additionalFields: {
    studyId: "demo-study",
  },
  bodyWrapper: "annotation",
  csvMirror: {
    enabled: true,
    endpoint: "", // <-- CSV endpoint here
    method: "POST",
  },
};
