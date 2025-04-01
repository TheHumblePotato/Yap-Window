(async function () {
  const style = document.createElement("style");
  style.id = "bookmarklet-style";

  let isDark = localStorage.getItem("bookmarklet-mode") === "dark";
  function toggleDarkMode() {
    isDark = !isDark;
    localStorage.setItem("bookmarklet-mode", isDark ? "dark" : "light");
    document.getElementById("dark-mode").textContent = isDark
      ? "Light Mode"
      : "Dark Mode";
    updateColor();
  }
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.altKey && e.key === "d") {
      e.preventDefault();
      toggleDarkMode();
    }
  });

  function updateColor() {
    style.innerHTML = `#bookmarklet-gui {
	position: fixed;
	top: 10%;
	left: 50%;
	transform: translateX(-50%);
	width: 40%;
	height: 50%;
	z-index: 1000000;
	background-color: ${isDark ? "#333" : "#fff"};
	color: ${isDark ? "#ddd" : "#333"};
	font-family: 'Aptos',
		Calibri,
		sans-serif;
	border-radius: 10px;
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	resize: both;
	overflow: hidden;
}

#bookmarklet-gui-header {
	position: absolute;
	top: 0;
	right: 0;
	left: 0;
	height: 40px;
	background-color: ${isDark ? "#444" : "#ccc"};
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 10px;
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
}

#bookmarklet-gui-header .button-group {
	display: flex;
	gap: 5px;
}

#bookmarklet-gui-header button {
	width: 30px;
	height: 30px;
	border-radius: 15px;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 18px;
	margin: 0 2px;
	background-color: ${isDark ? "#444" : "#ccc"};
	color: ${isDark ? "#ddd" : "#333"};
	border: 1px solid ${isDark ? "#444" : "#ccc"};
	cursor: pointer;
	transition: all 0.2s ease-in-out;
}

#bookmarklet-gui-header button:hover {
	background-color: ${isDark ? "#555" : "#ddd"};
	color: ${isDark ? "#eee" : "#333"};
}

#bookmarklet-close:hover {
	background-color: ${isDark ? "#ff4d4d" : "#ff4d4d"};
	color: white;
}

#bookmarklet-minimize:hover {
	background-color: ${isDark ? "#90ee90" : "#90ee90"};
	color: ${isDark ? "#333" : "#333"};
}

#bookmarklet-maximize:hover {
	background-color: ${isDark ? "#ffd700" : "#ffd700"};
	color: ${isDark ? "#333" : "#333"};
}

.screen {
	width: 100%;
	height: calc(100% - 40px);
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	padding: 20px;
	box-sizing: border-box;
	overflow-y: auto;
	margin-top: 20px;
	background-color: ${isDark ? "#333" : "#fff"};
	color: ${isDark ? "#ddd" : "#333"};
}

.screen.hidden {
	display: none;
}

.screen input,
.screen textarea,
.screen button {
	width: 100%;
	height: auto;
	margin: 10px 0;
	padding: 10px;
	border-radius: 5px;
	box-sizing: border-box;
	font-size: 12px;
	text-align: center;
	display: block;
	margin-left: auto;
	margin-right: auto;
	color: ${isDark ? "#ddd" : "#333"};
	background-color: ${isDark ? "#444" : "#ddd"};
	border: 1px solid ${isDark ? "#555" : "#ccc"};
}

.screen button:hover {
	background-color: ${isDark ? "#555" : "#ccc"};
	color: ${isDark ? "#eee" : "#333"};
}

.screen h2,
.screen h3 {
	color: ${isDark ? "#ddd" : "#333"};
	text-align: center;
}

.screen label {
	color: ${isDark ? "#ddd" : "#333"};
}

.screen textarea {
	min-height: 50px;
	color: ${isDark ? "#ddd" : "#333"};
	background-color: ${isDark ? "#444" : "#fff"};
	border: 1px solid ${isDark ? "#555" : "#ccc"};
}

.screen div {
	width: 90%;
	border: 1px solid ${isDark ? "#555" : "#ccc"};
	justify-items: center;
}


.chat {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 0;
  box-sizing: border-box;
  background-color: ${isDark ? "#222" : "#fff"};
  color: ${isDark ? "#ddd" : "#333"};
  height: 100%;
}

.chat.hidden {
  display: none !important;
}

#chat-screen {
  flex-direction: column;
  margin-top: 40px;
  padding-top: 0;
  height: calc(100% - 40px);
}

#lower-chat {
  display: flex;
  flex-direction: row;
  height: calc(100% - 40px);
  width: 100%;
  margin: 0;
}

/* Settings Bar */
#settings-bar {
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid ${isDark ? "#444" : "#e0e0e0"};
  background: ${isDark ? "#2a2a2a" : "#f8f9fa"};
  padding: 0 16px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.setting-button {
  height: 32px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${isDark ? "#404040" : "#e9ecef"};
  color: ${isDark ? "#ffffff" : "#495057"};
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.setting-button:hover {
  background: ${isDark ? "#505050" : "#dee2e6"};
}

/* Left Sidebar (Server and DM) */
#left-sidebar {
  width: 20%;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 2px solid ${isDark ? "#555" : "#ccc"};
  background: ${isDark ? "linear-gradient(to bottom, #444, #333)" : "linear-gradient(to bottom, #f7f7f7, #e0e0e0)"};
  padding: 8px;
  box-sizing: border-box;
  flex-shrink: 0;
  margin-bottom: 0;
}

#top-left-sidebar {
  height: 60%;
  min-height: 60%;
  max-height: 60%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 10px;
  overflow-y: auto;
  overflow-x: hidden;
}

#bottom-left-sidebar {
  height: 40%;
  min-height: 40%;
  width: 100%;
  padding: 8px 0 0 0;
  background-color: ${isDark ? "#333" : "#f1f1f1"};
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid ${isDark ? "#555" : "#ddd"};
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 0;
}

#server-list {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
}

#create-new-server {
  padding: 8px 5px;
  background-color: ${isDark ? "#a65653" : "#5865F2"};
  color: white;
  border: none;
  border-radius: 4px;
  width: 90%;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.3s ease;
  margin-bottom: 8px;
}

#create-new-server:hover {
  background-color: ${isDark ? "#c79d9b" : "#4752C4"};
}

.server {
  background-color: ${isDark ? "#555" : "#e0e0e0"};
  width: 90%;
  padding: 5px 4px;
  margin-bottom: 1px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.server:hover {
  background-color: ${isDark ? "#666" : "#d0d0d0"};
}

.server.selected {
  background-color: ${isDark ? "#777" : "#ccc"};
  box-shadow: 0 0 0 1px ${isDark ? "#888" : "#999"};
}

.dm {
	width: 90%;
	padding: 8px 12px;
	margin: 0;
	font-size: 13px;
	font-weight: 500;
	text-align: center;
	border-radius: 6px;
	background-color: ${isDark ? "#444" : "#e8e8e8"};
	color: ${isDark ? "#fff" : "#333"};
	transition: all 0.2s ease;
	cursor: pointer;
	border: 1px solid transparent;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dm:hover {
	background-color: ${isDark ? "#555" : "#d0d0d0"};
	transform: translateY(-1px);
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Right Sidebar (Messages Area) */
#right-sidebar {
	width: 80%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 100%;
	padding-left: 10px;
	background-color: ${isDark ? "#333" : "#fff"};
	color: ${isDark ? "#ddd" : "#333"};
	min-width: 0;
}

#messages {
	flex: 1;
	overflow-y: auto;
	background-color: ${isDark ? "#222" : "#f9f9f9"};
	padding: 10px;
	margin-bottom: 10px;
}

.message {
	padding: 3px 8px;
	margin-bottom: 3px;
	border-radius: 5px;
	font-size: 12px;
	width: 95%;
	max-width: 95%;
	word-wrap: break-word;
	background-color: ${isDark ? "#444" : "#e0e0e0"};
	color: ${isDark ? "#ccc" : "#333"};
}

.message.sent {
	text-align: right;
	background-color: ${isDark ? "#4a4a4a" : "#e0f7fa"};
	color: ${isDark ? "#cccccc" : "#006064"};
}

.message.received {
	text-align: left;
	background-color: ${isDark ? "#3a3a3a" : "#f1f8e9"};
	color: ${isDark ? "#cccccc" : "#33691e"};
}

.message.received.unread {
  background-color: ${isDark ? "#4a3a3a" : "#e8f5e9"};
  border-left: 3px solid ${isDark ? "#ff6b6b" : "#4caf50"};
  box-shadow: 0 1px 3px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"};
}

.message.error {
	text-align: left;
	background-color: ${isDark ? "#5a3030" : "#ffebee"};
	color: ${isDark ? "#ff9a9a" : "#c62828"};
}

.message.error.unread {
  background-color: ${isDark ? "#663030" : "#ffcdd2"};
  border-left: 3px solid ${isDark ? "#ff6b6b" : "#e53935"};
  box-shadow: 0 1px 3px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"};
}

.send-info {
	font-size: 8px;
	color: ${isDark ? "#888" : "#666"};
}
#message-send {
  padding: 10px;
  background-color: ${isDark ? "#444" : "#f1f1f1"};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: auto;
}

#message-input {
	width: 80%;
	padding: 10px;
	border-radius: 5px;
	border: 1px solid ${isDark ? "#555" : "#ccc"};
	margin-top: auto;
	margin-bottom: auto;
	color: ${isDark ? "#ddd" : "black"};
	background-color: ${isDark ? "#333" : "#fff"};
}

#send-button {
	padding: 10px 30px;
	background-color: ${isDark ? "#4a4a4a" : "#00796b"};
	color: white;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	margin-top: auto;
	margin-bottom: auto;
	margin-left: 10px;
}

#send-button:hover {
	background-color: ${isDark ? "#3a3a3a" : "#004d40"};
}
.selected-members-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 8px 0;
    min-height: 24px;
    padding: 4px;
    border: 1px solid ${isDark ? "#555" : "#ccc"};
    border-radius: 4px;
    overflow: hidden;
}

.selected-member {
    background: ${isDark ? "#444" : "#e0e0e0"};
    padding: 2px 6px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85em;
    white-space: nowrap;
}

.remove-member {
    cursor: pointer;
    color: ${isDark ? "#fff" : "#666"};
    font-weight: bold;
    font-size: 0.9em;
}

.members-dropdown {
    position: relative;
}

.members-list {
    border: 1px solid ${isDark ? "#555" : "#ccc"};
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    position: absolute;
    width: 100%;
    background: ${isDark ? "#333" : "#fff"};
    display: none;
}

.member-option {
    padding: 8px;
    cursor: pointer;
}

.member-option:hover {
    background: ${isDark ? "#444" : "#f0f0f0"};
}

#member-search {
    width: 100%;
    padding: 8px;
    margin: 8px 0;
    border: 1px solid ${isDark ? "#555" : "#ccc"};
    border-radius: 4px;
}
  `;
  }

  document.head.appendChild(style);
  updateColor();

  const gui = document.createElement("div");
  gui.id = "bookmarklet-gui";
  let originalState = {
    width: "50%",
    height: "60%",
    top: "10%",
    left: "50%",
    transform: "translateX(-50%)",
  };

  gui.innerHTML = `
<div id="bookmarklet-gui-header">
   <span>Yapper Window (Definitely not the April Fools Edition)</span>   
   <div class="button-group">
      <button id="bookmarklet-minimize">⛶</button>
      <button id="bookmarklet-fullscreen">−</button>
      <button id="bookmarklet-close">×</button>
   </div>
</div>
<div id="login-screen" class="screen hidden">
   <h2>Log In</h2>
   <div id="google-login-section" style="border:1px solid black">
      <h3>Sign In with Google</h3>
      <button id="google-login-button">Login with Google</button>
   </div>
   <div id="email-login-section" style="border:1px solid black">
      <h3>Login with Email</h3>
      <label for="login-email">Email</label>
      <input id="login-email" type="email" placeholder="Enter your email" required="">
      <label for="login-password">Password</label>
      <input id="login-password" type="password" placeholder="Enter your password" required="">
      <button id="submit-login-email">Log In</button>
      <label id="login-email-error" style="color: #f2545b"></label>
   </div>
   <div>
      <button id="back-login-button">Back</button>
   </div>
   <hr style="margin: 20px 0">
</div>
<div id="create-account-screen" class="screen hidden">
   <h2>Create Account</h2>
   <div id="google-create-section" style="border:1px solid black">
      <h3>Create Account with Google</h3>
      <button id="google-create-button">Sign Up with Google</button>
   </div>
   <div id="email-create-section" style="border:1px solid black">
      <h3>Create Account with Email</h3>
      <label for="create-email">Email</label>
      <input id="create-email" type="email" placeholder="Enter your email" required="">
      <label for="create-email">Password</label>
      <input id="create-password" type="password" placeholder="Enter your password" required="">
      <button id="submit-create-email">Create Account</button>
      <label id="create-email-error" style="color: #f2545b"></label>
   </div>
   <div>
      <button id="back-create-button">Back</button>
   </div>
   <hr style="margin: 20px 0">
</div>
<div id="verification-screen" class="screen hidden">
    <h2>Email Verification</h2>
    <p>Please check your email for a verification link.</p>
    <p>Once you verify your email, you will automatically be taken to the next page</p>
    <button id="resend-verification">Resend Verification Email</button>
    <p id="verification-error" class="error-text"></p>
</div>
<div id="customize-account-screen" class="screen hidden">
   <h2>Final Steps</h2>
   <label for="create-username">Username</label>
   <input id="create-username" type="text" placeholder="Pick a username" required="">
   <label for="create-picture">Profile Picture (optional)</label>
   <input id="create-picture" type="file" accept="image/*">
   <label for="create-bio">Bio (optional)</label>   
   <textarea id="create-bio" rows="8" columns="50" height="100px">I'm a yapper</textarea>
   <button id="submit-customize">Save</button>
</div>
<div id="stay-login-screen" class="screen hidden">
   <h2>Would you like to stay logged in?</h2>
   <h3>Any future logins on this site will automatically sign you into your account</h3>
   <div id="stay-login-buttons" style="justify-content: space-between; align-items: center;">
      <button id="stay-yes" style="width: 20%">No</button>
      <button id="stay-no" style="width: 20%">Yes</button>
      <button id="stay-forget" style="width: 20%">Bother Me! :)</button>
   </div>
</div>
<div id="main-screen" class="screen">
   <h2>Welcome to Yapper Window</h2>
   <p>Press CTRL-ALT-D to switch between light and dark mode</p>
   <button id="login-button">Log In</button>
   <button id="create-account-button">Create Account</button>
<p style="width:80%; text-align: center;">
  By using Yapper Window, you agree to the 
  <a href="https://docs.google.com/document/d/1nsVWJ94ijnRRsyV_mCkdVdXvuOvg6c4bk9PBP-L2NaI" target="_blank">
    Terms and Conditions
  </a>.
</p>
</div>
<div id="saved-account" class="screen hidden">
   <h2>You have an account saved on this computer</h2>
   <p id="saved-email">Email: _______</p>
   <p id="saved-username">Username: _______</p>
   <button id="saved-login-button">Okay</button>
   <button id="saved-signout-button">Sign Out</button>
</div>
<div id="chat-screen" class="chat hidden">
  <div id="settings-bar">
    <button id="customize-profile" class="setting-button">Profile</button>
    <button id="dark-mode" class="setting-button">${isDark ? "Light Mode" : "Dark Mode"}</button>
    <button id="read-all" class="setting-button">Read All</button>
    <button id="hide-left-sidebar" class="setting-button">Hide Left Sidebar</button>
  </div>
  <div id="lower-chat" class="chat">
    <div id="left-sidebar">
      <div id="top-left-sidebar">
        <button id="create-new-server">Create New Server</button>
        <div id="server-list">
          <div class="server" id="general-server">General</div>
        </div>
      </div>
      <div id="bottom-left-sidebar">
        <div id="dm-list">
        </div>
      </div>
    </div>
    <div id="right-sidebar">
      <div id="messages">
      </div>
      <div id="message-send">
        <p id="typing-indicator"></p>
        <input type="text" id="message-input" autocomplete="off" placeholder="Yap away..."/>
        <button id="send-button">Send</button>
      </div>
    </div>
  </div>
</div>
<div id="channel-screen" class="screen hidden">
    <h2>Create/Customize Channel</h2>
    <label for="channel-name">Channel Name</label>
    <input id="channel-name" type="text" placeholder="Name your channel..." required>
    
    <label for="channel-type">Channel Type</label>
    <select id="channel-type">
        <option value="Public">Public</option>
        <option value="Private">Private</option>
    </select>
    
    <div id="members-container" style="display: none;">
        <label>Select Members</label>
        <div id="selected-members" class="selected-members-container"></div>
        <div class="members-dropdown">
            <input type="text" id="member-search" placeholder="Type Emails Here...">
            <div id="members-list" class="members-list"></div>
        </div>
    </div>
    
    <label for="channel-description">Description/Rules (optional)</label>   
    <textarea id="channel-description" rows="8" columns="50"></textarea>
    <button id="submit-channel">Save</button>
   <button id="back-channel">Back</button>
</div>
<p style="display: none" id="email-saved-here"></p>
      `;
  document.body.appendChild(gui);

  /* Make the GUI draggable */
  const header = gui.querySelector("#bookmarklet-gui-header");
  const enableDragging = () => {
    header.onmousedown = function (e) {
      const offsetX = e.clientX - gui.offsetLeft;
      const offsetY = e.clientY - gui.offsetTop;
      document.onmousemove = function (e) {
        gui.style.left = `${e.clientX - offsetX}px`;
        gui.style.top = `${e.clientY - offsetY}px`;
      };
      document.onmouseup = function () {
        document.onmousemove = null;
      };
    };
  };
  enableDragging();

  /* Close button functionality */
  gui.querySelector("#bookmarklet-close").onclick = function () {
    gui.remove();
  };
  gui.querySelector("#bookmarklet-minimize").onclick = function () {
    gui.style.transition = "all 0.3s ease";
    gui.style.opacity = "0";

    setTimeout(() => {
      gui.style.display = "none";
    }, 300);
  };

  /* Fullscreen functionality */
  gui.querySelector("#bookmarklet-fullscreen").onclick = function (e) {
    const isFullscreen = e.target.innerHTML === "⿻";
    if (!isFullscreen) {
      originalState = {
        width: gui.style.width,
        height: gui.style.height,
        top: gui.style.top,
        left: gui.style.left,
        transform: gui.style.transform,
      };
      gui.style.position = "fixed";
      gui.style.width = "100%";
      gui.style.height = "100%";
      gui.style.top = "0";
      gui.style.left = "0";
      gui.style.transform = "none";
      gui.style.resize = "none";
      header.onmousedown = null;
      e.target.innerHTML = "⿻";
    } else {
      gui.style.width = originalState.width;
      gui.style.height = originalState.height;
      gui.style.top = originalState.top;
      gui.style.left = originalState.left;
      gui.style.transform = originalState.transform;
      gui.style.resize = "both";
      enableDragging();
      e.target.innerHTML = "⛶";
    }
  };

  document
    .getElementById("dark-mode")
    ?.addEventListener("click", toggleDarkMode);
})();
