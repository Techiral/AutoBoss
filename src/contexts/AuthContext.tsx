
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, pass: string) => Promise<User | null>;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe; 
  }, []);

  const signUp = async (email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
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
      toast({ title: "Signed In!", description: "Welcome back!"});
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast({ title: "Sign In Failed", description: error.message || "Could not sign you in.", variant: "destructive" });
      return null;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out."});
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Failed", description: error.message || "Could not sign you out.", variant: "destructive" });
    }
  };


  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
  };

  // AuthProvider should always render its children.
  // The AppLayout (or other consumers) will use the `loading` state
  // from the context to decide whether to show a loading UI.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
