
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, pass: string) => Promise<User | null>;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserDisplayName: (newName: string) => Promise<boolean>;
  sendUserPasswordResetEmail: () => Promise<boolean>;
  updateUserPhoneNumberInFirestore: (phoneNumber: string) => Promise<boolean>;
  getUserPhoneNumberFromFirestore: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const ensureUserDocumentExists = useCallback(async (user: User) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        const userData: UserProfile = {
          email: user.email || "",
          displayName: user.displayName || user.email?.split('@')[0] || "New User", // Ensure displayName has a fallback
          createdAt: Timestamp.now(),
        };
        await setDoc(userRef, userData);
        console.log("User document created in Firestore for UID:", user.uid);
      } else {
        const existingData = docSnap.data() as UserProfile;
        const updates: Partial<UserProfile> = {};
        if (user.displayName && user.displayName !== existingData.displayName) {
            updates.displayName = user.displayName;
        }
         if (!existingData.displayName && user.email) { // If displayName was missing, set a default
            updates.displayName = user.email.split('@')[0];
        }
        if (user.email && user.email !== existingData.email) {
            updates.email = user.email;
        }
        if (Object.keys(updates).length > 0) {
            await setDoc(userRef, updates, { merge: true });
            console.log("User document updated in Firestore for UID:", user.uid);
        }
      }
    } catch (error) {
      console.error("Error ensuring user document in Firestore:", error);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await ensureUserDocumentExists(user);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [ensureUserDocumentExists]);

  const signUp = async (email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await ensureUserDocumentExists(userCredential.user);
        // Explicitly update profile if display name needs to be set from email
        if (!userCredential.user.displayName) {
            await updateProfile(userCredential.user, { displayName: email.split('@')[0] });
        }
      }
      toast({ title: "Account Created!", description: "You have successfully signed up." });
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({ title: "Sign Up Failed", description: error.message || "Could not create your account.", variant: "destructive" });
      return null;
    }
  };

  const signIn = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await ensureUserDocumentExists(userCredential.user);
      }
      toast({ title: "Signed In!", description: "Welcome back!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast({ title: "Sign In Failed", description: error.message || "Could not sign you in.", variant: "destructive" });
      return null;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await ensureUserDocumentExists(result.user);
      }
      toast({ title: "Signed In with Google!", description: "Welcome!" });
      return result.user;
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      let errorMessage = error.message || "Could not sign you in with Google.";
      let errorTitle = "Google Sign-In Failed";

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "The Google sign-in popup was closed before the process could complete. If you did not close it manually, please check for popup blockers, try a different browser/incognito window, or ensure your internet connection is stable.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Multiple sign-in popups were opened, and the previous request was cancelled. Please try signing in again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorTitle = "Popup Blocked";
        errorMessage = "Your browser blocked the Google sign-in popup. Please disable your popup blocker for this site and try again.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorTitle = "Sign-In Method Disabled";
        errorMessage = "Google Sign-In is not enabled for this app. Please contact support if this seems incorrect.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "A network error occurred during Google sign-in. Please check your internet connection and try again.";
      }
      
      toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
      return null;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null); // Explicitly set currentUser to null
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Failed", description: error.message || "Could not sign you out.", variant: "destructive" });
    }
  };

  const updateUserDisplayName = async (newName: string): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "No user is currently signed in.", variant: "destructive" });
      return false;
    }
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      // Update Firestore document as well
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, { displayName: newName }, { merge: true });
      // Force a refresh of the currentUser object to get the latest profile
      await auth.currentUser.reload();
      setCurrentUser(auth.currentUser); // Update local state with reloaded user
      toast({ title: "Display Name Updated", description: "Your display name has been successfully updated." });
      return true;
    } catch (error: any) {
      console.error("Error updating display name:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update display name.", variant: "destructive" });
      return false;
    }
  };

  const sendUserPasswordResetEmail = async (): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Error", description: "No authenticated user or email found for password reset.", variant: "destructive" });
      return false;
    }
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast({ title: "Password Reset Email Sent", description: `A password reset link has been sent to ${auth.currentUser.email}.` });
      return true;
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({ title: "Email Sending Failed", description: error.message || "Could not send password reset email.", variant: "destructive" });
      return false;
    }
  };

  const updateUserPhoneNumberInFirestore = async (phoneNumber: string): Promise<boolean> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your phone number.", variant: "destructive" });
      return false;
    }
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { phoneNumber: phoneNumber }, { merge: true });
      toast({ title: "Phone Number Updated", description: "Your phone number has been successfully updated in your profile." });
      return true;
    } catch (error: any) {
      console.error("Error updating phone number in Firestore:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update phone number.", variant: "destructive" });
      return false;
    }
  };

  const getUserPhoneNumberFromFirestore = async (): Promise<string | null> => {
    if (!currentUser) {
      return null;
    }
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        return userData.phoneNumber || null;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching phone number from Firestore:", error);
      // Avoid toasting for a simple fetch error that might be transient or expected if no number is set
      return null;
    }
  };


  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateUserDisplayName,
    sendUserPasswordResetEmail,
    updateUserPhoneNumberInFirestore,
    getUserPhoneNumberFromFirestore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
