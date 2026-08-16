import raw from "@/data/questions.json";

/**
 * Normalizes the App Inventor export.
 *
 * The source data bakes presentation into the content: question text starts
 * with "1. ", options start with "A. ", and the answer is a bare letter. We
 * strip both prefixes once, here, so the UI never parses strings and the
 * answer is compared by index instead of by letter.
 */
export type Question = {
  id: string;
  /** Statement the question refers to, shown above it. */
  stimulus: string | null;
  text: string;
  options: string[];
  /** Index into `options`. */
  answerIndex: number;
  /** Set on items corrected during the rebuild — see reviewNote in the JSON. */
  needsReview: boolean;
};

export type Assessment = {
  slug: string;
  name: string;
  subtitle: string;
  timeLimitSeconds: number;
  questions: Question[];
};

export const LETTERS = ["A", "B", "C", "D"] as const;

type RawQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  stimulus?: string;
  needsReview?: boolean;
};

const stripNumber = (s: string) => s.replace(/^\s*\d+\s*[.)]\s*/, "").trim();
const stripLetter = (s: string) => s.replace(/^\s*[A-D]\s*[.)]\s*/, "").trim();

function normalize(q: RawQuestion): Question {
  const options = q.options.map(stripLetter);
  // Prefer the option's own letter prefix; fall back to position so an item
  // with a missing letter still scores rather than throwing.
  const answerIndex = q.options.findIndex((o) => new RegExp(`^\\s*${q.answer}\\s*[.)]`).test(o));
  return {
    id: q.id,
    stimulus: q.stimulus ?? null,
    text: stripNumber(q.question),
    options,
    answerIndex: answerIndex >= 0 ? answerIndex : LETTERS.indexOf(q.answer as (typeof LETTERS)[number]),
    needsReview: q.needsReview === true,
  };
}

const quizQuestions = (prefix: string) =>
  (raw.quizzes.questions as RawQuestion[])
    .filter((q) => new RegExp(`^ans${prefix}txtbx\\d+$`).test(q.id))
    .map(normalize);

export const ASSESSMENTS: Assessment[] = [
  {
    slug: "pretest",
    name: "Pre-test",
    subtitle: "Covers the whole quarter",
    timeLimitSeconds: raw.preTest.timeLimitSeconds,
    questions: (raw.preTest.questions as RawQuestion[]).map(normalize),
  },
  {
    slug: "m1",
    name: "Module 1.1 quiz",
    subtitle: "ICT and Its Current State",
    timeLimitSeconds: raw.quizzes.timeLimitSeconds,
    questions: quizQuestions("M1"),
  },
  {
    slug: "m12",
    name: "Module 1.2 quiz",
    subtitle: "Software Application and Platforms",
    timeLimitSeconds: raw.quizzes.timeLimitSeconds,
    questions: quizQuestions("M12"),
  },
  {
    slug: "m2",
    name: "Module 2 quiz",
    subtitle: "Netiquettes",
    timeLimitSeconds: raw.quizzes.timeLimitSeconds,
    questions: quizQuestions("M2"),
  },
];

export const getAssessment = (slug: string) => ASSESSMENTS.find((a) => a.slug === slug);

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
