import type { Metadata } from "next";
import { Mail, MessageSquare } from "lucide-react";
import { SUPPORT_EMAIL, PROJECT_REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ArchVision AI team.",
};

export default function ContactPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-14 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Contact</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          We&apos;d love to hear from you
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Questions, feedback, bug reports or privacy requests — reach us any time. We typically reply
          within a few business days.
        </p>

        <div className="mt-10 space-y-4">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group flex items-center gap-4 rounded-xl border border-line bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">Email support</span>
              <span className="block font-mono text-[13px] text-muted-foreground">{SUPPORT_EMAIL}</span>
            </span>
          </a>

          <a
            href={`${PROJECT_REPO_URL}/issues`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-line bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
              <MessageSquare className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">GitHub issues</span>
              <span className="block text-[13px] text-muted-foreground">
                Report bugs or request features on the public repository
              </span>
            </span>
          </a>
        </div>

        <p className="mt-10 rounded-xl border border-line bg-surface/50 p-4 text-[12.5px] leading-relaxed text-muted">
          For privacy-related requests (access, correction, deletion), please mention
          &ldquo;privacy request&rdquo; in the subject line so we can route it to the right person.
        </p>
      </div>
    </main>
  );
}
