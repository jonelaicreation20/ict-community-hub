export type Classroom = {
  code: string;
  teacherName: string;
  school: string;
  section: string;
  subject: string;
  gradeLevel: string;
};

export type StudentProfile = {
  role: "student";
  id: string;
  name: string;
  email: string;
  joinedAt: number;
  classroom: Classroom;
};

export type TeacherProfile = {
  role: "teacher";
  name: string;
  email: string;
  teacherKey: string;
  createdAt: number;
  classroom: Classroom;
};

export type CommunityProfile = StudentProfile | TeacherProfile;

const PROFILE_KEY = "ict-hub-profile-v1";
const LOCAL_CLASSES_KEY = "ict-hub-local-classes-v1";
export const PROFILE_EVENT = "ict-hub-profile-change";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function newStudentId() {
  return createId();
}

export function newTeacherKey() {
  return createId();
}

export function generateClassCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function readProfile(): CommunityProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as CommunityProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: CommunityProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function clearProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function saveLocalClass(classroom: Classroom) {
  const classes = readLocalClasses().filter((item) => item.code !== classroom.code);
  classes.push(classroom);
  window.localStorage.setItem(LOCAL_CLASSES_KEY, JSON.stringify(classes));
}

export function findLocalClass(code: string) {
  return readLocalClasses().find((item) => item.code === code) ?? null;
}

function readLocalClasses(): Classroom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_CLASSES_KEY);
    return raw ? (JSON.parse(raw) as Classroom[]) : [];
  } catch {
    return [];
  }
}
