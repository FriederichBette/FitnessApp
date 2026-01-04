const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyL9f3zlyGVh7JQmuiO3svTuQn-tT0xkv_RoidHX1HEzXvOzN-J6Xewa8F0j2-_7m3phQ/exec";

let plan = [];
let logs = [];

const workoutContainer = document.getElementById("workout-container");
const saveBtn = document.getElementById("save-btn");
const workoutSelect = document.getElementById("workout-select");
const motivationEl = document.getElementById("motivation");
const nextWorkoutHint = document.getElementById("next-workout-hint");
const mainLoader = document.getElementById("main-loader");

const MOTIVATION_QUOTES = []; // Deaktiviert


document.getElementById("load-workout-btn").addEventListener("click", () => {
  loadWorkout();
  saveDraft(); // Save the selected workout ID
});
saveBtn.addEventListener("click", saveWorkout);


async function init() {
  try {
    // motivationEl.style.display = "none";
    await Promise.all([loadPlan(), loadLogs()]);
    mainLoader.style.display = "none";

    // Check for saved draft
    const savedDraft = JSON.parse(localStorage.getItem("workout_draft"));
    if (savedDraft && savedDraft.workoutId) {
      workoutSelect.value = savedDraft.workoutId;
      loadWorkout(savedDraft.entries);
    } else {
      suggestNextWorkout();
    }
  } catch (error) {
    console.error("Initialization error:", error);
    workoutContainer.innerHTML = `<p style="color: #ef4444; text-align: center;">Fehler beim Laden der Daten. Bitte prüfe die Internetverbindung.</p>`;
  }
}

init();

/* ---------------- DATA FETCHING ---------------- */

async function loadPlan() {
  const res = await fetch(`${WEB_APP_URL}?mode=plan`);
  if (!res.ok) throw new Error("Plan could not be loaded");
  plan = await res.json();
  console.log("PLAN Loaded:", plan);
}

async function loadLogs() {
  const res = await fetch(`${WEB_APP_URL}?mode=logs`);
  if (!res.ok) throw new Error("Logs could not be loaded");
  const raw = await res.json();

  logs = raw.map(r => ({
    date: r.date,
    workout: Number(r.workout),
    exercise: String(r.exercise).trim(),
    set: Number(r.set),
    reps: r.reps ? Number(r.reps) : null,
    weight: r.weight ? Number(r.weight) : null
  }));

  console.log("LOGS Loaded:", logs);
}

/* ---------------- UI LOGIC ---------------- */

function showMotivation() {
  motivationEl.textContent = "";
}


function suggestNextWorkout() {
  if (logs.length === 0) {
    nextWorkoutHint.innerHTML = `<span style="color: var(--primary-color)">Willkommen! Starte heute mit **Full Body 1**</span>`;
    workoutSelect.value = 1;
    return;
  }

  // Get unique sessions (Date + WorkoutID)
  const sessions = [];
  const seenSessions = new Set();

  [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
    const key = `${log.date}-${log.workout}`;
    if (!seenSessions.has(key)) {
      sessions.push({ date: log.date, workout: log.workout });
      seenSessions.add(key);
    }
  });

  const lastSessions = sessions.slice(0, 3);
  let historyHtml = `<div style="margin-bottom: 10px; font-size: 0.85rem; color: var(--text-muted);">Deine letzten Trainings:</div>`;

  lastSessions.forEach((s, i) => {
    const dateStr = new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    historyHtml += `<div style="opacity: ${1 - i * 0.2}; margin-bottom: 4px;">${i === 0 ? ' zuletzt: ' : ' davor: '} <strong>FB ${s.workout}</strong> (${dateStr})</div>`;
  });

  const lastWorkoutId = lastSessions[0].workout;
  let nextId = lastWorkoutId + 1;
  if (nextId > 3) nextId = 1;

  nextWorkoutHint.innerHTML = `
    ${historyHtml}
    <div style="margin-top: 15px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid var(--accent-color);">
      HEUTE DRAN: <strong style="color: var(--accent-color)">Full Body ${nextId}</strong>
    </div>
  `;
  workoutSelect.value = nextId;
}

/* ---------------- TIMER & VOLUME ---------------- */

let timerInterval;
let startTime;

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  motivationEl.innerHTML = `⏱ Zeit: ${mins}:${secs} | ⚖️ Volumen: <span id="volume-val">0</span> kg`;
  updateVolume();
}

function updateVolume() {
  let totalVolume = 0;
  document.querySelectorAll(".exercise-card").forEach(card => {
    const weights = card.querySelectorAll(".weight");
    const reps = card.querySelectorAll(".reps");
    weights.forEach((w, i) => {
      const v = Number(w.value) || 0;
      const r = Number(reps[i].value) || 0;
      totalVolume += v * r;
    });
  });
  const volEl = document.getElementById("volume-val");
  if (volEl) volEl.textContent = totalVolume.toLocaleString('de-DE');
}


