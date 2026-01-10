// ---- MU-TH-UR 6.0 SYSTEM ----
const client = supabase.createClient(
  "https://yfqergfvydwfwyryggvo.supabase.co",
  "sb_publishable_auj_m_StlyxYK4uGiJYU3w_kll5T-lG"
);

let plan = [];
let logs = [];
let availableWorkouts = [];

// DOM Elements
const authOverlay = document.getElementById("auth-overlay");
const mainApp = document.getElementById("main-app");
const workoutContainer = document.getElementById("workout-container");
const contentArea = document.getElementById("content-area");
const saveBtn = document.getElementById("save-btn");
const workoutSelect = document.getElementById("workout-select");
const motivationEl = document.getElementById("motivation");
const nextWorkoutHint = document.getElementById("next-workout-hint");
const mainLoader = document.getElementById("main-loader");
const userDisplay = document.getElementById("user-display");
const routineSelect = document.getElementById("routine-select");

// Creation Elements
const exerciseListEditor = document.getElementById("exercise-list-editor");

// --- PENGUIN LOGIC (INITIALIZED EARLY) ---
function initPenguin() {
  const existing = document.getElementById("pixel-penguin");
  if (existing) existing.remove();

  const penguin = document.createElement("div");
  penguin.id = "pixel-penguin";
  penguin.className = "pixel-penguin";
  // Monochromer 8-Bit Stil: Nur Primary Color
  // Ein einfacherer Pixel-Pinguin
  penguin.innerHTML = `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; fill:var(--primary-color); image-rendering: pixelated;">
         <!-- Kopf -->
         <rect x="5" y="2" width="6" height="4" />
         <!-- Augen (Schwarz/Transparent) -->
         <rect id="p-eye-l" x="6" y="3" width="1" height="1" fill="#000" />
         <rect id="p-eye-r" x="9" y="3" width="1" height="1" fill="#000" />
         <!-- Schnabel -->
         <rect x="7" y="4" width="2" height="1" fill="var(--secondary-color)" opacity="0.8"/>
         <!-- Körper -->
         <rect x="4" y="6" width="8" height="7" />
         <!-- Bauch -->
         <rect x="6" y="7" width="4" height="5" fill="#000" opacity="0.3"/> 
         <!-- Füße -->
         <rect x="4" y="13" width="2" height="1" />
         <rect x="10" y="13" width="2" height="1" />
         <!-- Flügel (Winken) -->
         <rect x="2" y="7" width="2" height="3" /> 
         <rect x="12" y="7" width="2" height="3" />
      </svg>
      <div class="penguin-bubble" id="penguin-bubble"></div>
  `;
  document.body.appendChild(penguin);

  // Blinking Logic
  setInterval(() => {
    const l = document.getElementById("p-eye-l");
    const r = document.getElementById("p-eye-r");
    if (l && r) {
      l.setAttribute("height", "0.2"); l.setAttribute("y", "3.4");
      r.setAttribute("height", "0.2"); r.setAttribute("y", "3.4");
      setTimeout(() => {
        l.setAttribute("height", "1"); l.setAttribute("y", "3");
        r.setAttribute("height", "1"); r.setAttribute("y", "3");
      }, 200);
    }
  }, 4000);

  const messages = [
    "TRINK WASSER!", "SIEHST GUT AUS!",
    "LEICHTES GEWICHT!", "H2O!", "DURST?", "WEITER SO!",
    "MASCHINE!", "BLEIB DRAN!", "FOKUS!"
  ];

  // Loop: Peek every 20s
  setInterval(() => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const bubble = document.getElementById("penguin-bubble");

    // 1. Pop Up Animation
    penguin.style.animation = "peekCorner 5s ease-in-out";

    // 2. Show Message mid-animation
    setTimeout(() => {
      if (bubble) {
        bubble.textContent = msg + "_";
        bubble.style.opacity = "1";
      }
    }, 1000);

    // 3. Hide Message before hiding penguin
    setTimeout(() => {
      if (bubble) bubble.style.opacity = "0";
    }, 4000);

    // 4. Reset Animation
    setTimeout(() => {
      penguin.style.animation = "none";
    }, 5000);

  }, 20000); // Every 20s

  // VICTORY DANCE FUNCTION
  window.penguinDance = () => {
    penguin.style.animation = "none";
    penguin.offsetHeight;
    penguin.style.bottom = "50%"; // Jump to middle
    penguin.style.left = "50%";
    penguin.style.transform = "translate(-50%, -50%) scale(2)"; // Bigger!
    penguin.style.animation = "victoryDance 0.5s infinite"; // Dance!

    // Bubble
    const bubble = document.getElementById("penguin-bubble");
    if (bubble) {
      bubble.textContent = "TRAINING COMPLETE!_";
      bubble.style.opacity = "1";
    }

    // Reset after 3s
    setTimeout(() => {
      penguin.style.animation = "none";
      penguin.style.bottom = "80px";
      penguin.style.left = "-60px";
      penguin.style.transform = "none";
      if (bubble) bubble.style.opacity = "0";
    }, 3000);
  };
}
// Run immediately
initPenguin();

// Notification System
// Notification System (Toast)
function notify(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return; // Should not happen

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.textContent = `>>> ${msg.toUpperCase()} <<<`;

  container.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Timer Logic
let restTimerInterval;
let restTimeLeft = 0;

// ---------------- AUTH LOGIC ----------------

async function handleAuthState() {
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    authOverlay.style.display = "none";
    mainApp.style.display = "block";

    userDisplay.textContent = `ID: ${session.user.email.toUpperCase()}`;
    init(); // Load Data
    showPage("home");


  } else {
    authOverlay.style.display = "flex";
    mainApp.style.display = "none";
  }
}

client.auth.onAuthStateChange((event, session) => {
  handleAuthState();
});

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) notify("FEHLER: " + error.message, "error");
});

