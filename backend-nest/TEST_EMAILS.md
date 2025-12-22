# Testing Email Functionality

## Current Configuration

- **MAIL_MAILER**: `log` (emails are logged to console, not actually sent)
- **MAIL_FROM_ADDRESS**: `info@titliya.com`
- **MAIL_FROM_NAME**: `Titliya`

## Testing OTP Email

### 1. Request OTP
```bash
curl -X POST http://localhost:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Expected Behavior:**
- If email exists in database: Returns `{"message": "A one-time code has been emailed."}`
- Check NestJS console for:
  - OTP code logged: `OTP for your-email@example.com: 123456`
  - Email JSON logged (if using log driver)

### 2. Verify OTP
```bash
curl -X POST http://localhost:3001/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","code":"123456"}'
```

**Expected Behavior:**
- Returns JWT token and user data if code is valid
- Invalid/expired codes return error

## Testing Password Reset Email

### 1. Request Password Reset
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Expected Behavior:**
- Always returns success (to prevent email enumeration)
- Check NestJS console for:
  - Password reset link logged: `Password reset link for your-email@example.com: http://localhost:3000/reset-password/TOKEN?email=...`
  - Email JSON logged (if using log driver)

### 2. Reset Password
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"your-email@example.com",
    "token":"RESET_TOKEN_FROM_EMAIL",
    "password":"newpassword123",
    "password_confirmation":"newpassword123"
  }'
```

## Email Templates

- **OTP**: `src/common/mail/templates/login-otp.hbs`
- **Password Reset**: `src/common/mail/templates/password-reset.hbs`

## Enabling Real Email Sending

To send actual emails instead of logging:

1. Update `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_SCHEME=tls
```

2. Restart the server

## Debugging

- Check NestJS console for email logs
- Check for errors in console
- Verify email templates exist in `src/common/mail/templates/`
- Verify `MAIL_MAILER` is set correctly in `.env`

