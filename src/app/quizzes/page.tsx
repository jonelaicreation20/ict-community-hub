import { QuizList } from "@/components/QuizList";

export const metadata = { title: "Quizzes — E-SMMAp" };

export default function QuizzesPage() {
  return (
    <>
      <header className="appbar">
        <div>
          <h1>Quizzes</h1>
          <div className="sub">Timed · your answers are saved as you go</div>
        </div>
      </header>
      <QuizList />
    </>
  );
}