document.getElementById("register-btn").addEventListener("click", async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const { error } = await client.auth.signUp({ email, password });
  if (error) notify("FEHLER: " + error.message, "error");
  else notify("REGISTRIERUNG ERFOLGREICH: BITTE EMAIL BESTÄTIGEN");
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  document.body.classList.add("crt-off");
  setTimeout(async () => {
    await client.auth.signOut();
    document.body.classList.remove("crt-off");
  }, 600);
});

// UI Toggles
document.getElementById("show-register").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("auth-title").textContent = "NEU REGISTRIEREN";
});

document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "none";
  document.getElementById("auth-title").textContent = "ANMELDUNG";
});

// ---------------- NAVIGATION ----------------

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const targetPage = item.dataset.page;
    showPage(targetPage);
  });
});

function showPage(pageId) {
  navItems.forEach(i => {
    i.classList.remove("active");
    if (i.dataset.page === pageId) i.classList.add("active");
  });
  pages.forEach(p => p.style.display = "none");
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.style.display = "block";

  if (pageId === "home") {
    // Force reload to ensure dropdowns are populated
    loadWorkouts().then(() => {
      populateRoutineSelect();
      populateWorkoutSelect();
    });
  }
  if (pageId === "history") renderHistory();
  if (pageId === "create") {
    renderMyWorkouts();
    toggleWorkoutForm(false);
  }
  // Ensure nav is visible when changing pages
  document.querySelector(".bottom-nav").style.display = "flex";
}

// ---------------- PLAN VERWALTUNG ----------------

const workoutsListContainer = document.getElementById("workouts-list-container");
const workoutFormContainer = document.getElementById("workout-form-container");
const myWorkoutsList = document.getElementById("my-workouts-list");
const editWorkoutIdInput = document.getElementById("edit-workout-id");
const formTitle = document.getElementById("form-title");

document.getElementById("show-create-form-btn").addEventListener("click", () => {
  formTitle.textContent = "NEUER PLAN";
  editWorkoutIdInput.value = "";
  document.getElementById("new-routine-name").value = "";
  document.getElementById("new-workout-name").value = "";
  exerciseListEditor.innerHTML = "";
  addExerciseField();
  toggleWorkoutForm(true);
});

document.getElementById("cancel-form-btn").addEventListener("click", () => toggleWorkoutForm(false));

function toggleWorkoutForm(show) {
  workoutFormContainer.style.display = show ? "block" : "none";
  workoutsListContainer.style.display = show ? "none" : "block";
}

