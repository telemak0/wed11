import { describe, it, expect, beforeEach } from 'vitest';
import { nicknameService } from '../../../src/services/nicknameService';
import type { Player } from '../../../src/types';

describe('nicknameService', () => {
  beforeEach(() => {
    // Reset service state before each test
    nicknameService.resetState();
  });

  describe('assignNickname', () => {
    it('should assign a unique nickname from available pool', () => {
      const nickname = nicknameService.assignNickname('player-1');
      expect(nickname).toBeTruthy();
      expect(typeof nickname).toBe('string');
    });

    it('should not assign the same nickname twice', () => {
      const nick1 = nicknameService.assignNickname('player-1');
      const nick2 = nicknameService.assignNickname('player-2');
      expect(nick1).not.toBe(nick2);
    });

    it('should return existing nickname if already assigned', () => {
      const nick1 = nicknameService.assignNickname('player-1');
      const nick2 = nicknameService.assignNickname('player-1');
      expect(nick1).toBe(nick2);
    });

    it('should return null when pool exhausted', () => {
      // Exhaust pool (now 57 nicknames)
      for (let i = 0; i < 57; i++) {
        const nickname = nicknameService.assignNickname(`player-${i}`);
        expect(nickname).not.toBeNull();
      }
      const nickname = nicknameService.assignNickname('player-exhausted');
      expect(nickname).toBeNull();
    });
  });

  describe('reclaimNickname', () => {
    it('should return nickname to available pool', () => {
      const initialCount = nicknameService.getAvailableCount();
      const nickname = nicknameService.assignNickname('player-1');
      expect(nicknameService.getAvailableCount()).toBe(initialCount - 1);
      
      nicknameService.reclaimNickname('player-1');
      expect(nicknameService.getAvailableCount()).toBe(initialCount);
    });

    it('should not reclaim if nickname not assigned', () => {
      const initialCount = nicknameService.getAvailableCount();
      nicknameService.reclaimNickname('player-unknown');
      expect(nicknameService.getAvailableCount()).toBe(initialCount);
    });

    it('should remove player from used map', () => {
      const nickname = nicknameService.assignNickname('player-1');
      expect(nicknameService.getNickname('player-1')).toBe(nickname);
      
      nicknameService.reclaimNickname('player-1');
      expect(nicknameService.getNickname('player-1')).toBeNull();
    });
  });

  describe('getDisplayName', () => {
    it('should return real name for logged-in player', () => {
      const player: Player = {
        id: 'p1',
        name: 'Alice',
        type: 'active',
        nickname: 'E. Butragueño',
        loginCode: '1234',
        createdAt: new Date(),
      };
      const displayName = nicknameService.getDisplayName(player, 'p1');
      expect(displayName).toBe('Alice');
    });

    it('should return nickname for other players', () => {
      const player: Player = {
        id: 'p1',
        name: 'Alice',
        type: 'active',
        nickname: 'E. Butragueño',
        loginCode: '1234',
        createdAt: new Date(),
      };
      const displayName = nicknameService.getDisplayName(player, 'p2');
      expect(displayName).toBe('E. Butragueño');
    });

    it('should fallback to real name if no nickname', () => {
      const player: Player = {
        id: 'p1',
        name: 'Bob',
        type: 'occasional',
        nickname: null,
        loginCode: '1234',
        createdAt: new Date(),
      };
      const displayName = nicknameService.getDisplayName(player, 'p2');
      expect(displayName).toBe('Bob');
    });

    it('should show (You) indicator for logged-in player in comparison', () => {
      const player1: Player = {
        id: 'p1',
        name: 'Alice',
        type: 'active',
        nickname: 'E. Butragueño',
        loginCode: '1234',
        createdAt: new Date(),
      };
      const player2: Player = {
        id: 'p2',
        name: 'Bob',
        type: 'active',
        nickname: 'F. Hierro',
        loginCode: '5678',
        createdAt: new Date(),
      };

      expect(nicknameService.getDisplayName(player1, 'p1')).toBe('Alice');
      expect(nicknameService.getDisplayName(player2, 'p1')).toBe('F. Hierro');
    });
  });

  describe('initialize', () => {
    it('should load existing nicknames from player array', async () => {
      const mockPlayers: Player[] = [
        {
          id: 'p1',
          name: 'Alice',
          type: 'active',
          nickname: 'E. Butragueño',
          loginCode: '1234',
          createdAt: new Date(),
        },
        {
          id: 'p2',
          name: 'Bob',
          type: 'active',
          nickname: 'F. Hierro',
          loginCode: '5678',
          createdAt: new Date(),
        },
        {
          id: 'p3',
          name: 'Charlie',
          type: 'occasional',
          nickname: null,
          loginCode: '9012',
          createdAt: new Date(),
        },
      ];

      await nicknameService.initialize(mockPlayers);

      expect(nicknameService.getNickname('p1')).toBe('E. Butragueño');
      expect(nicknameService.getNickname('p2')).toBe('F. Hierro');
      expect(nicknameService.getNickname('p3')).toBeNull();
    });

    it('should not count occasional players in used nicknames', async () => {
      const mockPlayers: Player[] = [
        {
          id: 'p1',
          name: 'Alice',
          type: 'active',
          nickname: 'E. Butragueño',
          loginCode: '1234',
          createdAt: new Date(),
        },
        {
          id: 'p2',
          name: 'Bob',
          type: 'occasional',
          nickname: null,
          loginCode: '5678',
          createdAt: new Date(),
        },
      ];

      await nicknameService.initialize(mockPlayers);

      // Initial pool is 57. After initialization with 1 active player:
      // - 'E. Butragueño' is marked as used
      // - Should be 56 available (57 - 1 used)
      const count = nicknameService.getAvailableCount();
      expect(count).toBe(56); // 57 - 1 used
    });

    it('should remove used nicknames from available pool', async () => {
      const mockPlayers: Player[] = [
        {
          id: 'p1',
          name: 'Alice',
          type: 'active',
          nickname: 'E. Butragueño',
          loginCode: '1234',
          createdAt: new Date(),
        },
      ];

      await nicknameService.initialize(mockPlayers);

      // Try to assign the same nickname - should fail because it's in use
      const assigned = nicknameService.assignNickname('player-new');
      expect(assigned).not.toBe('E. Butragueño');
    });
  });

  describe('getNickname', () => {
    it('should return assigned nickname', () => {
      const nickname = nicknameService.assignNickname('player-1');
      expect(nicknameService.getNickname('player-1')).toBe(nickname);
    });

    it('should return null for unassigned player', () => {
      expect(nicknameService.getNickname('player-unknown')).toBeNull();
    });
  });

  describe('getAvailableCount', () => {
    it('should return initial pool size', () => {
      const count = nicknameService.getAvailableCount();
      expect(count).toBe(57); // Updated pool size
    });

    it('should decrease when nickname assigned', () => {
      const initialCount = nicknameService.getAvailableCount();
      nicknameService.assignNickname('player-1');
      expect(nicknameService.getAvailableCount()).toBe(initialCount - 1);
    });

    it('should increase when nickname reclaimed', () => {
      nicknameService.assignNickname('player-1');
      const countAfterAssign = nicknameService.getAvailableCount();
      nicknameService.reclaimNickname('player-1');
      expect(nicknameService.getAvailableCount()).toBe(countAfterAssign + 1);
    });
  });
});
