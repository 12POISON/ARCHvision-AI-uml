import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}): React.ReactElement {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to ArchVision AI
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">{section.heading}</h2>
              {section.body.map((paragraph, index) => (
                <p key={index} className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13px] leading-relaxed text-amber-800">
            <strong>Legal review required before public launch.</strong> This document is a product-team
            draft written for the open-source preview and has <strong>not</strong> been reviewed by legal
            counsel. It should be validated against the jurisdiction(s) you operate in before real signups
            are accepted.
          </p>
        </div>
      </div>
    </main>
  );
}
