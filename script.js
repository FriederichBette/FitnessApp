// ---- MU-TH-UR 6.0 SYSTEM ----
console.log("APP VERSION: 2.9.0 (BRIDGE) - ACTIVATED");

// --- SESSION STATE TRACKING ---
let _activeWorkoutLoaded = false; // True when a workout is currently being displayed/trained
let _currentSessionId = null; // Unique ID for the current workout session
let _currentWorkoutId = null; // The workout ID of the active session (independent of dropdown)
let _currentWorkoutName = null; // Display name of the active workout
let _currentRoutineName = null; // Display name of the active routine
window.onerror = function (msg, url, line, col, error) {
  alert("FATAL_ERROR: " + msg + "\nLINE: " + line + "\nURL: " + url);
  return false;
};
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
  penguin.innerHTML = `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="width:100%; height:100%;">
         <!-- Body -->
         <rect x="4" y="2" width="8" height="12" fill="var(--primary-color)" />
         <rect x="3" y="4" width="1" height="8" fill="var(--primary-color)" />
         <rect x="12" y="4" width="1" height="8" fill="var(--primary-color)" />
         <!-- Belly -->
         <rect x="5" y="5" width="6" height="8" fill="#000" opacity="0.8" />
         <!-- Eyes -->
         <rect id="p-eye-l" x="5" y="4" width="1" height="1" fill="#000" />
         <rect id="p-eye-r" x="9" y="4" width="1" height="1" fill="#000" />
         <!-- Beak -->
         <rect x="7" y="5" width="2" height="1" fill="var(--secondary-color)" />
         <rect x="8" y="6" width="1" height="1" fill="var(--secondary-color)" />
         <!-- Feet -->
         <rect x="4" y="14" width="3" height="1" fill="var(--secondary-color)" />
         <rect x="9" y="14" width="3" height="1" fill="var(--secondary-color)" />
         <!-- Flippers -->
         <rect x="2" y="6" width="1" height="4" fill="var(--primary-color)" />
         <rect x="13" y="6" width="1" height="4" fill="var(--primary-color)" />
      </svg>
      <div class="penguin-bubble" id="penguin-bubble" style="display:none;"></div>
  `;
  document.body.appendChild(penguin);

  // Blinking
  setInterval(() => {
    const l = document.getElementById("p-eye-l");
    const r = document.getElementById("p-eye-r");
    if (l && r) {
      l.style.opacity = "0"; r.style.opacity = "0";
      setTimeout(() => { l.style.opacity = "1"; r.style.opacity = "1"; }, 200);
    }
  }, 4000);

  // --- CUSTOM PENGUIN MESSAGES ---
  const allMessages = [
    // Teil A: Schelte
    "Erbärmliches Gewatschel.",
    "Peinlich für uns.",
    "Lachnummer auf Eis.",
    "Gott, wie lahm.",
    "Bürzel hoch, Loser!",
    "Echt jetzt, Kevin?",
    // Teil B: Wasser-Befehl
    "Sauf, du Trockenfisch!",
    "Dein Hirn staubt.",
    "Trink, du Wüstenratte!",
    "Wasser rein, Klops!",
    "Hydrieren oder krepieren.",
    "Schütt Wasser nach!",
    // Teil C: Gnädiger Abschluss
    "Kriegst 'n Keks.",
    "Bist mein Projekt.",
    "Irgendwie süß, leider.",
    "Darfst weiteratmen.",
    "Hübsch bist du.",
    "Bin fast stolz."
  ];

  // Seed-based shuffle (unique per user per day)
  const seed = (localStorage.getItem("penguin_seed") || (() => {
    const s = Math.floor(Math.random() * 99999).toString();
    localStorage.setItem("penguin_seed", s);
    return s;
  })());
  const daySeed = new Date().getDate() + parseInt(seed);
  const idleMessages = [...allMessages].sort((a, b) => {
    const ha = (a.charCodeAt(0) * 31 + daySeed) % 100;
    const hb = (b.charCodeAt(0) * 31 + daySeed) % 100;
    return ha - hb;
  });

  // Click to Talk
  penguin.addEventListener("click", () => {
    const msg = idleMessages[Math.floor(Math.random() * idleMessages.length)];
    showPenguinBubble(msg);
    const anims = ["wiggle", "spin", "slide", "happyDance", "moonwalk", "flip", "flex"];
    window.triggerPenguinAnim(anims[Math.floor(Math.random() * anims.length)]);
  });

  // --- AUTO-TALK (every 25-45s during active workout) ---
  setInterval(() => {
    if (!_activeWorkoutLoaded) return;
    if (Math.random() > 0.5) return;
    const msg = idleMessages[Math.floor(Math.random() * idleMessages.length)];
    showPenguinBubble(msg);
    const smallAnims = ["wiggle", "flex"];
    window.triggerPenguinAnim(smallAnims[Math.floor(Math.random() * smallAnims.length)]);
  }, 30000 + Math.random() * 15000);

  // Animation Trigger
  window.triggerPenguinAnim = (type, forcedMsg = null) => {
    const penguin = document.getElementById("pixel-penguin");
    if (!penguin) return;

    penguin.style.animation = "none";
    penguin.offsetHeight;

    let duration = 500;
    if (type === "moonwalk") duration = 1500;
    if (type === "flip") duration = 800;

    penguin.style.animation = `${type} ${duration}ms ease-out`;

    const msgs = {
      happyDance: ["GEHT DOCH.", "ENDLICH.", "OK."],
      flip: ["DRAMA.", "UNNÖTIG.", "WIESO."],
      moonwalk: ["FOKUS.", "ABLENKUNG.", "HEY."],
      flex: ["SPIEGEL.", "JA JA.", "WEITER."]
    };

    if (forcedMsg) {
      showPenguinBubble(forcedMsg);
    } else if (msgs[type]) {
      const msg = msgs[type][Math.floor(Math.random() * msgs[type].length)];
      showPenguinBubble(msg);
    }

    setTimeout(() => {
      penguin.style.animation = "idleBounce 3s infinite ease-in-out";
    }, duration);
  };

  // VICTORY DANCE
  window.penguinDance = () => {
    window.triggerPenguinAnim("happyDance", "FERTIG.");
    setTimeout(() => window.triggerPenguinAnim("flip"), 2000);
  };
}

// Global showPenguinBubble
function showPenguinBubble(text) {
  const bubble = document.getElementById("penguin-bubble");
  if (!bubble) return;
  bubble.textContent = text;
  bubble.style.display = "block";
  if (window.bubbleTimeout) clearTimeout(window.bubbleTimeout);
  window.bubbleTimeout = setTimeout(() => {
    bubble.style.display = "none";
  }, 3000);
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
    // Show Landing Hero first on Logout / Init
    authOverlay.style.display = "flex";
    mainApp.style.display = "none";
    showLandingHero();
  }
}

// Landing / Auth Flow
const landingHero = document.getElementById("landing-hero");
const authCard = document.getElementById("auth-card");
const initSystemBtn = document.getElementById("init-system-btn");

function showLandingHero() {
  if (landingHero) landingHero.style.display = "flex";
  if (authCard) authCard.style.display = "none";
}

if (initSystemBtn) {
  initSystemBtn.addEventListener("click", () => {
    // Play cool sound effect if possible (later)
    landingHero.style.display = "none";
    authCard.style.display = "block";
  });
}

// Legal Modal
const legalModal = document.getElementById("legal-modal");
const openLegalBtn = document.getElementById("open-legal-modal");
const closeLegalBtn = document.getElementById("close-legal-modal");
const acceptLegalBtn = document.getElementById("accept-legal-btn");
const regConsent = document.getElementById("reg-consent");

