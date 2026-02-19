import { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string;
  name: string;
  type: 'active' | 'occasional';
  loginCode: string;
  nickname?: string | null; // Unique nickname for anonymity in public ranking
  createdAt: Timestamp;
}

export interface Match {
  id: string;
  date: Timestamp;
  status: 'scheduled' | 'completed';
  teamWhite: string[]; 
  teamRed: string[];
  result?: {
    goalsWhite: number;
    goalsRed: number;
  };
  statsProcessed?: boolean;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalPoints: number;
  totalGoalsScored: number;
  totalGoalsConceded: number;
  pointsPerGame: number;
  goalsPerGame: number;
  goalsAgainstPerGame: number;
  lastUpdated: Timestamp;
}

export interface PlayerTeammateStats {
  playerId: string;
  playerName: string;
  gamesPlayed: number;
  winrate: number;
}

export interface PlayerOpponentStats {
  playerId: string;
  playerName: string;
  gamesPlayed: number;
  winrate: number;
}

export interface PlayerTeamDistribution {
  white: number;
  red: number;
}

export interface PlayerResultDistribution {
  wins: number;
  draws: number;
  losses: number;
}
