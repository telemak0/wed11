import {
  PlayerTeammateStats,
  PlayerOpponentStats,
  PlayerTeamDistribution,
  PlayerResultDistribution,
  Match
} from '../types';
import { matchService } from './matchService';
import { playerService } from './playerService';

/**
 * Calculate winrate percentage for a player with a teammate
 * Winrate = (wins together / total games together) * 100
 */
const calculateTeammateWinrate = (matches: Match[], playerId: string, teammateId: string): number => {
  const teammatches = matches.filter(
    match =>
      match.status === 'completed' &&
      ((match.teamWhite.includes(playerId) && match.teamWhite.includes(teammateId)) ||
       (match.teamRed.includes(playerId) && match.teamRed.includes(teammateId)))
  );

  if (teammatches.length === 0) {
    return 0;
  }

  let wins = 0;
  for (const match of teammatches) {
    if (!match.result) {
      continue;
    }
    
    const { goalsWhite, goalsRed } = match.result;
    const playerInWhite = match.teamWhite.includes(playerId);
    
    const goalsFor = playerInWhite ? goalsWhite : goalsRed;
    const goalsAgainst = playerInWhite ? goalsRed : goalsWhite;
    
    if (goalsFor > goalsAgainst) {
      wins += 1;
    }
  }

  return Math.round((wins / teammatches.length) * 100);
};

/**
 * Calculate winrate percentage for a player against an opponent
 * Winrate = (wins against opponent / total games against opponent) * 100
 */
const calculateOpponentWinrate = (matches: Match[], playerId: string, opponentId: string): number => {
  const opponentMatches = matches.filter(
    match =>
      match.status === 'completed' &&
      ((match.teamWhite.includes(playerId) && match.teamRed.includes(opponentId)) ||
       (match.teamRed.includes(playerId) && match.teamWhite.includes(opponentId)))
  );

  if (opponentMatches.length === 0) {
    return 0;
  }

  let wins = 0;
  for (const match of opponentMatches) {
    if (!match.result) {
      continue;
    }
    
    const { goalsWhite, goalsRed } = match.result;
    const playerInWhite = match.teamWhite.includes(playerId);
    
    const goalsFor = playerInWhite ? goalsWhite : goalsRed;
    const goalsAgainst = playerInWhite ? goalsRed : goalsWhite;
    
    if (goalsFor > goalsAgainst) {
      wins += 1;
    }
  }

  return Math.round((wins / opponentMatches.length) * 100);
};

export const playerDetailService = {
  /**
   * Get top 10 teammates (players in the same team) with game counts
   */
  async getTopTeammates(playerId: string, limit: number = 10): Promise<PlayerTeammateStats[]> {
    const allMatches = await matchService.getAllMatches();
    
    // Filter completed matches where player participated
    const playerMatches = allMatches.filter(
      match =>
        match.status === 'completed' &&
        (match.teamWhite.includes(playerId) || match.teamRed.includes(playerId))
    );

    // Count teammates
    const teammates = new Map<string, number>();
    
    for (const match of playerMatches) {
      const playerInWhite = match.teamWhite.includes(playerId);
      const teamPlayers = playerInWhite ? match.teamWhite : match.teamRed;
      
      // Add other players in the same team
      for (const teammate of teamPlayers) {
        if (teammate !== playerId) {
          teammates.set(teammate, (teammates.get(teammate) || 0) + 1);
        }
      }
    }

    // Convert to array and sort by games played (descending)
    const sortedTeammates = Array.from(teammates.entries())
      .map(([id, count]) => ({ playerId: id, gamesPlayed: count }))
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, limit);

    // Fetch player names
    const allPlayers = await playerService.getPlayers();
    const playerMap = new Map(allPlayers.map(p => [p.id, p]));

    return sortedTeammates.map(tm => ({
      playerId: tm.playerId,
      playerName: playerMap.get(tm.playerId)?.name || 'Unknown Player',
      gamesPlayed: tm.gamesPlayed,
      winrate: calculateTeammateWinrate(allMatches, playerId, tm.playerId)
    }));
  },

  /**
   * Get top 10 opponents (players in opposite team) with game counts
   */
  async getTopOpponents(playerId: string, limit: number = 10): Promise<PlayerOpponentStats[]> {
    const allMatches = await matchService.getAllMatches();
    
    // Filter completed matches where player participated
    const playerMatches = allMatches.filter(
      match =>
        match.status === 'completed' &&
        (match.teamWhite.includes(playerId) || match.teamRed.includes(playerId))
    );

    // Count opponents
    const opponents = new Map<string, number>();
    
    for (const match of playerMatches) {
      const playerInWhite = match.teamWhite.includes(playerId);
      const opposingTeam = playerInWhite ? match.teamRed : match.teamWhite;
      
      // Add players in the opposite team
      for (const opponent of opposingTeam) {
        opponents.set(opponent, (opponents.get(opponent) || 0) + 1);
      }
    }

    // Convert to array and sort by games played (descending)
    const sortedOpponents = Array.from(opponents.entries())
      .map(([id, count]) => ({ playerId: id, gamesPlayed: count }))
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, limit);

    // Fetch player names
    const allPlayers = await playerService.getPlayers();
    const playerMap = new Map(allPlayers.map(p => [p.id, p]));

    return sortedOpponents.map(op => ({
      playerId: op.playerId,
      playerName: playerMap.get(op.playerId)?.name || 'Unknown Player',
      gamesPlayed: op.gamesPlayed,
      winrate: calculateOpponentWinrate(allMatches, playerId, op.playerId)
    }));
  },

  /**
   * Get team distribution (white vs red appearances)
   */
  async getTeamDistribution(playerId: string): Promise<PlayerTeamDistribution> {
    const allMatches = await matchService.getAllMatches();
    
    // Filter completed matches where player participated
    const playerMatches = allMatches.filter(
      match =>
        match.status === 'completed' &&
        (match.teamWhite.includes(playerId) || match.teamRed.includes(playerId))
    );

    let white = 0;
    let red = 0;

    for (const match of playerMatches) {
      if (match.teamWhite.includes(playerId)) {
        white += 1;
      } else {
        red += 1;
      }
    }

    return { white, red };
  },

  /**
   * Get result distribution (wins, draws, losses)
   */
  async getResultDistribution(playerId: string): Promise<PlayerResultDistribution> {
    const allMatches = await matchService.getAllMatches();
    
    // Filter completed matches where player participated
    const playerMatches = allMatches.filter(
      match =>
        match.status === 'completed' &&
        (match.teamWhite.includes(playerId) || match.teamRed.includes(playerId))
    );

    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (const match of playerMatches) {
      if (!match.result) {continue;} // Skip if no result recorded

      const { goalsWhite, goalsRed } = match.result;
      const playerInWhite = match.teamWhite.includes(playerId);

      const goalsFor = playerInWhite ? goalsWhite : goalsRed;
      const goalsAgainst = playerInWhite ? goalsRed : goalsWhite;

      if (goalsFor > goalsAgainst) {
        wins += 1;
      } else if (goalsFor === goalsAgainst) {
        draws += 1;
      } else {
        losses += 1;
      }
    }

    return { wins, draws, losses };
  }
};
