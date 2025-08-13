# Convex Seeding Scripts

This directory contains scripts for seeding the Convex database with test data.

## Available Scripts

### seed.ts

Populates the database with realistic test data including:

- A demo admin account
- 15 additional users with random roles and statuses
- 6-8 study channels with realistic names
- 3-6 subchannels per channel
- 50-150 messages per subchannel over the last 30 days
- 3 announcements per subchannel
- 10 global posts with 2-6 comments each

## How to Run

To run the seed script, use the Convex CLI:

```bash
npx convex dev
# In another terminal
npx convex run scripts:seed
```

Note: Make sure to run `npx convex dev` first to start the development server before running the seed script.

## Demo Admin Account

The seed script creates a demo admin account with the following credentials:

- Email: demo_admin@example.com
- Password: 123456
- Role: Admin

You can use this account to log in and explore the seeded data.

## Note

Running the seed script will add data to your database but won't delete existing data. If you want to start with a clean database, you should clear your database first using the Convex dashboard.