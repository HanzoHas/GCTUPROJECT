# Database Seeding Utility

This utility populates your database with realistic test data including users, study channels, messages, announcements, and more.

## Prerequisites

1. Node.js and npm installed
2. Convex CLI installed globally (`npm install -g convex`)
3. Project dependencies installed (`npm install` or `yarn` or `bun install`)
4. Convex project configured and deployed

## What's Included

The seed script will create:

- 1 demo admin account
- 15 additional test users with random roles
- 6-8 study channels with realistic names
- 3-6 subchannels per channel
- 50-150 messages per subchannel (from the last 30 days)
- 3 announcements per subchannel
- 10 global posts with 2-6 comments each
- User settings for all accounts

## Demo Admin Credentials

- **Email**: demo_admin@example.com
- **Password**: 123456
- **Role**: Admin

## How to Run

1. **Install Dependencies**
   Make sure you have all required dependencies installed:
   ```bash
   npm install
   ```

2. **Deploy Convex Schema**
   Ensure your Convex schema is up to date:
   ```bash
   npx convex dev
   ```
   (Keep this running in a separate terminal)

3. **Run the Seed Script**
   In a new terminal, run:
   ```bash
   npx convex run seedDatabase:seedDatabase
   ```

4. **Verify the Data**
   After the script completes, you can:
   - Log in with the demo admin credentials
   - Browse through the study channels and subchannels
   - Check the global posts and comments
   - Verify user accounts and settings

## Customization

You can modify the seed data by editing the arrays at the top of the `convex/seedDatabase.ts` file:

- `STUDY_CHANNELS`: Predefined study channels
- `SUBCHANNEL_NAMES`: Names for subchannels
- `SAMPLE_MESSAGES`: Random messages for conversations
- `ANNOUNCEMENT_TITLES`/`CONTENTS`: Announcement content
- `POST_TITLES`/`CONTENTS`: Global posts content
- `COMMENT_TEMPLATES`: Comment templates
- `FIRST_NAMES`/`LAST_NAMES`: For generating random user names

## Troubleshooting

- If you get authentication errors, make sure you're logged in to Convex:
  ```bash
  npx convex auth
  ```

- If you get schema validation errors, make sure your Convex schema is up to date:
  ```bash
  npx convex codegen
  ```

- To reset your database (delete all data), use the Convex dashboard or CLI:
  ```bash
  npx convex dashboard
  ```
  Then navigate to the "Data" tab and use the "Delete All" button.

## Notes

- The seed script is idempotent - you can run it multiple times without issues
- All passwords are set to "password123" for test users
- All test user emails follow the pattern: `firstname_lastname##@example.com`
- The script includes proper error handling and will stop if any critical errors occur
