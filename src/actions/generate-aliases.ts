'use server';

import { permuteSchema, PermuteInput, PermutationResult } from "@/types";
import { PermutationService } from "@/core/services/permutation.service";
import { z } from "zod";

/**
 * Server Action: Generate Aliases
 * Validates input and calls the domain service.
 * Deliberately delays slightly to simulate "work" if needed, but fast is better.
 */
export async function generateAliases(input: PermuteInput): Promise<{ success: boolean; data?: PermutationResult; error?: string }> {
  try {
    // 1. Validation
    const validated = permuteSchema.parse(input);

    // 2. Execution
    // Using simple service call (Clean Architecture: Action -> Service)
    const result = PermutationService.generate(validated.email, validated.page, validated.limit);

    return { success: true, data: result };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}
