# Authentication Testing Checklist

Use this checklist to verify all authentication features are working correctly.

## 📱 Mobile Testing (iOS/Android)

### Sign Up Flow
- [ ] Open app → Should see Sign In screen
- [ ] Click "Sign Up"
- [ ] Enter valid email and password (min 6 chars)
- [ ] Click "Sign Up"
- [ ] Should see "Verify Your Email" screen
- [ ] Screen shows your email address
- [ ] Screen shows verification instructions
- [ ] Can click "Resend Verification Email"
- [ ] Receives new verification email
- [ ] Can click "Back to Sign In"

### Email Verification
- [ ] Check email inbox
- [ ] Verification email received
- [ ] Click verification link in email
- [ ] Opens in browser and confirms verification
- [ ] Return to app

### Sign In Flow (Verified User)
- [ ] On Sign In screen
- [ ] Enter verified email and password
- [ ] Click "Sign In"
- [ ] Successfully navigates to Dashboard
- [ ] Dashboard shows user email
- [ ] No verification warning shown

### Sign In Flow (Unverified User)
- [ ] Sign in with unverified account
- [ ] Should redirect to "Verify Your Email" screen
- [ ] Cannot access Dashboard until verified
- [ ] Can resend verification email
- [ ] Can go back to sign in

### Error Handling
- [ ] Try wrong password → Shows "Invalid email or password"
- [ ] Try non-existent email → Shows "No account found"
- [ ] Try signing up with existing email → Shows "Account already exists"
- [ ] Try invalid email format → Shows "Invalid email address"
- [ ] Try password < 6 chars → Shows "Password must be at least 6 characters"
- [ ] Try mismatched passwords → Shows "Passwords do not match"

### Logout
- [ ] Click logout icon in top right
- [ ] See confirmation dialog
- [ ] Click "Cancel" → Stays logged in
- [ ] Click "Logout" → Returns to Sign In screen

### Password Reset
- [ ] Click "Forgot password?"
- [ ] Enter email address
- [ ] Click "Send Reset Link"
- [ ] See success message
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Opens password reset page
- [ ] Set new password
- [ ] Return to app and sign in with new password

## 🌐 Web Testing

### All Mobile Tests Above, Plus:

### Web-Specific Logout
- [ ] Open app in Chrome/Safari/Firefox
- [ ] Sign in
- [ ] Click logout icon
- [ ] See browser confirm() dialog (not native alert)
- [ ] Click "Cancel" → Stays logged in
- [ ] Click "OK" → Returns to Sign In screen

### Web Error Messages
- [ ] All error messages display in browser alert dialogs
- [ ] Error messages are clear and helpful
- [ ] No console errors in browser dev tools

### Web Navigation
- [ ] Cannot access /tabs when not logged in → Redirects to sign-in
- [ ] Cannot access /tabs when not verified → Redirects to verify-email
- [ ] Can access /tabs when logged in and verified
- [ ] Back button works correctly
- [ ] Refresh page maintains auth state

## 🔐 Security Testing

### Protected Routes
- [ ] Cannot access /(tabs) without authentication
- [ ] Cannot access /(tabs) without email verification
- [ ] Automatically redirected to appropriate screen
- [ ] Manual URL navigation blocked appropriately

### Session Persistence
- [ ] Close and reopen app → Still logged in (if was logged in)
- [ ] Refresh web page → Still logged in (if was logged in)
- [ ] Auth state persists across app restarts

### Email Verification Enforcement
- [ ] Unverified users cannot access protected routes
- [ ] Verified users have full access
- [ ] Verification status checked on every navigation
- [ ] Users are informed why they can't access certain features

## 📧 Email Testing

### Verification Email
- [ ] Receives email within 1 minute
- [ ] Email has correct sender
- [ ] Email has clear subject line
- [ ] Email has working verification link
- [ ] Can resend if not received

### Password Reset Email
- [ ] Receives email within 1 minute
- [ ] Email has correct sender
- [ ] Email has clear subject line
- [ ] Email has working reset link
- [ ] Link expires appropriately

## 🎨 UI/UX Testing

### Verify Email Screen
- [ ] Shows email icon
- [ ] Shows clear title "Verify Your Email"
- [ ] Shows user's email address
- [ ] Shows numbered step-by-step instructions
- [ ] Shows helper text about spam folder
- [ ] Has prominent "Resend Verification Email" button
- [ ] Has "Back to Sign In" link
- [ ] Responsive on different screen sizes

### Loading States
- [ ] Sign in button shows "Signing in..." when loading
- [ ] Sign up button shows "Creating account..." when loading
- [ ] Reset button shows "Sending..." when loading
- [ ] Resend button shows "Sending..." when loading
- [ ] Buttons are disabled while loading
- [ ] Cannot submit forms multiple times

### Visual Feedback
- [ ] Success messages are clear and positive
- [ ] Error messages are clear and helpful
- [ ] Loading indicators are visible
- [ ] Buttons have hover/press states
- [ ] Forms have proper focus states

## 🐛 Edge Cases

### Network Issues
- [ ] No internet → Shows appropriate error
- [ ] Slow connection → Shows loading state
- [ ] Firebase down → Shows error message

### Multiple Attempts
- [ ] Multiple sign in attempts with wrong password → Rate limited
- [ ] Multiple verification emails → Can be sent
- [ ] Multiple password reset requests → All work

### Unusual Inputs
- [ ] Very long email → Handled gracefully
- [ ] Special characters in password → Accepted
- [ ] Spaces in email → Trimmed/rejected
- [ ] Copy-pasted credentials → Work correctly

## ✅ Platform-Specific Tests

### iOS Specific
- [ ] Keyboard dismisses properly
- [ ] Keyboard doesn't cover input fields
- [ ] Safe area insets respected
- [ ] Status bar color correct
- [ ] Navigation smooth

### Android Specific
- [ ] Back button works as expected
- [ ] Keyboard behavior correct
- [ ] Material design feels native
- [ ] Navigation smooth

### Web Specific
- [ ] Works in Chrome
- [ ] Works in Safari
- [ ] Works in Firefox
- [ ] Responsive on mobile viewport
- [ ] Responsive on tablet viewport
- [ ] Responsive on desktop viewport
- [ ] Browser autofill works
- [ ] Tab navigation works

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Platform: ___________

✅ Passed: ___/___
❌ Failed: ___/___
⚠️  Warnings: ___

Issues Found:
1. _______________
2. _______________
3. _______________

Notes:
_______________
_______________
```

## 🚀 Ready for Production?

All tests must pass before deploying:
- [ ] All mobile tests pass
- [ ] All web tests pass
- [ ] All security tests pass
- [ ] All email tests pass
- [ ] All UI/UX tests pass
- [ ] All edge cases handled
- [ ] No console errors
- [ ] Documentation updated
- [ ] Firebase properly configured
- [ ] Environment variables secured
