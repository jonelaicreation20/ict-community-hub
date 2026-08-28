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
  type TeacherRecord,
} from "@/lib/sheet-sync";
import { clearAttempts, clearSession } from "@/lib/storage";
import { AutoSaveModules } from "@/components/AutoSaveModules";

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
      <AutoSaveModules />
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
              if (!hasSheetConnection()) {
                // Pilot mode: accept any six-digit code until the shared
                // classroom sheet is connected.
                setClassroom({
                  code,
                  teacherName: "Pilot class",
                  school: "",
                  section: "",
                  subject: "",
                  gradeLevel: "",
                });
                setView("student-details");
              } else {
                setError(reason instanceof Error ? reason.message : "Class code not found.");
              }
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
    const needsPilotDetails = !classroom.school;
    return (
      <main className="entry-screen entry-flow">
        <EntryHeader
          onBack={() => { setError(""); setView("student-code"); }}
          eyebrow="Student · Step 2 of 2"
          title="Tell us who you are"
          lead={needsPilotDetails ? "Enter your details to continue to the pilot app." : "Check your class, then enter your details."}
        />
        <form
          className="entry-form entry-form-card"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const joinedClassroom: Classroom = needsPilotDetails ? {
              ...classroom,
              school: String(data.get("school") ?? "").trim(),
              section: String(data.get("section") ?? "").trim(),
              subject: String(data.get("subject") ?? "").trim(),
              gradeLevel: String(data.get("gradeLevel") ?? "").trim(),
            } : classroom;
            const student: StudentProfile = {
              role: "student",
              id: newStudentId(),
              name: String(data.get("name") ?? "").trim(),
              email: String(data.get("email") ?? "").trim().toLowerCase(),
              joinedAt: Date.now(),
              classroom: joinedClassroom,
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
          {needsPilotDetails ? (
            <>
              <div className="setup-warning">Pilot mode: any 6-digit code is accepted for testing.</div>
              <TextField name="school" label="School" placeholder="San Pedro High School" />
              <div className="form-pair">
                <TextField name="gradeLevel" label="Grade level" placeholder="Grade 11" />
                <TextField name="section" label="Section" placeholder="ICT A" />
              </div>
              <TextField name="subject" label="Subject" placeholder="Empowerment Technologies" />
            </>
          ) : <ClassSummary classroom={classroom} />}
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

const PILOT_MODULE_ACTIVITY = [
  { code: "1.1", title: "ICT and Its Current State", students: 22, percent: 92 },
  { code: "1.2", title: "Software Applications and Platforms", students: 19, percent: 79 },
  { code: "2", title: "Netiquettes", students: 16, percent: 67 },
  { code: "3", title: "Online Navigation", students: 11, percent: 46 },
];

const PILOT_QUIZ_ACTIVITY = [
  { title: "Pre-test", taken: 24, average: 74 },
  { title: "Module 1.1 quiz", taken: 21, average: 82 },
  { title: "Module 1.2 quiz", taken: 17, average: 79 },
  { title: "Module 2 quiz", taken: 12, average: 77 },
];

const PILOT_RECENT_ACTIVITY = [
  { initials: "AR", name: "Ana Reyes", action: "Finished Module 1.1 quiz", detail: "Score: 9/10", time: "12 min ago" },
  { initials: "JM", name: "Joshua Martin", action: "Opened Module 2", detail: "Netiquettes", time: "26 min ago" },
  { initials: "LC", name: "Liza Cruz", action: "Finished the Pre-test", detail: "Score: 16/20", time: "1 hr ago" },
];

function TeacherDashboard({ profile }: { profile: TeacherProfile }) {
  const [records, setRecords] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const pilotMode = !hasSheetConnection();

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
  const classAverage = records.length ? Math.round(records.reduce((sum, record) => sum + record.percent, 0) / records.length) : 0;

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
        {pilotMode ? (
          <div className="pilot-label"><span>Preview</span><strong>Sample class activity</strong><small>For interface testing only—not real student data.</small></div>
        ) : null}
        <section className="record-summary teacher-metrics" aria-label="Class summary">
          <div><span className="metric-icon purple" aria-hidden="true">ST</span><strong>{pilotMode ? 24 : studentCount}</strong><span>Students</span></div>
          <div><span className="metric-icon yellow" aria-hidden="true">%</span><strong>{pilotMode ? 78 : classAverage}%</strong><span>Class average</span></div>
          <div><span className="metric-icon teal" aria-hidden="true">▤</span><strong>{pilotMode ? "9/14" : "—"}</strong><span>Modules accessed</span></div>
          <div><span className="metric-icon orange" aria-hidden="true">✓</span><strong>{pilotMode ? 74 : records.length}</strong><span>Quiz attempts</span></div>
        </section>

        {pilotMode ? (
          <>
            <section className="analytics-card">
              <div className="analytics-heading">
                <div><p className="eyebrow">LEARNING PROGRESS</p><h2>Modules accessed</h2></div>
                <span>24 students</span>
              </div>
              <div className="analytics-list">
                {PILOT_MODULE_ACTIVITY.map((module) => (
                  <div className="progress-row" key={module.code}>
                    <div className="progress-row-title"><span><b>Module {module.code}</b><small>{module.title}</small></span><strong>{module.students}/24</strong></div>
                    <div className="analytics-track" role="progressbar" aria-label={`Module ${module.code} accessed by ${module.percent}% of students`} aria-valuenow={module.percent} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${module.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="analytics-note">9 of 14 modules have been opened by at least one student.</p>
            </section>

            <section className="analytics-card">
              <div className="analytics-heading">
                <div><p className="eyebrow">ASSESSMENTS</p><h2>Quiz performance</h2></div>
                <span>Class average</span>
              </div>
              <div className="quiz-analytics-list">
                {PILOT_QUIZ_ACTIVITY.map((quiz) => (
                  <div className="quiz-analytics-row" key={quiz.title}>
                    <span><b>{quiz.title}</b><small>{quiz.taken} of 24 completed</small></span>
                    <strong>{quiz.average}%<small>average</small></strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="analytics-card">
              <div className="analytics-heading"><div><p className="eyebrow">TODAY</p><h2>Recent activity</h2></div></div>
              <div className="recent-activity-list">
                {PILOT_RECENT_ACTIVITY.map((activity) => (
                  <div className="recent-activity" key={`${activity.name}-${activity.action}`}>
                    <span className="activity-avatar" aria-hidden="true">{activity.initials}</span>
                    <span><b>{activity.name}</b><small>{activity.action} · {activity.detail}</small></span>
                    <time>{activity.time}</time>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {message ? <div className="setup-warning">{message}</div> : null}
            <button className="btn wide" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh records"}</button>
          </>
        )}
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
