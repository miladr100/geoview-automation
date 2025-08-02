import { z } from "zod";

// used for dto
export const ClientContactSchema = z.object({
  _id: z.any(),
  whatsappName: z.string(),
  phone: z.string(),
  status: z.string(),
  service: z.string().nullable().optional(),
  form: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type ConversionSchema = z.infer<typeof ClientContactSchema>;