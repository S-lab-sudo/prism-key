/**
 * PrismKey Vault Store
 *
 * Implements:
 * - AES-GCM client-side encryption for password values
 * - Offline-first sync with Supabase
 * - Pending deletes queue to prevent zombie items
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { VaultItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";

// In-memory only: NEVER persisted
let masterPassword: string | null = null;

export function setMasterPassword(password: string) {
  masterPassword = password;
}

export function clearMasterPassword() {
  masterPassword = null;
}

export function hasMasterPassword(): boolean {
  return masterPassword !== null;
}

interface VaultState {
  items: VaultItem[];
  pendingDeletes: string[];
  isUnlocked: boolean;
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => Promise<boolean>;
  updateItem: (id: string, updates: Partial<VaultItem>) => Promise<boolean>;
  removeItem: (id: string) => Promise<void>;
  decryptItemValue: (encryptedValue: string) => Promise<string>;
  syncWithSupabase: () => Promise<void>;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => void;

  permutatorState: {
    email: string;
    results: string[];
    page: number;
    totalPages: number;
    total: number;
  };
  setPermutatorState: (state: Partial<VaultState["permutatorState"]>) => void;
}

const supabase = createClient();

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      items: [],
      pendingDeletes: [],
      isUnlocked: false,

      addItem: async (item) => {
        if (!masterPassword) {
          console.error("Cannot add item: Vault is locked.");
          return false;
        }

        const id = crypto.randomUUID();
        // Encrypt the password value before storing
        const encryptedValue = await encrypt(item.value, masterPassword);

        const newItem = {
          ...item,
          id,
          value: encryptedValue, // Store encrypted
          createdAt: Date.now(),
        };

        set((state) => ({ items: [newItem, ...state.items] }));

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await supabase.from("vault_items").insert({
            id: newItem.id,
            user_id: session.user.id,
            label: newItem.label,
            username: newItem.username,
            value: newItem.value, // Already encrypted
            strength: newItem.strength,
            created_at: new Date(newItem.createdAt).toISOString(),
          });
          if (error) {
            console.error("Failed to sync item:", error);
            // We still return true because it's saved locally
          }
        }
        return true;
      },

      removeItem: async (id: string) => {
        // Optimistically remove locally
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
        
        // Ensure it's in the pending queue regardless, so sync handles it if the immediate call fails
        set((state) => ({ pendingDeletes: [...new Set([...state.pendingDeletes, id])] }));

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await supabase
            .from('vault_items')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id); // Explicitly include user_id for RLS safety
          
          if (!error) {
            // If successful, remove from pending queue
            set((state) => ({ pendingDeletes: state.pendingDeletes.filter(d => d !== id) }));
          } else {
            console.error('Failed to delete item from Supabase:', error);
          }
        }
      },

      updateItem: async (id: string, updates: Partial<VaultItem>) => {
        const { items } = get();
        const item = items.find(i => i.id === id);
        if (!item || !masterPassword) return false;

        const updatedItem = { ...item, ...updates };
        
        // If password value is updated, re-encrypt it
        if (updates.value && updates.value !== item.value) {
            updatedItem.value = await encrypt(updates.value, masterPassword);
        }

        set((state) => ({
            items: state.items.map(i => i.id === id ? updatedItem : i)
        }));

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { error } = await supabase.from('vault_items').upsert({
                id: updatedItem.id,
                user_id: session.user.id,
                label: updatedItem.label,
                username: updatedItem.username,
                value: updatedItem.value,
                strength: updatedItem.strength,
                updated_at: new Date().toISOString()
            });
            if (error) console.error('Failed to sync update:', error);
        }
        return true;
      },
      
      setItems: (items: VaultItem[]) => set({ items }),

      decryptItemValue: async (encryptedValue: string) => {
        if (!masterPassword) {
          throw new Error('Vault is locked. Cannot decrypt.');
        }
        if (!isEncrypted(encryptedValue)) {
          return encryptedValue;
        }
        return decrypt(encryptedValue, masterPassword);
      },

      unlockVault: async (password: string) => {
        setMasterPassword(password);
        set({ isUnlocked: true });
        // Trigger sync after unlock
        await get().syncWithSupabase();
        return true;
      },

      lockVault: () => {
        clearMasterPassword();
        set({ isUnlocked: false, items: [], pendingDeletes: [] });
      },

      syncWithSupabase: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Step 1: Process pending deletions
        const pendingDeletes = get().pendingDeletes;
        if (pendingDeletes.length > 0) {
          for (const id of pendingDeletes) {
            const { error } = await supabase
                .from("vault_items")
                .delete()
                .eq("id", id)
                .eq("user_id", session.user.id);
            
            if (!error) {
                // Remove from queue only on success
                set((state) => ({ 
                    pendingDeletes: state.pendingDeletes.filter(d => d !== id) 
                }));
            } else {
                console.error(`Sync fail for delete ${id}:`, error);
            }
          }
        }

        // Step 2: Upsert local items (ONLY items not slated for deletion)
        const localItems = get().items;
        // Re-read pendingDeletes in case Step 1 failed partially (unlikely but safe)
        const stillPending = get().pendingDeletes;
        
        const itemsToPush = localItems.filter(item => !stillPending.includes(item.id));

        if (itemsToPush.length > 0) {
          const toUpsert = itemsToPush.map((item) => ({
            id: item.id,
            user_id: session.user.id,
            label: item.label,
            username: item.username,
            value: item.value, // Already encrypted locally
            strength: item.strength,
            created_at: new Date(item.createdAt).toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error: upsertError } = await supabase
            .from("vault_items")
            .upsert(toUpsert, { onConflict: "id", ignoreDuplicates: false });

          if (upsertError) {
            console.error("Failed to upsert local items:", upsertError);
          }
        }

        // Step 3: Fetch from server (values are encrypted in DB)
        const { data, error } = await supabase
          .from("vault_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && !error) {
          // Re-re-read pendingDeletes to be absolutely sure we don't restore something we just deleted
          const finalPending = get().pendingDeletes;
          
          const mapped: VaultItem[] = data
            .filter((d: any) => !finalPending.includes(d.id)) // CRITICAL: Filter out pending deletes from server results
            .map((d: any) => ({
              id: d.id,
              label: d.label,
              username: d.username,
              value: d.value, // Still encrypted
              strength: d.strength,
              createdAt: new Date(d.created_at).getTime(),
            }));
          set({ items: mapped });
        }
      },

      permutatorState: {
        email: "",
        results: [],
        page: 0,
        totalPages: 0,
        total: 0,
      },
      setPermutatorState: (newState) =>
        set((state) => ({
          permutatorState: { ...state.permutatorState, ...newState },
        })),
    }),
    {
      name: "prism-key-vault",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive metadata, items are encrypted
        items: state.items,
        pendingDeletes: state.pendingDeletes,
        permutatorState: state.permutatorState,
      }),
    },
  ),
);

/**
 * Helper to decrypt a vault item's value for display.
 * Call this only when needed (e.g., copy to clipboard, show password).
 */
export async function decryptVaultValue(
  encryptedValue: string,
): Promise<string> {
  if (!masterPassword) {
    throw new Error("Vault is locked. Cannot decrypt.");
  }
  if (!isEncrypted(encryptedValue)) {
    // Legacy plaintext value, return as-is
    return encryptedValue;
  }
  return decrypt(encryptedValue, masterPassword);
}
