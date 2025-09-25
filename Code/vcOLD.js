javascript: (async function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBze6NI0eB8S2RK5pr9E97dirYp5propCw",
    authDomain: "yap--window.firebaseapp.com",
    databaseURL: "https://yap--window-default-rtdb.firebaseio.com",
    projectId: "yap--window",
    storageBucket: "yap--window.firebasestorage.app",
    messagingSenderId: "331436638756",
    appId: "1:331436638756:web:15affa3bf7a433d7a04eb1",
    measurementId: "G-R6NQW8X18R"
  };


  document.write(`
    <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #333;">Voice Chat</h2>
        <div id="userInfo" style="display: none;">
          <span id="userEmail" style="font-weight: bold;"></span>
          <button id="signOutButton" style="margin-left: 10px; padding: 5px 10px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Sign Out</button>
        </div>
        <div id="authButtons">
          <button id="signInButton" style="padding: 8px 16px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>

      <div id="preAuthContent" style="text-align: center; padding: 40px 0;">
        <h3>Please sign in to join the voice chat</h3>
        <p>You need to authenticate with Google to use this application.</p>
      </div>

      <div id="mainContent" style="display: none;">
        <div style="background-color: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0;">Room: <span id="currentRoomName">Not Joined</span></h3>
            <button id="leaveRoomButton" style="padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; display: none;">
                Leave Room
            </button>
            <button id="muteToggleButton" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
              <span class="material-icons">mic</span>
              <span id="muteButtonText">Mute</span>
            </button>
          </div>

          <div id="statusBar" style="background-color: #f1f1f1; color: #666; padding: 8px; border-radius: 4px; font-size: 14px; text-align: center; margin-bottom: 10px;"></div>

          <div id="participantsList" style="border: 1px solid #eee; border-radius: 4px; padding: 10px; max-height: 300px; overflow-y: auto;">
            <h4 style="margin-top: 0; color: #555; border-bottom: 1px solid #eee; padding-bottom: 8px;">Participants</h4>
            <div id="participantsContainer"></div>
          </div>
        </div>

        <div id="roomManagement" style="background-color: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0;">Room Management</h3>

          <div style="margin-bottom: 15px;">
            <h4>Create New Room</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <input type="text" id="newRoomName" placeholder="Room name" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <input type="password" id="newRoomPassword" placeholder="Password (optional)" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <button id="createRoomButton" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Create Room
              </button>
            </div>
          </div>

          <div>
            <h4>Available Rooms</h4>
            <div id="roomList" style="border: 1px solid #eee; border-radius: 4px; padding: 10px; max-height: 200px; overflow-y: auto;">
              <div id="roomsContainer">Loading rooms...</div>
            </div>
          </div>
        </div>

        <div id="passwordModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; width: 300px;">
            <h3 style="margin-top: 0;">Room Password</h3>
            <p id="passwordModalRoomName" style="margin-bottom: 10px;"></p>
            <input type="password" id="roomPasswordInput" placeholder="Enter password" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;">
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button id="cancelPasswordButton" style="padding: 8px 16px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Cancel
              </button>
              <button id="submitPasswordButton" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Join
              </button>
            </div>
          </div>
        </div>

        <div id="audioElementsContainer" style="display: none;"></div>
      </div>
    </div>
  `);

  const materialIconsLink = document.createElement("link");
  materialIconsLink.rel = "stylesheet";
  materialIconsLink.href =
    "https://fonts.googleapis.com/icon?family=Material+Icons";
  document.head.appendChild(materialIconsLink);

  function log(msg) {
    console.log(msg);
  }

  function setStatus(msg) {
    const statusBar = document.getElementById("statusBar");
    if (statusBar) {
      statusBar.textContent = msg;
    }
  }

  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"
    );
    const {
      getDatabase,
      ref,
      push,
      onChildAdded,
      onChildRemoved,
      set,
      remove,
      onValue,
      get,
      update,
    } = await import(
      "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js"
    );
    const {
      getAuth,
      signInWithPopup,
      GoogleAuthProvider,
      signOut,
      onAuthStateChanged,
    } = await import(
      "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"
    );

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    log("Firebase initialized");

    let myId = null;
    let myEmail = null;
    let localStream = null;
    let isMuted = false;
    let peerConnections = {};
    let userVolumes = {};
    let currentRoomId = null;
    let currentRoomName = null;
    let currentRoomPassword = null;
    let passwordModalRoomId = null;
    let roomListListener = null;

    const rtcConfig = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:numb.viagenie.ca",
          username: "webrtc@live.com",
          credential: "muazkh",
        },
      ],
      iceCandidatePoolSize: 10,
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        myId = user.uid;
        myEmail = user.email;

        document.getElementById("userEmail").textContent = myEmail;
        document.getElementById("userInfo").style.display = "block";
        document.getElementById("authButtons").style.display = "none";
        document.getElementById("preAuthContent").style.display = "none";
        document.getElementById("mainContent").style.display = "block";

        log(`Signed in as: ${myEmail} (${myId})`);
        setupRoomListListener();
      } else {
        myId = null;
        myEmail = null;

        document.getElementById("userInfo").style.display = "none";
        document.getElementById("authButtons").style.display = "block";
        document.getElementById("preAuthContent").style.display = "block";
        document.getElementById("mainContent").style.display = "none";

        cleanupOnSignOut();
        log("Signed out");
      }
    });

    document.getElementById("signInButton").addEventListener("click", () => {
      signInWithPopup(auth, googleProvider).catch((error) => {
        log(`Sign-in error: ${error.message}`);
        setStatus(`Sign-in failed: ${error.message}`);
      });
    });

    document.getElementById("signOutButton").addEventListener("click", () => {
      signOut(auth).catch((error) => {
        log(`Sign-out error: ${error.message}`);
      });
    });

    document
      .getElementById("createRoomButton")
      .addEventListener("click", () => {
        const roomName = document.getElementById("newRoomName").value.trim();
        const password = document
          .getElementById("newRoomPassword")
          .value.trim();

        if (!roomName) {
          setStatus("Please enter a room name");
          return;
        }

        createRoom(roomName, password || null);
      });

    document.getElementById("leaveRoomButton").addEventListener("click", () => {
      leaveCurrentRoom();
    });

    document
      .getElementById("cancelPasswordButton")
      .addEventListener("click", () => {
        document.getElementById("passwordModal").style.display = "none";
        passwordModalRoomId = null;
      });

    document
      .getElementById("submitPasswordButton")
      .addEventListener("click", () => {
        const password = document.getElementById("roomPasswordInput").value;
        if (passwordModalRoomId) {
          joinRoom(passwordModalRoomId, password);
        }
        document.getElementById("passwordModal").style.display = "none";
        passwordModalRoomId = null;
      });

    function setupRoomListListener() {
      if (roomListListener) {
        roomListListener();
      }

      const roomsRef = ref(db, "rooms");
      roomListListener = onValue(roomsRef, updateRoomList);
    }

    function showPasswordModal(roomId, roomName) {
      passwordModalRoomId = roomId;
      document.getElementById("passwordModalRoomName").textContent =
        `Enter password for "${roomName}"`;
      document.getElementById("roomPasswordInput").value = "";
      document.getElementById("passwordModal").style.display = "flex";
    }

    function cleanupOnSignOut() {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }

      Object.values(peerConnections).forEach((pc) => pc.close());
      peerConnections = {};

      if (myId && currentRoomId) {
        remove(ref(db, `rooms/${currentRoomId}/participants/${myId}`));
        checkAndDeleteEmptyRoom(currentRoomId);
      }

      document.getElementById("participantsContainer").innerHTML = "";
      document.getElementById("audioElementsContainer").innerHTML = "";
      currentRoomId = null;
      currentRoomName = null;

      if (roomListListener) {
        roomListListener();
        roomListListener = null;
      }
    }

    function leaveCurrentRoom() {
      if (!currentRoomId) return;

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }

      Object.values(peerConnections).forEach((pc) => pc.close());
      peerConnections = {};

      if (myId) {
        remove(ref(db, `rooms/${currentRoomId}/participants/${myId}`));
        checkAndDeleteEmptyRoom(currentRoomId);
      }

      document.getElementById("participantsContainer").innerHTML = "";
      document.getElementById("audioElementsContainer").innerHTML = "";
      document.getElementById("currentRoomName").textContent = "Not Joined";
      document.getElementById("leaveRoomButton").style.display = "none";
      setStatus("Left the room");

      currentRoomId = null;
      currentRoomName = null;
    }

    async function checkAndDeleteEmptyRoom(roomId) {
      const participantsRef = ref(db, `rooms/${roomId}/participants`);
      const snapshot = await get(participantsRef);

      if (!snapshot.exists()) {
        remove(ref(db, `rooms/${roomId}`));
        log(`Deleted empty room: ${roomId}`);
      }
    }

    async function createRoom(roomName, password) {
      if (!myId) return;

      try {
        setStatus(`Creating room "${roomName}"...`);

        const newRoomRef = push(ref(db, "rooms"));
        const roomId = newRoomRef.key;

        await set(newRoomRef, {
          name: roomName,
          createdAt: Date.now(),
          createdBy: myId,
          password: password || null,
        });

        log(`Created new room: ${roomName} (${roomId})`);
        setStatus(`Room "${roomName}" created successfully`);

        joinRoom(roomId, password);
      } catch (error) {
        log(`Error creating room: ${error.message}`);
        setStatus(`Error creating room: ${error.message}`);
      }
    }

    async function updateRoomList(snapshot) {
      if (!myId) return;

      try {
        const roomsContainer = document.getElementById("roomsContainer");

        if (!snapshot || !snapshot.exists()) {
          roomsContainer.innerHTML = "<p>No rooms available. Create one!</p>";
          return;
        }

        const rooms = snapshot.val();
        let hasRooms = false;

        roomsContainer.innerHTML = "";

        for (const roomId in rooms) {
          const room = rooms[roomId];
          hasRooms = true;

          const roomEl = document.createElement("div");
          roomEl.style.display = "flex";
          roomEl.style.justifyContent = "space-between";
          roomEl.style.alignItems = "center";
          roomEl.style.padding = "8px";
          roomEl.style.margin = "4px 0";
          roomEl.style.borderRadius = "4px";
          roomEl.style.backgroundColor = "#f9f9f9";

          const roomInfo = document.createElement("div");
          roomInfo.innerHTML = `
            <strong>${room.name || "Unnamed Room"}</strong>
            <div style="font-size: 12px; color: #666;">
              ${room.password ? "🔒 Password protected" : "🔓 Open access"}
            </div>
          `;

          const joinButton = document.createElement("button");
          joinButton.textContent = roomId === currentRoomId ? "Joined" : "Join";
          joinButton.style.padding = "6px 12px";
          joinButton.style.background =
            roomId === currentRoomId ? "#cccccc" : "#4CAF50";
          joinButton.style.color = "white";
          joinButton.style.border = "none";
          joinButton.style.borderRadius = "4px";
          joinButton.style.cursor =
            roomId === currentRoomId ? "default" : "pointer";
          joinButton.disabled = roomId === currentRoomId;

          if (roomId !== currentRoomId) {
            joinButton.addEventListener("click", () => {
              if (room.password) {
                showPasswordModal(roomId, room.name);
              } else {
                joinRoom(roomId);
              }
            });
          }

          roomEl.appendChild(roomInfo);
          roomEl.appendChild(joinButton);
          roomsContainer.appendChild(roomEl);
        }

        if (!hasRooms) {
          roomsContainer.innerHTML = "<p>No rooms available. Create one!</p>";
        }
      } catch (error) {
        log(`Error updating room list: ${error.message}`);
      }
    }

    function createAudioElement(userId) {
      const audio = document.createElement("audio");
      audio.id = `audio-${userId}`;
      audio.autoplay = true;
      audio.controls = false;
      audio.muted = false;

      document.getElementById("audioElementsContainer").appendChild(audio);
      return audio;
    }

    async function startLocalAudio() {
      try {
        setStatus("Requesting microphone access...");

        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        log("Microphone access granted");

        const localAudio = createAudioElement("local");
        localAudio.srcObject = localStream;
        localAudio.muted = true;

        setupAudioVisualization(localStream, myId);

        return localStream;
      } catch (error) {
        log(`Error accessing microphone: ${error.message}`);
        setStatus(`Error: ${error.message}`);
        throw error;
      }
    }

    function setupAudioVisualization(stream, userId) {
      if (!stream) return null;

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function updateVolume() {
        analyser.getByteFrequencyData(dataArray);
        let average = 0;
        dataArray.forEach((value) => {
          average += value;
        });
        average /= bufferLength;

        const scaledVolume = Math.min(100, Math.max(0, average * (100 / 255)));

        userVolumes[userId] = scaledVolume;

        updateSpeakingIndicator(userId, scaledVolume > 15);

        requestAnimationFrame(updateVolume);
      }

      updateVolume();
      return { audioContext, analyser, source };
    }

    function updateSpeakingIndicator(userId, isSpeaking) {
      const participantEl = document.getElementById(`participant-${userId}`);
      if (participantEl) {
        if (isSpeaking) {
          participantEl.classList.add("speaking");
          participantEl.style.fontWeight = "bold";
          participantEl.style.backgroundColor = "#e9f5e9";
          participantEl.style.borderLeft = "3px solid #4CAF50";
        } else {
          participantEl.classList.remove("speaking");
          participantEl.style.fontWeight = "normal";
          participantEl.style.backgroundColor = "transparent";
          participantEl.style.borderLeft = "3px solid transparent";
        }
      }
    }

    function setupPeerConnection(participantId) {
      if (peerConnections[participantId]) {
        log(`Closing existing peer connection with ${participantId}`);
        peerConnections[participantId].close();
      }

      log(`Creating new peer connection with ${participantId}`);
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnections[participantId] = peerConnection;

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          log(
            `Adding local ${track.kind} track to peer connection with ${participantId}`,
          );
          peerConnection.addTrack(track, localStream);
        });
      } else {
        log("Warning: No local stream to add to peer connection");
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          log(`Sending ICE candidate to ${participantId}`);
          push(ref(db, `rooms/${currentRoomId}/signals`), {
            type: "ice",
            sender: myId,
            receiver: participantId,
            candidate: event.candidate.toJSON(),
            timestamp: Date.now(),
          });
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        log(
          `ICE connection state with ${participantId} changed: ${peerConnection.iceConnectionState}`,
        );

        if (peerConnection.iceConnectionState === "connected") {
          log(`Connected to ${participantId}`);
        } else if (peerConnection.iceConnectionState === "failed") {
          log(`Connection to ${participantId} failed`);

          peerConnection.restartIce();
        } else if (peerConnection.iceConnectionState === "disconnected") {
          log(`Disconnected from ${participantId}`);
        }
      };

      peerConnection.ontrack = (event) => {
        log(`Received ${event.track.kind} track from ${participantId}`);

        const remoteStream = event.streams[0];

        let remoteAudio = document.getElementById(`audio-${participantId}`);
        if (!remoteAudio) {
          remoteAudio = createAudioElement(participantId);
        }

        remoteAudio.srcObject = remoteStream;

        remoteAudio
          .play()
          .then(() => log(`Remote audio from ${participantId} playing`))
          .catch((error) => {
            log(
              `Remote audio from ${participantId} autoplay failed: ${error.message}`,
            );

            document.addEventListener(
              "click",
              () => {
                remoteAudio
                  .play()
                  .catch((e) => log(`Still failed to play: ${e.message}`));
              },
              { once: true },
            );
          });

        setupAudioVisualization(remoteStream, participantId);
      };

      return peerConnection;
    }

    async function joinRoom(roomId, password = null) {
      if (!myId) return;

      if (currentRoomId) {
        leaveCurrentRoom();
      }

      try {
        const roomRef = ref(db, `rooms/${roomId}`);
        const roomSnapshot = await get(roomRef);

        if (!roomSnapshot.exists()) {
          setStatus("Room does not exist");
          return;
        }

        const room = roomSnapshot.val();

        if (room.password && room.password !== password) {
          setStatus("Incorrect password");
          return;
        }

        currentRoomId = roomId;
        currentRoomName = room.name;
        document.getElementById("currentRoomName").textContent = room.name;
        document.getElementById("leaveRoomButton").style.display =
          "inline-block";

        await startLocalAudio();
        await joinRoomParticipants();

        setStatus(`Joined room "${room.name}"!`);
      } catch (error) {
        log(`Error joining room: ${error.message}`);
        setStatus(`Error: ${error.message}`);
      }
    }

    async function joinRoomParticipants() {
      if (!currentRoomId || !myId) return;

      const myParticipantRef = ref(
        db,
        `rooms/${currentRoomId}/participants/${myId}`,
      );
      const participantsRef = ref(db, `rooms/${currentRoomId}/participants`);
      const signalsRef = ref(db, `rooms/${currentRoomId}/signals`);

      await set(myParticipantRef, {
        timestamp: Date.now(),
        id: myId,
        email: myEmail,
        muted: isMuted,
      });

      window.addEventListener("beforeunload", () => {
        remove(myParticipantRef);
        checkAndDeleteEmptyRoom(currentRoomId);
      });

      addParticipantToUI({
        id: myId,
        email: myEmail,
        muted: isMuted,
      });

      onChildAdded(participantsRef, (snapshot) => {
        const participant = snapshot.val();
        if (participant.id !== myId) {
          log(
            `New participant joined: ${participant.email} (${participant.id})`,
          );

          addParticipantToUI(participant);

          const peerConnection = setupPeerConnection(participant.id);

          const shouldInitiate = myId < participant.id;

          if (shouldInitiate) {
            log(`Initiating connection with ${participant.email}`);
            createAndSendOffer(participant.id);
          } else {
            log(`Waiting for offer from ${participant.email}`);
          }
        }
      });

      onChildRemoved(participantsRef, (snapshot) => {
        const participant = snapshot.val();
        log(`Participant left: ${participant.email} (${participant.id})`);

        removeParticipantFromUI(participant.id);

        if (peerConnections[participant.id]) {
          peerConnections[participant.id].close();
          delete peerConnections[participant.id];
        }

        const audioEl = document.getElementById(`audio-${participant.id}`);
        if (audioEl) {
          audioEl.remove();
        }
      });

      onChildAdded(signalsRef, (snapshot) => {
        const signal = snapshot.val();

        if (signal.receiver && signal.receiver !== myId) return;

        if (signal.sender === myId) return;

        log(`Received ${signal.type} signal from ${signal.sender}`);

        if (signal.type === "offer") {
          handleOffer(signal);
        } else if (signal.type === "answer") {
          handleAnswer(signal);
        } else if (signal.type === "ice") {
          handleIceCandidate(signal);
        }
      });

      onValue(participantsRef, (snapshot) => {
        const participants = snapshot.val();
        if (participants) {
          Object.values(participants).forEach((participant) => {
            updateParticipantMuteStatus(participant.id, participant.muted);
          });
        }
      });
    }

    function addParticipantToUI(participant) {
      const participantsContainer = document.getElementById(
        "participantsContainer",
      );

      let participantEl = document.getElementById(
        `participant-${participant.id}`,
      );
      if (!participantEl) {
        participantEl = document.createElement("div");
        participantEl.id = `participant-${participant.id}`;
        participantEl.className = "participant";
        participantEl.style.padding = "8px";
        participantEl.style.margin = "4px 0";
        participantEl.style.borderRadius = "4px";
        participantEl.style.transition = "all 0.2s ease";
        participantEl.style.borderLeft = "3px solid transparent";

        const muteIcon = document.createElement("span");
        muteIcon.className = "material-icons";
        muteIcon.style.fontSize = "16px";
        muteIcon.style.marginRight = "5px";
        muteIcon.style.verticalAlign = "middle";
        muteIcon.textContent = participant.muted ? "mic_off" : "mic";
        muteIcon.id = `mute-icon-${participant.id}`;

        const emailSpan = document.createElement("span");
        emailSpan.textContent = participant.email;
        if (participant.id === myId) {
          emailSpan.textContent += " (You)";
        }

        participantEl.appendChild(muteIcon);
        participantEl.appendChild(emailSpan);

        participantsContainer.appendChild(participantEl);
      }
    }

    function removeParticipantFromUI(participantId) {
      const participantEl = document.getElementById(
        `participant-${participantId}`,
      );
      if (participantEl) {
        participantEl.remove();
      }
    }

    function updateParticipantMuteStatus(participantId, isMuted) {
      const muteIcon = document.getElementById(`mute-icon-${participantId}`);
      if (muteIcon) {
        muteIcon.textContent = isMuted ? "mic_off" : "mic";
      }
    }

    async function createAndSendOffer(participantId) {
      const peerConnection = peerConnections[participantId];
      if (!peerConnection) {
        log(`No peer connection for ${participantId}`);
        return;
      }

      try {
        log(`Creating offer for ${participantId}...`);
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
        });

        log(`Setting local description for ${participantId}...`);
        await peerConnection.setLocalDescription(offer);

        log(`Sending offer to ${participantId}`);
        push(ref(db, `rooms/${currentRoomId}/signals`), {
          type: "offer",
          sender: myId,
          receiver: participantId,
          sdp: peerConnection.localDescription.toJSON(),
          timestamp: Date.now(),
        });
      } catch (error) {
        log(`Error creating offer for ${participantId}: ${error.message}`);
      }
    }

    async function handleOffer(signal) {
      const senderId = signal.sender;
      let peerConnection = peerConnections[senderId];

      if (!peerConnection) {
        peerConnection = setupPeerConnection(senderId);
      }

      try {
        log(`Setting remote description from offer from ${senderId}`);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.sdp),
        );

        log(`Creating answer for ${senderId}`);
        const answer = await peerConnection.createAnswer();

        log(`Setting local description for answer to ${senderId}`);
        await peerConnection.setLocalDescription(answer);

        log(`Sending answer to ${senderId}`);
        push(ref(db, `rooms/${currentRoomId}/signals`), {
          type: "answer",
          sender: myId,
          receiver: senderId,
          sdp: peerConnection.localDescription.toJSON(),
          timestamp: Date.now(),
        });
      } catch (error) {
        log(`Error handling offer from ${senderId}: ${error.message}`);
      }
    }

    async function handleAnswer(signal) {
      const senderId = signal.sender;
      const peerConnection = peerConnections[senderId];

      if (!peerConnection) {
        log(`Received answer from ${senderId} but no peer connection exists`);
        return;
      }

      try {
        log(`Setting remote description from answer from ${senderId}`);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.sdp),
        );
      } catch (error) {
        log(`Error handling answer from ${senderId}: ${error.message}`);
      }
    }

    async function handleIceCandidate(signal) {
      const senderId = signal.sender;
      const peerConnection = peerConnections[senderId];

      if (!peerConnection) {
        log(
          `Received ICE candidate from ${senderId} but no peer connection exists`,
        );
        return;
      }

      try {
        log(`Adding ICE candidate from ${senderId}`);
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(signal.candidate),
        );
      } catch (error) {
        log(`Error adding ICE candidate from ${senderId}: ${error.message}`);
      }
    }

    document
      .getElementById("muteToggleButton")
      .addEventListener("click", () => {
        isMuted = !isMuted;

        document.getElementById("muteButtonText").textContent = isMuted
          ? "Unmute"
          : "Mute";
        document.getElementById("muteToggleButton").style.backgroundColor =
          isMuted ? "#f44336" : "#4CAF50";
        document
          .getElementById("muteToggleButton")
          .querySelector("span.material-icons").textContent = isMuted
          ? "mic_off"
          : "mic";

        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            track.enabled = !isMuted;
          });
        }

        if (myId && currentRoomId) {
          set(
            ref(db, `rooms/${currentRoomId}/participants/${myId}/muted`),
            isMuted,
          );
        }

        log(`Microphone ${isMuted ? "muted" : "unmuted"}`);
      });
  } catch (error) {
    log(`Initialization error: ${error.message}`);
    setStatus(`Error: ${error.message}`);
  }
})();