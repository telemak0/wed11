import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { db, auth } from "../lib/firebase";

const ADMIN_CONFIG_DOC = "_config/admin";

export const adminService = {
  async isBootstrapped(): Promise<boolean> {
    const docRef = doc(db, ADMIN_CONFIG_DOC);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() && docSnap.data()?.initialized === true;
  },

  async login(password: string): Promise<void> {
    const email = import.meta.env.VITE_ADMIN_EMAIL;
    if (!email) {
      throw new Error("Admin email is not configured. Please check VITE_ADMIN_EMAIL.");
    }
    await signInWithEmailAndPassword(auth, email, password);
  },

  async setupAdmin(password: string): Promise<void> {
    const email = import.meta.env.VITE_ADMIN_EMAIL;
    if (!email) {
      throw new Error("Admin email is not configured. Please check VITE_ADMIN_EMAIL.");
    }
    
    // 1. Create the user in Firebase Auth
    await createUserWithEmailAndPassword(auth, email, password);
    
    // 2. Set the bootstrap flag in Firestore
    const docRef = doc(db, ADMIN_CONFIG_DOC);
    await setDoc(docRef, { 
      initialized: true,
      setupAt: new Date().toISOString()
    });
  },

  async logout(): Promise<void> {
    await signOut(auth);
  }
};
