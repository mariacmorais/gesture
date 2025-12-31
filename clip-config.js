// clip-config.js
const BASE_URL = "https://yourdomain.com/clips/";

window.ANNOTATION_CLIPS = [
  ...Array.from({ length: 30 }, (_, i) => {
    const index = String(i + 1).padStart(2, '0');
    return {
      id: `clip_${index}`,
      label: `Clip ${i + 1}`,
      src: `${BASE_URL}clip_${index}.mp4`,
      poster: "",
      prompt: "Please enter the cluster of gesture(s) you have identified from this clip.",
    };
  })
];

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
