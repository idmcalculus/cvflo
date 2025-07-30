# Supabase Email Templates

This directory contains custom email templates for CVFlo's Supabase authentication system.

## Templates Included

### 1. Sign Up Confirmation (`signup-confirmation.html`)
- **Subject**: "CVFlo - Confirm Your Account"
- **Purpose**: Email verification for new user accounts
- **Variables**: `{{ .ConfirmationURL }}`

### 2. Password Reset (`password-reset.html`)
- **Subject**: "CVFlo - Reset Your Password"
- **Purpose**: Password reset functionality
- **Variables**: `{{ .ConfirmationURL }}`, `{{ .Email }}`

### 3. Welcome Email (`welcome.html`)
- **Subject**: "CVFlo - Welcome to CVFlo!"
- **Purpose**: Welcome new users after successful verification
- **Variables**: `{{ .SiteURL }}`

## How to Configure in Supabase

1. **Go to Supabase Dashboard** → Authentication → Email Templates
2. **For each template:**
   - Select the template type (Confirm signup, Reset password, etc.)
   - Copy the HTML content from the respective file
   - Paste into the template editor
   - Save changes

## Email Configuration

These templates are designed to work with:
- **Sender**: no-reply@jaydeetechltd.com
- **Sender Name**: CVFlo Team
- **SMTP Provider**: Resend (smtp.resend.com)

## Template Features

- **Responsive Design**: Works on desktop and mobile devices
- **Professional Branding**: Consistent CVFlo and JaydeeTech Ltd branding
- **Security Notices**: Appropriate security warnings and expiration notices
- **Accessibility**: Proper HTML structure and alt text
- **Modern Design**: Clean, professional appearance with gradient accents

## Customization

To customize these templates:
1. Edit the HTML files directly
2. Test changes in Supabase's template preview
3. Update branding, colors, or content as needed
4. Ensure all Supabase template variables remain intact

## Support

For questions about these templates, contact: support@jaydeetechltd.com