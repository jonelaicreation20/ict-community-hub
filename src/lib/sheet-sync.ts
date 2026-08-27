import type { Attempt } from "@/lib/storage";
import {
  findLocalClass,
  readProfile,
  type Classroom,
  type StudentProfile,
  type TeacherProfile,
} from "@/lib/classroom";

const SHEET_ENDPOINT = process.env.NEXT_PUBLIC_SHEET_ENDPOINT?.trim() ?? "";

type SheetResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export type TeacherRecord = {
  submittedAt: string;
  classCode: string;
  studentName: string;
  studentEmail: string;
  school: string;
  section: string;
  subject: string;
  gradeLevel: string;
  assessment: string;
  score: number;
  total: number;
  percent: number;
  timedOut: boolean;
};

export function hasSheetConnection() {
  return Boolean(SHEET_ENDPOINT);
}

async function sheetRequest<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!SHEET_ENDPOINT) throw new Error("The teacher sheet is not connected yet.");

  const response = await fetch(SHEET_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!response.ok) throw new Error("The teacher sheet could not be reached.");

  const result = (await response.json()) as SheetResponse<T>;
  if (!result.ok) throw new Error(result.error || "The teacher sheet rejected the request.");
  return result.data;
}

export async function createRemoteClass(profile: TeacherProfile) {
  return sheetRequest<Classroom>("createClass", {
    ...profile.classroom,
    teacherEmail: profile.email,
    teacherKey: profile.teacherKey,
    createdAt: new Date(profile.createdAt).toISOString(),
  });
}

export async function findClass(code: string) {
  if (SHEET_ENDPOINT && navigator.onLine) {
    return sheetRequest<Classroom>("findClass", { code });
  }
  const local = findLocalClass(code);
  if (local) return local;
  throw new Error("Connect to the internet the first time you join a class.");
}

export async function registerStudent(profile: StudentProfile) {
  if (!SHEET_ENDPOINT) return false;
  await sheetRequest("registerStudent", {
    studentId: profile.id,
    studentName: profile.name,
    studentEmail: profile.email,
    joinedAt: new Date(profile.joinedAt).toISOString(),
    classCode: profile.classroom.code,
  });
  return true;
}

export async function sendAttempt(attempt: Attempt) {
  const profile = readProfile();
  if (!SHEET_ENDPOINT || profile?.role !== "student") return false;

  await sheetRequest("saveResult", {
    attemptId: attempt.id,
    submittedAt: new Date(attempt.submittedAt).toISOString(),
    classCode: profile.classroom.code,
    studentId: profile.id,
    studentName: profile.name,
    studentEmail: profile.email,
    school: profile.classroom.school,
    section: profile.classroom.section,
    subject: profile.classroom.subject,
    gradeLevel: profile.classroom.gradeLevel,
    assessment: attempt.name,
    score: attempt.score,
    total: attempt.total,
    percent: attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0,
    timedOut: attempt.timedOut,
  });
  return true;
}

export async function getTeacherRecords(profile: TeacherProfile) {
  return sheetRequest<TeacherRecord[]>("teacherRecords", {
    code: profile.classroom.code,
    teacherKey: profile.teacherKey,
  });
}

function csvCell(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function teacherRecordsToCSV(records: TeacherRecord[]) {
  const header = [
    "Submitted", "Class code", "Student", "Email", "School", "Section",
    "Subject", "Grade level", "Assessment", "Score", "Total", "Percent", "Timed out",
  ];
  const rows = records.map((row) => [
    row.submittedAt, row.classCode, row.studentName, row.studentEmail, row.school,
    row.section, row.subject, row.gradeLevel, row.assessment, row.score, row.total,
    `${row.percent}%`, row.timedOut ? "Yes" : "No",
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
