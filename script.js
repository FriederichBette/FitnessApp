// ---- SUPABASE VERBINDUNG ----
const client = supabase.createClient(
  "https://yfqergfvydwfwyryggvo.supabase.co",
  "sb_publishable_auj_m_StlyxYK4uGiJYU3w_kll5T-lG"
);

let plan = [];
let logs = [];
let exercises = [];

const workoutContainer = document.getElementById("workout-container");
const saveBtn = document.getElementById("save-btn");
const workoutSelect = document.getElementById("workout-select");
const motivationEl = document.getElementById("motivation");
const nextWorkoutHint = document.getElementById("next-workout-hint");
const mainLoader = document.getElementById("main-loader");


// -------------------------------- AUTH --------------------------------

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login fehlgeschlagen");
    console.error(error);
    return;
  }

  alert("Login erfolgreich");
  location.reload();
}
document.getElementById("login-btn").addEventListener("click", login);


async function register() {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const { error } = await client.auth.signUp({
    email,
    password
  });

  if (error) {
    alert("Registrierung fehlgeschlagen");
    console.error(error);
    return;
  }

  alert("Account erstellt. Falls Email-Bestätigung aktiv ist, bitte Postfach prüfen.");
}
document.getElementById("register-btn").addEventListener("click", register);


async function logout() {
  await client.auth.signOut();
  alert("Abgemeldet");
  location.reload();
}
document.getElementById("logout-btn").addEventListener("click", logout);


// ---------------- EXERCISES ----------------
async function loadExercises() {
  const { data, error } = await client
    .from("exercises")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error loading exercises:", error);
    return;
  }

  exercises = data;
  console.log("EXERCISES Loaded:", exercises);
}


// ---------------- INITIALISIERUNG ----------------
document.getElementById("load-workout-btn").addEventListener("click", () => {
  loadWorkout();
  saveDraft();
});
saveBtn.addEventListener("click", saveWorkout);


async function init() {

  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session) {
    workoutContainer.innerHTML =
      "<p style='text-align:center'>Bitte zuerst einloggen.</p>";
    mainLoader.style.display = "none";
    return;
  }

  try {
    await Promise.all([
      loadExercises(),
      loadPlan(),
      loadLogs()
    ]);

    mainLoader.style.display = "none";

    const savedDraft = JSON.parse(localStorage.getItem("workout_draft"));
    if (savedDraft && savedDraft.workoutId) {
      workoutSelect.value = savedDraft.workoutId;
      loadWorkout(savedDraft.entries);
    } else {
      suggestNextWorkout();
    }

  } catch (error) {
    console.error("Initialization error:", error);
    workoutContainer.innerHTML =
      "<p style='color: #ef4444; text-align: center;'>Fehler beim Laden der Daten.</p>";
  }
}

init();


// ---------------- PLAN & LOGS LADEN ----------------
async function loadPlan() {
  const { data, error } = await client
    .from("plan")
    .select("*")
    .order("workout", { ascending: true });

  if (error) throw error;

  plan = data;
  console.log("PLAN Loaded:", plan);
}

async function loadLogs() {
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    logs = [];
    console.warn("Kein User eingeloggt → keine Logs geladen");
    return;
  }

  const { data, error } = await client
    .from("logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) throw error;

  logs = data.map(r => ({
    date: r.date,
    workout: Number(r.workout),
    exercise: r.exercise.trim(),
    set: Number(r.set),
    reps: r.reps === null ? null : Number(r.reps),
    weight: r.weight === null ? null : Number(r.weight)
  }));

  console.log("LOGS Loaded:", logs);
}


// ---------------- NEXT WORKOUT LOGIK ----------------
function suggestNextWorkout() {
  if (logs.length === 0) {
    nextWorkoutHint.innerHTML =
      `<span style="color: var(--primary-color)">Willkommen. Starte heute mit <strong>Full Body 1</strong></span>`;
    workoutSelect.value = 1;
    return;
  }

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
  let historyHtml =
    `<div style="margin-bottom: 10px; font-size: 0.85rem; color: var(--text-muted);">Deine letzten Trainings:</div>`;

  lastSessions.forEach((s, i) => {
    const dateStr = new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    historyHtml += `<div style="opacity: ${1 - i * 0.2}; margin-bottom: 4px;">
      ${i === 0 ? 'zuletzt: ' : 'davor: '} 
      <strong>FB ${s.workout}</strong> (${dateStr})
    </div>`;
  });

  const lastWorkoutId = lastSessions[0].workout;
  let nextId = lastWorkoutId + 1;
  if (nextId > 3) nextId = 1;

  nextWorkoutHint.innerHTML = `
    ${historyHtml}
    <div style="margin-top: 15px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid var(--accent-color);">
      Heute dran: <strong style="color: var(--accent-color)">Full Body ${nextId}</strong>
    </div>
  `;

  workoutSelect.value = nextId;
}


