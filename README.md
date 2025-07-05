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

---

## LiveKit Video Call Setup

This project now uses **LiveKit** for real-time video/audio calls. Follow these steps to configure it locally or in production.

### 1. Spin up a LiveKit Server

The quickest way is Docker:

```bash
# Replace with your own key/secret values (they can be any random strings)
export LK_API_KEY=mykey
export LK_API_SECRET=mysecret

docker run --pull=always -p 7880:7880 -p 7881:7881 \
  -e LIVEKIT_KEYS="$LK_API_KEY:$LK_API_SECRET" \
  -e LIVEKIT_PORT=7880 \
  -e LIVEKIT_API_PORT=7880 \
  livekit/livekit-server:latest --dev
```

This exposes the server at `http://localhost:7880` (WebSocket URL is `ws://localhost:7880`). You may also use LiveKit Cloud or any self-hosted instance.

### 2. Configure Environment Variables

Front-end (`.env` at project root):

```env
VITE_LIVEKIT_URL=http://localhost:7880
```

Backend (Convex) secrets **must** be stored via the CLI so they never ship to the browser:

```bash
npx convex env set LIVEKIT_API_KEY "$LK_API_KEY"
npx convex env set LIVEKIT_API_SECRET "$LK_API_SECRET"
```

Verify:

```bash
npx convex env ls
```

### 3. Install & Run

```bash
npm install          # grab LiveKit packages, etc.
npm run dev:all      # runs Vite + Convex dev servers concurrently
```

Open the app, start a chat, and hit the call button – you should join a fully in-app LiveKit room with custom UI.

### 4. Production Notes

* Make sure your LiveKit server is reachable over WSS (TLS) on ports 443/80.
* Store `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` in your production Convex project (`npx convex env set ...`).
* Update `VITE_LIVEKIT_URL` in your hosting provider’s env settings.

### 5. Troubleshooting

| Issue                              | Fix |
| ---------------------------------- | ------------------------------------------------------------- |
| "WebSocket closed unexpected"      | Check server URL & ensure ports 7880/443 reachable            |
| 401 / invalid token                | Verify API key/secret match the pair set in the server env    |
| No audio/video permissions         | Browser prompt must be accepted; local dev uses `localhost`   |

Enjoy seamless **WhatsApp-style** calls with LiveKit! 🎥📞
