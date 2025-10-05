import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from '../config/firebase';
import { UserProfile, UpdateProfileData, ApiResponse } from '@journey-to-citizen/types';

/**
 * Hook to interact with Firebase Cloud Functions
 */
export const useFirebaseFunctions = () => {
  /**
   * Get current user's profile from Firestore
   */
  const getUserInfo = async (): Promise<UserProfile> => {
    const getUserInfoFn = httpsCallable<void, UserProfile>(functions, 'getUserInfo');
    const result: HttpsCallableResult<UserProfile> = await getUserInfoFn();
    return result.data;
  };

  /**
   * Update current user's profile in Firestore
   */
  const updateUserProfile = async (data: UpdateProfileData): Promise<{ success: boolean; message: string; data: any }> => {
    const updateUserProfileFn = httpsCallable<UpdateProfileData, { success: boolean; message: string; data: any }>(
      functions,
      'updateUserProfile'
    );
    const result = await updateUserProfileFn(data);
    return result.data;
  };

  return {
    getUserInfo,
    updateUserProfile,
  };
};