if (openLegalBtn) {
  openLegalBtn.addEventListener("click", () => {
    legalModal.style.display = "flex";
  });
}

function closeLegal() {
  legalModal.style.display = "none";
}

if (closeLegalBtn) closeLegalBtn.addEventListener("click", closeLegal);

if (acceptLegalBtn) {
  acceptLegalBtn.addEventListener("click", () => {
    if (regConsent) regConsent.checked = true;
    closeLegal();
  });
}

client.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    const newPw = prompt("NEUES PASSWORT EINGEBEN:");
    if (newPw) {
      const { error } = await client.auth.updateUser({ password: newPw });
      if (!error) notify("PASSWORT ERFOLGREICH GEÄNDERT");
      else notify("FEHLER BEIM ÄNDERN: " + error.message, "error");
    }
  }

  // Prevent re-init on token refresh (Avoids UI reset on screen off/on)
  if (event === "TOKEN_REFRESHED") return;

  handleAuthState();
});

// Auth Listeners
document.getElementById("login-btn").addEventListener("click", async (e) => {
  const btn = e.target;
  if (btn.disabled) return;

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  btn.disabled = true;
  btn.textContent = "VERIFIZIERE...";

  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) notify("ZUGRIFF VERWEIGERT: " + error.message, "error");
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "ACCESS_TERMINAL";
    }, 500);
  }
});

document.getElementById("forgot-password-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const link = e.target;
  if (link.style.pointerEvents === "none") return;

  const email = document.getElementById("email").value;
  if (!email) return notify("BITTE EMAIL EINGEBEN", "error");

  link.style.pointerEvents = "none";
  link.textContent = "SENDE...";

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href, // Redirect back here
  });

  if (error) notify("FEHLER: " + error.message, "error");
  else notify(`RESET-LINK AN ${email} GESENDET`);

  setTimeout(() => {
    link.style.pointerEvents = "auto";
    link.textContent = "CODE VERGESSEN?";
  }, 2000);
});

document.getElementById("register-btn").addEventListener("click", async (e) => {
  const btn = e.target;
  if (btn.disabled) return;

  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const consent = document.getElementById("reg-consent").checked;

  if (!consent) return notify("PROTOKOLL NICHT AKZEPTIERT", "error");

  btn.disabled = true;
  btn.textContent = "REGISTRIERE...";

  try {
    const { error } = await client.auth.signUp({ email, password });
    if (error) notify("FEHLER: " + error.message, "error");
    else notify("REGISTRIERUNG ERFOLGREICH");
  } finally {
    btn.disabled = false;
    btn.textContent = "REGISTER_PERSONNEL";
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  document.body.classList.add("crt-off");
  setTimeout(async () => {
    // Reset session state on logout
    _activeWorkoutLoaded = false;
    _currentSessionId = null;
    _currentWorkoutId = null;
    _currentWorkoutName = null;
    _currentRoutineName = null;
    await client.auth.signOut();
    document.body.classList.remove("crt-off");
    showLandingHero(); // Ensure we go back to hero
  }, 600);
});

// UI Toggles
document.getElementById("show-register").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("auth-title").textContent = "NEW_ENTRY";
});

document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "none";
  document.getElementById("auth-title").textContent = "PERSONNEL_LOGIN";
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
            <div style="display:flex; align-items:center; gap:10px; cursor:pointer; flex: 1; min-width: 0;" onclick="toggleHistory('${contentId}', this)">
                 <span class="history-toggle-icon collapsed-icon" style="flex-shrink: 0;">▼</span>
                 <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${routine}</span>
            </div>
            <button class="secondary" style="width: auto; padding: 4px 8px; font-size: 0.6rem; flex-shrink: 0; margin-left: 10px;" onclick="copyWholeRoutine('${routine}')">ROUTINE KOPIEREN</button>
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
            <div style="display:flex; align-items:center; gap:10px; cursor:pointer; flex: 1; min-width: 0;" onclick="toggleHistory('${contentId}', this)">
                 <span class="history-toggle-icon collapsed-icon" style="flex-shrink: 0;">▼</span>
                 <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${routine}</span>
            </div>
            <button onclick="deleteRoutine('${routine}')" style="width: auto; padding: 4px 8px; font-size: 0.6rem; color: var(--error-color); border-color: var(--error-color); flex-shrink: 0; margin-left: 10px;">LÖSCHEN</button>
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
      weight: s.weight || 0,
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
        weight: s.weight || 0,
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
  div.style.cssText = "display: grid; grid-template-columns: 2fr 0.8fr 0.8fr 0.8fr 1fr 40px; gap: 5px; align-items: center; margin-bottom: 10px;";
  const isCardio = data.is_cardio || false;
  div.innerHTML = `
        <input type="text" placeholder="ÜBUNG" class="edit-name" value="${data.exercise}" style="margin:0;">
        <input type="number" placeholder="${isCardio ? 'DAUER' : 'SÄTZE'}" title="${isCardio ? 'MINUTEN' : 'SÄTZE'}" class="edit-sets" value="${data.sets}" style="margin:0;">
        <input type="number" placeholder="${isCardio ? 'KCAL' : 'WDH'}" title="${isCardio ? 'KCAL' : 'WDH'}" class="edit-reps" value="${data.reps || data.reps_max || ""}" style="margin:0;">
        <input type="number" placeholder="KG" class="edit-weight" value="${data.weight || ""}" style="margin:0;">
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
  div.style.cssText = "display: grid; grid-template-columns: 2fr 0.8fr 0.8fr 0.8fr 1fr 40px; gap: 5px; align-items: center; margin-bottom: 10px;";
  div.innerHTML = `
        <input type="text" placeholder="ÜBUNG" class="edit-name" style="margin:0;">
        <input type="number" placeholder="SÄTZE" class="edit-sets" style="margin:0;">
        <input type="number" placeholder="WDH" class="edit-reps" style="margin:0;">
        <input type="number" placeholder="KG" class="edit-weight" style="margin:0;">
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
        weight: Number(row.querySelector(".edit-weight").value) || 0,
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

// --- CLOUD SYNC LOGIC ---
let cloudSyncTimeout = null;

async function syncDraftToCloud(draftData, immediate = false) {
  if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);

  updateSyncIndicator("SYNCING...", "var(--secondary-color)");

  const doSync = async () => {
    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const { error } = await client.from("active_sessions").upsert({
        user_id: user.id,
        session_data: draftData,
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.warn("CLOUD_SYNC_ERROR:", error.message);
        updateSyncIndicator("SYNC ERROR", "var(--error-color)");
      } else {
        console.log("CLOUD_SYNC_SUCCESS");
        updateSyncIndicator("CLOUD: OK", "var(--primary-color)");
      }
    } catch (err) {
      console.warn("CLOUD_SYNC_FAILED", err);
      updateSyncIndicator("OFFLINE", "var(--text-muted)");
    }
  };

  if (immediate) {
    // No debounce - sync right now (used when screen is about to lock)
    await doSync();
  } else {
    // Debounce: Wait 1 second of inactivity before pushing to cloud
    cloudSyncTimeout = setTimeout(doSync, 1000);
  }
}

function updateSyncIndicator(text, color) {
  const el = document.getElementById("sync-indicator");
  if (el) {
    el.textContent = text;
    el.style.color = color;
  }
}

