## Email Verification Setup (Brevo / Sendinblue)

The application now sends verification emails through [Brevo (Sendinblue)](https://www.brevo.com/). Follow the steps below to configure it:

### 1. Create a Brevo Account

1. Sign-up at <https://app.brevo.com/signup> (the free tier is enough for testing).
2. Complete the onboarding and validate your email/phone.
3. (Recommended) Add and verify the domain you will send from (e.g. `example.com`). If you don’t own a domain you can still send from a single validated address, but inbox delivery is better with a verified domain.

### 2. Generate an SMTP Transactional Key

1. In the Brevo dashboard navigate to **SMTP & API** → **SMTP**.
2. Click **Generate a new SMTP key**.
3. Copy the key value – it will be shown once.

### 3. Set Environment Variables in Convex

```bash
# Install Convex CLI if you haven't already
npm install -g convex

# Log in
npx convex login

# Store your Brevo API key (labelled SMTP key in the dashboard)
npx convex env set BREVO_API_KEY "your_brevo_smtp_key"

# Optional: sender address used in the code (defaults to no-reply@gctu.app)
npx convex env set BREVO_FROM_EMAIL "sender@example.com"

# Verify the vars
npx convex env ls
```

### 4. Restart the Dev Server

```bash
npm run dev:all
```

Your Convex function `sendVerificationEmail` will now hit `https://api.brevo.com/v3/smtp/email` with the provided key. If you see any 4xx/5xx errors check that:

* The key is correct and has SMTP permissions.
* The `sender` domain/address is verified inside Brevo.
* You haven’t exceeded your daily/monthly quota.

Happy emailing! 🎉
