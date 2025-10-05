import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { UserProfile } from '@journey-to-citizen/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  needsProfileSetup: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const { getUserInfo } = useFirebaseFunctions();

  // Fetch user profile from Firestore
  const fetchUserProfile = async (currentUser: User) => {
    if (!currentUser) return;
    
    setProfileLoading(true);
    try {
      const profile = await getUserInfo();
      setUserProfile(profile);
      console.log('✓ User profile loaded:', profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Check if user needs to complete profile setup
  const needsProfileSetup = Boolean(
    user && 
    user.emailVerified && 
    userProfile && 
    userProfile.status === 'inactive'
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        
        // Fetch profile if user is logged in and email is verified
        if (user && user.emailVerified) {
          await fetchUserProfile(user);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Profile will be fetched automatically by onAuthStateChanged
    if (userCredential.user.emailVerified) {
      await fetchUserProfile(userCredential.user);
    }
  };

  const logout = async () => {
    setUserProfile(null);
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    signUp,
    signIn,
    logout,
    resetPassword,
    sendVerificationEmail,
    refreshProfile,
    needsProfileSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
