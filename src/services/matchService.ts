import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    deleteDoc,
    doc, 
    query, 
    orderBy,
    serverTimestamp,
    updateDoc,
    where,
    limit,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../lib/firebase';
  import { Match } from '../types';
  
  // Import will be added dynamically to avoid circular dependency
  let playerStatsService: any = null;
  
  const getPlayerStatsService = async () => {
    if (!playerStatsService) {
      const module = await import('./playerStatsService');
      playerStatsService = module.playerStatsService;
    }
    return playerStatsService;
  };
  
  const MATCHES_COLLECTION = 'matches';
  
  export const matchService = {
    async createMatch(dateString: string): Promise<string> {
      const date = new Date(dateString);
      const docRef = await addDoc(collection(db, MATCHES_COLLECTION), {
        date: Timestamp.fromDate(date),
        status: 'scheduled',
        teamWhite: [],
        teamRed: [],
        createdAt: serverTimestamp()
      });
      return docRef.id;
    },
  
    async getScheduledMatch(): Promise<Match | null> {
      const q = query(
        collection(db, MATCHES_COLLECTION), 
        where('status', '==', 'scheduled'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {return null;}
      
      const firstDoc = snapshot.docs[0];
      if (!firstDoc) {return null;}
      
      const docData = firstDoc.data();
      return {
        id: firstDoc.id,
        ...docData
      } as Match;
    },

    async getAllMatches(): Promise<Match[]> {
        const q = query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Match));
    },
  
    async getMatchById(id: string): Promise<Match | null> {
      const d = await getDoc(doc(db, MATCHES_COLLECTION, id));
      if (!d.exists()) {return null;}
      return { id: d.id, ...d.data() } as Match;
    },

    async deleteMatch(id: string): Promise<void> {
        // Before deleting, get the match to update player stats
        const match = await matchService.getMatchById(id);
        await deleteDoc(doc(db, MATCHES_COLLECTION, id));
        
        // Update stats for all players who were in the match
        if (match) {
          const statsService = await getPlayerStatsService();
          const allPlayers = new Set([...match.teamWhite, ...match.teamRed]);
          for (const playerId of allPlayers) {
            await statsService.updatePlayerStats(playerId);
          }
        }
    },

    async updateMatchScore(id: string, white: number, red: number): Promise<void> {
         await updateDoc(doc(db, MATCHES_COLLECTION, id), {
            result: {
                goalsWhite: white,
                goalsRed: red
            }
         });
         
         // Update stats for players when score changes
         const match = await matchService.getMatchById(id);
         if (match) {
           const statsService = await getPlayerStatsService();
           const allPlayers = new Set([...match.teamWhite, ...match.teamRed]);
           for (const playerId of allPlayers) {
             await statsService.updatePlayerStats(playerId);
           }
         }
    },
  
    async updateLineup(matchId: string, teamWhite: string[], teamRed: string[]): Promise<void> {
      const matchRef = doc(db, MATCHES_COLLECTION, matchId);
      await updateDoc(matchRef, {
        teamWhite,
        teamRed
      });
      
      // Ensure stats exist for all players in the lineup
      const statsService = await getPlayerStatsService();
      const allPlayers = new Set([...teamWhite, ...teamRed]);
      for (const playerId of allPlayers) {
        await statsService.ensureStatsExistForPlayer(playerId);
      }
    },
  
    async closeMatch(matchId: string, goalsWhite: number, goalsRed: number): Promise<void> {
      const matchRef = doc(db, MATCHES_COLLECTION, matchId);
      await updateDoc(matchRef, {
        status: 'completed',
        result: {
          goalsWhite,
          goalsRed
        },
        statsProcessed: true
      });
      
      // Update stats for all players in the match
      const match = await matchService.getMatchById(matchId);
      if (match) {
        const statsService = await getPlayerStatsService();
        const allPlayers = new Set([...match.teamWhite, ...match.teamRed]);
        for (const playerId of allPlayers) {
          await statsService.updatePlayerStats(playerId);
        }
      }
    }
  };
