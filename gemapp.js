const clipSelect = document.getElementById("clipSelect");
const replayBtn = document.getElementById("replayBtn");
const video = document.getElementById("caseVideo");
const videoOverlay = document.getElementById("videoOverlay");
const finalFrameCanvas = document.getElementById("finalFrame");
const annotationCanvas = document.getElementById("annotationCanvas");
const canvasContainer = document.getElementById("canvasContainer");
const clearLineBtn = document.getElementById("clearLineBtn");
const videoStatus = document.getElementById("videoStatus");
const annotationStatus = document.getElementById("annotationStatus");
const toastTemplate = document.getElementById("toastTemplate");
const submitAnnotationBtn = document.getElementById("submitAnnotationBtn");
const submissionStatus = document.getElementById("submissionStatus");

const submissionConfig = window.ANNOTATION_SUBMISSION || {};
const csvMirrorConfig = (submissionConfig.csvMirror && submissionConfig.csvMirror.enabled) ? submissionConfig.csvMirror : null;

const overlayCtx = finalFrameCanvas.getContext("2d");
const annotationCtx = annotationCanvas.getContext("2d");

let frameCaptured = false;
let currentClip = null;
let activeLine = null;
let pointerDown = false;
let latestPayload = null;
let submissionInFlight = false;

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("toast--visible");
  });
  setTimeout(() => toast.remove(), 2800);
}

function readParam(name) {
  const params = new URLSearchParams(window.location.search);
  // Prefer exact key; fall back to case-insensitive match
  if (params.has(name)) return params.get(name);
  const lower = name.toLowerCase();
  for (const [k, v] of params.entries()) {
    if (k.toLowerCase() === lower) return v;
  }
  return "";
}

function getParticipantMeta() {
  return {
    Name: readParam("Name") || readParam("name"),
    Institution: readParam("Institution") || readParam("institution"),
    Specialty: readParam("Specialty") || readParam("specialty"),
    Board: readParam("Board") || readParam("board"),
    Practice: readParam("Practice") || readParam("practice"),
    Volume: readParam("Volume") || readParam("volume"),
    // Preserve any scoring fields if passed by URL (optional)
    Parkland: readParam("Parkland") || readParam("parkland"),
    Nassar: readParam("Nassar") || readParam("nassar"),
  };
}

function getClips() {
  const clips = Array.isArray(window.ANNOTATION_CLIPS) ? [...window.ANNOTATION_CLIPS] : [];
  const params = new URLSearchParams(window.location.search);
  const videoParam = params.get("video");
  if (videoParam) {
    clips.unshift({
      id: "survey-param",
      label: "Embedded Clip",
      src: videoParam,
      poster: "",
    });
  }
  return clips;
}

function populateClipSelect(clips) {
  clipSelect.innerHTML = "";
  if (clips.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Add clips in clip-config.js";
    clipSelect.appendChild(option);
    clipSelect.disabled = true;
    videoStatus.textContent = "No clip configured.";
    return;
  }

  clips.forEach((clip, index) => {
    const option = document.createElement("option");
    option.value = clip.id ?? `clip-${index}`;
    option.textContent = clip.label ?? option.value;
    option.dataset.src = clip.src;
    option.dataset.poster = clip.poster || "";
    clipSelect.appendChild(option);
  });

  clipSelect.disabled = false;

  const params = new URLSearchParams(window.location.search);
  const clipId = params.get("clip");
  if (clipId) {
    const match = [...clipSelect.options].find((opt) => opt.value === clipId);
    if (match) {
      clipSelect.value = clipId;
      loadSelectedClip();
      return;
    }
  }

  clipSelect.selectedIndex = 0;
  loadSelectedClip();
}

function loadSelectedClip() {
  const option = clipSelect.selectedOptions[0];
  if (!option) return;

  const src = option.dataset.src;
  if (!src) {
    videoStatus.textContent = "Clip source missing.";
    return;
  }

  resetAnnotationState();

  currentClip = {
    id: option.value,
    label: option.textContent,
    src,
    poster: option.dataset.poster || "",
  };

  videoOverlay.hidden = true;
  canvasContainer.hidden = true;
  video.hidden = false;
  video.removeAttribute("controls");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.crossOrigin = "anonymous";
  if (currentClip.poster) {
    video.setAttribute("poster", currentClip.poster);
  } else {
    video.removeAttribute("poster");
  }

  video.src = currentClip.src;
  try { video.load(); } catch {}
  videoStatus.textContent = "Preparing final frame…";
  replayBtn.disabled = true;
}

function looksLikeLocalPath(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return (
    lower.startsWith("file:") ||
    lower.startsWith("/users/") ||
    lower.startsWith("c:\\") ||
    lower.startsWith("\\\\")
  );
}

