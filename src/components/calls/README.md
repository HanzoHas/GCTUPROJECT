# Video & Audio Call Feature

This module implements real-time video and audio calling functionality using the ZEGO Cloud UIKit.

## Components

1. **VideoCallButton**: Button component for initiating one-on-one audio or video calls.
2. **GroupCallButton**: Button component for group video calls.
3. **CallPage**: The main call interface component that renders the ZEGO UI Kit.

## Context

The `ZegoContext` provides the state management and functionality for the call feature:

- **initCall**: Starts a call with a specific user
- **joinCall**: Joins an existing call room
- **endCurrentCall**: Ends the current call
- **isInCall**: Boolean state to track if user is in a call
- **currentCallId**: Stores the current call room ID

## Setup Requirements

1. Sign up for a ZEGO Cloud account at [console.zegocloud.com](https://console.zegocloud.com)
2. Create a new project in the ZEGO Cloud Console
3. Get your AppID and ServerSecret from the project
4. Add them to your `.env.local` file:

```
VITE_ZEGO_APP_ID=your_app_id
VITE_ZEGO_SERVER_SECRET=your_server_secret
```

## Architecture

1. **User initiates call**: Using VideoCallButton or GroupCallButton
2. **Notification sent**: Recipients get call notifications
3. **Call page loads**: Uses ZEGO UIKit to establish peer connection
4. **Media sharing**: Audio/video streams according to call type
5. **Call termination**: Either party can end the call

## Features

- One-on-one video calls
- One-on-one audio calls
- Group video calls
- Call controls (mute, camera toggle, screen sharing)
- End call functionality 