async function init() {
  // GUARD: If a workout is actively loaded, do NOT re-init (prevents screen-lock restart)
  if (_activeWorkoutLoaded) {
    console.log("INIT SKIPPED: Active workout session detected");
    return;
  }

  mainLoader.style.display = "block";
  contentArea.innerHTML = "";
  const actionEl = document.getElementById("workout-actions");
  if (actionEl) actionEl.style.display = "none";

  try {
    // Attempt to load data, but don't block start if offline (draft might save us)
    try {
      await Promise.all([loadWorkouts(), loadPlan(), loadLogs()]);
    } catch (loadErr) {
      console.warn("SERVER CONNECTION FAILED - OFFLINE MODE INTIATED", loadErr);
      notify("OFFLINE-MODUS: SERVER NICHT ERREICHBAR", "error");
    }

    populateRoutineSelect();

    // 1. Try Local Draft
    let savedDraft = JSON.parse(localStorage.getItem("workout_draft"));

    // 2. Try Cloud Draft if Local is empty or older
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      try {
        const { data: cloudSession } = await client.from("active_sessions").select("*").eq("user_id", user.id).single();
        if (cloudSession && cloudSession.session_data) {
          const cloudDraft = cloudSession.session_data;
          if (!savedDraft || (cloudDraft.lastModified > savedDraft.lastModified)) {
            console.log("USING CLOUD SESSION (FEWER DATA LOSS RISKS)");
            savedDraft = cloudDraft;
            // Sync back to local for offline consistency
            localStorage.setItem("workout_draft", JSON.stringify(savedDraft));
          }
        }
      } catch (cloudErr) {
        console.warn("Cloud session check failed (offline?)", cloudErr);
      }
    }

    // Check for Resume
    const resumePrompt = document.getElementById("resume-prompt-container");
    if (savedDraft && savedDraft.workout) {
      if (resumePrompt) resumePrompt.style.display = "block";

      // Show session info in prompt
      const resumeInfo = document.getElementById("resume-info");
      if (resumeInfo) {
        const savedDate = savedDraft.lastModified ? new Date(savedDraft.lastModified).toLocaleString("de-DE") : "unbekannt";
        resumeInfo.textContent = `${savedDraft.workoutName || "TRAINING"} (${savedDraft.routineName || ""}) - Zuletzt: ${savedDate}`;
      }

      // Global reference for resume buttons
      window._pendingDraft = savedDraft;
    } else {
      if (resumePrompt) resumePrompt.style.display = "none";
    }

    // Normal Flow Setup (Suggestion)
    if (logs.length > 0) {
      const lastW = availableWorkouts.find(w => w.id == logs[0].workout);
      if (lastW) routineSelect.value = lastW.routine_name;
    }
    populateWorkoutSelect();
    suggestNextWorkout();

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

async function loadWorkout(draftData = null) {
  // FIX: When resuming, use the workout ID from the draft (not the dropdown which may be wrong)
  const workoutId = (draftData && draftData.workout) ? draftData.workout : workoutSelect.value;
  if (!workoutId) return;

  // Store workout identity INTERNALLY (saveDraft reads these, NOT the dropdown)
  _currentWorkoutId = workoutId;
  const wObj = availableWorkouts.find(w => w.id == workoutId);
  _currentWorkoutName = (draftData && draftData.workoutName) ? draftData.workoutName : (wObj ? wObj.name : "TRAINING");
  _currentRoutineName = (draftData && draftData.routineName) ? draftData.routineName : (wObj ? wObj.routine_name : "ROUTINE");

  // Generate or restore session ID for this workout session
  _currentSessionId = (draftData && draftData.sessionId) ? draftData.sessionId : crypto.randomUUID();
  console.log("SESSION ID:", _currentSessionId, "WORKOUT:", _currentWorkoutId);

  const draftEntries = draftData ? draftData.entries : null;

  // Safety: Reload plan if empty (can happen on refresh/auth race condition)
  if (!plan || plan.length === 0) {
    await loadPlan();
  }



  contentArea.innerHTML = "";
  // Dynamische Navigation: IMMER ANZEIGEN (USER REQUEST)
  document.querySelector(".bottom-nav").style.display = "flex";
  document.querySelector(".selection-area").style.display = "none";
  document.getElementById("next-workout-hint").style.display = "none";

  const actionEl = document.getElementById("workout-actions");
  if (actionEl) actionEl.style.display = "flex";
  saveBtn.disabled = false;

  // Ensure type safety (ID comparison)
  const exercisesInWorkout = plan.filter(p => p.workout_id == workoutId);

  if (exercisesInWorkout.length === 0) {
    // 1. Try Draft Snapshot (Offline Support)
    if (draftData && draftData.snapshot && draftData.snapshot.length > 0) {
      // Reconstruct from Snapshot
      exercisesInWorkout.push(...draftData.snapshot.map(s => ({
        workout_id: workoutId,
        exercise: s.originalName, // Important: Use original name for ID
        sets: s.sets,
        reps: s.reps || 0,
        weight: 0,
        rest_time: s.rest_time || 60,
        is_cardio: s.is_cardio,
        is_dynamic: s.is_dynamic,
        // We pass the display name via renames or just trust the render logic which handles renames separately
      })));
    } else {
      // 2. Fallback: Try to fetch specifically for this ID if local plan is incomplete (Online Fetch)
      const { data: specificExercises } = await client.from("workout_exercises").select("*").eq("workout_id", workoutId);

      if (specificExercises && specificExercises.length > 0) {
        exercisesInWorkout.push(...specificExercises);
      }
    }

    // Final Check
    if (exercisesInWorkout.length === 0) {
      contentArea.innerHTML = `
        <div style="text-align:center; margin-top: 50px;">
            <div class="crt-text" style="color:red; margin-bottom: 20px;">SYSTEM FEHLER: LEERER PLAN</div>
            <p style="font-size: 0.8rem; margin-bottom: 20px;">Dieser Plan enthält keine Übungen und konnte nicht wiederhergestellt werden.</p>
            <button onclick="window.location.reload()" class="secondary">NEU LADEN</button>
        </div>
      `;
      // Reset UI to allow navigation
      document.querySelector(".bottom-nav").style.display = "flex";
      document.querySelector(".selection-area").style.display = "block";
      document.getElementById("workout-actions").style.display = "none";
      return;
    }
  }

  // --- PROGRESSIVE OVERLOAD FIX ---
  // Fetch last logs specifically for these exercises to ensure we show history
  const renames = draftData?.renames || {};
  const namesToFetch = new Set();
  exercisesInWorkout.forEach(e => {
    namesToFetch.add(e.exercise);
    if (e.originalName) namesToFetch.add(e.originalName);
    if (renames[e.originalName]) namesToFetch.add(renames[e.originalName]);
  });

  const uniqueNames = [...namesToFetch];

  if (uniqueNames.length > 0) {
    const { data: historyData } = await client
      .from("logs")
      .select("*")
      .in("exercise", uniqueNames)
      .eq("user_id", (await client.auth.getUser()).data.user.id)
      .order("date", { ascending: false })
      .limit(300);

    if (historyData) {
      historyData.forEach(hLog => {
        if (!logs.find(existing => existing.id === hLog.id)) {
          logs.push(hLog);
        }
      });
      // Global sort for getLastExerciseLogs to work
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  // --- RESTORE DRAFT STATE ---
  const customExercises = draftData?.customExercises || [];

  // Merge Custom Exercises from Draft into the plan to be rendered
  const combinedPlan = [...exercisesInWorkout];

  if (customExercises.length > 0) {
    customExercises.forEach(c => {
      combinedPlan.push({
        exercise: c.name, // This is the preserved name
        originalName: c.originalName || c.name,
        sets: c.sets,
        reps: 0, // Mock
        weight: 0,
        rest_time: c.rest_time || 60,
        is_cardio: c.is_cardio,
        is_dynamic: true
      });
    });
  }

  try {
    combinedPlan.forEach((ex) => {
      // Determine Display Name and Original Name
      const originalName = ex.originalName || ex.exercise;
      let displayName = ex.exercise;

      // Apply Renames if applicable
      if (!ex.is_dynamic && renames[originalName]) {
        displayName = renames[originalName];
      }
      // If dynamic, ex.exercise is already the current name from draft (c.name)

      if (!originalName) return;

      const card = document.createElement("div");
      card.className = "exercise-card";
      card.dataset.originalName = originalName;
      if (ex.is_dynamic) card.dataset.isDynamic = "true";

      // Using displayName for matching logs and saving entries
      const effectiveName = displayName; // This is what we use for data-ex
      card.dataset.exerciseName = effectiveName;

      const lastLogs = getLastExerciseLogs(effectiveName, workoutId);

      // Header with Edit Toggle
      const headerRow = document.createElement("div");
      headerRow.style.display = "flex";
      headerRow.style.justifyContent = "space-between";
      headerRow.style.alignItems = "center";

      // Title Input
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.className = "ex-title-edit";
      titleInput.value = displayName.toUpperCase();
      titleInput.style.cssText = "font-weight:bold; color:var(--primary-color); background:transparent; border:none; width:70%; font-size:1rem;";
      // When renaming, we update the UI logic
      titleInput.onchange = (e) => updateExerciseName(e.target, originalName);

      // Control Group (Cardio Toggle + Edit Btn)
      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.gap = "8px";
      controls.style.alignItems = "center";

      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.textContent = "BEARBEITEN";
      editBtn.className = "secondary";
      editBtn.style.padding = "2px 6px";
      editBtn.style.fontSize = "0.6rem";
      editBtn.style.fontWeight = "bold";
      editBtn.style.letterSpacing = "1px";
      editBtn.onclick = () => toggleEditMode(card);

      controls.appendChild(editBtn);
      headerRow.appendChild(titleInput);
      headerRow.appendChild(controls);
      card.appendChild(headerRow);

      // Info Row
      const infoRow = document.createElement("div");
      infoRow.className = "exercise-info";
      infoRow.innerHTML = ex.is_dynamic ? "ZUSATZ-ÜBUNG" : `ZIEL: ${ex.sets} SÄTZE | ${ex.is_cardio ? 'DAUER' : 'WDH'}: ${ex.is_cardio ? (ex.reps || "0") + " KCAL" : (ex.reps || "--")}`;
      card.appendChild(infoRow);

      const logRow = document.createElement("div");
      logRow.className = "last-logs";
      logRow.textContent = `ZULETZT: ${lastLogs}`;
      card.appendChild(logRow);

      // Sets Container
      const setsWrapper = document.createElement("div");
      setsWrapper.className = "sets-wrapper";

      // Render Sets (Use Draft count if available, else Plan count)
      // For dynamic exercises, plan count comes from customExercises (saved state)
      // For regular, use plan count (ex.sets)
      const targetSets = ex.sets;

      // Check if we have MORE sets in draft entries than plan?
      // Only if we want to restore added sets.
      // Easiest is to scan draftEntries for max set number for this exercise.
      let maxSetMap = 0;
      if (draftEntries) {
        const related = draftEntries.filter(d => d.ex.toUpperCase() === effectiveName.toUpperCase());
        if (related.length > 0) {
          maxSetMap = Math.max(...related.map(r => r.set));
        }
      }
      const setsToRender = Math.max(targetSets, maxSetMap);

      for (let i = 1; i <= setsToRender; i++) {
        // FIX: Case-insensitive matching for draft entries
        const draft = draftEntries?.find(d =>
          d.ex.toUpperCase() === effectiveName.toUpperCase() && d.set === i
        );
        // Use Draft weight OR Template weight OR empty
        let defWeight = "";
        let defReps = "";

        if (draft) {
          defWeight = draft.weight;
          defReps = draft.reps;
        } else if (lastLogs === "KEINE DATEN" && ex.weight && !ex.is_dynamic) {
          // Only autofill target weight if no history and not dynamic
          defWeight = ex.weight;
        }

        const setRow = createSetRow(i, effectiveName, ex.is_cardio, defWeight, defReps, draft?.rest || ex.rest_time || 60);
        setsWrapper.appendChild(setRow);
      }
      card.appendChild(setsWrapper);

      // ADD SET BUTTON (Hidden by default)
      const addSetBtn = document.createElement("button");
      addSetBtn.className = "secondary edit-only";
      addSetBtn.innerText = "+ SATZ";
      addSetBtn.style.cssText = "display:none; width:100%; margin-top:10px; border-style:dashed;";
      addSetBtn.onclick = () => {
        const currentSets = setsWrapper.children.length;
        const newRow = createSetRow(currentSets + 1, titleInput.value.trim(), ex.is_cardio, "", "", ex.rest_time || 60);
        setsWrapper.appendChild(newRow);
        // Re-attach listeners for the new row
        attachInputListeners(newRow);
      };
      card.appendChild(addSetBtn);

      contentArea.appendChild(card);
    });

    // --- MINI OVERVIEW PANEL (shows all exercises at a glance) ---
    const overviewPanel = document.createElement("div");
    overviewPanel.className = "workout-overview";
    overviewPanel.id = "workout-overview-panel";

    const overviewHeader = document.createElement("div");
    overviewHeader.className = "workout-overview-header";
    overviewHeader.innerHTML = `<span>PROTOKOLL</span><span class="workout-overview-status">[AKTIV]</span>`;
    overviewPanel.appendChild(overviewHeader);

    const overviewList = document.createElement("div");
    overviewList.className = "workout-overview-list";

    // Add each exercise as a clickable mini-button
    const allCards = contentArea.querySelectorAll(".exercise-card");
    allCards.forEach((card, idx) => {
      const name = card.dataset.exerciseName || card.dataset.originalName || `EX${idx + 1}`;

      const item = document.createElement("button");
      item.className = "workout-overview-item";
      item.textContent = name.toUpperCase();
      item.title = name;
      item.onclick = () => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        // Brief highlight
        card.style.borderColor = "var(--primary-color)";
        setTimeout(() => { card.style.borderColor = ""; }, 1500);
      };
      overviewList.appendChild(item);
    });

    overviewPanel.appendChild(overviewList);
    // Insert at TOP of content area
    contentArea.insertBefore(overviewPanel, contentArea.firstChild);

    // --- BUTTON: ADD DYNAMIC EXERCISE ---
    const addExContainer = document.createElement("div");
    addExContainer.style.textAlign = "center";
    addExContainer.style.marginTop = "20px";

    const addExBtn = document.createElement("button");
    addExBtn.textContent = "+ WEITERE ÜBUNG";
    addExBtn.className = "secondary";
    addExBtn.onclick = () => {
      const exName = prompt("NAME DER ÜBUNG:", "");
      if (!exName || exName.trim().length === 0) return;

      // Default to KRAFT, user can toggle on card
      let isCardio = false;

      const mockEx = {
        exercise: exName.trim(),
        sets: 3,
        reps: 10,
        weight: 0,
        rest_time: 60,
        is_cardio: false
      };

      const card = document.createElement("div");
      card.className = "exercise-card";
      card.dataset.isDynamic = "true";
      card.dataset.originalName = mockEx.exercise;

      // Header
      const headerRow = document.createElement("div");
      headerRow.style.display = "flex";
      headerRow.style.justifyContent = "space-between";
      headerRow.style.alignItems = "center";

      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.className = "ex-title-edit";
      titleInput.value = mockEx.exercise.toUpperCase();
      titleInput.style.cssText = "font-weight:bold; color:var(--primary-color); background:transparent; border:none; width:55%; font-size:1rem;";
      titleInput.onchange = (e) => updateExerciseName(e.target, mockEx.exercise);

      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.gap = "6px";
      controls.style.alignItems = "center";

      // CARDIO TOGGLE BUTTON
      const cardioToggle = document.createElement("button");
      cardioToggle.className = "secondary";
      cardioToggle.textContent = "KRAFT";
      cardioToggle.style.cssText = "padding:2px 6px; font-size:0.55rem; font-weight:bold; letter-spacing:1px; width:auto; min-height:0;";
      cardioToggle.onclick = () => {
        isCardio = !isCardio;
        cardioToggle.textContent = isCardio ? "CARDIO" : "KRAFT";
        cardioToggle.style.borderColor = isCardio ? "var(--cyan)" : "";
        cardioToggle.style.color = isCardio ? "var(--cyan)" : "";
        card.dataset.isCardio = isCardio;
        // Rebuild sets with correct fields
        setsWrapper.innerHTML = "";
        for (let i = 1; i <= 3; i++) {
          setsWrapper.appendChild(createSetRow(i, titleInput.value.trim(), isCardio, "", "", 60));
        }
        attachInputListeners(card);
        saveDraft();
      };
      controls.appendChild(cardioToggle);

      const editBtn = document.createElement("button");
      editBtn.textContent = "BEARBEITEN";
      editBtn.className = "secondary";
      editBtn.style.padding = "2px 6px";
      editBtn.style.fontSize = "0.6rem";
      editBtn.style.fontWeight = "bold";
      editBtn.style.letterSpacing = "1px";
      editBtn.onclick = () => toggleEditMode(card);
      controls.appendChild(editBtn);
      headerRow.appendChild(titleInput);
      headerRow.appendChild(controls);
      card.appendChild(headerRow);

      const infoRow = document.createElement("div");
      infoRow.className = "exercise-info";
      infoRow.innerHTML = "ZUSATZ-ÜBUNG";
      card.appendChild(infoRow);

      const logRow = document.createElement("div");
      logRow.className = "last-logs";
      logRow.textContent = `ZULETZT: ${getLastExerciseLogs(mockEx.exercise, null)}`;
      card.appendChild(logRow);

      const setsWrapper = document.createElement("div");
      setsWrapper.className = "sets-wrapper";

      for (let i = 1; i <= 3; i++) {
        setsWrapper.appendChild(createSetRow(i, mockEx.exercise, isCardio, "", "", 60));
      }
      card.appendChild(setsWrapper);

      const addSetBtn = document.createElement("button");
      addSetBtn.className = "secondary edit-only";
      addSetBtn.innerText = "+ SATZ";
      addSetBtn.style.cssText = "display:none; width:100%; margin-top:10px; border-style:dashed;";
      addSetBtn.onclick = () => {
        const currentSets = setsWrapper.children.length;
        const newRow = createSetRow(currentSets + 1, titleInput.value.trim(), isCardio, "", "", 60);
        setsWrapper.appendChild(newRow);
        attachInputListeners(newRow);
      };
      card.appendChild(addSetBtn);

      contentArea.insertBefore(card, addExContainer);
      attachInputListeners(card);
      saveDraft();
    };
    addExContainer.appendChild(addExBtn);
    contentArea.appendChild(addExContainer);

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
      // Find sibling input for rest time
      const row = e.target.parentElement;
      const restInput = row.querySelector(".rest-edit");
      const customTime = restInput ? Number(restInput.value) : 60;

      const ex = e.target.dataset.ex;
      const set = e.target.dataset.set;
      startRestTimer(ex, set, customTime);
    });
  });

  updateVolume();

  // Restore Timer if draft exists
  if (draftData && draftData.startTime) {
    startTimer(false, draftData.startTime);
    notify("SESSION RESTORED (TIME SYNCED)");
  } else {
    startTimer(true);
  }

  // Mark that a workout is actively loaded (prevents init from re-running on screen wake)
  _activeWorkoutLoaded = true;
}