function handleVideoError() {
  let message = "Clip failed to load. Check that the src URL is correct and publicly accessible.";
  if (currentClip?.src) {
    message += ` (Configured source: ${currentClip.src})`;
    if (looksLikeLocalPath(currentClip.src)) {
      message +=
        " — this looks like a local file path. Upload the video to your hosting provider (e.g., GitHub Pages, CDN) and reference the hosted HTTPS URL instead.";
    }
  }
  videoStatus.textContent = message;
  showToast(message);
  replayBtn.disabled = true;
}

function resetAnnotationState() {
  frameCaptured = false;
  activeLine = null;
  pointerDown = false;
  latestPayload = null;
  submissionInFlight = false;
  annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  overlayCtx.clearRect(0, 0, finalFrameCanvas.width, finalFrameCanvas.height);
  annotationCanvas.style.backgroundImage = "";
  annotationStatus.textContent = "Preparing final frame…";
  clearLineBtn.disabled = true;
  submitAnnotationBtn.disabled = true;
  if (submissionConfig.endpoint) {
    submissionStatus.textContent = "Draw the incision on the frozen frame to enable submission.";
  } else {
    submissionStatus.textContent =
      "Investigator submission endpoint not configured. Update clip-config.js.";
  }
}

/** Keep the canvases matched to the video frame size (for crisp drawing). */
function resizeCanvases(width, height) {
  finalFrameCanvas.width = width;
  finalFrameCanvas.height = height;
  annotationCanvas.width = width;
  annotationCanvas.height = height;
}

/** Captures whatever frame the <video> is currently on and swaps to annotation mode. */
function freezeOnFinalFrame() {
  if (!video.videoWidth || !video.videoHeight) {
    showToast("Video not ready yet. Please wait a moment.");
    return;
  }

  resizeCanvases(video.videoWidth, video.videoHeight);
  overlayCtx.drawImage(video, 0, 0, finalFrameCanvas.width, finalFrameCanvas.height);
  annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  try {
    const dataUrl = finalFrameCanvas.toDataURL("image/png");
    annotationCanvas.style.backgroundImage = `url(${dataUrl})`;
    annotationCanvas.style.backgroundSize = "contain";
    annotationCanvas.style.backgroundRepeat = "no-repeat";
    annotationCanvas.style.backgroundPosition = "center";
  } catch (error) {
    frameCaptured = false;
    showToast("Unable to capture frame. Serve the clip from the same origin or enable CORS.");
    return;
  }
  frameCaptured = true;
  canvasContainer.hidden = false;
  videoOverlay.hidden = false;
  video.hidden = true;
  annotationStatus.textContent = "Final frame ready. Draw your incision line.";
  videoStatus.textContent = "Final frame is shown. You can replay the clip if needed.";
  replayBtn.disabled = false;
}

/** Seek to the last decodable moment and capture it without user action. */
function autoCaptureFinalFrame() {
  if (!currentClip) return;

  const seekAndCapture = () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      // Duration still unknown; wait a bit for metadata.
      showToast("Video duration not available yet. Retrying…");
      return;
    }
    const EPSILON = 0.04; // seconds
    const targetTime = Math.max(0, video.duration - EPSILON);
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      freezeOnFinalFrame();
    };
    try {
      video.pause();
      video.addEventListener("seeked", onSeeked, { once: true });
      video.currentTime = targetTime;
    } catch {
      showToast("Seeking not supported for this clip.");
    }
  };

  if (video.readyState >= 1) {
    seekAndCapture();
  } else {
    const onMeta = () => {
      video.removeEventListener("loadedmetadata", onMeta);
      seekAndCapture();
    };
    video.addEventListener("loadedmetadata", onMeta, { once: true });
    try { video.load(); } catch {}
  }
}

function handleVideoLoaded() {
  // Do not autoplay. We only needed the data to ensure dimensions.
  // Auto-capture is triggered from metadata event to ensure duration is known.
}

function handleVideoMetadata() {
  // As soon as duration is known, auto-capture the final frame.
  autoCaptureFinalFrame();
}

function handleVideoEnded() {
  videoStatus.textContent = "Clip complete. Final frame locked for annotation.";
  freezeOnFinalFrame();
}

function handleReplay() {
  if (!currentClip) return;
  videoOverlay.hidden = true;
  canvasContainer.hidden = true;
  annotationStatus.textContent = "Watching clip…";
  video.hidden = false;
  frameCaptured = false;
  activeLine = null;
  annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  overlayCtx.clearRect(0, 0, finalFrameCanvas.width, finalFrameCanvas.height);
  annotationCanvas.style.backgroundImage = "";
  clearLineBtn.disabled = true;
  submitAnnotationBtn.disabled = true;
  submissionStatus.textContent = submissionConfig.endpoint
    ? "Draw the incision on the frozen frame to enable submission."
    : "Investigator submission endpoint not configured. Update clip-config.js.";
  video.currentTime = 0;
  video.controls = true;
  video.play().catch(() => {});
}

