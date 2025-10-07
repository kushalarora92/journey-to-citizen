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
  PresenceEntry,
  AbsenceEntry,
} from "@journey-to-citizen/types";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any, require-jsdoc
function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000);
  }
  return new Date(timestamp);
}

/**
 * Check if eligibility-relevant fields have changed
 *
 * @param {Record<string, any>} userData - New user data
 * @param {Record<string, any>} existingData - Existing user data
 * @param {boolean} isNewUser - Whether this is a new user
 * @return {boolean} True if relevant fields changed
 */
function hasEligibilityFieldsChanged(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existingData: Record<string, any>,
  isNewUser: boolean
): boolean {
  // Always calculate for new users
  if (isNewUser) {
    return true;
  }

  // Check if any eligibility-relevant field has changed
  return (
    (userData.prDate !== undefined &&
      JSON.stringify(userData.prDate) !==
        JSON.stringify(existingData.prDate)) ||
    (userData.presenceInCanada !== undefined &&
      JSON.stringify(userData.presenceInCanada) !==
        JSON.stringify(existingData.presenceInCanada)) ||
    (userData.travelAbsences !== undefined &&
      JSON.stringify(userData.travelAbsences) !==
        JSON.stringify(existingData.travelAbsences))
  );
}

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

  const {staticData} = calculateStaticEligibility(profileForCalculation);

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
 * Calculate citizenship eligibility based on user profile
 * Returns static data that will be stored in Firestore
 *
 * Requirements:
 * - Must be physically present in Canada for 1095 days
 *   (3 years) in last 5 years
 * - Each day before PR counts as 0.5 days (max 365 days credit)
 * - Only full days outside Canada count as absences
 * - Day of departure and return count as days IN Canada
 *
 * @param {UserProfile} profile - User profile data
 * @return {object} Static eligibility data to store in Firestore
 */
function calculateStaticEligibility(profile: Partial<UserProfile>): {
  staticData: {
    daysInCanadaAsPR: number;
    preDaysCredit: number;
    totalAbsenceDays: number;
    earliestEligibilityDate: admin.firestore.Timestamp;
  } | null;
} {
  if (!profile.prDate) {
    return {staticData: null};
  }

  const today = new Date();
  const prDate = timestampToDate(profile.prDate);

  // Calculate days as PR
  const daysSincePR = Math.floor(
    (today.getTime() - prDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate pre-PR credit (max 365 days, each day counts as 0.5)
  let preDaysCredit = 0;
  if (profile.presenceInCanada && profile.presenceInCanada.length > 0) {
    const totalPrePRDays = profile.presenceInCanada.reduce(
      (total: number, entry: PresenceEntry) => {
        const from = timestampToDate(entry.from);
        const to = timestampToDate(entry.to);
        const days =
          Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) +
          1;
        return total + days;
      },
      0
    );

    // Each day before PR counts as 0.5 days, max 365 days credit
    preDaysCredit = Math.min(Math.floor(totalPrePRDays * 0.5), 365);
  }

  // Calculate absence days (only past absences)
  let totalAbsenceDays = 0;
  if (profile.travelAbsences && profile.travelAbsences.length > 0) {
    totalAbsenceDays = profile.travelAbsences
      .filter((absence: AbsenceEntry) => {
        const toDate = timestampToDate(absence.to);
        return toDate <= today;
      })
      .reduce((total: number, absence: AbsenceEntry) => {
        const from = timestampToDate(absence.from);
        const to = timestampToDate(absence.to);

        // Only count full days outside (exclude departure and return days)
        const days = Math.max(
          0,
          Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) -
            1
        );
        return total + days;
      }, 0);
  }

  // Calculate days in Canada as PR (excluding absences)
  const daysInCanadaAsPR = Math.max(0, daysSincePR - totalAbsenceDays);

  // Calculate total eligible days
  const totalEligibleDays = daysInCanadaAsPR + preDaysCredit;
  const daysRequired = 1095;
  const daysRemaining = Math.max(0, daysRequired - totalEligibleDays);

  // Calculate earliest application date
  let earliestDate: Date;
  if (daysRemaining > 0) {
    // Assuming no future absences, calculate when they'll reach 1095 days
    earliestDate = new Date(
      today.getTime() + daysRemaining * 24 * 60 * 60 * 1000
    );
  } else {
    // Already eligible
    earliestDate = today;
  }

  return {
    staticData: {
      daysInCanadaAsPR,
      preDaysCredit,
      totalAbsenceDays,
      earliestEligibilityDate: admin.firestore.Timestamp.fromDate(earliestDate),
    },
  };
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

      await userRef.set(userData, {merge: true});

      logger.info(`User profile updated for userId: ${userId}`);

      // Return complete profile by merging existing data with updates
      return {
        success: true,
        message: "Profile updated successfully",
        data: {
          uid: userId,
          email: request.auth.token.email || null,
          ...existingData,
          ...userData,
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
