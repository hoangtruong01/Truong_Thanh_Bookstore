# Trường Thành Bookstore — Mobile Release & Deployment Guide

This guide details the end-to-end procedure for signing, building, and deploying the **Trường Thành Bookstore** mobile application to Google Play Store and Apple App Store.

## Local verification update — 2026-09-06

Run `flutter analyze` and `flutter test` from `mobile`. Local tests now cover
search/cart/COD/history API contracts, retry idempotency, push token rotation,
logout during token resolution, Firebase failures, and release API validation.
These mocked tests do not certify physical-device behavior or push delivery.

Release startup now requires `--dart-define=API_URL=https://your-api-host/api`;
missing URLs, HTTP, localhost/emulator URLs, embedded credentials and query
strings are rejected. A trailing slash is normalized. Validate the URL before
building a signed artifact; debug builds retain local API defaults.

Push registration runs independently from authentication and is retried when a
stored session is restored. Token refresh uses the current session. Firebase or
registration HTTP errors no longer cause successful login/register to fail.

Device acceptance remains pending: Android/iOS signed builds, APNs entitlement
and provisioning, foreground/background/terminated notification behavior,
See `../docs/PENDING_TASKS.md` (Task MOBILE-01 & MOBILE-02) for the verified scope and open acceptance gates.

Follow-up: 42 local tests pass. Foreground notifications now show an in-app
notice with an order action, and order details wait for session restoration.
Checkout stays locked through payment initiation. Runner.entitlements is wired
to all three iOS build configurations: Debug uses development APNs, Profile and
Release use production APNs. Match the provisioning profile to this setting (or
override APS_ENVIRONMENT for a development-signed Profile build). Upload APNs
credentials in Firebase and verify the signed entitlements on macOS before
accepting iOS push delivery. No signing certificate or service-account key has
been generated or added by this change.

---

## 1. Android Release Guide

### Step 1.1: Generate Release Keystore
Run the generation script from the project root:

**On Windows (PowerShell):**
```powershell
.\mobile\scripts\generate-keystore.ps1
```

**On macOS / Linux (Bash):**
```bash
bash mobile/scripts/generate-keystore.sh
```

This creates a 2048-bit RSA key at `mobile/android/app/upload-keystore.jks`.

> [!CAUTION]
> **Backup your keystore securely!** If you lose this keystore file and key alias/passwords, you will **not** be able to publish updates to existing app users on Google Play.

---

### Step 1.2: Configure `key.properties`
1. Copy `mobile/android/key.properties.example` to `mobile/android/key.properties`:
   ```bash
   cp mobile/android/key.properties.example mobile/android/key.properties
   ```
2. Populate the passwords matching the ones you specified during generation:
   ```properties
   storePassword=YourKeystorePasswordHere
   keyPassword=YourKeyPasswordHere
   keyAlias=truongthanh_release_key
   storeFile=../app/upload-keystore.jks
   ```
3. Verify that `key.properties` and `*.jks` remain gitignored.

---

### Step 1.3: Version Bumping
Update `version` in `mobile/pubspec.yaml`:
```yaml
version: 1.0.0+1
```
- Format: `version_name+version_code` (e.g., `1.0.1+2` for the second release).
- Google Play strictly requires `version_code` to increment with each upload.

---

### Step 1.4: Build Release Artifacts
From `mobile/` directory:

- **Google Play Bundle (Recommended for Play Store):**
  ```bash
  flutter build appbundle --release
  ```
  *Output:* `mobile/build/app/outputs/bundle/release/app-release.aab`

- **Split APKs (For direct distribution/testing):**
  ```bash
  flutter build apk --release --split-per-abi
  ```
  *Output:* `mobile/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk`, etc.

---

## 2. iOS Release Guide

### Step 2.1: Apple Developer Prerequisites
1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/).
2. Create App ID with Bundle Identifier `com.truongthanh.mobile` in Apple Developer Portal.
3. Create App Record in [App Store Connect](https://appstoreconnect.apple.com/).

### Step 2.2: Signing & Capabilities
1. Open `mobile/ios/Runner.xcworkspace` in Xcode.
2. Select the `Runner` project > `Signing & Capabilities`.
3. Select your registered Team and check **"Automatically manage signing"**.
4. Ensure **Push Notifications** and **Background Modes** (Remote notifications) are checked if using FCM.

### Step 2.3: Build & Archive
From `mobile/` directory:
```bash
flutter build ipa --release
```
*Output:* `mobile/build/ios/ipa/Runner.ipa`

Upload to App Store Connect via Xcode Organizer or CLI:
```bash
xcrun altool --upload-app --type ios -f build/ios/ipa/Runner.ipa --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
```

---

## 3. Firebase Cloud Messaging (FCM) & Push Notifications

**Audit 2026-09-05: not release complete.** `FcmNotificationService` is a scaffold.
The project does not yet include `firebase_core` / `firebase_messaging`, SDK
initialization, foreground/background/token-refresh listeners, or a backend
`POST /notifications/device-token` endpoint and FCM sender. Configuration files
alone do not enable push notifications. Validate these on a physical device
before marking MOBILE-01 complete.

### Configuration Files
- **Android:** Place `google-services.json` in `mobile/android/app/`.
- **iOS:** Place `GoogleService-Info.plist` in `mobile/ios/Runner/` via Xcode.
- **Apple APNs:** Upload your APNs auth key (`.p8`) to Firebase Console > Project Settings > Cloud Messaging.

### In-App Notification Handling
- In-app notifications are loaded by `NotificationProvider`; `NotificationsScreen`
  opens `OrderDetailScreen` using the backend `meta.orderId` field.
- `FcmNotificationService` has a routing helper but is not wired into `main.dart`.
- Signed Android AAB, iOS archive, APNs and actual push delivery remain unverified.
