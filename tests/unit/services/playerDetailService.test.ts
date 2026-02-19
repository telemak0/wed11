import { describe, it, expect, beforeEach, vi } from 'vitest';
import { playerDetailService } from '../../../src/services/playerDetailService';
import { matchService } from '../../../src/services/matchService';
import { playerService } from '../../../src/services/playerService';
import { Match, Player } from '../../../src/types';

vi.mock('../../../src/services/matchService');
vi.mock('../../../src/services/playerService');

describe('playerDetailService', () => {
  const mockPlayer: Player = { id: 'player1', name: 'John Doe', type: 'active', loginCode: '1234', createdAt: new Date() };
  const mockTeammate: Player = { id: 'player2', name: 'Jane Smith', type: 'active', loginCode: '5678', createdAt: new Date() };
  const mockOpponent: Player = { id: 'player3', name: 'Bob Johnson', type: 'active', loginCode: '9012', createdAt: new Date() };

  const mockMatches: Match[] = [
    {
      id: 'match1',
      date: new Date('2024-01-01'),
      teamWhite: ['player1', 'player2'],
      teamRed: ['player3', 'player4'],
      status: 'completed',
      result: { goalsWhite: 2, goalsRed: 1 },
      statsProcessed: true
    },
    {
      id: 'match2',
      date: new Date('2024-01-02'),
      teamWhite: ['player3'],
      teamRed: ['player1', 'player2'],
      status: 'completed',
      result: { goalsWhite: 1, goalsRed: 1 },
      statsProcessed: true
    },
    {
      id: 'match3',
      date: new Date('2024-01-03'),
      teamWhite: ['player1', 'player3'],
      teamRed: ['player2', 'player4'],
      status: 'completed',
      result: { goalsWhite: 0, goalsRed: 3 },
      statsProcessed: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTopTeammates', () => {
    it('returns teammates sorted by games played', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([
        mockPlayer,
        mockTeammate,
        mockOpponent,
        { id: 'player4', name: 'Alice Brown', type: 'active', createdAt: new Date() }
      ]);

      const result = await playerDetailService.getTopTeammates('player1');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].playerId).toBe('player2'); // player2 appears in 2 matches (match1, match2)
      expect(result[0].gamesPlayed).toBe(2);
    });

    it('includes winrate field in teammates', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([
        mockPlayer,
        mockTeammate,
        mockOpponent,
        { id: 'player4', name: 'Alice Brown', type: 'active', createdAt: new Date() }
      ]);

      const result = await playerDetailService.getTopTeammates('player1');

      expect(result[0]).toHaveProperty('winrate');
      expect(typeof result[0].winrate).toBe('number');
    });

    it('calculates correct winrate for teammates', async () => {
      // player1 and player2 play together in 2 matches:
      // match1: player1 white, player2 white, win (2-1)
      // match2: player1 red, player2 red, draw (1-1)
      // Expected winrate: 1 win / 2 games = 50%
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([
        mockPlayer,
        mockTeammate,
        mockOpponent,
        { id: 'player4', name: 'Alice Brown', type: 'active', createdAt: new Date() }
      ]);

      const result = await playerDetailService.getTopTeammates('player1');

      expect(result[0].winrate).toBe(50); // 1 win out of 2 games
    });

    it('returns 0 winrate when no games played together', async () => {
      const matchesNoTeammates: Match[] = [
        {
          id: 'match1',
          date: new Date('2024-01-01'),
          teamWhite: ['player1'],
          teamRed: ['player3'],
          status: 'completed',
          result: { goalsWhite: 2, goalsRed: 1 },
          statsProcessed: true
        }
      ];

      vi.mocked(matchService.getAllMatches).mockResolvedValue(matchesNoTeammates);
      vi.mocked(playerService.getPlayers).mockResolvedValue([mockPlayer, mockOpponent]);

      const result = await playerDetailService.getTopTeammates('player1');

      expect(result).toHaveLength(0);
    });

    it('respects the limit parameter', async () => {
      const manyMatches: Match[] = Array.from({ length: 15 }, (_, i) => ({
        id: `match${i}`,
        date: new Date(),
        teamWhite: ['player1', `teammate${i}`],
        teamRed: ['opp1'],
        status: 'completed' as const,
        result: { goalsWhite: 1, goalsRed: 0 },
        statsProcessed: true
      }));

      vi.mocked(matchService.getAllMatches).mockResolvedValue(manyMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue(
        Array.from({ length: 16 }, (_, i) => ({
          id: i === 0 ? 'player1' : `teammate${i - 1}`,
          name: `Player ${i}`,
          type: 'active',
          createdAt: new Date()
        }))
      );

      const result = await playerDetailService.getTopTeammates('player1', 5);

      expect(result).toHaveLength(5);
    });

    it('returns empty array when player has no matches', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([mockPlayer, mockTeammate]);

      const result = await playerDetailService.getTopTeammates('nonexistent');

      expect(result).toEqual([]);
    });

    it('handles unknown players in teammate list', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([mockPlayer, mockTeammate]);

      const result = await playerDetailService.getTopTeammates('player1');

      const unknownTeammate = result.find(t => t.playerName === 'Unknown Player');
      expect(unknownTeammate).toBeDefined();
    });
  });

  describe('getTopOpponents', () => {
    it('returns opponents sorted by games played', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([
        mockPlayer,
        mockTeammate,
        mockOpponent,
        { id: 'player4', name: 'Alice Brown', type: 'active', createdAt: new Date() }
      ]);

      const result = await playerDetailService.getTopOpponents('player1');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].playerId).toBe('player3');
    });

    it('includes winrate field in opponents', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([
        mockPlayer,
        mockTeammate,
        mockOpponent,
        { id: 'player4', name: 'Alice Brown', type: 'active', createdAt: new Date() }
      ]);

      const result = await playerDetailService.getTopOpponents('player1');

      expect(result[0]).toHaveProperty('winrate');
      expect(typeof result[0].winrate).toBe('number');
    });

    it('calculates correct winrate against opponents', async () => {
      // player1 plays against player3 in 2 matches:
      // match1: player1 white, player3 red, win (2-1)
      // match3: player1 white, player3 white - they're on same team, shouldn't count
      // match2: player1 red vs player3 white, draw (1-1)
      // Expected winrate: 1 win / 2 games = 50%
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue([
        mockPlayer,
        mockTeammate,
        mockOpponent,
        { id: 'player4', name: 'Alice Brown', type: 'active', createdAt: new Date() }
      ]);

      const result = await playerDetailService.getTopOpponents('player1');

      expect(result[0].winrate).toBe(50); // 1 win out of 2 games
    });

    it('respects the limit parameter', async () => {
      const manyMatches: Match[] = Array.from({ length: 15 }, (_, i) => ({
        id: `match${i}`,
        date: new Date(),
        teamWhite: ['player1'],
        teamRed: [`opponent${i}`],
        status: 'completed' as const,
        result: { goalsWhite: 1, goalsRed: 0 },
        statsProcessed: true
      }));

      vi.mocked(matchService.getAllMatches).mockResolvedValue(manyMatches);
      vi.mocked(playerService.getPlayers).mockResolvedValue(
        Array.from({ length: 16 }, (_, i) => ({
          id: i === 0 ? 'player1' : `opponent${i - 1}`,
          name: `Player ${i}`,
          type: 'active',
          createdAt: new Date()
        }))
      );

      const result = await playerDetailService.getTopOpponents('player1', 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('getTeamDistribution', () => {
    it('calculates white vs red appearances', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);

      const result = await playerDetailService.getTeamDistribution('player1');

      expect(result).toEqual({ white: 2, red: 1 });
    });

    it('returns zeros for player with no matches', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);

      const result = await playerDetailService.getTeamDistribution('nonexistent');

      expect(result).toEqual({ white: 0, red: 0 });
    });
  });

  describe('getResultDistribution', () => {
    it('calculates wins, draws, and losses', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);

      const result = await playerDetailService.getResultDistribution('player1');

      expect(result.wins).toBe(1); // match1: 2-1
      expect(result.draws).toBe(1); // match2: 1-1
      expect(result.losses).toBe(1); // match3: 0-3
    });

    it('returns zeros for player with no matches', async () => {
      vi.mocked(matchService.getAllMatches).mockResolvedValue(mockMatches);

      const result = await playerDetailService.getResultDistribution('nonexistent');

      expect(result).toEqual({ wins: 0, draws: 0, losses: 0 });
    });

    it('ignores matches without results', async () => {
      const matchesWithoutResult: Match[] = [
        {
          id: 'match1',
          date: new Date(),
          teamWhite: ['player1'],
          teamRed: ['player2'],
          status: 'completed',
          statsProcessed: true,
          archived: false
        } as Match
      ];

      vi.mocked(matchService.getAllMatches).mockResolvedValue(matchesWithoutResult);

      const result = await playerDetailService.getResultDistribution('player1');

      expect(result).toEqual({ wins: 0, draws: 0, losses: 0 });
    });
  });
});
