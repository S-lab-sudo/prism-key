import { z } from "zod";

// --- Domain Entites ---

export interface EmailVariant {
  username: string;
  domain: string;
  fullAddress: string;
  index: number;
}

export interface VaultItem {
  id: string;
  label: string;
  username?: string; // Optional, primarily for Gmail inputs
  value: string; // The encrypted/hashed or raw password (client-side only)
  createdAt: number;
  strength?: "Weak" | "Medium" | "Strong";
}

// --- Zod Schemas ---

export const permuteSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .refine(
      (val) => val.endsWith("@gmail.com") || val.endsWith("@googlemail.com"),
      { message: "Must be a Gmail address (@gmail.com or @googlemail.com)" }
    ),
  page: z.number().min(0).default(0),
  limit: z.number().min(1).max(1000).default(100),
});

export type PermuteInput = z.infer<typeof permuteSchema>;

export const passwordGenSchema = z.object({
  length: z.number().min(4).max(128).default(20),
  uppercase: z.boolean().default(true),
  lowercase: z.boolean().default(true),
  numbers: z.boolean().default(true),
  symbols: z.boolean().default(true),
});

export type PasswordOptions = z.infer<typeof passwordGenSchema>;

// --- API Responses ---

export interface PermutationResult {
  variants: string[];
  total: number;
  page: number;
  totalPages: number;
}