// --- HELPER FUNCTIONS FOR DYNAMIC UI ---

function toggleEditMode(card) {
  const isEdit = card.classList.toggle("edit-mode-active");
  // Toggle visibility of delete buttons and add set buttons
  card.querySelectorAll(".delete-set-btn").forEach(btn => {
    btn.style.display = isEdit ? "block" : "none";
  });
  card.querySelectorAll(".edit-only").forEach(el => {
    el.style.display = isEdit ? "block" : "none";
  });
}

function createSetRow(i, exName, isCardio, weight, reps, rest) {
  const container = document.createElement("div");
  container.className = "set-container";

  const row = document.createElement("div");
  row.className = "set-row"; // Critical for saver
  row.style.cssText = "display: flex; align-items: center; gap: 6px; margin-bottom: 8px;";

  // Determine Inputs based on Type
  let inputsHtml = "";
  if (isCardio) {
    inputsHtml = `
            <input type="number" placeholder="MIN" class="weight duration" data-ex="${exName}" data-set="${i}" data-iscardio="true" value="${weight}" style="width: 50px; margin: 0; padding: 4px;">
            <input type="number" placeholder="KCAL" class="reps calories" data-ex="${exName}" data-set="${i}" value="${reps}" style="width: 45px; margin: 0; padding: 4px;">
        `;
  } else {
    inputsHtml = `
            <input type="number" step="0.5" placeholder="KG" class="weight" data-ex="${exName}" data-set="${i}" value="${weight}" style="width: 50px; margin: 0; padding: 4px;">
            <input type="number" placeholder="WDH" class="reps" data-ex="${exName}" data-set="${i}" value="${reps}" style="width: 45px; margin: 0; padding: 4px;">
        `;
  }

  row.innerHTML = `
        <label style="min-width: 55px; font-size: 0.75rem;">SATZ_${i}</label>
        ${inputsHtml}
        <input type="number" class="rest-edit" value="${rest}" style="width: 35px; padding: 4px; font-size:0.65rem; color:var(--text-muted); border:1px solid var(--secondary-color);">
        <button class="start-rest-btn" data-ex="${exName}" data-set="${i}" style="width: auto; padding: 4px 6px; font-size: 0.65rem;">PAUSE</button>
        
        <!-- SAVE BUTTON (Text-Based) -->
        <button class="save-set-btn" onclick="saveSetManually(this)" style="width: auto; padding: 4px 6px; margin-left: 5px; border-color: var(--secondary-color); color: var(--secondary-color); font-size: 0.6rem; letter-spacing: 1px;" title="SPEICHERN">
            SAVE
        </button>

        <!-- Delete Button (Hidden by default) -->
        <button class="delete-set-btn" style="display:none; color:red; border:1px solid red; background:transparent; padding:2px 6px; font-size:0.7rem; margin-left:5px;">X</button>

        <div class="rest-zone" id="rest-${exName.replace(/\s+/g, '-')}-${i}" style="font-size: 0.6rem; color: var(--text-muted); display: none; overflow: hidden; text-overflow: ellipsis; width:100%;"></div>
    `;

  // Add Delete Logic
  row.querySelector(".delete-set-btn").onclick = () => {
    container.remove();
    saveDraft(); // Update state
    updateVolume();
  };

  container.appendChild(row);
  return container;
}

