import { ModuleList } from "@/components/ModuleList";

export const metadata = { title: "Modules — E-SMMAp" };

export default function ModulesPage() {
  return (
    <>
      <header className="appbar">
        <div>
          <h1>Modules</h1>
          <div className="sub">Empowerment Technologies · Quarter 1</div>
        </div>
      </header>
      <ModuleList />
    </>
  );
}
