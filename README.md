# WEYLAND YUTANI FITNESS TRACKER 🏋️‍♂️👽

A sci-fi themed progressive overload workout tracker. "Building Better Worlds... and Better Bodies."

## 🌟 Features

*   **Alien Terminal UI**: High-contrast, futuristic "retro-terminal" interface.
*   **Smart Routines**: Automatically cycles through your workout plans (A -> B -> C).
*   **Progressive Overload**: Shows your last lift *for that specific exercise* directly in the input field.
*   **System Templates**: Pre-loaded "FULL BODY" routines to get started instantly.
*   **History & Stats**: Weekly volume visualization and collapsible history logs.
*   **Data Export**: 1-Click CSV Export of all your training data.
*   **Pixel Penguin Companion**: A motivational little friend who reminds you to hydrate. 🐧

## 🚀 Getting Started

### 1. User Setup
1.  Open the App URL.
2.  Click **"NEU REGISTRIEREN"** and create an account.
3.  Go to the **"PLÄNE"** tab.
4.  Copy a **"SYSTEM VORLAGE"** (e.g., Full Body A) to your routines.

### 2. Training
1.  Go to **"TRAINING"**.
2.  Select your routine and workout.
3.  Enter your weights/reps.
4.  Hit **"TRAINING SPEICHERN"** when done.

## 🛠️ Tech Stack & Setup

*   **Frontend**: Vanilla JS, HTML5, CSS3 (No build step required, just drag & drop).
*   **Backend**: Supabase (PostgreSQL, Auth, Realtime).

### Local Logic
The app logic is contained entirely in `script.js`.
*   `init()`: Loads initial state.
*   `suggestNextWorkout()`: Handles the A/B cycle logic.
*   `loadWorkout()`: Fetches specific exercise history for overload context.

## 🐧 The Penguin
The mascot appears every ~20 seconds to keep morale high.
*   *Hidden Feature*: He sometimes does a little dance before walking.

---
*Property of Weyland-Yutani Corp. All rights reserved.*
