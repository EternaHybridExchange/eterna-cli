import { z } from "zod";

export const LinkResultSchema = z.object({
  linked: z.boolean(),
  agentName: z.string(),
  bybitSubMemberId: z.string().nullable(),
});

export type LinkResult = z.infer<typeof LinkResultSchema>;
