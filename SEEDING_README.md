# Database Seeding Guide

This guide provides step-by-step instructions for completely resetting your database and seeding it with fresh data.

## ⚠️ Important Warning
**This process will DELETE ALL existing data in your database. Make sure you have backups if needed.**

## Prerequisites
- Convex development environment set up
- All TypeScript errors resolved
- `.env.local` file with `CONVEX_DEPLOYMENT` configured

## Complete Database Reset & Seeding Process

### Step 1: Deploy Latest Schema & Functions
```bash
# Navigate to your project directory
cd ~/Pictures/GCTUPROJECT

# Deploy the latest schema and functions
npx convex dev
```
Wait for deployment to complete (should show "Convex functions ready!" or similar).

### Step 2: Seed Core Data (Required - Run First)
```bash
# Seed users, channels, subchannels, conversations, and messages
npx convex run seedAction:seedDatabase
```
**What this creates:**
- 7 users (including admin@university.edu)
- 6-8 study channels (hidden by default)
- 3-6 subchannels per channel
- Conversations for each subchannel with proper naming
- 50-150 messages per subchannel
- Channel announcements
- Posts and comments
- User settings

### Step 3: Fix Conversation Memberships (Required)
```bash
# Ensure all users can access subchannel conversations
npx convex run fixConversationMembers:fixConversationMembers
```
**What this fixes:**
- Adds all users as members of subchannel conversations
- Prevents "You are not a member of this conversation" errors
- Sets proper permissions and timestamps

### Step 4: Seed Main System Announcements (Optional)
```bash
# Add 20 main system announcements with images
npx convex run seedAnnouncements:seedMainAnnouncements
```
**What this creates:**
- 20 realistic main system announcements
- Announcements with images and varied content
- Posted by admin user

### Step 5: Create Missing Subchannel Conversations (If Needed)
```bash
# Only run if some subchannels are missing conversations
npx convex run fixSubchannelConversations:fixSubchannelConversations
```
**What this fixes:**
- Creates conversations for subchannels that don't have them
- Uses proper naming convention: "SubchannelName - ChannelName"
- Adds all users as conversation members

## Optional: Make Existing Channels Hidden
If you want existing channels to be hidden (requiring users to search and join):
```bash
npx convex run updateChannels:updateExistingChannels
```

## Seeding Order Summary

**Required (in this exact order):**
1. `npx convex dev` - Deploy schema
2. `npx convex run seedAction:seedDatabase` - Core data
3. `npx convex run fixConversationMembers:fixConversationMembers` - Fix memberships

**Optional:**
4. `npx convex run seedAnnouncements:seedMainAnnouncements` - Main announcements
5. `npx convex run fixSubchannelConversations:fixSubchannelConversations` - Missing conversations
6. `npx convex run updateChannels:updateExistingChannels` - Hide existing channels

## Expected Results

After complete seeding, you should have:

### Users (7 total)
- `admin@university.edu` (admin user)
- 6 additional users with realistic profiles

### Channels (6-8 total)
- Computer Science courses (CS101, CS201, etc.)
- Mathematics courses
- Engineering courses
- All channels hidden by default
- Each with 3-6 subchannels

### Subchannels (18-48 total)
- Section A, B, C, etc. for each channel
- All visible once you join the parent channel
- Each with its own conversation

### Conversations & Messages
- 1 conversation per subchannel
- 50-150 messages per conversation
- Realistic message content with links and discussions

## Troubleshooting

### "Function not found" errors
```bash
# Redeploy functions
npx convex dev
```

### "You are not a member" errors
```bash
# Fix conversation memberships
npx convex run fixConversationMembers:fixConversationMembers
```

### Missing conversations for subchannels
```bash
# Create missing conversations
npx convex run fixSubchannelConversations:fixSubchannelConversations
```

This seeding process creates a fully functional university communication system with realistic data for testing and development.
