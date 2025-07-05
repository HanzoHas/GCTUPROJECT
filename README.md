## Email Verification Setup

The application uses Resend.com for email verification. To set it up:

1. Create an account on [Resend.com](https://resend.com) if you don't have one
2. Get your API key from the Resend dashboard
3. Set up the environment variable in Convex:

```bash
# Install the Convex CLI if you haven't already
npm install -g convex

# Login to Convex
npx convex login

# Set the Resend API key
npx convex env set RESEND_API_KEY "your_resend_api_key"

# Verify the variable was set correctly
npx convex env ls
```

4. Restart your development server after setting up the environment variable:

```bash
npm run dev:all
```
