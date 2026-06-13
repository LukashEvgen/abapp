# ============================================================
# LexTrack Android ProGuard rules (MYA-16)
# ============================================================

# --- React Native ---
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.common.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.views.** { *; }
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.devsupport.** { *; }
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# --- Hermes ---
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# --- Firebase (Play Services / Google Mobile Services) ---
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
-dontwarn com.google.android.play.core.**

# --- React Native Reanimated ---
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.reanimated.transitions.** { *; }
-keep class com.facebook.react.** { *; }

# --- React Native Gesture Handler ---
-keep class com.swmansion.gesturehandler.** { *; }

# --- React Native Screens ---
-keep class com.swmansion.rnscreens.** { *; }

# --- React Native Safe Area ---
-keep class com.th3rdwave.safeareacontext.** { *; }

# --- React Native Vector Icons ---
-keep class com.oblador.vectoricons.** { *; }

# --- React Native PDF renderer (react-native-pdf) ---
-keep class com.github.barteksc.pdfviewer.** { *; }
-keep class com.shockwave.pdfium.** { *; }

# --- React Native Image Picker ---
-keep class com.imagepicker.** { *; }

# --- React Native Document Picker ---
-keep class io.github.elye.** { *; }

# --- React Native Blob Util ---
-keep class com.ReactNativeBlobUtil.** { *; }

# --- React Native Linear Gradient ---
-keep class com.BV.LinearGradient.** { *; }

# --- React Native WebView ---
-keep class com.reactnativecommunity.webview.** { *; }

# --- Native methods ---
-keepclasseswithmembernames class * {
    native <methods>;
}

# --- Keep JavascriptInterface for WebView ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Keep annotations ---
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod
-keepattributes SourceFile,LineNumberTable

# --- Remove verbose logs in release ---
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
