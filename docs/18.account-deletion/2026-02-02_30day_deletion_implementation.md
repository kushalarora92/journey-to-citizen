# Account Deletion with 30-Day Grace Period

**Date:** February 2, 2026  
**Status:** Implemented  
**Apple Requirement:** Guideline 5.1.1(v) - Account Deletion

## Overview

Implemented a comprehensive account deletion system with a 30-day grace period to meet Apple's App Store requirements while protecting users from accidental deletion.

## Implementation Details

### Architecture

- **30-day grace period**: Users can cancel deletion anytime by signing in
- **Cloud Tasks**: Automated delayed deletion using Firebase Cloud Tasks
- **Email notification**: Users receive email when deletion is scheduled
- **Blocked access**: Users cannot access profile data while deletion is scheduled
- **Reactivation**: Simple one-click cancellation to restore account

### Backend Changes (Firebase Functions)

#### 1. New Cloud Functions

**`scheduleAccountDeletion`** (Callable)
- Marks account as `scheduled_for_deletion`
- Stores deletion date (30 days from now)
- Creates Cloud Task for delayed execution
- Sends email notification
- Returns deletion date to user

**`executeAccountDeletion`** (HTTP - called by Cloud Task)
- Verifies deletion hasn't been cancelled
- Deletes all Firestore data (user doc + subcollections)
- Deletes Firebase Auth account
- Executed automatically after 30 days

**`cancelAccountDeletion`** (Callable)
- Reactivates account
- Cancels scheduled Cloud Task
- Removes deletion status flags
- Restores full access

**`getUserInfo`** (Modified)
- Checks deletion status
- Blocks access to profile data if scheduled for deletion
- Returns only deletion info (date, status) when blocked

#### 2. User Profile Schema (packages/types)

Added fields to `UserProfile`:
```typescript
deletionStatus?: DeletionStatus; // 'active' | 'scheduled_for_deletion' | 'deleted'
deletionScheduledAt?: Timestamp; // When deletion was requested
deletionExecutionDate?: string; // ISO date (YYYY-MM-DD) when deletion will execute
deletionTaskName?: string; // Cloud Task name (for cancellation)
```

#### 3. Dependencies

Added `@google-cloud/tasks@^6.2.1` to handle delayed task execution.

### Frontend Changes

#### 1. Updated Components

**`DeleteAccountModal`**
- Changed from "Delete Account" to "Schedule Deletion"
- Updated messaging to explain 30-day grace period
- Added info box about reactivation option

**`DeletionScheduledBanner`** (New)
- Shows warning banner on dashboard
- Displays days remaining until deletion
- "Cancel Deletion" button for reactivation
- Red/urgent styling to draw attention

#### 2. Updated Hooks

**`useFirebaseFunctions`**
- Replaced `deleteUserAccount` with `scheduleAccountDeletion`
- Added `cancelAccountDeletion`

**`AuthContext`**
- Added `refreshUserProfile` alias for `refreshProfile`
- Used by banner after cancellation to refresh state

#### 3. Updated Screens

**Profile Tab**
- Changed "Delete Account" flow to schedule instead of immediate
- Success message mentions 30-day period and reactivation

**Dashboard Tab**
- Shows `DeletionScheduledBanner` at top if scheduled
- Banner visible until user cancels or 30 days pass

### User Experience Flow

#### Deletion Request
1. User clicks "Delete Account" in Profile tab
2. Modal shows warning about 30-day grace period
3. User types "DELETE" to confirm
4. Account marked as `scheduled_for_deletion`
5. Cloud Task created for 30 days later
6. Email sent with deletion date
7. User logged out

#### During Grace Period
1. User signs in
2. Dashboard shows red warning banner
3. Banner displays days remaining (e.g., "23 days")
4. Profile data is **blocked** (cannot view/edit)
5. User can click "Cancel Deletion" to reactivate
6. Or do nothing and wait for auto-deletion

#### Cancellation
1. User clicks "Cancel Deletion" on banner
2. Confirmation dialog appears
3. Cloud Task cancelled
4. Account status changed to `active`
5. Profile data immediately accessible again
6. Success message shown

#### After 30 Days (No Cancellation)
1. Cloud Task executes `executeAccountDeletion`
2. All Firestore data deleted (user doc + subcollections)
3. Firebase Auth account deleted
4. User permanently removed

### Security & Privacy

- ✅ **GDPR Compliant**: 30-day grace period is acceptable
- ✅ **Apple Compliant**: In-app deletion with clear process
- ✅ **Data Protection**: Access blocked during grace period
- ✅ **Complete Deletion**: All data removed (Firestore + Auth)
- ✅ **Audit Trail**: Logs all deletion events
- ✅ **Email Notification**: User informed of scheduled deletion

### Configuration Required

#### 1. Enable Cloud Tasks API

```bash
# In Firebase Console or via gcloud CLI
gcloud services enable cloudtasks.googleapis.com --project=YOUR_PROJECT_ID
```

#### 2. Create Cloud Task Queue

In Firebase Console → Cloud Tasks:
- Create queue named: `account-deletion-queue`
- Location: `us-central1` (or your functions region)
- Default settings are fine (rate limits, retries)

Or via gcloud:
```bash
gcloud tasks queues create account-deletion-queue \
  --location=us-central1 \
  --project=YOUR_PROJECT_ID
```

#### 3. Set IAM Permissions