window.saveSetManually = (btn) => {
  // 1. Trigger Save (Local)
  saveDraft();

  // 2. Force Cloud Sync immediately (Bypass debounce)
  const savedData = JSON.parse(localStorage.getItem("workout_draft"));
  if (savedData) {
    if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
    syncDraftToCloud(savedData);
  }

  updateVolume();

  // Penguin Motivation
  const winAnims = ["flip", "flex", "happyDance"];
  window.triggerPenguinAnim(winAnims[Math.floor(Math.random() * winAnims.length)]);

  // 3. Visual Feedback
  const originalText = btn.innerHTML;
  btn.innerHTML = "OK";
  btn.style.borderColor = "var(--primary-color)";
  btn.style.color = "var(--primary-color)";
  btn.style.fontWeight = "bold";

  notify("DATENSATZ IN CLOUD GESICHERT");

  // 4. Reset Button after delay
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.borderColor = "var(--secondary-color)";
    btn.style.color = "var(--secondary-color)";
    btn.style.fontWeight = "normal";
    btn.style.boxShadow = "none";
  }, 2000);
};

function attachInputListeners(container) {
  container.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      saveDraft();
      updateVolume();

      // Easter Egg: Heavy Weights reaction
      if (input.classList.contains("weight") && Number(input.value) >= 100) {
        if (!input._highToneTriggered) {
          window.triggerPenguinAnim("flex", "KRANKER PUMP!");
          input._highToneTriggered = true;
          setTimeout(() => input._highToneTriggered = false, 10000);
        }
      }
    });

    // Random Penguin Cheer on Focus (Safari doesn't always trigger input on first tap)
    input.addEventListener("focus", () => {
      if (Math.random() > 0.8) {
        const moves = ["moonwalk", "flex", "flip"];
        window.triggerPenguinAnim(moves[Math.floor(Math.random() * moves.length)]);
      }
    });
  });
  container.querySelectorAll(".start-rest-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const row = e.target.parentElement;
      const restInput = row.querySelector(".rest-edit");
      const customTime = restInput ? Number(restInput.value) : 60;
      const ex = e.target.dataset.ex;
      const set = e.target.dataset.set;
      startRestTimer(ex, set, customTime);
    });
  });
}

