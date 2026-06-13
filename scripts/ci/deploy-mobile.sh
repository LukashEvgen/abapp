#!/bin/bash
# =============================================================================
# Firebase App Distribution & TestFlight Deployment Script
# Project: LexTrack Mobile
# Author: DevOps Engineer (Paperclip)
# =============================================================================
#
# Usage:
#   ./scripts/ci/deploy-mobile.sh [android|ios] [staging|production] [artifact_path]
#
# Examples:
#   ./scripts/ci/deploy-mobile.sh android staging build/app-debug.apk
#   ./scripts/ci/deploy-mobile.sh android production build/app-release.aab
#   ./scripts/ci/deploy-mobile.sh ios staging build/LexTrack-staging.ipa
#   ./scripts/ci/deploy-mobile.sh ios production build/LexTrack-release.ipa
#
# Required environment variables:
#   FIREBASE_TOKEN          — Firebase CLI token
#   FIREBASE_ANDROID_APP_ID — Android app ID in Firebase
#   FIREBASE_IOS_APP_ID     — iOS app ID in Firebase
#
# For TestFlight (iOS production):
#   APP_STORE_CONNECT_API_KEY_ID    — App Store Connect API Key ID
#   APP_STORE_CONNECT_API_ISSUER_ID — App Store Connect Issuer ID
#   APP_STORE_CONNECT_API_KEY_CONTENT — API key content (base64)
#
# =============================================================================

set -euo pipefail

PLATFORM="${1:-android}"
ENVIRONMENT="${2:-staging}"
ARTIFACT="${3:-}"

echo "=== Mobile Deployment Script ==="
echo "Platform: ${PLATFORM}"
echo "Environment: ${ENVIRONMENT}"
echo "Artifact: ${ARTIFACT}"
echo ""

# Validate artifact exists
if [ -z "${ARTIFACT}" ] || [ ! -f "${ARTIFACT}" ]; then
  echo "ERROR: Artifact not found: ${ARTIFACT}" >&2
  echo "Usage: $0 [android|ios] [staging|production] [artifact_path]"
  exit 1
fi

# Install Firebase CLI if needed
if ! command -v firebase >/dev/null 2>&1; then
  echo "[1/3] Installing Firebase CLI..."
  curl -sL https://firebase.tools | bash
fi

# Determine Firebase project and app ID
if [ "${PLATFORM}" == "android" ]; then
  if [ -z "${FIREBASE_ANDROID_APP_ID:-}" ]; then
    echo "ERROR: FIREBASE_ANDROID_APP_ID not set" >&2
    exit 1
  fi
  APP_ID="${FIREBASE_ANDROID_APP_ID}"
  PROJECT="lextrack-${ENVIRONMENT}"
  GROUPS="qa-team"
  [ "${ENVIRONMENT}" == "production" ] && GROUPS="beta-testers,qa-team"

elif [ "${PLATFORM}" == "ios" ]; then
  if [ -z "${FIREBASE_IOS_APP_ID:-}" ]; then
    echo "ERROR: FIREBASE_IOS_APP_ID not set" >&2
    exit 1
  fi
  APP_ID="${FIREBASE_IOS_APP_ID}"
  PROJECT="lextrack-${ENVIRONMENT}"
  GROUPS="qa-team"

  # TestFlight upload for iOS production
  if [ "${ENVIRONMENT}" == "production" ] && command -v fastlane >/dev/null 2>&1; then
    echo "[2/3] Uploading to TestFlight..."
    cd ios
    fastlane upload_testflight
    cd -
    echo "✅ TestFlight upload completed!"
    exit 0
  fi
else
  echo "ERROR: Invalid platform '${PLATFORM}'. Use 'android' or 'ios'." >&2
  exit 1
fi

# Generate release notes
RELEASE_NOTES="${PLATFORM} ${ENVIRONMENT} build"
[ -n "${GITHUB_SHA:-}" ] && RELEASE_NOTES="${RELEASE_NOTES} — commit ${GITHUB_SHA::8}"
[ -n "${GITHUB_RUN_NUMBER:-}" ] && RELEASE_NOTES="${RELEASE_NOTES} — run #${GITHUB_RUN_NUMBER}"

# Deploy to Firebase App Distribution
echo "[2/3] Uploading to Firebase App Distribution..."
echo "  Project: ${PROJECT}"
echo "  App ID: ${APP_ID}"
echo "  Groups: ${GROUPS}"
echo "  Artifact: ${ARTIFACT}"

firebase appdistribution:distribute "${ARTIFACT}" \
  --app "${APP_ID}" \
  --groups "${GROUPS}" \
  --release-notes "${RELEASE_NOTES}" \
  --project "${PROJECT}" \
  --token "${FIREBASE_TOKEN}"

echo ""
echo "✅ Deployment completed successfully!"
echo "Platform: ${PLATFORM}"
echo "Environment: ${ENVIRONMENT}"
echo "Distribution: Firebase App Distribution"
echo "Groups notified: ${GROUPS}"

# Show distribution link
if [ -n "${GITHUB_SERVER_URL:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ] && [ -n "${GITHUB_RUN_ID:-}" ]; then
  echo ""
  echo "CI Run: ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
fi