async function renderMyWorkouts() {
  const templatesList = document.getElementById("system-templates-list");
  myWorkoutsList.innerHTML = "LADE DATEN...";
  if (templatesList) templatesList.innerHTML = "";

  await loadWorkouts();
  myWorkoutsList.innerHTML = "";

  const templates = availableWorkouts.filter(w => w.is_template);
  const personal = availableWorkouts.filter(w => !w.is_template);

  // Render Templates
  // Render Templates Grouped by Routine
  if (templatesList) {
    if (templates.length === 0) {
      templatesList.innerHTML = "<p style='font-size:0.7rem; color:var(--text-muted);'>KEINE SYSTEM_VORLAGEN GEFUNDEN</p>";
    } else {
      // Group Templates
      const tempGroups = {};
      templates.forEach(w => {
        const r = (w.routine_name || "SYSTEM").toUpperCase();
        if (!tempGroups[r]) tempGroups[r] = [];
        tempGroups[r].push(w);
      });

      Object.keys(tempGroups).sort().forEach(routine => {
        // Create Header for Template Routine
        const headerId = `temp-header-${routine.replace(/[^a-zA-Z0-9]/g, '')}`;
        const contentId = `temp-content-${routine.replace(/[^a-zA-Z0-9]/g, '')}`;

        const header = document.createElement("div");
        header.className = "editor-header";
        header.style.cssText = "margin-bottom: 5px; border-bottom: 1px dashed var(--secondary-color); padding-bottom: 5px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;";

        // COPY WHOLE ROUTINE BUTTON
        header.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="toggleHistory('${contentId}', this)">
                 <span class="history-toggle-icon collapsed-icon">▼</span>
                 <span>${routine}</span>
            </div>
            <button class="secondary" style="width: auto; padding: 2px 8px; font-size: 0.6rem;" onclick="copyWholeRoutine('${routine}')">GANZE ROUTINE KOPIEREN</button>
        `;
        templatesList.appendChild(header);

        const groupContent = document.createElement("div");
        groupContent.id = contentId;
        groupContent.className = "routine-group-content collapsed";

        tempGroups[routine].forEach(w => {
          const item = document.createElement("div");
          item.className = "plan-manage-item";
          item.innerHTML = `
                <span>${w.name.toUpperCase()}</span>
                <button class="secondary" style="width:auto; padding:5px 10px; font-size:0.6rem;" onclick="copyWorkout('${w.id}')">KOPIEREN</button>
           `;
          groupContent.appendChild(item);
        });
        templatesList.appendChild(groupContent);
      });
    }
  }

  // Group by routine
  const groups = {};
  personal.forEach(w => {
    const r = (w.routine_name || "EINZELNE_WORKOUTS").toUpperCase();
    if (!groups[r]) groups[r] = [];
    groups[r].push(w);
  });

  Object.keys(groups).sort().forEach(routine => {
    const header = document.createElement("div");
    header.className = "editor-header";
    header.style.cssText = "margin-top: 20px; border-bottom: 1px solid var(--secondary-color); padding-bottom: 5px; color: var(--primary-color); display: flex; justify-content: space-between; align-items: center;";
    const headerId = `routine-header-${routine.replace(/[^a-zA-Z0-9]/g, '')}`;
    const contentId = `routine-content-${routine.replace(/[^a-zA-Z0-9]/g, '')}`;

    header.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="toggleHistory('${contentId}', this)">
                 <span class="history-toggle-icon collapsed-icon">▼</span>
                 <span>${routine}</span>
            </div>
            <button onclick="deleteRoutine('${routine}')" style="width: auto; padding: 2px 8px; font-size: 0.6rem; color: var(--error-color); border-color: var(--error-color);">X_ROUTINE_LÖSCHEN</button>
        `;
    myWorkoutsList.appendChild(header);

    const groupContent = document.createElement("div");
    groupContent.id = contentId;
    groupContent.className = "routine-group-content collapsed"; // Default collapsed

    groups[routine].forEach(w => {
      const item = document.createElement("div");
      item.className = "plan-manage-item";
      item.innerHTML = `
                <span>${w.name.toUpperCase()}</span>
                <div class="plan-btn-group">
                    <button class="btn-edit" onclick="editWorkout('${w.id}')">BEARB.</button>
                    <button class="btn-delete" onclick="deleteWorkout('${w.id}')">LÖSCHEN</button>
                </div>
            `;
      groupContent.appendChild(item);
    });
    myWorkoutsList.appendChild(groupContent);
  });

  // Add safe spacer to avoid bottom nav overlap at the very end
  const spacer = document.createElement("div");
  spacer.className = "safe-spacer";
  myWorkoutsList.appendChild(spacer);
}

window.copyWorkout = async (id) => {
  const routine = prompt("ROUTINE-NAME? (FREI LASSEN FÜR EINZELNES WORKOUT)", "");
  const finalRoutine = routine ? routine.trim().toUpperCase() : "EINZELNE_WORKOUTS";

  notify("DATEN_TRANSMISSION...");
  const { data: { user } } = await client.auth.getUser();
  const original = availableWorkouts.find(w => w.id === id);
  if (!original) return;

  const { data: newW, error: wErr } = await client.from("workouts")
    .insert({
      name: original.name,
      user_id: user.id,
      is_template: false,
      routine_name: finalRoutine
    })
    .select().single();

  if (wErr) return notify("FEHLER_BEIM_KOPIEREN", "error");

  const { data: steps } = await client.from("workout_exercises").select("*").eq("workout_id", id);
  if (steps && steps.length > 0) {
    const newSteps = steps.map(s => ({
      workout_id: newW.id,
      exercise: s.exercise,
      sets: s.sets,
      reps: s.reps || s.reps_max,
      rest_time: s.rest_time || 60
    }));
    await client.from("workout_exercises").insert(newSteps);
  }

  notify("PLAN_SYNCHRONISIERT");
  await init();
  renderMyWorkouts();
};

window.copyWholeRoutine = async (routineName) => {
  const targetName = prompt(`NAME FÜR KOPIE VON "${routineName}"?`, routineName);
  if (!targetName) return;

  notify(`KOPIERE ROUTINE "${routineName}"...`);
  const { data: { user } } = await client.auth.getUser();

  // Find all templates in this routine
  const templates = availableWorkouts.filter(w => w.is_template && w.routine_name === routineName);

  if (templates.length === 0) return notify("KEINE VORLAGEN GEFUNDEN", "error");

  for (const tpl of templates) {
    // 1. Create Workout Copy
    const { data: newW, error: wErr } = await client.from("workouts")
      .insert({
        name: tpl.name,
        user_id: user.id,
        is_template: false,
        routine_name: targetName.trim().toUpperCase()
      })
      .select().single();

    if (wErr) {
      console.error(wErr);
      continue;
    }

    // 2. Load and Copy Exercises
    const { data: steps } = await client.from("workout_exercises").select("*").eq("workout_id", tpl.id);
    if (steps && steps.length > 0) {
      const newSteps = steps.map(s => ({
        workout_id: newW.id,
        exercise: s.exercise,
        sets: s.sets,
        reps: s.reps || s.reps_max,
        rest_time: s.rest_time || 60,
        is_cardio: s.is_cardio // Ensure cardio flag is copied
      }));
      await client.from("workout_exercises").insert(newSteps);
    }
  }

  notify("ROUTINE ERFOLGREICH KOPIERT");
  await init();
  renderMyWorkouts();
};

window.editWorkout = async (id) => {
  const workout = availableWorkouts.find(w => w.id === id);
  if (!workout) return;

  formTitle.textContent = "PLAN ÄNDERN";
  editWorkoutIdInput.value = id;
  document.getElementById("new-routine-name").value = workout.routine_name || "";
  document.getElementById("new-workout-name").value = workout.name;

  exerciseListEditor.innerHTML = "LADE ÜBUNGEN...";
  const { data: steps } = await client.from("workout_exercises").select("*").eq("workout_id", id);
  exerciseListEditor.innerHTML = "";

  if (steps && steps.length > 0) {
    steps.forEach(s => addExerciseWithData(s));
  } else {
    addExerciseField();
  }
  toggleWorkoutForm(true);
};

function addExerciseWithData(data) {
  const div = document.createElement("div");
  div.className = "exercise-edit-row";
  div.style.cssText = "display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr 40px; gap: 10px; align-items: center; margin-bottom: 10px;";
  const isCardio = data.is_cardio || false;
  div.innerHTML = `
        <input type="text" placeholder="ÜBUNG" class="edit-name" value="${data.exercise}" style="margin:0;">
        <input type="number" placeholder="${isCardio ? 'DAUER' : 'SÄTZE'}" title="${isCardio ? 'MINUTEN' : 'SÄTZE'}" class="edit-sets" value="${data.sets}" style="margin:0;">
        <input type="number" placeholder="${isCardio ? 'KCAL' : 'WDH'}" title="${isCardio ? 'KCAL' : 'WDH'}" class="edit-reps" value="${data.reps || data.reps_max || ""}" style="margin:0;">
        <input type="number" placeholder="PAUSE" class="edit-rest" value="${data.rest_time || 60}" style="margin:0;">
        <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
            <input type="checkbox" class="edit-cardio" ${isCardio ? 'checked' : ''} style="width:20px; height:20px; margin:0;" onchange="toggleRowLabels(this)">
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 2px; color: var(--error-color); border:none; font-size:0.8rem;">X</button>
        </div>
    `;
  exerciseListEditor.appendChild(div);
}

function addExerciseField() {
  const div = document.createElement("div");
  div.className = "exercise-edit-row";
  div.style.cssText = "display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr 40px; gap: 10px; align-items: center; margin-bottom: 10px;";
  div.innerHTML = `
        <input type="text" placeholder="ÜBUNG" class="edit-name" style="margin:0;">
        <input type="number" placeholder="SÄTZE" class="edit-sets" style="margin:0;">
        <input type="number" placeholder="WDH" class="edit-reps" style="margin:0;">
        <input type="number" placeholder="PAUSE" class="edit-rest" value="60" style="margin:0;">
        <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
            <input type="checkbox" class="edit-cardio" style="width:20px; height:20px; margin:0;" onchange="toggleRowLabels(this)">
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 2px; color: var(--error-color); border:none; font-size:0.8rem;">X</button>
        </div>
    `;
  exerciseListEditor.appendChild(div);
}

window.toggleRowLabels = (cb) => {
  const row = cb.parentElement.parentElement;
  const sInput = row.querySelector(".edit-sets");
  const rInput = row.querySelector(".edit-reps");
  if (cb.checked) {
    sInput.placeholder = "DAUER"; sInput.title = "MINUTEN";
    rInput.placeholder = "KCAL"; rInput.title = "KCAL";
  } else {
    sInput.placeholder = "SÄTZE"; sInput.title = "SÄTZE";
    rInput.placeholder = "WDH"; rInput.title = "WDH";
  }
};

window.deleteRoutine = async (routineName) => {
  if (!confirm(`GESAMTE ROUTINE "${routineName}" UND ALLE ENTHALTENEN PLÄNE LÖSCHEN?`)) return;

  notify("BEREINIGE_DATENBANK...");
  const { data: { user } } = await client.auth.getUser();

  // 1. Find all workout IDs in this routine
  const { data: ws } = await client.from("workouts")
    .select("id")
    .eq("user_id", user.id)
    .eq("routine_name", routineName);

  if (ws && ws.length > 0) {
    const ids = ws.map(w => w.id);
    // 2. Delete exercises
    await client.from("workout_exercises").delete().in("workout_id", ids);
    // 3. Delete workouts
    await client.from("workouts").delete().in("id", ids);
  }

  await init();
  renderMyWorkouts();
  notify("ROUTINE_ENTFERNT");
};

window.deleteWorkout = async (id) => {
  if (!confirm("PLAN WIRKLICH LÖSCHEN?")) return;
  await client.from("workout_exercises").delete().eq("workout_id", id);
  await client.from("workouts").delete().eq("id", id);
  await init();
  renderMyWorkouts();
};

document.getElementById("save-new-workout-btn").addEventListener("click", async () => {
  const routine = document.getElementById("new-routine-name").value.trim().toUpperCase() || "STANDARD";
  const name = document.getElementById("new-workout-name").value.trim();
  const editId = editWorkoutIdInput.value;
  if (!name) return notify("NAME_FEHLT", "error");

  const { data: { user } } = await client.auth.getUser();
  let workoutId = editId;

  if (editId) {
    await client.from("workouts").update({ name, routine_name: routine }).eq("id", editId);
    await client.from("workout_exercises").delete().eq("workout_id", editId);
  } else {
    const { data: wData } = await client.from("workouts").insert({ name, routine_name: routine, user_id: user.id }).select().single();
    workoutId = wData.id;
  }

  const steps = [];
  document.querySelectorAll(".exercise-edit-row").forEach(row => {
    const exName = row.querySelector(".edit-name").value.trim();
    const sets = row.querySelector(".edit-sets").value;
    const reps = row.querySelector(".edit-reps").value;
    const rest = row.querySelector(".edit-rest").value;
    const is_cardio = row.querySelector(".edit-cardio").checked;
    if (exName && sets) {
      steps.push({
        workout_id: workoutId,
        exercise: exName,
        sets: Number(sets),
        reps: Number(reps) || null,
        rest_time: Number(rest) || 60,
        is_cardio: is_cardio
      });
    }
  });

  if (steps.length > 0) await client.from("workout_exercises").insert(steps);
  notify("PLAN_GESPEICHERT");
  toggleWorkoutForm(false);

  // Ensure Nav is visible (user stays on Plans page)
  document.querySelector(".bottom-nav").style.display = "flex";

  await init();
  renderMyWorkouts();
});

document.getElementById("add-exercise-field-btn").addEventListener("click", addExerciseField);

// ---------------- INITIALISIERUNG ----------------

async function init() {
  mainLoader.style.display = "block";
  contentArea.innerHTML = "";
  const actionEl = document.getElementById("workout-actions");
  if (actionEl) actionEl.style.display = "none";

  try {
    await Promise.all([loadWorkouts(), loadPlan(), loadLogs()]);
    populateRoutineSelect();

    const savedDraft = JSON.parse(localStorage.getItem("workout_draft"));
    if (savedDraft && savedDraft.workout) {
      const w = availableWorkouts.find(x => x.id === savedDraft.workout);
      if (w) {
        routineSelect.value = w.routine_name;
        populateWorkoutSelect();
        workoutSelect.value = savedDraft.workout;
        loadWorkout(savedDraft.entries);
      }
    } else {
      // Pick most recent routine from logs
      if (logs.length > 0) {
        const lastW = availableWorkouts.find(w => w.id == logs[0].workout);
        if (lastW) routineSelect.value = lastW.routine_name;
      }
      populateWorkoutSelect();
      suggestNextWorkout();
    }
  } catch (err) {
    console.error("Ladefehler:", err);
  } finally {
    mainLoader.style.display = "none";
  }
}

async function loadWorkouts() {
  const { data } = await client.from("workouts").select("*").order("name");
  availableWorkouts = data || [];
}

async function loadPlan() {
  const { data } = await client.from("workout_exercises").select("*");
  plan = data || [];
}

async function loadLogs(fetchAll = false) {
  const { data: { user } } = await client.auth.getUser();
  let query = client.from("logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!fetchAll) {
    query = query.limit(50);
  }

  const { data } = await query;
  logs = data || [];
  if (fetchAll) notify("GESAMTES ARCHIV GELADEN");
}

function populateRoutineSelect() {
  const routines = [...new Set(availableWorkouts.filter(w => !w.is_template).map(w => w.routine_name))].filter(Boolean).sort();
  routineSelect.innerHTML = '<option value="">-- ALLE ROUTINEN --</option>';
  routines.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r.toUpperCase();
    routineSelect.appendChild(opt);
  });
}

