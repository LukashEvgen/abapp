# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/proguard/libexec/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ═════════════════════════════════════════════════════════════════
# LexTrack — production ProGuard rules
# Generated: 2026-06-13 by Android Developer (MYA-16)
# Covers: Firebase, React Navigation, Reanimated, PDF, WebView,
#         Vector Icons, Document Picker, Image Picker, Blob Util
# ═════════════════════════════════════════════════════════════════

# ── React Native core ──────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# ── Firebase (Auth, Firestore, Storage, Messaging, AppCheck) ───
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Auth
-keep class com.google.firebase.auth.** { *; }
-keep class com.google.firebase.FirebaseException { *; }

# Firebase Firestore
-keep class com.google.firebase.firestore.** { *; }
-keepclassmembers class com.google.firebase.firestore.** { *; }

# Firebase Storage
-keep class com.google.firebase.storage.** { *; }

# Firebase App Check (Play Integrity)
-keep class com.google.firebase.appcheck.** { *; }
-keep class com.google.firebase.appcheck.playintegrity.** { *; }

# ── React Navigation & Screens ───────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }
-dontwarn com.swmansion.rnscreens.**
-dontwarn com.swmansion.gesturehandler.**
-dontwarn com.th3rdwave.safeareacontext.**

# Keep Navigation Native Activity
-keep class com.facebook.react.ReactActivity { *; }

# ── Reanimated 3.x ─────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.reanimated.transitions.** { *; }
-dontwarn com.swmansion.reanimated.**

# Keep Reanimated NativeModule
-keepclassmembers class com.swmansion.reanimated.NativeProxy { *; }

# ── react-native-pdf + react-native-blob-util ──────────────────
-keep class com.reactnativecommunity.webview.** { *; }
-keep class com.RNFetchBlob.** { *; }
-keep class com.ReactNativeBlobUtil.** { *; }
-dontwarn com.RNFetchBlob.**
-dontwarn com.ReactNativeBlobUtil.**

# PDF renderer (AndroidPdfViewer / PdfRenderer)
-keep class com.github.barteksc.pdfviewer.** { *; }
-keep class com.shockwave.pdfium.** { *; }
-dontwarn com.github.barteksc.pdfviewer.**
-dontwarn com.shockwave.pdfium.**

# ── react-native-webview ───────────────────────────────────────
-keep class com.reactnativecommunity.webview.** { *; }
-dontwarn com.reactnativecommunity.webview.**

# ── react-native-vector-icons ──────────────────────────────────
-keep class com.oblador.vectoricons.** { *; }
-dontwarn com.oblador.vectoricons.**

# ── react-native-document-picker ───────────────────────────────
-keep class com.reactnativedocumentpicker.** { *; }
-dontwarn com.reactnativedocumentpicker.**

# ── react-native-image-picker ──────────────────────────────────
-keep class com.imagepicker.** { *; }
-dontwarn com.imagepicker.**

# ── General Android / JS interfaces ────────────────────────────
-keepattributes *Annotation*
-keepattributes Exceptions
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable

# Keep JS interfaces for WebView
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Keep JS callback interfaces
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep parcelable classes
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes (used by some native modules)
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}
