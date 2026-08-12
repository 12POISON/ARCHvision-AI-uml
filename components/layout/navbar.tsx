"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Boxes, FolderKanban, LayoutGrid, Search, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

/** Subset of the NextAuth session user used by the shell. */
export interface NavUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function initialsOf(user: NavUser | null | undefined): string {
  if (!user) return "?";
  if (user.name) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }): React.ReactElement {
  const sizes = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" };
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="ArchVision AI home">
      <span
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-btn-primary transition-transform duration-300 group-hover:scale-105",
          sizes[size]
        )}
      >
        <Boxes className="h-1/2 w-1/2" strokeWidth={2.2} />
      </span>
      <span className="text-[17px] font-extrabold tracking-tight text-foreground">
        ArchVision<span className="text-primary"> AI</span>
      </span>
    </Link>
  );
}

export function Navbar({ user }: { user?: NavUser | null } = {}): React.ReactElement {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [hash, setHash] = React.useState("");

  React.useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onHashChange = (): void => setHash(window.location.hash);
    setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const openCommandPalette = (): void => {
    window.dispatchEvent(new CustomEvent("archvision:command"));
  };

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/editor") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/projects");

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled || isApp ? "glass shadow-card" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <Link
            href="/#features"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-foreground",
              pathname === "/" && hash === "#features" && "bg-slate-100 text-foreground"
            )}
          >
            Features
          </Link>
          <Link
            href="/#workflow"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-foreground",
              pathname === "/" && hash === "#workflow" && "bg-slate-100 text-foreground"
            )}
          >
            Workflow
          </Link>
          <Link
            href="/#ai"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-foreground",
              pathname === "/" && hash === "#ai" && "bg-slate-100 text-foreground"
            )}
          >
            AI Engine
          </Link>
        </nav>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden items-center gap-2 rounded-btn2 border border-line bg-white px-3 py-2 text-[13px] text-muted-foreground transition-all duration-300 hover:border-slate-300 hover:text-foreground sm:flex"
            aria-label="Open command palette"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Searchâ€¦</span>
            <kbd className="ml-4 rounded-md border border-line bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              âŒ˜K
            </kbd>
          </button>
          {isApp ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

function UserMenu({ user }: { user?: NavUser | null }): React.ReactElement {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-white text-slate-500 transition-all duration-300 hover:border-primary/40 hover:text-primary"
          aria-label={user?.name ? `Account menu for ${user.name}` : "Account menu"}
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Account avatar"}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary/10 text-[12px] font-extrabold text-primary">
              {initialsOf(user)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="truncate text-sm font-bold text-foreground">{user?.name ?? "Guest"}</span>
          {user?.email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <LayoutGrid className="h-4 w-4" /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/projects")}>
          <FolderKanban className="h-4 w-4" /> Projects
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger onClick={() => void signOut({ callbackUrl: "/login" })}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}