// Function to update exercise names dynamically
window.updateExerciseName = (input, oldName) => {
  const newName = input.value.trim().toUpperCase();
  if (!newName) return;

  // Update all inputs in this card to use the new name for saving
  // 1. Find the card container
  // The Input is strictly inside the card
  const card = input.closest(".exercise-card");
  if (!card) return;

  // Update data-ex on all relevant elements
  card.querySelectorAll("[data-ex]").forEach(el => {
    el.dataset.ex = newName;
  });

  // Also update REST IDs if possible or just accept visual disconnect (minor)
  // Updating ID is tricky for running timers, but essential for save logic.
  // The "saveWorkout" uses dataset.ex, so that is covered.
  // The "startRestTimer" uses dataset.ex, so that works for NEW clicks.

  notify(`UMBENANNT: ${newName}`);

  // Refresh history for the renamed exercise
  const logRow = card.querySelector(".last-logs");
  if (logRow) {
    logRow.textContent = `ZULETZT: ${getLastExerciseLogs(newName, workoutSelect.value)}`;
  }

  saveDraft();
};

function startRestTimer(exName, setNum, customRest = null) {
  let duration = customRest || 60;

  // Trigger funny penguin animation
  if (window.triggerPenguinAnim) {
    const anims = ["moonwalk", "happyDance", "flex"];
    window.triggerPenguinAnim(anims[Math.floor(Math.random() * anims.length)]);
  }

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

  if (!zone) return;
  zone.style.display = "block";
  // Visual Reset
  zone.style.width = "100%";
  zone.style.background = "var(--text-muted)";

  // Clear any existing interval for this specific zone if we tracked it (simplified here)
  // Ideally use a map of intervals. For now, multiple clicks might race, but acceptable for prototype.

  const timer = setInterval(() => {
    millisLeft -= 100;
    const pct = Math.max(0, (millisLeft / total) * 100);
    const secondsLeft = Math.ceil(millisLeft / 1000);

    zone.style.background = `linear-gradient(90deg, var(--text-muted) ${pct}%, transparent ${pct}%)`;
    zone.style.color = "var(--bg-color)";
    zone.textContent = `PAUSE: ${secondsLeft}s`;

    if (millisLeft <= 0) {
      clearInterval(timer);
      zone.style.background = "var(--primary-color)";
      zone.style.color = "black";
      zone.textContent = "READY > GO!";
      // Play sound or vibration could go here
    }
  }, 100);
}

