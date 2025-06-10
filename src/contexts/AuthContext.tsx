
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
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, pass: string) => Promise<User | null>;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserDisplayName: (newName: string) => Promise<boolean>;
  sendUserPasswordResetEmail: () => Promise<boolean>;
  updateUserPhoneNumberInFirestore: (phoneNumber: string) => Promise<boolean>;
  getUserPhoneNumberFromFirestore: () => Promise<string | null>;
  updateUserSendGridConfig: (config: { apiKey?: string; fromEmail?: string }) => Promise<boolean>;
  getUserSendGridConfig: () => Promise<{ apiKey: string | null; fromEmail: string | null } | null>;
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
          // Initialize new fields
          sendGridApiKey: "",
          userDefaultFromEmail: "",
        };
        await setDoc(userRef, userData);
        console.log("AuthContext: User document created in Firestore for UID:", user.uid);
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
        if (user.displayName && (user.displayName !== existingData.displayName || existingData.displayName === "New User")) {
            updates.displayName = user.displayName;
        }
        if (user.email && user.email !== existingData.email) {
            updates.email = user.email;
        }
        // Ensure new fields have default values if missing from old docs
        if (existingData.sendGridApiKey === undefined) updates.sendGridApiKey = "";
        if (existingData.userDefaultFromEmail === undefined) updates.userDefaultFromEmail = "";

        if (Object.keys(updates).length > 0) {
            await setDoc(userRef, updates, { merge: true });
            console.log("AuthContext: User document updated in Firestore for UID:", user.uid, "with updates:", updates);
        }
      }
    } catch (error: any) {
      console.error("AuthContext: Error ensuring user document in Firestore for UID " + user.uid + ":", error, "Error Code:", error.code);
      if (!(error.code && typeof error.code === 'string' && error.code.includes("permission-denied"))) {
         toast({ title: "Profile Sync Error", description: "Could not sync your user profile with the database.", variant: "destructive"});
      } else {
         console.warn("AuthContext: Transient permission-denied error during user document sync for user " + user.uid + ". This often resolves automatically and user sign-in will proceed.");
      }
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
      
      const displayName = user.email?.split('@')[0] || "New User";
      if (!user.displayName || user.displayName !== displayName) {
         try {
            await updateProfile(user, { displayName });
            console.log("AuthContext: Updated Firebase Auth profile displayName for new user:", displayName);
         } catch(profileError) {
            console.error("AuthContext: Error updating profile display name on sign up:", profileError);
         }
      }
      await ensureUserDocumentExists(user); 
      
      toast({ title: "Account Created!", description: "You have successfully signed up." });
      return user;
    } catch (error: any) {
      console.error("AuthContext: Error signing up:", error);
      if (!(error.code && typeof error.code === 'string' && error.code.includes("permission-denied"))) {
        toast({ title: "Sign Up Failed", description: error.message || "Could not create your account.", variant: "destructive" });
      }
      return null;
    }
  };

  const signIn = async (email: string, pass: string) => {
    console.log("AuthContext: Attempting Email/Password Sign-In for:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signed In!", description: "Welcome back!" });
      return userCredential.user;
    } catch (error: any) {
      console.error("AuthContext: Error signing in:", error);
      if (!(error.code && typeof error.code === 'string' && error.code.includes("permission-denied"))) {
         toast({ title: "Sign In Failed", description: error.message || "Could not sign you in.", variant: "destructive" });
      }
      return null;
    }
  };


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
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, { displayName: newName }, { merge: true });
      
      setCurrentUser(prevUser => prevUser ? ({ ...prevUser, displayName: newName } as User) : null);
      
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

  const updateUserSendGridConfig = async (config: { apiKey?: string; fromEmail?: string }): Promise<boolean> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update SendGrid settings.", variant: "destructive" });
      return false;
    }
    console.log("AuthContext: Updating SendGrid config for user:", currentUser.uid, config);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const updateData: Partial<UserProfile> = {};
      if (config.apiKey !== undefined) updateData.sendGridApiKey = config.apiKey;
      if (config.fromEmail !== undefined) updateData.userDefaultFromEmail = config.fromEmail;
      
      await setDoc(userRef, updateData, { merge: true });
      toast({ title: "SendGrid Configuration Updated", description: "Your SendGrid settings have been saved." });
      return true;
    } catch (error: any) {
      console.error("AuthContext: Error updating SendGrid config in Firestore:", error);
      toast({ title: "Update Failed", description: error.message || "Could not save SendGrid settings.", variant: "destructive" });
      return false;
    }
  };

  const getUserSendGridConfig = async (): Promise<{ apiKey: string | null; fromEmail: string | null } | null> => {
     if (!currentUser) {
      console.log("AuthContext: Cannot get SendGrid config, no current user.");
      return null;
    }
    console.log("AuthContext: Fetching SendGrid config from Firestore for user:", currentUser.uid);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        return {
          apiKey: userData.sendGridApiKey || null,
          fromEmail: userData.userDefaultFromEmail || null,
        };
      }
      console.log("AuthContext: No user document found for SendGrid config.");
      return { apiKey: null, fromEmail: null }; // Return default/empty if no doc
    } catch (error: any) {
      console.error("AuthContext: Error fetching SendGrid config from Firestore:", error);
      return null;
    }
  };


  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserDisplayName,
    sendUserPasswordResetEmail,
    updateUserPhoneNumberInFirestore,
    getUserPhoneNumberFromFirestore,
    updateUserSendGridConfig,
    getUserSendGridConfig,
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Logo className="mb-4 h-10 sm:h-12" />
        <Loader2 className="h-8 w-8 sm:h-10 sm:h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading AutoBoss...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

