#!/bin/bash

# Account Deletion Setup Script
# Run this after deploying functions to configure Cloud Tasks

set -e

echo "🚀 Setting up Account Deletion with Cloud Tasks"
echo "================================================"

# Get project ID from Firebase
PROJECT_ID=$(cat .firebaserc | grep -o '"default": "[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Could not find Firebase project ID in .firebaserc"
  exit 1
fi

echo "📦 Project ID: $PROJECT_ID"

# Get project number
echo ""
echo "📊 Getting project number..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "   Project Number: $PROJECT_NUMBER"

# Get function region (default to us-central1)
REGION="${FUNCTION_REGION:-us-central1}"
echo "   Region: $REGION"

# Step 1: Enable Cloud Tasks API
echo ""
echo "1️⃣  Enabling Cloud Tasks API..."
gcloud services enable cloudtasks.googleapis.com --project=$PROJECT_ID
echo "   ✅ Cloud Tasks API enabled"

# Step 2: Create Cloud Task Queue
echo ""
echo "2️⃣  Creating account-deletion-queue..."
if gcloud tasks queues describe account-deletion-queue --location=$REGION --project=$PROJECT_ID &>/dev/null; then
  echo "   ⚠️  Queue already exists, skipping"
else
  gcloud tasks queues create account-deletion-queue \
    --location=$REGION \
    --project=$PROJECT_ID
  echo "   ✅ Queue created"
fi

# Step 3: Set IAM Permissions
echo ""
echo "3️⃣  Setting IAM permissions..."

# Cloud Tasks Enqueuer (to create tasks)
echo "   Setting Cloud Tasks Enqueuer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/cloudtasks.enqueuer" \
  --quiet
echo "   ✅ Cloud Tasks Enqueuer role set"

# Cloud Functions Invoker (to invoke HTTP functions)
echo "   Setting Cloud Functions Invoker role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/cloudfunctions.invoker" \
  --quiet
echo "   ✅ Cloud Functions Invoker role set"

# Step 4: Deploy Functions
echo ""
echo "4️⃣  Ready to deploy functions!"
echo ""
echo "Run: firebase deploy --only functions"
echo ""
echo "Functions to be deployed:"
echo "  - scheduleAccountDeletion (callable)"
echo "  - executeAccountDeletion (HTTP)"
echo "  - cancelAccountDeletion (callable)"
echo "  - getUserInfo (updated)"

echo ""
echo "================================================"
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy functions: firebase deploy --only functions"
echo "   2. Test deletion flow in the app"
echo "   3. Verify Cloud Task created in console"
echo "   4. Test cancellation"
echo ""
echo "📧 Email notifications currently log to console"
echo "   Implement email service in sendDeletionNotificationEmail()"
echo ""
echo "📖 Full documentation:"
echo "   docs/18.account-deletion/2026-02-02_30day_deletion_implementation.md"
echo "================================================"
