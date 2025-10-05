/**
 * Shared types for Journey to Citizen app
 * Used across frontend, backend, and cloud functions
 */

/**
 * User profile data structure stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  status?: 'active' | 'inactive';
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

/**
 * Update profile request data
 * Used when updating user profile via Cloud Functions
 */
export interface UpdateProfileData {
  displayName?: string;
  status?: 'active' | 'inactive';
  [key: string]: any; // Allow additional custom fields
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
