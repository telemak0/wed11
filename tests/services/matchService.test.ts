import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchService } from '../../src/services/matchService';
import { playerService } from '../../src/services/playerService';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  doc,
  Timestamp
} from 'firebase/firestore';

vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...actual,
        getFirestore: vi.fn(),
        collection: vi.fn(),
        addDoc: vi.fn(),
        getDocs: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        doc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        limit: vi.fn(),
        orderBy: vi.fn(),
        serverTimestamp: vi.fn(() => 'mock-timestamp'),
        Timestamp: {
            fromDate: vi.fn((date) => date.toISOString())
        }
    };
});

vi.mock('../../src/lib/firebase', () => ({
    db: {}
}));

vi.mock('../../src/services/playerService', () => ({
    playerService: {
        getPlayerById: vi.fn()
    }
}));

describe('matchService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createMatch', () => {
        it('should create a match with initial empty teams', async () => {
            const mockRef = { id: 'match-123' };
            (addDoc as any).mockResolvedValue(mockRef);
            
            const dateStr = '2024-05-20';
            const id = await matchService.createMatch(dateStr);

            expect(addDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
                status: 'scheduled',
                teamWhite: [],
                teamRed: []
            }));
            expect(id).toBe('match-123');
        });
    });

    describe('getScheduledMatch', () => {
        it('should return the first scheduled match found', async () => {
            (getDocs as any).mockResolvedValue({
                empty: false,
                docs: [{
                    id: 'match-1',
                    data: () => ({ status: 'scheduled', date: 'mock-date' })
                }]
            });

            const match = await matchService.getScheduledMatch();
            expect(match).toEqual({ id: 'match-1', status: 'scheduled', date: 'mock-date' });
        });

        it('should return null if no scheduled match exists', async () => {
             (getDocs as any).mockResolvedValue({
                empty: true,
                docs: []
            });

            const match = await matchService.getScheduledMatch();
            expect(match).toBeNull();
        });
    });

    describe('updateLineup', () => {
        it('should update the team arrays', async () => {
            (doc as any).mockReturnValue('match-ref');
            (setDoc as any).mockResolvedValue(undefined);
            vi.spyOn(playerService, 'getPlayerById').mockResolvedValue({
                id: 'p1',
                name: 'Player 1',
                type: 'active'
            } as any);

            await matchService.updateLineup('match-1', ['p1'], ['p2']);

            expect(updateDoc).toHaveBeenCalledWith('match-ref', {
                teamWhite: ['p1'],
                teamRed: ['p2']
            });
        });
    });

    describe('closeMatch', () => {
        it('should update status to completed and set result', async () => {
            (doc as any).mockReturnValue('match-ref');
            (getDoc as any).mockResolvedValue({
                exists: () => true,
                id: 'match-1',
                data: () => ({
                    teamWhite: ['p1'],
                    teamRed: ['p2'],
                    status: 'scheduled'
                })
            });
            (updateDoc as any).mockResolvedValue(undefined);
            (setDoc as any).mockResolvedValue(undefined);
            vi.spyOn(playerService, 'getPlayerById').mockResolvedValue({
                id: 'p1',
                name: 'Player 1',
                type: 'active'
            } as any);
            
            await matchService.closeMatch('match-1', 2, 1);

            expect(updateDoc).toHaveBeenCalledWith('match-ref', {
                status: 'completed',
                statsProcessed: true,
                result: {
                    goalsWhite: 2,
                    goalsRed: 1
                }
            });
        });
    });

    describe('getMatchById', () => {
        it('should return a match if it exists', async () => {
             const mockSnapshot = {
                 exists: () => true,
                 id: 'match-1',
                 data: () => ({ status: 'scheduled' })
             };
             (getDoc as any).mockResolvedValue(mockSnapshot);

             const match = await matchService.getMatchById('match-1');
             expect(match).toEqual({ id: 'match-1', status: 'scheduled' });
        });

        it('should return null if the match does not exist', async () => {
             const mockSnapshot = {
                 exists: () => false
             };
             (getDoc as any).mockResolvedValue(mockSnapshot);

             const match = await matchService.getMatchById('match-1');
             expect(match).toBeNull();
        });
    });

    describe('deleteMatch', () => {
        it('should delete the match document', async () => {
            (doc as any).mockReturnValue('mock-doc-ref');
            (deleteDoc as any).mockResolvedValue(undefined);

            await matchService.deleteMatch('match-1');
            expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
        });
    });

    describe('updateMatchScore', () => {
        it('should update the scores of a match', async () => {
            (doc as any).mockReturnValue('mock-doc-ref');
            (updateDoc as any).mockResolvedValue(undefined);

            await matchService.updateMatchScore('match-1', 5, 3);
            
            expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', {
                result: {
                    goalsWhite: 5,
                    goalsRed: 3
                }
            });
        });
    });
});
