import nicknames from '../data/nicknames.json';
import { Player } from '../types';

interface NicknameState {
  available: string[];
  used: Map<string, string>; // playerId -> nickname
}

let state: NicknameState = {
  available: [...nicknames.pool],
  used: new Map(),
};

/**
 * Nickname service for managing player anonymity in public ranking.
 * Each ACTIVE player gets a unique nickname that is shown to others;
 * logged-in players always see real names.
 */
export const nicknameService = {
  /**
   * Initialize nickname state from Firestore player data.
   * Called once on app startup to restore nickname state.
   */
  async initialize(allPlayers: Player[]): Promise<void> {
    state.used.clear();
    state.available = [...nicknames.pool];

    // Populate used nicknames from existing active players
    for (const player of allPlayers) {
      if (player.type === 'active' && player.nickname) {
        state.used.set(player.id, player.nickname);
        state.available = state.available.filter(n => n !== player.nickname);
      }
    }
  },

  /**
   * Assign a unique nickname to a player.
   * Returns null if pool is exhausted (should not happen with < 200 players).
   */
  assignNickname(playerId: string): string | null {
    // Already has one
    if (state.used.has(playerId)) {
      return state.used.get(playerId) || null;
    }

    // Pool is empty
    if (state.available.length === 0) {
      console.warn('Nickname pool exhausted');
      return null;
    }

    // Assign random from available
    const index = Math.floor(Math.random() * state.available.length);
    const nickname = state.available.splice(index, 1)[0]!;
    state.used.set(playerId, nickname);
    return nickname;
  },

  /**
   * Reclaim a nickname when player status changes to Occasional.
   * Returns the nickname back to the available pool.
   */
  reclaimNickname(playerId: string): void {
    const nickname = state.used.get(playerId);
    if (nickname && !state.available.includes(nickname)) {
      state.available.push(nickname);
    }
    state.used.delete(playerId);
  },

  /**
   * Get nickname for a player (read-only lookup).
   * Returns null if player has no nickname assigned.
   */
  getNickname(playerId: string): string | null {
    return state.used.get(playerId) || null;
  },

  /**
   * Get display name based on visibility context.
   * Logged-in player always sees real name.
   * Others see nickname if available, otherwise real name (fallback).
   */
  getDisplayName(player: Player, loggedInPlayerId: string | null): string {
    if (player.id === loggedInPlayerId) {
      return player.name;
    }
    return player.nickname || player.name;
  },

  /**
   * Get current available nickname count (for debugging/monitoring).
   */
  getAvailableCount(): number {
    return state.available.length;
  },

  /**
   * Reset state for testing purposes.
   */
  resetState(): void {
    state = {
      available: [...nicknames.pool],
      used: new Map(),
    };
  },
};
