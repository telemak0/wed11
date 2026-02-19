import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlayerStats } from '../types';
import { matchService } from './matchService';
import { playerService } from './playerService';

const PLAYER_STATS_COLLECTION = 'playerStats';

export const playerStatsService = {
  /**
   * Fetch all player stats, optionally filtered by player type
   */
  async getPlayerStats(includeOccasional: boolean = false): Promise<PlayerStats[]> {
    const q = query(collection(db, PLAYER_STATS_COLLECTION), orderBy('lastUpdated', 'desc'));
    const snapshot = await getDocs(q);
    const allPlayers = await playerService.getPlayers();
    const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

    let stats = snapshot.docs.map((doc) => {
      const player = playerMap.get(doc.id);
      const data = doc.data();
      return {
        playerId: doc.id,
        playerName: player?.name || 'Unknown Player',
        matchesPlayed: data.matchesPlayed ?? 0,
        wins: data.wins ?? 0,
        losses: data.losses ?? 0,
        draws: data.draws ?? 0,
        totalPoints: data.totalPoints ?? 0,
        totalGoalsScored: data.totalGoalsScored ?? 0,
        totalGoalsConceded: data.totalGoalsConceded ?? 0,
        pointsPerGame: data.pointsPerGame ?? 0,
        goalsPerGame: data.goalsPerGame ?? 0,
        goalsAgainstPerGame: data.goalsAgainstPerGame ?? 0,
        lastUpdated: data.lastUpdated,
      } as PlayerStats;
    });

    // Filter by player type if needed
    if (!includeOccasional) {
      const activePlayers = new Set(allPlayers.filter((p) => p.type === 'active').map((p) => p.id));
      stats = stats.filter((s) => activePlayers.has(s.playerId));
    }

    return stats;
  },

  /**
   * Calculate stats for a player from all their completed matches
   */
  async calculateStatsForPlayer(playerId: string): Promise<PlayerStats> {
    const allMatches = await matchService.getAllMatches();

    // Filter completed matches where player participated
    const playerMatches = allMatches.filter(
      (match) =>
        match.status === 'completed' &&
        (match.teamWhite.includes(playerId) || match.teamRed.includes(playerId))
    );

    let matchesPlayed = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalPoints = 0;
    let totalGoalsScored = 0;
    let totalGoalsConceded = 0;

    for (const match of playerMatches) {
      if (!match.result) {
        continue;
      } // Skip if no result recorded

      matchesPlayed += 1;
      const { goalsWhite, goalsRed } = match.result;
      const playerInWhite = match.teamWhite.includes(playerId);

      // Determine points and goals
      const goalsScored = playerInWhite ? goalsWhite : goalsRed;
      const goalsConceded = playerInWhite ? goalsRed : goalsWhite;

      totalGoalsScored += goalsScored;
      totalGoalsConceded += goalsConceded;

      if (goalsScored > goalsConceded) {
        wins += 1;
        totalPoints += 3;
      } else if (goalsScored === goalsConceded) {
        draws += 1;
        totalPoints += 1;
      } else {
        losses += 1;
        // 0 points for loss
      }
    }

    // Calculate per-game stats (avoid division by zero)
    const pointsPerGame = matchesPlayed > 0 ? totalPoints / matchesPlayed : 0;
    const goalsPerGame = matchesPlayed > 0 ? totalGoalsScored / matchesPlayed : 0;
    const goalsAgainstPerGame = matchesPlayed > 0 ? totalGoalsConceded / matchesPlayed : 0;

    const player = await playerService.getPlayerById(playerId);
    const playerName = player?.name || 'Unknown Player';

    return {
      playerId,
      playerName,
      matchesPlayed,
      wins,
      losses,
      draws,
      totalPoints,
      totalGoalsScored,
      totalGoalsConceded,
      pointsPerGame: Math.round(pointsPerGame * 100) / 100, // 2 decimal places
      goalsPerGame: Math.round(goalsPerGame * 100) / 100,
      goalsAgainstPerGame: Math.round(goalsAgainstPerGame * 100) / 100,
      lastUpdated: serverTimestamp() as Timestamp,
    };
  },

  /**
   * Update stats for a specific player and save to database
   */
  async updatePlayerStats(playerId: string): Promise<void> {
    const stats = await playerStatsService.calculateStatsForPlayer(playerId);
    const statsRef = doc(db, PLAYER_STATS_COLLECTION, playerId);
    await setDoc(statsRef, stats, { merge: false });
  },

  /**
   * Ensure stats document exists for a player (create if missing)
   */
  async ensureStatsExistForPlayer(playerId: string): Promise<void> {
    const statsRef = doc(db, PLAYER_STATS_COLLECTION, playerId);
    const stats = await playerStatsService.calculateStatsForPlayer(playerId);
    await setDoc(statsRef, stats, { merge: true });
  },

  /**
   * Recalculate stats for all players in the system
   */
  async recalculateAllStats(): Promise<void> {
    const allPlayers = await playerService.getPlayers();

    for (const player of allPlayers) {
      await playerStatsService.updatePlayerStats(player.id);
    }
  },

  /**
   * Delete stats for a player
   */
  async deletePlayerStats(playerId: string): Promise<void> {
    const statsRef = doc(db, PLAYER_STATS_COLLECTION, playerId);
    // Set to empty stats rather than delete
    const player = await playerService.getPlayerById(playerId);
    const emptyStats: PlayerStats = {
      playerId,
      playerName: player?.name || 'Unknown Player',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      totalPoints: 0,
      totalGoalsScored: 0,
      totalGoalsConceded: 0,
      pointsPerGame: 0,
      goalsPerGame: 0,
      goalsAgainstPerGame: 0,
      lastUpdated: serverTimestamp() as Timestamp,
    };
    await setDoc(statsRef, emptyStats, { merge: false });
  },
};
