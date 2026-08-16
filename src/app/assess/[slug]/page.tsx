import { notFound } from "next/navigation";
import { ASSESSMENTS, getAssessment } from "@/lib/questions";
import { Runner } from "@/components/Runner";

export function generateStaticParams() {
  return ASSESSMENTS.map((a) => ({ slug: a.slug }));
}

export default async function AssessPage({ params }: PageProps<"/assess/[slug]">) {
  const { slug } = await params;
  const assessment = getAssessment(slug);
  if (!assessment) notFound();

  return <Runner assessment={assessment} />;
}
