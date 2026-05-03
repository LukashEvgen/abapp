#!/usr/bin/env bash
# One-time setup: download Android SDK to repo-local android-sdk/ and create an AVD.
# Run this once on a new machine / workspace.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ANDROID_SDK="${ROOT_DIR}/android-sdk"
mkdir -p "$ANDROID_SDK"

if [ ! -d "$ANDROID_SDK/cmdline-tools/latest" ]; then
  echo "Downloading Android command line tools..."
  curl -L -o "$ANDROID_SDK/cmdline-tools.zip" "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  python3 -c "import zipfile; zipfile.ZipFile('$ANDROID_SDK/cmdline-tools.zip').extractall('/tmp/cmdline-tools')"
  mkdir -p "$ANDROID_SDK/cmdline-tools/latest"
  mv /tmp/cmdline-tools/cmdline-tools/* "$ANDROID_SDK/cmdline-tools/latest/"
  rm -f "$ANDROID_SDK/cmdline-tools.zip"
  chmod +x "$ANDROID_SDK/cmdline-tools/latest/bin/"*
fi

export ANDROID_HOME="$ANDROID_SDK"
export ANDROID_SDK_ROOT="$ANDROID_SDK"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# Accept licenses
yes | sdkmanager --licenses &>/dev/null || true

# Install platform tools, build tools, emulator
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "emulator"

# Install system image
sdkmanager "system-images;android-34;google_apis;x86_64"

# Create AVD
export ANDROID_AVD_HOME="/home/leo/.android/avd"
mkdir -p "$ANDROID_AVD_HOME"
avdmanager create avd -n ci_avd -k "system-images;android-34;google_apis;x86_64" -d pixel_5 --force

AVD_DIR="$ANDROID_AVD_HOME/ci_avd.avd"
# Minimal config suitable for headless CI
cat > "$AVD_DIR/config.ini" <<'EOF'
abi.type = x86_64
avd.ini.encoding = UTF-8
disk.dataPartition.size = 2G
fastboot.forceColdBoot = no
fastboot.forceFastBoot = yes
hw.battery = no
hw.cpu.arch = x86_64
hw.cpu.ncore = 1
hw.device.manufacturer = Google
hw.device.name = pixel_5
hw.gps = no
hw.gpu.enabled = yes
hw.gpu.mode = swiftshader_indirect
hw.keyboard = no
hw.lcd.density = 440
hw.lcd.height = 2340
hw.lcd.width = 1080
hw.ramSize = 1024M
hw.trackBall = no
image.sysdir.1 = system-images/android-34/google_apis/x86_64/
showDeviceFrame = no
EOF

echo "Android SDK installed at: $ANDROID_SDK"
echo "AVD created at:    $AVD_DIR"
echo "Next step: run ./scripts/run-emulator.sh"
