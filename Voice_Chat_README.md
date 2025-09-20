# Yap Window - P2P Voice Chat System Documentation

## Overview

The Yap Window P2P Voice Chat system is a browser-based, peer-to-peer voice communication feature that integrates seamlessly with the existing chat infrastructure. It supports up to 5 participants per room and leverages WebRTC technology for direct audio streaming between users.

## Architecture & Integration

### File Structure
```
Code/
├── vcPRE.js          # Voice chat implementation (main file)
├── chatPRE.js        # Chat system integration
├── guiPRE.js         # UI components and styling
└── loginPRE.js       # Authentication and user management
```

### GitHub Repository Configuration
The voice chat system loads from the **beta branch** of the Yap Window repository:

**URL Format:**
```
https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vcPRE.js?token=$(date%20+%s)
```

**Key Details:**
- **Repository**: TheHumblePotato/Yap-Window
- **Branch**: `beta` (development branch)
- **Cache Busting**: `?token=$(date%20+%s)` ensures fresh content
- **Path**: `/Code/vcPRE.js` in repository structure

### Cross-File Function Calling Mechanism

The Yap Window application uses a **fetch-and-eval** architecture that enables seamless function calls across different JavaScript files:

#### 1. Dynamic Script Loading Pattern
```javascript
// Example from loginPRE.js loading vcPRE.js
const vcPrimaryUrl = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vcPRE.js?token=$(date%20+%s)";
const vcFallbackUrl = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vcPRE.js?token=$(date%20+%s)";

fetch(vcPrimaryUrl)
    .then(r => {
        if (!r.ok) return fetch(vcFallbackUrl);
        return r;
    })
    .then(r => r.text())
    .then(code => {
        eval(code); // vcPRE.js functions now available globally
    });
```

#### 2. Global Scope Function Exposure
```javascript
// In vcPRE.js - functions declared in global scope
function toggleVoiceChat() {
    // Voice chat logic here
}

function joinVoiceRoom(roomName) {
    // Room joining logic here
}

// These functions become available to ALL other scripts after eval()
```

#### 3. Cross-File Function Access
```javascript
// In chatPRE.js or guiPRE.js - can call vcPRE.js functions directly
document.getElementById('voice-chat-toggle').onclick = function() {
    toggleVoiceChat(); // Calls function from vcPRE.js
};

// Or when switching chat rooms
function switchToChannel(channelName) {
    currentChat = channelName;
    if (voiceChatActive) {
        joinVoiceRoom(currentChat); // Calls vcPRE.js function
    }
}
```

#### 4. Variable Inheritance Pattern
```javascript
// Variables from parent scope are inherited by eval'd code
const email = "user@example.com";        // From loginPRE.js
const currentChat = "general";            // From chatPRE.js
const database = firebase.database();     // From loginPRE.js

// When vcPRE.js is eval'd, it inherits these variables automatically
eval(vcCode); // vcPRE.js can now use email, currentChat, database directly
```

#### 5. Loading Order & Timing
```javascript
// Typical loading sequence in loginPRE.js or chatPRE.js
async function loadVoiceChat() {
    // 1. Load and execute vcPRE.js
    const vcUrl = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vcPRE.js?token=$(date%20+%s)";
    const vcCode = await fetch(vcUrl).then(r => r.text());
    eval(vcCode); // Functions now available globally
    
    // 2. Add button after functions are loaded
    const voiceButton = `<button onclick="toggleVoiceChat()">🎤</button>`;
    document.getElementById('settings-bar').insertAdjacentHTML('beforeend', voiceButton);
}

// Or with error checking
function safeToggleVoiceChat() {
    if (typeof toggleVoiceChat === 'function') {
        toggleVoiceChat();
    } else {
        console.warn('Voice chat not yet loaded');
        loadVoiceChat().then(() => toggleVoiceChat());
    }
}
```

### System Integration
The voice chat system is designed to be fetched and evaluated dynamically, inheriting key variables from the parent application:

- **`email`** - Current user's email address (serves as unique identifier)
- **`currentChat`** - Active chat room name (determines voice room to join)
- **`database`** - Firebase Realtime Database instance
- **`auth`** - Firebase Authentication instance

## Core Functionality