function loadWorkout(draftEntries = null) {
  const workoutId = Number(workoutSelect.value);
  if (!workoutId) return;

  workoutContainer.innerHTML = "";
  saveBtn.disabled = false;

  const exercises = plan.filter(p => p.workout === workoutId);

  if (exercises.length === 0) {
    workoutContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Keine Übungen für Workout ${workoutId} im Plan gefunden.</p>`;
    return;
  }

  exercises.forEach(ex => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    /* Header */
    const header = `
      <h3>${ex.exercise}</h3>
      <div class="exercise-info">${ex.sets} Sätze · ${ex.reps_min}-${ex.reps_max} Wdh.</div>
    `;

    /* Last Logs Section */
    const lastLogs = getLastExerciseLogs(workoutId, ex.exercise, ex.sets);
    const lastLogsHtml = `
      <div class="last-logs">
        <strong>Dein letztes Mal:</strong>
        ${lastLogs.map((s, i) =>
      `<div>Satz ${i + 1}: ${s.weight !== null ? s.weight + " kg × " + s.reps : "–"}</div>`
    ).join("")}
      </div>
    `;

    card.innerHTML = header + lastLogsHtml;

    /* Input Rows */
    for (let i = 1; i <= ex.sets; i++) {
      const row = document.createElement("div");
      row.className = "set-row";

      // PRE-FILL LOGIC: 1. Draft, 2. Last Time, 3. Planned
      let currentWeight = draftEntries?.find(d => d.ex === ex.exercise && d.set === i)?.weight;
      if (currentWeight === undefined) currentWeight = lastLogs[i - 1]?.weight || ex.planned_weight || "";

      let currentReps = draftEntries?.find(d => d.ex === ex.exercise && d.set === i)?.reps || "";

      row.innerHTML = `
        <label>Satz ${i}</label>
        <input type="number" step="0.5" placeholder="kg" value="${currentWeight}" data-ex="${ex.exercise}" data-set="${i}" class="weight">
        <input type="number" placeholder="Wdh." value="${currentReps}" data-ex="${ex.exercise}" data-set="${i}" class="reps">
      `;
      card.appendChild(row);
    }

    workoutContainer.appendChild(card);
  });

  // Attach autosave and volume listeners
  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      saveDraft();
      updateVolume();
    });
  });

  startTimer();
  // Scroll to top of container
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


function saveDraft() {
  const workoutId = workoutSelect.value;
  const entries = [];
  document.querySelectorAll(".exercise-card").forEach(card => {
    const weights = card.querySelectorAll(".weight");
    const reps = card.querySelectorAll(".reps");
    weights.forEach((w, i) => {
      if (w.value || reps[i].value) {
        entries.push({
          ex: w.dataset.ex,
          set: Number(w.dataset.set),
          weight: w.value,
          reps: reps[i].value
        });
      }
    });
  });
  localStorage.setItem("workout_draft", JSON.stringify({ workoutId, entries }));
}


function getLastExerciseLogs(workoutId, exercise, sets) {
  const filtered = logs
    .filter(l => l.workout === workoutId && l.exercise === exercise)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    return Array.from({ length: sets }, () => ({ reps: null, weight: null }));
  }

  // Get the most recent date used for this exercise
  const lastDate = filtered[0].date;
  const sameWorkoutData = filtered
    .filter(l => l.date === lastDate)
    .sort((a, b) => a.set - b.set);

  const result = [];
  for (let i = 1; i <= sets; i++) {
    const s = sameWorkoutData.find(x => x.set === i);
    result.push(s ? { reps: s.reps, weight: s.weight } : { reps: null, weight: null });
  }

  return result;
}

/* ---------------- SAVE ---------------- */

async function saveWorkout() {
  const workoutId = Number(workoutSelect.value);
  const today = new Date().toISOString().slice(0, 10);

  const workoutData = [];
  const weightInputs = document.querySelectorAll(".weight");

  weightInputs.forEach(wInput => {
    const exercise = wInput.dataset.ex;
    const set = Number(wInput.dataset.set);
    const weight = wInput.value ? Number(wInput.value) : null;

    const rInput = document.querySelector(`.reps[data-ex="${exercise}"][data-set="${set}"]`);
    const reps = rInput.value ? Number(rInput.value) : null;

    // Only save if at least reps are entered (0 is allowed but unlikely)
    if (reps !== null || weight !== null) {
      workoutData.push({
        date: today,
        workout: workoutId,
        exercise,
        set,
        reps,
        weight
      });
    }
  });

  if (workoutData.length === 0) {
    alert("Bitte gib mindestens einen Satz ein.");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Speichere...";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors", // Necessary for some GAS deployments to avoid CORS preflight issues
      body: JSON.stringify(workoutData),
      headers: {
        "Content-Type": "text/plain" // GAS wants text/plain for POST contents usually
      }
    });

    // Since we use no-cors, we can't read the response, but we assume success if no error is thrown
    localStorage.removeItem("workout_draft"); // Clear draft on success
    alert("Workout erfolgreich gespeichert! 💪");

    saveBtn.textContent = "Workout speichern";
    saveBtn.disabled = false;

    // Clear inputs or reload
    await loadLogs();
    loadWorkout(); // Refresh UI to show new "last time" logs
  } catch (error) {
    console.error("Save error:", error);
    alert("Fehler beim Speichern. Bitte versuche es erneut.");
    saveBtn.textContent = "Workout speichern";
    saveBtn.disabled = false;
  }
}
