"use client";

import { useRef, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useSimulator } from "@/hooks/useSimulator";
import { SimulatorControls } from "./simulator-controls";
import { SimulatorMessage } from "./simulator-message";
import type { Scenario } from "@/types/agent-data";
import { getLocalizedText, UI_TEXT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

// 新章节 → 旧场景文件映射
const scenarioModules: Record<string, () => Promise<{ default: Scenario }>> = {
  ch01: () => import("@/data/scenarios/ch02.json") as Promise<{ default: Scenario }>,
  ch02: () => import("@/data/scenarios/ch04.json") as Promise<{ default: Scenario }>,
  ch03: () => import("@/data/scenarios/ch03.json") as Promise<{ default: Scenario }>,
  ch04: () => import("@/data/scenarios/ch05.json") as Promise<{ default: Scenario }>,
  ch05: () => import("@/data/scenarios/ch06.json") as Promise<{ default: Scenario }>,
  ch06: () => import("@/data/scenarios/ch07.json") as Promise<{ default: Scenario }>,
  ch07: () => import("@/data/scenarios/ch08.json") as Promise<{ default: Scenario }>,
  ch08: () => import("@/data/scenarios/ch09.json") as Promise<{ default: Scenario }>,
  ch09: () => import("@/data/scenarios/ch10.json") as Promise<{ default: Scenario }>,
  ch10: () => import("@/data/scenarios/ch11.json") as Promise<{ default: Scenario }>,
  ch11: () => import("@/data/scenarios/ch01.json") as Promise<{ default: Scenario }>,
  ch12: () => import("@/data/scenarios/ch12.json") as Promise<{ default: Scenario }>,
  ch13: () => import("@/data/scenarios/ch13.json") as Promise<{ default: Scenario }>,
};

interface AgentLoopSimulatorProps {
  chapterId: string;
}

export function AgentLoopSimulator({ chapterId }: AgentLoopSimulatorProps) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();
  const t = UI_TEXT[locale];

  useEffect(() => {
    const loader = scenarioModules[chapterId];
    if (loader) {
      loader().then((mod) => setScenario(mod.default));
    }
  }, [chapterId]);

  const sim = useSimulator(scenario?.steps ?? []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [sim.visibleSteps.length]);

  if (!scenario) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        {t.sim_no_scenario}
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">{t.sim_title}</h2>
      <p className="mb-4 text-sm text-zinc-400">
        {getLocalizedText(scenario.description, locale)}
      </p>

      <div className="overflow-hidden rounded-xl border border-zinc-700">
        <div className="border-b border-zinc-700 bg-zinc-900 px-4 py-3">
          <SimulatorControls
            isPlaying={sim.isPlaying}
            isComplete={sim.isComplete}
            currentIndex={sim.currentIndex}
            totalSteps={sim.totalSteps}
            speed={sim.speed}
            onPlay={sim.play}
            onPause={sim.pause}
            onStep={sim.stepForward}
            onReset={sim.reset}
            onSpeedChange={sim.setSpeed}
          />
        </div>

        <div
          ref={scrollRef}
          className="flex max-h-[500px] min-h-[200px] flex-col gap-3 overflow-y-auto p-4"
        >
          {sim.visibleSteps.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
              {t.sim_start_hint}
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {sim.visibleSteps.map((step, i) => (
              <SimulatorMessage key={i} step={step} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
