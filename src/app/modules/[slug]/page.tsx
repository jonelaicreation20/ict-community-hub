import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULES, getModule } from "@/lib/modules";
import { ModuleReader } from "@/components/ModuleReader";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export default async function ModulePage({ params }: PageProps<"/modules/[slug]">) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();

  return (
    <>
      <header className="appbar">
        <Link href="/modules" className="iconbtn" aria-label="Back to modules">
          ‹
        </Link>
        <div style={{ minWidth: 0 }}>
          <h1>Module {mod.code}</h1>
          <div className="sub">{mod.title}</div>
        </div>
      </header>
      <ModuleReader module={mod} />
    </>
  );
}
