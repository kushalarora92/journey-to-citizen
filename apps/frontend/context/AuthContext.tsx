import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { UserProfile } from '@journey-to-citizen/types';
import * as Crypto from 'expo-crypto';

// Conditionally import Google Sign-In for native platforms
// Wrapped in try-catch to handle Expo Go where native modules aren't available
let GoogleSignin: any = null;
let statusCodes: any = null;
let isGoogleSignInAvailable = false;

// Conditionally import Apple Authentication for native platforms
let AppleAuthentication: any = null;
let isAppleAuthAvailable = false;

if (Platform.OS !== 'web') {
  try {
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignInModule.GoogleSignin;
    statusCodes = googleSignInModule.statusCodes;
    isGoogleSignInAvailable = true;
  } catch (error) {
    console.debug('Google Sign-In native module not available (running in Expo Go?)');
    console.log('Google Sign-In native module not available on this platform');
    isGoogleSignInAvailable = false;
  }
  
  // Load Apple Authentication for iOS
  if (Platform.OS === 'ios') {
    try {
      AppleAuthentication = require('expo-apple-authentication');
      isAppleAuthAvailable = true;
    } catch (error) {
      console.debug('Apple Authentication not available (running in Expo Go?)');
      console.log('Apple Authentication not available on this platform');
      isAppleAuthAvailable = false;
    }
  }
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUserProfile: () => Promise<void>; // Alias for refreshProfile
  updateLocalProfile: (profile: UserProfile) => void;
  needsProfileSetup: boolean;
  isScheduledForDeletion: boolean;
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
  const { setAnalyticsUserId, setAnalyticsUserProperties, trackEvent } = useAnalytics();

  // Configure Google Sign-In for native platforms (only if available)
  useEffect(() => {
    if (Platform.OS !== 'web' && isGoogleSignInAvailable && GoogleSignin) {
      GoogleSignin.configure({
        // Web client ID from environment variable
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
    }
  }, []);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (currentUser: User) => {
    if (!currentUser) return;
    
    setProfileLoading(true);
    try {
      const profile = await getUserInfo();
      setUserProfile(profile);
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
    !userProfile.profileComplete
  );

  // Check if user's account is scheduled for deletion
  const isScheduledForDeletion = Boolean(
    user &&
    userProfile &&
    userProfile.deletionStatus === 'scheduled_for_deletion'
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        
        // Set analytics user ID
        if (user) {
          setAnalyticsUserId(user.uid);
        } else {
          setAnalyticsUserId(null);
        }
        
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
    
    // Track sign up event
    trackEvent('sign_up', {
      method: 'email',
    });
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Profile will be fetched automatically by onAuthStateChanged
    if (userCredential.user.emailVerified) {
      await fetchUserProfile(userCredential.user);
    }
    
    // Track login event
    trackEvent('login', {
      method: 'email',
    });
  };

  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      // Web: Use Firebase's signInWithPopup
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      try {
        const result = await signInWithPopup(auth, provider);
        
        // Profile will be fetched automatically by onAuthStateChanged
        // Google users always have verified emails
        if (result.user) {
          await fetchUserProfile(result.user);
        }
        
        // Track login event
        trackEvent('login', {
          method: 'google',
        });
      } catch (error: any) {
        // Handle account exists with different credential
        // Currently, Firebase setting enabled that allow linking of accounts. Check is just for the future.
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error('An account already exists with this email. Please sign in with your email and password instead.');
        }
        throw error;
      }
    } else {
      // Native: Use @react-native-google-signin/google-signin
      if (!isGoogleSignInAvailable || !GoogleSignin) {
        console.debug('Google Sign-In is not available on this platform. Probably running in Expo Go.');
        throw new Error('Google Sign-In is not available on this platform. Make sure a legit build is being used.');
      }
      
      try {
        // Check if Google Play Services are available (Android only)
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        // Trigger Google Sign-In flow
        const signInResult = await GoogleSignin.signIn();
        
        // Get the ID token
        const idToken = signInResult?.data?.idToken;
        
        if (!idToken) {
          throw new Error('No ID token returned from Google Sign-In');
        }
        
        // Create Firebase credential with the Google ID token
        const googleCredential = GoogleAuthProvider.credential(idToken);
        
        // Sign in to Firebase with the credential
        const result = await signInWithCredential(auth, googleCredential);
        
        // Profile will be fetched automatically by onAuthStateChanged
        if (result.user) {
          await fetchUserProfile(result.user);
        }
        
        // Track login event
        trackEvent('login', {
          method: 'google',
        });
      } catch (error: any) {
        // Handle account exists with different credential
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error('An account already exists with this email. Please sign in with your email and password instead.');
        }

        // Handle specific Google Sign-In errors
        if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
          throw new Error('Sign in was cancelled');
        } else if (error.code === statusCodes?.IN_PROGRESS) {
          throw new Error('Sign in is already in progress');
        } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new Error('Google Play Services are not available');
        } else {
          throw error;
        }
      }
    }
  };

  const signInWithApple = async () => {
    if (Platform.OS === 'web') {
      // Web: Use Firebase's signInWithPopup with OAuthProvider
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      try {
        const result = await signInWithPopup(auth, provider);
        
        // Profile will be fetched automatically by onAuthStateChanged
        // Apple users always have verified emails
        if (result.user) {
          await fetchUserProfile(result.user);
        }
        
        // Track login event
        trackEvent('login', {
          method: 'apple',
        });
      } catch (error: any) {
        // Handle account exists with different credential
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error('An account already exists with this email. Please sign in with your email and password instead.');
        }
        throw error;
      }
    } else {
      // Native: Use expo-apple-authentication
      if (!isAppleAuthAvailable || !AppleAuthentication) {
        throw new Error('Apple Sign-In is not available on this platform. Only available on iOS devices.');
      }
      
      try {
        // Generate nonce for security
        const nonce = Math.random().toString(36).substring(2, 10);
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          nonce
        );
        
        // Request Apple authentication
        const appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });
        
        // Get the identity token
        const { identityToken } = appleCredential;
        
        if (!identityToken) {
          throw new Error('No identity token returned from Apple Sign-In');
        }
        
        // Create Firebase credential with the Apple ID token and nonce
        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({
          idToken: identityToken,
          rawNonce: nonce,
        });
        
        // Sign in to Firebase with the credential
        const result = await signInWithCredential(auth, credential);
        
        // Profile will be fetched automatically by onAuthStateChanged
        if (result.user) {
          await fetchUserProfile(result.user);
        }
        
        // Track login event
        trackEvent('login', {
          method: 'apple',
        });
      } catch (error: any) {
        // Handle account exists with different credential
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error('An account already exists with this email. Please sign in with your email and password instead.');
        }
        
        // Handle user cancellation
        if (error.code === 'ERR_REQUEST_CANCELED') {
          throw new Error('Sign in was cancelled');
        }
        
        throw error;
      }
    }
  };

  const logout = async () => {
    setUserProfile(null);
    
    // Sign out from Google on native platforms (only if available)
    if (Platform.OS !== 'web' && isGoogleSignInAvailable && GoogleSignin) {
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore Google sign-out errors (user might not have signed in with Google)
        console.log('Google sign-out skipped or failed:', error);
      }
    }
    
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const updateLocalProfile = (profile: UserProfile) => {
    setUserProfile(profile);
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
    signInWithGoogle,
    signInWithApple,
    logout,
    resetPassword,
    sendVerificationEmail,
    refreshProfile,
    refreshUserProfile: refreshProfile, // Alias for refreshProfile
    updateLocalProfile,
    needsProfileSetup,
    isScheduledForDeletion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
