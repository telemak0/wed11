import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Player } from '../types';
import { generateUniqueCode } from '../utils/code-generator';
import { nicknameService } from './nicknameService';

const PLAYERS_COLLECTION = 'players';

export const playerService = {
  async getPlayers(): Promise<Player[]> {
    const q = query(collection(db, PLAYERS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        type: data.type || 'active', // Default to 'active' for existing players
        loginCode: data.loginCode || '',
        nickname: data.nickname || null,
        createdAt: data.createdAt,
      } as Player;
    });
  },

  async getPlayerById(id: string): Promise<Player | null> {
    const docRef = doc(db, PLAYERS_COLLECTION, id);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      return null;
    }
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      name: data.name,
      type: data.type || 'active',
      loginCode: data.loginCode || '',
      nickname: data.nickname || null,
      createdAt: data.createdAt,
    } as Player;
  },

  async updatePlayer(
    id: string,
    name: string,
    type: 'active' | 'occasional',
    loginCode?: string
  ): Promise<void> {
    const docRef = doc(db, PLAYERS_COLLECTION, id);
    const currentPlayer = await this.getPlayerById(id);

    const updateData: any = { name, type };
    if (loginCode) {
      updateData.loginCode = loginCode;
    }

    // Handle status change → nickname assignment/reclamation
    if (currentPlayer && currentPlayer.type !== type) {
      if (type === 'active' && !currentPlayer.nickname) {
        // Changed to ACTIVE: assign nickname
        const nickname = nicknameService.assignNickname(id);
        updateData.nickname = nickname;
      } else if (type === 'occasional' && currentPlayer.nickname) {
        // Changed to OCCASIONAL: reclaim nickname
        nicknameService.reclaimNickname(id);
        updateData.nickname = null;
      }
    }

    await updateDoc(docRef, updateData);
  },

  async createPlayer(name: string, type: 'active' | 'occasional' = 'active'): Promise<string> {
    const code = await generateUniqueCode(async (testCode: string) => {
      const existing = await this.getPlayerByCode(testCode);
      return existing !== null;
    });

    // Assign nickname for active players
    let nickname: string | null = null;
    if (type === 'active') {
      nickname = nicknameService.assignNickname(crypto.randomUUID());
    }

    const docRef = await addDoc(collection(db, PLAYERS_COLLECTION), {
      name,
      type,
      loginCode: code,
      nickname,
      createdAt: serverTimestamp(),
    });

    // Update in-memory service with actual ID
    if (type === 'active' && nickname) {
      nicknameService.reclaimNickname(crypto.randomUUID()); // reclaim temp
      nicknameService.assignNickname(docRef.id); // assign with real ID
    }

    return docRef.id;
  },

  async deletePlayer(id: string): Promise<void> {
    await deleteDoc(doc(db, PLAYERS_COLLECTION, id));
  },

  async getPlayerByCode(code: string): Promise<Player | null> {
    const q = query(collection(db, PLAYERS_COLLECTION), where('loginCode', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0]!;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      type: data.type || 'active',
      loginCode: data.loginCode || '',
      nickname: data.nickname || null,
      createdAt: data.createdAt,
    } as Player;
  },

  async updatePlayerCode(id: string): Promise<string> {
    const newCode = await generateUniqueCode(async (testCode: string) => {
      const existing = await this.getPlayerByCode(testCode);
      return existing !== null;
    });

    const docRef = doc(db, PLAYERS_COLLECTION, id);
    await updateDoc(docRef, { loginCode: newCode });
    return newCode;
  },
};
