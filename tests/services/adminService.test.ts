import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../src/services/adminService';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../../src/lib/firebase', () => ({
  db: {},
  auth: {}
}));

describe('adminService', () => {
  const mockEmail = 'admin@test.com';

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup environment variable mock
    vi.stubEnv('VITE_ADMIN_EMAIL', mockEmail);
  });

  describe('isBootstrapped', () => {
    it('returns true if the config document exists and is initialized', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ initialized: true })
      } as any);

      const result = await adminService.isBootstrapped();
      expect(result).toBe(true);
      expect(doc).toHaveBeenCalled();
    });

    it('returns false if the config document does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false
      } as any);

      const result = await adminService.isBootstrapped();
      expect(result).toBe(false);
    });

    it('returns false if the config document exists but is not initialized', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ initialized: false })
      } as any);

      const result = await adminService.isBootstrapped();
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('calls signInWithEmailAndPassword with correct credentials', async () => {
      const password = 'securepassword';
      await adminService.login(password);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), mockEmail, password);
    });

    it('throws error if VITE_ADMIN_EMAIL is missing', async () => {
      vi.stubEnv('VITE_ADMIN_EMAIL', '');
      await expect(adminService.login('pass')).rejects.toThrow('Admin email is not configured');
    });
  });

  describe('setupAdmin', () => {
    it('creates user and sets bootstrap flag', async () => {
      const password = 'newpassword';
      const mockDocRef = { id: 'admin' };
      vi.mocked(doc).mockReturnValueOnce(mockDocRef as any);
      
      await adminService.setupAdmin(password);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), mockEmail, password);
      expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
        initialized: true
      }));
    });
  });

  describe('logout', () => {
    it('calls signOut', async () => {
      await adminService.logout();
      expect(signOut).toHaveBeenCalled();
    });
  });
});