function populateWorkoutSelect() {
  const routine = routineSelect.value;
  const placeholder = workoutSelect.options[0];
  workoutSelect.innerHTML = "";
  workoutSelect.appendChild(placeholder);

  const filtered = availableWorkouts.filter(w => !w.is_template && (!routine || w.routine_name === routine));

  filtered.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name.toUpperCase();
    workoutSelect.appendChild(opt);
  });
}

routineSelect.addEventListener("change", () => {
  populateWorkoutSelect();
  suggestNextWorkout();
});

function suggestNextWorkout() {
  const currentRoutine = routineSelect.value;
  const personalWorkouts = availableWorkouts.filter(w => !w.is_template);

  if (personalWorkouts.length === 0) {
    nextWorkoutHint.innerHTML = "KEINE PLÄNE VORHANDEN";
    return;
  }

  // 1. Filter Pool based on selection OR all (if nothing selected)
  const sourcePool = currentRoutine
    ? personalWorkouts.filter(w => w.routine_name === currentRoutine)
    : personalWorkouts;

  if (sourcePool.length === 0) {
    nextWorkoutHint.innerHTML = "WÄHLE EINE ROUTINE";
    return;
  }

  // 2. Sort sourcePool by name to ensure consistent rotation (Body 1 -> Body 2 -> Body 3)
  sourcePool.sort((a, b) => a.name.localeCompare(b.name));

  // 3. Find the VERY LAST log entry that matches ANY workout in this specific pool
  // This ensures we resume THIS routine where we left off, ignoring other routines interleaved
  const lastLogForThisRoutine = logs.find(l => {
    return sourcePool.some(w => w.id === l.workout);
  });

  let nextId;
  if (!lastLogForThisRoutine) {
    // Never trained this routine? Start with first alphabetical
    nextId = sourcePool[0].id;
  } else {
    const lastWId = lastLogForThisRoutine.workout;
    const ids = sourcePool.map(w => w.id);
    let lastIndex = ids.indexOf(lastWId);

    // Safety if workout was deleted
    if (lastIndex === -1) lastIndex = 0;

    let nextIndex = lastIndex + 1;
    if (nextIndex >= ids.length) nextIndex = 0; // Loop back to start
    nextId = ids[nextIndex];
  }

  const nextW = sourcePool.find(w => w.id === nextId);
  if (nextW) {
    nextWorkoutHint.innerHTML = `VORSCHLAG: <span style="color: var(--primary-color)">${nextW.name.toUpperCase()}</span>`;

    // Auto-select ONLY if we are in the matching routine view
    if (!currentRoutine || nextW.routine_name === currentRoutine) {
      workoutSelect.value = nextId;
    }
  }
}

