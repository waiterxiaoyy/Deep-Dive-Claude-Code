export type LocalizedText = {
  zh: string;
  en: string;
} | string;

export interface SimStep {
  type: "user_message" | "assistant_text" | "tool_call" | "tool_result" | "system_event";
  content: LocalizedText;
  toolName?: string;
  annotation: LocalizedText;
}

export interface Scenario {
  version: string;
  title: LocalizedText;
  description: LocalizedText;
  steps: SimStep[];
}
