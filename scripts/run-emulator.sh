#!/usr/bin/env bash
# Build headless Android emulator Docker image for LexTrack visual regression.
# Usage: ./scripts/run-emulator.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE_TAG="lextrack-emulator:latest"
ANDROID_SDK_HOST="${ROOT_DIR}/android-sdk"
ANDROID_AVD_HOME="${ANDROID_AVD_HOME:-/home/leo/.android/avd}"

if [ ! -d "$ANDROID_SDK_HOST/cmdline-tools" ]; then
  echo "ERROR: Android SDK not found at $ANDROID_SDK_HOST"
  echo "Run scripts/setup-android-sdk.sh first or ensure the SDK exists."
  exit 1
fi

echo "Building $IMAGE_TAG (if needed)..."
docker build -f "$SCRIPT_DIR/Dockerfile.emulator" -t "$IMAGE_TAG" "$SCRIPT_DIR" &>/dev/null || docker build -f "$SCRIPT_DIR/Dockerfile.emulator" -t "$IMAGE_TAG" "$SCRIPT_DIR"

echo "Starting headless Android emulator..."
exec docker run --rm \
  --device /dev/kvm \
  -v "$ANDROID_SDK_HOST:/opt/android-sdk:rw" \
  -v "$ANDROID_AVD_HOME:/root/.android/avd:rw" \
  -p 5554:5554 \
  -p 5555:5555 \
  "$IMAGE_TAG" \
  bash -c "export ANDROID_HOME=/opt/android-sdk; export ANDROID_SDK_ROOT=/opt/android-sdk; export ANDROID_AVD_HOME=/root/.android/avd; export PATH=\$ANDROID_HOME/emulator:\$ANDROID_HOME/platform-tools:\$PATH; emulator -avd ci_avd -no-window -gpu swiftshader_indirect -no-snapshot-save -no-audio -no-boot-anim"