// ---------------- TRAINING ----------------

document.getElementById("load-workout-btn").addEventListener("click", async () => {
  await loadWorkout();
  saveDraft();
});

async function loadWorkout(draftEntries = null) {
  const workoutId = workoutSelect.value;
  if (!workoutId) return;

  // Safety: Reload plan if empty (can happen on refresh/auth race condition)
  if (!plan || plan.length === 0) {
    await loadPlan();
  }



  contentArea.innerHTML = "";
  // Dynamische Navigation: Verstecken für mehr Platz
  document.querySelector(".bottom-nav").style.display = "none";
  document.querySelector(".selection-area").style.display = "none";
  document.getElementById("next-workout-hint").style.display = "none";

  const actionEl = document.getElementById("workout-actions");
  if (actionEl) actionEl.style.display = "flex";
  saveBtn.disabled = false;

  // Ensure type safety (ID comparison)
  const exercisesInWorkout = plan.filter(p => p.workout_id == workoutId);

  if (exercisesInWorkout.length === 0) {
    // Fallback: Try to fetch specifically for this ID if local plan is incomplete
    const { data: specificExercises } = await client.from("workout_exercises").select("*").eq("workout_id", workoutId);

    if (!specificExercises || specificExercises.length === 0) {
      contentArea.innerHTML = "<p style='text-align:center;'>FEHLER: KEINE ÜBUNGEN GEFUNDEN</p>";
      return;
    }
    exercisesInWorkout.push(...specificExercises);
  }

  // --- PROGRESSIVE OVERLOAD FIX ---
  // Fetch last logs specifically for these exercises to ensure we show history
  // even if it's older than the default loaded history limit.
  const uniqueExercises = [...new Set(exercisesInWorkout.map(e => e.exercise))];
  if (uniqueExercises.length > 0) {
    // We fetch the last 10 entries for each exercise to be safe (simplified via one query with adequate limit)
    // Note: A smarter way would be per-exercise RPC, but 'in' query sorted by date is good enough for now.
    const { data: historyData } = await client
      .from("logs")
      .select("*")
      .in("exercise", uniqueExercises)
      .eq("user_id", (await client.auth.getUser()).data.user.id)
      .order("date", { ascending: false })
      .limit(200); // Fetch enough recent context for these specific moves

    if (historyData) {
      // Merge into global logs if not present, so getLastExerciseLogs finds them
      historyData.forEach(hLog => {
        if (!logs.find(existing => existing.id === hLog.id)) {
          logs.push(hLog);
        }
      });
      // Re-sort global logs just in case
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  try {
    exercisesInWorkout.forEach((ex) => {
      if (!ex.exercise) return; // Skip invalid entries

      const card = document.createElement("div");
      card.className = "exercise-card";
      const lastLogs = getLastExerciseLogs(ex.exercise, workoutId);

      if (ex.is_cardio) {
        card.innerHTML = `
                    <h3>[ CARDIO ] ${ex.exercise.toUpperCase()}</h3>
                    <div class="exercise-info">ZIEL: ${ex.sets} MIN | KCAL: ${ex.reps || "--"}</div>
                    <div class="last-logs">ZULETZT: ${lastLogs}</div>
                    <div class="set-row cardio-entry">
                        <label style="font-size:0.75rem;">IST-DATEN:</label>
                        <input type="number" placeholder="MIN" class="weight duration" data-ex="${ex.exercise}" data-iscardio="true" style="width: 70px;">
                        <input type="number" placeholder="KCAL" class="reps calories" data-ex="${ex.exercise}" style="width: 70px;">
                    </div>
                `;
      } else {
        card.innerHTML = `
                    <h3>${ex.exercise.toUpperCase()}</h3>
                    <div class="exercise-info">ZIEL: ${ex.sets} SÄTZE | WDH: ${ex.reps || "--"}</div>
                    <div class="last-logs">ZULETZT: ${lastLogs}</div>
                `;

        for (let i = 1; i <= ex.sets; i++) {
          const row = document.createElement("div");
          row.className = "set-container";
          const draft = draftEntries?.find(d => d.ex === ex.exercise && d.set === i);
          row.innerHTML = `
                        <div class="set-row" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                            <label style="min-width: 55px; font-size: 0.75rem;">SATZ_${i}</label>
                            <input type="number" step="0.5" placeholder="KG" class="weight" data-ex="${ex.exercise}" data-set="${i}" value="${draft ? draft.weight : ""}" style="width: 50px; margin: 0; padding: 4px;">
                            <input type="number" placeholder="WDH" class="reps" data-ex="${ex.exercise}" data-set="${i}" value="${draft ? draft.reps : ""}" style="width: 45px; margin: 0; padding: 4px;">
                            <button class="start-rest-btn" data-ex="${ex.exercise}" data-set="${i}" data-rest="${ex.rest_time || 60}" style="width: auto; padding: 4px 6px; font-size: 0.65rem;">PAUSE</button>
                            <div class="rest-zone" id="rest-${ex.exercise.replace(/\s+/g, '-')}-${i}" style="font-size: 0.6rem; color: var(--text-muted); display: none; overflow: hidden; text-overflow: ellipsis;"></div>
                        </div>
                    `;
          card.appendChild(row);
        }
      }
      contentArea.appendChild(card);
    });
  } catch (err) {
    contentArea.innerHTML += `<p style="color:red; text-align:center;">RENDER ERROR: ${err.message}</p>`;
    console.error(err);
  }
  // Ensure safe-spacer at the end of Training page
  const trainingSpacer = document.createElement("div");
  trainingSpacer.className = "safe-spacer";
  contentArea.appendChild(trainingSpacer);

  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      saveDraft();
      updateVolume();
    });
  });

  document.querySelectorAll(".start-rest-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const ex = e.target.dataset.ex;
      const set = e.target.dataset.set;
      startRestTimer(ex, set);
    });
  });

  updateVolume();
  startTimer();
}

