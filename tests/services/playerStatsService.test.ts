import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playerStatsService } from '../../src/services/playerStatsService';
import { matchService } from '../../src/services/matchService';
import { playerService } from '../../src/services/playerService';
import * as firebaseFirestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    fromDate: vi.fn()
  }
}));

vi.mock('../../src/lib/firebase', () => ({
  db: {}
}));

vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayerById: vi.fn(),
    getPlayers: vi.fn()
  }
}));

vi.mock('../../src/services/matchService', () => ({
  matchService: {
    getAllMatches: vi.fn()
  }
}));

describe('playerStatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('calculateStatsForPlayer', () => {
    it('should calculate correct stats for a player with wins', async () => {
      // Mock match data
      const mockMatches = [
        {
          id: '1',
          status: 'completed',
          teamWhite: ['player1', 'player2'],
          teamRed: ['player3'],
          result: { goalsWhite: 3, goalsRed: 1 }
        },
        {
          id: '2',
          status: 'completed',
          teamWhite: ['player1'],
          teamRed: ['player3', 'player4'],
          result: { goalsWhite: 2, goalsRed: 0 }
        }
      ];

      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue(mockMatches as any);
      vi.spyOn(playerService, 'getPlayerById').mockResolvedValue({ id: 'player1', name: 'John Doe', type: 'active' } as any);

      const stats = await playerStatsService.calculateStatsForPlayer('player1');

      expect(stats.playerId).toBe('player1');
      expect(stats.playerName).toBe('John Doe');
      expect(stats.matchesPlayed).toBe(2);
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(0);
      expect(stats.draws).toBe(0);
      expect(stats.totalPoints).toBe(6);
      expect(stats.totalGoalsScored).toBe(5);
      expect(stats.totalGoalsConceded).toBe(1);
      expect(stats.pointsPerGame).toBe(3);
      expect(stats.goalsPerGame).toBe(2.5);
      expect(stats.goalsAgainstPerGame).toBe(0.5);
    });

    it('should calculate correct stats with mixed results', async () => {
      const mockMatches = [
        {
          id: '1',
          status: 'completed',
          teamWhite: ['player1'],
          teamRed: ['player2'],
          result: { goalsWhite: 2, goalsRed: 1 } // Win for player1
        },
        {
          id: '2',
          status: 'completed',
          teamWhite: ['player1'],
          teamRed: ['player2'],
          result: { goalsWhite: 1, goalsRed: 1 } // Draw for player1
        },
        {
          id: '3',
          status: 'completed',
          teamWhite: ['player2'],
          teamRed: ['player1'],
          result: { goalsWhite: 3, goalsRed: 1 } // Loss for player1
        }
      ];

      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue(mockMatches as any);
      vi.spyOn(playerService, 'getPlayerById').mockResolvedValue({ id: 'player1', name: 'Jane Smith', type: 'active' } as any);

      const stats = await playerStatsService.calculateStatsForPlayer('player1');

      expect(stats.playerId).toBe('player1');
      expect(stats.playerName).toBe('Jane Smith');
      expect(stats.matchesPlayed).toBe(3);
      expect(stats.wins).toBe(1);
      expect(stats.draws).toBe(1);
      expect(stats.losses).toBe(1);
      expect(stats.totalPoints).toBe(4);
      expect(stats.pointsPerGame).toBeCloseTo(1.33, 1);
    });

    it('should return zero stats for player with no matches', async () => {
      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue([] as any);
      vi.spyOn(playerService, 'getPlayerById').mockResolvedValue({ id: 'player1', name: 'Test Player', type: 'active' } as any);

      const stats = await playerStatsService.calculateStatsForPlayer('player1');

      expect(stats.matchesPlayed).toBe(0);
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
      expect(stats.draws).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.totalGoalsScored).toBe(0);
      expect(stats.totalGoalsConceded).toBe(0);
      expect(stats.pointsPerGame).toBe(0);
      expect(stats.goalsPerGame).toBe(0);
      expect(stats.goalsAgainstPerGame).toBe(0);
    });

    it('should exclude incomplete matches', async () => {
      const mockMatches = [
        {
          id: '1',
          status: 'scheduled',
          teamWhite: ['player1'],
          teamRed: ['player2'],
          result: undefined
        },
        {
          id: '2',
          status: 'completed',
          teamWhite: ['player1'],
          teamRed: ['player2'],
          result: { goalsWhite: 1, goalsRed: 0 }
        }
      ];

      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue(mockMatches as any);
      vi.spyOn(playerService, 'getPlayerById').mockResolvedValue({ id: 'player1', name: 'Player One', type: 'active' } as any);

      const stats = await playerStatsService.calculateStatsForPlayer('player1');

      expect(stats.matchesPlayed).toBe(1);
      expect(stats.wins).toBe(1);
      expect(stats.totalPoints).toBe(3);
    });

    it('should handle decimal precision correctly', async () => {
      const mockMatches = Array(3).fill(null).map((_, i) => ({
        id: String(i),
        status: 'completed',
        teamWhite: ['player1'],
        teamRed: ['player2'],
        result: { goalsWhite: 1, goalsRed: 0 }
      }));

      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue(mockMatches as any);
      vi.spyOn(playerService, 'getPlayerById').mockResolvedValue({ id: 'player1', name: 'Precision Player', type: 'active' } as any);

      const stats = await playerStatsService.calculateStatsForPlayer('player1');

      expect(stats.pointsPerGame).toBe(3);
      expect(stats.goalsPerGame).toBe(1);
      expect(stats.pointsPerGame % 1).toBeLessThanOrEqual(0.01); // Check it's rounded to 2 decimals
    });
  });

  describe('getPlayerStats', () => {
    it('should filter by active players when includeOccasional is false', async () => {
      const mockStats = [
        { playerId: 'active1', playerName: 'Player 1', matchesPlayed: 5, totalPoints: 15 },
        { playerId: 'occasional1', playerName: 'Player 2', matchesPlayed: 2, totalPoints: 2 },
        { playerId: 'active2', playerName: 'Player 3', matchesPlayed: 4, totalPoints: 10 }
      ];

      const mockPlayers = [
        { id: 'active1', name: 'Player 1', type: 'active' },
        { id: 'occasional1', name: 'Player 2', type: 'occasional' },
        { id: 'active2', name: 'Player 3', type: 'active' }
      ];

      let callCount = 0;
      vi.spyOn(firebaseFirestore, 'getDocs').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for stats
          return Promise.resolve({
            docs: mockStats.map(s => ({
              id: s.playerId,
              data: () => s
            }))
          } as any);
        } else {
          // Second call for players
          return Promise.resolve({
            docs: mockPlayers.map(p => ({
              id: p.id,
              data: () => p
            }))
          } as any);
        }
      });

      vi.spyOn(playerService, 'getPlayers').mockResolvedValue(mockPlayers as any);

      const stats = await playerStatsService.getPlayerStats(false);

      expect(stats).toHaveLength(2);
      expect(stats.map(s => s.playerId)).toEqual(['active1', 'active2']);
    });

    it('should include all players when includeOccasional is true', async () => {
      const mockStats = [
        { playerId: 'active1', playerName: 'Player 1', matchesPlayed: 5, totalPoints: 15 },
        { playerId: 'occasional1', playerName: 'Player 2', matchesPlayed: 2, totalPoints: 2 }
      ];

      const mockPlayers = [
        { id: 'active1', name: 'Player 1', type: 'active' },
        { id: 'occasional1', name: 'Player 2', type: 'occasional' }
      ];

      let callCount = 0;
      vi.spyOn(firebaseFirestore, 'getDocs').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for stats
          return Promise.resolve({
            docs: mockStats.map(s => ({
              id: s.playerId,
              data: () => s
            }))
          } as any);
        } else {
          // Second call for players (not actually used when includeOccasional=true)
          return Promise.resolve({
            docs: mockPlayers.map(p => ({
              id: p.id,
              data: () => p
            }))
          } as any);
        }
      });

      vi.spyOn(playerService, 'getPlayers').mockResolvedValue(mockPlayers as any);

      const stats = await playerStatsService.getPlayerStats(true);

      expect(stats).toHaveLength(2);
    });

    it('should provide default values for missing numeric fields', async () => {
      const mockStats = [
        { playerId: 'player1', playerName: 'Player 1' }, // Missing all numeric fields
        { playerId: 'player2', playerName: 'Player 2', matchesPlayed: 5, totalPoints: 15 } // Partial data
      ];

      const mockPlayers = [
        { id: 'player1', name: 'Player 1', type: 'active' },
        { id: 'player2', name: 'Player 2', type: 'active' }
      ];

      let callCount = 0;
      vi.spyOn(firebaseFirestore, 'getDocs').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            docs: mockStats.map(s => ({
              id: s.playerId,
              data: () => s
            }))
          } as any);
        } else {
          return Promise.resolve({
            docs: mockPlayers.map(p => ({
              id: p.id,
              data: () => p
            }))
          } as any);
        }
      });

      vi.spyOn(playerService, 'getPlayers').mockResolvedValue(mockPlayers as any);

      const stats = await playerStatsService.getPlayerStats(false);

      expect(stats).toHaveLength(2);
      
      // Player 1 should have all zero defaults
      const player1Stats = stats.find(s => s.playerId === 'player1');
      expect(player1Stats?.matchesPlayed).toBe(0);
      expect(player1Stats?.pointsPerGame).toBe(0);
      expect(player1Stats?.goalsPerGame).toBe(0);
      expect(player1Stats?.goalsAgainstPerGame).toBe(0);
      
      // Player 2 should preserve provided values and default for missing ones
      const player2Stats = stats.find(s => s.playerId === 'player2');
      expect(player2Stats?.matchesPlayed).toBe(5);
      expect(player2Stats?.totalPoints).toBe(15);
      expect(player2Stats?.wins).toBe(0); // Default for missing field
    });
  });

  describe('updatePlayerStats', () => {
    it('should save calculated stats to database', async () => {
      const mockMatches = [
        {
          id: '1',
          status: 'completed',
          teamWhite: ['player1'],
          teamRed: ['player2'],
          result: { goalsWhite: 2, goalsRed: 0 }
        }
      ];

      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue(mockMatches as any);
      const setDocSpy = vi.spyOn(firebaseFirestore, 'setDoc').mockResolvedValue();

      await playerStatsService.updatePlayerStats('player1');

      expect(setDocSpy).toHaveBeenCalled();
      const callArgs = setDocSpy.mock.calls[0];
      const statsData = callArgs[1];
      
      expect(statsData.playerId).toBe('player1');
      expect(statsData.matchesPlayed).toBe(1);
      expect(statsData.wins).toBe(1);
      expect(statsData.totalPoints).toBe(3);
    });
  });

  describe('ensureStatsExistForPlayer', () => {
    it('should create zero stats document if missing', async () => {
      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue([] as any);
      const setDocSpy = vi.spyOn(firebaseFirestore, 'setDoc').mockResolvedValue();

      await playerStatsService.ensureStatsExistForPlayer('newplayer');

      expect(setDocSpy).toHaveBeenCalled();
      const statsData = setDocSpy.mock.calls[0][1];
      
      expect(statsData.playerId).toBe('newplayer');
      expect(statsData.matchesPlayed).toBe(0);
      expect(statsData.totalPoints).toBe(0);
    });
  });

  describe('recalculateAllStats', () => {
    it('should recalculate stats for all players', async () => {
      const mockPlayers = [
        { id: 'player1', name: 'Player 1', type: 'active' },
        { id: 'player2', name: 'Player 2', type: 'active' }
      ];

      vi.spyOn(playerService, 'getPlayers').mockResolvedValue(mockPlayers as any);
      vi.spyOn(matchService, 'getAllMatches').mockResolvedValue([] as any);
      const updateSpy = vi.spyOn(playerStatsService, 'updatePlayerStats').mockResolvedValue();

      await playerStatsService.recalculateAllStats();

      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith('player1');
      expect(updateSpy).toHaveBeenCalledWith('player2');
    });
  });
});
