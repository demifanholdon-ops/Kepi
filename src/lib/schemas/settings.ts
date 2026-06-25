import { z } from "zod";

export const settingsSchema = z.object({
  volume: z.number().min(0).max(1).default(0.8),
  gestureEnabled: z.boolean().default(false),
});

export type Settings = z.infer<typeof settingsSchema>;