function startRestTimer(exName, setNum, customRest = null) {
  let duration = customRest || 60;

  // Check if event target has specific rest
  if (!customRest) {
    const btn = document.querySelector(`.start-rest-btn[data-ex="${exName}"][data-set="${setNum}"]`);
    if (btn && btn.dataset.rest) duration = Number(btn.dataset.rest);
  }

  let millisLeft = duration * 1000;
  const total = duration * 1000;
  const safeName = exName.replace(/\s+/g, '-');
  const zoneId = `rest-${safeName}-${setNum}`;
  const zone = document.getElementById(zoneId);
  const frames = ["/", "-", "\\", "|"];
  let frame = 0;

  if (!zone) return;
  zone.style.display = "block";

  const timer = setInterval(() => {
    millisLeft -= 100;
    frame++;

    const secondsLeft = Math.max(0, Math.ceil(millisLeft / 1000));
    const totalSteps = 8;
    const filledSteps = Math.floor(((total - millisLeft) / total) * totalSteps);
    const bar = "█".repeat(Math.max(0, filledSteps)) + ".".repeat(Math.max(0, totalSteps - filledSteps));
    const spinner = frames[frame % frames.length];

    zone.innerHTML = `${spinner} [${bar}] ${secondsLeft}s`;

    if (millisLeft <= 0) {
      clearInterval(timer);
      zone.innerHTML = `<span style="color: var(--primary-color);">READY</span>`;
      setTimeout(() => { if (zone.innerHTML.includes("READY")) zone.style.display = "none"; }, 4000);
    }
  }, 100);
}

function getLastExerciseLogs(exerciseName, filterWorkoutId = null) {
  let filtered = logs.filter(l => l.exercise === exerciseName);

  if (filterWorkoutId) {
    filtered = filtered.filter(l => l.workout === filterWorkoutId);
  }

  filtered = filtered.slice(0, 3);

  if (filtered.length === 0) return "KEINE DATEN";
  return filtered.map(l => `${l.weight}KG x ${l.reps}`).join(" | ");
}

function updateVolume() {
  let total = 0;
  document.querySelectorAll(".exercise-card .set-row").forEach(row => {
    total += (Number(row.querySelector(".weight").value) || 0) * (Number(row.querySelector(".reps").value) || 0);
  });

  const volEl = document.getElementById("volume-val");
  const timerEl = document.getElementById("timer-val");

  if (volEl && timerEl) {
    // Elements exist, just update volume text
    volEl.textContent = total.toLocaleString();
  } else {
    // Elements missing (likely overwritten), rebuild structure
    // Preserve time if timer was running
    const currentTime = timerEl ? timerEl.textContent : "00:00";
    motivationEl.innerHTML = `ZEIT: <span id="timer-val">${currentTime}</span> | VOLUMEN: <span id="volume-val">${total.toLocaleString()}</span> KG`;
  }
}

let timerInterval;
let workoutStartTime;

