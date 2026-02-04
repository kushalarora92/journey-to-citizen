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
import {CloudTasksClient} from "@google-cloud/tasks";
import {
  UserProfile,
  UpdateProfileData,
  ApiResponse,
  DELETION_STATUS,
} from "@journey-to-citizen/types";
import {
  calculateStaticEligibility,
  hasEligibilityFieldsChanged,
} from "@journey-to-citizen/calculations";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

// Initialize Cloud Tasks client
const tasksClient = new CloudTasksClient();

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
 * BLOCKS ACCESS if account is scheduled for deletion
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
        deletionStatus: DELETION_STATUS.ACTIVE,
      };
    }

    // Return user data from Firestore
    const userData = userDoc.data();
    
    // Check deletion status
    if (userData?.deletionStatus === DELETION_STATUS.SCHEDULED_FOR_DELETION) {
      logger.info(
        `User ${userId} is scheduled for deletion - returning limited info`
      );
      
      // Return ONLY deletion-related info, block access to profile data
      return {
        uid: userId,
        email: request.auth.token.email || null,
        displayName: userData.displayName || null,
        deletionStatus: DELETION_STATUS.SCHEDULED_FOR_DELETION,
        deletionScheduledAt: userData.deletionScheduledAt,
        deletionExecutionDate: userData.deletionExecutionDate,
        // DO NOT return profile data (statusHistory, absences, etc.)
      };
    }
    
    logger.info(`User info retrieved for userId: ${userId}`);

    return {
      uid: userId,
      email: request.auth.token.email || null,
      deletionStatus: DELETION_STATUS.ACTIVE,
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

// ============================================================================
// ACCOUNT DELETION WITH 30-DAY GRACE PERIOD
// ============================================================================

/**
 * Helper function to create a Cloud Task for delayed account deletion
 *
 * @param {string} userId - User ID to delete
 * @param {Date} scheduledDate - When to execute the deletion
 * @return {Promise<string>} Task name
 */
async function createDeletionTask(
  userId: string,
  scheduledDate: Date
): Promise<string> {
  const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  const location = process.env.FUNCTION_REGION || "us-central1";
  const queue = "account-deletion-queue";

  if (!project) {
    throw new Error("Project ID not found in environment");
  }

  const parent = tasksClient.queuePath(project, location, queue);

  // URL of the HTTP Cloud Function to call
  const functionUrl =
    `https://${location}-${project}.cloudfunctions.net/` +
    "executeAccountDeletion";

  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: functionUrl,
      body: Buffer.from(JSON.stringify({userId})).toString("base64"),
      headers: {
        "Content-Type": "application/json",
      },
      oidcToken: {
        serviceAccountEmail: `${project}@appspot.gserviceaccount.com`,
      },
    },
    scheduleTime: {
      seconds: Math.floor(scheduledDate.getTime() / 1000),
    },
  };

  const [response] = await tasksClient.createTask({parent, task});
  logger.info(
    `Created deletion task: ${response.name} for userId: ${userId}`
  );

  if (!response.name) {
    throw new Error("Failed to create task: no task name returned");
  }

  return response.name;
}

/**
 * Helper function to send account deletion notification email
 *
 * @param {string} email - User email
 * @param {string} deletionDate - Date when account will be deleted
 */
async function sendDeletionNotificationEmail(
  email: string,
  deletionDate: string
): Promise<void> {
  // TODO: Implement email sending using SendGrid, Mailgun, or
  // Firebase Extensions. For now, just log the email that should be sent
  logger.info(`
    ========================================
    EMAIL NOTIFICATION (Not Actually Sent)
    ========================================
    To: ${email}
    Subject: Account Deletion Scheduled - Journey to Citizen

    Your account deletion has been scheduled.

    Deletion Date: ${deletionDate}

    Your account will be permanently deleted on this date.
    You have 30 days to cancel this request.
    
    To cancel deletion and reactivate your account:
    1. Sign in to the app
    2. Click "Cancel Deletion" on the banner
    
    If you don't cancel, all your data will be permanently deleted:
    - Account information (email, display name)
    - Profile data (PR date, immigration status)
    - Travel history and absence records
    - Physical presence records
    - All analytics and usage data
    
    This action cannot be undone after ${deletionDate}.
    
    ---
    Journey to Citizen Team
    ========================================
  `);
  
  // TODO: Replace with actual email service
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@journeytocitizen.com',
  //   subject: 'Account Deletion Scheduled - Journey to Citizen',
  //   text: '...',
  //   html: '...',
  // });
}

/**
 * Callable function to schedule account deletion
 * Marks account for deletion and creates a Cloud Task to execute after 30 days
 *
 * @param {object} request - The request object (no data required)
 * @returns {object} Deletion scheduled confirmation with date
 */
