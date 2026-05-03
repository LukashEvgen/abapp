#!/usr/bin/env bash
# setup-android-ci-env.sh
# Source this script to configure the execution workspace for headless Android
# emulator builds and visual-regression snapshot capture.
#
# Usage: source scripts/setup-android-ci-env.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export ANDROID_HOME="${PROJECT_ROOT}/android-sdk"
export ANDROID_SDK_ROOT="${ANDROID_HOME}"

# JDK required by Gradle Android Plugin (jlink from JRE-only packages is missing)
export JAVA_HOME="/home/leo/.gradle/jdks/eclipse_adoptium-17-amd64-linux/jdk-17.0.19+10"

# Missing system libraries for the emulator QEMU binary (headless CI image)
# These were extracted from Ubuntu packages into /tmp/libs because sudo is not available.
export LD_LIBRARY_PATH="${ANDROID_HOME}/emulator/lib64:${ANDROID_HOME}/emulator/lib64/qt/lib:${ANDROID_HOME}/emulator/lib:${ANDROID_HOME}/emulator/usr-libs:/tmp/libs/usr/lib/x86_64-linux-gnu:/tmp/libs/usr/lib/x86_64-linux-gnu/pulseaudio${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"

export PATH="${JAVA_HOME}/bin:${ANDROID_HOME}/emulator:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/cmdline-tools/latest/bin:${PATH}"

# Android emulator writes AVD metadata under $HOME/.android/avd by default.
# Ensure the workspace-local AVDs are available there.
if [ -d "$HOME/.android/avd" ]; then
  for avd_ini in "$PROJECT_ROOT"/android/avd/*.ini 2>/dev/null; do
    avd_name=$(basename "$avd_ini" .ini)
    if [ ! -f "$HOME/.android/avd/${avd_name}.ini" ]; then
      cp "$avd_ini" "$HOME/.android/avd/" 2>/dev/null || true
      cp -r "${avd_ini%.ini}.avd" "$HOME/.android/avd/" 2>/dev/null || true
    fi
  done
fi

echo "Android CI env ready:"
echo "  ANDROID_HOME=${ANDROID_HOME}"
echo "  JAVA_HOME=${JAVA_HOME}"
echo "  emulator=$(which emulator 2>/dev/null || echo 'not found')"
echo "  adb=$(which adb 2>/dev/null || echo 'not found')"
echo "  javac=$(which javac 2>/dev/null || echo 'not found')"
