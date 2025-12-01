const clipsContainer = document.getElementById("clipsContainer");
const submitAllBtn = document.getElementById("submitAllBtn");
const submissionStatus = document.getElementById("submissionStatus");
const toastTemplate = document.getElementById("toastTemplate");

const clips = window.ANNOTATION_CLIPS || [];
const submissionConfig = window.ANNOTATION_SUBMISSION || {};
const csvMirrorConfig = submissionConfig.csvMirror?.enabled ? submissionConfig.csvMirror : null;

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));
  setTimeout(() => toast.remove(), 3000);
}

function getParticipantData() {
  const board = document.querySelector("input[name='boardCertified']:checked");
  return {
    Name: document.getElementById("participantName")?.value.trim() || "",
    Institution: document.getElementById("participantInstitution")?.value.trim() || "",
    Specialty: document.getElementById("participantSpecialty")?.value.trim() || "",
    Practice: document.getElementById("participantPractice")?.value.trim() || "",
    Board: board?.value || "",
  };
}

function renderAllClips() {
  clips.forEach((clip, index) => {
    const section = document.createElement("section");
    section.className = "card";
    section.innerHTML = `
      <header class="card__header">
        <h2>${index + 2}. ${clip.label}</h2>
      </header>
      <div class="card__body card__body--stack">
        <video controls preload="auto" playsinline src="${clip.src}" class="video-shell__video"></video>
        <label class="field">
          <span class="field__label">${clip.prompt || "Name the surgical gesture"}</span>
          <input type="text" class="field__control" data-clip-id="${clip.id}" placeholder="Type gesture name here" />
        </label>
      </div>
    `;
    clipsContainer.appendChild(section);
  });
}

async function submitResponses() {
  const participant = getParticipantData();
  if (!participant.Name || !participant.Institution) {
    showToast("Please fill in all identification fields.");
    return;
  }

  const responses = Array.from(document.querySelectorAll("input[data-clip-id]")).map(input => ({
    clipId: input.dataset.clipId,
    response: input.value.trim(),
  }));

  const payload = {
    participant,
    responses,
    submittedAt: new Date().toISOString(),
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

    showToast("Responses submitted successfully!");
    submissionStatus.textContent = "Thank you! Your responses have been recorded.";

    if (csvMirrorConfig?.endpoint) {
      const flat = new URLSearchParams();
      Object.entries(participant).forEach(([k, v]) => flat.set(k, v));
      responses.forEach((r, i) => {
        flat.set(`Clip_${i + 1}_ID`, r.clipId);
        flat.set(`Clip_${i + 1}_Response`, r.response);
      });
      flat.set("SubmittedAt", payload.submittedAt);
      await fetch(csvMirrorConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: flat.toString(),
      });
    }
  } catch (err) {
    showToast("Submission failed. Try again.");
    submissionStatus.textContent = "An error occurred during submission.";
    console.error(err);
  }
}

renderAllClips();
submitAllBtn.addEventListener("click", submitResponses);