export const scheduleAccountDeletion = onCall(
  async (request): Promise<ApiResponse<{ deletionDate: string }>> => {
    // TODO: Refactor auth handling to match getUserInfo pattern (handle at Firebase level, not manual check)
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to call this function"
      );
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;

    try {
      logger.info(`Scheduling account deletion for userId: ${userId}`);

      // Calculate deletion date (30 days from now)
      const now = new Date();
      const deletionDate = new Date(now);
      deletionDate.setDate(deletionDate.getDate() + 30);

      // Format as YYYY-MM-DD
      const deletionDateISO = deletionDate.toISOString().split("T")[0];

      // Create Cloud Task for delayed deletion
      const taskName = await createDeletionTask(userId, deletionDate);

      // Update user document with deletion status
      await db.collection("users").doc(userId).set({
        deletionStatus: DELETION_STATUS.SCHEDULED_FOR_DELETION,
        deletionScheduledAt: admin.firestore.FieldValue.serverTimestamp(),
        deletionExecutionDate: deletionDateISO,
        deletionTaskName: taskName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      logger.info(
        `Account deletion scheduled for userId: ${userId}, ` +
        `deletionDate: ${deletionDateISO}`
      );

      // Send email notification
      if (userEmail) {
        await sendDeletionNotificationEmail(userEmail, deletionDateISO);
      }

      return {
        success: true,
        message:
          `Account deletion scheduled for ${deletionDateISO}. ` +
          "You have 30 days to cancel.",
        data: {deletionDate: deletionDateISO},
      };
    } catch (error) {
      logger.error("Error scheduling account deletion:", error);
      throw new HttpsError(
        "internal",
        "Failed to schedule account deletion",
        error
      );
    }
  }
);

/**
 * HTTP function called by Cloud Task to execute account deletion
 * Actually deletes user data and account after 30-day grace period
 *
 * Note: This is an HTTP function (not callable) because it's invoked
 * by Cloud Tasks
 *
 * @param {object} req - Express request with userId in body
 * @param {object} res - Express response
 */
export const executeAccountDeletion = onRequest(async (req, res) => {
  // Verify request is from Cloud Tasks
  // Cloud Tasks will include OIDC token for authentication

  const {userId} = req.body;
  
  if (!userId) {
    res.status(400).send({ error: "userId is required" });
    return;
  }

  try {
    logger.info(`Executing account deletion for userId: ${userId}`);

    // Check if user still wants deletion (they might have cancelled)
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      logger.info(`User ${userId} already deleted or doesn't exist`);
      res.status(200).send({ message: "User already deleted" });
      return;
    }

    const userData = userDoc.data();
    if (userData?.deletionStatus !==
        DELETION_STATUS.SCHEDULED_FOR_DELETION) {
      logger.info(`User ${userId} cancelled deletion, skipping`);
      res.status(200).send({message: "Deletion was cancelled by user"});
      return;
    }

    // Delete all subcollections (absences, status history, etc.)
    const userRef = db.collection("users").doc(userId);
    
    // Delete subcollections if they exist
    const subcollections = ["absences", "statusHistory", "presenceInCanada"];
    for (const subcollection of subcollections) {
      const snapshot = await userRef.collection(subcollection).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      logger.info(`Deleted ${snapshot.size} documents from ${subcollection}`);
    }

    // Delete main user document
    await userRef.delete();
    logger.info(`Firestore data deleted for userId: ${userId}`);

    // Delete user from Firebase Authentication
    try {
      await admin.auth().deleteUser(userId);
      logger.info(`Firebase Auth account deleted for userId: ${userId}`);
    } catch (authError: any) {
      // User might have been deleted already or doesn't exist
      if (authError.code === "auth/user-not-found") {
        logger.info(`Auth user ${userId} already deleted`);
      } else {
        throw authError;
      }
    }

    logger.info(`Account deletion completed for userId: ${userId}`);
    res.status(200).send({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logger.error(
      `Error executing account deletion for userId: ${userId}`,
      error
    );
    res.status(500).send({
      error: "Failed to delete account",
      details: error,
    });
  }
});

/**
 * Callable function to cancel scheduled account deletion
 * Reactivates the account and cancels the deletion task
 *
 * @param {object} request - The request object (no data required)
 * @returns {object} Cancellation confirmation
 */
export const cancelAccountDeletion = onCall(
  async (request): Promise<ApiResponse<null>> => {
    // TODO: Refactor auth handling to match getUserInfo pattern (handle at Firebase level, not manual check)
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to call this function"
      );
    }

    const userId = request.auth.uid;

    try {
      logger.info(`Cancelling account deletion for userId: ${userId}`);

      // Get user document to check deletion status and task name
      const userDoc = await db.collection("users").doc(userId).get();
      
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();

      if (!userData ||
          userData.deletionStatus !==
          DELETION_STATUS.SCHEDULED_FOR_DELETION) {
        throw new HttpsError(
          "failed-precondition",
          "Account is not scheduled for deletion"
        );
      }

      // Cancel the Cloud Task if task name exists
      if (userData.deletionTaskName) {
        try {
          await tasksClient.deleteTask({name: userData.deletionTaskName});
          logger.info(`Deleted Cloud Task: ${userData.deletionTaskName}`);
        } catch (taskError: any) {
          // Task might have already been deleted or doesn't exist
          logger.warn(
            `Could not delete task ${userData.deletionTaskName}:`,
            taskError
          );
        }
      }

      // Reactivate account - remove deletion fields
      await db.collection("users").doc(userId).update({
        deletionStatus: DELETION_STATUS.ACTIVE,
        deletionScheduledAt: admin.firestore.FieldValue.delete(),
        deletionExecutionDate: admin.firestore.FieldValue.delete(),
        deletionTaskName: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Account deletion cancelled for userId: ${userId}`);

      return {
        success: true,
        message:
          "Account deletion cancelled successfully. " +
          "Your account is now active.",
        data: null,
      };
    } catch (error) {
      logger.error("Error cancelling account deletion:", error);
      throw new HttpsError(
        "internal",
        "Failed to cancel account deletion",
        error
      );
    }
  }
);

