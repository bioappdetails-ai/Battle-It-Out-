# Development Build Instructions

## Configuration Summary

### App Icons
- **Main Icon**: `./assets/logo.png` (used for icon, adaptiveIcon, and favicon)
- **Notification Icon**: `./assets/home/Header.svg` (configured for push notifications)

### Push Notifications
- **Package**: `expo-notifications` (installed)
- **Plugin**: Configured in `app.json`
- **Icon**: `./assets/home/Header.svg`
- **Color**: `#7594DC`
- **Android Permissions**: Added `RECEIVE_BOOT_COMPLETED` and `VIBRATE`

### SHA-1 Certificate
- **SHA-1 Hash**: `8bd1ab99fcf02f3e25078204b73a360de5d98cc0`
- **Location**: Configured in `google-services.json`
- **Package Name**: `com.battleitout.app`

### Google Services
- **Android**: `./google-services.json`
- **iOS**: `./GoogleService-Info.plist`

## Building the Development Build

### Prerequisites
1. Ensure you have EAS CLI installed:
   ```bash
   npm install -g eas-cli
   ```

2. Login to EAS:
   ```bash
   eas login
   ```

### Build Commands

#### For Android:
```bash
eas build --profile development --platform android
```

#### For iOS:
```bash
eas build --profile development --platform ios
```

#### For Both:
```bash
eas build --profile development --platform all
```

### Local Development Build (Alternative)

If you prefer to build locally:

#### Android:
```bash
npx expo prebuild
npx expo run:android
```

#### iOS:
```bash
npx expo prebuild
npx expo run:ios
```

## Important Notes

1. **SHA-1 Certificate**: The SHA-1 hash `8bd1ab99fcf02f3e25078204b73a360de5d98cc0` is already configured in `google-services.json`. Make sure this matches your keystore certificate when building.

2. **Notification Icon**: The notification icon is set to `Header.svg`. For Android, notification icons typically need to be white/transparent PNGs. Expo may handle the conversion automatically, but if you encounter issues, you may need to provide a PNG version.

3. **Google Sign-In**: The app uses `@react-native-google-signin/google-signin` which requires native code. This will only work in development or production builds, not in Expo Go.

4. **Push Notifications**: After building, you'll need to configure push notification credentials in the Expo dashboard or Firebase Console.

## Verifying SHA-1 Certificate

To verify your SHA-1 certificate matches:

### For Debug Keystore (default):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### For Release Keystore:
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

The SHA-1 hash should match: `8bd1ab99fcf02f3e25078204b73a360de5d98cc0`

## Next Steps

1. Run the build command for your target platform
2. Install the generated APK/IPA on your device
3. Test Google Sign-In functionality
4. Test push notifications
5. Verify all features work correctly

