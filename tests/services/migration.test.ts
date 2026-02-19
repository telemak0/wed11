import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migratePlayersAddCodes, migratePlayersAddNicknames } from '../../src/services/migration';
import { generatePlayerCode } from '../../src/utils/code-generator';

// Mock firebase
vi.mock('../../src/lib/firebase', () => ({
  db: {},
}));

// Mock services
vi.mock('../../src/utils/code-generator', () => ({
  generatePlayerCode: vi.fn(() => '5678'),
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => {
  const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
  const mockGetDocs = vi.fn();
  const mockDoc = vi.fn((db, collection, id) => `doc_${id}`);
  const mockCollection = vi.fn((db, name) => `collection_${name}`);

  return {
    collection: mockCollection,
    getDocs: mockGetDocs,
    updateDoc: mockUpdateDoc,
    doc: mockDoc,
  };
});

let mockUpdateDoc: any;
let mockGetDocs: any;
let mockDoc: any;
let mockCollection: any;

// These need to be reassigned after the module is loaded
import('firebase/firestore').then((module) => {
  mockCollection = vi.mocked((module as any).collection);
  mockGetDocs = vi.mocked((module as any).getDocs);
  mockUpdateDoc = vi.mocked((module as any).updateDoc);
  mockDoc = vi.mocked((module as any).doc);
});

describe('Player Code Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should migrate players without codes', async () => {
    // Mock players: one with code, one without
    const mockDocs = [
      {
        id: 'player-1',
        data: () => ({ name: 'John', loginCode: '1234' }),
      },
      {
        id: 'player-2',
        data: () => ({ name: 'Jane', loginCode: '' }),
      },
      {
        id: 'player-3',
        data: () => ({ name: 'Jack', loginCode: undefined }),
      },
    ];

    mockGetDocs.mockResolvedValue({
      docs: mockDocs,
      size: 3,
    });

    const result = await migratePlayersAddCodes();

    // Should have migrated 2 players (player-2 and player-3)
    expect(result.migrated).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.total).toBe(3);

    // Should have called updateDoc twice
    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockUpdateDoc).toHaveBeenCalledWith(`doc_player-2`, {
      loginCode: '5678',
    });
    expect(mockUpdateDoc).toHaveBeenCalledWith(`doc_player-3`, {
      loginCode: '5678',
    });

    // Should have generated codes
    expect(vi.mocked(generatePlayerCode)).toHaveBeenCalledTimes(2);
  });

  it('should handle empty player collection', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [],
      size: 0,
    });

    const result = await migratePlayersAddCodes();

    expect(result.migrated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(0);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('should skip all players with existing codes', async () => {
    const mockDocs = [
      {
        id: 'player-1',
        data: () => ({ name: 'John', loginCode: '1234' }),
      },
      {
        id: 'player-2',
        data: () => ({ name: 'Jane', loginCode: '5678' }),
      },
    ];

    mockGetDocs.mockResolvedValue({
      docs: mockDocs,
      size: 2,
    });

    const result = await migratePlayersAddCodes();

    expect(result.migrated).toBe(0);
    expect(result.skipped).toBe(2);
    expect(result.total).toBe(2);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('should throw error on firebase failure', async () => {
    const error = new Error('Firebase error');
    mockGetDocs.mockRejectedValue(error);

    await expect(migratePlayersAddCodes()).rejects.toThrow('Firebase error');
  });

  it('should be idempotent - running twice is safe', async () => {
    const mockDocs = [
      {
        id: 'player-1',
        data: () => ({ name: 'John', loginCode: undefined }),
      },
    ];

    mockGetDocs.mockResolvedValue({
      docs: mockDocs,
      size: 1,
    });

    // First run - migrates
    const result1 = await migratePlayersAddCodes();
    expect(result1.migrated).toBe(1);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    // Reset mocks
    vi.clearAllMocks();
    mockUpdateDoc.mockResolvedValue(undefined);

    // Second run with same data but now player has code
    const mockDocs2 = [
      {
        id: 'player-1',
        data: () => ({ name: 'John', loginCode: '5678' }),
      },
    ];

    mockGetDocs.mockResolvedValue({
      docs: mockDocs2,
      size: 1,
    });

    const result2 = await migratePlayersAddCodes();
    expect(result2.migrated).toBe(0);
    expect(result2.skipped).toBe(1);
    expect(mockUpdateDoc).not.toHaveBeenCalled(); // Should not update existing codes
  });
});