function getLastExerciseLogs(exerciseName, filterWorkoutId = null) {
  let filtered = logs.filter(l => l.exercise === exerciseName);

  // 1. Try to find logs for THIS specific plan (best match)
  let bestMatch = filterWorkoutId ? filtered.filter(l => l.workout === filterWorkoutId) : [];

  // 2. Fallback to any logs for this exercise if no specific plan logs exist
  let targetLogs = bestMatch.length > 0 ? bestMatch : filtered;

  if (targetLogs.length === 0) return "KEINE DATEN";

  const lastDate = targetLogs[0].date;
  // Convert YYYY-MM-DD to DD.MM
  const dateParts = lastDate.split("-");
  const shortDate = `${dateParts[2]}.${dateParts[1]}`;

  const lastSessionLogs = targetLogs.filter(l => l.date === lastDate).sort((a, b) => a.set - b.set);

  const setsStr = lastSessionLogs.map(l => {
    if (l.duration) return `${l.duration}m`; // Cardio
    return `${l.weight}x${l.reps}`;
  }).join(" | ");

  return `[${shortDate}]: ${setsStr}`;
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

function startTimer(reset = true, savedStartTime = null) {
  if (timerInterval) clearInterval(timerInterval);

  if (savedStartTime) {
    workoutStartTime = savedStartTime;
  } else if (reset) {
    workoutStartTime = Date.now();
  }
  // If neither (resume from pause without reload), keep existing workoutStartTime

  timerInterval = setInterval(() => {
    if (!workoutStartTime) return;
    const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    const el = document.getElementById("timer-val");
    if (el) el.textContent = `${m}:${s}`;
  }, 1000);
}

function saveDraft() {
  // GUARD: Do not save if there are no exercises (prevents overwriting draft on load/idle)
  const cards = document.querySelectorAll(".exercise-card");
  if (cards.length === 0) return;

  const entries = [];
  const renames = {};
  const customExercises = [];

  const snapshot = [];

  cards.forEach(card => {
    // 1. Capture Renames
    const titleInput = card.querySelector(".ex-title-edit");
    let currentName = "";
    let originalName = "";
    let isDynamic = false;
    let isCardio = false;

    if (titleInput) {
      currentName = titleInput.value.trim().toUpperCase();
      originalName = card.dataset.originalName;
      isDynamic = card.dataset.isDynamic === "true";

      const firstRowInput = card.querySelector(".set-row input.weight");
      isCardio = firstRowInput ? firstRowInput.dataset.iscardio === "true" : false;

      // Add to Snapshot (Structure)
      snapshot.push({
        originalName: originalName,
        displayName: currentName,
        sets: card.querySelectorAll(".set-row").length,
        is_dynamic: isDynamic,
        is_cardio: isCardio,
        rest_time: 60 // Default, can be refined if needed
      });

      if (isDynamic) {
        // Collect Custom Exercise Data to re-instantiate it
        customExercises.push({
          name: currentName, // Use current name as the key
          originalName: originalName,
          sets: card.querySelectorAll(".set-row").length,
          is_cardio: isCardio,
          rest_time: 60
        });
      } else {
        // Regular Plan Exercise - case-insensitive rename check
        // (titleInput is always UPPERCASED, originalName from plan may be mixed-case)
        if (originalName && currentName.toUpperCase() !== originalName.toUpperCase()) {
          renames[originalName] = currentName;
        }
      }
    }

    // 2. Capture Sets (Nested to ensure correct ordering 1..N)
    const rows = card.querySelectorAll(".set-row");
    if (rows.length > 0) {
      // Get current exercise name from the first input (most reliable after renames)
      const firstInput = rows[0].querySelector(".weight");
      const exName = firstInput ? firstInput.dataset.ex : card.dataset.exerciseName;

      rows.forEach((row, index) => {
        const w = row.querySelector(".weight");
        const r = row.querySelector(".reps");
        const restInput = row.querySelector(".rest-edit");
        if (w && r) {
          entries.push({
            ex: exName,
            set: index + 1, // Enforce sequential set numbers to avoid gaps
            weight: w.value,
            reps: r.value,
            isCardio: w.dataset.iscardio === "true",
            rest: restInput ? restInput.value : 60
          });
        }
      });
    }
  });

  // REMOVED OLD FLATTENED LOOP

  // FIX: Use internal state variables instead of dropdown (dropdown may be empty/wrong after resume)
  const workoutIdToSave = _currentWorkoutId || workoutSelect.value;
  const workoutNameToSave = _currentWorkoutName || (workoutSelect.selectedIndex >= 0 ? workoutSelect.options[workoutSelect.selectedIndex].text : "TRAINING");
  const routineNameToSave = _currentRoutineName || (routineSelect.selectedIndex >= 0 ? routineSelect.options[routineSelect.selectedIndex].text : "ROUTINE");

  // GUARD: Don't save draft without a valid workout ID
  if (!workoutIdToSave) {
    console.warn("SAVE_DRAFT SKIPPED: No workout ID");
    return;
  }

  const draftData = {
    workout: workoutIdToSave,
    workoutName: workoutNameToSave,
    routineName: routineNameToSave,
    entries,
    renames,
    customExercises,
    snapshot, // SAVES THE FULL STRUCTURE
    startTime: workoutStartTime,
    lastModified: Date.now(),
    sessionId: _currentSessionId // Persist session identity across saves
  };
  localStorage.setItem("workout_draft", JSON.stringify(draftData));
  console.log("DRAFT SAVED:", workoutIdToSave, "entries:", entries.length);

  // SYNC TO CLOUD (DEBOUNCED)
  syncDraftToCloud(draftData);
}

// Global Auto-Save on Visibility Change (Mobile Screen Off / Lock)
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "hidden") {
    // Screen is locking or app is going to background
    // ONLY save if a workout is actually active
    if (_activeWorkoutLoaded) {
      saveDraft();

      // CRITICAL: Force immediate cloud sync (bypass debounce!)
      const savedData = JSON.parse(localStorage.getItem("workout_draft"));
      if (savedData) {
        if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
        syncDraftToCloud(savedData, true);
      }
    }
  } else if (document.visibilityState === "visible") {
    // Screen is back on / app returned from background
    console.log("APP RETURNED FROM BACKGROUND. Active session:", _activeWorkoutLoaded);

    // Re-acquire Wake Lock if it was active
    if (wakeLockBtn && wakeLockBtn.textContent === "BILDSCHIRM: IMMER AN" && !wakeLock) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log("Wake Lock re-acquired");
      } catch (err) {
        console.log("Wake Lock re-acquire failed", err);
      }
    }

    // If a workout was active, just resume without re-initializing
    // The session stays exactly as the user left it
    if (_activeWorkoutLoaded) {
      console.log("SESSION STILL ACTIVE - no re-init needed");
      // Restart the timer display (interval was killed by browser)
      if (workoutStartTime) {
        startTimer(false, workoutStartTime);
      }
    }
  }
});

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

    // Reset session state
    _activeWorkoutLoaded = false;
    _currentSessionId = null;
    _currentWorkoutId = null;
    _currentWorkoutName = null;
    _currentRoutineName = null;
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (currentUser) {
      await client.from("active_sessions").delete().eq("user_id", currentUser.id);
    }

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
document.getElementById("abort-workout-btn").addEventListener("click", async () => {
  if (confirm("TRAINING WIRKLICH ABBRECHEN?")) {
    document.querySelector(".bottom-nav").style.display = "flex";
    document.querySelector(".selection-area").style.display = "block";
    document.getElementById("next-workout-hint").style.display = "block";
    document.getElementById("workout-actions").style.display = "none";
    contentArea.innerHTML = "";

    // Reset session state
    _activeWorkoutLoaded = false;
    _currentSessionId = null;
    _currentWorkoutId = null;
    _currentWorkoutName = null;
    _currentRoutineName = null;

    // Clear Local
    localStorage.removeItem("workout_draft");

    // Clear Cloud
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      await client.from("active_sessions").delete().eq("user_id", user.id);
    }

    init();
    showPage("home");
    notify("PROZESS_ABGEBROCHEN");
  }
});

// RESUME ACTIONS
document.getElementById("resume-yes-btn")?.addEventListener("click", async (e) => {
  const savedDraft = window._pendingDraft;
  if (!savedDraft) return;

  const btn = e.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "LADE...";

  try {
    // Offline fallback: If workout not found (because loadWorkouts failed), create a temporary "Ghost" workout
    let w = availableWorkouts.find(x => x.id === savedDraft.workout);
    if (!w) {
      w = {
        id: savedDraft.workout,
        name: savedDraft.workoutName || "WIEDERHERGESTELLT",
        routine_name: savedDraft.routineName || "LAUFEND",
        is_template: false
      };
      availableWorkouts.push(w);
      populateRoutineSelect();
    }

    // Set the dropdowns to match the saved session
    if (w.routine_name) routineSelect.value = w.routine_name;
    populateWorkoutSelect();
    workoutSelect.value = savedDraft.workout;

    // Hide Prompt
    document.getElementById("resume-prompt-container").style.display = "none";

    // Restore session ID so we continue the SAME session
    _currentSessionId = savedDraft.sessionId || crypto.randomUUID();
    console.log("RESUMING SESSION:", _currentSessionId);

    // loadWorkout will use savedDraft.workout as the ID (not dropdown)
    await loadWorkout(savedDraft);
    notify("SESSION WIEDERHERGESTELLT");
  } catch (err) {
    console.error(err);
    notify("FEHLER BEI WIEDERHERSTELLUNG", "error");
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

document.getElementById("resume-no-btn")?.addEventListener("click", async () => {
  if (!confirm("SESSION WIRKLICH LÖSCHEN?")) return;

  // Reset session state
  _activeWorkoutLoaded = false;
  _currentSessionId = null;
  _currentWorkoutId = null;
  _currentWorkoutName = null;
  _currentRoutineName = null;

  localStorage.removeItem("workout_draft");
  const { data: { user } } = await client.auth.getUser();
  if (user) {
    await client.from("active_sessions").delete().eq("user_id", user.id);
  }

  document.getElementById("resume-prompt-container").style.display = "none";
  notify("SESSION VERWORFEN");
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
    // document.querySelector(".bottom-nav").style.display = "none";
    btn.textContent = "TR. PAUSIEREN";
    btn.style.borderStyle = "solid";
    startTimer(false); // Don't reset start time
    notify("TRAINING FORTGESETZT");
  }
});

// Intermediate Save Button
document.getElementById("save-intermediate-btn")?.addEventListener("click", () => {
  saveDraft();
  // Bypass debounce for manual click
  const savedData = JSON.parse(localStorage.getItem("workout_draft"));
  if (savedData) {
    if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
    syncDraftToCloud(savedData);
  }

  const backAnims = ["moonwalk", "rave"];
  window.triggerPenguinAnim(backAnims[Math.floor(Math.random() * backAnims.length)]);

  notify("SESSION IN CLOUD GESICHERT");
  // Trigger small animation
  const btn = document.getElementById("save-intermediate-btn");
  btn.textContent = "GESPEICHERT!";
  setTimeout(() => btn.textContent = "ZWISCHENSPEICHERN", 1000);
});

// --- WAKE LOCK (SCREEN KEEP ALIVE) ---
let wakeLock = null;
const wakeLockBtn = document.getElementById("wake-lock-btn");

if (wakeLockBtn) {
  wakeLockBtn.addEventListener("click", toggleWakeLock);
}

async function toggleWakeLock() {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
    } catch (err) {
      console.error(err);
    }
    updateWakeLockUI(false);
    notify("BILDSCHIRM-SPERRE: AKTIV (NORMAL)");
  } else {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
        if (wakeLock !== null) {
          // It was released by system, but our state thinks it's on?
          // Usually we set wakeLock = null manually.
          // If system releases it (e.g. tab switch), we will re-acquire on visibility change.
        }
      });
      updateWakeLockUI(true);
      notify("BILDSCHIRM BLEIBT AN");
    } catch (err) {
      notify("FEHLER: " + err.message, "error");
      updateWakeLockUI(false);
    }
  }
}

