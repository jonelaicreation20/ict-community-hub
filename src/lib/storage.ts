/**
 * Local-first persistence.
 *
 * Everything a student does is written here first and treated as the source of
 * truth, so losing a connection can never cost them a score. `syncState` marks
 * what a future backend would still need to collect; `ResultsSink` is the seam
 * where that backend plugs in without the UI changing.
 */
const DB_NAME = "esmmap";
const DB_VERSION = 1;
const ATTEMPTS = "attempts";
const SESSION = "session";

export type Attempt = {
  id: string;
  assessment: string;
  name: string;
  score: number;
  total: number;
  answers: (number | null)[];
  startedAt: number;
  submittedAt: number;
  timedOut: boolean;
  syncState: "pending" | "synced";
};

/** An in-flight attempt, kept so a reload or phone-lock cannot restart the timer. */
export type Session = {
  assessment: string;
  answers: (number | null)[];
  index: number;
  startedAt: number;
  /** Absolute epoch ms. Storing the deadline rather than a countdown means
   *  closing the app does not hand the student extra time. */
  deadline: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ATTEMPTS)) {
        db.createObjectStore(ATTEMPTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SESSION)) {
        db.createObjectStore(SESSION);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(store, mode).objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export const saveAttempt = (a: Attempt) => tx(ATTEMPTS, "readwrite", (s) => s.put(a));

export const allAttempts = async (): Promise<Attempt[]> => {
  const rows = await tx<Attempt[]>(ATTEMPTS, "readonly", (s) => s.getAll());
  return rows.sort((a, b) => b.submittedAt - a.submittedAt);
};

export const clearAttempts = () => tx(ATTEMPTS, "readwrite", (s) => s.clear());

export const readSession = () => tx<Session | undefined>(SESSION, "readonly", (s) => s.get("current"));
export const writeSession = (v: Session) => tx(SESSION, "readwrite", (s) => s.put(v, "current"));
export const clearSession = () => tx(SESSION, "readwrite", (s) => s.delete("current"));

/**
 * Where finished attempts go. Today results stay on the device and leave via
 * export; swapping in a network sink is the only change a teacher dashboard
 * would need.
 */
export type ResultsSink = {
  readonly name: string;
  send(attempt: Attempt): Promise<boolean>;
};

export const localSink: ResultsSink = {
  name: "This phone",
  async send() {
    return true;
  },
};

export function toCSV(attempts: Attempt[]): string {
  const head = ["Quiz", "Score", "Total", "Percent", "Taken", "Timed out"];
  const rows = attempts.map((a) => [
    a.name,
    String(a.score),
    String(a.total),
    `${Math.round((a.score / a.total) * 100)}%`,
    new Date(a.submittedAt).toLocaleString(),
    a.timedOut ? "yes" : "no",
  ]);
  return [head, ...rows]
    .map((r) => r.map((cell) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(","))
    .join("\n");
}
