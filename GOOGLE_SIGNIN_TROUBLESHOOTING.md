# Google Sign In Troubleshooting Guide

## Quick Checklist

Before testing, verify:
- [ ] Firebase project is active: `bettleitout`
- [ ] Google Sign-In is enabled in Firebase Console
- [ ] OAuth consent screen is configured in Google Cloud Console
- [ ] Web client ID matches: `907613423588-hpi2gjdqkoq8ldr4lv9q8v4ilsi43rkp`
- [ ] iOS client ID matches: `907613423588-e9ev9rrm5qaqn7ohco38ki23uq920f6f`
- [ ] Bundle identifier is consistent: `com.battleitout.app`

## Common Errors and Solutions

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Check the console logs for the exact redirect URI being used
2. Go to Google Cloud Console → APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID (Web client)
4. Add the redirect URI from the logs to "Authorized redirect URIs"
5. Common redirect URIs for Expo:
   - Development: `https://auth.expo.io/@your-username/your-app-slug`
   - Production: `com.battleitout.app://` or your custom scheme

### Error: "invalid_client"

**Cause:** Client ID mismatch or incorrect configuration.

**Solution:**
1. Verify the web client ID in `services/authService.js` matches Firebase Console
2. Check that the client ID is for a "Web application" type (not Android/iOS)
3. Ensure the client ID is from the correct Firebase project

### Error: "access_denied"

**Cause:** User denied permissions or OAuth consent screen not configured.

**Solution:**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Ensure the consent screen is published (not in testing mode, or add test users)
3. Verify required scopes are added: `openid`, `profile`, `email`

### Error: "No ID token received"

**Cause:** OAuth flow completed but didn't return an ID token.

**Solution:**
1. Check that `responseType: AuthSession.ResponseType.IdToken` is set
2. Verify the OAuth flow completed successfully (check result.type === 'success')
3. Check console logs for the full result object

### Error: Network/Connection Issues

**Cause:** Device doesn't have internet or can't reach Google servers.

**Solution:**
1. Check device internet connection
2. Try on a different network
3. Check if corporate firewall is blocking OAuth requests

## Testing Steps

### 1. Development Build Testing

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

**What to check:**
- Console logs show the redirect URI
- OAuth flow opens in browser/app
- User can select Google account
- Sign-in completes successfully

### 2. Production Build Testing

```bash
# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
```

**What to check:**
- Deep linking works correctly
- Redirect URI matches production configuration
- No proxy-related issues

## Debug Logging

The updated `signInWithGoogle` function includes detailed logging:

- `🔐 Starting Google Sign-In...` - Function called
- `📱 Platform:` - Shows iOS/Android/Web
- `🆔 Web Client ID:` - Shows the client ID being used
- `🔗 Redirect URI:` - Shows the redirect URI
- `🌐 Prompting for authentication...` - OAuth flow starting
- `📊 Auth result type:` - Result type (success/cancel/error)
- `✅ ID token received` - OAuth successful
- `✅ Firebase authentication successful` - Firebase sign-in complete
- `💾 User ID saved to storage` - Persistence saved

**If sign-in fails, check the console for these logs to identify where it fails.**

## Platform-Specific Notes

### iOS
- Uses `reservedClientId` from `app.json`
- URL scheme: `com.googleusercontent.apps.907613423588-e9ev9rrm5qaqn7ohco38ki23uq920f6f`
- Requires `GoogleService-Info.plist` in project root

### Android
- Uses client ID from `google-services.json`
- Deep linking configured via intent filters
- Requires `google-services.json` in `android/app/` directory

### Web
- Uses web client ID directly
- Redirect URI doesn't use proxy
- May require additional CORS configuration

## Verification Checklist

After implementing fixes:

1. **Code Changes:**
   - [x] Improved error handling in `signInWithGoogle`
   - [x] Added detailed logging
   - [x] Fixed bundle identifier mismatch
   - [ ] Removed/isolated `GoogleSignInApp` folder

2. **Configuration:**
   - [x] Bundle identifier consistent: `com.battleitout.app`
   - [x] iOS client ID correct in `app.json`
   - [x] Web client ID correct in `authService.js`
   - [ ] OAuth redirect URIs added to Google Cloud Console

3. **Testing:**
   - [ ] Test on iOS device/simulator
   - [ ] Test on Android device/emulator
   - [ ] Test in development build
   - [ ] Test in production build (if applicable)
   - [ ] Check console logs for errors

## Still Not Working?

If Google Sign In still doesn't work after following this guide:

1. **Check Firebase Console:**
   - Authentication → Sign-in method → Google → Should be enabled
   - Project Settings → General → Check project ID matches

2. **Check Google Cloud Console:**
   - APIs & Services → Credentials → Verify OAuth 2.0 Client IDs
   - APIs & Services → OAuth consent screen → Should be configured
   - APIs & Services → Library → Google+ API should be enabled

3. **Check App Configuration:**
   - `app.json` → iOS bundle identifier matches everywhere
   - `app.json` → Android package name matches `google-services.json`
   - `google-services.json` → Package name: `com.battleitout.app`
   - `GoogleService-Info.plist` → Bundle ID: `com.battleitout.app`

4. **Check Logs:**
   - Enable verbose logging (already done in updated code)
   - Look for specific error codes
   - Check network requests in browser dev tools (if testing on web)

5. **Common Final Checks:**
   - Rebuild the app after configuration changes
   - Clear app data/cache
   - Try signing in with a different Google account
   - Check if the Google account has 2FA enabled (should still work)
   - Verify the app is using the correct Firebase project

## Support Resources

- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)