function updateWakeLockUI(active) {
  if (!wakeLockBtn) return;
  if (active) {
    wakeLockBtn.textContent = "BILDSCHIRM: IMMER AN";
    wakeLockBtn.style.borderStyle = "solid";
    wakeLockBtn.style.borderColor = "var(--primary-color)";
    wakeLockBtn.style.color = "var(--primary-color)";
    wakeLockBtn.style.boxShadow = "0 0 10px var(--primary-color)";
  } else {
    wakeLockBtn.textContent = "BILDSCHIRM: NORMAL";
    wakeLockBtn.style.borderStyle = "dotted";
    wakeLockBtn.style.borderColor = "var(--text-muted)";
    wakeLockBtn.style.color = "var(--text-muted)";
    wakeLockBtn.style.boxShadow = "none";
  }
}

function renderHistory() {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";
  if (logs.length === 0) return;

  // --- WEEKLY STATS CALCULATION ---
  const weeks = {};
  const weekDates = {}; // Track date ranges per week
  const weekWorkouts = {}; // Track unique workouts per week
  logs.forEach(l => {
    const d = new Date(l.date);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-KW${weekNum}`;

    if (!weeks[key]) weeks[key] = { vol: 0, sets: 0 };
    weeks[key].vol += (Number(l.weight) || 0) * (Number(l.reps) || 0);
    weeks[key].sets++;

    // Track date range
    if (!weekDates[key]) weekDates[key] = { min: l.date, max: l.date };
    if (l.date < weekDates[key].min) weekDates[key].min = l.date;
    if (l.date > weekDates[key].max) weekDates[key].max = l.date;

    // Track unique workout sessions
    if (!weekWorkouts[key]) weekWorkouts[key] = new Set();
    weekWorkouts[key].add(`${l.date}_${l.workout}`);
  });

  // --- TERMINAL CHART (last 4 weeks) - HORIZONTAL BARS ---
  const last4Weeks = Object.keys(weeks).sort().reverse().slice(0, 4).reverse();
  const chartDiv = document.createElement("div");
  chartDiv.className = "terminal-chart";

  if (last4Weeks.length > 0) {
    const maxVol = Math.max(...last4Weeks.map(w => weeks[w].vol));

    // Format volume for display
    const fmtVol = (v) => {
      if (v >= 10000) return (v / 1000).toFixed(0) + "K";
      if (v >= 1000) return (v / 1000).toFixed(1) + "K";
      return v.toString();
    };

    // Build horizontal bar rows
    let rowsHtml = "";
    last4Weeks.forEach(w => {
      const vol = Math.round(weeks[w].vol);
      const pct = maxVol > 0 ? Math.max(2, (vol / maxVol) * 100) : 2;
      const sessions = weekWorkouts[w] ? weekWorkouts[w].size : 0;
      const shortLabel = w.split("-")[1]; // KW number

      rowsHtml += `
        <div class="chart-row">
          <div class="chart-row-label">${shortLabel}</div>
          <div class="chart-row-bar-bg">
            <div class="chart-row-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="chart-row-vol">${fmtVol(vol)} KG</div>
          <div class="chart-row-sessions">${sessions}x</div>
        </div>
      `;
    });

    // Calculate trend
    let trendHtml = '<span class="chart-trend flat">— STABIL</span>';
    if (last4Weeks.length >= 2) {
      const recent = weeks[last4Weeks[last4Weeks.length - 1]].vol;
      const prev = weeks[last4Weeks[last4Weeks.length - 2]].vol;
      if (prev > 0) {
        const change = ((recent - prev) / prev * 100).toFixed(0);
        if (change > 5) trendHtml = `<span class="chart-trend up">▲ +${change}%</span>`;
        else if (change < -5) trendHtml = `<span class="chart-trend down">▼ ${change}%</span>`;
      }
    }

    // Total volume across all 4 weeks
    const totalVol = last4Weeks.reduce((sum, w) => sum + weeks[w].vol, 0);
    const totalSessions = last4Weeks.reduce((sum, w) => sum + (weekWorkouts[w] ? weekWorkouts[w].size : 0), 0);

    chartDiv.innerHTML = `
      <div class="terminal-chart-header">
        <div class="terminal-chart-title">VOLUMEN // 4 WOCHEN</div>
        <div class="terminal-chart-status">[LIVE]</div>
      </div>
      ${rowsHtml}
      <div class="chart-footer">
        <div class="chart-legend">
          <span class="chart-legend-item"><span class="chart-legend-dot green"></span> VOL</span>
          <span class="chart-legend-item"><span class="chart-legend-dot cyan"></span> SESSIONS</span>
          <span class="chart-legend-item"><span class="chart-legend-dot amber"></span> KW</span>
        </div>
        <div>
          TOTAL: ${fmtVol(Math.round(totalVol))} KG // ${totalSessions} SESSIONS ${trendHtml}
        </div>
      </div>
    `;
  } else {
    chartDiv.innerHTML = `
      <div class="terminal-chart-header">
        <div class="terminal-chart-title">VOLUMEN // 4 WOCHEN</div>
        <div class="terminal-chart-status">[KEINE DATEN]</div>
      </div>
      <div class="chart-empty">KEINE TRAININGSDATEN VERFÜGBAR</div>
    `;
  }
  historyList.appendChild(chartDiv);

  // Weekly Stats Text (with accent colors)
  const statsDiv = document.createElement("div");
  statsDiv.className = "info-section";
  statsDiv.innerHTML = `<div class="editor-header">WOCHENSTATISTIK</div>`;

  Object.keys(weeks).sort().reverse().slice(0, 3).forEach(w => {
    const vol = Math.round(weeks[w].vol);
    const sessions = weekWorkouts[w] ? weekWorkouts[w].size : 0;
    statsDiv.innerHTML += `
        <div class="week-stat-row">
            <span class="week-stat-label">${w}</span>
            <span><span class="week-stat-value">VOL: ${vol.toLocaleString()} KG</span> | <span class="week-stat-sessions">${sessions} SESSIONS</span></span>
        </div>
      `;
  });
  statsDiv.innerHTML += `<div style="height:15px;"></div>`;
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
                <div id="editor-headers-row"
                    style="display: grid; grid-template-columns: 2fr 0.8fr 0.8fr 0.8fr 1fr 40px; gap: 5px; margin-bottom: 5px; font-size: 0.6rem; color: var(--text-muted); padding: 0 15px;">
                    <div>UEBUNG</div>
                    <div id="header-col-2">SÄTZE</div>
                    <div id="header-col-3">WDH</div>
                    <div>KG(START)</div>
                    <div>PAUSE(S)</div>
                    <div>CAT</div>
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
