# Yap Window - P2P Voice Chat System Documentation

## Overview

The Yap Window P2P Voice Chat system is a browser-based, peer-to-peer voice communication feature that integrates seamlessly with the existing chat infrastructure. It supports up to 5 participants per room and leverages WebRTC technology for direct audio streaming between users.

## Architecture & Integration

### File Structure
```
Code/
├── vc.js          # Voice chat implementation (main file)
├── chat.js        # Chat system integration
├── gui.js         # UI components and styling
└── login.js       # Authentication and user management
```

### GitHub Repository Configuration
The voice chat system loads from the **beta branch** of the Yap Window repository:

**URL Format:**
```
https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vc.js?token=$(date%20+%s)
```

**Key Details:**
- **Repository**: TheHumblePotato/Yap-Window
- **Branch**: `beta` (development branch)
- **Cache Busting**: `?token=$(date%20+%s)` ensures fresh content
- **Path**: `/Code/vc.js` in repository structure

### Cross-File Function Calling Mechanism

The Yap Window application uses a **fetch-and-eval** architecture that enables seamless function calls across different JavaScript files:

#### 1. Dynamic Script Loading Pattern
```javascript
// Example from login.js loading vc.js
const vcPrimaryUrl = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vc.js?token=$(date%20+%s)";
const vcFallbackUrl = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vc.js?token=$(date%20+%s)";

fetch(vcPrimaryUrl)
    .then(r => {
        if (!r.ok) return fetch(vcFallbackUrl);
        return r;
    })
    .then(r => r.text())
    .then(code => {
        eval(code); // vc.js functions now available globally
    });
```

#### 2. Global Scope Function Exposure
```javascript
// In vc.js - functions declared in global scope
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
// In chat.js or gui.js - can call vc.js functions directly
document.getElementById('voice-chat-toggle').onclick = function() {
    toggleVoiceChatMenu(); // Calls function from vc.js
};

// Voice room management functions available globally
createVoiceRoom("Room Name", "optional_password");
joinVoiceRoom("Room Name", "password");
deleteVoiceRoom("Room Name");
leaveVoiceRoom();
```

**Manual Room Management:**
```javascript
// In vc.js - manual room operations
function loadAvailableRooms() {
    database.ref('VoiceRooms').once('value', (snapshot) => {
        const rooms = snapshot.val();
        displayRoomsList(rooms);
    });
}

function displayRoomsList(rooms) {
    const roomsList = document.getElementById('rooms-list');
    roomsList.innerHTML = '';
    
    for (const [roomName, roomData] of Object.entries(rooms)) {
        const participantCount = Object.keys(roomData.participants).length;
        const isPasswordProtected = roomData.password !== null;
        const roomElement = createRoomListItem(roomName, participantCount, isPasswordProtected);
        roomsList.appendChild(roomElement);
    }
}
```

#### 4. Variable Inheritance Pattern
```javascript
// Variables from parent scope are inherited by eval'd code
const email = "user@example.com";        // From login.js (user identifier & room owner)
const database = firebase.database();     // From login.js (room storage & signaling)
const auth = firebase.auth();             // From login.js (user authentication)

// When vc.js is eval'd, it inherits these variables automatically
eval(vcCode); // vc.js can now use email, database, auth directly for room management
```

#### 5. Loading Order & Timing
```javascript
// Typical loading sequence in login.js or chat.js
async function loadVoiceChat() {
    // 1. Load and execute vc.js
    const vcUrl = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vc.js?token=$(date%20+%s)";
    const vcCode = await fetch(vcUrl).then(r => r.text());
    eval(vcCode); // Functions now available globally
    
    // 2. Add button and menu after functions are loaded
    const voiceButton = `<button onclick="toggleVoiceChatMenu()">🎤</button>`;
    document.getElementById('settings-bar').insertAdjacentHTML('beforeend', voiceButton);
    
    // 3. Initialize voice chat menu UI
    initializeVoiceChatMenu();
}

// Or with error checking
function safeToggleVoiceChatMenu() {
    if (typeof toggleVoiceChatMenu === 'function') {
        toggleVoiceChatMenu();
    } else {
        console.warn('Voice chat not yet loaded');
        loadVoiceChat().then(() => toggleVoiceChatMenu());
    }
}
```

### System Integration
The voice chat system is designed to be fetched and evaluated dynamically, inheriting key variables from the parent application:

- **`email`** - Current user's email address (serves as unique identifier and room owner)
- **`database`** - Firebase Realtime Database instance (for room storage and signaling)
- **`auth`** - Firebase Authentication instance (for user verification)

