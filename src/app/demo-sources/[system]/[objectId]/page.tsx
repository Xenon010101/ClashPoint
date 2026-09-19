import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicDemoFact } from "@/lib/facts";

export default async function DemoSourcePage({
  params,
}: {
  params: Promise<{ system: string; objectId: string }>;
}) {
  const { system, objectId } = await params;
  const fact = getPublicDemoFact(objectId);
  if (!fact || fact.sourceSystem !== system) notFound();

  return (
    <main className="source-page">
      <div className="source-page-header">
        <Image src="/clashpoint-mark.png" alt="ClashPoint" width={34} height={34} />
        <Link href="/" className="source-back">← Back to meeting</Link>
      </div>
      <div className="source-kicker">Demo fixture · {fact.sourceSystem}</div>
      <h1>{fact.sourceTitle}</h1>
      <blockquote>{fact.statementVerbatim}</blockquote>
      <dl className="source-meta">
        <div><dt>Object</dt><dd>{fact.sourceObjectId}</dd></div>
        <div><dt>Status</dt><dd>{fact.status}</dd></div>
        <div><dt>Revision</dt><dd>{fact.sourceRevision}</dd></div>
        <div><dt>Observed</dt><dd>{new Date(fact.observedAt).toLocaleString()}</dd></div>
      </dl>
    </main>
  );
}
