// Yap Window - P2P Voice Chat System (vc.js)
// This file implements WebRTC-based peer-to-peer voice chat functionality
// Inherits Firebase variables: database, auth, email from parent scope

(async function () {
    // Global voice chat state
    let isVoiceChatActive = false;
    let currentVoiceRoom = null;
    let localStream = null;
    let peerConnections = new Map(); // email -> RTCPeerConnection
    let roomParticipants = new Set();
    let isMenuOpen = false;


    // WebRTC configuration
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Initialize voice chat system
    function initializeVoiceChat() {
        createVoiceChatMenu();
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
    }

    // Setup event listeners for voice chat
    function setupVoiceChatEvents() {
        // Listen for room changes
        if (typeof database !== 'undefined') {
            const roomsRef = ref(database, 'VoiceRooms');
            onValue(roomsRef, (snapshot) => {
                if (isMenuOpen) {
                    loadAvailableRooms();
                }
            });
        }
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
        
        const roomsRef = ref(database, 'VoiceRooms');
        get(roomsRef).then((snapshot) => {
            const rooms = snapshot.val();
            displayRoomsList(rooms);
        }).catch((error) => {
            console.error('Error loading rooms:', error);
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
        
        for (const [roomName, roomData] of Object.entries(rooms)) {
            if (!roomData.participants) continue;
            
            const participantCount = Object.keys(roomData.participants).length;
            const isPasswordProtected = roomData.password !== null && roomData.password !== '';
            const isOwner = roomData.owner === email.replace(/\./g, "*");
            const roomElement = createRoomListItem(roomName, participantCount, isPasswordProtected, isOwner);
            roomsList.appendChild(roomElement);
        }
    }

    // Create individual room list item
    function createRoomListItem(roomName, participantCount, isPasswordProtected, isOwner) {
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
                <button onclick="joinVoiceRoom('${roomName}')" style="
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
        
        if (typeof email === 'undefined') {
            showError('User not authenticated');
            return;
        }
        
        createVoiceRoomWithRetry(roomName, password);
    }

    // Create voice room with retry logic to handle race conditions
    function createVoiceRoomWithRetry(roomName, password, retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = 500; // 500ms delay between retries
        
        if (retryCount > maxRetries) {
            showError('Failed to create room after multiple attempts. Please try again.');
            return;
        }
        
        // Add a small delay if this is a retry to allow deletion to complete
        const delay = retryCount > 0 ? retryDelay : 0;
        
        setTimeout(() => {
            createVoiceRoom(roomName, password, (success) => {
                if (!success && retryCount < maxRetries) {
                    console.log(`Room creation failed, retrying... (${retryCount + 1}/${maxRetries})`);
                    createVoiceRoomWithRetry(roomName, password, retryCount + 1);
                }
            });
        }, delay);
    }

    // Core function to create voice room
    function createVoiceRoom(roomName, password = null, callback = null) {
        if (typeof database === 'undefined') {
            showError('Database not available');
            if (callback) callback(false);
            return;
        }
        
        const roomData = {
            name: roomName,
            owner: email.replace(/\./g, "*"),
            password: password,
            participants: {
                [email.replace(/\./g, "*")]: { joined: Date.now(), status: 'connected' }
            },
            created: Date.now(),
            maxParticipants: 5
        };
        
        const roomRef = ref(database, `VoiceRooms/${roomName}`);
        
        get(roomRef).then((snapshot) => {
            if (snapshot.exists()) {
                console.log('Room creation failed - room exists:', roomName);
                console.log('Existing room data:', snapshot.val());
                showError('Room name already exists');
                if (callback) callback(false);
                return;
            }
            
            console.log('Creating new room:', roomName);
            return set(roomRef, roomData);
        }).then((result) => {
            if (result === undefined) return; // Early return from error case above
            
            // Clear inputs
            const nameInput = document.getElementById('room-name-input');
            const passwordInput = document.getElementById('room-password-input');
            if (nameInput) nameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            
            // Join the room
            joinVoiceRoom(roomName, password);
            if (callback) callback(true);
        }).catch((error) => {
            console.error('Error creating room:', error);
            showError('Failed to create room');
            if (callback) callback(false);
        });
    }

    // Join existing voice room
    function joinVoiceRoom(roomName, password = null) {
        if (typeof database === 'undefined') {
            showError('Database not available');
            return;
        }
        
        if (currentVoiceRoom === roomName) {
            showError('Already in this room');
            return;
        }
        
        const roomRef = ref(database, `VoiceRooms/${roomName}`);
        
        get(roomRef).then((snapshot) => {
            const room = snapshot.val();
            
            if (!room) {
                showError('Room does not exist');
                return;
            }
            
            if (room.password && room.password !== password) {
                const enteredPassword = prompt('This room is password protected. Enter password:');
                if (enteredPassword !== room.password) {
                    showError('Incorrect password');
                    return;
                }
            }
            
            if (Object.keys(room.participants).length >= room.maxParticipants) {
                showError('Room is full (5/5 participants)');
                return;
            }
            
            // Leave current room if in one
            if (currentVoiceRoom) {
                leaveVoiceRoom();
            }
            
            // Use atomic operation to add participant - this prevents race conditions
            const userEmail = email.replace(/\./g, "*");
            const participantRef = ref(database, `VoiceRooms/${roomName}/participants/${userEmail}`);
            const participantData = { joined: Date.now(), status: 'connected' };
            
            return set(participantRef, participantData);
        }).then(() => {
            currentVoiceRoom = roomName;
            initializeVoiceConnection(roomName);
            updateCurrentRoomDisplay(roomName);
        }).catch((error) => {
            console.error('Error joining room:', error);
            
            // Provide more specific error messages based on error type
            if (error.code === 'PERMISSION_DENIED') {
                showError('Permission denied: You may not have access to join this room. Please check if you are logged in and have the required permissions.');
            } else if (error.message && error.message.includes('PERMISSION_DENIED')) {
                showError('Permission denied: Database access restricted. Please ensure you are properly authenticated.');
            } else {
                showError('Failed to join room: ' + (error.message || 'Unknown error'));
            }
        });
    }

    // Initialize voice connection and WebRTC
    async function initializeVoiceConnection(roomName) {
        try {
            // Request microphone permission
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            isVoiceChatActive = true;
            
            // Setup room participants listener
            const roomRef = ref(database, `VoiceRooms/${roomName}/participants`);
            onValue(roomRef, (snapshot) => {
                const participants = snapshot.val();
                if (participants) {
                    updateParticipantsList(participants);
                    establishPeerConnections(participants);
                }
            });
            
            console.log('Voice connection initialized for room:', roomName);
        } catch (error) {
            console.error('Error initializing voice connection:', error);
            showError('Microphone access denied');
        }
    }

    // Establish P2P connections with other participants
    function establishPeerConnections(participants) {
        const currentUserMasked = email.replace(/\./g, "*");
        const participantEmailsMasked = Object.keys(participants).filter(maskedEmail => maskedEmail !== currentUserMasked);
        const participantEmails = participantEmailsMasked.map(masked => masked.replace(/\*/g, "."));
        
        // Remove connections for users who left
        for (const [userEmail, pc] of peerConnections) {
            const userEmailMasked = userEmail.replace(/\./g, "*");
            if (!participants[userEmailMasked]) {
                pc.close();
                peerConnections.delete(userEmail);
            }
        }
        
        // Create connections for new participants
        participantEmails.forEach(participantEmail => {
            if (!peerConnections.has(participantEmail)) {
                createPeerConnection(participantEmail);
            }
        });
        
        roomParticipants = new Set(participantEmails);
    }

    // Create individual peer connection
    function createPeerConnection(participantEmail) {
        const pc = new RTCPeerConnection(iceServers);
        peerConnections.set(participantEmail, pc);
        
        // Add local stream
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }
        
        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote stream from:', participantEmail);
            // Play remote audio
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.play().catch(e => console.log('Audio play failed:', e));
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && currentVoiceRoom) {
                const candidateRef = ref(database, `VoiceRooms/${currentVoiceRoom}/signaling/${email.replace(/\./g, "*")}/candidates`);
                push(candidateRef, {
                    candidate: event.candidate,
                    target: participantEmail,
                    timestamp: Date.now()
                });
            }
        };
        
        // Create offer for new participants
        pc.createOffer().then(offer => {
            return pc.setLocalDescription(offer);
        }).then(() => {
            const offerRef = ref(database, `VoiceRooms/${currentVoiceRoom}/signaling/${email.replace(/\./g, "*")}/offers/${participantEmail.replace(/\./g, "*")}`);
            return set(offerRef, pc.localDescription);
        }).catch(error => {
            console.error('Error creating offer:', error);
        });
        
        // Listen for answers
        const answerRef = ref(database, `VoiceRooms/${currentVoiceRoom}/signaling/${participantEmail.replace(/\./g, "*")}/answers/${email.replace(/\./g, "*")}`);
        onValue(answerRef, (snapshot) => {
            const answer = snapshot.val();
            if (answer && pc.remoteDescription === null) {
                pc.setRemoteDescription(answer).catch(e => console.error('Error setting remote description:', e));
            }
        });
    }

    // Update participants list display
    function updateParticipantsList(participants) {
        const participantsDiv = document.getElementById('room-participants');
        if (!participantsDiv) return;
        
        participantsDiv.innerHTML = '';
        
        Object.entries(participants).forEach(([participantEmailMasked, data]) => {
            const participantEmail = participantEmailMasked.replace(/\*/g, ".");
            const participantElement = document.createElement('div');
            participantElement.style.cssText = `
                display: flex;
                align-items: center;
                padding: 6px 8px;
                margin-bottom: 4px;
                background: var(--participant-bg, #f0f0f0);
                border-radius: 4px;
                font-size: 13px;
            `;
            
            const isCurrentUser = participantEmail === email;
            const statusIcon = isCurrentUser ? '🎤' : '👤';
            
            participantElement.innerHTML = `
                <span style="margin-right: 8px;">${statusIcon}</span>
                <span style="flex: 1;">${participantEmail}${isCurrentUser ? ' (You)' : ''}</span>
                <span style="color: #4CAF50; font-size: 12px;">●</span>
            `;
            
            participantsDiv.appendChild(participantElement);
        });
    }

    // Update current room display
    function updateCurrentRoomDisplay(roomName) {
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
        if (deleteBtn && typeof database !== 'undefined') {
            const roomRef = ref(database, `VoiceRooms/${roomName}`);
            get(roomRef).then((snapshot) => {
                const room = snapshot.val();
                if (room && room.owner === email.replace(/\./g, "*")) {
                    deleteBtn.style.display = 'block';
                }
            });
        }
    }

    // Leave current voice room
    function leaveVoiceRoom() {
        if (!currentVoiceRoom) return;
        
        const roomName = currentVoiceRoom; // Store room name before clearing
        const roomRef = ref(database, `VoiceRooms/${roomName}/participants/${email.replace(/\./g, "*")}`);
        
        // Remove user from participants
        remove(roomRef).then(() => {
            // Check if room is empty and clean up
            const roomParticipantsRef = ref(database, `VoiceRooms/${roomName}/participants`);
            return get(roomParticipantsRef);
        }).then((snapshot) => {
            const participants = snapshot.val();
            console.log('Participants after user left:', participants);
            
            if (!participants || Object.keys(participants).length === 0) {
                // Room is empty, delete entire room
                console.log(`Room ${roomName} is empty, deleting...`);
                const fullRoomRef = ref(database, `VoiceRooms/${roomName}`);
                return remove(fullRoomRef).then(() => {
                    console.log(`Successfully deleted empty room: ${roomName}`);
                });
            }
        }).catch((error) => {
            console.error('Error leaving room or deleting empty room:', error);
        });
        
        // Close all peer connections
        peerConnections.forEach(pc => pc.close());
        peerConnections.clear();
        
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Reset state
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

    // Delete current room (owner only)
    function deleteCurrentRoom() {
        if (!currentVoiceRoom) return;
        
        const roomRef = ref(database, `VoiceRooms/${currentVoiceRoom}`);
        
        get(roomRef).then((snapshot) => {
            const room = snapshot.val();
            if (room && room.owner === email.replace(/\./g, "*")) {
                // Notify all participants about room deletion
                notifyRoomDeletion(currentVoiceRoom);
                // Remove room from database
                return remove(roomRef);
            } else {
                showError('Only room owner can delete the room');
            }
        }).then(() => {
            leaveVoiceRoom();
            loadAvailableRooms();
        }).catch((error) => {
            console.error('Error deleting room:', error);
            showError('Failed to delete room');
        });
    }

    // Notify participants about room deletion
    function notifyRoomDeletion(roomName) {
        console.log(`Room ${roomName} has been deleted by the owner`);
        // Could implement actual notifications here
    }

    // Show error message
    function showError(message) {
        console.error('Voice Chat Error:', message);
        alert(`Voice Chat: ${message}`);
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

    // Export functions for global access
    if (typeof window !== 'undefined') {
        window.toggleVoiceChatMenu = toggleVoiceChatMenu;
        window.closeVoiceChatMenu = closeVoiceChatMenu;
        window.createNewVoiceRoom = createNewVoiceRoom;
        window.createVoiceRoom = createVoiceRoom;
        window.createVoiceRoomWithRetry = createVoiceRoomWithRetry;
        window.joinVoiceRoom = joinVoiceRoom;
        window.leaveVoiceRoom = leaveVoiceRoom;
        window.deleteCurrentRoom = deleteCurrentRoom;
        window.addVoiceChatButton = addVoiceChatButton;
        window.initializeVoiceChat = initializeVoiceChat;
        window.cleanupVoiceChat = cleanupVoiceChat;
    }
})();