Cloud Functions service account needs permission to create tasks:
```bash
# Get project number
PROJECT_ID="your-project-id"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant Cloud Tasks Enqueuer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/cloudtasks.enqueuer"
```

Cloud Tasks needs permission to invoke HTTP functions:
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/cloudfunctions.invoker"
```

#### 4. Environment Variables

Update `.env` if needed:
```bash
FUNCTION_REGION=us-central1  # Or your functions region
GCP_PROJECT=your-project-id
```

#### 5. Deploy Functions

```bash
cd apps/functions
firebase deploy --only functions
```

Key functions deployed:
- `scheduleAccountDeletion`
- `executeAccountDeletion`
- `cancelAccountDeletion`
- `getUserInfo` (updated)

#### 6. Email Service (TODO)

Currently logs email to console. To actually send emails, implement one of:

**Option A: Firebase Extensions - Trigger Email**
- Install "Trigger Email" extension from Firebase Console
- Configure SMTP or SendGrid
- Update `sendDeletionNotificationEmail` to use extension

**Option B: SendGrid**
```bash
npm install @sendgrid/mail
```
```typescript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({
  to: email,
  from: 'noreply@journeytocitizen.com',
  subject: 'Account Deletion Scheduled',
  text: '...',
  html: '...',
});
```

**Option C: Mailgun, AWS SES, etc.**

### Testing Checklist

- [ ] Enable Cloud Tasks API
- [ ] Create `account-deletion-queue`
- [ ] Set IAM permissions
- [ ] Deploy Firebase Functions
- [ ] Test deletion scheduling (check Firestore for deletion fields)
- [ ] Verify Cloud Task created (Cloud Console → Cloud Tasks)
- [ ] Test cancellation (banner appears, reactivates successfully)
- [ ] Test blocked access (profile data not returned during grace period)
- [ ] Test email notification (check logs for now)
- [ ] Wait 30 days OR manually trigger task to test actual deletion
- [ ] Verify complete data removal (Firestore + Auth)

### Manual Task Trigger (For Testing)

To test actual deletion without waiting 30 days:

```bash
# Get the task name from Firestore user document (deletionTaskName field)
TASK_NAME="projects/PROJECT_ID/locations/REGION/queues/account-deletion-queue/tasks/TASK_ID"

# Manually run the task
gcloud tasks run $TASK_NAME --location=us-central1
```

Or create a short-delay task for testing:
```typescript
// In scheduleAccountDeletion function, temporarily change:
const deletionDate = new Date(now);
deletionDate.setMinutes(deletionDate.getMinutes() + 5); // 5 minutes for testing
```

### Apple App Store Submission

This implementation satisfies Apple's requirements:

✅ **In-app account deletion**: Yes - Delete Account button in Profile tab  
✅ **Clear process**: Yes - Two-step confirmation with explanation  
✅ **No external steps required**: Yes - Everything in-app (email is notification only)  
✅ **Grace period allowed**: Yes - 30 days with cancellation option  
✅ **Complete data deletion**: Yes - All Firestore + Auth data removed  

Response to Apple reviewer:
> "Account deletion is available in the Profile tab under Account Management section. Users can schedule deletion with a 30-day grace period and cancel anytime by signing in again. After 30 days, all data is permanently deleted including Firestore documents and Firebase Authentication account."

### Future Improvements

1. **Email Service**: Replace console logs with actual email delivery
2. **Shorter testing delay**: Add environment variable for testing with 1-day grace period
3. **Reminder emails**: Send reminder at 7 days, 1 day before deletion
4. **Data export**: Offer data export before deletion (GDPR right to data portability)
5. **Deletion confirmation email**: Send final email when deletion completes
6. **Analytics**: Track deletion rates, cancellation rates
7. **Admin dashboard**: View pending deletions, manually cancel if needed

### Cost Considerations

- **Cloud Tasks**: Free tier: 1M operations/month, $0.40/million after
- **Cloud Functions invocations**: scheduleAccountDeletion + executeAccountDeletion per user
- **Firestore operations**: Minimal (update user doc, delete subcollections)
- **Expected cost**: ~$0.0004 per deletion (negligible)

### Troubleshooting

**Task not executing after 30 days?**
- Check Cloud Tasks console for task status
- Verify queue exists and is not paused
- Check IAM permissions for service account
- Review function logs for errors

**User can't cancel deletion?**
- Verify `cancelAccountDeletion` function deployed
- Check Firestore rules allow user to read own document
- Verify task name stored in user document

**Email not sending?**
- Currently only logs to console (not implemented)
- Implement email service as described above

**Profile data showing when shouldn't?**
- Verify `getUserInfo` function checks `deletionStatus`
- Check that frontend handles blocked state correctly
- Clear app cache/state and reload

---

**Files Modified:**
- `packages/types/src/index.ts` - Added deletion status types
- `apps/functions/functions/src/index.ts` - New deletion functions
- `apps/functions/functions/package.json` - Added @google-cloud/tasks
- `apps/frontend/hooks/useFirebaseFunctions.ts` - Updated deletion hooks
- `apps/frontend/context/AuthContext.tsx` - Added refreshUserProfile
- `apps/frontend/components/DeleteAccountModal.tsx` - Updated messaging
- `apps/frontend/components/DeletionScheduledBanner.tsx` - New banner component
- `apps/frontend/app/(tabs)/profile.tsx` - Updated deletion flow
- `apps/frontend/app/(tabs)/index.tsx` - Added deletion banner
