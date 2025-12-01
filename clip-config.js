// clip-config.js
window.ANNOTATION_CLIPS = Array.from({ length: 3 }, (_, i) => ({
  id: `clip_${i + 1}`,
  label: `Clip ${i + 1}`,
  src: `https://raw.githubusercontent.com/mariacmorais/gesture/main/clip_${i + 1}.mp4`,
  poster: "",
  prompt: "Please enter the gesture(s) you have identified from this clip.",
}));

window.ANNOTATION_SUBMISSION = {
  endpoint: "", // <-- submission endpoint here
  method: "POST",
  headers: {
    Accept: "application/json",
  },
  additionalFields: {
    studyId: "gesture-identification",
  },
  bodyWrapper: "annotation",
  csvMirror: {
    enabled: true,
    endpoint: "", // <-- CSV endpoint here
    method: "POST",
  },
};
