#!/usr/bin/env bash
# boot-emulator-headless.sh
# Boots the ci_avd Android emulator in headless mode suitable for CI.
# Waits for the device to appear in adb and for the OS to finish booting.
#
# Usage: source scripts/setup-android-ci-env.sh && ./scripts/boot-emulator-headless.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=setup-android-ci-env.sh
source "$SCRIPT_DIR/setup-android-ci-env.sh"

AVD_NAME="${1:-ci_avd}"
ADB="${ANDROID_HOME}/platform-tools/adb"
EMULATOR="${ANDROID_HOME}/emulator/emulator"

# kill any stale emulator instances
pkill -f qemu-system-x86_64 2>/dev/null || true
pkill -f emulator 2>/dev/null || true
sleep 2

echo "Booting AVD '${AVD_NAME}' headless ..."
"${EMULATOR}" -avd "${AVD_NAME}" \
  -no-window \
  -no-audio \
  -gpu swiftshader_indirect \
  -no-boot-anim \
  -accel on \
  2>&1 &
trap 'kill %1 2>/dev/null || true' EXIT

# Wait for adb
for i in $(seq 1 60); do
  DEVICE=$(${ADB} devices 2>/dev/null | grep emulator | awk '{print $1}')
  if [ -n "${DEVICE}" ]; then
    echo "Device detected: ${DEVICE}"
    break
  fi
  sleep 2
done

if [ -z "${DEVICE}" ]; then
  echo "ERROR: No emulator detected in adb after 120s"
  exit 1
fi

# Wait for boot complete
for i in $(seq 1 60); do
  BOOTED=$(${ADB} -s "${DEVICE}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  if [ "${BOOTED}" = "1" ]; then
    echo "Emulator booted: ${DEVICE}"
    break
  fi
  sleep 2
done

if [ "${BOOTED}" != "1" ]; then
  echo "ERROR: Emulator did not finish booting"
  exit 1
fi

echo "Ready for installs / screenshots on ${DEVICE}"
