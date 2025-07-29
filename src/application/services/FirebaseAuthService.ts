import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

export interface FirebaseUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

export class FirebaseAuthService {
  private auth;

  constructor() {
    if (getApps().length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
      }

      const serviceAccountKey = JSON.parse(serviceAccount);
      
      initializeApp({
        credential: cert(serviceAccountKey)
      });
    }

    this.auth = getAuth();
  }

  async verifyToken(idToken: string): Promise<FirebaseUser> {
    try {
      const decodedToken: DecodedIdToken = await this.auth.verifyIdToken(idToken);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        emailVerified: decodedToken.email_verified || false,
        customClaims: decodedToken
      };
    } catch (error) {
      throw new Error('Token de Firebase inválido');
    }
  }

  async getUserByUid(uid: string): Promise<FirebaseUser | null> {
    try {
      const userRecord = await this.auth.getUser(uid);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        customClaims: userRecord.customClaims
      };
    } catch (error) {
      return null;
    }
  }

  async setCustomClaims(uid: string, claims: Record<string, any>): Promise<void> {
    try {
      await this.auth.setCustomUserClaims(uid, claims);
    } catch (error) {
      throw new Error('Error al establecer claims personalizados');
    }
  }

  async revokeToken(uid: string): Promise<void> {
    try {
      await this.auth.revokeRefreshTokens(uid);
    } catch (error) {
      throw new Error('Error al revocar tokens');
    }
  }
} 