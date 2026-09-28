import { z } from "zod";

export const businessProfileSchema = z.object({
  businessName: z.string().min(2),
  businessTagline: z.string().optional(),
  contactName: z.string().min(2),
  contactPhone: z.string().min(10),
  contactEmail: z.string().email(),
  upi: z.string().optional(),
  gstNumber: z.string().optional(),
  businessAddress: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
});

export type BusinessProfileForm = z.infer<
  typeof businessProfileSchema
>;