// ---------------- TIMER & VOLUME ----------------
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
  motivationEl.innerHTML =
    `⏱ Zeit: ${mins}:${secs} | ⚖️ Volumen: <span id="volume-val">0</span> kg`;
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


// ---------------- WORKOUT UI ----------------
function loadWorkout(draftEntries = null) {
  const workoutId = Number(workoutSelect.value);
  if (!workoutId) return;

  workoutContainer.innerHTML = "";
  saveBtn.disabled = false;

  const exs = plan.filter(p => p.workout === workoutId);

  if (exs.length === 0) {
    workoutContainer.innerHTML =
      `<p style="text-align: center; color: var(--text-muted);">
        Keine Übungen für Workout ${workoutId} gefunden.
      </p>`;
    return;
  }

  exs.forEach(ex => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    const header = `
      <h3>${ex.exercise}</h3>
      <div class="exercise-info">${ex.sets} Sätze · ${ex.reps_min}-${ex.reps_max} Wdh.</div>
    `;

    const lastLogs = getLastExerciseLogs(workoutId, ex.exercise, ex.sets);
    const lastLogsHtml = `
      <div class="last-logs">
        <strong>Letztes Mal:</strong>
        ${lastLogs.map((s, i) =>
          `<div>Satz ${i + 1}: ${s.weight !== null ? s.weight + " kg × " + s.reps : "–"}</div>`
        ).join("")}
      </div>
    `;

    card.innerHTML = header + lastLogsHtml;

    for (let i = 1; i <= ex.sets; i++) {
      const row = document.createElement("div");
      row.className = "set-row";

      let currentWeight = draftEntries?.find(d => d.ex === ex.exercise && d.set === i)?.weight;
      if (currentWeight === undefined)
        currentWeight = lastLogs[i - 1]?.weight || "";

      let currentReps =
        draftEntries?.find(d => d.ex === ex.exercise && d.set === i)?.reps || "";

      row.innerHTML = `
        <label>Satz ${i}</label>
        <input type="number" step="0.5" placeholder="kg"
          value="${currentWeight}"
          data-ex="${ex.exercise}" data-set="${i}"
          class="weight">

        <input type="number" placeholder="Wdh."
          value="${currentReps}"
          data-ex="${ex.exercise}" data-set="${i}"
          class="reps">
      `;

      card.appendChild(row);
    }

    workoutContainer.appendChild(card);
  });

  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      saveDraft();
      updateVolume();
    });
  });

  startTimer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ---------------- DRAFT SAVE ----------------
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


// ---------------- LETZTE LOGS ----------------
function getLastExerciseLogs(workoutId, exercise, sets) {
  const filtered = logs
    .filter(l => l.workout === workoutId && l.exercise === exercise)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0)
    return Array.from({ length: sets }, () => ({ reps: null, weight: null }));

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


// ---------------- SPEICHERN ----------------
async function saveWorkout() {
  const workoutId = Number(workoutSelect.value);
  const today = new Date().toISOString().slice(0, 10);

  const workoutData = [];
  const weightInputs = document.querySelectorAll(".weight");

  weightInputs.forEach(wInput => {
    const exercise = wInput.dataset.ex;
    const set = Number(wInput.dataset.set);
    const weight = wInput.value ? Number(wInput.value) : null;

    const rInput = document.querySelector(
      `.reps[data-ex="${exercise}"][data-set="${set}"]`
    );

    const reps = rInput.value ? Number(rInput.value) : null;

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

 const { data: auth } = await client.auth.getUser();
const userId = auth.user?.id;

// jedem Eintrag user_id hinzufügen
workoutData.forEach(d => d.user_id = userId);

const { error } = await client
  .from("logs")
  .insert(workoutData);

  if (error) {
    console.error(error);
    alert("Fehler beim Speichern");
  } else {
    localStorage.removeItem("workout_draft");
    alert("Workout gespeichert");

    await loadLogs();
    loadWorkout();
  }

  saveBtn.textContent = "Workout speichern";
  saveBtn.disabled = false;
}