## Core Functionality

### 1. Voice Room Creation & Management
```javascript
// Voice room creation function
function createVoiceRoom(roomName, password = null) {
    const roomData = {
        name: roomName,
        owner: email, // Current user becomes owner
        password: password,
        participants: {
            [email]: { joined: Date.now(), status: 'connected' }
        },
        created: Date.now(),
        maxParticipants: 5
    };
    
    database.ref(`VoiceRooms/${roomName}`).set(roomData);
    joinVoiceRoom(roomName, password);
}

// Room deletion (owner only)
function deleteVoiceRoom(roomName) {
    const roomRef = database.ref(`VoiceRooms/${roomName}`);
    roomRef.once('value', (snapshot) => {
        const room = snapshot.val();
        if (room && room.owner === email) {
            // Notify all participants
            notifyRoomDeletion(roomName);
            // Remove room from database
            roomRef.remove();
        }
    });
}
```

**Features:**
- **Manual Creation**: Users can create voice rooms with custom names
- **Password Protection**: Optional password for private rooms
- **Room Ownership**: Creator becomes owner with delete permissions
- **Participant Limit**: Maximum 5 participants per room (hard limit enforced)
- **Owner Controls**: Only room owner can delete the room

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

#### Voice Chat Menu Integration
```javascript
// Voice chat button and menu added to existing GUI
const voiceButton = `
    <button id="voice-chat-toggle" class="setting-button" onclick="toggleVoiceChatMenu()" title="Voice Chat">🎤</button>
`;
document.getElementById('settings-bar').insertAdjacentHTML('beforeend', voiceButton);

// Voice chat menu overlay
const voiceChatMenu = `
    <div id="voice-chat-menu" class="voice-menu hidden">
        <div class="menu-header">
            <h3>Voice Chat Rooms</h3>
            <button onclick="closeVoiceChatMenu()">×</button>
        </div>
        
        <div class="create-room-section">
            <h4>Create New Room</h4>
            <input id="room-name-input" type="text" placeholder="Room name" maxlength="20">
            <input id="room-password-input" type="password" placeholder="Password (optional)">
            <button onclick="createNewVoiceRoom()">Create Room</button>
        </div>
        
        <div class="available-rooms-section">
            <h4>Available Rooms</h4>
            <div id="rooms-list"></div>
        </div>
        
        <div class="current-room-section" style="display: none;">
            <h4>Current Room: <span id="current-room-name"></span></h4>
            <div id="room-participants"></div>
            <button id="leave-room-btn" onclick="leaveVoiceRoom()">Leave Room</button>
            <button id="delete-room-btn" onclick="deleteCurrentRoom()" style="display: none;">Delete Room</button>
        </div>
    </div>
`;
```

**Functions in vc.js:**
```javascript
// Toggle voice chat menu visibility
function toggleVoiceChatMenu() {
    const menu = document.getElementById('voice-chat-menu');
    const rightSidebar = document.getElementById('right-sidebar');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        rightSidebar.style.filter = 'blur(2px)';
        loadAvailableRooms();
    } else {
        menu.classList.add('hidden');
        rightSidebar.style.filter = 'none';
    }
}

// Create new voice room
function createNewVoiceRoom() {
    const roomName = document.getElementById('room-name-input').value.trim();
    const password = document.getElementById('room-password-input').value.trim() || null;
    
    if (roomName) {
        createVoiceRoom(roomName, password);
    }
}
```

