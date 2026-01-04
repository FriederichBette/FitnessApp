/**
 * GOOGLE APPS SCRIPT FOR POWERPULSE WORKOUT TRACKER
 * 
 * Anleitung zur Einrichtung:
 * 1. Öffne ein Google Spreadsheet.
 * 2. Benenne ein Tabellenblatt "plan" und eines "workout_log".
 * 3. Spaltenüberschriften für "plan":
 *    A: workout (1, 2, 3), B: exercise, C: sets, D: reps_min, E: reps_max, F: planned_weight
 * 4. Spaltenüberschriften für "workout_log":
 *    A: date, B: workout, C: exercise, D: set, E: reps, F: weight, G: volume
 * 5. Gehe zu Erweiterungen > Apps Script.
 * 6. Kopiere diesen Code hinein und speichere.
 * 7. Klicke auf "Bereitstellen" > "Neue Bereitstellung".
 * 8. Wähle Typ: "Web-App".
 * 9. Zugriff: "Jeder" (Anyone).
 * 10. Kopiere die Web-App-URL und füge sie in der script.js ein.
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ROUTING
  if (e.parameter.mode === "plan") {
    const sheet = ss.getSheetByName("plan");
    const data = sheet.getDataRange().getValues();
    data.shift(); // Header entfernen

    const plan = data.map(r => ({
      workout: Number(r[0]),
      exercise: r[1],
      sets: Number(r[2]),
      reps_min: Number(r[3]),
      reps_max: Number(r[4]),
      planned_weight: r[5]
    }));

    return ContentService.createTextOutput(JSON.stringify(plan))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter.mode === "logs") {
    const sheet = ss.getSheetByName("workout_log");
    const data = sheet.getDataRange().getValues();
    data.shift(); // Header entfernen

    const logs = data.map(r => ({
      date: r[0],
      workout: r[1],
      exercise: r[2],
      set: r[3],
      reps: r[4],
      weight: r[5]
    }));

    return ContentService.createTextOutput(JSON.stringify(logs))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput("Error: Invalid Mode")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("workout_log");
  
  try {
    const rows = JSON.parse(e.postData.contents);

    rows.forEach(r => {
      const volume = (r.reps && r.weight) ? (r.reps * r.weight) : 0;
      sheet.appendRow([
        r.date,
        r.workout,
        r.exercise,
        r.set,
        r.reps,
        r.weight,
        volume
      ]);
    });

    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
