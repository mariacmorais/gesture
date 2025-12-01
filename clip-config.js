// Replace the sample entries with your own clips. Add a new object to the array
// for each video you want participants to review. Provide absolute HTTPS URLs
// (e.g., https://your-org.github.io/study/clip-01.mp4) when hosting on GitHub
// Pages, REDCap, or other survey tools. Avoid referencing local file-system
// paths such as /Users/... or C:\... because participants cannot reach them.
window.ANNOTATION_CLIPS = [
  {
    id: "clip_01",
    label: "Clip 1",
    src: "https://raw.githubusercontent.com/mariacmorais/mariacmorais.github.io/main/Video_01_K_02.mp4",
    poster: "",
  },
  {
    id: "clip_02",
    label: "Clip 2",
    src: "https://raw.githubusercontent.com/mariacmorais/mariacmorais.github.io/main/Video_02_K_03.mp4",
    poster: "",
  },
];

// Configure where annotations are sent after participants submit.
window.ANNOTATION_SUBMISSION = {
  // JSON endpoint (leave as your existing Formspree endpoint if desired)
  endpoint: "",
  method: "POST",
  headers: {
    // Keep JSON behavior (works for your JSON downloads)
    "Accept": "application/json"
  },
  additionalFields: {
    studyId: "demo-study",
  },
  // Wrap the annotation in a key OR set to "none" for a flat JSON body.
  // If your JSON is already correct, keep as "annotation".
  bodyWrapper: "annotation",
  // Optional CSV mirror: sends a second POST as form-encoded flat fields
  // so Formspree's CSV includes Specialty/Board/Practice/Volume.
  csvMirror: {
    enabled: true,
    endpoint: "", // 👉 put your Formspree endpoint here too, e.g. "https://formspree.io/f/xxxxxxx"
    method: "POST",
    headers: {
      // Usually no need to set; Content-Type is set by the code.
    },
    // mode: "cors",
    // credentials: "omit",
  },
};