### 1. Auto-Room Joining
```javascript
// Automatic room joining based on currentChat variable
const voiceRoomName = currentChat; // Inherited from chat system
joinVoiceRoom(voiceRoomName);
```

**Behavior:**
- Automatically attempts to join voice room matching `currentChat` value
- If room doesn't exist, creates new room with current user as first participant
- Maximum 5 participants per room (hard limit enforced)

### 2. Room Management
```javascript
// Room cleanup system
if (participants.length === 0) {
    deleteRoom(voiceRoomName);
}
```

**Features:**
- **Auto-deletion**: Empty rooms are automatically removed from database
- **Participant tracking**: Real-time monitoring of active connections
- **Room persistence**: Rooms remain active as long as ≥1 participant is connected

### 3. User Interface Integration

#### Voice Chat Button Integration
```javascript
// Button added to existing GUI (in guiPRE.js or chatPRE.js)
const voiceButton = `
    <button id="voice-chat-toggle" class="setting-button" onclick="toggleVoiceChat()" title="Voice Chat">🎤</button>
`;
document.getElementById('settings-bar').insertAdjacentHTML('beforeend', voiceButton);
```

**Function Call in vcPRE.js:**
```javascript
// Main voice chat function exposed globally
function toggleVoiceChat() {
    const rightSidebar = document.getElementById('right-sidebar');
    
    if (voiceChatActive) {
        // Hide voice chat and restore sidebar
        hideVoiceChat();
        rightSidebar.style.filter = 'none';
        voiceChatActive = false;
    } else {
        // Show voice chat and blur sidebar
        showVoiceChat();
        rightSidebar.style.filter = 'blur(2px)';
        voiceChatActive = true;
    }
}
```

**Button Features:**
- **Direct Function Call**: Button directly calls `toggleVoiceChat()` from vcPRE.js
- **Global Scope Access**: Function available across all loaded scripts
- **Overlay Effect**: Blurs `right-sidebar` div when voice chat is active
- **State Management**: Tracks active/inactive status

#### Participant Display
```javascript
// Display connected users using email as identifier
participants.forEach(participantEmail => {
    const userElement = createUserElement(participantEmail);
    participantsList.appendChild(userElement);
});
```

**Display Elements:**
- **User Identification**: Shows participant email addresses
- **Connection Status**: Visual indicators for audio status (muted/unmuted)
- **Speaking Indicator**: Real-time visual feedback for active speakers

## Technical Implementation

### 1. WebRTC P2P Architecture
```javascript
// Peer connection setup
const peerConnections = new Map(); // email -> RTCPeerConnection
const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Create connection for each participant
for (const participantEmail of participants) {
    const pc = new RTCPeerConnection(iceServers);
    peerConnections.set(participantEmail, pc);
}
```

### 2. Signaling via Firebase
```javascript
// Firebase signaling path structure
const signalingPath = `VoiceRooms/${currentChat}/signaling`;

// WebRTC offer/answer exchange
await database.ref(`${signalingPath}/${email}/offer`).set(offer);
await database.ref(`${signalingPath}/${targetEmail}/answer`).set(answer);
```

### 3. Room State Management
```javascript
// Room data structure in Firebase
VoiceRooms: {
    [currentChat]: {
        participants: {
            [email1]: { joined: timestamp, status: 'connected' },
            [email2]: { joined: timestamp, status: 'connected' }
        },
        signaling: {
            [email1]: { offers: {}, answers: {}, candidates: [] },
            [email2]: { offers: {}, answers: {}, candidates: [] }
        }
    }
}
```

## User Experience Flow

### 1. Joining Voice Chat
1. User clicks voice chat toggle button
2. System checks `currentChat` variable for room name
3. Requests microphone permission (first time only)
4. Connects to existing room or creates new one
5. Establishes P2P connections with existing participants
6. Updates UI to show connected status

### 2. Active Voice Session
- **Real-time Audio**: Direct P2P streaming between participants
- **Participant List**: Live updates as users join/leave
- **Visual Indicators**: Speaking animation, mute status
- **Room Synchronization**: Automatic sync with text chat room changes

### 3. Leaving Voice Chat
1. User clicks toggle button to hide interface OR navigates to different chat
2. Closes all P2P connections
3. Removes user from Firebase room participants list
4. Triggers room cleanup if last participant
5. Updates UI for remaining participants

## Integration Points

