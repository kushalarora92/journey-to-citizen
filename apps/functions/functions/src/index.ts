/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {
  UserProfile,
  UpdateProfileData,
  ApiResponse,
} from "@journey-to-citizen/types";
import {
  calculateStaticEligibility,
  hasEligibilityFieldsChanged,
} from "@journey-to-citizen/calculations";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

/**
 * Calculate and update eligibility data in user document
 *
 * @param {string} userId - User ID
 * @param {Record<string, any>} userData - User data to update
 * @param {Record<string, any>} existingData - Existing user data
 */
function updateEligibilityData(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existingData: Record<string, any>
): void {
  // Merge existing and new data for calculation
  const profileForCalculation = {
    ...existingData,
    ...userData,
  };

  logger.info(
    `Recalculating eligibility for userId: ${userId} ` +
    "(relevant fields changed)"
  );

  const staticData = calculateStaticEligibility(profileForCalculation);

  // Add calculated fields to userData
  if (staticData) {
    userData.staticEligibility = staticData;

    logger.info(
      `Eligibility calculated: userId=${userId}, ` +
      `daysInCanadaAsPR=${staticData.daysInCanadaAsPR}, ` +
      `preDaysCredit=${staticData.preDaysCredit}, ` +
      `totalAbsenceDays=${staticData.totalAbsenceDays}`
    );
  }
}

/**
 * Sample HTTP function that responds with a greeting
 */
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

/**
 * Callable function to get user information
 * This function fetches user data from Firestore
 *
 * @param {object} request - The request object
 * @returns {object} User information from Firestore
 */
export const getUserInfo = onCall(async (request): Promise<UserProfile> => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to call this function"
    );
  }

  const userId = request.auth.uid;

  try {
    logger.info(`Fetching user info for userId: ${userId}`);

    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      // If user doesn't exist, return basic info from auth
      logger.info(`User document not found for userId: ${userId}`);
      return {
        uid: userId,
        email: request.auth.token.email || null,
        displayName: request.auth.token.name || null,
      };
    }

    // Return user data from Firestore
    const userData = userDoc.data();
    logger.info(`User info retrieved for userId: ${userId}`);

    return {
      uid: userId,
      email: request.auth.token.email || null,
      ...userData,
    };
  } catch (error) {
    logger.error("Error fetching user info:", error);
    throw new HttpsError(
      "internal",
      "Failed to fetch user information",
      error
    );
  }
});

/**
 * Callable function to create or update user profile
 *
 * @param {object} request - The request object containing profile data
 * @returns {object} Success message with updated data
 */
export const updateUserProfile = onCall(
  async (request): Promise<ApiResponse<UserProfile>> => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to call this function"
      );
    }

    const userId = request.auth.uid;
    const profileData = request.data as UpdateProfileData;

    try {
      logger.info(`Updating user profile for userId: ${userId}`);

      // Prepare user document data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userData: Record<string, any> = {
        ...profileData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Get current profile data (single fetch)
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      const existingData = userDoc.exists ? userDoc.data() || {} : {};
      const isNewUser = !userDoc.exists;

      // Add createdAt for first-time profile creation
      if (isNewUser) {
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }

      // Check if relevant fields changed and recalculate eligibility if needed
      if (hasEligibilityFieldsChanged(userData, existingData, isNewUser)) {
        updateEligibilityData(userId, userData, existingData);
      } else {
        logger.info(
          `Skipping eligibility calculation for userId: ${userId} ` +
          "(no relevant fields changed)"
        );
      }

      // Write update to Firestore
      await userRef.set(userData, {merge: true});

      logger.info(`User profile updated for userId: ${userId}`);

      // Read back for complete data with resolved timestamps
      // Note: Reading from same DocumentReference after write is strongly
      // consistent in Cloud Functions (guaranteed by Firestore)
      const updatedDoc = await userRef.get();
      const completeData = updatedDoc.data() || {};

      // Return complete profile with all fields
      return {
        success: true,
        message: "Profile updated successfully",
        data: {
          uid: userId,
          email: request.auth.token.email || null,
          ...completeData,
        } as UserProfile,
      };
    } catch (error) {
      logger.error("Error updating user profile:", error);
      throw new HttpsError(
        "internal",
        "Failed to update user profile",
        error
      );
    }
  }
);
