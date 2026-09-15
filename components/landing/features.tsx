"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Eye,
  GitBranch,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: MessageSquareText,
    title: "Prompt-driven editing",
    description:
      "Select any node and say what should change — “Make User inherit from Account” redraws the diagram before you lift your finger.",
    accent: "from-blue-600 to-blue-900",
  },
  {
    icon: Eye,
    title: "Executive & engineering views",
    description:
      "One switch for the boardroom, one for the codebase. Stakeholders see the shape; engineers see every generic and modifier.",
    accent: "from-teal-500 to-teal-700",
  },
  {
    icon: ShieldCheck,
    title: "Architecture validation",
    description:
      "A 100-point once-over that flags inheritance cycles, god classes, stray nodes and naming drift before anything leaves the table.",
    accent: "from-emerald-500 to-emerald-700",
  },
  {
    icon: ScanSearch,
    title: "AI architecture critic",
    description:
      "Coupling spikes, circular dependencies and missing interfaces — called out with severity ratings and the fix spelled out.",
    accent: "from-slate-600 to-slate-900",
  },
  {
    icon: GitBranch,
    title: "GitHub-driven diagrams",
    description:
      "Hook up a repository and every push re-sketches your classes. Diffs show up as diagrams, not diffs.",
    accent: "from-indigo-500 to-indigo-700",
  },
  {
    icon: Layers,
    title: "Forward code generation",
    description:
      "Turn any class model into TypeScript, Java, Python or C# — Lombok, Pydantic and decorator boilerplate included.",
    accent: "from-pink-500 to-rose-700",
  },
];

export function Features(): React.ReactElement {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-2xs font-bold uppercase tracking-[0.2em] text-primary">Features</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl">
            One table for the whole design review
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            Sketch, argue, check and export without switching tools — the drafting table stays
            open from first idea to final sign-off.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: index * 0.06 }}
              className="group card-elevated relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div
                className={cn(
                  "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${feature.accent}`
                )}
              >
                <feature.icon className="h-5.5 w-5.5" strokeWidth={2.1} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">{feature.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}