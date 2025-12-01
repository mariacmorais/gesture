// app.js
const clipSelect = document.getElementById("clipSelect");
const replayBtn = document.getElementById("replayBtn");
const video = document.getElementById("caseVideo");
const clipPrompt = document.getElementById("clipPrompt");
const responseInput = document.getElementById("responseInput");
const submitResponseBtn = document.getElementById("submitResponseBtn");
const submissionStatus = document.getElementById("submissionStatus");
const toastTemplate = document.getElementById("toastTemplate");

const submissionConfig = window.ANNOTATION_SUBMISSION || {};
const csvMirrorConfig = submissionConfig.csvMirror?.enabled ? submissionConfig.csvMirror : null;

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));
  setTimeout(() => toast.remove(), 3000);
}

function readParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

function getParticipantMeta() {
  return {
    Name: readParam("Name") || readParam("name"),
    Institution: readParam("Institution") || readParam("institution"),
    Specialty: readParam("Specialty") || readParam("specialty"),
    Board: readParam("Board") || readParam("board"),
    Practice: readParam("Practice") || readParam("practice"),
    Volume: readParam("Volume") || readParam("volume"),
  };
}

function getClips() {
  return Array.isArray(window.ANNOTATION_CLIPS) ? [...window.ANNOTATION_CLIPS] : [];
}

function populateClipSelect(clips) {
  clipSelect.innerHTML = "";
  clips.forEach((clip, index) => {
    const option = document.createElement("option");
    option.value = clip.id;
    option.textContent = clip.label || `Clip ${index + 1}`;
    option.dataset.src = clip.src;
    option.dataset.prompt = clip.prompt || "Please answer after watching.";
    clipSelect.appendChild(option);
  });
  clipSelect.selectedIndex = 0;
  loadSelectedClip();
}

function loadSelectedClip() {
  const option = clipSelect.selectedOptions[0];
  if (!option) return;

  video.src = option.dataset.src;
  video.load();
  video.play().catch(() => {});
  videoStatus.textContent = "Clip loaded.";
  clipPrompt.textContent = option.dataset.prompt || "Please answer after watching.";
  responseInput.value = "";
  submissionStatus.textContent = "";
}

replayBtn.addEventListener("click", () => {
  video.currentTime = 0;
  video.play().catch(() => {});
});

clipSelect.addEventListener("change", loadSelectedClip);

submitResponseBtn.addEventListener("click", async () => {
  const responseText = responseInput.value.trim();
  if (!responseText) {
    showToast("Please enter a response.");
    return;
  }

  const option = clipSelect.selectedOptions[0];
  const participant = getParticipantMeta();
  const payload = {
    clipId: option.value,
    clipLabel: option.textContent,
    videoSrc: option.dataset.src,
    prompt: option.dataset.prompt,
    response: responseText,
    submittedAt: new Date().toISOString(),
    ...participant,
  };

  const bodyWrapper =
    submissionConfig.bodyWrapper === "none"
      ? { ...submissionConfig.additionalFields, ...payload }
      : {
          ...submissionConfig.additionalFields,
          annotation: payload,
          ...participant,
        };

  try {
    const res = await fetch(submissionConfig.endpoint, {
      method: submissionConfig.method || "POST",
      headers: submissionConfig.headers || { "Content-Type": "application/json" },
      body: JSON.stringify(bodyWrapper),
    });

    if (!res.ok) throw new Error("Failed to submit");

    submissionStatus.textContent = "Response submitted. Thank you!";
    showToast("Response submitted!");
    responseInput.value = "";

    // Optionally send to CSV mirror
    if (csvMirrorConfig?.endpoint) {
      const flat = new URLSearchParams({
        Name: participant.Name || "",
        Institution: participant.Institution || "",
        ClipID: option.value,
        ClipLabel: option.textContent,
        Response: responseText,
        SubmittedAt: payload.submittedAt,
      });
      await fetch(csvMirrorConfig.endpoint, {
        method: csvMirrorConfig.method || "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: flat.toString(),
      });
    }
  } catch (err) {
    submissionStatus.textContent = "Submission failed. Try again.";
    showToast("Failed to submit response.");
    console.error(err);
  }
});

const clips = getClips();
populateClipSelect(clips);
