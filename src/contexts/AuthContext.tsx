
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
  // GoogleAuthProvider, // Removed
  // signInWithRedirect as firebaseSignInWithRedirect, // Removed
  // getRedirectResult, // Removed
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
  // signInWithGoogle: () => Promise<User | null>; // Removed
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
    console.log("AuthContext: Ensuring user document for UID:", user.uid);
    const userRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        console.log("AuthContext: No existing document for UID:", user.uid, "Creating new one.");
        const displayName = user.displayName || user.email?.split('@')[0] || "New User";
        const userData: UserProfile = {
          email: user.email || "",
          displayName: displayName,
          createdAt: Timestamp.now(),
        };
        await setDoc(userRef, userData);
        console.log("AuthContext: User document created in Firestore for UID:", user.uid);
         // If Firebase Auth user.displayName is null but we just set it in Firestore, update Firebase Auth profile
        if (!user.displayName && displayName !== "New User") {
          try {
            await updateProfile(user, { displayName });
            console.log("AuthContext: Firebase Auth profile displayName updated for new user:", user.uid);
          } catch (updateError) {
            console.error("AuthContext: Error updating Firebase Auth profile displayName for new user:", updateError);
          }
        }
      } else {
        console.log("AuthContext: Existing document found for UID:", user.uid);
        const existingData = docSnap.data() as UserProfile;
        const updates: Partial<UserProfile> = {};
        // Sync displayName from Auth to Firestore if Auth has one and Firestore doesn't match or is default
        if (user.displayName && (user.displayName !== existingData.displayName || existingData.displayName === "New User")) {
            updates.displayName = user.displayName;
        }
        // Ensure email is synced
        if (user.email && user.email !== existingData.email) {
            updates.email = user.email;
        }
        if (Object.keys(updates).length > 0) {
            await setDoc(userRef, updates, { merge: true });
            console.log("AuthContext: User document updated in Firestore for UID:", user.uid, "with updates:", updates);
        }
      }
    } catch (error) {
      console.error("AuthContext: Error ensuring user document in Firestore:", error);
      toast({ title: "Profile Sync Error", description: "Could not sync user profile data.", variant: "destructive"});
    }
  }, [toast]);


  useEffect(() => {
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: Auth state changed, user:", user ? user.uid : null);
      if (user) {
        await ensureUserDocumentExists(user);
      }
      setCurrentUser(user);
      setLoading(false);
    });
    return () => {
      console.log("AuthContext: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, [ensureUserDocumentExists]);

  const signUp = async (email: string, pass: string) => {
    console.log("AuthContext: Attempting Email/Password Sign-Up for:", email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      console.log("AuthContext: Email/Password Sign-Up successful, user:", user.uid);
      
      // Set a default display name if not already set (e.g. from email)
      const displayName = user.email?.split('@')[0] || "New User";
      if (!user.displayName || user.displayName !== displayName) {
         try {
            await updateProfile(user, { displayName });
            console.log("AuthContext: Updated Firebase Auth profile displayName for new user:", displayName);
         } catch(profileError) {
            console.error("AuthContext: Error updating profile display name on sign up:", profileError);
         }
      }
      // Now ensure Firestore document reflects this, potentially creating it
      await ensureUserDocumentExists(user); // ensureUserDocumentExists will handle sync
      
      toast({ title: "Account Created!", description: "You have successfully signed up." });
      return user;
    } catch (error: any) {
      console.error("AuthContext: Error signing up:", error);
      toast({ title: "Sign Up Failed", description: error.message || "Could not create your account.", variant: "destructive" });
      return null;
    }
  };

  const signIn = async (email: string, pass: string) => {
    console.log("AuthContext: Attempting Email/Password Sign-In for:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      console.log("AuthContext: Email/Password Sign-In successful, user:", user.uid);
      await ensureUserDocumentExists(user); // ensureUserDocumentExists will handle sync
      toast({ title: "Signed In!", description: "Welcome back!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("AuthContext: Error signing in:", error);
      toast({ title: "Sign In Failed", description: error.message || "Could not sign you in.", variant: "destructive" });
      return null;
    }
  };

  // Removed signInWithGoogle and its related useEffect for getRedirectResult

  const signOut = async () => {
    console.log("AuthContext: Attempting Sign Out...");
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null); 
      console.log("AuthContext: Sign Out successful.");
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      console.error("AuthContext: Error signing out:", error);
      toast({ title: "Sign Out Failed", description: error.message || "Could not sign you out.", variant: "destructive" });
    }
  };

  const updateUserDisplayName = async (newName: string): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "No user is currently signed in.", variant: "destructive" });
      return false;
    }
    console.log("AuthContext: Attempting to update display name to:", newName, "for user:", auth.currentUser.uid);
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      // Update Firestore document as well
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, { displayName: newName }, { merge: true });
      
      // Force a refresh of the currentUser object to get the latest profile
      // This can be tricky, sometimes it's better to manually update the local currentUser state
      // Forcing reload can be slow or cause flashes. Let's try updating local state first.
      setCurrentUser(prevUser => prevUser ? ({ ...prevUser, displayName: newName } as User) : null);
      
      // Alternative: await auth.currentUser.reload(); setCurrentUser(auth.currentUser);

      console.log("AuthContext: Display name updated successfully.");
      toast({ title: "Display Name Updated", description: "Your display name has been successfully updated." });
      return true;
    } catch (error: any) {
      console.error("AuthContext: Error updating display name:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update display name.", variant: "destructive" });
      return false;
    }
  };

  const sendUserPasswordResetEmail = async (): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Error", description: "No authenticated user or email found for password reset.", variant: "destructive" });
      return false;
    }
    console.log("AuthContext: Sending password reset email to:", auth.currentUser.email);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast({ title: "Password Reset Email Sent", description: `A password reset link has been sent to ${auth.currentUser.email}.` });
      return true;
    } catch (error: any) {
      console.error("AuthContext: Error sending password reset email:", error);
      toast({ title: "Email Sending Failed", description: error.message || "Could not send password reset email.", variant: "destructive" });
      return false;
    }
  };

  const updateUserPhoneNumberInFirestore = async (phoneNumber: string): Promise<boolean> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your phone number.", variant: "destructive" });
      return false;
    }
    console.log("AuthContext: Updating phone number in Firestore to:", phoneNumber, "for user:", currentUser.uid);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { phoneNumber: phoneNumber }, { merge: true });
      toast({ title: "Phone Number Updated", description: "Your phone number has been successfully updated in your profile." });
      return true;
    } catch (error: any) {
      console.error("AuthContext: Error updating phone number in Firestore:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update phone number.", variant: "destructive" });
      return false;
    }
  };

  const getUserPhoneNumberFromFirestore = async (): Promise<string | null> => {
    if (!currentUser) {
      console.log("AuthContext: Cannot get phone number, no current user.");
      return null;
    }
    console.log("AuthContext: Fetching phone number from Firestore for user:", currentUser.uid);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        console.log("AuthContext: Phone number fetched:", userData.phoneNumber);
        return userData.phoneNumber || null;
      }
      console.log("AuthContext: No user document found in Firestore for phone number.");
      return null;
    } catch (error: any) {
      console.error("AuthContext: Error fetching phone number from Firestore:", error);
      return null;
    }
  };


  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    // signInWithGoogle, // Removed
    signOut,
    updateUserDisplayName,
    sendUserPasswordResetEmail,
    updateUserPhoneNumberInFirestore,
    getUserPhoneNumberFromFirestore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
