export ANDROID_HOME="$(pwd)/android-sdk"
export ANDROID_SDK_ROOT="$(pwd)/android-sdk"
export ANDROID_AVD_HOME="${ANDROID_AVD_HOME:-/home/leo/.android/avd}"
export PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator:${PATH}"
export ANDROID_EMULATOR_DISABLE_VULKAN=1
export QEMU_AUDIO_DRV=none