function startTimer(reset = true) {
  if (timerInterval) clearInterval(timerInterval);
  if (reset) workoutStartTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    const el = document.getElementById("timer-val");
    if (el) el.textContent = `${m}:${s}`;
  }, 1000);
}

function saveDraft() {
  const entries = [];
  document.querySelectorAll(".exercise-card .set-row").forEach(row => {
    const w = row.querySelector(".weight");
    const r = row.querySelector(".reps");
    if (w.value || r.value) {
      entries.push({
        ex: w.dataset.ex,
        set: Number(w.dataset.set || 1),
        weight: w.value,
        reps: r.value,
        isCardio: w.dataset.iscardio === "true"
      });
    }
  });
  localStorage.setItem("workout_draft", JSON.stringify({ workout: workoutSelect.value, entries }));
}

saveBtn.addEventListener("click", saveWorkout);

async function saveWorkout() {
  const workoutId = workoutSelect.value;
  const workoutObj = availableWorkouts.find(w => w.id == workoutId);
  const workoutName = workoutObj ? workoutObj.name : "UNBEKANNT";

  saveBtn.disabled = true; // Sperren zu Beginn

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Nicht eingeloggt");

    const today = new Date().toISOString().slice(0, 10);
    const dataToSave = [];

    document.querySelectorAll(".exercise-card .set-row").forEach(row => {
      const wInput = row.querySelector(".weight");
      const rInput = row.querySelector(".reps");
      const weightVal = wInput.value;
      const repsVal = rInput.value;

      if (weightVal || repsVal) {
        const isCardio = wInput.dataset.iscardio === "true";
        dataToSave.push({
          user_id: user.id,
          date: today,
          workout: workoutId,
          workout_name: workoutName,
          exercise: wInput.dataset.ex,
          set: isCardio ? 1 : Number(wInput.dataset.set || 1),
          weight: isCardio ? 0 : Number(weightVal || 0),
          reps: isCardio ? 0 : Number(repsVal || 0),
          duration: isCardio ? Number(weightVal || 0) : null,
          calories: isCardio ? Number(repsVal || 0) : null
        });
      }
    });

    if (dataToSave.length === 0) {
      notify("KEINE_DATEN_ZUM_SPEICHERN", "error");
      saveBtn.disabled = false;
      return;
    }

    const { error } = await client.from("logs").insert(dataToSave);
    if (error) throw error;

    // Success Sequence
    notify("DATEN_ARCHIVIERT");
    localStorage.removeItem("workout_draft");

    // UI Reset
    document.querySelector(".bottom-nav").style.display = "flex";
    document.querySelector(".selection-area").style.display = "block";
    document.getElementById("next-workout-hint").style.display = "block";
    document.getElementById("workout-actions").style.display = "none";
    contentArea.innerHTML = "";

    // Gamification (Safe Call)
    try {
      if (window.penguinDance) window.penguinDance();
    } catch (e) { console.warn("Penguin Error:", e); }

    await init();

  } catch (error) {
    console.error("Save Error:", error);
    notify(`FEHLER: ${error.message}`, "error");
  } finally {
    saveBtn.disabled = false; // Immer entsperren
  }
}

// Abbrechen Button Logik
document.getElementById("abort-workout-btn").addEventListener("click", () => {
  if (confirm("TRAINING WIRKLICH ABBRECHEN?")) {
    document.querySelector(".bottom-nav").style.display = "flex";
    document.querySelector(".selection-area").style.display = "block";
    document.getElementById("next-workout-hint").style.display = "block";
    document.getElementById("workout-actions").style.display = "none";
    contentArea.innerHTML = "";
    localStorage.removeItem("workout_draft");
    init();
    showPage("home");
    notify("PROZESS_ABGEBROCHEN");
  }
});

// Pause/Resume Toggle
document.getElementById("pause-btn")?.addEventListener("click", (e) => {
  const btn = e.target;
  if (btn.textContent === "TR. PAUSIEREN") {
    // PAUSE MODE
    if (timerInterval) clearInterval(timerInterval);
    document.querySelector(".bottom-nav").style.display = "flex";
    btn.textContent = "TR. FORTSETZEN";
    btn.style.borderStyle = "dashed";
    notify("TRAINING PAUSIERT");
  } else {
    // RESUME MODE
    document.querySelector(".bottom-nav").style.display = "none";
    btn.textContent = "TR. PAUSIEREN";
    btn.style.borderStyle = "solid";
    startTimer(false); // Don't reset start time
    notify("TRAINING FORTGESETZT");
  }
});

