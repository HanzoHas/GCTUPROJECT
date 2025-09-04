
#🏫 GCTUPROJECT

> THE MAIN FINAL YEAR

## Overview

GCTUPROJECT is the main final year project developed in TypeScript. It aims to deliver a robust solution for GCTU educational platforms, e.g., student management, event organization, etc.. This repository contains all the core code, assets, and configuration files needed to run and develop the project.

## Features

- Built with TypeScript for type safety and maintainability
- Modern UI components (Radix UI, shadcn, etc.)
- Integration with real-time and cloud services (e.g., Convex, Cloudinary)
- Authentication and secure data handling (bcrypt, bcryptjs)
- State management and data fetching (TanStack React Query)
- Custom UI utilities and animations (Lottie, cmdk)
- Modular and scalable architecture

## 👨‍💻 Tech Stack

- **Frontend:** React, TypeScript, Radix UI, shadcn
- **Backend:** Convex (serverless)
- **Other:** Cloudinary for media, bcrypt for security, Lottie for animations

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Yarn or npm

### Installation

```bash
git clone https://github.com/HanzoHas/GCTUPROJECT.git
cd GCTUPROJECT
npm install
```

### Running Locally

```bash
npm run dev
```

The app will run in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Scripts

| Command         | Description                        |
|-----------------|------------------------------------|
| `npm run dev`   | Run the development server         |
| `npm run build` | Build the project for production   |
| `npm run lint`  | Run ESLint on the codebase         |
| `npm run preview` | Preview the production build      |
| `npm run convex` | Run Convex server locally         |
| `npm run dev:all` | Run frontend and Convex together  |

## Folder Structure

```
GCTUPROJECT/
├── src/           # Source code
├── public/        # Static assets
├── package.json   # Project dependencies and scripts
├── README.md      # Project documentation
```

## Contributing

Contributions are welcome! Please open issues and submit pull requests for bug fixes, improvements, or new features.



## Author

- [HanzoHas](https://github.com/HanzoHas)

---



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

## ZEGO Cloud Video Call Setup

This project uses **ZEGO Cloud** for real-time video/audio calls. Follow these steps to configure it locally or in production.

### 1. Create a ZEGO Cloud Account

Sign up at [ZEGO Cloud Console](https://console.zegocloud.com/) and create a new project to get your App ID and Server Secret.

```bash
# After creating your ZEGO Cloud project, you'll get an App ID and Server Secret
# These will be used in your environment variables
```

### 2. Configure Environment Variables

Front-end (`.env` at project root):

```env
VITE_ZEGO_APP_ID=your_app_id_here
VITE_ZEGO_SERVER_SECRET=your_server_secret_here
```

### 3. Install & Run

```bash
npm install          # install ZEGO Cloud SDK and other dependencies
npm run dev:all      # runs Vite + Convex dev servers concurrently
```

Open the app, start a chat, and hit the call button – you should join a fully in-app ZEGO Cloud call with custom UI.

### 4. Production Notes

* Make sure your environment variables are properly set in your production environment.
* Store `VITE_ZEGO_APP_ID` and `VITE_ZEGO_SERVER_SECRET` in your hosting provider's env settings.
* For production, consider using a token server instead of client-side token generation for better security.

### 5. Troubleshooting

| Issue                              | Fix |
| ---------------------------------- | ------------------------------------------------------------- |
| "Failed to connect to ZEGO"        | Check App ID and Server Secret are correctly set              |
| Call initialization fails          | Verify environment variables are accessible to the app        |
| No audio/video permissions         | Browser prompt must be accepted; local dev uses `localhost`   |

Enjoy seamless **WhatsApp-style** calls with ZEGO Cloud! 🎥📞
