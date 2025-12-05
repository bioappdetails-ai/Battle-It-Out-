# Keystore Configuration Guide

## Current Setup

Your `google-services.json` already has a SHA-1 certificate hash configured:
- **SHA-1 Hash**: `8bd1ab99fcf02f3e25078204b73a360de5d98cc0`
- **Package Name**: `com.battleitout.app`

## Options for Keystore Management

### Option 1: Let EAS Build Manage Keystore (Recommended for Development)

**For Development Builds:**
- EAS Build can automatically create and manage keystores for you
- No manual keystore generation needed
- EAS will handle the signing automatically

**Steps:**
1. Just run the build command:
   ```bash
   eas build --profile development --platform android
   ```
2. EAS will prompt you if you want to create a new keystore or use an existing one
3. If this is your first build, EAS will create a keystore automatically

**Important:** After EAS creates the keystore, you'll need to:
1. Get the SHA-1 from the EAS-managed keystore
2. Add that SHA-1 to Firebase Console
3. Download the updated `google-services.json`

### Option 2: Use Your Own Keystore

**If you want to use your own keystore:**

1. **Generate a new keystore** (if you don't have one):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore battleitout-release.keystore -alias battleitout-key -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Get the SHA-1 from your keystore**:
   ```bash
   keytool -list -v -keystore battleitout-release.keystore -alias battleitout-key
   ```

3. **Add SHA-1 to Firebase Console**:
   - Go to Firebase Console → Project Settings → Your Android App
   - Add the SHA-1 fingerprint
   - Download the updated `google-services.json`

4. **Configure EAS to use your keystore**:
   ```bash
   eas credentials
   ```
   - Select Android
   - Choose "Set up a new keystore" or "Use existing keystore"
   - Upload your keystore file

### Option 3: Use Debug Keystore (For Testing Only)

**For local development builds:**

1. **Get SHA-1 from debug keystore**:
   ```bash
   # Windows
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Mac/Linux
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. **Add SHA-1 to Firebase Console** (if not already added)

3. **Download updated google-services.json**

## Recommendation

**For your first development build:**
1. **Let EAS manage the keystore** - This is the easiest option
2. After the build completes, get the SHA-1 from EAS
3. Add that SHA-1 to Firebase Console
4. Download the updated `google-services.json`
5. Rebuild if needed

**For production builds:**
- You should use your own keystore that you control
- Store it securely (never commit to git)
- Keep backups in a secure location

## Getting SHA-1 from EAS-Managed Keystore

After EAS creates a keystore, you can get the SHA-1:

```bash
eas credentials
```

Select Android → View credentials → The SHA-1 will be displayed there.

## Updating Firebase with New SHA-1

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bettleitout`
3. Go to Project Settings → Your Android App
4. Click "Add fingerprint"
5. Paste your SHA-1 hash
6. Download the updated `google-services.json`
7. Replace the file in your project

## Important Notes

- **Never commit keystore files to git** - Add them to `.gitignore`
- **Keep backups** of your production keystore in a secure location
- **SHA-1 must match** - The SHA-1 in `google-services.json` must match the keystore used to sign the app
- **Multiple SHA-1s** - You can add multiple SHA-1 fingerprints in Firebase (useful for debug + release)

