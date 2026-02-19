import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generatePlayerCode } from '../utils/code-generator';
import { playerService } from './playerService';
import { nicknameService } from './nicknameService';

const PLAYERS_COLLECTION = 'players';

/**
 * Migrate existing players by adding login codes to those that don't have one
 * This is idempotent - running it multiple times is safe
 */
export const migratePlayersAddCodes = async (): Promise<{
  migrated: number;
  skipped: number;
  total: number;
}> => {
  console.log('Starting player code migration...');

  try {
    const snapshot = await getDocs(collection(db, PLAYERS_COLLECTION));
    let migrated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
      const player = docSnap.data();

      // Only update if loginCode doesn't exist
      if (!player.loginCode) {
        const newCode = generatePlayerCode();
        await updateDoc(doc(db, PLAYERS_COLLECTION, docSnap.id), {
          loginCode: newCode,
        });
        console.log(`Migrated player ${docSnap.id} (${player.name}) with code ${newCode}`);
        migrated++;
      } else {
        console.log(`Skipped player ${docSnap.id} - already has code ${player.loginCode}`);
        skipped++;
      }
    }

    const total = snapshot.size;
    console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped, ${total} total`);

    return { migrated, skipped, total };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Migrate existing ACTIVE players by assigning nicknames for anonymity in public ranking
 * This is idempotent - running it multiple times is safe
 */
export const migratePlayersAddNicknames = async (): Promise<{
  migrated: number;
  skipped: number;
  total: number;
}> => {
  console.log('Starting player nickname migration...');

  try {
    const players = await playerService.getPlayers();

    // Initialize nickname service with existing state
    await nicknameService.initialize(players);

    let migrated = 0;
    let skipped = 0;

    // Assign nicknames to ACTIVE players without nicknames
    for (const player of players) {
      if (player.type === 'active' && !player.nickname) {
        const nickname = nicknameService.assignNickname(player.id);
        if (nickname) {
          const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
          await updateDoc(playerRef, { nickname });
          console.log(`Migrated player ${player.id} (${player.name}) with nickname: ${nickname}`);
          migrated++;
        } else {
          console.warn(
            `Failed to assign nickname to player ${player.id} (${player.name}) - pool exhausted`
          );
          skipped++;
        }
      } else if (player.type === 'occasional') {
        console.log(`Skipped occasional player ${player.id} (${player.name})`);
        skipped++;
      } else {
        console.log(
          `Skipped player ${player.id} (${player.name}) - already has nickname: ${player.nickname}`
        );
        skipped++;
      }
    }

    const total = players.length;
    console.log(
      `Nickname migration complete: ${migrated} migrated, ${skipped} skipped, ${total} total`
    );

    return { migrated, skipped, total };
  } catch (error) {
    console.error('Nickname migration failed:', error);
    throw error;
  }
};
