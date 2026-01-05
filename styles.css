:root {
  color-scheme: light dark;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  --bg: #0f172a;
  --surface: rgba(15, 23, 42, 0.75);
  --surface-light: rgba(255, 255, 255, 0.9);
  --border: rgba(148, 163, 184, 0.35);
  --accent: #38bdf8;
  --accent-strong: #0ea5e9;
  --text: #e2e8f0;
  --text-muted: #cbd5f5;
  --shadow: 0 20px 45px -25px rgba(8, 47, 73, 0.6);
}

body {
  margin: 0;
  background: radial-gradient(circle at 10% 20%, rgba(15, 118, 255, 0.22), rgba(8, 47, 73, 0.92)),
    #020617;
  min-height: 100vh;
  color: var(--text);
}

.layout {
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  display: grid;
  gap: 1.5rem;
}

.layout__header {
  text-align: center;
  display: grid;
  gap: 0.75rem;
}

.layout__header h1 {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.6rem);
  letter-spacing: -0.01em;
}

.layout__header p {
  margin: 0 auto;
  max-width: 60ch;
  color: var(--text-muted);
}

.card {
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(24px);
  overflow: hidden;
}

.card__header {
  margin: 0;
  padding: 1.25rem 1.5rem 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.card__header--space {
  justify-content: space-between;
  align-items: center;
}

.card__header h2 {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.card__body {
  padding: 0 1.5rem 1.5rem;
  display: grid;
  gap: 1rem;
}

.card__body--stack {
  gap: 0.75rem;
}

.card__actions {
  display: flex;
  gap: 0.5rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field__label {
  font-size: 0.9rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field__control {
  appearance: none;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 0.75rem 1rem;
  font: inherit;
  background: rgba(15, 23, 42, 0.45);
  color: inherit;
}

.field__control:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* --- VIDEO SHELL --- */
.video-shell {
  position: relative;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  max-width: 640px;   /* <-- ADDED */
  margin: 0 auto;     /* <-- ADDED */
}

.video-shell video,
.video-shell canvas {
  width: 100%;
  height: auto;
  display: block;
}

/* Optional: aspect ratio controlled version */
.video-shell--fixed {
  position: relative;
  width: 100%;
  max-width: 640px;
  aspect-ratio: 16 / 9;
  margin: 0 auto;
}

.video-shell--fixed video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-shell__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  justify-items: center;
  align-items: center;
  background: rgba(2, 6, 23, 0.65);
  gap: 1rem;
}

.overlay-instructions {
  text-align: center;
  max-width: 40ch;
  color: var(--text-muted);
}

/* --- CANVAS CONTAINER --- */
.canvas-container {
  position: relative;
  display: grid;
  grid-template-areas: "stack"; 
  gap: 0.5rem;
}

.canvas-container canvas {
  grid-area: stack;
  width: 100%;
  height: auto;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  touch-action: none;
}

#annotationCanvas {
  z-index: 10;
  position: relative;
}

.canvas-container p {
  grid-row: 2; 
}

.canvas-hint {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.help {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

button {
  appearance: none;
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1.5rem;
  font: inherit;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.primary {
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: #041021;
  font-weight: 600;
  box-shadow: 0 10px 25px -12px rgba(14, 165, 233, 0.9);
}

.secondary {
  background: rgba(15, 23, 42, 0.65);
  color: var(--text);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding-inline: 1.1rem;
}

button:not(:disabled):active {
  transform: translateY(1px);
}

.toast {
  position: fixed;
  inset-inline: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(20px);
  background: rgba(14, 165, 233, 0.95);
  color: #021421;
  padding: 0.75rem 1.2rem;
  border-radius: 999px;
  font-weight: 600;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 999;
  box-shadow: 0 20px 40px -18px rgba(14, 165, 233, 0.8);
}

.toast--visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 720px) {
  .layout {
    padding: 2.5rem 1rem 3rem;
  }

  .card__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .card__actions {
    width: 100%;
    justify-content: flex-start;
  }

  button {
    width: 100%;
  }
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.gesture-instrument-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
