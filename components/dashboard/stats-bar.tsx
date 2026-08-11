"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Activity, Boxes, FileCode2, GitBranch, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stat {
  icon: LucideIcon;
  label: string;
  value: number;
  delta: string;
  gradient: string;
}

interface StatsBarProps {
  diagrams: number;
  projects: number;
  classes: number;
  methods: number;
}

const DELTAS = ["+12% this week", "+2 new", "+38 members", "+120 methods"];

export function StatsBar({ diagrams, projects, classes, methods }: StatsBarProps): React.ReactElement {
  const stats: Stat[] = [
    { icon: Boxes, label: "Diagrams", value: diagrams, delta: DELTAS[0], gradient: "from-blue-600 to-blue-800" },
    { icon: GitBranch, label: "Projects", value: projects, delta: DELTAS[1], gradient: "from-indigo-500 to-indigo-700" },
    { icon: Activity, label: "Classes modeled", value: classes, delta: DELTAS[2], gradient: "from-emerald-500 to-emerald-700" },
    { icon: FileCode2, label: "Exports", value: methods, delta: DELTAS[3], gradient: "from-amber-400 to-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: index * 0.06 }}
          className="card-elevated relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <span
            className={cn(
              "absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-10 transition-opacity duration-300 hover:opacity-20",
              stat.gradient
            )}
            aria-hidden="true"
          />
          <div className="flex items-center justify-between">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <stat.icon className="h-4 w-4 text-slate-300" />
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
          <p className="mt-1 text-[11.5px] font-medium text-success">{stat.delta}</p>
        </motion.div>
      ))}
    </div>
  );
}