**Menu Features:**
- **Room Creation**: Interface for creating custom voice rooms
- **Password Protection**: Optional password field for private rooms
- **Room Browser**: List of available public rooms
- **Current Room Display**: Shows current room info and participants
- **Owner Controls**: Delete button visible only to room owners
- **Overlay Effect**: Blurs `right-sidebar` div when menu is open

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
    [roomName]: {
        name: "Room Name",
        owner: "owner@email.com",
        password: "optional_password_hash", // null for public rooms
        created: timestamp,
        maxParticipants: 5,
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

// Room joining with password verification
function joinVoiceRoom(roomName, password = null) {
    const roomRef = database.ref(`VoiceRooms/${roomName}`);
    roomRef.once('value', (snapshot) => {
        const room = snapshot.val();
        
        if (!room) {
            showError('Room does not exist');
            return;
        }
        
        if (room.password && room.password !== hashPassword(password)) {
            showError('Incorrect password');
            return;
        }
        
        if (Object.keys(room.participants).length >= room.maxParticipants) {
            showError('Room is full (5/5 participants)');
            return;
        }
        
        // Join the room
        room.participants[email] = { joined: Date.now(), status: 'connected' };
        roomRef.update({ participants: room.participants });
        establishPeerConnections(room.participants);
    });
}
```

## User Experience Flow

### 1. Opening Voice Chat Menu
1. User clicks voice chat button (🎤) in settings bar
2. Voice chat menu overlay appears, blurring the right sidebar
3. Menu shows available rooms and room creation interface
4. System requests microphone permission (first time only)

### 2. Creating a Voice Room
1. User enters room name in "Create New Room" section
2. Optionally enters password for private room
3. Clicks "Create Room" button
4. System creates room with user as owner
5. User automatically joins the newly created room
6. Menu switches to "Current Room" view
7. Room appears in other users' available rooms list

### 3. Joining an Existing Room
1. User sees available rooms in "Available Rooms" section
2. Clicks on desired room name
3. If password-protected, system prompts for password
4. If room has space (less than 5 participants), user joins
5. Establishes P2P connections with existing participants
6. Menu updates to show current room status

### 4. Active Voice Session
- **Real-time Audio**: Direct P2P streaming between participants
- **Participant List**: Live updates as users join/leave
- **Visual Indicators**: Speaking animation, mute status
- **Room Management**: Owner sees delete button for their rooms
- **Capacity Monitoring**: Visual indication of room capacity (X/5 participants)

### 5. Managing Rooms (Owner)
1. Room owner sees "Delete Room" button in current room section
2. Clicking delete button removes room from database
3. All participants are automatically disconnected
4. Participants receive notification about room deletion
5. Menu returns to available rooms view

### 6. Leaving Voice Chat
**Leaving Current Room:**
1. User clicks "Leave Room" button
2. Closes all P2P connections
3. Removes user from room participants list
4. Returns to available rooms view
5. If last participant, room may be auto-deleted (unless owner wants to keep it)

**Closing Voice Menu:**
1. User clicks × button or voice chat button again
2. Menu closes and right sidebar is restored
3. If in a voice room, user remains connected in background
4. Voice chat continues without UI overlay

## Integration Points

### Chat System Integration (chat.js)
```javascript
// Voice chat operates independently of text chat channels
// No integration code needed in chat.js

// Text chat and voice chat are completely separate systems
// Users can be in different text channels while in the same voice room
// Voice rooms persist across text channel navigation
```

**Independent Operation Benefits:**
- **No Code Changes**: Existing chat logic remains completely unchanged
- **Cross-Channel Communication**: Voice rooms work across different text channels
- **Decoupled Design**: Voice chat module is completely independent
- **Persistent Connections**: Voice rooms don't break when switching text channels
- **Flexible Usage**: Users can coordinate voice and text separately

### GUI Integration (gui.js)
```javascript
// Add voice chat button to settings bar using cross-file function call
const voiceButton = `
    <button id="voice-chat-toggle" class="setting-button" onclick="toggleVoiceChatMenu()" title="Voice Chat">🎤</button>
`;
document.getElementById('settings-bar').insertAdjacentHTML('beforeend', voiceButton);

// Alternative event listener approach
document.getElementById('voice-chat-toggle').addEventListener('click', function() {
    toggleVoiceChatMenu(); // Calls function from vc.js after it's loaded
});
```

**Menu Integration Details:**
- **HTML onclick**: Direct function call to open voice chat menu
- **Menu Overlay**: Full room management interface appears over right sidebar
- **Function Availability**: `toggleVoiceChatMenu()` must be loaded before button use
- **Dynamic Content**: Menu content updates based on current room status and available rooms
- **Owner Controls**: Delete buttons appear only for room owners

### Authentication Integration (login.js)
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
- **Manual Room Management**: User-controlled room creation and deletion
- **Decoupled Architecture**: Voice chat operates independently from chat system
- **Variable Inheritance**: Leverages global scope for seamless integration
- **Owner-Based Permissions**: Room creators have management privileges

### Testing Strategy
- **Unit Tests**: Individual function testing
- **Integration Tests**: Cross-browser compatibility
- **Load Testing**: Multiple simultaneous rooms
- **Mobile Testing**: iOS/Android performance validation

This documentation provides a comprehensive overview of how the P2P voice chat system integrates with the existing Yap Window infrastructure while maintaining the modular, fetch-and-eval architecture already established in the codebase.
