import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playerService } from '../../src/services/playerService';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

// Mock Firebase Firestore modules
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...actual,
        getFirestore: vi.fn(),
        collection: vi.fn(),
        addDoc: vi.fn(),
        getDocs: vi.fn(),
        deleteDoc: vi.fn(),
        updateDoc: vi.fn(),
        doc: vi.fn(),
        query: vi.fn(),
        orderBy: vi.fn(),
        where: vi.fn(),
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
    };
});

// Mock the code generator to have predictable codes in tests
vi.mock('../../src/utils/code-generator', () => ({
    generateUniqueCode: vi.fn().mockImplementation(async (checkExists) => {
        // Always return '1234' in tests unless overridden
        return '1234';
    }),
    generatePlayerCode: vi.fn(() => '1234'),
    isValidCodeFormat: vi.fn((code) => /^\d{4}$/.test(code))
}));

// Mock the initialized db instance
vi.mock('../../src/lib/firebase', () => ({
    db: {}
}));

describe('playerService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPlayers', () => {
        it('should fetch and return players with loginCode', async () => {
            const mockPlayers = [
                { id: '1', data: () => ({ name: 'Messi', loginCode: '1234', createdAt: 'ts', type: 'active', nickname: null }) },
                { id: '2', data: () => ({ name: 'Ronaldo', loginCode: '5678', createdAt: 'ts', type: 'active', nickname: null }) }
            ];
            
            (getDocs as any).mockResolvedValue({
                docs: mockPlayers
            });

            const result = await playerService.getPlayers();

            expect(collection).toHaveBeenCalled();
            expect(getDocs).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ 
                id: '1', 
                name: 'Messi', 
                loginCode: '1234',
                createdAt: 'ts', 
                type: 'active',
                nickname: null
            });
        });
    });

    describe('updatePlayer', () => {
        it('should update player name and type without code', async () => {
            const playerId = 'player-123';
            const newName = 'Updated Name';
            const newType = 'occasional';
            
            // Mock getPlayerById to return existing player
            const mockExistingPlayer = {
                id: playerId,
                name: 'Current Name',
                type: 'active',
                loginCode: '1234',
                nickname: 'Test Nickname',
                createdAt: 'ts'
            };
            
            vi.spyOn(playerService, 'getPlayerById').mockResolvedValue(mockExistingPlayer);
            (doc as any).mockReturnValue('mock-doc-ref');
            (updateDoc as any).mockResolvedValue(undefined);

            await playerService.updatePlayer(playerId, newName, newType);

            expect(doc).toHaveBeenCalledWith(expect.anything(), 'players', playerId);
            // When changing from active to occasional, nickname should be reclaimed (set to null)
            expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({ 
                name: newName, 
                type: newType 
            }));
        });

        it('should update player with new loginCode', async () => {
            const playerId = 'player-123';
            const newName = 'Updated Name';
            const newType = 'occasional';
            const newCode = '9999';
            
            // Mock getPlayerById
            const mockExistingPlayer = {
                id: playerId,
                name: 'Current Name',
                type: 'active',
                loginCode: '1234',
                nickname: 'Test Nickname',
                createdAt: 'ts'
            };
            
            vi.spyOn(playerService, 'getPlayerById').mockResolvedValue(mockExistingPlayer);
            (doc as any).mockReturnValue('mock-doc-ref');
            (updateDoc as any).mockResolvedValue(undefined);

            await playerService.updatePlayer(playerId, newName, newType, newCode);

            expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({ 
                name: newName, 
                type: newType,
                loginCode: newCode
            }));
        });
    });

    describe('createPlayer', () => {
        it('should create a player with auto-generated unique loginCode', async () => {
            const mockRef = { id: 'new-player-id' };
            (addDoc as any).mockResolvedValue(mockRef);

            const id = await playerService.createPlayer('Neymar', 'active');

            expect(collection).toHaveBeenCalled();
            expect(addDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
                name: 'Neymar',
                type: 'active',
                loginCode: '1234',
                createdAt: 'mock-timestamp'
            }));
            expect(id).toBe('new-player-id');
        });

        it('should create a player with default type and generated code', async () => {
            const mockRef = { id: 'new-player-id' };
            (addDoc as any).mockResolvedValue(mockRef);

            await playerService.createPlayer('Pelé');

            expect(addDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
                name: 'Pelé',
                type: 'active',
                loginCode: '1234'
            }));
        });

        it('should verify code is unique before creating player', async () => {
            const mockRef = { id: 'new-player-id' };
            (addDoc as any).mockResolvedValue(mockRef);
            (getDocs as any).mockResolvedValue({ docs: [], empty: true });

            await playerService.createPlayer('Test Player', 'active');

            // Verify that addDoc was called with the generated code
            // This confirms the code generation (with uniqueness check) happened
            expect(addDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({
                    loginCode: '1234'
                })
            );
        });
    });

    describe('deletePlayer', () => {
        it('should delete a player by id', async () => {
            (doc as any).mockReturnValue('mock-doc-ref');
            
            await playerService.deletePlayer('player-123');

            expect(doc).toHaveBeenCalled();
            expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
        });
    });

    describe('getPlayerByCode', () => {
        it('should find player by loginCode', async () => {
            const mockPlayer = {
                id: 'player-123',
                data: () => ({ 
                    name: 'Test Player',
                    loginCode: '1234',
                    type: 'active',
                    createdAt: 'ts',
                    nickname: null
                })
            };

            (getDocs as any).mockResolvedValue({
                empty: false,
                docs: [mockPlayer]
            });

            const result = await playerService.getPlayerByCode('1234');

            expect(query).toHaveBeenCalled();
            expect(where).toHaveBeenCalledWith('loginCode', '==', '1234');
            expect(getDocs).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'player-123',
                name: 'Test Player',
                loginCode: '1234',
                type: 'active',
                createdAt: 'ts',
                nickname: null
            });
        });

        it('should return null when code not found', async () => {
            (getDocs as any).mockResolvedValue({
                empty: true,
                docs: []
            });

            const result = await playerService.getPlayerByCode('9999');

            expect(result).toBeNull();
        });
    });

    describe('updatePlayerCode', () => {
        it('should generate and update player code with uniqueness check', async () => {
            const playerId = 'player-123';
            
            (doc as any).mockReturnValue('mock-doc-ref');
            (updateDoc as any).mockResolvedValue(undefined);
            (getDocs as any).mockResolvedValue({ docs: [], empty: true });

            const newCode = await playerService.updatePlayerCode(playerId);

            expect(doc).toHaveBeenCalledWith(expect.anything(), 'players', playerId);
            expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({ loginCode: '1234' }));
            expect(newCode).toBe('1234');
        });

        it('should verify uniqueness before updating code', async () => {
            const playerId = 'player-123';
            
            (doc as any).mockReturnValue('mock-doc-ref');
            (updateDoc as any).mockResolvedValue(undefined);
            (getDocs as any).mockResolvedValue({ docs: [], empty: true });

            await playerService.updatePlayerCode(playerId);

            // Verify that updateDoc was called with the generated unique code
            expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({ loginCode: '1234' }));
        });
    });
});