function getPointerPosition(evt) {
  const rect = annotationCanvas.getBoundingClientRect();
  const touch = evt.touches?.[0] ?? evt.changedTouches?.[0] ?? null;
  const clientX = evt.clientX ?? touch?.clientX ?? 0;
  const clientY = evt.clientY ?? touch?.clientY ?? 0;
  const x = ((clientX - rect.left) / rect.width) * annotationCanvas.width;
  const y = ((clientY - rect.top) / rect.height) * annotationCanvas.height;
  return { x, y };
}

function drawLine(line) {
  annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  if (!line) return;
  annotationCtx.strokeStyle = "#38bdf8";
  annotationCtx.lineWidth = Math.max(4, annotationCanvas.width * 0.004);
  annotationCtx.lineCap = "round";
  annotationCtx.beginPath();
  annotationCtx.moveTo(line.start.x, line.start.y);
  annotationCtx.lineTo(line.end.x, line.end.y);
  annotationCtx.stroke();

  annotationCtx.fillStyle = "#0ea5e9";
  annotationCtx.beginPath();
  annotationCtx.arc(line.start.x, line.start.y, annotationCtx.lineWidth, 0, Math.PI * 2);
  annotationCtx.fill();
  annotationCtx.beginPath();
  annotationCtx.arc(line.end.x, line.end.y, annotationCtx.lineWidth, 0, Math.PI * 2);
  annotationCtx.fill();
}

function normalizeLine(line) {
  return {
    start: {
      x: line.start.x / annotationCanvas.width,
      y: line.start.y / annotationCanvas.height,
    },
    end: {
      x: line.end.x / annotationCanvas.width,
      y: line.end.y / annotationCanvas.height,
    },
  };
}

function updateSubmissionPayload() {
  if (!activeLine || !frameCaptured || !currentClip) {
    latestPayload = null;
    submitAnnotationBtn.disabled = true;
    if (frameCaptured && submissionConfig.endpoint) {
      submissionStatus.textContent = "Draw the incision and release to submit.";
    }
    return;
  }

  const frameTime = Number((video.currentTime || video.duration || 0).toFixed(3));
  const normalizedLine = normalizeLine(activeLine);
  const lengthPixels = Math.hypot(
    activeLine.end.x - activeLine.start.x,
    activeLine.end.y - activeLine.start.y
  );

  const startPixels = {
    x: Number(activeLine.start.x.toFixed(2)),
    y: Number(activeLine.start.y.toFixed(2)),
  };
  const endPixels = {
    x: Number(activeLine.end.x.toFixed(2)),
    y: Number(activeLine.end.y.toFixed(2)),
  };

  const payload = {
    clipId: currentClip.id,
    clipLabel: currentClip.label,
    videoSrc: currentClip.src,
    capturedFrameTime: frameTime,
    incision: normalizedLine,
    incisionPixels: {
      start: startPixels,
      end: endPixels,
      length: Number(lengthPixels.toFixed(2)),
    },
    canvasSize: { width: annotationCanvas.width, height: annotationCanvas.height },
    generatedAt: new Date().toISOString(),
  };

  latestPayload = payload;

  if (!submissionConfig.endpoint) {
    submitAnnotationBtn.disabled = true;
    submissionStatus.textContent =
      "Investigator submission endpoint not configured. Update clip-config.js.";
    return;
  }

  if (!submissionInFlight) {
    submitAnnotationBtn.disabled = false;
  }
  submissionStatus.textContent = "Ready to submit. Tap the button to send your annotation.";
}

function buildCsvFormBody() {
  const participant = getParticipantMeta();
  const nowIso = new Date().toISOString();
  const flat = new URLSearchParams();
  // Participant-level fields (what you want in the CSV)
  if (participant.Name) flat.set("Name", participant.Name);
  if (participant.Institution) flat.set("Institution", participant.Institution);
  if (participant.Specialty) flat.set("Specialty", participant.Specialty);
  if (participant.Board) flat.set("Board", participant.Board);
  if (participant.Practice) flat.set("Practice", participant.Practice);
  if (participant.Volume) flat.set("Volume", participant.Volume);
  // Preserve optional existing scoring fields if provided upstream
  if (participant.Parkland) flat.set("Parkland", participant.Parkland);
  if (participant.Nassar) flat.set("Nassar", participant.Nassar);
  // Clip + submission fields
  if (currentClip?.id) flat.set("ClipID", currentClip.id);
  if (currentClip?.label) flat.set("ClipLabel", currentClip.label);
  flat.set("SubmittedAt", nowIso);
  return flat.toString();
}

