#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-$ROOT_DIR/android-sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export ANDROID_AVD_HOME="${ANDROID_AVD_HOME:-/home/leo/.android/avd}"
export PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${PATH}"
export ANDROID_EMULATOR_DISABLE_VULKAN=1
export QEMU_AUDIO_DRV=none
export DISPLAY=""

# Supply missing system library (libpulse) and Qt libraries not on default search path
export LD_LIBRARY_PATH="${ANDROID_HOME}/lib64:${ANDROID_HOME}/lib64/qt/lib:${ANDROID_HOME}/usr-libs:${LD_LIBRARY_PATH:-}"

cd "$ROOT_DIR"

# Verify emulator binary is runnable
if ! which emulator >/dev/null 2>&1; then
  echo "Emulator not found. Ensure Android SDK is installed at ${ANDROID_HOME}"
  exit 1
fi

EMULATOR_ARGS=(
  -avd ci_avd
  -no-window
  -gpu swiftshader_indirect
  -no-snapshot-save
  -no-audio
  -no-boot-anim
  -skin 1080x2340
)

MODE="${1:-foreground}"
if [ "$MODE" = "background" ]; then
  # Background mode for CI pipelines
  echo "Starting emulator in background…"
  nohup emulator "${EMULATOR_ARGS[@]}" > /tmp/emulator.log 2>&1 &
  EMULATOR_PID=$!
  echo "Emulator PID: $EMULATOR_PID"
  sleep 3
  if ! kill -0 $EMULATOR_PID 2>/dev/null; then
    echo "Emulator failed to start. Last 30 lines of /tmp/emulator.log:"
    tail -n 30 /tmp/emulator.log || true
    exit 1
  fi
  echo "Waiting for boot completion…"
  for i in $(seq 1 120); do
    BOOT=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
    if [ "$BOOT" = "1" ]; then
      echo "Boot completed after ${i}s"
      break
    fi
    sleep 2
  done
  if [ "$BOOT" != "1" ]; then
    echo "Timed out waiting for boot"
    tail -n 30 /tmp/emulator.log || true
    adb kill-server 2>/dev/null || true
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
  fi
  adb devices
  echo "Emulator is running — capture screenshot with: adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png ./"
else
  exec emulator "${EMULATOR_ARGS[@]}"
fi
