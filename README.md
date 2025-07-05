## Email Verification Setup

The application now uses MailerSend for email verification. To set it up:

1. Create an account on [MailerSend](https://mailersend.com) if you don't have one
2. Get your API token from the MailerSend dashboard
3. Set up the environment variable in Convex:

```bash
# Install the Convex CLI if you haven't already
npm install -g convex

# Login to Convex
npx convex login

# Set the MailerSend API token
npx convex env set MAILERSEND_API_KEY "your_mailersend_api_token"

# Verify the variable was set correctly
npx convex env ls
```

4. Restart your development server after setting up the environment variable:

```bash
npm run dev:all
```
