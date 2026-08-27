"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PROFILE_EVENT,
  clearProfile,
  generateClassCode,
  newStudentId,
  newTeacherKey,
  readProfile,
  saveLocalClass,
  saveProfile,
  type Classroom,
  type CommunityProfile,
  type StudentProfile,
  type TeacherProfile,
} from "@/lib/classroom";
import {
  createRemoteClass,
  findClass,
  getTeacherRecords,
  hasSheetConnection,
  registerStudent,
  teacherRecordsToCSV,
  type TeacherRecord,
} from "@/lib/sheet-sync";
import { clearAttempts, clearSession } from "@/lib/storage";

type EntryView = "choose" | "student-code" | "student-details" | "teacher";

export function CommunityAccess({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);

  useEffect(() => {
    const refresh = () => {
      setProfile(readProfile());
      setReady(true);
    };
    refresh();
    window.addEventListener(PROFILE_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_EVENT, refresh);
  }, []);

  if (!ready) return <div className="entry-loading">Opening ICT Hub…</div>;
  if (!profile) return <Registration />;
  if (profile.role === "teacher") return <TeacherDashboard profile={profile} />;

  return (
    <>
      <StudentBadge profile={profile} />
      {children}
    </>
  );
}

function Registration() {
  const [view, setView] = useState<EntryView>("choose");
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function back() {
    setError("");
    setClassroom(null);
    setView("choose");
  }

  if (view === "choose") {
    return (
      <main className="entry-screen entry-welcome">
        <section className="entry-welcome-hero">
          <p className="entry-brand"><span aria-hidden="true" /> Empowerment Technologies</p>
          <div className="entry-mark" aria-hidden="true">ICT</div>
          <h1>Welcome to your learning hub.</h1>
          <p>Learn, take quizzes, and keep your progress—even when you are offline.</p>
          <span className="entry-orbit" aria-hidden="true" />
        </section>
        <section className="entry-choice-card">
          <p className="eyebrow">Get started</p>
          <h2>Choose your role</h2>
          <p className="entry-lead">You only need to do this once on this device.</p>
          <div className="role-grid">
            <button className="role-card student" onClick={() => setView("student-code")}>
              <span className="role-emoji" aria-hidden="true">🎒</span>
              <strong>I’m a student</strong>
              <span>Join with your teacher’s 6-digit code.</span>
              <b aria-hidden="true">›</b>
            </button>
            <button className="role-card teacher" onClick={() => setView("teacher")}>
              <span className="role-emoji" aria-hidden="true">📋</span>
              <strong>I’m a teacher</strong>
              <span>Create a class and collect results.</span>
              <b aria-hidden="true">›</b>
            </button>
          </div>
          <p className="entry-offline-note"><span aria-hidden="true">✓</span> Lessons and quizzes work offline after setup.</p>
        </section>
      </main>
    );
  }

  if (view === "student-code") {
    return (
      <main className="entry-screen entry-flow">
        <EntryHeader onBack={back} eyebrow="Student · Step 1 of 2" title="Enter your class code" lead="Ask your teacher for the six numbers." />
        <form
          className="entry-form entry-form-card"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const code = String(data.get("code") ?? "").replace(/\D/g, "").slice(0, 6);
            if (code.length !== 6) return setError("Please enter all 6 numbers.");
            setBusy(true);
            setError("");
            try {
              const found = await findClass(code);
              setClassroom(found);
              setView("student-details");
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Class code not found.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            <span>6-digit class code</span>
            <input className="code-input" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus placeholder="000000" />
          </label>
          <FormMessage error={error} />
          <button className="btn wide" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
        </form>
      </main>
    );
  }

  if (view === "student-details" && classroom) {
    return (
      <main className="entry-screen entry-flow">
        <EntryHeader onBack={() => { setError(""); setView("student-code"); }} eyebrow="Student · Step 2 of 2" title="Tell us who you are" lead="Check your class, then enter your details." />
        <form
          className="entry-form entry-form-card"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const student: StudentProfile = {
              role: "student",
              id: newStudentId(),
              name: String(data.get("name") ?? "").trim(),
              email: String(data.get("email") ?? "").trim().toLowerCase(),
              joinedAt: Date.now(),
              classroom,
            };
            setBusy(true);
            setError("");
            try {
              if (hasSheetConnection()) await registerStudent(student);
              await Promise.all([clearAttempts().catch(() => {}), clearSession().catch(() => {})]);
              saveProfile(student);
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Registration could not be saved.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <ClassSummary classroom={classroom} />
          <TextField name="name" label="Full name" autoComplete="name" placeholder="Juan Dela Cruz" />
          <TextField name="email" label="School or personal email" type="email" autoComplete="email" placeholder="juan@example.com" />
          <p className="privacy-note">Your details are used only for your teacher’s class record.</p>
          <FormMessage error={error} />
          <button className="btn wide" disabled={busy}>{busy ? "Joining…" : "Join class"}</button>
        </form>
      </main>
    );
  }

  return <TeacherRegistration onBack={back} />;
}

function TeacherRegistration({ onBack }: { onBack(): void }) {
  const [code, setCode] = useState(() => generateClassCode());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const classroom: Classroom = {
      code,
      teacherName: String(data.get("name") ?? "").trim(),
      school: String(data.get("school") ?? "").trim(),
      section: String(data.get("section") ?? "").trim(),
      subject: String(data.get("subject") ?? "").trim(),
      gradeLevel: String(data.get("gradeLevel") ?? "").trim(),
    };
    const teacher: TeacherProfile = {
      role: "teacher",
      name: classroom.teacherName,
      email: String(data.get("email") ?? "").trim().toLowerCase(),
      teacherKey: newTeacherKey(),
      createdAt: Date.now(),
      classroom,
    };

    setBusy(true);
    setError("");
    try {
      if (hasSheetConnection()) await createRemoteClass(teacher);
      await Promise.all([clearAttempts().catch(() => {}), clearSession().catch(() => {})]);
      saveLocalClass(classroom);
      saveProfile(teacher);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The class could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="entry-screen entry-flow">
      <EntryHeader onBack={onBack} eyebrow="Teacher setup" title="Create your class" lead="Students will use your code. Their class details will fill automatically." />
      <form className="entry-form entry-form-card" onSubmit={submit}>
        {!hasSheetConnection() ? <div className="setup-warning">Demo mode: connect the Google Sheet before sharing this code with students on other devices.</div> : null}
        <TextField name="name" label="Teacher name" autoComplete="name" placeholder="Maria Santos" />
        <TextField name="email" label="Teacher email" type="email" autoComplete="email" placeholder="teacher@school.edu" />
        <TextField name="school" label="School" placeholder="San Pedro High School" />
        <div className="form-pair">
          <TextField name="gradeLevel" label="Grade level" placeholder="Grade 11" />
          <TextField name="section" label="Section" placeholder="ICT A" />
        </div>
        <TextField name="subject" label="Subject" placeholder="Empowerment Technologies" />
        <label className="field">
          <span>Class code</span>
          <div className="code-row">
            <input className="code-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} required />
            <button type="button" className="btn ghost" onClick={() => setCode(generateClassCode())}>New code</button>
          </div>
        </label>
        <FormMessage error={error} />
        <button className="btn wide" disabled={busy || code.length !== 6}>{busy ? "Creating…" : "Create class"}</button>
      </form>
    </main>
  );
}

function TeacherDashboard({ profile }: { profile: TeacherProfile }) {
  const [records, setRecords] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!hasSheetConnection()) return setMessage("Connect the Google Sheet to receive student results from other devices.");
    if (!navigator.onLine) return setMessage("You are offline. Reconnect to refresh the class list.");
    setLoading(true);
    setMessage("");
    try {
      setRecords(await getTeacherRecords(profile));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const studentCount = useMemo(() => new Set(records.map((record) => record.studentEmail.toLowerCase())).size, [records]);

  function download() {
    if (!records.length) return;
    const csv = `\uFEFF${teacherRecordsToCSV(records)}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${profile.classroom.section.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-results-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="teacher-screen">
      <header className="teacher-hero">
        <p className="eyebrow">Teacher dashboard</p>
        <h1>Hello, {profile.name.split(" ")[0]}</h1>
        <p>{profile.classroom.school}</p>
      </header>
      <div className="teacher-body">
        <section className="class-code-card">
          <span>Student class code</span>
          <strong>{profile.classroom.code}</strong>
          <button className="btn ghost" onClick={() => void navigator.clipboard?.writeText(profile.classroom.code)}>Copy code</button>
        </section>
        <ClassSummary classroom={profile.classroom} />
        <section className="record-summary">
          <div><strong>{studentCount}</strong><span>Students</span></div>
          <div><strong>{records.length}</strong><span>Quiz results</span></div>
        </section>
        {message ? <div className="setup-warning">{message}</div> : null}
        <button className="btn wide" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh records"}</button>
        <button className="btn ghost wide" onClick={download} disabled={!records.length}>Download for Excel (.csv)</button>
        <button
          className="text-button"
          onClick={async () => {
            if (window.confirm("Leave this teacher profile on this device? Your online sheet records will not be deleted.")) {
              await Promise.all([clearAttempts().catch(() => {}), clearSession().catch(() => {})]);
              clearProfile();
            }
          }}
        >
          Change user on this device
        </button>
      </div>
    </main>
  );
}

function StudentBadge({ profile }: { profile: StudentProfile }) {
  return (
    <div className="student-badge">
      <span><strong>{profile.name}</strong><small>{profile.classroom.section} · Code {profile.classroom.code}</small></span>
      <button
        className="text-button"
        onClick={async () => {
          if (window.confirm("Change the student using this device? Local quiz results will be cleared for privacy. Synced results stay with the teacher.")) {
            await Promise.all([clearAttempts().catch(() => {}), clearSession().catch(() => {})]);
            clearProfile();
          }
        }}
      >
        Change
      </button>
    </div>
  );
}

function ClassSummary({ classroom }: { classroom: Classroom }) {
  return (
    <div className="class-summary">
      <strong>{classroom.school}</strong>
      <span>{classroom.gradeLevel} · {classroom.section}</span>
      <span>{classroom.subject}</span>
      <small>Teacher: {classroom.teacherName}</small>
    </div>
  );
}

function TextField({ name, label, type = "text", autoComplete, placeholder }: { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} required />
    </label>
  );
}

function BackButton({ onClick }: { onClick(): void }) {
  return <button className="back-button" onClick={onClick} aria-label="Go back">‹ Back</button>;
}

function EntryHeader({ onBack, eyebrow, title, lead }: { onBack(): void; eyebrow: string; title: string; lead: string }) {
  return (
    <header className="entry-flow-header">
      <BackButton onClick={onBack} />
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{lead}</p>
    </header>
  );
}

function FormMessage({ error }: { error: string }) {
  return error ? <p className="form-error" role="alert">{error}</p> : null;
}
