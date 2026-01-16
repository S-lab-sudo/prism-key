import { PermutationResult } from "@/types";

export class PermutationService {
  /**
   * Generates dot-permutations for a given Gmail address.
   * Leverages bitwise logic to be performant.
   */
  static generate(email: string, page: number = 0, limit: number = 100): PermutationResult {
    const [rawLocal, domain] = email.split('@');
    // Strip existing dots to get the base identity
    const localPart = rawLocal.replace(/\./g, '');
    
    // Safety check: Don't grind the CPU for massive strings
    if (localPart.length > 30) {
      throw new Error("Username part is too long for permutation.");
    }

    const len = localPart.length;
    // Total combinations = 2^(len-1)
    const combinations = 1 << (len - 1);
    
    // Helper to generate specific index
    const getVariant = (i: number): string => {
      let variant = "";
      for (let j = 0; j < len; j++) {
        variant += localPart[j];
        if (j < len - 1 && (i & (1 << j))) {
          variant += "."; // Insert dot if bit at j is 1
        }
      }
      return `${variant}@${domain}`;
    };

    const variants: string[] = [];
    
    // Pagination Logic
    // Start index for this page
    const start = page * limit;
    // End index
    const end = Math.min(start + limit, combinations);

    if (start >= combinations) {
        return { variants: [], total: combinations, page, totalPages: Math.ceil(combinations / limit) };
    }

    for (let i = start; i < end; i++) {
        variants.push(getVariant(i));
    }

    return {
      variants,
      total: combinations,
      page,
      totalPages: Math.ceil(combinations / limit),
    };
  }
}
