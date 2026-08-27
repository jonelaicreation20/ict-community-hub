/**
 * Community ICT Hub pilot collector.
 * Paste this file into an Apps Script project bound to the teacher workbook.
 */

const HEADERS = {
  Classes: ["Created", "Class code", "Teacher key", "Teacher", "Teacher email", "School", "Section", "Subject", "Grade level"],
  Students: ["Joined", "Class code", "Student ID", "Student", "Email"],
  Results: ["Submitted", "Class code", "Attempt ID", "Student ID", "Student", "Email", "School", "Section", "Subject", "Grade level", "Assessment", "Score", "Total", "Percent", "Timed out"],
};

function doGet() {
  return json_({ ok: true, data: { service: "Community ICT Hub", status: "ready" } });
}

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents || "{}");
    const action = String(request.action || "");
    if (action === "createClass") return createClass_(request);
    if (action === "findClass") return findClass_(request);
    if (action === "registerStudent") return registerStudent_(request);
    if (action === "saveResult") return saveResult_(request);
    if (action === "teacherRecords") return teacherRecords_(request);
    throw new Error("Unknown request.");
  } catch (error) {
    return json_({ ok: false, error: error.message || "Request failed." });
  }
}

function createClass_(request) {
  const code = clean_(request.code);
  if (!/^\d{6}$/.test(code)) throw new Error("Class code must contain 6 numbers.");
  required_(request, ["teacherKey", "teacherName", "teacherEmail", "school", "section", "subject", "gradeLevel"]);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheet_("Classes");
    if (rows_(sheet).some((row) => clean_(row[1]) === code)) throw new Error("That class code is already being used. Choose a new code.");
    sheet.appendRow([
      clean_(request.createdAt) || new Date(), code, clean_(request.teacherKey), clean_(request.teacherName),
      clean_(request.teacherEmail), clean_(request.school), clean_(request.section), clean_(request.subject), clean_(request.gradeLevel),
    ]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, data: publicClass_(request) });
}

function findClass_(request) {
  const row = classRow_(clean_(request.code));
  if (!row) throw new Error("Class code not found. Check the numbers with your teacher.");
  return json_({ ok: true, data: classFromRow_(row) });
}

function registerStudent_(request) {
  required_(request, ["studentId", "studentName", "studentEmail", "classCode"]);
  if (!classRow_(clean_(request.classCode))) throw new Error("Class code not found.");
  const sheet = sheet_("Students");
  if (!rows_(sheet).some((row) => clean_(row[2]) === clean_(request.studentId))) {
    sheet.appendRow([clean_(request.joinedAt) || new Date(), clean_(request.classCode), clean_(request.studentId), clean_(request.studentName), clean_(request.studentEmail)]);
  }
  return json_({ ok: true, data: { saved: true } });
}

function saveResult_(request) {
  required_(request, ["attemptId", "classCode", "studentId", "studentName", "studentEmail", "assessment"]);
  if (!classRow_(clean_(request.classCode))) throw new Error("Class code not found.");
  const sheet = sheet_("Results");
  if (!rows_(sheet).some((row) => clean_(row[2]) === clean_(request.attemptId))) {
    sheet.appendRow([
      clean_(request.submittedAt) || new Date(), clean_(request.classCode), clean_(request.attemptId), clean_(request.studentId),
      clean_(request.studentName), clean_(request.studentEmail), clean_(request.school), clean_(request.section), clean_(request.subject),
      clean_(request.gradeLevel), clean_(request.assessment), Number(request.score) || 0, Number(request.total) || 0,
      Number(request.percent) || 0, Boolean(request.timedOut),
    ]);
  }
  return json_({ ok: true, data: { saved: true } });
}

function teacherRecords_(request) {
  const code = clean_(request.code);
  const teacherKey = clean_(request.teacherKey);
  const classroom = classRow_(code);
  if (!classroom || clean_(classroom[2]) !== teacherKey) throw new Error("Teacher access was not recognized on this device.");

  const records = rows_(sheet_("Results"))
    .filter((row) => clean_(row[1]) === code)
    .map((row) => ({
      submittedAt: dateText_(row[0]), classCode: clean_(row[1]), studentName: clean_(row[4]), studentEmail: clean_(row[5]),
      school: clean_(row[6]), section: clean_(row[7]), subject: clean_(row[8]), gradeLevel: clean_(row[9]),
      assessment: clean_(row[10]), score: Number(row[11]) || 0, total: Number(row[12]) || 0,
      percent: Number(row[13]) || 0, timedOut: Boolean(row[14]),
    }));
  return json_({ ok: true, data: records });
}

function sheet_(name) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS[name].length).setFontWeight("bold").setBackground("#4b39ef").setFontColor("#ffffff");
    sheet.autoResizeColumns(1, HEADERS[name].length);
  }
  return sheet;
}

function rows_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function classRow_(code) {
  return rows_(sheet_("Classes")).find((row) => clean_(row[1]) === code) || null;
}

function classFromRow_(row) {
  return { code: clean_(row[1]), teacherName: clean_(row[3]), school: clean_(row[5]), section: clean_(row[6]), subject: clean_(row[7]), gradeLevel: clean_(row[8]) };
}

function publicClass_(request) {
  return { code: clean_(request.code), teacherName: clean_(request.teacherName), school: clean_(request.school), section: clean_(request.section), subject: clean_(request.subject), gradeLevel: clean_(request.gradeLevel) };
}

function required_(request, fields) {
  fields.forEach((field) => { if (!clean_(request[field])) throw new Error("Please complete all required information."); });
}

function clean_(value) {
  return String(value == null ? "" : value).trim().slice(0, 250);
}

function dateText_(value) {
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? clean_(value) : date.toISOString();
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
