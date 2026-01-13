# WEYLAND-YUTANI FITNESS TRACKER

## Project Overview
This application is a progressive overload fitness tracker with a "Retro Sci-Fi" interface designed for mobile web use. It focuses on efficiency, allowing users to track weights, reps, and rest times with minimal friction. The "Alien Terminal" aesthetic distinguishes it from standard fitness apps, offering an immersive experience.

## Features
- **Smart Routine Management**: Rotates through workout plans (e.g., A/B Split or Push/Pull/Legs) automatically based on completion history.
- **Progressive Overload**: Displays the previous performance for each exercise directly in the input field to encourage improvement.
- **Cardio Tracking**: Supports duration (minutes) and calorie tracking alongside standard weightlifting.
- **Offline Capable (PWA)**: Can be installed on mobile devices for a native-like experience.
- **Data Privacy**: Users own their data. Includes functionality to export all logs as CSV or delete the account entirely.
- **Interactive UI**: Features a detailed "terminal" design with auditory and visual feedback (animations, glow effects).

## Technology Stack
The project is built with a focus on simplicity and longevity, avoiding heavy frontend frameworks.
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Backend**: Supabase (PostgreSQL) for authentication, data storage, and real-time updates.
- **Hosting**: Static file hosting (e.g., Vercel, Netlify, or GitHub Pages).

## Setup Instructions

### 1. Prerequisites
- A Supabase account.
- Basic web server for local testing (e.g., Live Server extension for VS Code).

### 2. Database Setup
The backend logic works with Supabase. You will need to execute the SQL scripts found in the `database/` directory to set up the necessary tables (`logs`, `workouts`, `workout_exercises`) and Row Level Security (RLS) policies.

### 3. Configuration
The application connects to Supabase via the client library. Ensure your Project URL and Anonymous Key are correctly configured in `index.html` (header script) or `script.js` depending on the implementation version.

## Usage
1. **Registration**: Create an account via the interface.
2. **Plan Creation**: Go to the "Plans" section to create new routines or use the provided system templates.
3. **Training**: Select a workout on the main screen. The app will suggest the next logical workout in your routine.
4. **History**: View past training sessions and weekly volume statistics in the "History" tab.

## License
This project is for personal use and portfolio demonstration. All rights to the "Alien" franchise intellectual property belong to their respective owners.

**Contact**: Friederich Bette
