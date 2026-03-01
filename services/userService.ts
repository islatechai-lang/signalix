import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  User,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { UserProfile } from '../types';
import { INITIAL_CREDITS } from '../constants';
import { paymentService } from './paymentService';

// Helper to convert Firebase User + Firestore Data to our UserProfile type
const mapUserToProfile = (firebaseUser: User, extraData: any): UserProfile => {
  return {
    id: firebaseUser.uid,
    name: extraData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Trader',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || null,
    credits: extraData?.credits ?? INITIAL_CREDITS,
    isPro: extraData?.isPro || false,
    joinedAt: extraData?.joinedAt || Date.now()
  };
};

// Helper to clean up Firebase errors
const getFriendlyErrorMessage = (error: any): string => {
  // Pass through our custom internal flags
  if (error.message === 'EMAIL_NOT_VERIFIED') return 'EMAIL_NOT_VERIFIED';
  if (error.message === 'ALREADY_VERIFIED') return 'ALREADY_VERIFIED';

  const code = error.code;
  
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials': // Some SDK versions use this
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'That email is already registered. Please login.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was canceled.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    default:
      // Robust cleaning for unhandled codes
      if (error.message) {
         // Regex to strip "Firebase: Error (auth/xxx)." pattern
         const cleanMsg = error.message.replace(/^Firebase:\s*(Error\s*)?\(auth\/[\w-]+\)\.?\s*/i, '');
         if (cleanMsg && cleanMsg.trim().length > 0) {
            // Capitalize first letter
            return cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
         }
      }
      return 'An unexpected error occurred.';
  }
};

export const userService = {
  // Login with Email/Password
  async login(email: string, password?: string): Promise<UserProfile> {
    if (!password) throw new Error("Password required");
    
    try {
      // 1. Attempt Sign In
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Email Verification Check
      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      // 3. Fetch user details (credits) from Firestore
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          return mapUserToProfile(user, userDoc.data());
        } else {
          const newProfile = {
            name: email.split('@')[0],
            email: email,
            credits: INITIAL_CREDITS,
            isPro: false,
            joinedAt: Date.now()
          };
          await setDoc(userDocRef, newProfile);
          return mapUserToProfile(user, newProfile);
        }
      } catch (error: any) {
        console.warn("Firestore access failed. Using temporary auth profile.", error);
        return mapUserToProfile(user, { credits: INITIAL_CREDITS, isPro: false });
      }
    } catch (error: any) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  },

  // Register new user
  async register(email: string, name?: string, password?: string): Promise<void> {
    if (!password) password = "defaultPassword123!"; 

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send Verification Email
      await sendEmailVerification(user);

      const userProfileData = {
        name: name || email.split('@')[0],
        email: email,
        credits: INITIAL_CREDITS,
        isPro: false,
        joinedAt: Date.now()
      };

      try {
        await setDoc(doc(db, "users", user.uid), userProfileData);
      } catch (error) {
        console.warn("Failed to create Firestore document.", error);
      }

      // Sign out immediately so they can't access dashboard until verified
      await signOut(auth);
    } catch (error: any) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  },

  // Resend Verification Email
  // Note: We must temporarily sign them in to send the email, then sign them out.
  async resendVerification(email: string, password?: string): Promise<void> {
    if (!password) throw new Error("Password required to resend verification.");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
         // Already verified, just return
         await signOut(auth);
         throw new Error("ALREADY_VERIFIED");
      }

      await sendEmailVerification(user);
      await signOut(auth);
    } catch (error: any) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  },

  // Password Reset
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Handle user-not-found specifically for clearer context, if enumeration protection is OFF.
      if (error.code === 'auth/user-not-found') {
         throw new Error("No account found with this email address.");
      }
      throw new Error(getFriendlyErrorMessage(error));
    }
  },

  // Google Login (Auto-verified usually)
  async googleLogin(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          return mapUserToProfile(user, userDoc.data());
        } else {
          const newProfile = {
            name: user.displayName || 'Google User',
            email: user.email,
            credits: INITIAL_CREDITS,
            isPro: false,
            joinedAt: Date.now()
          };
          await setDoc(userDocRef, newProfile);
          return mapUserToProfile(user, newProfile);
        }
      } catch (error: any) {
        console.warn("Firestore access failed.", error);
        return mapUserToProfile(user, { credits: INITIAL_CREDITS, isPro: false });
      }
    } catch (error: any) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  },

  // Update credits in Firestore
  async updateCredits(email: string, newAmount: number): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        credits: newAmount
      });
    } catch (e) {
      console.warn("Could not persist credit update", e);
    }
  },

  // Upgrade to Pro (Called after successful payment)
  async upgradeToPro(): Promise<UserProfile | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const updates = { isPro: true, credits: 999999 };
      await updateDoc(userDocRef, updates);
      
      const updatedDoc = await getDoc(userDocRef);
      return mapUserToProfile(currentUser, updatedDoc.data());
    } catch (e) {
      console.error("Failed to upgrade user to Pro", e);
      throw e;
    }
  },

  // Session Management
  async logout() {
    await signOut(auth);
  },

  // Get Current Profile with Auto-Sync
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    if (!user.emailVerified) {
      return null;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        let currentProfile = mapUserToProfile(user, profileData);

        if (currentProfile.isPro && currentProfile.email) {
           try {
             const status = await paymentService.checkSubscriptionStatus(currentProfile.email);
             if (!status.isPro) {
                await updateDoc(userDocRef, { isPro: false, credits: 3 }); 
                currentProfile.isPro = false;
                currentProfile.credits = 3;
             }
           } catch (err) {
             console.warn("Failed sync", err);
           }
        }
        return currentProfile;
      }
    } catch (error) {
      console.warn("Firestore access failed.");
    }
    
    return mapUserToProfile(user, { credits: INITIAL_CREDITS, isPro: false });
  }
};