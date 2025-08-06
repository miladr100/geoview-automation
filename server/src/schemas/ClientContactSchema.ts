import { z } from "zod";

// used for dto
export const ClientContactSchema = z.object({
  _id: z.any(),
  whatsappName: z.string().nullable().optional(),
  phone: z.string(),
  status: z.string(),
  service: z.string().nullable().optional(),
  form: z.string().nullable().optional(),
  boardId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  block: z.boolean().default(false),
  createdAt: z.string(),
});

export type ConversionSchema = z.infer<typeof ClientContactSchema>;