function renderHistory() {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";
  if (logs.length === 0) return;

  // --- WEEKLY STATS CALCULATION ---
  const weeks = {};
  logs.forEach(l => {
    const d = new Date(l.date);
    // Rough ISO Week (simple version)
    const onejan = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-KW${weekNum}`;

    if (!weeks[key]) weeks[key] = { vol: 0, sets: 0 };
    weeks[key].vol += (Number(l.weight) || 0) * (Number(l.reps) || 0);
    weeks[key].sets++;
  });

  // Render Weekly Stats Header
  const statsDiv = document.createElement("div");
  statsDiv.className = "info-section";
  statsDiv.innerHTML = `<div class="editor-header">WOCHENSTATISTIK</div>`;

  // Show last 3 weeks
  Object.keys(weeks).sort().reverse().slice(0, 3).forEach(w => {
    const vol = Math.round(weeks[w].vol);
    statsDiv.innerHTML += `
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-bottom:1px dashed var(--secondary-color); padding:5px 0;">
            <span>${w}</span>
            <span>VOL: ${vol.toLocaleString()} KG | SÄTZE: ${weeks[w].sets}</span>
        </div>
      `;
  });
  statsDiv.innerHTML += `<div class="safe-spacer" style="height:20px;"></div>`;
  historyList.appendChild(statsDiv);
  const grouped = {};
  logs.forEach(log => {
    // Safety: If workout is missing, use "unknown" to prevent crash
    const wId = log.workout || "unknown";
    // Group by Date AND Workout ID to separate distinct sessions on the same day
    const key = `${log.date}___${wId}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  Object.keys(grouped).sort((a, b) => {
    try {
      const dateA = a.split("___")[0];
      const dateB = b.split("___")[0];
      // If dates are equal, sort by created_at of the first item (if available)
      if (dateA === dateB) {
        const itemA = grouped[a][0];
        const itemB = grouped[b][0];
        if (itemA.created_at && itemB.created_at) {
          return new Date(itemB.created_at) - new Date(itemA.created_at);
        }
      }
      return new Date(dateB) - new Date(dateA);
    } catch (e) { return 0; }
  }).forEach(key => {
    const item = document.createElement("div");
    item.className = "history-item";

    const firstEntry = grouped[key][0];
    const date = key.split("___")[0]; // Display Date
    const displayName = firstEntry.workout_name || availableWorkouts.find(w => w.id == firstEntry.workout)?.name || firstEntry.workout;

    // Calculate Stats
    let totalVol = 0;
    let totalSets = 0;
    let totalReps = 0;
    let cardioDur = 0;
    let cardioKcal = 0;

    // FIX: use grouped[key] here instead of grouped[date] which was causing the bug
    grouped[key].forEach(l => {
      if (l.duration || l.calories) {
        cardioDur += Number(l.duration || 0);
        cardioKcal += Number(l.calories || 0);
      } else {
        totalVol += (Number(l.weight) || 0) * (Number(l.reps) || 0);
        totalSets++;
        totalReps += Number(l.reps) || 0;
      }
    });

    const avgRep = totalSets > 0 ? Math.round(totalReps / totalSets) : 0;
    // Create unique ID for toggling
    const contentId = `hist-content-${key.replace(/[^a-zA-Z0-9]/g, '')}`;

    item.innerHTML = `
            <div class="history-header" onclick="toggleHistory('${contentId}', this)">
                <div style="display:flex; gap:10px; align-items:center;">
                    <span class="history-toggle-icon collapsed-icon">▼</span>
                    <span>${date}</span>
                    <span style="color:var(--text-muted)">|</span>
                    <span>${displayName.toUpperCase()}</span>
                </div>
                <!-- Delete Button requires stopPropagation to not trigger collapse -->
                <button onclick="event.stopPropagation(); deleteLogSession('${date}')" style="width:auto; padding:2px 6px; font-size:0.6rem; color:var(--error-color); border-color:var(--error-color); background:rgba(255, 62, 62, 0.1);">LÖSCHEN</button>
            </div>
            <div class="history-stats">
                <span>VOL: ${totalVol.toLocaleString()} KG</span>
                <span>SÄTZE: ${totalSets}</span>
                <span>Ø WDH: ${avgRep}</span>
                ${cardioDur > 0 ? `<span>CARDIO: ${cardioDur} MIN | ${cardioKcal} KCAL</span>` : ''}
            </div>
            <div id="${contentId}" class="history-content collapsed">
                <div class="history-table-header">
                    <div style="width: 40%">UEBUNG</div>
                    <div style="width: 15%">SATZ</div>
                    <div style="width: 25%">LAST / MIN</div>
                    <div style="width: 20%; text-align:right;">WDH / KCAL</div>
                </div>
                ${grouped[key].map(l => `
                    <div class="history-row">
                        <div style="width: 40%">${l.exercise.toUpperCase()}</div>
                        <div style="width: 15%">${l.set}</div>
                        <div style="width: 25%">${l.duration ? l.duration + ' MIN' : l.weight + ' KG'}</div>
                        <div style="width: 20%; text-align:right;">${l.calories ? l.calories : l.reps}</div>
                    </div>
                `).join("")}
            </div>
        `;
    historyList.appendChild(item);
  });

  // Ensure safe-spacer at the end of History page
  const historySpacer = document.createElement("div");
  historySpacer.className = "safe-spacer";
  historyList.appendChild(historySpacer);
}

// ---------------- EXPORT ----------------
document.getElementById("load-all-logs-btn")?.addEventListener("click", async () => {
  await loadLogs(true);
  renderHistory();
});

document.getElementById("export-csv-btn").addEventListener("click", () => {
  if (logs.length === 0) return notify("KEINE_DATEN_ZUR_EXTRAKTION", "error");

  const header = ["DATUM", "PLAN", "UEBUNG", "SATZ", "GEWICHT_KG", "WDH", "DAUER_MIN", "KCAL"];
  const rows = logs.map(l => {
    const displayName = l.workout_name || availableWorkouts.find(w => w.id == l.workout)?.name || l.workout;
    return [
      l.date,
      displayName.toUpperCase(),
      l.exercise.toUpperCase(),
      l.set,
      l.weight || 0,
      l.reps || 0,
      l.duration || "",
      l.calories || ""
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [header.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `WEYLAND_YUTANI_LOG_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notify("EXTRAKTION_ERFOLGREICH");
});

window.deleteLogSession = async (date) => {
  if (!confirm(`PROTOKOLL VOM ${date} WIRKLICH LÖSCHEN?`)) return;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return notify("FEHLER: NICHT ANGEMELDET", "error");

  console.log(`Attempting to delete logs for user ${user.id} on date ${date}...`);

  const { error } = await client.from("logs").delete().eq("user_id", user.id).eq("date", date);

  if (error) {
    console.error("Delete Error:", error);
    notify(`LÖSCH-FEHLER: ${error.message} (${error.code})`, "error");
    alert(`DEBUG INFO:\nMessage: ${error.message}\nCode: ${error.code}\nHint: ${error.hint}`);
  } else {
    notify("EINTRAEGE DAUERHAFT GELÖSCHT");
    await loadLogs();
  }
};



// Toggle History Content
window.toggleHistory = (id, headerElement) => {
  const content = document.getElementById(id);
  const icon = headerElement.querySelector(".history-toggle-icon");

  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed");
    icon.classList.remove("collapsed-icon");
  } else {
    content.classList.add("collapsed");
    icon.classList.add("collapsed-icon");
  }
};

handleAuthState();


