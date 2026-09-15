import Link from "next/link";
import Image from "next/image";
import { GithubIcon } from "@/components/ui/brand-icons";
import { PROJECT_REPO_URL } from "@/lib/site";

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-line bg-surface/50 py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center">
          <Image src="/logo.png" alt="ArchVision AI" width={572} height={126} className="h-10 w-auto" />
        </div>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground" aria-label="Footer">
          <Link href="/#features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="/#workflow" className="transition-colors hover:text-foreground">Workflow</Link>
          <Link href="/#ai" className="transition-colors hover:text-foreground">AI Engine</Link>
          <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-4 text-muted-foreground">
          <a
            href={PROJECT_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="ArchVision AI on GitHub"
            className="transition-colors hover:text-foreground"
          >
            <GithubIcon className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-muted-foreground">
        © 2026 BJVR. All rights reserved. Diagrams your architecture can finally be proud of.
      </p>
    </footer>
  );
}