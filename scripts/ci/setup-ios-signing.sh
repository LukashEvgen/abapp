#!/bin/bash
# =============================================================================
# iOS Code Signing Automation Script
# Project: LexTrack Mobile
# Author: DevOps Engineer (Paperclip)
# =============================================================================
#
# Usage:
#   ./scripts/ci/setup-ios-signing.sh [development|adhoc|appstore]
#
# Required environment variables:
#   MATCH_PASSWORD               — Match repo encryption password
#   MATCH_GIT_URL                — Git URL for Match certificates repo
#   APPLE_TEAM_ID                — Apple Developer Team ID
#   APP_STORE_CONNECT_API_KEY_ID — App Store Connect API Key ID
#   APP_STORE_CONNECT_ISSUER_ID  — App Store Connect Issuer ID
#   APP_STORE_CONNECT_KEY_CONTENT  — Base64-encoded API key content
#
# Optional:
#   FASTLANE_PASSWORD            — Apple ID password (if using non-API-key auth)
#
# =============================================================================

set -euo pipefail

MATCH_TYPE="${1:-development}"
IOS_DIR="ios"

echo "=== iOS Code Signing Setup (Fastlane Match) ==="
echo "Match type: ${MATCH_TYPE}"
echo ""

# Validate required env vars
for var in MATCH_PASSWORD MATCH_GIT_URL APPLE_TEAM_ID; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: Environment variable ${var} is not set" >&2
    exit 1
  fi
done

# Install Fastlane if needed
if ! command -v fastlane >/dev/null 2>&1; then
  echo "[1/4] Installing Fastlane..."
  gem install fastlane --no-document
else
  echo "[1/4] Fastlane already installed ($(fastlane --version | head -1))"
fi

# Verify Bundler in ios directory
if [ -f "${IOS_DIR}/Gemfile" ]; then
  echo "[2/4] Installing Ruby dependencies (bundle install)..."
  cd "${IOS_DIR}" && bundle install && cd -
else
  echo "[2/4] WARNING: No Gemfile found in ${IOS_DIR}"
fi

# Setup App Store Connect API Key (if provided)
if [ -n "${APP_STORE_CONNECT_API_KEY_ID:-}" ] && [ -n "${APP_STORE_CONNECT_ISSUER_ID:-}" ] && [ -n "${APP_STORE_CONNECT_KEY_CONTENT:-}" ]; then
  echo "[3/4] Setting up App Store Connect API key..."
  mkdir -p ~/.appstoreconnect
  echo "${APP_STORE_CONNECT_KEY_CONTENT}" | base64 -d > ~/.appstoreconnect/api_key.p8
  chmod 600 ~/.appstoreconnect/api_key.p8
  export APP_STORE_CONNECT_API_KEY_PATH="${HOME}/.appstoreconnect/api_key.p8"
fi

# Run Match to fetch/sync certificates
echo "[4/4] Running Fastlane Match (${MATCH_TYPE})..."
cd "${IOS_DIR}"

fastlane run match \
  type:"${MATCH_TYPE}" \
  readonly:true \
  git_url:"${MATCH_GIT_URL}" \
  git_branch:"main" \
  team_id:"${APPLE_TEAM_ID}" \
  app_identifier:"com.lextrack.app" \
  verbose:true \
  || {
    echo "ERROR: Match failed — check repository access and credentials" >&2
    exit 1
  }

echo ""
echo "✅ iOS code signing configured successfully!"
echo "Match type: ${MATCH_TYPE}"
echo "Team ID: ${APPLE_TEAM_ID}"
echo "Profile installed at: ~/Library/MobileDevice/Provisioning Profiles/"

# Verify provisioning profile
PROFILES_DIR="${HOME}/Library/MobileDevice/Provisioning Profiles"
if [ -d "${PROFILES_DIR}" ]; then
  COUNT=$(find "${PROFILES_DIR}" -name "*.mobileprovision" | wc -l | tr -d ' ')
  echo "Installed profiles count: ${COUNT}"
fi