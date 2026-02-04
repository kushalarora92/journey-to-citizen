# Account Deletion - Quick Setup Guide

## Prerequisites
- Firebase CLI installed and logged in
- gcloud CLI installed and authenticated
- Functions deployed with Cloud Tasks dependency installed

## Quick Setup (5 minutes)

### 1. Run Setup Script
```bash
./setup-deletion.sh
```

This will:
- Enable Cloud Tasks API
- Create `account-deletion-queue`
- Set required IAM permissions

### 2. Deploy Functions
```bash
firebase deploy --only functions
```

### 3. Test the Flow

**Schedule Deletion:**
1. Open app → Profile tab
2. Scroll to Account Management
3. Click "Delete Account"
4. Confirm in modal (type "DELETE")
5. Check Firestore: user should have `deletionStatus: "scheduled_for_deletion"`
6. Check Cloud Tasks console: task should be scheduled 30 days out

**Verify Blocked Access:**
1. Sign out and sign back in
2. Dashboard shows red warning banner
3. Profile tab blocks data access
4. Try to view profile data - should be blocked

**Cancel Deletion:**
1. Click "Cancel Deletion" on banner
2. Confirm cancellation
3. Profile data immediately accessible again
4. Cloud Task cancelled (check console)

**Actual Deletion (Testing):**
```bash
# Option 1: Manually trigger task
gcloud tasks run TASK_NAME --location=us-central1

# Option 2: Reduce delay temporarily
# In scheduleAccountDeletion, change:
# deletionDate.setDate(deletionDate.getDate() + 30);
# To:
# deletionDate.setMinutes(deletionDate.getMinutes() + 5);
```

## Configuration Details

### Cloud Tasks Queue
- **Name:** `account-deletion-queue`
- **Location:** `us-central1` (or your function region)
- **Settings:** Default rate limits and retries

### IAM Permissions
- Cloud Tasks Enqueuer: Create tasks
- Cloud Functions Invoker: Execute HTTP functions

### Function Endpoints
- `scheduleAccountDeletion` - Callable (frontend calls this)
- `executeAccountDeletion` - HTTP (Cloud Task calls this)
- `cancelAccountDeletion` - Callable (banner calls this)
- `getUserInfo` - Callable (checks deletion status)

## Email Notifications (TODO)

Current: Logs to console only

To implement:
1. Choose service: Firebase Extension, SendGrid, Mailgun, etc.
2. Update `sendDeletionNotificationEmail()` in `apps/functions/functions/src/index.ts`
3. Add API keys to environment variables
4. Redeploy functions

## Apple App Store Response

**Location:** Profile tab → Account Management → Delete Account

**Process:**
1. Two-step confirmation with clear warnings
2. 30-day grace period with cancellation option
3. Complete data deletion (Firestore + Auth)
4. No external steps required (all in-app)

## Troubleshooting

**Queue doesn't exist?**
```bash
gcloud tasks queues create account-deletion-queue --location=us-central1
```

**Permission denied?**
```bash
# Re-run IAM binding commands from setup-deletion.sh
```

**Task not created?**
- Check function logs for errors
- Verify Cloud Tasks API enabled
- Check service account permissions

**Can't cancel deletion?**
- Verify cancelAccountDeletion function deployed
- Check Firestore rules allow user access
- Review function logs

## Cost
- Cloud Tasks: Free tier 1M operations/month
- Functions invocations: 2 per deletion
- Estimated: ~$0.0004 per user deletion
- Negligible at scale

## Full Documentation
See: `docs/18.account-deletion/2026-02-02_30day_deletion_implementation.md`
