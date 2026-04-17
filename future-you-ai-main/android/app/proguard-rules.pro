# ---- FutureMe AI - ProGuard Rules for Play Store Release ----

# Keep Capacitor WebView JS interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor plugin classes
-keep class com.getcapacitor.** { *; }
-keep class com.korek.futureyouai.** { *; }

# Keep Health Connect classes
-keep class androidx.health.connect.** { *; }

# Preserve line number info for debugging crash reports
-keepattributes SourceFile,LineNumberTable

# Hide original source file name in stack traces
-renamesourcefileattribute SourceFile

# Keep annotation metadata
-keepattributes *Annotation*

# Don't warn about missing Health Connect classes on older devices
-dontwarn androidx.health.connect.**
