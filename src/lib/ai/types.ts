export type AIPromptInput = {
  stage: number;
  kebi: number;
  homeRepair: number;
  survival: number;
  battleSummary: string;
  result?: "win" | "lose";
};

export type AILetterResponse = {
  title: string;
  body: string;
  voiceText?: string;
  source?: string;
};

export type AIRequest = {
  kind: "digital-letter";
  input: AIPromptInput;
};

export type AIResponse =
  | { ok: true; data: AILetterResponse }
  | { ok: false; fallback: AILetterResponse };

export type DigitalLetterResult = {
  letter: AILetterResponse;
  fromAI: boolean;
};
