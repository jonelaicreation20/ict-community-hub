import { ResultsHistory } from "@/components/ResultsHistory";

export const metadata = { title: "My results — E-SMMAp" };

export default function ResultsPage() {
  return (
    <>
      <header className="appbar">
        <div>
          <h1>My results</h1>
          <div className="sub">Kept on this phone</div>
        </div>
      </header>
      <ResultsHistory />
    </>
  );
}