async function mirrorToCsvEndpoint() {
  if (!csvMirrorConfig?.endpoint) return;
  try {
    const body = buildCsvFormBody();
    await fetch(csvMirrorConfig.endpoint, {
      method: csvMirrorConfig.method || "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(csvMirrorConfig.headers || {}),
      },
      body,
      mode: csvMirrorConfig.mode || "cors",
      credentials: csvMirrorConfig.credentials || "omit",
    });
  } catch (e) {
    console.warn("CSV mirror failed:", e);
  }
}

async function submitAnnotation() {
  if (!latestPayload) {
    showToast("Draw the incision before submitting.");
    return;
  }

  if (!submissionConfig.endpoint) {
    showToast("Submission endpoint missing. Update clip-config.js.");
    return;
  }

  if (submissionInFlight) return;

  submissionInFlight = true;
  submitAnnotationBtn.disabled = true;
  submissionStatus.textContent = "Submitting annotation…";

  const method = submissionConfig.method || "POST";
  const headers = { ...(submissionConfig.headers || {}) };
  let shouldSetDefaultContentType = true;
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === "content-type") {
      shouldSetDefaultContentType = false;
      if (headers[key] === null) {
        delete headers[key];
      }
    }
  }
  if (shouldSetDefaultContentType) {
    headers["Content-Type"] = "application/json";
  }

  const additionalFields = submissionConfig.additionalFields || {};
  // Also merge participant meta into JSON (keeps JSON "perfect" and adds fields openly)
  const participant = getParticipantMeta();

  let bodyWrapper;
  if (submissionConfig.bodyWrapper === "none") {
    bodyWrapper = { ...additionalFields, ...participant, ...latestPayload };
  } else {
    const key =
      typeof submissionConfig.bodyWrapper === "string" && submissionConfig.bodyWrapper
        ? submissionConfig.bodyWrapper
        : "annotation";
    bodyWrapper = { ...additionalFields, ...participant, [key]: latestPayload };
  }

  const fetchOptions = {
    method,
    headers,
    body: JSON.stringify(bodyWrapper),
  };

  if (submissionConfig.mode) {
    fetchOptions.mode = submissionConfig.mode;
  }
  if (submissionConfig.credentials) {
    fetchOptions.credentials = submissionConfig.credentials;
  }

  try {
    const response = await fetch(submissionConfig.endpoint, fetchOptions);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    // Fire-and-forget CSV mirror (flat, form-encoded)
    await mirrorToCsvEndpoint();
    submissionStatus.textContent = "Annotation submitted. Thank you!";
    showToast("Annotation sent to investigator.");
  } catch (error) {
    submissionStatus.textContent = "Submission failed. Please try again.";
    submitAnnotationBtn.disabled = false;
    showToast("Unable to submit annotation. Check your connection and try again.");
    console.error(error);
  } finally {
    submissionInFlight = false;
  }
}

clipSelect.addEventListener("change", loadSelectedClip);
replayBtn.addEventListener("click", handleReplay);
video.addEventListener("loadedmetadata", handleVideoMetadata);
video.addEventListener("loadeddata", handleVideoLoaded);
video.addEventListener("error", handleVideoError, { once: false });
video.addEventListener("ended", handleVideoEnded);
clearLineBtn.addEventListener("click", clearLine);
submitAnnotationBtn.addEventListener("click", submitAnnotation);

if (window.PointerEvent) {
  annotationCanvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
  annotationCanvas.addEventListener("pointermove", handlePointerMove, { passive: false });
  annotationCanvas.addEventListener("pointerup", handlePointerUp, { passive: false });
  annotationCanvas.addEventListener("pointercancel", handlePointerUp, { passive: false });
  annotationCanvas.addEventListener("mouseleave", handlePointerUp, { passive: false });
} else {
  annotationCanvas.addEventListener("mousedown", handlePointerDown, { passive: false });
  annotationCanvas.addEventListener("mousemove", handlePointerMove, { passive: false });
  annotationCanvas.addEventListener("mouseup", handlePointerUp, { passive: false });
  annotationCanvas.addEventListener("mouseleave", handlePointerUp, { passive: false });
  annotationCanvas.addEventListener("touchstart", handlePointerDown, { passive: false });
  annotationCanvas.addEventListener("touchmove", handlePointerMove, { passive: false });
  annotationCanvas.addEventListener("touchend", handlePointerUp, { passive: false });
  annotationCanvas.addEventListener("touchcancel", handlePointerUp, { passive: false });
}

const availableClips = getClips();
populateClipSelect(availableClips);
