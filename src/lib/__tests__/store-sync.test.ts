/**
 * Vault Store Tests
 * 
 * Tests the ACTUAL useVaultStore from src/lib/store.ts
 * with properly mocked Supabase client using vi.hoisted().
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Use vi.hoisted to define mocks that can be used in vi.mock
const { mockInsert, mockDeleteEq, mockDelete, mockUpsert, mockOrder, mockSelect, mockGetSession } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockDeleteEq: vi.fn().mockResolvedValue({ error: null }),
  mockDelete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  mockUpsert: vi.fn().mockResolvedValue({ error: null }),
  mockOrder: vi.fn().mockResolvedValue({ data: [], error: null }),
  mockSelect: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
  mockGetSession: vi.fn().mockResolvedValue({
    data: { session: { user: { id: 'test-user-123' } } },
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
    from: vi.fn(() => ({
      insert: mockInsert,
      delete: () => ({ eq: mockDeleteEq }),
      upsert: mockUpsert,
      select: () => ({ order: mockOrder }),
    })),
  }),
}));

// Mock crypto for encryption
vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn((value: string) => Promise.resolve(`encrypted_${value}`)),
  decrypt: vi.fn((value: string) => Promise.resolve(value.replace('encrypted_', ''))),
  isEncrypted: vi.fn(() => true),
}));

// Now import the store AFTER mocks are set up
import { useVaultStore, setMasterPassword, clearMasterPassword } from '@/lib/store';

describe('Vault Store - Production Code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useVaultStore.setState({ items: [], pendingDeletes: [], isUnlocked: false });
    // Set master password for encryption
    setMasterPassword('test-master-password');
    // Reset mock implementations
    mockDeleteEq.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    clearMasterPassword();
  });

  describe('addItem', () => {
    it('adds item to local state optimistically', async () => {
      const { result } = renderHook(() => useVaultStore());
      
      await act(async () => {
        await result.current.addItem({
          label: 'Test Label',
          username: 'test@example.com',
          value: 'test-password',
          strength: 'Strong',
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].label).toBe('Test Label');
      expect(result.current.items[0].username).toBe('test@example.com');
    });

    it('generates unique UUID for each item', async () => {
      const { result } = renderHook(() => useVaultStore());
      
      await act(async () => {
        await result.current.addItem({
          label: 'Item 1',
          username: 'user1@test.com',
          value: 'pass1',
          strength: 'Strong',
        });
        await result.current.addItem({
          label: 'Item 2',
          username: 'user2@test.com',
          value: 'pass2',
          strength: 'Strong',
        });
      });

      expect(result.current.items[0].id).not.toBe(result.current.items[1].id);
    });
  });

  describe('removeItem', () => {
    it('removes item from local state', async () => {
      const { result } = renderHook(() => useVaultStore());
      
      // Add an item first
      await act(async () => {
        await result.current.addItem({
          label: 'To Delete',
          username: 'delete@test.com',
          value: 'password',
          strength: 'Strong',
        });
      });
      
      const itemId = result.current.items[0].id;
      
      await act(async () => {
        await result.current.removeItem(itemId);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('pendingDeletes queue', () => {
    it('queues delete when Supabase delete fails', async () => {
      // Make the delete fail
      mockDeleteEq.mockResolvedValueOnce({ error: new Error('Network error') });

      const { result } = renderHook(() => useVaultStore());
      
      // Add item
      await act(async () => {
        await result.current.addItem({
          label: 'Will Fail Delete',
          username: 'fail@test.com',
          value: 'password',
          strength: 'Strong',
        });
      });
      
      const itemId = result.current.items[0].id;
      
      // Try to delete - should fail and queue
      await act(async () => {
        await result.current.removeItem(itemId);
      });

      // Item should be removed from local state
      expect(result.current.items).toHaveLength(0);
      // But ID should be in pendingDeletes
      expect(result.current.pendingDeletes).toContain(itemId);
    });
  });

  describe('setItems', () => {
    it('replaces all items', () => {
      const { result } = renderHook(() => useVaultStore());
      
      act(() => {
        result.current.setItems([
          { id: '1', label: 'A', username: 'a@test.com', value: 'pass', strength: 'Strong', createdAt: Date.now() },
          { id: '2', label: 'B', username: 'b@test.com', value: 'pass', strength: 'Strong', createdAt: Date.now() },
        ]);
      });

      expect(result.current.items).toHaveLength(2);
    });
  });
});