### Chat System Integration (chatPRE.js)
```javascript
// Voice chat initialization when entering chat room
function switchToChannel(channelName) {
    currentChat = channelName;
    // Existing chat switching logic...
    
    // Auto-update voice room if voice chat is active
    if (voiceChatActive) {
        leaveCurrentVoiceRoom();
        joinVoiceRoom(currentChat);
    }
}
```

### GUI Integration (guiPRE.js)
```javascript
// Add voice chat button to settings bar using cross-file function call
const voiceButton = `
    <button id="voice-chat-toggle" class="setting-button" onclick="toggleVoiceChat()" title="Voice Chat">🎤</button>
`;
document.getElementById('settings-bar').insertAdjacentHTML('beforeend', voiceButton);

// Alternative event listener approach
document.getElementById('voice-chat-toggle').addEventListener('click', function() {
    toggleVoiceChat(); // Calls function from vcPRE.js after it's loaded
});
```

**Button Implementation Details:**
- **HTML onclick**: Direct function call in button HTML
- **Event Listener**: JavaScript event binding after button creation  
- **Function Availability**: `toggleVoiceChat()` must be loaded before button use
- **Error Handling**: Check if function exists before calling

### Authentication Integration (loginPRE.js)
```javascript
// Inherit user email from authentication system
const userEmail = auth.currentUser.email; // Becomes global 'email' variable
```

## Browser Compatibility & Requirements

### Supported Browsers
- **Chrome/Chromium**: Full WebRTC support
- **Firefox**: Full WebRTC support
- **Safari**: WebRTC support (iOS 11+)
- **Edge**: WebRTC support (Chromium-based)

### Required Permissions
- **Microphone Access**: Required for voice transmission
- **Network Access**: For Firebase and P2P connections

### Fallback Behavior
- Graceful degradation if WebRTC unavailable
- Clear error messages for permission denials
- Automatic retry mechanisms for connection failures

## Security & Privacy

### P2P Advantages
- **Direct Communication**: Audio never passes through central server
- **Low Latency**: Minimal delay between participants
- **Privacy**: End-to-end audio transmission

### Firebase Security
- **Room Access Control**: Based on chat room permissions
- **User Authentication**: Leverages existing login system
- **Data Cleanup**: Automatic removal of signaling data

## Performance Considerations

### Network Optimization
- **Adaptive Bitrate**: Automatically adjusts quality based on connection
- **ICE Candidates**: Optimal routing through NAT/firewalls
- **Connection Monitoring**: Automatic reconnection for dropped peers

### Resource Management
- **Memory Cleanup**: Proper disposal of WebRTC objects
- **CPU Optimization**: Efficient audio processing
- **Battery Consideration**: Minimal impact on mobile devices

## Error Handling & Recovery

### Common Scenarios
1. **Microphone Permission Denied**: Clear user notification with retry option
2. **Network Connection Lost**: Automatic reconnection attempts
3. **Room Full (5 participants)**: Informative error message
4. **WebRTC Not Supported**: Fallback to text-only mode

### Debugging Features
- **Connection Status Logs**: Detailed WebRTC state information
- **Network Quality Indicators**: Real-time connection quality display
- **Error Reporting**: Automatic error logging to console

## Future Enhancements

### Planned Features
- **Push-to-Talk Mode**: Optional for battery saving
- **Audio Quality Settings**: User-configurable bitrate options
- **Screen Sharing**: Video extension of voice chat
- **Recording Capability**: Save voice conversations (with permission)

### Integration Opportunities
- **Bot Integration**: Voice-controlled chat bots
- **Mobile App**: Native mobile application
- **Desktop Client**: Electron-based desktop version

## Development Notes

### Code Organization
- **Modular Design**: Separate files for different functionality
- **Event-Driven**: Uses existing chat system event patterns
- **Async/Await**: Modern JavaScript patterns throughout
- **Error Boundaries**: Comprehensive error handling

### Testing Strategy
- **Unit Tests**: Individual function testing
- **Integration Tests**: Cross-browser compatibility
- **Load Testing**: Multiple simultaneous rooms
- **Mobile Testing**: iOS/Android performance validation

This documentation provides a comprehensive overview of how the P2P voice chat system integrates with the existing Yap Window infrastructure while maintaining the modular, fetch-and-eval architecture already established in the codebase.
