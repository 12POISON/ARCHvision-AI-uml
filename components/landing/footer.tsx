import Link from "next/link";
import { Boxes } from "lucide-react";
import { GithubIcon, XSocialIcon } from "@/components/ui/brand-icons";

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-line bg-surface/50 py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep text-white">
            <Boxes className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-extrabold tracking-tight text-foreground">
            ArchVision<span className="text-primary"> AI</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground" aria-label="Footer">
          <Link href="/#features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="/#workflow" className="transition-colors hover:text-foreground">Workflow</Link>
          <Link href="/#ai" className="transition-colors hover:text-foreground">AI Engine</Link>
          <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-4 text-muted-foreground">
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="transition-colors hover:text-foreground">
            <GithubIcon className="h-4.5 w-4.5" />
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X" className="transition-colors hover:text-foreground">
            <XSocialIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-muted-foreground/70">
        © {new Date().getFullYear()} ArchVision AI. Diagrams your architecture can finally be proud of.
      </p>
    </footer>
  );
}