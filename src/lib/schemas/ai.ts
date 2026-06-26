import { z } from "zod";

export const aiPromptInputSchema = z.object({
  stage: z.number().int().min(1).max(6),
  kebi: z.number().int().min(0).max(6),
  homeRepair: z.number().min(0).max(100),
  survival: z.number().int().min(0).max(3),
  battleSummary: z.string().min(1).max(500),
  result: z.enum(["win", "lose"]).optional(),
});

export const aiLetterResponseSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(800),
  voiceText: z.string().max(800).optional(),
  source: z.string().max(120).optional(),
});

export const aiRequestSchema = z.object({
  kind: z.literal("digital-letter"),
  input: aiPromptInputSchema,
});

export type AIPromptInputParsed = z.infer<typeof aiPromptInputSchema>;
export type AILetterResponseParsed = z.infer<typeof aiLetterResponseSchema>;
