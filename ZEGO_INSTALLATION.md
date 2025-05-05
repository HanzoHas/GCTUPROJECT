# ZEGO Cloud Video Calls Setup Guide

This guide will help you set up video and voice calls in your application using ZEGO Cloud.

## Prerequisites

1. Create a ZEGO Cloud account at [console.zegocloud.com](https://console.zegocloud.com)
2. Create a new project in the ZEGO Cloud Console
3. Obtain your AppID and ServerSecret from the project

## Installation

1. Install the ZEGO UIKit package:

```bash
npm install @zegocloud/zego-uikit-prebuilt
```

2. Create a `.env.local` file in your project root with the following variables:

```
VITE_ZEGO_APP_ID=your_zego_app_id
VITE_ZEGO_SERVER_SECRET=your_zego_server_secret
```

Replace `your_zego_app_id` with your actual AppID (a number) and `your_zego_server_secret` with your Server Secret from the ZEGO Cloud Console.

## Features

The integration provides the following features:

1. One-on-one video calls
2. One-on-one audio calls 
3. Group video calls
4. Call controls (mute, video on/off, end call)
5. Shareable group call links

## Components

We've added several components:

1. `VideoCallButton` - For one-on-one calls
2. `GroupCallButton` - For group calls
3. `CallControls` - For managing active calls
4. `GroupCallPage` - A dedicated page for group calls

## Usage

### One-on-One Calls

Use the `VideoCallButton` component:

```jsx
<VideoCallButton 
  recipientId="user123"
  recipientName="John Doe"
  variant="video" // or "audio"
/>
```

### Group Calls

Use the `GroupCallButton` component:

```jsx
<GroupCallButton 
  groupId="group123"
  groupName="Math Study Group"
  showText={true} // Display "Join Group Call" text
/>
```

## Troubleshooting

If you encounter issues:

1. Ensure your `.env.local` file has the correct ZEGO credentials
2. Check browser console for any errors
3. Ensure your app has camera and microphone permissions
4. Test on a secure context (HTTPS or localhost)

## Resources

- [ZEGO Cloud Documentation](https://docs.zegocloud.com/)
- [UIKit Documentation](https://docs.zegocloud.com/article/14694) 