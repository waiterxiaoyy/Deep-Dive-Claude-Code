"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SimStep } from "@/types/agent-data";
import { getLocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { User, Bot, Terminal, ArrowRight, AlertCircle } from "lucide-react";

interface SimulatorMessageProps {
  step: SimStep;
  index: number;
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof User; label: string; bgClass: string; borderClass: string }
> = {
  user_message: {
    icon: User,
    label: "User",
    bgClass: "bg-blue-950/30",
    borderClass: "border-blue-800",
  },
  assistant_text: {
    icon: Bot,
    label: "Assistant",
    bgClass: "bg-zinc-900",
    borderClass: "border-zinc-700",
  },
  tool_call: {
    icon: Terminal,
    label: "Tool Call",
    bgClass: "bg-amber-950/30",
    borderClass: "border-amber-800",
  },
  tool_result: {
    icon: ArrowRight,
    label: "Tool Result",
    bgClass: "bg-emerald-950/30",
    borderClass: "border-emerald-800",
  },
  system_event: {
    icon: AlertCircle,
    label: "System",
    bgClass: "bg-purple-950/30",
    borderClass: "border-purple-800",
  },
};

export function SimulatorMessage({ step }: SimulatorMessageProps) {
  const { locale } = useLocale();
  const config = TYPE_CONFIG[step.type] || TYPE_CONFIG.assistant_text;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-lg border p-3",
        config.bgClass,
        config.borderClass
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Icon size={14} className="shrink-0 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-400">
          {config.label}
          {step.toolName && (
            <span className="ml-1.5 font-mono text-zinc-200">
              {step.toolName}
            </span>
          )}
        </span>
      </div>

      {step.type === "tool_call" || step.type === "tool_result" ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-zinc-950 p-2.5 font-mono text-xs leading-relaxed text-zinc-100">
          {getLocalizedText(step.content, locale) || "(empty)"}
        </pre>
      ) : step.type === "system_event" ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-purple-950 p-2.5 font-mono text-xs leading-relaxed text-purple-100">
          {getLocalizedText(step.content, locale)}
        </pre>
      ) : (
        <p className="text-sm leading-relaxed text-zinc-200">{getLocalizedText(step.content, locale)}</p>
      )}

      <p className="mt-2 text-xs italic text-zinc-500">
        {getLocalizedText(step.annotation, locale)}
      </p>
    </motion.div>
  );
}
