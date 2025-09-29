// Yap Window - P2P Voice Chat System (vc.js)
// This file implements WebRTC-based peer-to-peer voice chat functionality
// Inherits Firebase variables: database, auth, email from parent scope

(async function () {
    // Global voice chat state
    let isVoiceChatActive = false;
    let currentVoiceRoom = null;
    let currentRoomId = null;
    let localStream = null;
    let peerConnections = {}; // userId -> RTCPeerConnection
    let roomParticipants = new Set();
    let isMenuOpen = false;
    let myId = null;
    let isMuted = false;


    // WebRTC configuration
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
                urls: 'turn:numb.viagenie.ca',
                username: 'webrtc@live.com',
                credential: 'muazkh'
            }
        ],
        iceCandidatePoolSize: 10
    };

    // Initialize voice chat system
    function initializeVoiceChat() {
        createVoiceChatMenu();
        
        // Wait for auth state to be available
        if (typeof auth !== 'undefined' && auth.currentUser) {
            myId = auth.currentUser.uid;
            console.log('Voice chat initialized with authenticated user:', auth.currentUser.email);
        } else if (typeof auth !== 'undefined') {
            // Listen for auth state changes
            auth.onAuthStateChanged((user) => {
                if (user) {
                    myId = user.uid;
                    console.log('User authenticated for voice chat:', user.email, myId);
                } else {
                    myId = null;
                    console.log('User signed out, voice chat disabled');
                    // Close voice chat if user signs out
                    if (currentRoomId) {
                        leaveVoiceRoom();
                    }
                    if (isMenuOpen) {
                        closeVoiceChatMenu();
                    }
                }
            });
        } else {
            console.warn('Firebase auth not available - voice chat will require manual authentication');
        }
        
        setupVoiceChatEvents();
        console.log('Voice chat system initialized');
    }

    // Create voice chat menu HTML structure
    function createVoiceChatMenu() {
        const voiceChatMenu = `
            <div id="voice-chat-menu" class="voice-menu hidden" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                max-height: 600px;
                background: var(--bg-color, #fff);
                border: 2px solid var(--border-color, #ccc);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                z-index: 1000000;
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: Aptos, Calibri, sans-serif;
            ">
                <div class="menu-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: var(--header-bg, #f0f0f0);
                    border-bottom: 1px solid var(--border-color, #ddd);
                ">
                    <h3 style="margin: 0; color: var(--text-color, #333);">Voice Chat Rooms</h3>
                    <button onclick="closeVoiceChatMenu()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: var(--text-color, #666);
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                
                <div style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div class="create-room-section" style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px 0; color: var(--text-color, #333);">Create New Room</h4>
                        <input id="room-name-input" type="text" placeholder="Room name" maxlength="20" style="
                            width: 100%;
                            padding: 10px;
                            margin-bottom: 8px;
                            border: 1px solid var(--border-color, #ccc);
                            border-radius: 6px;
                            box-sizing: border-box;
                            font-size: 14px;
                        ">
                        <input id="room-password-input" type="password" placeholder="Password (optional)" style="
                            width: 100%;
                            padding: 10px;
                            margin-bottom: 12px;
                            border: 1px solid var(--border-color, #ccc);
                            border-radius: 6px;
                            box-sizing: border-box;
                            font-size: 14px;
                        ">
                        <button onclick="createNewVoiceRoom()" style="
                            width: 100%;
                            padding: 12px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                        ">Create Room</button>
                    </div>
                    
                    <div class="available-rooms-section" style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px 0; color: var(--text-color, #333);">Available Rooms</h4>
                        <div id="rooms-list" style="
                            min-height: 100px;
                            max-height: 200px;
                            overflow-y: auto;
                            border: 1px solid var(--border-color, #eee);
                            border-radius: 6px;
                            padding: 8px;
                        "></div>
                    </div>
                    
                    <div class="current-room-section" id="current-room-section" style="display: none;">
                        <h4 style="margin: 0 0 12px 0; color: var(--text-color, #333);">
                            Current Room: <span id="current-room-name"></span>
                        </h4>
                        <div id="room-participants" style="
                            min-height: 80px;
                            padding: 12px;
                            background: var(--bg-secondary, #f8f9fa);
                            border: 1px solid var(--border-color, #eee);
                            border-radius: 6px;
                            margin-bottom: 12px;
                        "></div>
                        <div style="display: flex; gap: 8px;">
                            <button id="leave-room-btn" onclick="leaveVoiceRoom()" style="
                                flex: 1;
                                padding: 10px;
                                background: #ff6b6b;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                            ">Leave Room</button>
                            <button id="delete-room-btn" onclick="deleteCurrentRoom()" style="
                                display: none;
                                flex: 1;
                                padding: 10px;
                                background: #dc3545;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                            ">Delete Room</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', voiceChatMenu);
        
        // Also create the troubleshooting modal
        createTroubleshootingModal();
    }

    // Create troubleshooting modal for microphone issues
    function createTroubleshootingModal() {
        const troubleshootingModal = `
            <div id="mic-troubleshooting-modal" class="troubleshooting-modal hidden" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 1000001;
                display: none;
                align-items: center;
                justify-content: center;
                font-family: Aptos, Calibri, sans-serif;
            ">
                <div class="modal-content" style="
                    background: var(--bg-color, #fff);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                ">
                    <div class="modal-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 12px 12px 0 0;
                    ">
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            🎤 Microphone Troubleshooting
                        </h2>
                        <button onclick="closeTroubleshootingModal()" style="
                            background: none;
                            border: none;
                            color: white;
                            font-size: 24px;
                            cursor: pointer;
                            padding: 0;
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                            transition: background 0.2s;
                        ">×</button>
                    </div>
                    
                    <div id="troubleshooting-content" class="modal-body" style="
                        padding: 24px;
                        line-height: 1.6;
                    ">
                        <!-- Content will be dynamically populated -->
                    </div>
                    
                    <div class="modal-footer" style="
                        padding: 16px 24px;
                        background: var(--bg-secondary, #f8f9fa);
                        border-radius: 0 0 12px 12px;
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                    ">
                        <button onclick="testMicrophone()" style="
                            padding: 10px 20px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">🧪 Test Microphone</button>
                        <button onclick="retryMicrophoneAccess()" style="
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">🔄 Try Again</button>
                        <button onclick="closeTroubleshootingModal()" style="
                            padding: 10px 20px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', troubleshootingModal);
    }

    // Setup event listeners for voice chat
    function setupVoiceChatEvents() {
        // Ensure we have the user ID
        if (typeof auth !== 'undefined' && auth.currentUser) {
            myId = auth.currentUser.uid;
        }
        
        // Listen for room changes
        if (typeof database !== 'undefined') {
            const roomsRef = ref(database, 'rooms');
            onValue(roomsRef, (snapshot) => {
                if (isMenuOpen) {
                    loadAvailableRooms();
                }
            });
        }
        
        // Setup cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (currentRoomId && myId) {
                const participantRef = ref(database, `rooms/${currentRoomId}/participants/${myId}`);
                remove(participantRef).catch(error => {
                    console.error('Error removing participant on unload:', error);
                });
            }
        });
    }

    // Toggle voice chat menu visibility
    function toggleVoiceChatMenu() {
        const menu = document.getElementById('voice-chat-menu');
        const rightSidebar = document.getElementById('right-sidebar');
        
        if (!menu) {
            console.error('Voice chat menu not found. Initializing...');
            initializeVoiceChat();
            return;
        }
        
        // Check authentication before opening menu
        if (typeof auth === 'undefined' || !auth.currentUser) {
            showError('Please log in first to use voice chat');
            return;
        }
        
        if (!auth.currentUser.emailVerified) {
            showError('Please verify your email before using voice chat');
            return;
        }
        
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            menu.style.display = 'flex';
            if (rightSidebar) {
                rightSidebar.style.filter = 'blur(2px)';
            }
            isMenuOpen = true;
            loadAvailableRooms();
        } else {
            closeVoiceChatMenu();
        }
    }

    // Close voice chat menu
    function closeVoiceChatMenu() {
        const menu = document.getElementById('voice-chat-menu');
        const rightSidebar = document.getElementById('right-sidebar');
        
        if (menu) {
            menu.classList.add('hidden');
            menu.style.display = 'none';
        }
        if (rightSidebar) {
            rightSidebar.style.filter = 'none';
        }
        isMenuOpen = false;
    }

    // Load and display available rooms
    function loadAvailableRooms() {
        if (typeof database === 'undefined') {
            console.error('Database not available');
            return;
        }
        
        // Check authentication before attempting to load rooms
        if (typeof auth === 'undefined' || !auth.currentUser) {
            console.error('User not authenticated - cannot load rooms');
            showError('Please log in to view voice chat rooms');
            return;
        }
        
        // Check email verification
        if (!auth.currentUser.emailVerified) {
            console.error('User email not verified - cannot load rooms');
            showError('Please verify your email before using voice chat');
            return;
        }
        
        console.log('Loading rooms for authenticated user:', auth.currentUser.email);
        
        const roomsRef = ref(database, 'rooms');
        get(roomsRef).then((snapshot) => {
            console.log('Successfully loaded rooms data');
            const rooms = snapshot.val();
            displayRoomsList(rooms);
        }).catch((error) => {
            console.error('Error loading rooms:', error);
            
            // Provide more specific error handling
            if (error.code === 'PERMISSION_DENIED') {
                showError('Permission denied: You may need to verify your email or contact support');
            } else if (error.code === 'NETWORK_ERROR') {
                showError('Network error: Please check your internet connection');
            } else {
                showError(`Failed to load rooms: ${error.message || 'Unknown error'}`);
            }
        });
    }

    // Display rooms list in the menu
    function displayRoomsList(rooms) {
        const roomsList = document.getElementById('rooms-list');
        if (!roomsList) return;
        
        roomsList.innerHTML = '';
        
        if (!rooms) {
            roomsList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; padding: 20px;">No rooms available</p>';
            return;
        }
        
        for (const [roomId, roomData] of Object.entries(rooms)) {
            if (!roomData.participants) continue;
            
            const participantCount = Object.keys(roomData.participants).length;
            const isPasswordProtected = roomData.password !== null && roomData.password !== '';
            const isOwner = roomData.createdBy === myId;
            const roomElement = createRoomListItem(roomId, roomData.name || 'Unnamed Room', participantCount, isPasswordProtected, isOwner);
            roomsList.appendChild(roomElement);
        }
    }

    // Create individual room list item
    function createRoomListItem(roomId, roomName, participantCount, isPasswordProtected, isOwner) {
        const roomElement = document.createElement('div');
        roomElement.style.cssText = `
            padding: 12px;
            margin-bottom: 8px;
            border: 1px solid var(--border-color, #ddd);
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.2s;
            background: var(--bg-color, #fff);
        `;
        
        roomElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 500; margin-bottom: 4px;">
                        ${roomName} ${isPasswordProtected ? '🔒' : ''}
                        ${isOwner ? '👑' : ''}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${participantCount}/5 participants
                    </div>
                </div>
                <button onclick="joinVoiceRoom('${roomId}', '${roomName}')" style="
                    padding: 6px 12px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Join</button>
            </div>
        `;
        
        roomElement.addEventListener('mouseenter', () => {
            roomElement.style.backgroundColor = 'var(--hover-bg, #f5f5f5)';
        });
        
        roomElement.addEventListener('mouseleave', () => {
            roomElement.style.backgroundColor = 'var(--bg-color, #fff)';
        });
        
        return roomElement;
    }

    // Create new voice room
    function createNewVoiceRoom() {
        const roomName = document.getElementById('room-name-input')?.value.trim();
        const password = document.getElementById('room-password-input')?.value.trim() || null;
        
        if (!roomName) {
            showError('Please enter a room name');
            return;
        }
        
        if (!myId) {
            showError('User not authenticated');
            return;
        }
        
        createVoiceRoom(roomName, password);
    }


    // Core function to create voice room
    async function createVoiceRoom(roomName, password = null) {
        if (typeof database === 'undefined') {
            showError('Database not available');
            return;
        }
        
        if (!myId) {
            showError('User not authenticated');
            return;
        }
        
        try {
            // Use push to generate unique room ID
            const newRoomRef = push(ref(database, 'rooms'));
            const roomId = newRoomRef.key;
        
        const roomData = {
            name: roomName,
                createdAt: Date.now(),
                createdBy: myId,
                password: password || null
            };
            
            await set(newRoomRef, roomData);
            
            console.log(`Created new room: ${roomName} (${roomId})`);
            
            // Clear inputs
            const nameInput = document.getElementById('room-name-input');
            const passwordInput = document.getElementById('room-password-input');
            if (nameInput) nameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            
            // Join the room
            joinVoiceRoom(roomId, roomName, password);
        } catch (error) {
            console.error('Error creating room:', error);
            showError('Failed to create room');
        }
    }

    // Join existing voice room
    async function joinVoiceRoom(roomId, roomName = null, password = null) {
        if (typeof database === 'undefined') {
            showError('Database not available');
            return;
        }
        
        if (currentRoomId === roomId) {
            showError('Already in this room');
            return;
        }
        
        if (!myId) {
            showError('User not authenticated');
            return;
        }
        
        try {
            // Leave current room if in one
            if (currentRoomId) {
                leaveVoiceRoom();
            }
            
            const roomRef = ref(database, `rooms/${roomId}`);
            const snapshot = await get(roomRef);
            
            if (!snapshot.exists()) {
                showError('Room does not exist');
                return;
            }
            
            const room = snapshot.val();
            
            // Check password if required
            if (room.password && room.password !== password) {
                const enteredPassword = prompt('This room is password protected. Enter password:');
                if (enteredPassword !== room.password) {
                    showError('Incorrect password');
                    return;
                }
                password = enteredPassword;
            }
            
            // Check room capacity
            const participantsRef = ref(database, `rooms/${roomId}/participants`);
            const participantsSnapshot = await get(participantsRef);
            const participants = participantsSnapshot.val();
            
            if (participants && Object.keys(participants).length >= 5) {
                showError('Room is full (5/5 participants)');
                return;
            }
            
            // Set room state
            currentRoomId = roomId;
            currentVoiceRoom = room.name || roomName || 'Unnamed Room';
            
            // Initialize voice connection
            await initializeVoiceConnection(roomId);
            updateCurrentRoomDisplay(currentVoiceRoom);
            
        } catch (error) {
            console.error('Error joining room:', error);
                showError('Failed to join room: ' + (error.message || 'Unknown error'));
            }
    }

    // Initialize voice connection and WebRTC
    async function initializeVoiceConnection(roomId) {
        // Debug info
        console.log('=== MICROPHONE ACCESS DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('Protocol:', window.location.protocol);
        console.log('Navigator.mediaDevices available:', !!navigator.mediaDevices);
        console.log('getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia not supported');
            showError('Your browser does not support microphone access');
            return;
        }
        
        try {
            console.log('Requesting microphone access...');
            
            // Simple, direct microphone request
            localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true
            });
            
            console.log('✅ Microphone access granted!');
            console.log('Audio tracks:', localStream.getAudioTracks().length);
            
            if (localStream.getAudioTracks().length === 0) {
                console.error('No audio tracks in stream');
                showError('No audio tracks found in microphone stream');
                return;
            }
            
            isVoiceChatActive = true;
            
            // Add user to participants
            const myParticipantRef = ref(database, `rooms/${roomId}/participants/${myId}`);
            await set(myParticipantRef, {
                timestamp: Date.now(),
                id: myId,
                email: auth.currentUser ? auth.currentUser.email : 'Unknown',
                muted: isMuted
            });
            
            // Setup room listeners
            setupRoomListeners(roomId);
            
            console.log('✅ Voice connection initialized for room:', roomId);
            
        } catch (error) {
            console.error('❌ Microphone access failed:', error);
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            
            // Simple error message without popups
            let errorMsg = 'Microphone access denied';
            if (error.name === 'NotFoundError') {
                errorMsg = 'No microphone found';
            } else if (error.name === 'NotReadableError') {
                errorMsg = 'Microphone is busy';
            } else if (error.name === 'NotAllowedError') {
                errorMsg = 'Microphone permission denied';
            } else if (error.name === 'OverconstrainedError') {
                errorMsg = 'Microphone constraints failed';
            }
            
            console.log('User-friendly error:', errorMsg);
            showError(errorMsg);
        }
    }

    // Setup room event listeners
    function setupRoomListeners(roomId) {
        const participantsRef = ref(database, `rooms/${roomId}/participants`);
        const signalsRef = ref(database, `rooms/${roomId}/signals`);
        
        // Listen for participant changes
        onChildAdded(participantsRef, (snapshot) => {
            const participant = snapshot.val();
            if (participant.id !== myId) {
                console.log(`New participant joined: ${participant.email} (${participant.id})`);
                addParticipantToUI(participant);
                
                const peerConnection = setupPeerConnection(participant.id);
                const shouldInitiate = myId < participant.id;
                
                if (shouldInitiate) {
                    console.log(`Initiating connection with ${participant.email}`);
                    createAndSendOffer(participant.id);
                } else {
                    console.log(`Waiting for offer from ${participant.email}`);
                }
            } else {
                // Add self to UI
                addParticipantToUI(participant);
            }
        });
        
        onChildRemoved(participantsRef, (snapshot) => {
            const participant = snapshot.val();
            console.log(`Participant left: ${participant.email} (${participant.id})`);
            
            removeParticipantFromUI(participant.id);
            
            if (peerConnections[participant.id]) {
                peerConnections[participant.id].close();
                delete peerConnections[participant.id];
            }
        });
        
        // Listen for signaling messages
        onChildAdded(signalsRef, (snapshot) => {
            const signal = snapshot.val();
            
            if (signal.receiver && signal.receiver !== myId) return;
            if (signal.sender === myId) return;
            
            console.log(`Received ${signal.type} signal from ${signal.sender}`);
            
            if (signal.type === 'offer') {
                handleOffer(signal);
            } else if (signal.type === 'answer') {
                handleAnswer(signal);
            } else if (signal.type === 'ice') {
                handleIceCandidate(signal);
            }
        });
        
        // Listen for participant mute status changes
        onValue(participantsRef, (snapshot) => {
            const participants = snapshot.val();
            if (participants) {
                Object.values(participants).forEach((participant) => {
                    updateParticipantMuteStatus(participant.id, participant.muted);
                });
            }
        });
    }

    // Setup peer connection
    function setupPeerConnection(participantId) {
        if (peerConnections[participantId]) {
            console.log(`Closing existing peer connection with ${participantId}`);
            peerConnections[participantId].close();
        }
        
        console.log(`Creating new peer connection with ${participantId}`);
        const peerConnection = new RTCPeerConnection(rtcConfig);
        peerConnections[participantId] = peerConnection;
        
        // Add local stream
        if (localStream) {
            localStream.getTracks().forEach((track) => {
                console.log(`Adding local ${track.kind} track to peer connection with ${participantId}`);
                peerConnection.addTrack(track, localStream);
            });
        } else {
            console.log('Warning: No local stream to add to peer connection');
        }
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`Sending ICE candidate to ${participantId}`);
                push(ref(database, `rooms/${currentRoomId}/signals`), {
                    type: 'ice',
                    sender: myId,
                    receiver: participantId,
                    candidate: event.candidate.toJSON(),
                    timestamp: Date.now()
                });
            }
        };

        // Handle connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE connection state with ${participantId} changed: ${peerConnection.iceConnectionState}`);
            
            if (peerConnection.iceConnectionState === 'connected') {
                console.log(`Connected to ${participantId}`);
            } else if (peerConnection.iceConnectionState === 'failed') {
                console.log(`Connection to ${participantId} failed`);
                peerConnection.restartIce();
            } else if (peerConnection.iceConnectionState === 'disconnected') {
                console.log(`Disconnected from ${participantId}`);
            }
        };
        
        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state with ${participantId}:`, peerConnection.connectionState);
        };
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log(`Received ${event.track.kind} track from ${participantId}`);
            
            const remoteStream = event.streams[0];
            
            // Create or get remote audio element
            let remoteAudio = document.getElementById(`audio-${participantId}`);
            if (!remoteAudio) {
                remoteAudio = createAudioElement(participantId);
            }
            
            remoteAudio.srcObject = remoteStream;
            
            remoteAudio.play()
                .then(() => console.log(`Remote audio from ${participantId} playing`))
                .catch((error) => {
                    console.log(`Remote audio from ${participantId} autoplay failed: ${error.message}`);
                    // Fallback for autoplay restrictions
                    document.addEventListener('click', () => {
                        remoteAudio.play().catch((e) => console.log(`Still failed to play: ${e.message}`));
                    }, { once: true });
                });
        };
        
        return peerConnection;
    }

    // Create audio element for remote participants
    function createAudioElement(userId) {
        const audio = document.createElement('audio');
        audio.id = `audio-${userId}`;
        audio.autoplay = true;
        audio.controls = false;
        audio.muted = false;
        
        // Create a container for audio elements if it doesn't exist
        let audioContainer = document.getElementById('audio-elements-container');
        if (!audioContainer) {
            audioContainer = document.createElement('div');
            audioContainer.id = 'audio-elements-container';
            audioContainer.style.display = 'none';
            document.body.appendChild(audioContainer);
        }
        
        audioContainer.appendChild(audio);
        return audio;
    }
    
    // Signaling handlers
    async function createAndSendOffer(participantId) {
        const peerConnection = peerConnections[participantId];
        if (!peerConnection) {
            console.log(`No peer connection for ${participantId}`);
            return;
        }
        
        try {
            console.log(`Creating offer for ${participantId}...`);
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true
            });
            
            console.log(`Setting local description for ${participantId}...`);
            await peerConnection.setLocalDescription(offer);
            
            console.log(`Sending offer to ${participantId}`);
            push(ref(database, `rooms/${currentRoomId}/signals`), {
                type: 'offer',
                sender: myId,
                receiver: participantId,
                sdp: peerConnection.localDescription.toJSON(),
                timestamp: Date.now()
            });
        } catch (error) {
            console.log(`Error creating offer for ${participantId}: ${error.message}`);
        }
    }
    
    async function handleOffer(signal) {
        const senderId = signal.sender;
        let peerConnection = peerConnections[senderId];
        
        if (!peerConnection) {
            peerConnection = setupPeerConnection(senderId);
        }
        
        try {
            console.log(`Setting remote description from offer from ${senderId}`);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            
            console.log(`Creating answer for ${senderId}`);
            const answer = await peerConnection.createAnswer();
            
            console.log(`Setting local description for answer to ${senderId}`);
            await peerConnection.setLocalDescription(answer);
            
            console.log(`Sending answer to ${senderId}`);
            push(ref(database, `rooms/${currentRoomId}/signals`), {
                type: 'answer',
                sender: myId,
                receiver: senderId,
                sdp: peerConnection.localDescription.toJSON(),
                timestamp: Date.now()
            });
        } catch (error) {
            console.log(`Error handling offer from ${senderId}: ${error.message}`);
        }
    }
    
    async function handleAnswer(signal) {
        const senderId = signal.sender;
        const peerConnection = peerConnections[senderId];
        
        if (!peerConnection) {
            console.log(`Received answer from ${senderId} but no peer connection exists`);
            return;
        }
        
        try {
            console.log(`Setting remote description from answer from ${senderId}`);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } catch (error) {
            console.log(`Error handling answer from ${senderId}: ${error.message}`);
        }
    }
    
    async function handleIceCandidate(signal) {
        const senderId = signal.sender;
        const peerConnection = peerConnections[senderId];
        
        if (!peerConnection) {
            console.log(`Received ICE candidate from ${senderId} but no peer connection exists`);
            return;
        }
        
        try {
            console.log(`Adding ICE candidate from ${senderId}`);
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (error) {
            console.log(`Error adding ICE candidate from ${senderId}: ${error.message}`);
        }
    }
    
    // Participant UI management
    function addParticipantToUI(participant) {
        const participantsDiv = document.getElementById('room-participants');
        if (!participantsDiv) return;
        
        let participantElement = document.getElementById(`participant-${participant.id}`);
        if (!participantElement) {
            participantElement = document.createElement('div');
            participantElement.id = `participant-${participant.id}`;
            participantElement.style.cssText = `
                display: flex;
                align-items: center;
                padding: 6px 8px;
                margin-bottom: 4px;
                background: var(--participant-bg, #f0f0f0);
                border-radius: 4px;
                font-size: 13px;
            `;
            
            const isCurrentUser = participant.id === myId;
            const statusIcon = isCurrentUser ? '🎤' : '👤';
            
            participantElement.innerHTML = `
                <span style="margin-right: 8px;">${statusIcon}</span>
                <span style="flex: 1;">${participant.email}${isCurrentUser ? ' (You)' : ''}</span>
                <span id="mute-icon-${participant.id}" style="margin-left: 8px; font-size: 12px;">${participant.muted ? '🔇' : '🎤'}</span>
                <span style="color: #4CAF50; font-size: 12px; margin-left: 4px;">●</span>
            `;
            
            participantsDiv.appendChild(participantElement);
        }
    }
    
    function removeParticipantFromUI(participantId) {
        const participantElement = document.getElementById(`participant-${participantId}`);
        if (participantElement) {
            participantElement.remove();
        }
        
        const audioElement = document.getElementById(`audio-${participantId}`);
        if (audioElement) {
            audioElement.remove();
        }
    }
    
    function updateParticipantMuteStatus(participantId, isMuted) {
        const muteIcon = document.getElementById(`mute-icon-${participantId}`);
        if (muteIcon) {
            muteIcon.textContent = isMuted ? '🔇' : '🎤';
        }
    }

    // Update current room display
    async function updateCurrentRoomDisplay(roomName) {
        const currentRoomSection = document.getElementById('current-room-section');
        const currentRoomName = document.getElementById('current-room-name');
        const deleteBtn = document.getElementById('delete-room-btn');
        
        if (currentRoomSection) {
            currentRoomSection.style.display = 'block';
        }
        
        if (currentRoomName) {
            currentRoomName.textContent = roomName;
        }
        
        // Show delete button only for room owners
        if (deleteBtn && typeof database !== 'undefined' && currentRoomId) {
            try {
                const roomRef = ref(database, `rooms/${currentRoomId}`);
                const snapshot = await get(roomRef);
                const room = snapshot.val();
                
                if (room && room.createdBy === myId) {
                    deleteBtn.style.display = 'block';
                } else {
                    deleteBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('Error checking room ownership:', error);
                deleteBtn.style.display = 'none';
            }
        }
    }

    // Leave current voice room
    function leaveVoiceRoom() {
        if (!currentRoomId) return;
        
        // Close all peer connections
        Object.values(peerConnections).forEach(pc => pc.close());
        peerConnections = {};
        
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Remove user from participants
        if (myId) {
            const participantRef = ref(database, `rooms/${currentRoomId}/participants/${myId}`);
            remove(participantRef).then(() => {
                checkAndDeleteEmptyRoom(currentRoomId);
            }).catch(error => {
                console.error('Error removing participant:', error);
            });
        }
        
        // Clear participants display
        const participantsDiv = document.getElementById('room-participants');
        if (participantsDiv) {
            participantsDiv.innerHTML = '';
        }
        
        // Remove audio elements
        const audioContainer = document.getElementById('audio-elements-container');
        if (audioContainer) {
            audioContainer.innerHTML = '';
        }
        
        // Reset state
        currentRoomId = null;
        currentVoiceRoom = null;
        isVoiceChatActive = false;
        roomParticipants.clear();
        
        // Hide current room section
        const currentRoomSection = document.getElementById('current-room-section');
        if (currentRoomSection) {
            currentRoomSection.style.display = 'none';
        }
        
        console.log('Left voice room');
    }

    // Check if room is empty and delete if so
    async function checkAndDeleteEmptyRoom(roomId) {
        if (!roomId) return;
        
        try {
            const participantsRef = ref(database, `rooms/${roomId}/participants`);
            const snapshot = await get(participantsRef);
            
            if (!snapshot.exists()) {
                // Room is empty, delete it
                const roomRef = ref(database, `rooms/${roomId}`);
                await remove(roomRef);
                console.log(`Deleted empty room: ${roomId}`);
            }
        } catch (error) {
            console.error('Error checking/deleting empty room:', error);
        }
    }

    // Kick all participants out of a room
    async function kickAllParticipants(roomId) {
        if (!roomId) return;
        
        try {
            const participantsRef = ref(database, `rooms/${roomId}/participants`);
            const snapshot = await get(participantsRef);
            const participants = snapshot.val();
            
            if (!participants) return;
            
            console.log(`Kicking all participants out of room: ${roomId}`);
            
            // Remove all participants
            const removePromises = Object.keys(participants).map(participantId => {
                const participantRef = ref(database, `rooms/${roomId}/participants/${participantId}`);
                console.log(`Removing participant: ${participantId}`);
            return remove(participantRef).catch((error) => {
                    console.error(`Error removing participant ${participantId}:`, error);
                return null;
            });
        });

            await Promise.all(removePromises);
            console.log(`All participants have been removed from room: ${roomId}`);
        } catch (error) {
            console.error('Error kicking participants:', error);
        }
    }

    // Delete current room (owner only)
    async function deleteCurrentRoom() {
        if (!currentRoomId) return;
        
        try {
            const roomRef = ref(database, `rooms/${currentRoomId}`);
            const snapshot = await get(roomRef);
            const room = snapshot.val();
            
            if (room && room.createdBy === myId) {
                // First, kick all participants out of the room
                await kickAllParticipants(currentRoomId);
                
            // Add a small delay to ensure all participants are removed
                await new Promise(resolve => setTimeout(resolve, 500));
                
            // Now delete the room from database
                await remove(roomRef);
                
            leaveVoiceRoom();
            loadAvailableRooms();
            } else {
                showError('Only room owner can delete the room');
            }
        } catch (error) {
                console.error('Error deleting room:', error);
                showError('Failed to delete room');
            }
    }

    // Notify participants about room deletion
    function notifyRoomDeletion(roomName) {
        console.log(`Room ${roomName} has been deleted by the owner`);
        
        // Show notification to all users that the room was deleted
        // This provides better user feedback when the room is deleted
        if (currentVoiceRoom === roomName) {
            showError(`Room "${roomName}" has been deleted by the owner`);
        }
    }

    // Show error message
    function showError(message) {
        console.error('Voice Chat Error:', message);
        alert(`Voice Chat: ${message}`);
    }

    // Show microphone-specific error with troubleshooting guidance
    function showMicrophoneError(message, errorType, originalError = null) {
        console.error('Microphone Error:', message, originalError);
        showTroubleshootingModal(message, errorType, originalError);
    }

    // Show troubleshooting modal with specific content based on error type
    function showTroubleshootingModal(message, errorType, originalError = null) {
        const modal = document.getElementById('mic-troubleshooting-modal');
        const content = document.getElementById('troubleshooting-content');
        
        if (!modal || !content) {
            // Fallback to alert if modal doesn't exist
            alert(`🎤 Microphone Issue: ${message}\n\nPlease check your microphone settings and try again.`);
            return;
        }
        
        let troubleshootingContent = '';
        
        switch (errorType) {
            case 'DENIED':
                troubleshootingContent = `
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; color: #856404;">⚠️ Permission Denied</h3>
                        <p style="margin: 0; color: #856404;">${message}</p>
                    </div>
                    
                    <h4 style="color: #495057; margin-bottom: 16px;">🔧 How to Fix This:</h4>
                    
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <h5 style="margin: 0 0 12px 0;">Quick Fix (Recommended):</h5>
                        <ol style="margin: 0; padding-left: 20px;">
                            <li>Look for a microphone 🎤 icon in your browser's address bar</li>
                            <li>Click on it and select <strong>"Allow"</strong></li>
                            <li>If not visible, click the lock/info icon 🔒 next to the URL</li>
                            <li>Set microphone permission to <strong>"Allow"</strong></li>
                            <li>Refresh the page and try again</li>
                        </ol>
                    </div>
                    
                    <details style="margin-top: 16px;">
                        <summary style="cursor: pointer; font-weight: 500; color: #007bff;">Browser-Specific Instructions</summary>
                        <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                            <p><strong>Chrome:</strong> Settings → Privacy and security → Site Settings → Microphone</p>
                            <p><strong>Firefox:</strong> Settings → Privacy & Security → Permissions → Microphone</p>
                            <p><strong>Safari:</strong> Safari → Preferences → Websites → Microphone</p>
                        </div>
                    </details>
                `;
                break;
                
            case 'NOT_FOUND':
                troubleshootingContent = `
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; color: #721c24;">🎤 No Microphone Found</h3>
                        <p style="margin: 0; color: #721c24;">${message}</p>
                    </div>
                    
                    <h4 style="color: #495057; margin-bottom: 16px;">🔧 Troubleshooting Steps:</h4>
                    
                    <ol style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 0;">
                        <li style="margin-bottom: 8px;">Check if your microphone is properly connected</li>
                        <li style="margin-bottom: 8px;">Test microphone in other apps (e.g., voice recorder)</li>
                        <li style="margin-bottom: 8px;">Check if microphone is muted in system settings</li>
                        <li style="margin-bottom: 8px;">Try refreshing the page</li>
                        <li>Restart your browser</li>
                    </ol>
                `;
                break;
                
            case 'IN_USE':
                troubleshootingContent = `
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; color: #856404;">🔄 Microphone Busy</h3>
                        <p style="margin: 0; color: #856404;">${message}</p>
                    </div>
                    
                    <h4 style="color: #495057; margin-bottom: 16px;">🔧 Resolution Steps:</h4>
                    
                    <ol style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 0;">
                        <li style="margin-bottom: 8px;">Close other applications using the microphone:<br>
                            <small style="color: #6c757d;">Zoom, Teams, Discord, Skype, etc.</small></li>
                        <li style="margin-bottom: 8px;">Close other browser tabs that might be using the microphone</li>
                        <li style="margin-bottom: 8px;">Check system audio settings for conflicting applications</li>
                        <li>Restart your browser if the issue persists</li>
                    </ol>
                `;
                break;
                
            case 'UNSUPPORTED':
                troubleshootingContent = `
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; color: #721c24;">🌐 Browser Not Supported</h3>
                        <p style="margin: 0; color: #721c24;">${message}</p>
                    </div>
                    
                    <h4 style="color: #495057; margin-bottom: 16px;">✅ Recommended Browsers:</h4>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">🟦</div>
                            <strong>Google Chrome</strong><br>
                            <small style="color: #6c757d;">Latest version</small>
                        </div>
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">🦊</div>
                            <strong>Mozilla Firefox</strong><br>
                            <small style="color: #6c757d;">Latest version</small>
                        </div>
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">🧭</div>
                            <strong>Safari</strong><br>
                            <small style="color: #6c757d;">Latest version</small>
                        </div>
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">📐</div>
                            <strong>Microsoft Edge</strong><br>
                            <small style="color: #6c757d;">Latest version</small>
                        </div>
                    </div>
                `;
                break;
                
            case 'SECURITY':
                troubleshootingContent = `
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; color: #721c24;">🔒 Security Error</h3>
                        <p style="margin: 0; color: #721c24;">${message}</p>
                    </div>
                    
                    <h4 style="color: #495057; margin-bottom: 16px;">🔧 Security Checklist:</h4>
                    
                    <ol style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 0;">
                        <li style="margin-bottom: 8px;">Ensure you're using HTTPS (secure connection)</li>
                        <li style="margin-bottom: 8px;">Check if the site is blocked by corporate firewall</li>
                        <li style="margin-bottom: 8px;">Try accessing from a different network</li>
                        <li>Temporarily disable VPN and try again</li>
                    </ol>
                `;
                break;
                
            default:
                troubleshootingContent = `
                    <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; color: #0c5460;">🔧 General Issue</h3>
                        <p style="margin: 0; color: #0c5460;">${message}</p>
                    </div>
                    
                    <h4 style="color: #495057; margin-bottom: 16px;">💡 General Troubleshooting:</h4>
                    
                    <ol style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 0;">
                        <li style="margin-bottom: 8px;">Refresh the page and try again</li>
                        <li style="margin-bottom: 8px;">Check microphone permissions in browser settings</li>
                        <li style="margin-bottom: 8px;">Test microphone in other applications</li>
                        <li style="margin-bottom: 8px;">Try a different browser</li>
                        <li>Restart your computer if the issue persists</li>
                    </ol>
                `;
        }
        
        content.innerHTML = troubleshootingContent;
        
        // Show the modal
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    // Close troubleshooting modal
    function closeTroubleshootingModal() {
        const modal = document.getElementById('mic-troubleshooting-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    // Test microphone functionality
    async function testMicrophone() {
        try {
            console.log('Testing microphone...');
            
            // Try to get a basic audio stream for testing
            const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create a simple audio visualization or feedback
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(testStream);
            const analyser = audioContext.createAnalyser();
            source.connect(analyser);
            
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            let isDetectingSound = false;
            
            const checkAudio = () => {
                analyser.getByteFrequencyData(dataArray);
                
                // Check if there's audio input
                const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
                
                if (average > 5 && !isDetectingSound) {
                    isDetectingSound = true;
                    showError('✅ Microphone test successful! Audio detected.');
                    
                    // Stop the test stream
                    testStream.getTracks().forEach(track => track.stop());
                    audioContext.close();
                    return;
                }
                
                if (!isDetectingSound) {
                    requestAnimationFrame(checkAudio);
                }
            };
            
            checkAudio();
            
            // Show instruction and stop test after 5 seconds if no audio detected
            showError('🎤 Microphone test started. Please speak into your microphone...');
            
            setTimeout(() => {
                if (!isDetectingSound) {
                    testStream.getTracks().forEach(track => track.stop());
                    audioContext.close();
                    showError('⚠️ No audio detected. Please check your microphone settings.');
                }
            }, 5000);
            
        } catch (error) {
            console.error('Microphone test failed:', error);
            showError(`❌ Microphone test failed: ${error.message}`);
        }
    }

    // Retry microphone access with simplified constraints
    async function retryMicrophoneAccess() {
        if (!currentRoomId) return;
        
        try {
            console.log('Attempting retry with basic audio constraints...');
            
            // Try with basic constraints first
            localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true
            });
            
            console.log('Basic microphone access successful, upgrading constraints...');
            
            // If basic works, try to get enhanced audio
            try {
                const enhancedStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                
                // Stop the basic stream and use enhanced one
                localStream.getTracks().forEach(track => track.stop());
                localStream = enhancedStream;
                console.log('Enhanced microphone access successful');
            } catch (enhancedError) {
                console.log('Enhanced constraints failed, using basic audio:', enhancedError);
            }
            
            isVoiceChatActive = true;
            
            // Add user to participants
            const myParticipantRef = ref(database, `rooms/${currentRoomId}/participants/${myId}`);
            await set(myParticipantRef, {
                timestamp: Date.now(),
                id: myId,
                email: auth.currentUser ? auth.currentUser.email : 'Unknown',
                muted: isMuted
            });
            
            // Setup room listeners if not already set up
            setupRoomListeners(currentRoomId);
            
            showError('✅ Microphone access successful! You can now participate in voice chat.');
            
        } catch (retryError) {
            console.error('Retry failed:', retryError);
            showError('Retry failed. Please check your microphone settings and try again manually.');
        }
    }

    // Cleanup function
    function cleanupVoiceChat() {
        if (currentVoiceRoom) {
            leaveVoiceRoom();
        }
        
        const menu = document.getElementById('voice-chat-menu');
        if (menu) {
            menu.remove();
        }
    }

    // Add voice chat button to settings bar (helper function)
    function addVoiceChatButton() {
        const settingsBar = document.getElementById('settings-bar');
        if (!settingsBar) {
            console.error('Settings bar not found');
            return;
        }
        
        // Check if button already exists
        if (document.getElementById('voice-chat-toggle')) {
            return;
        }
        
        const voiceButton = document.createElement('button');
        voiceButton.id = 'voice-chat-toggle';
        voiceButton.className = 'setting-button';
        voiceButton.title = 'Voice Chat';
        voiceButton.textContent = '🎤';
        voiceButton.onclick = toggleVoiceChatMenu;
        
        settingsBar.appendChild(voiceButton);
    }

    // Auto-initialize when script loads
    if (typeof window !== 'undefined') {
        // Initialize voice chat when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initializeVoiceChat, 1000);
            });
        } else {
            setTimeout(initializeVoiceChat, 1000);
        }
    }

    // Add mute toggle functionality
    function setupMuteToggle() {
        // This function would be called when integrating with the parent application
        // For now, we'll add a simple mute/unmute function
        window.toggleMute = function() {
            if (!myId || !currentRoomId) return;
            
            isMuted = !isMuted;
            
            // Update local stream
            if (localStream) {
                localStream.getAudioTracks().forEach((track) => {
                    track.enabled = !isMuted;
                });
            }
            
            // Update database
            const myParticipantRef = ref(database, `rooms/${currentRoomId}/participants/${myId}/muted`);
            set(myParticipantRef, isMuted).catch(error => {
                console.error('Error updating mute status:', error);
            });
            
            console.log(`Microphone ${isMuted ? 'muted' : 'unmuted'}`);
        };
    }

    // Export functions for global access
    if (typeof window !== 'undefined') {
        window.toggleVoiceChatMenu = toggleVoiceChatMenu;
        window.closeVoiceChatMenu = closeVoiceChatMenu;
        window.createNewVoiceRoom = createNewVoiceRoom;
        window.createVoiceRoom = createVoiceRoom;
        window.joinVoiceRoom = joinVoiceRoom;
        window.leaveVoiceRoom = leaveVoiceRoom;
        window.deleteCurrentRoom = deleteCurrentRoom;
        window.addVoiceChatButton = addVoiceChatButton;
        window.initializeVoiceChat = initializeVoiceChat;
        window.cleanupVoiceChat = cleanupVoiceChat;
        
        // Export troubleshooting functions
        window.showTroubleshootingModal = showTroubleshootingModal;
        window.closeTroubleshootingModal = closeTroubleshootingModal;
        window.testMicrophone = testMicrophone;
        window.retryMicrophoneAccess = retryMicrophoneAccess;
        
        // Setup mute functionality
        setupMuteToggle();
    }
})();