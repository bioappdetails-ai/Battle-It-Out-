# EmailJS Setup Guide

The app uses **EmailJS** to send OTP emails. No domain or server needed!

## Quick Setup (10 minutes)

### Step 1: Sign up for EmailJS
1. Go to [emailjs.com](https://dashboard.emailjs.com) and sign up (free account)
2. Free tier: **200 emails/month**

### Step 2: Create Email Service (You already have this!)
1. Go to "Email Services" in dashboard
2. Click "Add New Service" (if you haven't already)
3. Choose your email provider:
   - **Gmail** (easiest - use your Gmail account)
   - **Outlook** (use your Outlook account)
   - Or any other provider
4. Follow the setup instructions for your chosen provider
5. **Copy the Service ID** (you already have this!)

### Step 3: Create Email Template
1. Go to **"Email Templates"** in the EmailJS dashboard
2. Click **"Create New Template"**
3. Give it a name (e.g., "OTP Verification")
4. Set the **Subject** to:
   ```
   Your {{purpose}} Verification Code
   ```
5. Set the **Content** (HTML or Text) to:
   ```
   Hello,
   
   You have requested to {{purpose}}. 
   
   Your verification code is: {{otp_code}}
   
   This code will expire in 10 minutes.
   
   If you didn't request this code, please ignore this email.
   
   - {{app_name}} Team
   ```
6. **Important:** Make sure your template uses these exact variable names:
   - `{{to_email}}` - Recipient email (EmailJS handles this automatically)
   - `{{otp_code}}` - The 4-digit OTP code
   - `{{purpose}}` - Purpose text (Password Change, Email Change, Account Blocking)
   - `{{app_name}}` - App name (Battle It Out)
7. Click **"Save"**
8. **Copy the Template ID** (you'll see it in the template list or template details)

### Step 4: Get Public Key & Private Key
1. Go to **"Account"** → **"General"** in the EmailJS dashboard
2. Scroll down to find **"API Keys"** section
3. **You need BOTH keys for React Native:**
   - **Public Key** (required for initialization)
   - **Private Key** (required for strict mode)
4. Copy both keys:
   - **Public Key** - Copy this first
   - **Private Key** - Copy this second
5. **IMPORTANT:** Go to **"Account"** → **"Security"** tab
6. **Enable "Allow requests from non-browser applications"** (required for React Native!)
7. If you see "Strict Mode" enabled, you MUST use Private Key (not Public Key)
8. Save the settings

### Step 5: Configure the App
1. Open your `.env` file in the root directory
2. Add all four values:
   ```
   EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
   EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
   EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
   EXPO_PUBLIC_EMAILJS_PRIVATE_KEY=your_private_key_here
   ```
   
   **Important:** 
   - **Public Key is REQUIRED** - Used for EmailJS initialization
   - **Private Key is REQUIRED** - Used for sending emails in strict mode
   - Both keys are needed for React Native apps
3. **Restart your Expo app completely:**
   ```bash
   # Stop the current app (Ctrl+C)
   # Then restart:
   npm start
   # or
   expo start
   ```

### Step 6: Verify It Works
1. Try to block your account or change password
2. Check your email inbox for the OTP code
3. Check console logs for: `✅ Email sent successfully via EmailJS`

## Where to Find Each Value

### Service ID
- Location: **Email Services** section
- You already have this!

### Template ID
- Location: **Email Templates** section
- After creating a template, you'll see the ID in:
  - The template list (right side)
  - Template details page (at the top)
- Format: Usually looks like `template_xxxxx` or just a string of characters

### Public Key (Required)
- Location: **Account** → **General** → **API Keys** section
- Look for **"Public Key"** (required for EmailJS initialization)
- Copy this value

### Private Key (Required for Strict Mode)
- Location: **Account** → **General** → **API Keys** section
- Look for **"Private Key"** (required if strict mode is enabled)
- Format: Usually looks like `xxxxx` (string of characters)
- **Important:** Use Private Key for React Native apps, especially with strict mode enabled

### Public Key (Alternative)
- Location: **Account** → **General** → **API Keys** section
- Only works if strict mode is disabled
- Use `EXPO_PUBLIC_EMAILJS_PUBLIC_KEY` instead of Private Key

## Template Variables Reference

Your EmailJS template must use these exact variable names:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{email}}` | Recipient email | user@example.com |
| `{{otp_code}}` | 4-digit OTP | 1234 |
| `{{purpose}}` | Purpose text | Password Change |
| `{{app_name}}` | App name | Battle It Out |

## Troubleshooting

### "EmailJS not fully configured" error?
- Check that all four values are in `.env`:
  - `EXPO_PUBLIC_EMAILJS_SERVICE_ID`
  - `EXPO_PUBLIC_EMAILJS_TEMPLATE_ID`
  - `EXPO_PUBLIC_EMAILJS_PUBLIC_KEY` (required)
  - `EXPO_PUBLIC_EMAILJS_PRIVATE_KEY` (required for strict mode)

### "The public key is required" error?
- This means the Public Key is missing from your `.env` file
- **Public Key is REQUIRED** even when using Private Key
- Get your Public Key from: **Account** → **General** → **API Keys** → **Public Key**
- Add `EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key` to your `.env` file
- Make sure you restarted the app after adding it

### "API calls in strict mode, but no private key was passed" error?
- This means EmailJS strict mode is enabled
- You MUST have BOTH Public Key and Private Key
- Make sure both are in your `.env` file:
  - `EXPO_PUBLIC_EMAILJS_PUBLIC_KEY` (required)
  - `EXPO_PUBLIC_EMAILJS_PRIVATE_KEY` (required for strict mode)
- Or disable strict mode in EmailJS dashboard: **Account** → **Security** → Disable "Strict Mode"
- Make sure you restarted the app after adding them
- Check console logs to see which one is missing

### Template ID not found?
- Go to Email Templates section
- Click on your template
- The Template ID is shown at the top of the template details page
- Or look in the URL: `.../template/[TEMPLATE_ID]`

### Public Key not found?
- Go to Account → General
- Scroll down to "API Keys" section
- Look for "Public Key" (it's different from Private Key)
- If you don't see it, make sure you're logged in

### Emails not sending?
- Check console logs for detailed error messages
- Verify your email service is connected (in Email Services section)
- Make sure template variables match exactly: `{{otp_code}}`, `{{purpose}}`, etc.
- Check your email service quota (free tier: 200 emails/month)

### Gmail setup issues?
- For Gmail, you may need to:
  1. Enable "Less secure app access" (if using password)
  2. Or use "App Password" (recommended - more secure)
  3. Generate App Password: Google Account → Security → 2-Step Verification → App Passwords

## Support

- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: support@emailjs.com
- Check console logs for detailed error messages
