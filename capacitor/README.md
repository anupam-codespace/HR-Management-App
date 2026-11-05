# TeamHub Mobile – Native Projects (iOS & Android)

Native mobile project structure for **TeamHub HRMS**, initialized cleanly with Capacitor to manage native platforms for **iOS** and **Android**.

## Project Structure

```
capacitor/
├── android/                         # Native Android Studio Project (Java & XML)
│   ├── app/src/main/AndroidManifest.xml
│   ├── app/src/main/java/com/teamhub/hrms/MainActivity.java
│   └── app/src/main/res/layout/activity_main.xml
├── ios/                             # Native Xcode Project (Swift)
│   ├── App/App.xcodeproj            # Xcode project (Swift Package Manager)
│   └── App/App/AppDelegate.swift    # Native iOS Swift entry
├── capacitor.config.json            # Capacitor native configuration
├── package.json                     # Native CLI scripts
└── www/                             # Minimal native bridge stub
```

---

## Native Development Workflow

### 1. Android Native Development (`capacitor/android`)
- **Language**: Java / Kotlin
- **Layouts**: Android XML (`res/layout/`)
- **Open in Android Studio**:
  ```bash
  cd capacitor
  npm run cap:android
  ```
- Build and run directly on your Android device or emulator from Android Studio.

### 2. iOS Native Development (`capacitor/ios`)
- **Language**: Swift / SwiftUI / UIKit
- **Dependencies**: Native Swift Package Manager (SPM) — no CocoaPods required
- **Open in Xcode**:
  ```bash
  cd capacitor
  npm run cap:ios
  ```
- Build and run directly on your iPhone or iOS Simulator from Xcode.

### 3. Sync Native Platforms
```bash
cd capacitor
npm run cap:sync
```
