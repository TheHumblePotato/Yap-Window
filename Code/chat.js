(async function () {
  var dayOff = false;
  var readMessages = {};
  var readAll = true;
  var isDark = false;
  let pendingFormOptions = null;
  let isSending = false;
  const BOT_USERS = {
    AI: "[AI]",
    RNG: "[RNG]",
    EOD: "[EOD]",
    SNAKE: "[Snake Game]",
    24: "[24]",
    ARCHFIEND: "[Archfiend Dice]",
    TIGGY: "[Tiggy]",
    TIGGYBOT: "[Tiggy Bot]",
    JIMMY: "[Jimmy Bot]",
    SHELL: "[Shell]",
    HELP: "[HELP]"
  };
  let ADMIN_LIST = [];
  const email = auth.currentUser.email;

  console.log(auth.currentUser.email);
  
  // Load Voice Chat functionality
  try {
    const ts = Math.floor(Date.now() / 1000);
    const vcPrimaryUrl = `https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vc.js?token=${ts}`;
    const vcFallbackUrl = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/vc.js";
    
    let vcResponse;
    try {
      vcResponse = await fetch(vcPrimaryUrl);
      if (!vcResponse.ok) {
        vcResponse = await fetch(vcFallbackUrl);
      }
    } catch (error) {
      vcResponse = await fetch(vcFallbackUrl);
    }
    
    const vcCode = await vcResponse.text();
    eval(vcCode);
    console.log('Voice chat loaded successfully');
  } catch (error) {
    console.error('Failed to load voice chat:', error);
  }
  
  async function getAdmins() {
    const pathRef = ref(database, '/Chat Info/Staff chat (ADMIN, MOD)/Members');
    try {
      const snapshot = await get(pathRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        ADMIN_LIST = data.replaceAll("*", ".").split(",");
        console.log(ADMIN_LIST);
        return data;
      } else {
        console.log("No data available at this path.");
        return null;
      }
    } catch (error) {
      console.error("Error retrieving data:", error);
    }
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function isWeekend() {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    alert("Please verify your email before using chat.");
    return;
  }

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

  getAdmins();
  const sc = document.createElement("script");
  sc.setAttribute(
    "src",
    "https://cdn.jsdelivr.net/npm/emoji-toolkit@8.0.0/lib/js/joypixels.min.js",
  );
  document.head.appendChild(sc);
  const ss = document.createElement("stylesheet");
  sc.setAttribute(
    "href",
    "https://cdn.jsdelivr.net/npm/emoji-toolkit@8.0.0/extras/css/joypixels.min.css",
  );
  document.head.appendChild(ss);
  const gui = document.getElementById("bookmarklet-gui");
  chatScreen = document.getElementById("chat-screen");
  chatScreen.classList.remove("hidden");
  dayOff = isWeekend();


  async function initializeReadMessages() {
    const readMessagesRef = ref(
      database,
      `Accounts/${email.replace(/\./g, "*")}/readMessages`,
    );
    const snapshot = await get(readMessagesRef);
    readMessages = snapshot.val() || {};
    return readMessages;
  }

  function updateReadAllStatus() {
    const allChats = document.querySelectorAll(".server");
    readAll = true;

    allChats.forEach((chat) => {
      const unreadCount = parseInt(chat.getAttribute("data-unread") || "0");
      if (unreadCount > 0) {
        readAll = false;
      }
    });
    updateFavicon();
  }

  async function scrollToFirstUnread(chatName) {
    const messagesDiv = document.getElementById("messages");

    await new Promise((resolve) => {
      const checkMessages = () => {
        if (messagesDiv.children.length > 0) {
          resolve();
        } else {
          setTimeout(checkMessages, 50);
        }
      };
      checkMessages();
    });

    if (messagesDiv.children.length === 0) {
      return;
    }

    const hasUnreadMessages =
      document.querySelector(".message.unread") !== null;

    if (!hasUnreadMessages) {
      return;
    }

    const lastReadMessageId = readMessages[chatName];

    if (!lastReadMessageId) {
      const allMessages = Array.from(messagesDiv.children);
      const lastMessage = allMessages[allMessages.length - 1];
      if (lastMessage) {
        const lastMessageId =
          lastMessage.dataset.lastMessageId || lastMessage.dataset.messageId;
        if (lastMessageId) {
          await markMessagesAsRead(chatName, lastMessageId);
        }
      }
      return;
    }

    async function findFirstUnreadMessage() {
      const allMessages = Array.from(messagesDiv.children);

      let lastReadMessageIndex = -1;
      for (let i = 0; i < allMessages.length; i++) {
        const msgElement = allMessages[i];
        const msgId = msgElement.dataset.messageId;
        const lastMsgId = msgElement.dataset.lastMessageId;

        if (msgId === lastReadMessageId || lastMsgId === lastReadMessageId) {
          lastReadMessageIndex = i;
          break;
        }
      }

      if (
        lastReadMessageIndex !== -1 &&
        lastReadMessageIndex < allMessages.length - 1
      ) {
        return allMessages[lastReadMessageIndex + 1];
      }

      if (messagesDiv.scrollTop <= 5) {
        if (allMessages.length > 0) {
          const lastMessage = allMessages[allMessages.length - 1];
          const lastMessageId =
            lastMessage.dataset.lastMessageId || lastMessage.dataset.messageId;
          if (lastMessageId) {
            await markMessagesAsRead(chatName, lastMessageId);
          }
        }

        return null;
      }

      const oldScrollHeight = messagesDiv.scrollHeight;

      await smoothScrollTo(messagesDiv, 0);

      await new Promise((resolve) => setTimeout(resolve, 600));

      if (messagesDiv.scrollHeight === oldScrollHeight) {
        if (allMessages.length > 0) {
          const lastMessage = allMessages[allMessages.length - 1];
          const lastMessageId =
            lastMessage.dataset.lastMessageId || lastMessage.dataset.messageId;
          if (lastMessageId) {
            await markMessagesAsRead(chatName, lastMessageId);
          }
        }

        return null;
      }

      return findFirstUnreadMessage();
    }

    try {
      const firstUnreadMessage = await findFirstUnreadMessage();
      if (firstUnreadMessage) {
        const targetPosition =
          firstUnreadMessage.offsetTop - messagesDiv.clientHeight / 3;

        if (messagesDiv.scrollTop <= 5 && targetPosition > 5) {
          messagesDiv.scrollTop = 0;
          await new Promise((resolve) => setTimeout(resolve, 100));

          await smoothScrollTo(messagesDiv, targetPosition);
        } else {
          await smoothScrollTo(messagesDiv, targetPosition);
        }
      }
    } catch (error) {
      console.error("Error scrolling to first unread:", error);
    }

    function smoothScrollTo(element, targetPosition) {
      return new Promise((resolve) => {
        const startPosition = element.scrollTop;
        const distance = targetPosition - startPosition;

        if (Math.abs(distance) < 5) {
          element.scrollTop = targetPosition;
          resolve();
          return;
        }

        const duration = 500;
        let start = null;

        function animation(currentTime) {
          if (!start) start = currentTime;
          const progress = (currentTime - start) / duration;

          if (progress < 1) {
            const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
            const currentPosition = startPosition + distance * ease(progress);
            element.scrollTop = currentPosition;
            window.requestAnimationFrame(animation);
          } else {
            element.scrollTop = targetPosition;
            resolve();
          }
        }

        window.requestAnimationFrame(animation);
      });
    }
  }
  async function updateFavicon() {
    const currentUrl = window.location.href;
    const hasUnreadMessages = !readAll;

    let link = document.querySelector(
      'link[rel="icon"], link[rel="shortcut icon"]',
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    if (hasUnreadMessages) {
      let notificationIconPath;

      if (currentUrl.includes("lakesideschool.instructure.com")) {
        iconUrl =
          "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/main/Favicon/CanvasNotification.png";
      } else if (currentUrl.includes("google.com")) {
        iconUrl =
          "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/main/Favicon/GoogleNotification.png";
      }

      if (iconUrl) {
        try {
          link.href = iconUrl;
        } catch (error) {
          console.error("Error loading notification favicon:", error);
        }
      }
    } else {
      if (currentUrl.includes("lakesideschool.instructure.com")) {
        link.href =
          "https://instructure-uploads-pdx.s3.us-west-2.amazonaws.com/account_211800000000000001/attachments/3701/smallershield.png";
      } else if (currentUrl.includes("google.com")) {
        link.href = "https://google.com/favicon.ico";
      }
    }
  }

  async function checkForUpdates() {
    const userRef = ref(
      database,
      `Accounts/${email.replace(/\./g, "*")}/Version`,
    );
    const updatesRef = ref(database, "Updates");

    const userVersionSnapshot = await get(userRef);
    const updatesSnapshot = await get(updatesRef);

    if (!userVersionSnapshot.exists() || !updatesSnapshot.exists()) {
      console.error("Failed to fetch user version or updates.");
      return;
    }

    const userVersionData =
      userVersionSnapshot.val().replace("*", ".") || "1.0";
    const updates = updatesSnapshot.val();

    const userVersion = userVersionData.split(".").map(Number);
    const versionKeys = Object.keys(updates)
      .map((v) => v.replace("*", ".").split(".").map(Number))
      .filter((version) => {
        for (let i = 0; i < Math.max(version.length, userVersion.length); i++) {
          const vPart = version[i] || 0;
          const cPart = userVersion[i] || 0;
          if (vPart > cPart) return true;
          if (vPart < cPart) return false;
        }
        return false;
      });

    if (versionKeys.length > 0) {
      const newUpdates = versionKeys.map((version) => version.join("*"));
      showUpdatePopup(updates, newUpdates);
    }
  }

  function showUpdatePopup(updates, newUpdates) {
    const popup = document.createElement("div");
    popup.classList.add("update-popup");
    popup.style.position = "fixed";
    popup.style.top = "10%";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.backgroundColor = isDark ? "#2c2c2c" : "#fff";
    popup.style.color = isDark ? "#eaeaea" : "#333";
    popup.style.padding = "20px";
    popup.style.borderRadius = "8px";
    popup.style.boxShadow = isDark
      ? "0 4px 8px rgba(0, 0, 0, 0.6)"
      : "0 4px 8px rgba(0, 0, 0, 0.1)";
    popup.style.zIndex = "100000";
    popup.style.maxWidth = "300px";
    popup.style.maxHeight = "250px";
    popup.style.overflowY = "auto";

    const title = document.createElement("h3");
    title.textContent = "New Updates!";
    popup.appendChild(title);

    newUpdates.forEach((version) => {
      const update = updates[version];

      const updateElement = document.createElement("div");

      const updateHeader = document.createElement("strong");
      updateHeader.textContent = `Update ${version.replace("*", ".")}`;

      const updateDate = document.createElement("small");
      updateDate.textContent = ` (${new Date(update.Date).toLocaleDateString()})`;

      const updateDescription = document.createElement("p");
      updateDescription.textContent = update.Description;

      updateElement.appendChild(updateHeader);
      updateElement.appendChild(updateDate);
      updateElement.appendChild(updateDescription);
      popup.appendChild(updateElement);
    });

    const closeButton = document.createElement("button");
    closeButton.style.backgroundColor = isDark ? "#bf21a7" : "#fc8dec";
    closeButton.textContent = "Close";
    closeButton.onclick = () => popup.remove();
    popup.appendChild(closeButton);

    document.getElementById("chat-screen").appendChild(popup);

    const mostRecentVersion = newUpdates[newUpdates.length - 1];
    set(
      ref(database, `Accounts/${email.replace(/\./g, "*")}/Version`),
      mostRecentVersion,
    );
  }

  async function fetchChatList() {
    const chatRef = ref(database, "Chat Info");

    onValue(chatRef, async (snapshot) => {
      const chatData = snapshot.val();
      if (chatData) {
        await populateSidebar(chatData);
        const generalServer = Array.from(
          document.querySelectorAll(".server"),
        ).find((server) => server.textContent.trim() === "General");
        if (generalServer) {
          generalServer.classList.add("selected");
        }
      }
    });
  }

  var currentChat = "General";
  let currentChatListener = null;
  let currentChatTypingListener = null;

  async function populateSidebar(chatData) {
    if (Object.keys(readMessages).length === 0) {
      await initializeReadMessages();
    }

    const sidebar = document.getElementById("server-list");
    sidebar.innerHTML = "";

    const chatElements = new Map();

    for (const [chatName, chatInfo] of Object.entries(chatData)) {
      const { Description, Members, Type } = chatInfo;
      const memberList =
        Type === "Private"
          ? Members.split(",").map((m) => m.trim().replace(/\s+/g, ""))
          : [];

      if (
        Type === "Public" ||
        (Type === "Private" && memberList.includes(email.replace(/\./g, "*")))
      ) {
        const chatElement = document.createElement("div");
        chatElement.className = "server";
        chatElement.textContent = chatName;
        chatElement.title = Description;

        const badge = document.createElement("span");
        badge.className = "unread-badge";
        badge.style.display = "none";
        badge.style.backgroundColor = isDark ? "#ff6b6b" : "#ff4444";
        badge.style.color = "white";
        badge.style.borderRadius = "10px";
        badge.style.padding = "2px 6px";
        badge.style.fontSize = "12px";
        badge.style.marginLeft = "5px";
        chatElement.appendChild(badge);

        chatElement.onclick = function () {
          document
            .querySelectorAll(".server")
            .forEach((s) => s.classList.remove("selected"));
          this.classList.add("selected");
          loadMessages(chatName);
          updateUnreadCount(chatName);
          updateModifyButtonVisibility();
        };

        sidebar.appendChild(chatElement);
        chatElements.set(chatName, chatElement);
      }
    }

    chatElements.forEach((element, chatName) => {
      const chatRef = ref(database, `Chats/${chatName}`);
      onValue(chatRef, async (snapshot) => {
        const messages = snapshot.val() || {};
        const lastReadMessage = readMessages[chatName] || "";
        let unreadCount = 0;

        Object.entries(messages).forEach(([messageId, message]) => {
          if (
            message.User !== email &&
            (!lastReadMessage || messageId > lastReadMessage)
          ) {
            unreadCount++;
          }
        });

        const badge = element.querySelector(".unread-badge");
        element.setAttribute("data-unread", unreadCount);

        if (unreadCount > 0) {
          badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
          badge.style.display = "inline";
        } else {
          badge.style.display = "none";
        }
      });
    });

    updateReadAllStatus();
  }

  async function updateUnreadCount(chatName) {
    const chatRef = ref(database, `Chats/${chatName}`);
    const snapshot = await get(chatRef);
    const messages = snapshot.val() || {};

    const accountRef = ref(
      database,
      `Accounts/${email.replace(/\./g, "*")}/readMessages/${chatName}`,
    );
    const lastReadSnapshot = await get(accountRef);
    const lastReadMessage = lastReadSnapshot.val() || "";
    let unreadCount = 0;

    const sortedMessages = Object.entries(messages).sort(
      ([, a], [, b]) => new Date(a.Date) - new Date(b.Date),
    );

    let lastReadIndex = -1;
    sortedMessages.forEach(([messageId, message], index) => {
      if (messageId === lastReadMessage) {
        lastReadIndex = index;
      }
    });

    sortedMessages.forEach(([messageId, message], index) => {
      if (message.User !== email && index > lastReadIndex) {
        unreadCount++;
      }
    });

    const chatElement = Array.from(document.querySelectorAll(".server")).find(
      (el) => el.textContent.trim().includes(chatName.trim()),
    );

    if (chatElement) {
      const badge = chatElement.querySelector(".unread-badge");
      chatElement.setAttribute("data-unread", unreadCount);

      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
        badge.style.display = "inline";
      } else {
        badge.style.display = "none";
      }

      if (badge) {
        badge.style.backgroundColor = isDark ? "#ff6b6b" : "#ff4444";
        badge.style.color = "white";
      }
    }

    updateReadAllStatus();
  }

  let hasInteracted = false;
  let lastUpdateTime = 0;
  const UPDATE_INTERVAL = 60000;

  function trackUserInteraction() {
    hasInteracted = true;
  }

  async function updateLastInteractTime() {
    if (!email) return;

    const formattedEmail = email.replace(/\./g, "*");

    const lastInteractRef = ref(
      database,
      `Accounts/${formattedEmail}/LastInteract`,
    );

    try {
      const timestamp = Date.now();

      await set(lastInteractRef, timestamp);

      hasInteracted = false;
      lastUpdateTime = timestamp;
    } catch (error) {
      console.error("Error updating last interaction time:", error);
    }
  }

  function setupInteractionTracking(gui) {
    const target = gui.domElement || gui;

    if (target) {
      target.addEventListener("click", () => trackUserInteraction());
      target.addEventListener("change", () => trackUserInteraction());
    }

    if (gui.controllers) {
      gui.controllers.forEach((controller) => {
        if (controller.domElement) {
          controller.domElement.addEventListener("mousedown", () =>
            trackUserInteraction(),
          );
          controller.domElement.addEventListener("touchstart", () =>
            trackUserInteraction(),
          );
          controller.domElement.addEventListener("change", () =>
            trackUserInteraction(),
          );
        }
      });
    }
    updateLastInteractTime();
    setInterval(() => {
      const currentTime = Date.now();

      if (hasInteracted && currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
        updateLastInteractTime();
      }
    }, UPDATE_INTERVAL);
  }

  function initializeUserActivitySidebar() {
    const userActivityBtn = document.getElementById("user-activity");
    const rightUserSidebar = document.getElementById("right-user-sidebar");
    rightUserSidebar.classList.add("hidden");
    console.log(rightUserSidebar.classListn)
    const closeUserSidebarBtn = document.getElementById("close-user-sidebar");

    userActivityBtn.addEventListener("click", () => {
        // Replace both classes to ensure only one exists
        if (rightUserSidebar.classList.contains("visible")) {
            rightUserSidebar.classList.replace("visible", "hidden");
        } else {
            rightUserSidebar.classList.replace("hidden", "visible");
        }

        // Update interval based on NEW state
        if (rightUserSidebar.classList.contains("visible")) {
            updateUserActivityList();
            window.userActivityInterval = setInterval(updateUserActivityList, 10000);
        } else {
            clearInterval(window.userActivityInterval);
        }
    });

    closeUserSidebarBtn.addEventListener("click", () => {
        rightUserSidebar.classList.replace("visible", "hidden");
        clearInterval(window.userActivityInterval);
    });
  }

  async function updateUserActivityList() {
    try {
      const accountsRef = ref(database, "Accounts");
      const accountsSnapshot = await get(accountsRef);

      if (!accountsSnapshot.exists()) {
        return;
      }

      const accounts = accountsSnapshot.val();
      const currentTime = Date.now();

      const activeUsers = [];
      const recentlyActiveUsers = [];
      const inactiveUsers = [];

      const currentUserEmail = email;
      const currentUserFormattedEmail = currentUserEmail.replace(/\./g, "*");

      Object.keys(accounts).forEach((formattedEmail) => {
        const account = accounts[formattedEmail];
        let lastInteract = account.LastInteract || 0;
        if (formattedEmail === currentUserFormattedEmail) {
          lastInteract = currentTime;
        }
        const username = account.Username || "Unknown";
        const email = formattedEmail.replace(/\*/g, ".");
        const timeDiff = currentTime - lastInteract;

        const userInfo = {
          username,
          email,
          lastInteract,
        };

        if (timeDiff < 2 * 60 * 1000) {
          activeUsers.push(userInfo);
        } else if (timeDiff < 5 * 60 * 1000) {
          recentlyActiveUsers.push(userInfo);
        } else {
          inactiveUsers.push(userInfo);
        }
      });

      const sortByEmail = (a, b) => a.email.localeCompare(b.email);
      activeUsers.sort(sortByEmail);
      recentlyActiveUsers.sort(sortByEmail);
      inactiveUsers.sort(sortByEmail);

      updateUserListInDOM("active-users", activeUsers);
      updateUserListInDOM("recently-active-users", recentlyActiveUsers);
      updateUserListInDOM("inactive-users", inactiveUsers);
    } catch (error) {
      console.error("Error updating user activity list:", error);
    }
  }

  function updateUserListInDOM(elementId, users) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = "";

    if (users.length === 0) {
      const noUsersElement = document.createElement("div");
      noUsersElement.className = "no-users";
      noUsersElement.textContent = "No users in this category";
      listElement.appendChild(noUsersElement);
      return;
    }

    users.forEach((user) => {
      const userElement = document.createElement("div");
      userElement.className = "user-item";

      const statusIndicator = document.createElement("span");
      statusIndicator.className = "status-indicator";
      if (elementId === "active-users") {
        statusIndicator.classList.add("active");
      } else if (elementId === "recently-active-users") {
        statusIndicator.classList.add("recently-active");
      } else {
        statusIndicator.classList.add("inactive");
      }

      const userInfo = document.createElement("div");
      userInfo.style.display = "flex";
      userInfo.style.flexDirection = "column";
      userInfo.style.marginLeft = "8px";
      userInfo.style.overflow = "hidden";

      const userName = document.createElement("span");
      userName.className = "user-name";
      userName.textContent = user.username;

      const userEmail = document.createElement("span");
      userEmail.className = "user-email";
      userEmail.textContent = `(${user.email})`;

      userInfo.appendChild(userName);
      userInfo.appendChild(userEmail);

      userElement.appendChild(statusIndicator);
      userElement.appendChild(userInfo);

      listElement.appendChild(userElement);
    });
  }
  // Typing indicator helpers
  let __typingTimeout = null;
  const TYPING_TIMEOUT_MS = 2000;

  async function sendTypingStart() {
    try {
      const key = email.replace(/\./g, "*");
      const path = `Typing/${currentChat}`;
      const typingRef = ref(database, `${path}/${key}`);
      // Attempt to write the user's display name (Username from Accounts) so
      // other clients can show the proper name instead of the email local-part.
      const displayName = await getUsernameFromEmail(email);
      await set(typingRef, {
        username: displayName || email.split("@")[0],
        ts: Date.now(),
      });
    } catch (e) {
      // ignore
    }
  }

  async function sendTypingStop() {
    try {
      const key = email.replace(/\./g, "*");
      const path = `Typing/${currentChat}/${key}`;
      const typingRef = ref(database, path);
      await remove(typingRef);
    } catch (e) {
      // ignore
    }
  }

  function scheduleTypingStop() {
    if (__typingTimeout) clearTimeout(__typingTimeout);
    __typingTimeout = setTimeout(() => {
      sendTypingStop();
    }, TYPING_TIMEOUT_MS);
  }
  async function getUsernameFromEmail(userEmail) {
    if (!userEmail) return "";
    if (
      [
        "[AI]",
        "[RNG]",
        "[EOD]",
        "[HELP]",
        "[Snake Game]",
        "[24]",
        "[Prime Bot]",
        "[Archfiend Dice]",
        "[Tiggy]",
        "[Tiggy Bot]",
        "[Twelve Angry Men]",
        "[Jimmy Bot]",
        "[Jimmy-Bot]", // idk why this is needed but don't delete
        "[Shell]",
        "[SHELL]",
        "[SYSTEM]",
      ].includes(userEmail)
    )
      return userEmail;
    const formattedEmail = userEmail.replace(/\./g, "*");
    const userRef = ref(database, `Accounts/${formattedEmail}/Username`);
    try {
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : userEmail.split("@")[0];
    } catch (error) {
      return userEmail.split("@")[0];
    }
  }

  async function loadMessages(chatName) {
    document.getElementById("bookmarklet-gui").scrollTop = 0;
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";
    currentChat = chatName;

    const chatRef = ref(database, `Chats/${chatName}`);
    const snapshot = await get(chatRef);
    const messages = snapshot.val();
    if (messages) {
      const messageIds = Object.keys(messages).sort();
      if (messageIds.length > 0) {
        const latestMessageId = messageIds[messageIds.length - 1];
        await markMessagesAsRead(chatName, latestMessageId);
      }
    }

    if (currentChatListener) {
      currentChatListener();
      currentChatListener = null;
    }

    const messagesRef = ref(database, `Chats/${chatName}`);
    // Typing indicators: listen for typing presence in this chat
  const typingRef = ref(database, `Typing/${chatName}`);
    async function renderTypingIndicators(snapshot) {
      const data = snapshot.val() || {};
      const typingKeys = Object.keys(data).filter((k) => k !== email.replace(/\./g, "*"));
      const messagesDiv = document.getElementById("messages");

      // Resolve display names for typing users. Prefer the username field stored in the Typing entry;
      // if missing, fall back to a DB lookup which returns the account Username or the email local-part.
      const names = await Promise.all(
        typingKeys.slice(0, 3).map(async (key) => {
          const entry = data[key] || {};
          if (entry.username && typeof entry.username === "string" && entry.username.trim() !== "") {
            return entry.username;
          }
          // key is stored with '*' for dots; convert back to a normal email before lookup
          const candidateEmail = key.replace(/\*/g, ".");
          try {
            const resolved = await getUsernameFromEmail(candidateEmail);
            return resolved || (candidateEmail.includes("@") ? candidateEmail.split("@")[0] : candidateEmail);
          } catch (err) {
            return candidateEmail.includes("@") ? candidateEmail.split("@")[0] : candidateEmail;
          }
        }),
      );

      // Update above-input indicator
      const above = document.getElementById("typing-above-input");
      const aboveText = document.getElementById("typing-above-input-text");
      if (names.length === 0) {
        if (above) above.style.display = "none";
      } else {
        const txt = names.length === 1 ? `${names[0]} is typing...` : `${names.join("<br>")} are typing...`;
        if (aboveText) aboveText.innerHTML = txt;
        if (above) above.style.display = "flex";
      }

      // Update message-area indicator (below last message). We'll create a small element with id typing-indicator-bottom
      let bottom = document.getElementById("typing-indicator-bottom");
      if (!bottom) {
        bottom = document.createElement("div");
        bottom.id = "typing-indicator-bottom";
        bottom.className = "typing-indicator";
        const dots = document.createElement("div");
        dots.className = "typing-dots";
        dots.innerHTML = '<span></span><span></span><span></span>';
        const text = document.createElement("div");
        text.id = "typing-indicator-bottom-text";
        bottom.appendChild(dots);
        bottom.appendChild(text);
      }

      const bottomText = document.getElementById("typing-indicator-bottom-text");
      if (names.length === 0) {
        if (bottom && bottom.parentElement) bottom.parentElement.removeChild(bottom);
      } else {
        const txt = names.length === 1 ? `${names[0]} is typing...` : `${names.join(", ")} are typing...`;
        if (bottomText) bottomText.textContent = txt;
        // ensure bottom is appended to messagesDiv
        if (!messagesDiv.querySelector("#typing-indicator-bottom")) {
          messagesDiv.appendChild(bottom);
          // scroll to bottom if user was near bottom
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      }
    }
    const appendedMessages = new Set();
    let loadedMessages = [];
    let isLoadingMore = false;
    let initialLoad = true;
    let oldestLoadedTimestamp = null;
    const MESSAGES_PER_LOAD = 100;
    function logMessageOrder(messages, label) {}
    messagesDiv.addEventListener("scroll", async () => {
      if (
        messagesDiv.scrollTop <= 100 &&
        !isLoadingMore &&
        loadedMessages.length > 0
      ) {
        isLoadingMore = true;

        const oldestDisplayedMessage = messagesDiv.firstChild;
        if (
          oldestDisplayedMessage &&
          oldestDisplayedMessage.dataset.messageId
        ) {
          const oldestDisplayedId = oldestDisplayedMessage.dataset.messageId;
          const oldestDisplayedIndex = loadedMessages.findIndex(
            (msg) => msg.id === oldestDisplayedId,
          );

          if (oldestDisplayedIndex > 0) {
            const oldScrollHeight = messagesDiv.scrollHeight;
            const oldScrollTop = messagesDiv.scrollTop;

            const olderMessages = loadedMessages.slice(
              Math.max(0, oldestDisplayedIndex - MESSAGES_PER_LOAD),
              oldestDisplayedIndex,
            );

            for (let i = olderMessages.length - 1; i >= 0; i--) {
              await appendSingleMessage(olderMessages[i], true);
            }

            requestAnimationFrame(() => {
              const newScrollHeight = messagesDiv.scrollHeight;
              const heightDifference = newScrollHeight - oldScrollHeight;
              messagesDiv.scrollTop = oldScrollTop + heightDifference;
            });
          }
        }
        isLoadingMore = false;
      }
    });

    function formatDate(dateString) {
      const messageDate = new Date(dateString);
      const now = new Date();

      const messageMidnight = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate(),
      );
      const todayMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const diffTime = todayMidnight - messageMidnight;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `Today ${messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else if (diffDays === 1) {
        return `Yesterday ${messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else if (diffDays <= 10){
        return `${diffDays} days ago ${messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else {
        return `${getDate(dateString)} ${messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    }

    function getDate(myDate){
      const month = myDate.getMonth() + 1; // Get month and add 1 (September is 8, so 8 + 1 = 9)
      const day = myDate.getDate();     // Get day (16)
      const year = myDate.getFullYear(); // Get full year (2025)

      // Pad month and day with leading zeros if they are single digits
      const formattedMonth = month < 10 ? '0' + month : month;
      const formattedDay = day < 10 ? '0' + day : day;

      const formattedDate = `${formattedMonth}/${formattedDay}/${year}`;

      return formattedDate;
    }

    async function appendSingleMessage(message, prepend = false) {
      if (appendedMessages.has(message.id) || currentChat !== chatName) return;

      const messageDate = new Date(message.Date);
      const username = message.User;
      const lastReadMessage = readMessages[chatName] || "";

      const wasNearBottom =
        messagesDiv.scrollHeight -
          messagesDiv.scrollTop -
          messagesDiv.clientHeight <=
        20;

      let adjacentMessageDiv = null;
      const timeThreshold = 5 * 60 * 1000;

      if (prepend) {
        const firstMessage = messagesDiv.firstChild;
        if (
          firstMessage &&
          firstMessage.dataset.user === username &&
          Math.abs(new Date(firstMessage.dataset.date) - messageDate) <
            timeThreshold
        ) {
          adjacentMessageDiv = firstMessage;
        }
      } else {
        const lastMessage = messagesDiv.lastChild;
        if (
          lastMessage &&
          lastMessage.dataset.user === username &&
          Math.abs(new Date(lastMessage.dataset.date) - messageDate) <
            timeThreshold
        ) {
          adjacentMessageDiv = lastMessage;
        }
      }

      if (adjacentMessageDiv) {

  // Clean up previous typing listener if present
  if (currentChatTypingListener) currentChatTypingListener();
  currentChatTypingListener = onValue(typingRef, renderTypingIndicators);
        const messageContent = document.createElement("p");
        messageContent.innerHTML = message.Message;
        messageContent.style.marginTop = "5px";

        adjacentMessageDiv.dataset.lastMessageId = message.id;

        if (
          message.User !== email &&
          (!lastReadMessage || message.id > lastReadMessage)
        ) {
          adjacentMessageDiv.classList.add("unread");
        }
        const mentions = messageContent.querySelectorAll(".mention");
        mentions.forEach((mention) => {
          if (
            mention.dataset.email === email ||
            mention.dataset.email === "Everyone"
          ) {
            mention.classList.add("highlight");
          }
        });
        adjacentMessageDiv.appendChild(messageContent);
      } else {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        if (message.User === "w.n.lazypanda5050@gmail.com") {
          messageDiv.classList.add("winston");
          if (email === "w.n.lazypanda5050@gmail.com") {
            messageDiv.classList.add("sent");
          } else {
            messageDiv.classList.add("received");
            if (!lastReadMessage || message.id > lastReadMessage) {
              messageDiv.classList.add("unread");
            }
          }
        } else if (Object.values(BOT_USERS).includes(message.User)) {
          messageDiv.classList.add("bot");
          if (!lastReadMessage || message.id > lastReadMessage) {
            messageDiv.classList.add("unread");
          }
        } else if (message.User === email) {
          messageDiv.classList.add("sent");
        } else if (message.User === "[SYSTEM]") {
          messageDiv.classList.add("system");
          if (!lastReadMessage || message.id > lastReadMessage) {
            messageDiv.classList.add("unread");
          }
        } else {
          messageDiv.classList.add("received");
          if (!lastReadMessage || message.id > lastReadMessage) {
            messageDiv.classList.add("unread");
          }
        }

        messageDiv.style.marginTop = "10px";
        messageDiv.dataset.messageId = message.id;
        messageDiv.dataset.user = username;
        messageDiv.dataset.date = messageDate;
        messageDiv.dataset.lastMessageId = message.id;

        const headerInfo = document.createElement("p");
        headerInfo.className = "send-info";
        headerInfo.textContent = `${username} ${formatDate(message.Date)}`;
        messageDiv.appendChild(headerInfo);

        getUsernameFromEmail(username).then((displayName) => {
          if (displayName && displayName !== username) {
            headerInfo.textContent = `${displayName} (${username}) ${formatDate(message.Date)}`;
          }
        });

        const messageContent = document.createElement("p");
        messageContent.innerHTML = message.Message;
        messageContent.style.marginTop = "5px";

        const mentions = messageContent.querySelectorAll(".mention");
        mentions.forEach((mention) => {
          if (
            mention.dataset.email === email ||
            mention.dataset.email === "Everyone"
          ) {
            mention.classList.add("highlight");
          }
        });
        messageDiv.appendChild(messageContent);

        if (prepend) {
          messagesDiv.insertBefore(messageDiv, messagesDiv.firstChild);
        } else {
          messagesDiv.appendChild(messageDiv);
        }

        adjacentMessageDiv = messageDiv;
      }

      if (!prepend && wasNearBottom) {
        requestAnimationFrame(() => {
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
      }

      appendedMessages.add(message.id);
      return adjacentMessageDiv;
    }

    currentChatListener = onValue(messagesRef, async (snapshot) => {
      const messages = snapshot.val();
      if (messages && currentChat === chatName) {
        const sortedMessages = Object.keys(messages)
          .map((messageId) => ({
            id: messageId,
            ...messages[messageId],
          }))
          .sort((a, b) => new Date(a.Date) - new Date(b.Date));

        loadedMessages = sortedMessages;

        if (initialLoad) {
          messagesDiv.innerHTML = "";
          appendedMessages.clear();

          const recentMessages = sortedMessages.slice(-MESSAGES_PER_LOAD);

          for (const message of recentMessages) {
            await appendSingleMessage(message, false);
          }

          initialLoad = false;
          document.getElementById("messages").scrollTop = 2000000;
          setTimeout(async () => {
            await scrollToFirstUnread(chatName);
          }, 100);
        } else {
          const lastDisplayedMessage = Array.from(messagesDiv.children)
            .filter((el) => el.dataset.messageId)
            .pop();

          if (lastDisplayedMessage) {
            const lastMessageId = lastDisplayedMessage.dataset.lastMessageId;
            const lastMessageIndex = sortedMessages.findIndex(
              (msg) => msg.id === lastMessageId,
            );

            if (lastMessageIndex !== -1) {
              const newMessages = sortedMessages.slice(lastMessageIndex + 1);
              for (const message of newMessages) {
                await appendSingleMessage(message, false);
              }

              const wasNearBottom =
                messagesDiv.scrollHeight -
                  messagesDiv.scrollTop -
                  messagesDiv.clientHeight <=
                20;
              if (wasNearBottom) {
                requestAnimationFrame(() => {
                  messagesDiv.scrollTop = messagesDiv.scrollHeight;
                });
              }
            }
          }
        }
      }
    });
  }

  async function markMessagesAsRead(chatName, messageId) {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`,
    );
    if (!messageElement) return;

    const lastMessageId = messageElement.dataset.lastMessageId;
    if (!lastMessageId) return;

    const currentLastRead = readMessages[chatName] || "";
    if (currentLastRead && lastMessageId <= currentLastRead) return;

    readMessages[chatName] = lastMessageId;

    const readMessagesRef = ref(
      database,
      `Accounts/${email.replace(/\./g, "*")}/readMessages/${chatName}`,
    );
    await set(readMessagesRef, lastMessageId);

    document.querySelectorAll(".message").forEach((msg) => {
      const msgId = msg.dataset.lastMessageId;
      const msgUser = msg.dataset.user;
      if (msgId && msgId <= lastMessageId && msgUser !== email) {
        msg.classList.remove("unread");
      }
    });
    document.getElementById("bookmarklet-gui").scrollTop = 0;
    await updateUnreadCount(chatName);
  }
  function createSnakeGame() {
    const temp_email =
      typeof email !== "undefined" ? email.replace(/\./g, "*") : "anonymous";

    const gameContainer = document.createElement("div");
    gameContainer.id = "snake-game-container";
    gameContainer.style.position = "fixed";
    gameContainer.style.top = "50%";
    gameContainer.style.left = "50%";
    gameContainer.style.transform = "translate(-50%, -50%)";
    gameContainer.style.width = "90%";
    gameContainer.style.maxWidth = "800px";
    gameContainer.style.height = "90vh";
    gameContainer.style.overflow = "hidden";
    gameContainer.style.backgroundColor = "#000";
    gameContainer.style.zIndex = "1999999";
    gameContainer.style.display = "flex";
    gameContainer.style.flexDirection = "column";
    gameContainer.style.justifyContent = "center";
    gameContainer.style.alignItems = "center";
    gameContainer.style.padding = "20px";
    gameContainer.style.borderRadius = "10px";
    gameContainer.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";

    const messagesDiv = document.getElementById("messages") || document.body;
    document.body.appendChild(gameContainer);

    const scoreContainer = document.createElement("div");
    scoreContainer.style.display = "flex";
    scoreContainer.style.justifyContent = "space-between";
    scoreContainer.style.width = "100%";
    scoreContainer.style.marginBottom = "10px";
    gameContainer.appendChild(scoreContainer);

    const scoreDisplay = document.createElement("div");
    scoreDisplay.id = "snake-score";
    scoreDisplay.style.color = "white";
    scoreDisplay.style.fontSize = "24px";
    scoreDisplay.textContent = "Score: 0";
    scoreContainer.appendChild(scoreDisplay);

    const highScoreDisplay = document.createElement("div");
    highScoreDisplay.id = "snake-high-score";
    highScoreDisplay.style.color = "gold";
    highScoreDisplay.style.fontSize = "24px";
    highScoreDisplay.textContent = "High Score: 0";
    scoreContainer.appendChild(highScoreDisplay);

    const helpButton = document.createElement("button");
    helpButton.textContent = "?";
    helpButton.style.position = "absolute";
    helpButton.style.bottom = "20px";
    helpButton.style.right = "20px";
    helpButton.style.top = "auto";
    helpButton.style.width = "30px";
    helpButton.style.height = "30px";
    helpButton.style.borderRadius = "50%";
    helpButton.style.backgroundColor = "#4CAF50";
    helpButton.style.color = "white";
    helpButton.style.border = "none";
    helpButton.style.fontSize = "20px";
    helpButton.style.cursor = "pointer";
    helpButton.style.zIndex = "2000000";
    gameContainer.appendChild(helpButton);

    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 360;
    canvas.style.border = "2px solid white";
    gameContainer.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const gridSize = 10;
    const gridWidth = Math.floor(canvas.width / gridSize);
    const gridHeight = Math.floor(canvas.height / gridSize);

    let snake = [
      { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
    ];
    let direction = "right";
    let nextDirection = "right";
    let food = {};
    let score = 0;
    let highScore = 0;
    let gameSpeed = 120;
    let gameInterval;
    let gameOver = false;

    const createInstructionsOverlay = () => {
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
      overlay.style.display = "flex";
      overlay.style.flexDirection = "column";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "2000001";
      overlay.style.padding = "20px";
      overlay.style.boxSizing = "border-box";

      const title = document.createElement("h2");
      title.textContent = "Snake Game Instructions";
      title.style.color = "white";
      title.style.marginBottom = "20px";
      overlay.appendChild(title);

      const instructions = document.createElement("div");
      instructions.style.color = "white";
      instructions.style.fontSize = "18px";
      instructions.style.lineHeight = "1.6";
      instructions.style.maxWidth = "600px";
      instructions.style.textAlign = "left";
      instructions.innerHTML = `
      <p><strong>Objective:</strong> Eat as much food (red squares) as possible without colliding with walls or yourself.</p>
      <p><strong>Controls:</strong></p>
      <ul style="margin-left: 20px; padding-left: 20px;">
        <li>Arrow Keys: ↑ ↓ ← →</li>
        <li>WASD: W (up), A (left), S (down), D (right)</li>
        <li>IJKL: I (up), J (left), K (down), L (right)</li>
        <li>Touch Controls: Use the on-screen buttons</li>
      </ul>
      <p><strong>Scoring:</strong> Each food item eaten increases your score by 1 point.</p>
      <p><strong>Speed:</strong> The game gets faster as your score increases.</p>
      <p><strong>Game Over:</strong> Colliding with walls or your own tail ends the game.</p>
    `;
      overlay.appendChild(instructions);

      const closeButton = document.createElement("button");
      closeButton.textContent = "Close";
      closeButton.style.marginTop = "20px";
      closeButton.style.padding = "10px 20px";
      closeButton.style.background = "#4CAF50";
      closeButton.style.color = "white";
      closeButton.style.border = "none";
      closeButton.style.borderRadius = "5px";
      closeButton.style.cursor = "pointer";
      closeButton.addEventListener("click", () => {
        overlay.remove();
      });
      overlay.appendChild(closeButton);

      return overlay;
    };

    helpButton.addEventListener("click", () => {
      const instructionsOverlay = createInstructionsOverlay();
      gameContainer.appendChild(instructionsOverlay);
    });

    function tryLoadHighScore() {
      try {
        const storedHighScore = localStorage.getItem(
          `snakeHighScore_${temp_email}`,
        );
        if (storedHighScore) {
          highScore = parseInt(storedHighScore);
          highScoreDisplay.textContent = `High Score: ${highScore}`;
        }
      } catch (e) {
        console.warn("Could not access localStorage:", e);
      }

      try {
        if (
          typeof database !== "undefined" &&
          typeof ref !== "undefined" &&
          typeof get !== "undefined"
        ) {
          const scoreRef = ref(database, `SnakeScores/${temp_email}`);
          get(scoreRef)
            .then((snapshot) => {
              if (snapshot.exists()) {
                const firebaseScore = snapshot.val();
                if (firebaseScore > highScore) {
                  highScore = firebaseScore;
                  highScoreDisplay.textContent = `High Score: ${highScore}`;
                }
              }
            })
            .catch((error) => {
              console.error(
                "Error retrieving high score from Firebase:",
                error,
              );
            });
        }
      } catch (error) {
        console.warn("Firebase operations not available:", error);
      }
    }

    function generateFood() {
      food = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      };

      for (let cell of snake) {
        if (cell.x === food.x && cell.y === food.y) {
          return generateFood();
        }
      }
    }

    function drawCell(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
    }

    function draw() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < snake.length; i++) {
        const color = i === 0 ? "#00ff00" : "#00cc00";
        drawCell(snake[i].x, snake[i].y, color);
      }

      drawCell(food.x, food.y, "red");

      scoreDisplay.textContent = `Score: ${score}`;
      highScoreDisplay.textContent = `High Score: ${highScore}`;
    }

    function checkCollision(x, y) {
      if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
        return true;
      }

      for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) {
          return true;
        }
      }

      return false;
    }

    function moveSnake() {
      direction = nextDirection;

      const head = { x: snake[0].x, y: snake[0].y };

      switch (direction) {
        case "up":
          head.y--;
          break;
        case "down":
          head.y++;
          break;
        case "left":
          head.x--;
          break;
        case "right":
          head.x++;
          break;
      }

      if (checkCollision(head.x, head.y)) {
        endGame();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score++;
        generateFood();

        if (gameSpeed > 50) {
          gameSpeed -= 1;
          clearInterval(gameInterval);
          gameInterval = setInterval(moveSnake, gameSpeed);
        }
      } else {
        snake.pop();
      }

      draw();
    }

    function handleKeyDown(e) {
      e.preventDefault();

      switch (e.key) {
        case "ArrowUp":
          if (direction !== "down") nextDirection = "up";
          break;
        case "ArrowDown":
          if (direction !== "up") nextDirection = "down";
          break;
        case "ArrowLeft":
          if (direction !== "right") nextDirection = "left";
          break;
        case "ArrowRight":
          if (direction !== "left") nextDirection = "right";
          break;

        case "w":
        case "W":
          if (direction !== "down") nextDirection = "up";
          break;
        case "s":
        case "S":
          if (direction !== "up") nextDirection = "down";
          break;
        case "a":
        case "A":
          if (direction !== "right") nextDirection = "left";
          break;
        case "d":
        case "D":
          if (direction !== "left") nextDirection = "right";
          break;

        case "i":
        case "I":
          if (direction !== "down") nextDirection = "up";
          break;
        case "k":
        case "K":
          if (direction !== "up") nextDirection = "down";
          break;
        case "j":
        case "J":
          if (direction !== "right") nextDirection = "left";
          break;
        case "l":
        case "L":
          if (direction !== "left") nextDirection = "right";
          break;
      }
    }

    function saveHighScore() {
      if (score > highScore) {
        highScore = score;

        try {
          localStorage.setItem(
            `snakeHighScore_${temp_email}`,
            highScore.toString(),
          );
        } catch (e) {
          console.warn("Could not save to localStorage:", e);
        }

        try {
          if (
            typeof database !== "undefined" &&
            typeof ref !== "undefined" &&
            typeof set !== "undefined"
          ) {
            const scoreRef = ref(database, `SnakeScores/${temp_email}`);
            set(scoreRef, highScore).catch((error) => {
              console.error("Error saving high score to Firebase:", error);
            });
          }
        } catch (error) {
          console.warn("Firebase operations not available:", error);
        }
      }
    }

    function endGame() {
      clearInterval(gameInterval);
      gameOver = true;

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 40);

      ctx.font = "24px Arial";
      ctx.fillText(
        `Final Score: ${score}`,
        canvas.width / 2,
        canvas.height / 2,
      );

      if (score > highScore) {
        saveHighScore();
        ctx.fillStyle = "gold";
        ctx.fillText(
          "New High Score!",
          canvas.width / 2,
          canvas.height / 2 + 40,
        );
      } else {
        ctx.fillStyle = "white";
        ctx.fillText(
          `High Score: ${highScore}`,
          canvas.width / 2,
          canvas.height / 2 + 40,
        );
      }

      const closeButton = document.createElement("button");
      closeButton.textContent = "Close";
      closeButton.style.marginTop = "20px";
      closeButton.style.padding = "10px 20px";
      closeButton.style.background = "#f44336";
      closeButton.style.color = "white";
      closeButton.style.border = "none";
      closeButton.style.borderRadius = "5px";
      closeButton.style.cursor = "pointer";
      gameContainer.appendChild(closeButton);

      closeButton.addEventListener("click", () => {
        gameContainer.remove();
        document.removeEventListener("keydown", handleKeyDown);
      });
    }

    const restartButton = document.createElement("button");
    restartButton.textContent = "Restart";
    restartButton.style.marginTop = "10px";
    restartButton.style.padding = "8px 16px";
    restartButton.style.background = "#4CAF50";
    restartButton.style.color = "white";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "5px";
    restartButton.style.cursor = "pointer";
    gameContainer.appendChild(restartButton);

    restartButton.addEventListener("click", () => {
      if (gameOver) {
        const closeButton = gameContainer.querySelector("button:last-child");
        if (closeButton && closeButton !== restartButton) {
          closeButton.remove();
        }

        snake = [
          { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
        ];
        direction = "right";
        nextDirection = "right";
        score = 0;
        gameSpeed = 120;
        gameOver = false;

        clearInterval(gameInterval);
        initGame();
      }
    });

    const touchControls = document.createElement("div");
    touchControls.style.display = "grid";
    touchControls.style.gridTemplateColumns = "1fr 1fr 1fr";
    touchControls.style.gridTemplateRows = "1fr 1fr 1fr";
    touchControls.style.gap = "5px";
    touchControls.style.width = "150px";
    touchControls.style.height = "150px";
    touchControls.style.marginTop = "15px";
    gameContainer.appendChild(touchControls);

    const createTouchButton = (text, dir) => {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.style.padding = "10px";
      btn.style.backgroundColor = "#333";
      btn.style.color = "white";
      btn.style.border = "1px solid #555";
      btn.style.borderRadius = "5px";
      btn.style.cursor = "pointer";

      btn.addEventListener("click", () => {
        if (
          (dir === "up" && direction !== "down") ||
          (dir === "down" && direction !== "up") ||
          (dir === "left" && direction !== "right") ||
          (dir === "right" && direction !== "left")
        ) {
          nextDirection = dir;
        }
      });

      return btn;
    };

    touchControls.appendChild(document.createElement("div"));
    touchControls.appendChild(createTouchButton("↑", "up"));
    touchControls.appendChild(document.createElement("div"));
    touchControls.appendChild(createTouchButton("←", "left"));
    touchControls.appendChild(document.createElement("div"));
    touchControls.appendChild(createTouchButton("→", "right"));
    touchControls.appendChild(document.createElement("div"));
    touchControls.appendChild(createTouchButton("↓", "down"));
    touchControls.appendChild(document.createElement("div"));

    const controlsLegend = document.createElement("div");
    controlsLegend.style.color = "white";
    controlsLegend.style.fontSize = "14px";
    controlsLegend.style.marginTop = "10px";
    controlsLegend.style.textAlign = "center";
    controlsLegend.innerHTML = "Controls: Arrow Keys, WASD, or IJKL";
    gameContainer.appendChild(controlsLegend);

    function initGame() {
      tryLoadHighScore();
      generateFood();
      draw();
      gameInterval = setInterval(moveSnake, gameSpeed);
    }

    document.addEventListener("keydown", handleKeyDown);
    initGame();

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(gameInterval);
      gameContainer.remove();
    };
  }

  function setupGlobalFileViewer() {
    if (!window.openFileViewer) {
      window.openFileViewer = function (dataUrl, fileName, mimeType) {
        try {
          const base64 = dataUrl.split(",")[1];
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const blob = new Blob([bytes], {
            type: mimeType || "application/octet-stream",
          });

          const blobUrl = URL.createObjectURL(blob);

          const newWindow = window.open(blobUrl, "_blank");
          if (!newWindow) {
            alert("Please allow popups for this site to view files");
            return;
          }

          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        } catch (err) {
          console.error("Error opening file:", err);
          alert("Could not open the file. It may be corrupted or too large.");
        }
      };
    }

    document.addEventListener("click", function (e) {
      const target = e.target.closest(".file-attachment");
      if (target) {
        e.preventDefault();
        const fileData = decodeURIComponent(target.getAttribute("data-file"));
        const fileName = decodeURIComponent(
          target.getAttribute("data-filename") || "file",
        );
        const mimeType = decodeURIComponent(
          target.getAttribute("data-mime") || "",
        );
        window.openFileViewer(fileData, fileName, mimeType);
      }
    });

    document.addEventListener("click", function (e) {
      if (
        e.target.tagName === "IMG" &&
        e.target.src.startsWith("data:image/")
      ) {
        e.preventDefault();
        window.openFileViewer(
          e.target.src,
          "image",
          e.target.src.split(",")[0].split(":")[1].split(";")[0],
        );
      }
    });
  }
  const gSettingBtn = document.getElementById("g-setting");
  const gDropdown = document.getElementById("g-dropdown");
  const dropdownOptions = document.querySelectorAll(
    "#g-dropdown .dropdown-option",
  );

  // Load saved setting from localStorage or default to "off" if not found
  function loadSavedSetting() {
    const savedSetting = localStorage.getItem("g-setting-value") || "off";

    // Update the UI to reflect the saved setting
    dropdownOptions.forEach((option) => {
      if (option.getAttribute("data-value") === savedSetting) {
        option.classList.add("selected");
      } else {
        option.classList.remove("selected");
      }
    });

    // Optional: update the button to indicate current setting
    // updateSettingButton(savedSetting);

    console.log("Loaded setting:", savedSetting);
    return savedSetting;
  }

  // Save setting to localStorage
  function saveSetting(value) {
    localStorage.setItem("g-setting-value", value);
    console.log("Saved setting:", value);
  }

  // Optional: Update the button appearance based on selected value
  function updateSettingButton(value) {
    // You could change the button text or add a visual indicator
    // For example:
    // gSettingBtn.innerHTML = `✍️ <span class="setting-indicator">${value}</span>`;

    // Or add a class to style it differently:
    gSettingBtn.className = "setting-button";
    gSettingBtn.classList.add(`setting-${value}`);
  }

  // Toggle the dropdown when clicking the button
  gSettingBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    const isVisible = gDropdown.style.display === "block";
    gDropdown.style.display = isVisible ? "none" : "block";
  });

  // Hide dropdown when clicking elsewhere on the page
  document.addEventListener("click", function () {
    gDropdown.style.display = "none";
  });

  // Prevent dropdown from closing when clicking inside it
  gDropdown.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  // Handle option selection
  dropdownOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove selected class from all options
      dropdownOptions.forEach((opt) => opt.classList.remove("selected"));

      // Add selected class to clicked option
      this.classList.add("selected");

      // Get the selected value
      const selectedValue = this.getAttribute("data-value");

      // Save to localStorage
      saveSetting(selectedValue);

      // Optional: update the button appearance
      // updateSettingButton(selectedValue);

      // Close the dropdown
      gDropdown.style.display = "none";
    });
  });

  // Initialize the setting when the page loads
  document.addEventListener("DOMContentLoaded", function () {
    loadSavedSetting();
  });

  // Also load the setting immediately in case the script runs after DOMContentLoaded
  loadSavedSetting();
  // fetch 24 data
  const url = "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/beta/Code/24answers.json";
  // Fetch the raw JSON data from GitHub
  let twentyFour = null;
  await fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch JSON file from GitHub");
      }
      return response.json(); // Parse the response as JSON
    })
    .then(data => {
      // The fetched JSON data is now stored in the `twentyFour` variable
      console.log("Fetched data:", data);
      twentyFour = data;

      // You can now work with `twentyFour` (the data from 24answers.json)
    })
    .catch(error => {
      console.error("Error fetching the file:", error); // Handle errors
    });

  let curTwentyFour = null;

  class Shell {
    constructor(db, auth) {
      this.db = db;
      this.auth = auth;
      this.basePath = "shellFS";
      this.cwdKey = "cwd";
      this.currentPath = "/";
      this._authReady = new Promise((res) =>
        onAuthStateChanged(this.auth, (user) => res(user)),
      );
      this._cwdInitialized = false;
    }

    _isPwDir(path) {
      return path === "/__PASSWORDS__" || path.startsWith("/__PASSWORDS__/");
    }

    // --- prompt overlay (text or password) ---
    async _promptText(label, mask = false) {
      return new Promise((resolve) => {
        const style = document.createElement("style");
        style.textContent = `
          #input-overlay { position:fixed;inset:0;
            background:rgba(0,0,0,0.7);
            display:flex;align-items:center;justify-content:center;
            z-index:2147483647; }
          #input-box { background:#222;padding:20px;border-radius:8px;
            display:flex;flex-direction:column;color:#fff;
            font-family:sans-serif;width:300px; }
          #input-box label { font-size:1rem; }
          #input-box input { margin-top:8px;padding:8px;font-size:1rem;
            border:none;border-radius:4px;background:#333;color:#fff; }
          #input-box .buttons { margin-top:12px;text-align:right; }
          #input-box button { margin-left:8px;padding:6px 12px;
            font-size:1rem;border:none;border-radius:4px;cursor:pointer;}
        `;
        document.head.appendChild(style);

        const overlay = document.createElement("div");
        overlay.id = "input-overlay";
        const box = document.createElement("div");
        box.id = "input-box";
        const lbl = document.createElement("label");
        lbl.textContent = label;
        const inp = document.createElement("input");
        inp.type = mask ? "password" : "text";
        const btns = document.createElement("div");
        btns.className = "buttons";
        const cancel = document.createElement("button");
        cancel.textContent = "Cancel";
        const ok = document.createElement("button");
        ok.textContent = "OK";

        cancel.onclick = () => {
          cleanup();
          resolve(null);
        };
        ok.onclick = () => {
          cleanup();
          resolve(inp.value);
        };

        btns.append(cancel, ok);
        box.append(lbl, inp, btns);
        overlay.append(box);
        document.body.appendChild(overlay);
        inp.focus();

        function cleanup() {
          overlay.remove();
          style.remove();
        }
      });
    }

    // --- Auth & CWD ---
    async _waitForAuth() {
      const u = await this._authReady;
      if (!u) throw new Error("Must be signed in");
      return u;
    }

    async initCwd() {
      await this._waitForAuth();
      const snap = await get(ref(this.db, this.cwdKey));
      if (snap.exists() && typeof snap.val() === "string") {
        this.currentPath = snap.val();
      } else {
        this.currentPath = "/";
        await set(ref(this.db, this.cwdKey), "/");
      }
      this._cwdInitialized = true;
    }

    async _saveCwd() {
      await set(ref(this.db, this.cwdKey), this.currentPath);
    }

    // --- Path & key helpers ---
    _resolvePath(p) {
      if (p.startsWith("/")) return p === "/" ? "/" : p.replace(/\/+$/, "");
      const parts = this.currentPath.split("/").concat(p.split("/"));
      const stack = [];
      for (const part of parts) {
        if (!part || part === ".") continue;
        if (part === "..") stack.pop();
        else stack.push(part);
      }
      return "/" + stack.join("/");
    }

    _keyName(n) {
      return n.replace(/\./g, "\\period");
    }

    _nameKey(k) {
      return k.replace(/\\period/g, ".");
    }

    _emailKey(key) {
      // Converts "user*name@example*com" → "user.name@example.com"
      return key.replace(/\*/g, ".");
    }

    _keyEmail(email) {
      // Converts "user.name@example.com" → "user*name@example*com"
      return email.replace(/\./g, "*");
    }

    _nodeRef(path) {
      const parts =
        path === "/" ? [] : path.slice(1).split("/").map(this._keyName);
      return ref(this.db, [this.basePath, ...parts].join("/"));
    }

    _pwRef(path) {
      const key =
        path === "/"
          ? "root"
          : path.slice(1).split("/").map(this._keyName).join("/");
      return ref(this.db, `${this.basePath}/__PASSWORDS__/${key}`);
    }

    // --- Main exec (pipes & >) ---
    async exec(cmdLine) {
      await this._waitForAuth();
      if (!this._cwdInitialized) await this.initCwd();

      const segs = cmdLine.split("|").map((s) => s.trim());
      let input = "";

      for (let i = 0; i < segs.length; i++) {
        let s = segs[i],
          redir = null;

        // handle output redirection only on the last segment
        if (i === segs.length - 1) {
          const m = s.match(/(.*)>\s*(\S+)$/);
          if (m) {
            s = m[1].trim();
            redir = m[2];
          }
        }

        // run the segment, feeding in previous stdout
        const out = await this._run(s, input);
        input = out;

        // if redirection was requested, write to that file
        if (redir) {
          await set(this._nodeRef(this._resolvePath(redir)), input);
        }
      }

      return input;
    }

    // --- Dispatch with stdin-as-filename fallback for cat, no wget ---
    async _run(segment, stdin) {
      // split out command and args
      let [cmd, ...args] = segment.split(/\s+/);

      // commands under sudo
      const isSudo = cmd === "sudo";
      if (isSudo) {
        cmd = args.shift();
      }

      switch (cmd) {
        case "echo":
          // echo prints its args, or stdin if no args
          return args.length ? args.join(" ") : stdin;

        case "cp":
          return this._cp(args[0], args[1]);

        case "mv":
          return this._mv(args[0], args[1]);

        case "ls": {
          const showAll = args.includes("-a");
          const dirArg = args.find((a) => !a.startsWith("-")) || "";
          return this._ls(dirArg, showAll, isSudo);
        }

        case "file":
          return this._file(args[0], isSudo);

        case "mkdir":
          return this._mkdirFlagS(args, isSudo);

        case "vim":
          return this._vimFlagS(args, isSudo);

        case "cd":
          return this._cd(args[0] || "", isSudo);

        case "rm":
          return this._rm(
            args.find((a) => a !== "-r"),
            args.includes("-r"),
            isSudo,
          );

        case "cat":
          // explicit filename wins; else if stdin non-empty, treat that as filename
          if (args.length) {
            return this._cat(args[0], isSudo);
          } else if (stdin !== "") {
            return this._cat(stdin.trim(), isSudo);
          } else {
            return `cat: missing operand`;
          }

        case "ban":
          return this._ban(args[0], isSudo);

        case "unban":
          return this._unban(args[0], isSudo);

        case "listbanned":
          return this._listBanned(isSudo);

        case "help":
        case "-h":
          return this._help();

        case "pwd":
          return this.currentPath;

        default:
          return `shell: command not found: ${cmd}`;
      }
    }

    // --- Help (escaped < >) ---
    async _help() {
      return [
        "&lt;&gt; shows required argument",
        "[] shows optional argument",
        "Files with a . prefix are hidden",
        "",
        "Available commands:",
        "  ls [-a] [path]              List files & directories; -a to show hidden",
        "  file &lt;path&gt;           File or directory?",
        "  mkdir [-s] &lt;dir&gt;      Make dir; -s password-protected",
        "  cd &lt;dir&gt;              Change directory",
        "  rm [-r] &lt;path&gt;        Remove; -r recursive",
        "  cp &lt;src&gt; &lt;dst&gt;  Copy file or empty dir",
        "  mv &lt;src&gt; &lt;dst&gt;  Move / rename",
        "  cat &lt;file&gt;            Show file contents",
        "  echo &lt;text&gt;           Print text",
        "  vim [-s] &lt;file&gt;       Edit file; -s password-protected",
        "  sudo ban &lt;email&gt;      Ban email",
        "  sudo unban &lt;email&gt;    Unban email",
        "  sudo listbanned             List banned emails",
        "  help, -h                    Show this help text",
        "  pwd                         Print working directory",
        "",
        "Supports piping (|) & redirect (>) like Unix.",
      ].join("\n");
    }

    // --- mkdir with -s prefix ---
    async _mkdirFlagS(args, isSudo) {
      const needPwd = args[0] === "-s";
      const dir = needPwd ? args[1] : args[0];
      return this._mkdir(dir, needPwd, isSudo);
    }

    async _mkdir(dir, needPwd, isSudo) {
      if (!dir) return `mkdir: missing operand`;
      const path = this._resolvePath(dir);
      const parent = path.substring(0, path.lastIndexOf("/")) || "/";
      const key = this._keyName(path.split("/").pop());
      const psnap = await get(this._nodeRef(parent));
      if (!psnap.exists()) return `mkdir: parent not found: ${dir}`;
      const ex = psnap.val() || {};
      if (ex[key] !== undefined) return `mkdir: name in use: ${dir}`;

      if (needPwd && !isSudo) {
        const p1 = await this._promptText(`Set password for '${dir}':`, true);
        if (!p1) return `mkdir: cancelled`;
        const p2 = await this._promptText(`Confirm password:`, true);
        if (p1 !== p2) return `mkdir: passwords do not match`;
        await set(this._pwRef(path), p1);
      }

      await update(this._nodeRef(parent), {
        [key]: { [this._keyName(".DONOTDELETE")]: "NODELETE" },
      });
      return `Directory '${dir}' created${needPwd ? " (password‑protected)" : ""}`;
    }

    async _ls(dir = "", showAll = false, isSudo = false) {
      const path = this._resolvePath(dir);
      const snap = await get(this._nodeRef(path));
      if (!snap.exists()) return `ls: no such file or dir: ${dir}`;

      // block metadata unless sudo
      if (this._isPwDir(path) && !isSudo)
        return `ls: permission denied to access metadata`;

      if (!isSudo) {
        const pwdSnap = await get(this._pwRef(path));
        if (pwdSnap.exists()) {
          const attempt = await this._promptText(
            `Password for '${dir}':`,
            true,
          );
          if (attempt !== pwdSnap.val()) return `ls: incorrect password`;
        }
      }

      const val = snap.val();
      // single file case
      if (typeof val === "string") {
        const name = this._nameKey(dir || path.split("/").pop());
        if (!showAll && name.startsWith(".")) return `(no files)`;
        return `📄 ${name}`;
      }

      // directory case
      let keys = Object.keys(val);
      // filter out dot-files unless showAll
      if (!showAll) {
        keys = keys.filter((k) => !this._nameKey(k).startsWith("."));
      }
      if (!keys.length) return `(empty directory)`;

      // build entries
      const entries = await Promise.all(
        keys.map(async (k) => {
          const nm = this._nameKey(k);
          const cp = path === "/" ? `/${nm}` : `${path}/${nm}`;
          const cs = await get(this._nodeRef(cp));
          const isFile = cs.exists() && typeof cs.val() === "string";
          return { nm, isFile };
        }),
      );

      // sort: directories first, then files, each alphabetically
      entries.sort((a, b) => {
        if (a.isFile === b.isFile) return a.nm.localeCompare(b.nm);
        return a.isFile ? 1 : -1;
      });

      // format output
      return entries
        .map((e) => (e.isFile ? `📄 ${e.nm}` : `📁 ${e.nm}`))
        .join("\n");
    }

    // --- file with password check ---
    async _file(target, isSudo) {
      if (!target) return `file: missing operand`;
      const path = this._resolvePath(target);
      const snap = await get(this._nodeRef(path));
      if (!snap.exists()) return `file: no such file or dir: ${target}`;

      if (this._isPwDir(path) && !isSudo) {
        return `file: permission denied to access metadata`;
      }

      if (!isSudo) {
        const pwdSnap = await get(this._pwRef(path));
        if (pwdSnap.exists()) {
          const attempt = await this._promptText(
            `Password for '${target}':`,
            true,
          );
          if (attempt !== pwdSnap.val()) {
            return `file: incorrect password`;
          }
        }
      }

      return typeof snap.val() === "string"
        ? `📄 '${target}' is a file`
        : `📁 '${target}' is a directory`;
    }

    // --- cd with password check ---
    async _cd(dir, isSudo) {
      if (!dir) return `cd: missing operand`;
      const path = this._resolvePath(dir);
      const snap = await get(this._nodeRef(path));
      if (!snap.exists()) return `cd: no such file or dir: ${dir}`;
      if (typeof snap.val() === "string") return `cd: not a directory: ${dir}`;

      if (this._isPwDir(path) && !isSudo) {
        return `cd: permission denied to access metadata`;
      }

      const pwdSnap = await get(this._pwRef(path));
      if (pwdSnap.exists() && !isSudo) {
        const attempt = await this._promptText(`Password for '${dir}':`, true);
        if (attempt !== pwdSnap.val())  {
          return `cd: incorrect password`;
        }
      }

      this.currentPath = path;
      await this._saveCwd();
      return `Changed directory to '${dir}'`;
    }

    // --- cp ---
    async _cp(src, dst) {
      if (!src || !dst) return `cp: missing operand`;
      const sp = this._resolvePath(src),
        dp = this._resolvePath(dst);
      const ss = await get(this._nodeRef(sp));
      if (!ss.exists()) return `cp: no such file or dir: ${src}`;
      await set(this._nodeRef(dp), ss.val());
      return `Copied '${src}' to '${dst}'`;
    }

    // --- mv with directory detection ---
    async _mv(src, dst) {
      if (!src || !dst) return `mv: missing operand`;
      const sp = this._resolvePath(src),
        dp = this._resolvePath(dst);
      const ss = await get(this._nodeRef(sp));
      if (!ss.exists()) return `mv: no such file or dir: ${src}`;
      const ds = await get(this._nodeRef(dp));
      let final = dp;
      if (ds.exists() && typeof ds.val() === "object") {
        const bn = sp.split("/").pop();
        final = dp === "/" ? `/${bn}` : `${dp}/${bn}`;
      }
      await set(this._nodeRef(final), ss.val());
      await this._rm(src, typeof ss.val() === "object", true);
      return `Moved '${src}' to '${this._nameKey(final.split("/").pop())}'`;
    }

    // --- rm with placeholder & password ---
    async _rm(target, recursive = false, isSudo = false) {
      if (!target) return `rm: missing operand`;
      const path = this._resolvePath(target);
      const snap = await get(this._nodeRef(path));
      if (!snap.exists()) return `rm: no such file or dir: ${target}`;

      // Prevent placeholder removal
      if (path.split("/").pop() === this._keyName(".DONOTDELETE") && !isSudo) {
        return `rm: permission denied to remove placeholder`;
      }

      if (path === "/__PASSWORDS__" || path.startsWith("/__PASSWORDS__/")) {
        return `rm: permission denied to remove password metadata`;
      }

      if (path === "/") {
        return `rm: cannot remove root directory`;
      }

      if (!isSudo) {
        const pwdSnap = await get(this._pwRef(path));
        if (pwdSnap.exists()) {
          const attempt = await this._promptText(
            `Password for '${target}':`,
            true,
          );
          if (attempt !== pwdSnap.val()) {
            return `rm: incorrect password`;
          }
        }
      }

      const val = snap.val();

      if (typeof val === "object") {
        // directory case
        if (!recursive) {
          if (Object.keys(val).length) {
            return `rm: directory not empty (use -r)`;
          }
          // only remove this empty directory
          await remove(this._nodeRef(path));
        } else {
          // recursively delete each child + its pw entry
          await this._rmRecursive(path);
        }
        // after directory delete, clean up its own pw entry
      } else {
        // file case: only remove this file
        await remove(this._nodeRef(path));
      }

      // clean up password metadata for exactly this path
      const pwdRef = this._pwRef(path);
      const pwSnap = await get(pwdRef);
      if (pwSnap.exists()) {
        await remove(pwdRef);
      }

      // respond according to type
      return typeof val === "object"
        ? `Removed directory '${target}'`
        : `Removed file '${target}'`;
    }

    async _rmRecursive(path) {
      const snap = await get(this._nodeRef(path));
      if (!snap.exists()) return;
      const val = snap.val();
      if (typeof val === "object") {
        for (const k of Object.keys(val)) {
          const nm = this._nameKey(k);
          const childPath = path === "/" ? `/${nm}` : `${path}/${nm}`;
          await this._rmRecursive(childPath);
        }
      }
      // delete the node
      await remove(this._nodeRef(path));

      // --- New: also remove its password entry ---
      const pwdRef = this._pwRef(path);
      const pwCheck = await get(pwdRef);
      if (pwCheck.exists()) {
        await remove(pwdRef);
      }
    }

    // --- cat with password ---
    async _cat(file, isSudo) {
      if (!file) return `cat: missing operand`;
      const path = this._resolvePath(file);
      const snap = await get(this._nodeRef(path));
      if (!snap.exists()) return `cat: no such file: ${file}`;

      if (this._isPwDir(path) && !isSudo) {
        return `cat: permission denied to access metadata`;
      }

      if (!isSudo) {
        const pwdSnap = await get(this._pwRef(path));
        if (pwdSnap.exists()) {
          const attempt = await this._promptText(
            `Password for '${file}':`,
            true,
          );
          if (attempt !== pwdSnap.val()) {
            return `cat: incorrect password`;
          }
        }
      }

      if (typeof snap.val() === "object") {
        return `cat: is a directory: ${file}`;
      }
      return snap.val();
    }

    // --- vim with -s prefix ---
    async _vimFlagS(args, isSudo) {
      const needPwd = args[0] === "-s";
      const file = needPwd ? args[1] : args[0];
      return this._vim(file, needPwd, isSudo);
    }

    async _vim(file, needPwd, isSudo) {
      if (!file) return `vim: missing operand`;
      const path = this._resolvePath(file);
      const node = this._nodeRef(path);
      const snap = await get(node);

      if (snap.exists() && typeof snap.val() === "object")
        return `vim: cannot edit directory: ${file}`;

      if (!isSudo) {
        const pwSnap = await get(this._pwRef(path));
        if (pwSnap.exists()) {
          const attempt = await this._promptText(
            `Password for '${file}':`,
            true,
          );
          if (attempt !== pwSnap.val()) return `vim: incorrect password`;
        }
      }

      if (needPwd && !isSudo) {
        const p1 = await this._promptText(`Set password for '${file}':`, true);
        if (!p1) return `vim: cancelled`;
        const p2 = await this._promptText(`Confirm password:`, true);
        if (p1 !== p2) return `vim: passwords do not match`;
        await set(this._pwRef(path), p1);
      }

      let existing = snap.exists() ? snap.val() : "";
      await set(node, existing);

      // Editor overlay...
      const edited = await new Promise((res) => {
        const ov = document.createElement("div");
        Object.assign(ov.style, {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2147483647,
        });
        const box = document.createElement("div");
        Object.assign(box.style, {
          width: "80%",
          maxWidth: "800px",
          height: "80vh",
          background: "#111",
          padding: "20px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
        });
        const ta = document.createElement("textarea");
        ta.value = existing;
        Object.assign(ta.style, {
          flex: 1,
          background: "#222",
          color: "#eee",
          border: "none",
          padding: "10px",
          fontFamily: "monospace",
          resize: "none",
        });
        const ctr = document.createElement("div");
        Object.assign(ctr.style, { textAlign: "right", marginTop: "10px" });
        const cbtn = document.createElement("button");
        cbtn.textContent = "Cancel";
        cbtn.onclick = () => {
          ov.remove();
          res(null);
        };
        const sbtn = document.createElement("button");
        sbtn.textContent = "Save";
        sbtn.onclick = () => {
          ov.remove();
          res(ta.value);
        };
        ctr.append(cbtn, sbtn);
        box.append(ta, ctr);
        ov.append(box);
        document.body.append(ov);
      });

      if (edited === null) return `vim: editing canceled`;
      await set(node, edited);
      return `File '${file}' saved.`;
    }

    // --- ban/unban/listbanned ---
    async _ban(email, isSudo) {
      if (!isSudo) return `ban: permission denied to ban users`;
      if (!email) return `ban: missing operand`;
      const key = this._keyEmail(email);
      await update(ref(this.db, "ban"), { [key]: true });
      return `Banned '${email}'`;
    }

    async _unban(email, isSudo) {
      if (!isSudo) return `unban: permission denied to unban users`;
      if (!email) return `unban: missing operand`;
      const key = this._keyEmail(email);
      await remove(ref(this.db, `ban/${key}`));
      return `Unbanned '${email}'`;
    }

    async _listBanned(isSudo) {
      if (!isSudo) return `listbanned: permission denied to list banned users`;
      const snap = await get(ref(this.db, "ban"));
      if (!snap.exists()) return `(no banned users)`;
      return Object.keys(snap.val())
        .map((k) => this._emailKey(k))
        .join("\n");
    }
  }

  // Helper function
  async function isBanned(email, database) {
    const key = email.replace(/\./g, "*");
    const snap = await get(ref(database, `ban/${key}`));
    return snap.exists();
  }

  let shell;
  await (async () => {
    shell = await new Shell(database, auth);

    await shell.initCwd();
  })();

  function sha256(ascii) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
      0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
      0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
      0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
      0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
      0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    function rightRotate(n, x) {
      return (x >>> n) | (x << (32 - n));
    }

    let words = [];
    let asciiBitLength = ascii.length * 8;

    // Convert ASCII string to array of bytes
    for (let i = 0; i < ascii.length; i++) {
      words[i >> 2] |= ascii.charCodeAt(i) << ((3 - (i % 4)) * 8);
    }

    // Append '1' bit and pad with zeros
    words[ascii.length >> 2] |= 0x80 << ((3 - (ascii.length % 4)) * 8);
    words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

    let h0 = 0x6a09e667,
      h1 = 0xbb67ae85,
      h2 = 0x3c6ef372,
      h3 = 0xa54ff53a;
    let h4 = 0x510e527f,
      h5 = 0x9b05688c,
      h6 = 0x1f83d9ab,
      h7 = 0x5be0cd19;

    for (let i = 0; i < words.length; i += 16) {
      const w = new Array(64);
      for (let j = 0; j < 16; j++) w[j] = words[i + j] | 0;

      for (let j = 16; j < 64; j++) {
        const s0 =
          rightRotate(7, w[j - 15]) ^
          rightRotate(18, w[j - 15]) ^
          (w[j - 15] >>> 3);
        const s1 =
          rightRotate(17, w[j - 2]) ^
          rightRotate(19, w[j - 2]) ^
          (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      let a = h0,
        b = h1,
        c = h2,
        d = h3;
      let e = h4,
        f = h5,
        g = h6,
        h = h7;

      for (let j = 0; j < 64; j++) {
        const S1 = rightRotate(6, e) ^ rightRotate(11, e) ^ rightRotate(25, e);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[j] + w[j]) | 0;
        const S0 = rightRotate(2, a) ^ rightRotate(13, a) ^ rightRotate(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0;
      h5 = (h5 + f) | 0;
      h6 = (h6 + g) | 0;
      h7 = (h7 + h) | 0;
    }

    return [h0, h1, h2, h3, h4, h5, h6, h7]
      .map((x) => (x >>> 0).toString(16).padStart(8, "0"))
      .join("");
  }

  async function getEnteredPassword() {
    return new Promise((resolve) => {
      const css = `
      #pw-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        background-color: #000;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 3000001;
      }
      #pw-box {
        width: 90%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
      }
      #pw-box label {
        color: white;
        font-size: 1.1rem;
        margin-bottom: 8px;
        text-align: left;
      }
      #pw-box input {
        width: 100%;
        padding: 10px 15px;
        font-size: 1rem;
        border: 2px solid #555;
        border-radius: 8px;
        margin-bottom: 12px;
        outline: none;
        background-color: #222;
        color: #eee;
      }
      #pw-box button {
        align-self: center;
        padding: 10px 20px;
        font-size: 1rem;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 0 6px rgba(0,0,0,0.3);
      }
      `;
      const styleEl = document.createElement("style");
      styleEl.textContent = css;
      document.head.appendChild(styleEl);

      // 2. Build overlay elements
      const overlay = document.createElement("div");
      overlay.id = "pw-overlay";

      const box = document.createElement("div");
      box.id = "pw-box";

      const label = document.createElement("label");
      label.setAttribute("for", "pw-input");
      label.textContent = "Enter Sudo Password:";

      const input = document.createElement("input");
      input.type = "password";
      input.id = "pw-input";

      const button = document.createElement("button");
      button.id = "pw-submit";
      button.textContent = "Unlock";

      // Assemble
      box.appendChild(label);
      box.appendChild(input);
      box.appendChild(button);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      button.addEventListener(
        "click",
        () => {
          const entered = input.value;
          overlay.remove();
          resolve(entered);
        },
        { once: true },
      );
    });
  }

  async function sendMessage() {
    /*   if (isSending) return;
    isSending = true;
    sendButton.disabled = true; */
    removeFakeHighlights();
    const messagesRef = ref(database, `Chats/${currentChat}`);
    let message = document
      .getElementById("message-input")
      .innerHTML.substring(0, 5000);
    // Detect links only after message is sent, not while typing
    message = autoDetectLinks(message);

    let textContent = document
      .getElementById("message-input")
      .textContent.substring(0, 5000);

    if (!textContent.trim() && attachments.length === 0) {
      isSending = false;
      sendButton.disabled = false;
      return;
    }

    let pureMessage = document
      .getElementById("message-input")
      .textContent.substring(0, 2500);

    noFilesMessage = message;

    attachments.forEach((att, index) => {
      if (!att.file) return;
      if (att.type === "image") {
        message += `<br><img src="${att.file}" style="max-width:150px;max-height:150px;border-radius:5px;margin:5px 0;">`;
      } else if (att.type === "file") {
        const linkId = `attachment-link-${Date.now()}-${index}`;
        const safeName = att.name?.replace(/"/g, "&quot;") || "file";

        message += `<br><a href="javascript:void(0)" class="file-attachment" data-file="${encodeURIComponent(att.file)}" data-filename="${encodeURIComponent(safeName)}" data-mime="${encodeURIComponent(att.file.split(",")[0].split(":")[1].split(";")[0])}"
      style="text-decoration:underline;color:${isDark ? "#66b2ff" : "#007bff"};">📎 ${safeName}</a>`;
      }
    });
    // Only convert emoji shortnames if user entered emoji mode (typed ':')
    if (emojiMode) {
      message = joypixels.shortnameToImage(message);
    }
    const div = document.createElement("div");
    div.innerHTML = message;
    message = div.innerHTML;

    resetMessageInput();
    hideAllColorGrids();
    clearAttachments();
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (message) {
      // Check which option is selected in the dropdown
      const gDropdown = document.getElementById("g-dropdown");
      const selectedOption = gDropdown.querySelector(
        ".dropdown-option.selected",
      );
      const selectedValue = selectedOption
        ? selectedOption.dataset.value
        : "off";

      if (selectedValue === "on" && message.trim().charAt(0) != "/") {
        // Use the AI to process the message with grammar correction
        let d = Date.now();

        const messagesSnapshot = await get(messagesRef);
        const messages = messagesSnapshot.val() || {};
        const messageEntries = Object.entries(messages)
          .sort((a, b) => new Date(a[1].Date) - new Date(b[1].Date))
          .slice(-20);

        const API_KEYS = [
          "AIzaSyDJEIVUqeVkrbtMPnBvB8QWd9VuUQQQBjg",
          "AIzaSyB42CD-hXRnfq3eNpLWnF9at5kHePI5qgQ",
          "AIzaSyAzipn1IBvbNyQUiiJq6cAkE6hAlShce94",
          "AIzaSyC1fFINANR_tuOM18Lo3HF9WXosX-6BHLM",
          "AIzaSyAT94ASgr96OQuR9GjVxpS1pee5o5CZ6H0",
          "AIzaSyBkR_XbsH9F-eWarriJ8Vc1KqmjEWhh7-s",
          "AIzaSyCJeCvi3Br0gPVH0ccL279wSkAEjOdlnx4",
          "AlzaSyDCOP0UtMzJSnLZdr4ZgOgd-McrYwO-fF8",
        ];

        const chatHistory = messageEntries
          .map(([id, msg]) => {
            return `${msg.User}: ${msg.Message.substring(0, 500)}`;
          })
          .join("\n");

        // Different prompt for Jimmy vs. other users
        let fullPrompt;

        if (email === "jimmyh30@lakesideschool.org") {
          // Jimmy's special prompt - without the "keep unintelligible text" instruction
          fullPrompt = `Edit the message "${noFilesMessage}" to give it perfect spelling, grammar, punctuation, etc. Do not change the meaning of the message. Your response should consist of ONLY the edited message and nothing else.`;
        } else {
          // Regular prompt for all other users
          fullPrompt = `Edit the message "${noFilesMessage}" to give it perfect spelling, grammar, punctuation, etc. Do not change the meaning of the message. Your response should consist of ONLY the edited message and nothing else. If the message or part of the message is unintelligible, simply don't edit it and respond with the original message word for word - for example, if the user prompted "ijeaseh", your response should be "ijeaseh", not "(No change)", or "I'm not sure what you mean"`;
        }

        let aiReply = null;
        let successfulRequest = false;

        for (const API_KEY of API_KEYS) {
          try {
            const response = await fetch(
              "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
                API_KEY,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contents: [
                    {
                      role: "user",
                      parts: [
                        {
                          text: fullPrompt,
                        },
                      ],
                    },
                  ],
                }),
              },
            ).then((res) => res.json());

            const responseText =
              response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText && responseText.trim() !== "") {
              aiReply = responseText;
              successfulRequest = true;
              break;
            }
          } catch (error) {
            console.error(`Error with API key ${API_KEY}:`, error);
          }
        }

        if (!successfulRequest) {
          aiReply = message; // Keep original message if AI processing fails
        }

        const newMessageRef = push(messagesRef);
        await update(newMessageRef, {
          User: email,
          Message: aiReply,
          Date: Date.now(),
        });

        // Special case for jimmyh30@lakesideschool.org
        if (
          email === "jimmyh30@lakesideschool.org" &&
          aiReply.trim() !== message.trim()
        ) {
          // For Jimmy, we'll ONLY send the Jimmy-Bot correction message
          const botMessageRef = push(messagesRef);
          await update(botMessageRef, {
            User: "[Jimmy-Bot]",
            Message: `🚨🚨 I noticed a grammar mistake in your message, Jimmy! 🚨🚨 
                        <br><br>You wrote: "${message}"
                        <br><br>Correction: "${aiReply}"`,
            Date: Date.now() + 1,
          });
        }
      } else if (selectedValue === "ask" && message.trim().charAt(0) != "/") {
        // Get AI-corrected version first before creating any fake messages
        const API_KEYS = [
          "AIzaSyDJEIVUqeVkrbtMPnBvB8QWd9VuUQQQBjg",
          "AIzaSyB42CD-hXRnfq3eNpLWnF9at5kHePI5qgQ",
          "AIzaSyAzipn1IBvbNyQUiiJq6cAkE6hAlShce94",
          "AIzaSyC1fFINANR_tuOM18Lo3HF9WXosX-6BHLM",
          "AIzaSyAT94ASgr96OQuR9GjVxpS1pee5o5CZ6H0",
          "AIzaSyBkR_XbsH9F-eWarriJ8Vc1KqmjEWhh7-s",
          "AIzaSyCJeCvi3Br0gPVH0ccL279wSkAEjOdlnx4",
          "AlzaSyDCOP0UtMzJSnLZdr4ZgOgd-McrYwO-fF8",
        ];

        // Different prompt for Jimmy vs. other users
        let fullPrompt;

        if (email === "jimmyh30@lakesideschool.org") {
          // Jimmy's special prompt - without the "keep unintelligible text" instruction
          fullPrompt = `Edit the message "${noFilesMessage}" to give it perfect spelling, grammar, punctuation, etc. Do not change the meaning of the message. Your response should consist of ONLY the edited message and nothing else.`;
        } else {
          // Regular prompt for all other users
          fullPrompt = `Edit the message "${noFilesMessage}" to give it perfect spelling, grammar, punctuation, etc. Do not change the meaning of the message. Your response should consist of ONLY the edited message and nothing else. If the message or part of the message is unintelligible, simply don't edit it and respond with the original message word for word - for example, if the user prompted "ijeaseh", your response should be "ijeaseh", not "(No change)", or "I'm not sure what you mean"`;
        }

        let aiReply = null;
        let successfulRequest = false;

        for (const API_KEY of API_KEYS) {
          try {
            const response = await fetch(
              "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
                API_KEY,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contents: [
                    {
                      role: "user",
                      parts: [
                        {
                          text: fullPrompt,
                        },
                      ],
                    },
                  ],
                }),
              },
            ).then((res) => res.json());

            const responseText =
              response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText && responseText.trim() !== "") {
              aiReply = responseText;
              successfulRequest = true;
              break;
            }
          } catch (error) {
            console.error(`Error with API key ${API_KEY}:`, error);
          }
        }

        if (!successfulRequest) {
          aiReply = message; // Keep original message if AI processing fails
        }

        // Special case for jimmyh30@lakesideschool.org
        if (
          email === "jimmyh30@lakesideschool.org" &&
          aiReply.trim() !== message.trim()
        ) {
          // Only create fake messages for Jimmy if there's actually a difference
          // We don't want to send the original message first anymore
          const messagesDiv = document.getElementById("messages");

          // Create fake user message
          const fakeUserMessageDiv = document.createElement("div");
          fakeUserMessageDiv.className = "message sent fake-message";
          fakeUserMessageDiv.innerHTML = message;
          messagesDiv.appendChild(fakeUserMessageDiv);

          // Store both versions for use with buttons
          const originalMessage = message;
          const correctedMessage = aiReply;

          // Create Jimmy-Bot message with buttons
          const fakeBotMessageDiv = document.createElement("div");
          fakeBotMessageDiv.className = "message bot jimmy-bot fake-message";

          let botContent = `<div class="jimmy-bot-header">[Jimmy-Bot]</div>
                                      <div class="jimmy-bot-content">Would you like to send this improved version of your message?</div>
                                      <div class="corrected-message">${correctedMessage}</div>
                                      <div class="jimmy-bot-buttons">
                                          <button class="jimmy-yes-btn">Yes</button>
                                          <button class="jimmy-no-btn">No, send original</button>
                                      </div>`;

          fakeBotMessageDiv.innerHTML = botContent;
          messagesDiv.appendChild(fakeBotMessageDiv);

          // Scroll to the bottom to show the new messages
          messagesDiv.scrollTop = messagesDiv.scrollHeight;

          // Add event listeners for the buttons
          const yesBtn = fakeBotMessageDiv.querySelector(".jimmy-yes-btn");
          const noBtn = fakeBotMessageDiv.querySelector(".jimmy-no-btn");
          let finalMessage;

          yesBtn.addEventListener("click", async () => {
            // Remove fake messages
            document
              .querySelectorAll(".fake-message")
              .forEach((el) => el.remove());

            const newMessageRef = push(messagesRef);
            await update(newMessageRef, {
              User: email,
              Message: correctedMessage,
              Date: Date.now(),
            });

            const botMessageRef = push(messagesRef);
            await update(botMessageRef, {
              User: "[Jimmy-Bot]",
              Message: `I noticed a grammar mistake in your message, Jimmy! 
                            <br><br>You wrote: "${originalMessage}"
                            <br><br>Correction: "${correctedMessage}"`,
              Date: Date.now() + 1,
            });

            isSending = false;
            sendButton.disabled = false;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          });

          noBtn.addEventListener("click", async () => {
            // Remove fake messages
            document
              .querySelectorAll(".fake-message")
              .forEach((el) => el.remove());

            const newMessageRef = push(messagesRef);
            await update(newMessageRef, {
              User: email,
              Message: originalMessage,
              Date: Date.now(),
            });

            const botMessageRef = push(messagesRef);
            await update(botMessageRef, {
              User: "[Jimmy-Bot]",
              Message: `I noticed a grammar mistake in your message, Jimmy! 
                            <br><br>You wrote: "${originalMessage}"
                            <br><br>Correction: "${correctedMessage}"`,
              Date: Date.now() + 1,
            });

            isSending = false;
            sendButton.disabled = false;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          });

          // If the user doesn't click either button, send the original after 10 seconds
          setTimeout(async () => {
            if (document.querySelectorAll(".fake-message").length > 0) {
              // Remove fake messages
              document
                .querySelectorAll(".fake-message")
                .forEach((el) => el.remove());

              const newMessageRef = push(messagesRef);
              await update(newMessageRef, {
                User: email,
                Message: originalMessage,
                Date: Date.now(),
              });

              const botMessageRef = push(messagesRef);
              await update(botMessageRef, {
                User: "[Jimmy-Bot]",
                Message: `I noticed a grammar mistake in your message, Jimmy! 
                                <br><br>You wrote: "${originalMessage}"
                                <br><br>Correction: "${correctedMessage}"`,
                Date: Date.now() + 1,
              });

              isSending = false;
              sendButton.disabled = false;
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
          }, 10000);

          return; // Exit the function to prevent sending the message immediately
        } else {
          // If AI didn't change anything, just send the original message and exit
          if (aiReply.trim() == message.trim()) {
            const newMessageRef = push(messagesRef);
            await update(newMessageRef, {
              User: email,
              Message: message,
              Date: Date.now(),
            });

            isSending = false;
            sendButton.disabled = false;
            return;
          }

          // For non-Jimmy users, proceed with the regular message display logic
          const messagesDiv = document.getElementById("messages");

          // Create fake user message
          const fakeUserMessageDiv = document.createElement("div");
          fakeUserMessageDiv.className = "message sent fake-message";
          fakeUserMessageDiv.innerHTML = message;
          messagesDiv.appendChild(fakeUserMessageDiv);

          // Store both versions for use with buttons
          const originalMessage = message;
          const correctedMessage = aiReply;

          // Create Jimmy-Bot message with buttons
          const fakeBotMessageDiv = document.createElement("div");
          fakeBotMessageDiv.className = "message bot jimmy-bot fake-message";

          let botContent = `<div class="jimmy-bot-header">[Jimmy-Bot]</div>
                                      <div class="jimmy-bot-content">Would you like to send this improved version of your message?</div>
                                      <div class="corrected-message">${correctedMessage}</div>
                                      <div class="jimmy-bot-buttons">
                                          <button class="jimmy-yes-btn">Yes</button>
                                          <button class="jimmy-no-btn">No, send original</button>
                                      </div>`;

          fakeBotMessageDiv.innerHTML = botContent;
          messagesDiv.appendChild(fakeBotMessageDiv);

          // Scroll to the bottom to show the new messages
          messagesDiv.scrollTop = messagesDiv.scrollHeight;

          // Add event listeners for the buttons
          const yesBtn = fakeBotMessageDiv.querySelector(".jimmy-yes-btn");
          const noBtn = fakeBotMessageDiv.querySelector(".jimmy-no-btn");

          yesBtn.addEventListener("click", async () => {
            // Remove fake messages
            document
              .querySelectorAll(".fake-message")
              .forEach((el) => el.remove());

            // Send the corrected message
            const newMessageRef = push(messagesRef);
            await update(newMessageRef, {
              User: email,
              Message: correctedMessage,
              Date: Date.now(),
            });

            isSending = false;
            sendButton.disabled = false;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          });

          noBtn.addEventListener("click", async () => {
            // Remove fake messages
            document
              .querySelectorAll(".fake-message")
              .forEach((el) => el.remove());

            // Send the original message
            const newMessageRef = push(messagesRef);
            await update(newMessageRef, {
              User: email,
              Message: originalMessage,
              Date: Date.now(),
            });

            isSending = false;
            sendButton.disabled = false;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          });

          // If the user doesn't click either button, send the original after 10 seconds
          setTimeout(async () => {
            if (document.querySelectorAll(".fake-message").length > 0) {
              // Remove fake messages
              document
                .querySelectorAll(".fake-message")
                .forEach((el) => el.remove());

              // Send the original message
              const newMessageRef = push(messagesRef);
              await update(newMessageRef, {
                User: email,
                Message: originalMessage,
                Date: Date.now(),
              });

              isSending = false;
              sendButton.disabled = false;
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
          }, 10000);

          return; // Exit the function to prevent sending the message immediately
        }
      } else if (pureMessage.trim().toLowerCase().startsWith("/ai ")) {
        let d = Date.now();
        const question = message.substring(4).trim();

        const messagesSnapshot = await get(messagesRef);
        const messages = messagesSnapshot.val() || {};
        const messageEntries = Object.entries(messages)
          .sort((a, b) => new Date(a[1].Date) - new Date(b[1].Date))
          .slice(-20);

        const userMessageRef = push(messagesRef);
        await update(userMessageRef, {
          User: email,
          Message: message,
          Date: d,
        });

        const API_KEYS = [
          "AIzaSyDJEIVUqeVkrbtMPnBvB8QWd9VuUQQQBjg",
          "AIzaSyB42CD-hXRnfq3eNpLWnF9at5kHePI5qgQ",
          "AIzaSyAzipn1IBvbNyQUiiJq6cAkE6hAlShce94",
          "AIzaSyC1fFINANR_tuOM18Lo3HF9WXosX-6BHLM",
          "AIzaSyAT94ASgr96OQuR9GjVxpS1pee5o5CZ6H0",
        ];

        const chatHistory = messageEntries
          .map(([id, msg]) => {
            return `${msg.User}: ${msg.Message.substring(0, 500)}`;
          })
          .join("\n");

        const fullPrompt = `The following is a chat log for context. Messages from "[AI]" are past responses you have given, but you do not have memory of them.

        Chat Log:
        ${chatHistory}

        Here are some instructions on how to respond.
        1. User emails that end with @lakesideschool.org are in the format xxxxy##@lakesideschoool.org, where xxxx is the user’s first name, y is the first letter of the user’s last name, and ## is the last two digits of the user’s graduation year from high school. Address users by their first name.
        1a. Here are some name preferences you should be aware of: carolynj30@lakesideschool.org (Carolyn J.) prefers to go by Seek. conquerert30_@lakesideschool.org (Conquerer T.) prefers to go by Hengsheng.
        1b. Here are some personal emails you should be aware of. Overall, try to figure out from the personal email what the person’s name is: reva27308@gmail.com is Reva S, aaravd037@gmail.com is Aarav D, alisofudge@gmail.com is Alice F, jarnolds723@gmail.com is Isaac W, purelyillusive@gmail.com is Max L, thescratchercat@gmail.com is Yiyang L, and w.n.lazypanda5050@gmail.com is Winston N.
        2. Here are some restrictions that you should be aware of.
        2a. Try to stay away from sensitive topics. Tread these carefully and gently remind users about the sensitivity of these topics if a user brings them up. For example, North Korea is a sensitive topic. Be aware of stereotypes (ex. sexism, racism, ageism) and stay away from these as well.
        2b. Try your best to keep your answers fresh. Even if users may end up having similar or even exactly the same questions, keep your answers fresh and do not get stuck in a never-ending loop of the same response.
        2c. Ultimately, try to use your judgement and be careful when responding. Do not do anything that is morally wrong. Use your judgement.
        3. Some more information you should be aware of:
        3a. Everyone’s name preferences are outlined here. Try to respect these.
        3b. No users are related to any other users in a familial or romantic way.
        3c. When a user asks a question, respond to the question only. Do not refer to the chat log without user request. Do not include any response of the history in your message. When referring to the chat log upon request, any messages from "[AI]" are your previous responses.

        Now, respond to the user's question naturally:
        User: ${email} asks: ${noFilesMessage}

        Make sure to follow all the instructions while answering questions.
        `;

        let aiReply = null;
        let successfulRequest = false;

        for (const API_KEY of API_KEYS) {
          try {
            const response = await fetch(
              "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
                API_KEY,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                }),
              },
            ).then((res) => res.json());

            const responseText =
              response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText && responseText.trim() !== "") {
              aiReply = responseText;
              successfulRequest = true;
              break;
            }
          } catch (error) {
            console.error(`Error with API key ${API_KEY}:`, error);
          }
        }

        if (!successfulRequest) {
          aiReply =
            "Sorry, AI assistance is temporarily unavailable. Please try again later.";
        }

        const aiMessageRef = push(messagesRef);
        await update(aiMessageRef, {
          User: "[AI]",
          Message: aiReply,
          Date: d,
        });
      } else if (pureMessage.trim().toLowerCase().startsWith("/eod")) {
        const parts = message.split(" ");
        let yesChance = 45;
        let noChance = 45;
        let maybeChance = 10;

        if (parts.length >= 4) {
          const parsedYes = parseFloat(parts[1]);
          const parsedNo = parseFloat(parts[2]);
          const parsedMaybe = parseFloat(parts[3]);

          if (!isNaN(parsedYes) && !isNaN(parsedNo) && !isNaN(parsedMaybe)) {
            if (parsedYes + parsedNo + parsedMaybe === 100) {
              yesChance = parsedYes;
              noChance = parsedNo;
              maybeChance = parsedMaybe;
            } else {
              const total = parsedYes + parsedNo + parsedMaybe;
              if (total > 0) {
                yesChance = (parsedYes / total) * 100;
                noChance = (parsedNo / total) * 100;
                maybeChance = (parsedMaybe / total) * 100;
              }
            }
          }
        }

        const userMessageRef = push(messagesRef);
        await update(userMessageRef, {
          User: email,
          Message: message,
          Date: Date.now(),
        });

        const random = Math.random() * 100;
        let result;

        if (random < yesChance) {
          result = "Yes";
        } else if (random < yesChance + noChance) {
          result = "No";
        } else {
          result = "Maybe";
        }

        const botMessageRef = push(messagesRef);
        await update(botMessageRef, {
          User: BOT_USERS.EOD,
          Message: `${result}`,
          Date: Date.now(),
        });
      } else if (pureMessage.trim().toLowerCase().startsWith("/coinflip")) {
        const parts = message.split(" ");
        let headsChance = 50;
        let tailsChance = 50;

        if (parts.length === 3) {
          headsChance = parseFloat(parts[1]);
          tailsChance = parseFloat(parts[2]);

          if (headsChance + tailsChance !== 100) {
            const total = headsChance + tailsChance;
            if (total > 0) {
              headsChance = (headsChance / total) * 100;
              tailsChance = (tailsChance / total) * 100;
            } else {
              headsChance = 50;
              tailsChance = 50;
            }
          }
        }

        const userMessageRef = push(messagesRef);
        await update(userMessageRef, {
          User: email,
          Message: message,
          Date: Date.now(),
        });

        const random = Math.random() * 100;
        const result = random < headsChance ? "Heads" : "Tails";
        const chances = `(${headsChance.toFixed(1)}% Heads, ${tailsChance.toFixed(1)}% Tails)`;

        const botMessageRef = push(messagesRef);
        await update(botMessageRef, {
          User: BOT_USERS.RNG,
          Message: `🎲 Coin flip result: ${result}`,
          Date: Date.now(),
        });
      } else if (pureMessage.trim().toLowerCase().startsWith("/help")) {
        // Show user's /help message
        const userHelpMessageRef = push(messagesRef);
        await update(userHelpMessageRef, {
          User: email,
          Message: message,
          Date: Date.now(),
        });
        // Send help message from [HELP] bot
        const helpMessageRef = push(messagesRef);
        await update(helpMessageRef, {
          User: BOT_USERS.HELP,
          Message: `Yap Window Commands:<br>
                    <b>/help</b> — Show this help message<br>
                    <b>/ai [prompt]</b> — Ask the AI a question<br>
                    <b>/eod</b> — Magically tell you the anser to any question with yes, no, or maybe.<br>
                    <b>/coinflip</b> — Flip a coin<br>
                    <b>/snake</b> — Play Snake game<br>
                    Snake only works outside of school hours (Monday-Friday 8:15 AM - 3:20 PM Pacific Time)<br>
                    <b>/snake leaderboard</b> — Show Snake leaderboard<br>
                    <b>/24</b> — Start a 24 game<br>
                    <b>/24 skip</b> — Skip current 24 game<br>
                    <b>/24 [answer]</b> — Submit answer for 24 game<br>
                    <b>/roll [sides]</b> — Roll a die with [sides] sides<br>
                    <b>/tiggy</b> — Interact with Tiggy bot<br>
                    <b>/tiggy help</b> — Show Tiggy commands<br>
                    <b>/shell [command]</b> — Run a shell command<br>`,
          Date: Date.now(),
        });
        
      } else if (pureMessage.trim().toLowerCase().startsWith("/snake")) {
        const temp_email =
          typeof email !== "undefined"
            ? email.replace(/\./g, "*")
            : "anonymous";
        if (pureMessage.trim().toLowerCase() === "/snake leaderboard") {
          const userMessageRef = push(messagesRef);
          await update(userMessageRef, {
            User: email,
            Message: message,
            Date: Date.now(),
          });

          try {
            const scoresRef = ref(database, "SnakeScores");
            const scoresSnapshot = await get(scoresRef);
            const scores = scoresSnapshot.val() || {};

            const sortedScores = Object.entries(scores)
              .map(([userEmail, score]) => ({ email: userEmail, score: score }))
              .sort((a, b) => b.score - a.score);

            let currentUserRank = sortedScores.findIndex(
              (entry) => entry.email === temp_email,
            );
            let currentUserScore =
              currentUserRank !== -1 ? sortedScores[currentUserRank].score : 0;
            currentUserRank =
              currentUserRank !== -1 ? currentUserRank + 1 : "-";

            const pushMessage = async (text) => {
              const msgRef = push(messagesRef);
              await update(msgRef, {
                User: BOT_USERS.SNAKE,
                Message: text,
                Date: Date.now(),
              });
            };

            await pushMessage("🐍 SNAKE GAME LEADERBOARD 🐍");

            if (sortedScores.length === 0) {
              await pushMessage("No scores yet! Be the first to play!");
            } else {
              const topPlayers = sortedScores.slice(0, 10);
              for (let i = 0; i < topPlayers.length; i++) {
                let playerText = `${i + 1}. ${topPlayers[i].email.replace(/\*/g, ".")}: ${topPlayers[i].score}`;
                await pushMessage(playerText);
              }
            }
          } catch (error) {
            console.error("Error retrieving leaderboard:", error);
            const errorMessageRef = push(messagesRef);
            await update(errorMessageRef, {
              User: BOT_USERS.SNAKE,
              Message: "Error retrieving leaderboard. Please try again later.",
              Date: Date.now(),
            });
          }
        } else {
          if (dayOff === true) {
            createSnakeGame();
          } else {
            const now = new Date();
            const pacificNow = new Date(
              now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
            );
            const day = pacificNow.getDay();
            const hour = pacificNow.getHours();
            const minute = pacificNow.getMinutes();

            const schoolStart = 495;
            const schoolEnd = 920;
            const currentTime = hour * 60 + minute;

            if (
              day >= 1 &&
              day <= 5 &&
              currentTime >= schoolStart &&
              currentTime <= schoolEnd
            ) {
              const errorMessageRef = push(messagesRef);
              await update(errorMessageRef, {
                User: BOT_USERS.SNAKE,
                Message: "No Gaming During School!",
                Date: Date.now(),
              });
              if (sha256(pureMessage.trim().toLowerCase()) === "38cc7dd01e5669f28d097b78e3bf24d40c5c3b2a710b6d508aa1dd1464c84d89"){
                createSnakeGame();
                console.log("snake");
              }
            } else {
              createSnakeGame();
            }
          }
        }
      } else if (pureMessage.trim().toLowerCase() === "/24") {
        isSending = false;
        sendButton.disabled = false;
        const newMessageRef = push(messagesRef);
        await update(newMessageRef, {
          User: email,
          Message: "/24",
          Date: Date.now(),
        });

        if (curTwentyFour !== null) {
          const botMessageRef = push(messagesRef);
          await update(botMessageRef, {
            User: "[24]",
            Message: `${email}, you already have a 24 game active: ${curTwentyFour} (use '/24 skip' to skip).`,
            Date: Date.now(),
          });
        } else {
          curTwentyFour =
            Object.keys(twentyFour)[
              Math.floor(Math.random() * Object.keys(twentyFour).length)
            ];
          const botMessageRef = push(messagesRef);
          await update(botMessageRef, {
            User: "[24]",
            Message: `${email}, try to make 24 with ${curTwentyFour} (Use /24 [answer] to submit your answer. Make sure to submit your answer with no spaces and no unnecessary parentheses.)`,
            Date: Date.now(),
          });
        }
      } else if (pureMessage.trim().toLowerCase() === "/24 skip") {
        const newMessageRef = push(messagesRef);
        await update(newMessageRef, {
          User: email,
          Message: "/24 skip",
          Date: Date.now(),
        });

        if (curTwentyFour === null) {
          const botMessageRef = push(messagesRef);
          await update(botMessageRef, {
            User: "[24]",
            Message: `There is no 24 game active! Use /24 to activate a game.`,
            Date: Date.now(),
          });
        } else {
          const skipped = curTwentyFour;
          curTwentyFour = null;
          const botMessageRef = push(messagesRef);
          const correctAnswer = twentyFour[skipped]?.[0] || "N/A";
          await update(botMessageRef, {
            User: "[24]",
            Message: `${email}, the current 24 game, ${skipped}, was successfully skipped — the answer was ${correctAnswer}.`,
            Date: Date.now(),
          });
        }
      } else if (pureMessage.trim().toLowerCase().startsWith("/24 ")) {
        const newMessageRef = push(messagesRef);
        await update(newMessageRef, {
          User: email,
          Message: message,
          Date: Date.now(),
        });

        if (curTwentyFour === null) {
          const botMessageRef = push(messagesRef);
          await update(botMessageRef, {
            User: "[24]",
            Message: "There is no 24 game active! Use /24 to activate a game.",
            Date: Date.now(),
          });
        } else {
          const userAnswer = pureMessage.trim().slice(4).toLowerCase(); // remove "/24 " prefix

          const correctAnswers = twentyFour[curTwentyFour] || [];

          const botMessageRef = push(messagesRef);
          if (correctAnswers.includes(userAnswer)) {
            await update(botMessageRef, {
              User: "[24]",
              Message: "Correct!",
              Date: Date.now(),
            });
            curTwentyFour = null;
          } else {
            await update(botMessageRef, {
              User: "[24]",
              Message: `Sorry, ${email}, that's not the right answer! Make sure to type your answer with no spaces and no unnecessary parentheses. Use /24 skip if you're stuck.`,
              Date: Date.now(),
            });
          }
        }
      } else if (pureMessage.trim().toLowerCase().startsWith("/roll ")) {
        const userMessageRef = push(messagesRef);
        await update(userMessageRef, {
          User: email,
          Message: message,
          Date: Date.now(),
        });
        const sides = parseInt(message.split(" ")[1]);

        if (isNaN(sides) || sides < 1) {
          const errorMessageRef = push(messagesRef);
          await update(errorMessageRef, {
            User: BOT_USERS.RNG,
            Message: "Please specify a valid number of sides (e.g., /roll 6)",
            Date: Date.now(),
          });
          return;
        }
        let result;
        if (sides == 6) {
          let rollnumber = Math.floor(Math.random() * 3996) + 1;
          if (rollnumber > 3990) {
            result = 7;
          } else {
            result = Math.floor(rollnumber / 665) + 1;
          }
        } else {
          result = Math.floor(Math.random() * sides) + 1;
        }

        const botMessageRef = push(messagesRef);
        await update(botMessageRef, {
          User: BOT_USERS.RNG,
          Message: `🎲 Rolling a ${sides}-sided die: ${result}`,
          Date: Date.now(),
        });

        if (result == 7 && sides == 6) {
          await sleep(1000);
          const archfiend1 = push(messagesRef);
          await update(archfiend1, {
            User: BOT_USERS.ARCHFIEND,
            Message: `Wait, a 7? But dice only have 6 sides...`,
            Date: Date.now(),
          });
          await sleep(1000);
          const archfiend2 = push(messagesRef);
          await update(archfiend2, {
            User: BOT_USERS.ARCHFIEND,
            Message: `Hm...?`,
            Date: Date.now(),
          });
          await sleep(1000);
          const archfiend3 = push(messagesRef);
          await update(archfiend3, {
            User: BOT_USERS.ARCHFIEND,
            Message: `‌WOW! ${email} found Archfiend Dye!<br>An uncommonly rare 1/666 (0.1501502%) chance!<br>Talk to Yiyang's name redacted at Yiyang's house to learn more about this dye!`,
            Date: Date.now(),
          });
          const archfiend4 = push(messagesRef);
          await update(archfiend4, {
            User: BOT_USERS.ARCHFIEND,
            Message: `The Dice broke apart, revealing an Archfiend Dye hidden within!`,
            Date: Date.now(),
          });
          const image = document.createElement("img");
          image.src =
            "https://i.postimg.cc/8PmBs93W/archfiend-removebg-preview.png";
          image.style.position = "fixed";
          image.style.top = "50%";
          image.style.left = "50%";
          image.style.transform = "translate(-50%, -50%) scale(0)";
          image.style.width = "200px";
          image.style.height = "200px";
          image.style.zIndex = "2147483647";
          image.style.backgroundColor = "white";
          image.style.borderRadius = "8px";
          image.style.transition = "transform 0.5s ease, opacity 1s ease";
          image.style.opacity = "1";
          document.body.appendChild(image);
          setTimeout(() => {
            image.style.transform = "translate(-50%, -50%) scale(1)";
          }, 100);
          setTimeout(() => {
            image.style.transform =
              "translate(-50%, -50%) scale(0) rotate(360deg)";
            image.style.opacity = "0";
          }, 4000);
          setTimeout(() => {
            image.remove();
          }, 5000);
        }
      } else if (pureMessage.trim().toLowerCase().startsWith("/tiggy")) {
        const userMessageRef = push(messagesRef);
        await update(userMessageRef, {
          User: email,
          Message: message,
          Date: Date.now(),
        });
        const tiggydialoguehappy = [
          "*whine!*",
          "*whine, tiggy!*",
          "*roar*",
          "*whine?*",
          "*boop*",
        ];
        const tiggydialoguemid = [
          "*whine*",
          "*hmm...*",
          "*whine.*",
          "*squeak* [scuttles away]",
        ];
        const tiggydialogueangry = [
          "*grrr*",
          "*whineee!!!!*",
          "*hmph*",
          "*roar!*",
        ];
        const tiggydialogueeating = ["*chomp*", "*chew*", "*bite*", "*nom*"];

        function random(upto) {
          return Math.floor(Math.random() * upto);
        }
        async function tiggysay(mode) {
          if (mode == "good") {
            const tiggydialogue = push(messagesRef);
            await update(tiggydialogue, {
              User: BOT_USERS.TIGGY,
              Message: tiggydialoguehappy[random(tiggydialoguehappy.length)],
              Date: Date.now(),
            });
          } else if (mode == "mid") {
            const tiggydialogue = push(messagesRef);
            await update(tiggydialogue, {
              User: BOT_USERS.TIGGY,
              Message: tiggydialoguemid[random(tiggydialoguemid.length)],
              Date: Date.now(),
            });
          } else if (mode == "angry") {
            const tiggydialogue = push(messagesRef);
            await update(tiggydialogue, {
              User: BOT_USERS.TIGGY,
              Message: tiggydialogueangry[random(tiggydialogueangry.length)],
              Date: Date.now(),
            });
          } else if (mode == "eating") {
            const tiggydialogue = push(messagesRef);
            await update(tiggydialogue, {
              User: BOT_USERS.TIGGY,
              Message: tiggydialogueeating[random(tiggydialogueeating.length)],
              Date: Date.now(),
            });
          } else {
            const tiggydialogue = push(messagesRef);
            await update(tiggydialogue, {
              User: BOT_USERS.TIGGY,
              Message: mode,
              Date: Date.now(),
            });
          }
        }
        if (pureMessage.trim().toLowerCase() === "/tiggy help") {
          const tiggyhelp = push(messagesRef);
          await update(tiggyhelp, {
            User: BOT_USERS.TIGGYBOT,
            Message: `Welcome to your own interactive Tiggy in Yap Window! With this bot, you can interact with Tiggy however you like!`,
            Date: Date.now(),
          });
          const tiggyhelp2 = push(messagesRef);
          await update(tiggyhelp2, {
            User: BOT_USERS.TIGGYBOT,
            Message: `Tiggy is fed every day at 8am, 1pm, and 6pm. Don't mess with Tiggy when it is hungry!`,
            Date: Date.now(),
          });
          const tiggyhelp3 = push(messagesRef);
          await update(tiggyhelp3, {
            User: BOT_USERS.TIGGYBOT,
            Message: `/tiggy, /tiggy pet, /tiggy jiggle, /tiggy decapitate, /tiggy poke, /tiggy whitepowder`,
            Date: Date.now(),
          });
          isSending = false;
          sendButton.disabled = false;
          return;
        } else if (pureMessage.trim().toLowerCase() === "/tiggy pet") {
          const tiggydialogue = push(messagesRef);
          const createSquishEffect = (element) => {
            const hand = document.createElement("div");
            hand.textContent = "🫳🏼";
            hand.style.position = "fixed";
            hand.style.top = "-100px";
            hand.style.left = "50%";
            hand.style.transform = "translate(-50%, 0)";
            hand.style.fontSize = "100px";
            hand.style.transition = "top 1.5s ease";
            hand.style.zIndex = "2147483648";
            document.body.appendChild(hand);

            const createGrayParticles = () => {
              for (let i = 0; i < 15; i++) {
                const particle = document.createElement("div");
                particle.style.position = "fixed";
                particle.style.width = "10px";
                particle.style.height = "10px";
                particle.style.backgroundColor = "gray";
                particle.style.borderRadius = "50%";
                particle.style.left = `${50 + Math.random() * 10 - 5}%`;
                particle.style.top = `${50 + Math.random() * 10 - 5}%`;
                particle.style.opacity = "1";
                particle.style.zIndex = "2147483648";
                particle.style.transition = "all 1s ease";
                document.body.appendChild(particle);

                setTimeout(() => {
                  particle.style.transform = `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`;
                  particle.style.opacity = "0";
                }, 500);

                setTimeout(() => {
                  particle.remove();
                }, 1500);
              }
            };

            setTimeout(() => {
              hand.style.top = "40%"; // Stops higher, closer to the top of Tiggy
            }, 500);

            setTimeout(() => {
              element.style.transform = "translate(-50%, -50%) scale(1, 0.5)";
              createGrayParticles();
            }, 1500); // Squish effect remains synchronized with the hand motion

            setTimeout(() => {
              element.style.transform = "translate(-50%, -50%) scale(1, 1)";
              hand.remove();
            }, 3000);
          };

          const image = document.createElement("img");
          image.src =
            "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
          image.style.position = "fixed";
          image.style.top = "50%";
          image.style.left = "50%";
          image.style.transform = "translate(-50%, -50%) scale(0)";
          image.style.width = "200px";
          image.style.height = "200px";
          image.style.border = "5px solid blue";
          image.style.borderRadius = "8px";
          image.style.transition = "transform 1.5s ease, opacity 1.5s ease";
          image.style.opacity = "1";
          image.style.zIndex = "2147483647";
          document.body.appendChild(image);

          setTimeout(() => {
            image.style.transform = "translate(-50%, -50%) scale(1)";
            createSquishEffect(image);
          }, 500);

          setTimeout(() => {
            image.style.transform = "translate(-50%, -50%) scale(0)";
            image.style.opacity = "0";
          }, 7000);

          setTimeout(() => {
            image.remove();
          }, 8000);

          await update(tiggydialogue, {
            User: BOT_USERS.TIGGY,
            Message:
              tiggydialoguehappy[random(tiggydialoguehappy.length)] +
              tiggydialoguehappy[random(tiggydialoguehappy.length)],
            Date: Date.now(),
          });
        } else if (pureMessage.trim().toLowerCase() === "/tiggy decapitate") {
          const tiggydialogue = push(messagesRef);
          const createSwordEffect = (element) => {
            const sword = document.createElement("div");
            sword.textContent = "🗡️";
            sword.style.position = "fixed";
            sword.style.top = "50%";
            sword.style.left = "-200px";
            sword.style.transform = "translate(0, -50%) rotate(90deg)";
            sword.style.fontSize = "150px";
            sword.style.transition = "left 1.5s ease";
            sword.style.zIndex = "2147483648";
            document.body.appendChild(sword);

            const createRedParticles = () => {
              for (let i = 0; i < 20; i++) {
                const particle = document.createElement("div");
                particle.style.position = "fixed";
                particle.style.width = "8px";
                particle.style.height = "8px";
                particle.style.backgroundColor = "red";
                particle.style.borderRadius = "50%";
                particle.style.left = `${50 + Math.random() * 10 - 5}%`;
                particle.style.top = `${50 + Math.random() * 10 - 5}%`;
                particle.style.opacity = "1";
                particle.style.zIndex = "2147483648";
                particle.style.transition = "all 1s ease";
                document.body.appendChild(particle);

                setTimeout(() => {
                  particle.style.transform = `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`;
                  particle.style.opacity = "0";
                }, 500);

                setTimeout(() => {
                  particle.remove();
                }, 1500);
              }
            };

            setTimeout(() => {
              sword.style.left = "100%";
              createRedParticles();

              setTimeout(() => {
                element.src = "https://i.postimg.cc/L5CsDH1Z/tiggydecap.png";
                element.style.border = "5px solid red";
              }, 800); // Change image after the sword passes
            }, 500);

            setTimeout(() => {
              sword.remove();
            }, 2000);
          };

          const image = document.createElement("img");
          image.src =
            "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
          image.style.position = "fixed";
          image.style.top = "50%";
          image.style.left = "50%";
          image.style.transform = "translate(-50%, -50%) scale(0)";
          image.style.width = "200px";
          image.style.height = "200px";
          image.style.border = "5px solid red";
          image.style.borderRadius = "8px";
          image.style.transition = "transform 1.5s ease, opacity 1.5s ease";
          image.style.opacity = "1";
          image.style.zIndex = "2147483647";
          document.body.appendChild(image);

          setTimeout(() => {
            image.style.transform = "translate(-50%, -50%) scale(1)";
            createSwordEffect(image);
          }, 500);

          setTimeout(() => {
            image.style.transform = "translate(-50%, -50%) scale(0)";
            image.style.opacity = "0";
          }, 7000);

          setTimeout(() => {
            image.remove();
          }, 8000);
          tiggysay("*shing* *draws out sword*");
          await sleep(1000);
          push(messagesRef);
          tiggysay("*slices* *chop*");
          await sleep(1000);
          tiggysay("*oof* *whine...*");
          await sleep(1000);
          push(messagesRef);
          await update(tiggydialogue, {
            User: BOT_USERS.TIGGYBOT,
            Message: "Another Tiggy comes, seeing the chopped Tiggy.",
            Date: Date.now(),
          });
        } else if (pureMessage.trim().toLowerCase() === "/tiggy poke") {
          let isAnimating = false; // Prevent overlapping animations

          const createLightningBolts = (parentElement) => {
            const boltCount = 20; // Increased number of bolts
            const bolts = [];
            const radius = 120; // Distance of bolts from the center

            for (let i = 0; i < boltCount; i++) {
              const bolt = document.createElement("div");
              bolt.textContent = "⚡"; // Lightning bolt emoji
              bolt.style.position = "absolute";
              bolt.style.fontSize = `${Math.random() * 20 + 30}px`; // Random size for variety
              bolt.style.color = "yellow";
              bolt.style.zIndex = "2147483648"; // Bring bolts to the front
              const angle = (i / boltCount) * 2 * Math.PI; // Distribute bolts in a circle
              const x = Math.cos(angle) * radius + Math.random() * 40 - 20; // Add randomness
              const y = Math.sin(angle) * radius + Math.random() * 40 - 20;
              bolt.style.left = `calc(50% + ${x}px)`;
              bolt.style.top = `calc(50% + ${y}px)`;
              bolt.style.animation = `flicker ${Math.random() * 0.5 + 0.2}s infinite`;
              parentElement.appendChild(bolt);
              bolts.push(bolt);
            }

            setTimeout(() => {
              bolts.forEach((bolt) => bolt.remove());
            }, 2000); // Remove bolts after animation
          };

          const createAngryEffect = (element, duration, onEffectEnd) => {
            let scaleDirection = 1; // Pulse direction: 1 for grow, -1 for shrink
            const maxScale = 1.2;
            const minScale = 0.8;
            let currentScale = 1;

            const pulseInterval = setInterval(() => {
              currentScale += scaleDirection * 0.1;
              if (currentScale >= maxScale || currentScale <= minScale) {
                scaleDirection *= -1; // Reverse direction at bounds
              }
              element.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
            }, 100); // Smooth pulsing effect

            createLightningBolts(element); // Add lightning bolts

            setTimeout(() => {
              clearInterval(pulseInterval);
              element.style.transform = "translate(-50%, -50%) scale(1)"; // Reset scale
              onEffectEnd();
            }, duration);
          };

          const createImage = (src, position, onEffectEnd) => {
            const image = document.createElement("img");
            image.src = src;
            image.style.position = "fixed";
            image.style.top = "50%";
            image.style.left = position;
            image.style.transform = "translate(-50%, -50%) scale(0)";
            image.style.width = "200px";
            image.style.height = "200px";
            image.style.border = "5px solid red"; // Angry red border
            image.style.borderRadius = "8px";
            image.style.transition = "transform 0.5s ease, opacity 0.5s ease";
            image.style.opacity = "1";
            image.style.zIndex = "2147483647"; // Image zIndex
            document.body.appendChild(image);

            setTimeout(() => {
              image.style.transform = "translate(-50%, -50%) scale(1)";
              createAngryEffect(image, 2000, onEffectEnd); // Angry effect for 2 seconds
            }, 500);

            setTimeout(() => {
              image.style.transform = "translate(-50%, -50%) scale(0)";
              image.style.opacity = "0";
            }, 3000); // Fade-out after effect ends

            setTimeout(() => {
              image.remove();
            }, 3500);

            return image;
          };

          const startAnimation = () => {
            if (isAnimating) return; // Prevent starting a new animation if one is already running
            isAnimating = true;

            const onEffectEnd = () => {
              isAnimating = false; // Allow new animations to start after current one finishes
            };

            createImage(
              "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg",
              "50%",
              onEffectEnd,
            );
          };

          // Add keyframes for flickering effect
          const style = document.createElement("style");
          style.textContent = `
              @keyframes flicker {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
              }
          `;
          document.head.appendChild(style);

          // Start animation
          startAnimation();

          tiggysay("angry");
          await sleep(1000);
          tiggysay("[scuttles away]");
        } else if (pureMessage.trim().toLowerCase() === "/tiggy jiggle") {
          if (random(10) > 7) {
            let isAnimating = false; // Prevent overlapping animations

            const createJiggleEffect = (
              element,
              jiggleDistance,
              jiggleDuration,
              onJiggleEnd,
            ) => {
              let direction = 1; // 1 for right, -1 for left
              let position = 0;
              const jiggleSpeed = 15; // Adjust speed for smoother or faster jiggle
              const stepSize = jiggleDistance / 20; // Calculate step size based on distance

              const jiggleInterval = setInterval(() => {
                position += stepSize * direction;
                element.style.transform = `translate(-50%, -50%) translateX(${position}px)`;

                if (position >= jiggleDistance || position <= -jiggleDistance) {
                  direction *= -1; // Reverse direction at bounds
                }
              }, jiggleSpeed);

              setTimeout(() => {
                clearInterval(jiggleInterval);
                element.style.transform = "translate(-50%, -50%)"; // Reset position
                onJiggleEnd();
              }, jiggleDuration);
            };

            const createImage = (
              src,
              position,
              jiggleDistance,
              jiggleDuration,
              onJiggleEnd,
            ) => {
              const image = document.createElement("img");
              image.src = src;
              image.style.position = "fixed";
              image.style.top = "50%";
              image.style.left = position;
              image.style.transform = "translate(-50%, -50%) scale(0)";
              image.style.width = "200px";
              image.style.height = "200px";
              image.style.border = "5px solid blue";
              image.style.borderRadius = "8px";
              image.style.transition = "transform 1s ease, opacity 1s ease";
              image.style.opacity = "1";
              image.style.zIndex = "2147483647";
              document.body.appendChild(image);

              setTimeout(() => {
                image.style.transform = "translate(-50%, -50%) scale(1)";
                createJiggleEffect(
                  image,
                  jiggleDistance,
                  jiggleDuration,
                  onJiggleEnd,
                );
              }, 500);

              setTimeout(() => {
                image.style.transform = "translate(-50%, -50%) scale(0)";
                image.style.opacity = "0";
              }, jiggleDuration + 1500);

              setTimeout(() => {
                image.remove();
              }, jiggleDuration + 2000);

              return image;
            };

            const createSmallTiggy = () => {
              const smallImage = document.createElement("img");
              smallImage.src =
                "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
              smallImage.style.position = "fixed";
              smallImage.style.top = "50%";
              smallImage.style.left = "50%";
              smallImage.style.transform = "translate(-50%, -50%) scale(0)";
              smallImage.style.width = "100px";
              smallImage.style.height = "100px";
              smallImage.style.transition =
                "transform 0.5s ease, opacity 0.5s ease";
              smallImage.style.opacity = "1";
              smallImage.style.zIndex = "2147483647";
              document.body.appendChild(smallImage);

              setTimeout(() => {
                smallImage.style.transform = "translate(-50%, -50%) scale(1)";
              }, 300);

              setTimeout(() => {
                smallImage.style.transform = "translate(-50%, -50%) scale(0)";
                smallImage.style.opacity = "0";
              }, 2000);

              setTimeout(() => {
                smallImage.remove();
              }, 2500);
            };

            const startAnimation = () => {
              if (isAnimating) return; // Prevent starting a new animation if one is already running
              isAnimating = true;

              const jiggleDistance = 400; // Reduced jiggle distance
              const jiggleDuration = 2000; // Jiggle duration

              const onJiggleEnd = () => {
                createSmallTiggy();
                isAnimating = false; // Allow new animations to start after current one finishes
              };

              createImage(
                "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg",
                "45%",
                jiggleDistance,
                jiggleDuration,
                onJiggleEnd,
              );
              createImage(
                "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg",
                "55%",
                jiggleDistance,
                jiggleDuration,
                onJiggleEnd,
              );
            };

            // Start animation
            startAnimation();

            tiggysay("*jiggle*");
            await sleep(500);
            tiggysay("*wiggle*");
            await sleep(500);
            tiggysay("*sus noise*");
          } else {
            tiggysay("*jiggle*");
            await sleep(1000);
            const createJiggleEffect = (element) => {
              let direction = 1; // 1 for right, -1 for left
              let position = 0;

              const jiggleInterval = setInterval(() => {
                position += 50 * direction; // Move 50px at a time for a huge jiggle
                element.style.transform = `translate(-50%, -50%) translateX(${position}px)`;

                if (position >= 200 || position <= -200) {
                  // Jiggle bounds set to 200px
                  direction *= -1; // Reverse direction at bounds
                }
              }, 10); // Extremely fast speed for a dramatic jiggle

              setTimeout(() => {
                clearInterval(jiggleInterval);
                element.style.transform = "translate(-50%, -50%)"; // Reset position
              }, 4000); // Stop jiggle after 4 seconds
            };

            const image = document.createElement("img");
            image.src =
              "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
            image.style.position = "fixed";
            image.style.top = "50%";
            image.style.left = "50%";
            image.style.transform = "translate(-50%, -50%) scale(0)";
            image.style.width = "200px";
            image.style.height = "200px";
            image.style.border = "5px solid blue";
            image.style.borderRadius = "8px";
            image.style.transition = "transform 1.5s ease, opacity 1.5s ease";
            image.style.opacity = "1";
            image.style.zIndex = "2147483647";
            document.body.appendChild(image);

            setTimeout(() => {
              image.style.transform = "translate(-50%, -50%) scale(1)";
              createJiggleEffect(image);
            }, 500);

            setTimeout(() => {
              image.style.transform = "translate(-50%, -50%) scale(0)";
              image.style.opacity = "0";
            }, 5000);

            setTimeout(() => {
              image.remove();
            }, 6000);
          }
        } else if (pureMessage.trim().toLowerCase() === "/tiggy whitepowder") {
          const fan = document.createElement("img");
          fan.src =
            "https://upload.wikimedia.org/wikipedia/commons/1/17/Ventilatore_a_soffitto_%283%29.png";
          fan.style.position = "fixed";
          fan.style.top = "20px";
          fan.style.left = "50%";
          fan.style.transform = "translateX(-50%)";
          fan.style.width = "300px";
          fan.style.zIndex = "2147483646";
          document.body.appendChild(fan);

          const container = document.createElement("div");
          container.style.position = "fixed";
          container.style.top = "50%";
          container.style.left = "50%";
          container.style.transform = "translate(-50%, -50%) scale(1)";
          container.style.zIndex = "2147483647";
          container.style.width = "200px";
          container.style.height = "200px";
          container.style.borderRadius = "16px";
          container.style.overflow = "hidden";
          container.style.transition =
            "top 1s ease-in-out, transform 1s ease-in-out";
          document.body.appendChild(container);

          const wrapper = document.createElement("div");
          wrapper.style.position = "relative";
          wrapper.style.width = "100%";
          wrapper.style.height = "100%";
          container.appendChild(wrapper);

          const image1 = document.createElement("img");
          image1.src =
            "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
          image1.style.position = "absolute";
          image1.style.width = "100%";
          image1.style.height = "100%";
          image1.style.objectFit = "contain";
          image1.style.transition = "opacity 1s ease-in-out";
          wrapper.appendChild(image1);

          const image2 = document.createElement("img");
          image2.src = "https://i.postimg.cc/m2wv0zcM/tiggypowder.png";
          image2.style.position = "absolute";
          image2.style.width = "100%";
          image2.style.height = "100%";
          image2.style.objectFit = "contain";
          image2.style.opacity = "0";
          image2.style.transition = "opacity 1s ease-in-out";
          wrapper.appendChild(image2);

          setTimeout(() => {
            container.style.top = "100px";
          }, 1000);

          setTimeout(() => {
            image2.style.opacity = "1";

            for (let i = 0; i < 200; i++) {
              const particle = document.createElement("div");
              particle.style.position = "fixed";
              particle.style.width = `${2 + Math.random() * 4}px`;
              particle.style.height = particle.style.width;
              particle.style.borderRadius = "50%";
              particle.style.backgroundColor = "white";
              particle.style.opacity = "0";
              particle.style.pointerEvents = "none";
              particle.style.zIndex = "2147483646";

              particle.style.left = "50%";
              particle.style.top = "100px";
              particle.style.transform = "translate(-50%, -50%) scale(1)";
              particle.style.transition =
                "transform 5s ease-out, opacity 1s ease-in-out";

              document.body.appendChild(particle);

              const angle = Math.random() * 2 * Math.PI;
              const distance = Math.random() * 300 + 50;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;

              setTimeout(() => {
                particle.style.opacity = "1";
                particle.style.transform = `translate(${x}px, ${y}px) scale(${Math.random() * 0.5 + 0.5})`;
              }, 100);

              setTimeout(() => {
                particle.style.opacity = "0";
              }, 5000);

              setTimeout(() => {
                particle.remove();
              }, 6000);
            }
          }, 2000);

          setTimeout(() => {
            container.style.top = "50%";
          }, 3000);

          setTimeout(() => {
            container.style.opacity = "0";
            fan.style.opacity = "0";
          }, 7000);

          setTimeout(() => {
            container.remove();
            fan.remove();
          }, 8000);
          tiggysay("hmm?");
          await sleep(2000);
          tiggysay("angry");
          await sleep(3000);
          tiggysay("*WHINE!* Tiggy Angry! *floof*");
          await sleep(2000);
          const tiggy = push(messagesRef);
          await update(tiggy, {
            User: BOT_USERS.TIGGYBOT,
            Message:
              "Maybe it wasn't the best idea to throw Tiggy onto the ceiling fan...",
            Date: Date.now(),
          });
        } else {
          const now = new Date();
          const utcMilliseconds = now.getTime();
          const pstOffsetMilliseconds = 7 * 60 * 60 * 1000;
          const pstMillisecondsOfDay =
            (utcMilliseconds - pstOffsetMilliseconds) % (24 * 60 * 60 * 1000);

          const msAt8AM = 8 * 60 * 60 * 1000;
          const msAt8_10AM = (8 * 60 + 10) * 60 * 1000;
          const msAt10AM = 10 * 60 * 60 * 1000;
          const msAt11_30AM = (11 * 60 + 30) * 60 * 1000;
          const msAt1PM = 13 * 60 * 60 * 1000;
          const msAt1_15PM = (13 * 60 + 15) * 60 * 1000;
          const msAt3PM = 15 * 60 * 60 * 1000;
          const msAt4_30PM = (16 * 60 + 30) * 60 * 1000;
          const msAt6PM = 18 * 60 * 60 * 1000;
          const msAt6_20PM = (18 * 60 + 20) * 60 * 1000;
          const msAt8PM = 20 * 60 * 60 * 1000;
          const msAt9_30PM = (21 * 60 + 30) * 60 * 1000;

          if (
            (pstMillisecondsOfDay >= msAt8_10AM &&
              pstMillisecondsOfDay < msAt10AM) ||
            (pstMillisecondsOfDay >= msAt1_15PM &&
              pstMillisecondsOfDay < msAt3PM) ||
            (pstMillisecondsOfDay >= msAt6_20PM &&
              pstMillisecondsOfDay < msAt8PM)
          ) {
            tiggysay("good");
            const createHeart = () => {
              const heart = document.createElement("div");
              heart.textContent = "❤️";
              heart.style.position = "fixed";
              heart.style.top = "50%";
              heart.style.left = "50%";
              heart.style.fontSize = `${Math.random() * 20 + 20}px`; // Random size
              heart.style.transform = `translate(-50%, -50%) scale(0)`;
              heart.style.opacity = "1";
              heart.style.transition = "transform 2s ease, opacity 2s ease";
              heart.style.zIndex = "2147483648"; // Higher zIndex than the image
              document.body.appendChild(heart);

              const angle = Math.random() * 2 * Math.PI; // Random direction
              const distance = Math.random() * 200 + 100; // Random distance
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;

              setTimeout(() => {
                heart.style.transform = `translate(${x}px, ${y}px) scale(1)`;
                heart.style.opacity = "0";
              }, 100);

              setTimeout(() => {
                heart.remove();
              }, 2100);
            };

            const createHeartsExplosion = () => {
              for (let i = 0; i < 20; i++) {
                setTimeout(createHeart, i * 100);
              }
            };

            const image = document.createElement("img");
            image.src =
              "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
            image.style.position = "fixed";
            image.style.top = "50%";
            image.style.left = "50%";
            image.style.transform = "translate(-50%, -50%) scale(0)";
            image.style.width = "200px";
            image.style.height = "200px";
            image.style.zIndex = "2147483647";
            image.style.backgroundColor = "white";
            image.style.borderRadius = "8px";
            image.style.transition = "transform 0.5s ease, opacity 1s ease";
            image.style.opacity = "1";
            document.body.appendChild(image);

            setTimeout(() => {
              image.style.transform = "translate(-50%, -50%) scale(1)";
              createHeartsExplosion();
            }, 100);

            setTimeout(() => {
              image.style.transform =
                "translate(-50%, -50%) scale(0) rotate(360deg)";
              image.style.opacity = "0";
            }, 4000);

            setTimeout(() => {
              image.remove();
            }, 5000);
          } else if (
            (pstMillisecondsOfDay >= msAt10AM &&
              pstMillisecondsOfDay < msAt11_30AM) ||
            (pstMillisecondsOfDay >= msAt3PM &&
              pstMillisecondsOfDay < msAt4_30PM) ||
            (pstMillisecondsOfDay >= msAt8PM &&
              pstMillisecondsOfDay < msAt9_30PM)
          ) {
            tiggysay("mid");
            const createFullSpinEffect = (element) => {
              let angle = 0;
              let scale = 1;
              let growing = true;

              const spinAndZoom = () => {
                angle += 5;
                scale += growing ? 0.01 : -0.01;

                if (scale > 1.1) growing = false;
                if (scale < 0.9) growing = true;

                element.style.transform = `
                    translate(-50%, -50%) rotate(${angle}deg) scale(${scale})
                `;
              };

              const spinInterval = setInterval(spinAndZoom, 50);

              setTimeout(() => {
                clearInterval(spinInterval);
                element.style.transform =
                  "translate(-50%, -50%) scale(1) rotate(360deg)";
              }, 2000);
            };

            const image = document.createElement("img");
            image.src =
              "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
            image.style.position = "fixed";
            image.style.top = "50%";
            image.style.left = "50%";
            image.style.transform = "translate(-50%, -50%) scale(0)";
            image.style.width = "200px";
            image.style.height = "200px";
            image.style.zIndex = "2147483647";
            image.style.backgroundColor = "white";
            image.style.borderRadius = "8px";
            image.style.transition = "transform 0.5s ease, opacity 1s ease";
            image.style.opacity = "1";
            document.body.appendChild(image);

            setTimeout(() => {
              image.style.transform = "translate(-50%, -50%) scale(1)";
              createFullSpinEffect(image);
            }, 100);

            setTimeout(() => {
              image.style.transform =
                "translate(-50%, -50%) scale(0) rotate(720deg)";
              image.style.opacity = "0";
            }, 4000);

            setTimeout(() => {
              image.remove();
            }, 5000);
          } else if (
            (pstMillisecondsOfDay >= msAt8AM &&
              pstMillisecondsOfDay < msAt8_10AM) ||
            (pstMillisecondsOfDay >= msAt1PM &&
              pstMillisecondsOfDay < msAt1_15PM) ||
            (pstMillisecondsOfDay >= msAt6PM &&
              pstMillisecondsOfDay < msAt6_20PM)
          ) {
            tiggysay("good");
            const container = document.createElement("div");
            container.style.position = "fixed";
            container.style.top = "50%";
            container.style.left = "50%";
            container.style.transform =
              "translate(-50%, -50%) scale(0) rotate(0deg)";
            container.style.zIndex = "2147483647";
            container.style.padding = "20px";
            container.style.backgroundColor = "#b6fcb6";
            container.style.borderRadius = "20px";
            container.style.boxShadow = "0 0 30px 10px #8feca8";
            container.style.transition =
              "transform 1s ease-in-out, opacity 1s ease";
            container.style.opacity = "1";
            container.style.display = "flex";
            container.style.justifyContent = "center";
            container.style.alignItems = "center";
            document.body.appendChild(container);

            const image = document.createElement("img");
            image.src =
              "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
            image.style.width = "200px";
            image.style.height = "200px";
            image.style.borderRadius = "12px";
            container.appendChild(image);

            setTimeout(() => {
              container.style.transform =
                "translate(-50%, -50%) scale(1.2) rotate(360deg)";
            }, 100);

            setTimeout(() => {
              container.style.transition = "transform 2s ease-in-out";
              container.style.transform =
                "translate(-50%, -50%) scale(1) rotate(1080deg)";
            }, 1500);

            setTimeout(() => {
              container.style.transition = "transform 1s ease, opacity 1s ease";
              container.style.transform =
                "translate(-50%, -50%) scale(0) rotate(1440deg)";
              container.style.opacity = "0";
            }, 5000);

            setTimeout(() => {
              container.remove();
            }, 6000);
            const foodEmojis = [
              "🍕",
              "🍔",
              "🍟",
              "🌮",
              "🍣",
              "🍩",
              "🍪",
              "🍉",
              "🍇",
              "🍓",
              "🍦",
              "🍫",
              "🧁",
              "🥑",
              "🥞",
            ];

            for (let i = 0; i < 50; i++) {
              const emoji = document.createElement("div");
              emoji.innerText =
                foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
              emoji.style.position = "fixed";
              emoji.style.fontSize = `${24 + Math.random() * 36}px`;
              emoji.style.left = `${Math.random() * 100}%`;
              emoji.style.top = `${Math.random() * 100}%`;
              emoji.style.zIndex = "2147483646";
              emoji.style.opacity = "0";
              emoji.style.transition =
                "transform 6s ease-out, opacity 1s ease-in-out";
              emoji.style.pointerEvents = "none";
              emoji.style.animation = "pulse 2s infinite ease-in-out";

              const rotate = Math.floor(Math.random() * 1440) - 720;
              const driftX = Math.floor(Math.random() * 400) - 200;
              const driftY = Math.floor(Math.random() * 400) - 200;

              document.body.appendChild(emoji);
              setTimeout(() => {
                emoji.style.opacity = "1";
                emoji.style.transform = `translate(${driftX}px, ${driftY}px) rotate(${rotate}deg) scale(0.8)`;
              }, 300);
              setTimeout(() => {
                emoji.style.opacity = "0";
              }, 5000);
              setTimeout(() => {
                emoji.remove();
              }, 6000);
            }
            const style = document.createElement("style");
            style.innerHTML = `
                              @keyframes pulse {
                                  0%, 100% { transform: scale(1); }
                                  50% { transform: scale(1.15); }
                              }
                              `;
            document.head.appendChild(style);
            await sleep(1000);
            tiggysay("eating");
            await sleep(1000);
            tiggysay("eating");
          } else {
            tiggysay("angry");
            const createAngryHungryEffect = (element) => {
              let angle = 0;
              const boltsAndFood = [];
              const foodEmojis = [
                "🍔",
                "🍕",
                "🌭",
                "🍩",
                "🍟",
                "🍗",
                "🥪",
                "🍎",
                "🍫",
              ];

              const createEmoji = (emoji, color) => {
                const emojiElement = document.createElement("div");
                emojiElement.textContent = emoji;
                emojiElement.style.position = "fixed";
                emojiElement.style.fontSize = `${Math.random() * 20 + 30}px`;
                emojiElement.style.color = color;
                emojiElement.style.opacity = "1";
                emojiElement.style.left = `${Math.random() * 100}%`;
                emojiElement.style.top = `${Math.random() * 100}%`;
                emojiElement.style.transform = `translate(-50%, -50%) scale(1) rotate(${Math.random() * 360}deg)`;
                emojiElement.style.transition = "opacity 0.5s ease";
                emojiElement.style.zIndex = "2147483648";
                document.body.appendChild(emojiElement);

                setTimeout(() => {
                  emojiElement.style.opacity = "0";
                }, 300);

                setTimeout(() => {
                  emojiElement.remove();
                }, 800);

                boltsAndFood.push(emojiElement);
              };

              const shake = () => {
                angle = angle === 0 ? 5 : -5;
                element.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
              };

              const interval = setInterval(() => {
                shake();
                createEmoji("⚡", "yellow");
                createEmoji(
                  foodEmojis[Math.floor(Math.random() * foodEmojis.length)],
                  "white",
                );
              }, 100);

              setTimeout(() => {
                clearInterval(interval);
                element.style.transform = "translate(-50%, -50%) scale(1)";
              }, 2000);
            };

            const image = document.createElement("img");
            image.src =
              "https://beaniepedia.com/beanies/files/2019/04/tiggytigersparklyrainbow.jpg";
            image.style.position = "fixed";
            image.style.top = "50%";
            image.style.left = "50%";
            image.style.transform = "translate(-50%, -50%) scale(0)";
            image.style.width = "200px";
            image.style.height = "200px";
            image.style.zIndex = "2147483647";
            image.style.backgroundColor = "red";
            image.style.borderRadius = "8px";
            image.style.boxShadow = "0 0 20px 5px rgba(255, 0, 0, 0.7)";
            image.style.transition =
              "transform 0.5s ease, opacity 1s ease, background-color 0.2s";
            image.style.opacity = "1";
            document.body.appendChild(image);

            setTimeout(() => {
              image.style.transform = "translate(-50%, -50%) scale(1)";
              image.style.backgroundColor = "darkred";
              createAngryHungryEffect(image);
            }, 100);

            setTimeout(() => {
              image.style.transform =
                "translate(-50%, -50%) scale(0) rotate(360deg)";
              image.style.opacity = "0";
            }, 4000);

            setTimeout(() => {
              image.remove();
            }, 5000);
          }
          tiggyargumentmessage = message.split(" ");
          tiggymessagewordcount = random(tiggyargumentmessage.length - 1);
          function getRandomSet(list, numElements) {
            if (numElements > list.length) {
              return "Number of elements to choose cannot exceed list length";
            }

            const shuffled = [...list].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, numElements);
          }
          function generateRandomNumbers(min, max) {
            const randomNumbers = [];
            for (let i = 0; i < tiggymessagewordcount; i++) {
              const randomNumber =
                Math.floor(Math.random() * (max - min + 1)) + min;
              randomNumbers.push(randomNumber);
            }
            return randomNumbers;
          }
          sortedlist = generateRandomNumbers(
            1,
            tiggyargumentmessage.length - 1,
          ).sort((a, b) => a - b);
          finaltiggymessage = "";
          for (let i = 0; i < sortedlist.length; i++) {
            finaltiggymessage += tiggyargumentmessage[sortedlist[i]];
            finaltiggymessage += " ";
          }

          if (Math.random() > 0.5) {
            finaltiggymessage = `*${finaltiggymessage}?*`;
          } else {
            finaltiggymessage = `*${finaltiggymessage}*`;
          }
          const tiggymessage = push(messagesRef);
          await update(tiggymessage, {
            User: BOT_USERS.TIGGY,
            Message: finaltiggymessage,
            Date: Date.now(),
          });
        }
      } else if (pureMessage.trim().toLowerCase().startsWith("/shell")) {
        // Select the currently active channel element
        const selectedServer = document.querySelector(".server.selected");
        const serverName = selectedServer?.childNodes[0]?.textContent.trim();

        // Check if the active channel element exists
        if (serverName) {
          console.log("Current Channel Name:", serverName);
        } else {
          console.log("No active channel found.");
        }

        if (serverName !== "Shell" && serverName !== "Bot Commands") {
          const errorMessageRef = push(messagesRef);
          await update(errorMessageRef, {
            User: BOT_USERS.SHELL,
            Message:
              'Shell can only be used in "Shell" and "Bot Commands" channels!',
            Date: Date.now(),
          });
        } else {
          console.log("/shell activated");
          const command = pureMessage.trim().slice(7);
          let noCommand = false;
          let useSudo = false;
          console.log("Received pureMessage:", pureMessage);
          console.log("Received command:", command);

          const userMessageRef = push(messagesRef);
          await update(userMessageRef, {
            User: email,
            Message: message,
            Date: Date.now(),
          });

          let banned = await isBanned(email, database);
          console.log(banned);
          if (banned) {
            const bannedMessageRef = push(messagesRef);
            await update(bannedMessageRef, {
              User: BOT_USERS.SHELL,
              Message:
                "Use /shell help to display help\n\nYou have been banned. Please contact Winston for help.",
              Date: Date.now(),
            });
            noCommand = true;
          } else if (command.trim().startsWith("sudo")) {
            // sudo command
            // check password
            console.log("getting entered password");
            let enteredPassword = await getEnteredPassword();
            if (
              sha256(enteredPassword) ===
              "8bb9f1f82227148e0edb4265239fc200cbd123d1db9ba05dfb10ebaef3ea9dd7"
            ) {
              const goodMessageRef = push(messagesRef);
              await update(goodMessageRef, {
                User: BOT_USERS.SHELL,
                Message: "Correct Sudo Password",
                Date: Date.now(),
              });
              useSudo = true;
            } else {
              const badMessageRef = push(messagesRef);
              await update(badMessageRef, {
                User: BOT_USERS.SHELL,
                Message: "Incorrect Sudo Password",
                Date: Date.now(),
              });
              useSudo = false;
            }
          }

          if (command.trim().startsWith("sudo") && useSudo === false) {
            const nothingMessageRef = push(messagesRef);
            await update(nothingMessageRef, {
              User: BOT_USERS.SHELL,
              Message: "No command executed",
              Date: Date.now(),
            });
            noCommand = true;
          }

          if (!noCommand) {
            let response = await shell.exec(command);

            const responseMessageRef = push(messagesRef);
            await update(responseMessageRef, {
              User: BOT_USERS.SHELL,
              Message: `Use /shell help to display help\n\n${response}`,
              Date: Date.now(),
            });
          }
        }
      } else {
        const newMessageRef = push(messagesRef);
        await update(newMessageRef, {
          User: email,
          Message: message,
          Date: Date.now(),
        });
      }

      const snapshot = await get(messagesRef);
      const messages = snapshot.val() || {};

      const allMessageIds = Object.keys(messages).sort();
      if (allMessageIds.length > 0) {
        const latestMessageId = allMessageIds[allMessageIds.length - 1];
        await markMessagesAsRead(currentChat, latestMessageId);
      }
    }
    document.getElementById("bookmarklet-gui").scrollTop = 0;
    isSending = false;
    sendButton.disabled = false;
  // exit emoji mode after sending
  exitEmojiMode();
  }

  document.getElementById("messages").addEventListener("click", async (e) => {
    const messageElement = e.target.closest(".message");
    if (messageElement) {
      const messageId = messageElement.dataset.messageId;
      if (messageId) {
        await markMessagesAsRead(currentChat, messageId);
      }
    }
  });

  const sendButton = document.getElementById("send-button");
  sendButton.addEventListener("click", async (e) => {
    try { await sendTypingStop(); } catch (er) {}
    sendMessage();
  });

  const messageInput = document.getElementById("message-input");

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // Typing indicator hooks
  messageInput.addEventListener("input", (e) => {
    // Start typing presence
    try { sendTypingStart(); } catch (er) {}
    scheduleTypingStop();
  });

  messageInput.addEventListener("keydown", (e) => {
    // Update typing timestamp on keydown as well
    try { sendTypingStart(); } catch (er) {}
    scheduleTypingStop();
  });

  messageInput.addEventListener("blur", (e) => {
    try { sendTypingStop(); } catch (er) {}
  });

  document
    .getElementById("message-input")
    .addEventListener("input", function (e) {
      if (
          e.inputType === "insertFromPaste" ||
          (e.inputType === "insertText" && (e.data === " " || e.data === "\n"))
        ) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        const messageInput = document.getElementById("message-input");
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(messageInput);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const caretPosition = preCaretRange.toString().length;

        // Do not process links while typing to avoid stutters.
        // If user pasted content, we still convert emoji shortnames only if user is in emoji mode.
        if (emojiMode) {
          processEmojisInInput();
        }
      }
    });

  function setCursorPositionInContentEditable(element, position) {
    const textNodeMapping = [];
    let totalLength = 0;

    function mapTextNodes(node) {
      if (node.nodeType === 3) {
        const length = node.nodeValue.length;
        textNodeMapping.push({
          node: node,
          start: totalLength,
          end: totalLength + length,
        });
        totalLength += length;
      } else if (node.nodeType === 1) {
        for (let i = 0; i < node.childNodes.length; i++) {
          mapTextNodes(node.childNodes[i]);
        }
      }
    }

    mapTextNodes(element);

    let targetNode = null;
    let targetOffset = 0;

    for (let i = 0; i < textNodeMapping.length; i++) {
      const item = textNodeMapping[i];
      if (position >= item.start && position <= item.end) {
        targetNode = item.node;
        targetOffset = position - item.start;
        break;
      }
    }

    if (!targetNode) {
      const lastMapping = textNodeMapping[textNodeMapping.length - 1];
      if (lastMapping) {
        targetNode = lastMapping.node;
        targetOffset = lastMapping.node.length;
      } else {
        targetNode = document.createTextNode("");
        element.appendChild(targetNode);
        targetOffset = 0;
      }
    }

    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus();
  }
  // NOTE: live link conversion while typing was removed to avoid typing stutters.
  // Links are detected/converted only at send time via `autoDetectLinks()` in sendMessage().

  // Emoji mode: only check/convert shortnames to images after the user types ':'
  let emojiMode = false;
  let emojiModeTimeout = null;

  function enterEmojiMode() {
    emojiMode = true;
    if (emojiModeTimeout) clearTimeout(emojiModeTimeout);
    emojiModeTimeout = setTimeout(() => {
      emojiMode = false;
      emojiModeTimeout = null;
    }, 5000); // automatically exit after 5s of inactivity
  }

  function exitEmojiMode() {
    emojiMode = false;
    if (emojiModeTimeout) {
      clearTimeout(emojiModeTimeout);
      emojiModeTimeout = null;
    }
  }

  function processEmojisInInput() {
    const messageInput = document.getElementById("message-input");
    const caretPosition = getCaretCharacterOffsetWithin(messageInput);

    let message = messageInput.innerHTML.substring(0, 2500);
    const converted = joypixels.shortnameToImage(message);

    if (converted !== message) {
      messageInput.innerHTML = converted;
      setTimeout(() => {
        setCursorPositionInContentEditable(messageInput, caretPosition);
      }, 0);
    }
  }
  function isValidUrl(text) {
    const urlPattern =
      /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/\S*)?$/i;
    return urlPattern.test(text);
  }

  function createLinkMarkup(url) {
    let href = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      href = "https://" + url;
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  }

  // previously we converted links on DOMContentLoaded; keep links only processed at send time
  let savedSelection = null;

  function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      savedSelection = sel.getRangeAt(0).cloneRange();
    }
  }

  function applyFakeHighlight() {
    if (!savedSelection) return;
    const highlightSpan = document.createElement("span");
    highlightSpan.className = "selection-highlight";
    savedSelection.surroundContents(highlightSpan);
  }

  function removeFakeHighlights() {
    document.querySelectorAll(".selection-highlight").forEach((span) => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
  }

  function restoreSelection() {
    if (savedSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection);
    }
  }

  let mentionSuggestions = document.createElement("div");
  mentionSuggestions.id = "mention-suggestions";
  mentionSuggestions.className = "mention-suggestions";
  document.body.appendChild(mentionSuggestions);
  mentionSuggestions.style.display = "none";

  let activeMention = null;
  let currentMatches = [];
  let mentionIndex = 0;
  let lastInsertedMention = null;
  let isTabbing = false;
  let isNavigating = false;

  messageInput.addEventListener("input", async function (e) {
    // If user typed a ':' enable emojiMode so subsequent shortname sequences are converted.
    // This keeps emoji processing off unless the user explicitly starts an emoji.
    if (e.inputType === "insertText" && e.data === ":") {
      enterEmojiMode();
      // run a quick emoji conversion
      processEmojisInInput();
    }
    if (isNavigating) {
      isNavigating = false;
      return;
    }

    const text = messageInput.innerText;
    const cursorPos = getCaretCharacterOffsetWithin(messageInput);
    const beforeCursor = text.substring(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@([\w\.\-]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();

      const accountSnapshot = await get(ref(database, `Accounts`));
      const matches = [];

      accountSnapshot.forEach((child) => {
        const email = child.key.replace(/\*/g, ".");
        const username = child.val().Username;
        if (
          email.toLowerCase().includes(query) ||
          (username && username.toLowerCase().includes(query))
        ) {
          matches.push({ email, username: username || email });
        }
      });

      const items = [
        "[AI]",
        "[RNG]",
        "[EOD]",
        "[HELP]",
        "[Snake Game]",
        "[24]",
        "[Prime Bot]",
        "[Archfiend Dice]",
        "[Tiggy]",
        "[Tiggy Bot]",
        "[Twelve Angry Men]",
        "[Foreman]",
        "[Juror 1]",
        "[Juror 2]",
        "[Juror 3]",
        "[Juror 4]",
        "[Juror 5]",
        "[Juror 6]",
        "[Juror 7]",
        "[Juror 8]",
        "[Juror 9]",
        "[Juror 10]",
        "[Juror 11]",
        "[Juror 12]",
        "[Love Bot]",
        "[Clicker Game]",
        "[Jimmy Bot]",
        "[Shell]",
        "[SYSTEM]",
        "Everyone",
      ];
      const usernames = [
        "AI",
        "RNG",
        "EOD",
        "HELP",
        "Snake Game",
        "24",
        "Prime Bot",
        "Archfiend Dice",
        "Tiggy",
        "Tiggy Bot",
        "Twelve Angry Men",
        "Foreman",
        "Juror 1",
        "Juror 2",
        "Juror 3",
        "Juror 4",
        "Juror 5",
        "Juror 6",
        "Juror 7",
        "Juror 8",
        "Juror 9",
        "Juror 10",
        "Juror 11",
        "Juror 12",
        "Love Bot",
        "Clicker Game",
        "Jimmy Bot",
        "Shell",
        "SYSTEM",
        "Everyone",
      ];

      items.forEach((item, index) => {
        const username = usernames[index];
        if (
          item.toLowerCase().includes(query) ||
          username.toLowerCase().includes(query)
        ) {
          matches.push({ email: item, username });
        }
      });

      if (matches.length) {
        mentionIndex = 0;
        updateMentionDropdown(matches.slice(0, 5));
        positionMentionBox();
        activeMention = mentionMatch[0];
        currentMatches = matches.slice(0, 5);
      } else {
        hideSuggestions();
      }
    } else {
      hideSuggestions();
    }
  });

  function updateMentionDropdown(matches) {
    mentionSuggestions.innerHTML = "";

    matches.forEach((match, idx) => {
      const div = document.createElement("div");
      div.textContent = match.email;

      if (idx === mentionIndex) {
        div.className = "selected";
      }

      div.addEventListener("mousedown", (e) => {
        e.preventDefault();
        insertMention(match.email, match.username);
        hideSuggestions();
      });

      mentionSuggestions.appendChild(div);
    });

    mentionSuggestions.style.display = "block";
  }

  function positionMentionBox() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    mentionSuggestions.style.position = "absolute";
    mentionSuggestions.style.left = `${rect.left}px`;
    mentionSuggestions.style.top = `${rect.top - mentionSuggestions.offsetHeight - 5}px`;
    mentionSuggestions.style.display = "block";
  }

  messageInput.addEventListener("keydown", async function (e) {
    if (
      (e.key === "ArrowUp" || e.key === "ArrowDown") &&
      mentionSuggestions.style.display === "block"
    ) {
      e.preventDefault();
      isNavigating = true;

      if (e.key === "ArrowUp") {
        mentionIndex =
          (mentionIndex - 1 + currentMatches.length) % currentMatches.length;
      } else {
        mentionIndex = (mentionIndex + 1) % currentMatches.length;
      }

      updateMentionDropdown(currentMatches);

      setTimeout(() => {
        isNavigating = false;
      }, 10);

      return;
    }

    if (e.key === "Tab" && mentionSuggestions.style.display === "block") {
      e.preventDefault();

      try {
        if (currentMatches.length > 0) {
          const match = currentMatches[mentionIndex];

          insertMention(match.email, match.username);

          updateMentionDropdown(currentMatches);
          positionMentionBox();
        }
      } catch (error) {
        console.error("Error during tab cycling:", error);
        isTabbing = false;
      }

      return;
    }

    if (e.key === " " && mentionSuggestions.style.display === "block") {
      e.preventDefault();

      if (lastInsertedMention && lastInsertedMention.parentNode) {
        const space = document.createTextNode(" ");
        lastInsertedMention.parentNode.insertBefore(
          space,
          lastInsertedMention.nextSibling,
        );

        const selection = window.getSelection();
        const range = document.createRange();
        range.setStartAfter(space);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      hideSuggestions();
      return;
    }

    if (e.key === "Escape" && mentionSuggestions.style.display === "block") {
      e.preventDefault();

      if (lastInsertedMention && lastInsertedMention.parentNode) {
        lastInsertedMention.remove();
      }

      hideSuggestions();
      return;
    }
  });

  function insertMention(email, username) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    const range = selection.getRangeAt(0);

    const tempRange = range.cloneRange();
    tempRange.setStart(messageInput, 0);
    const textBeforeCursor = tempRange.toString();

    const mentionMatch = textBeforeCursor.match(/@[\w\.\-]*$/);

    function insertMentionSpan() {
      const mentionSpan = document.createElement("span");
      mentionSpan.className = "mention";
      mentionSpan.setAttribute("data-email", email);
      mentionSpan.setAttribute("contenteditable", "false");
      mentionSpan.textContent = "@" + username;

      range.insertNode(mentionSpan);

      const spaceNode = document.createTextNode("\u00A0");
      mentionSpan.parentNode.insertBefore(spaceNode, mentionSpan.nextSibling);

      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      return mentionSpan;
    }

    if (mentionMatch) {
      const matchLength = mentionMatch[0].length;

      range.setStart(range.endContainer, range.endOffset - matchLength);
      range.deleteContents();

      return insertMentionSpan();
    } else if (lastInsertedMention && lastInsertedMention.parentNode) {
      const parent = lastInsertedMention.parentNode;
      const mentionSpan = document.createElement("span");
      mentionSpan.className = "mention";
      mentionSpan.setAttribute("data-email", email);
      mentionSpan.setAttribute("contenteditable", "false");
      mentionSpan.textContent = "@" + username;

      parent.replaceChild(mentionSpan, lastInsertedMention);

      const spaceNode = document.createTextNode("\u00A0");
      mentionSpan.parentNode.insertBefore(spaceNode, mentionSpan.nextSibling);

      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      hideSuggestions();

      return mentionSpan;
    }

    return null;
  }

  function hideSuggestions() {
    if (isTabbing || isNavigating) return;

    mentionSuggestions.style.display = "none";
    activeMention = null;
    currentMatches = [];
    mentionIndex = 0;
    lastInsertedMention = null;
  }

  function getCaretCharacterOffsetWithin(element) {
    let caretOffset = 0;
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  }

  document
    .getElementById("message-input")
    .addEventListener("keydown", function (e) {
    // exit emoji mode on Escape or Enter
    if (e.key === "Escape" || e.key === "Enter") {
      exitEmojiMode();
    }
      if (e.key === "Backspace") {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (offset === 0) {
          let previous = node.previousSibling;
          if (
            previous &&
            previous.classList &&
            previous.classList.contains("mention")
          ) {
            e.preventDefault();
            previous.remove();
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const textUpToCaret = node.textContent.slice(0, offset);

          if (textUpToCaret.endsWith(" ") && node.previousSibling) {
            const previous = node.previousSibling;
            if (previous.classList && previous.classList.contains("mention")) {
              e.preventDefault();

              node.textContent =
                textUpToCaret.slice(0, -1) + node.textContent.slice(offset);

              const newRange = document.createRange();
              newRange.setStart(node, offset - 1);
              newRange.setEnd(node, offset - 1);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }
      }
    });

  messageInput.addEventListener("blur", () => {
    applyFakeHighlight();
  });

  messageInput.addEventListener("focus", () => {
    removeFakeHighlights();
    restoreSelection();
  });

  const colors = [
    "#ffffff",
    "#f5f5f5",
    "#eeeeee",
    "#cccccc",
    "#999999",
    "#666666",
    "#333333",
    "#000000",

    "#ffebee",
    "#ffcdd2",
    "#ef9a9a",
    "#e57373",
    "#ef5350",
    "#f44336",
    "#d32f2f",
    "#b71c1c",

    "#fff3e0",
    "#ffe0b2",
    "#ffcc80",
    "#ffb74d",
    "#ffa726",
    "#ff9800",
    "#fb8c00",
    "#ef6c00",

    "#fffde7",
    "#fff9c4",
    "#fff59d",
    "#fff176",
    "#ffee58",
    "#ffeb3b",
    "#fdd835",
    "#fbc02d",

    "#e8f5e9",
    "#c8e6c9",
    "#a5d6a7",
    "#81c784",
    "#66bb6a",
    "#4caf50",
    "#43a047",
    "#388e3c",

    "#e0f7fa",
    "#b2ebf2",
    "#80deea",
    "#4dd0e1",
    "#26c6da",
    "#00bcd4",
    "#00acc1",
    "#0097a7",

    "#e3f2fd",
    "#bbdefb",
    "#90caf9",
    "#64b5f6",
    "#42a5f5",
    "#2196f3",
    "#1e88e5",
    "#1976d2",

    "#f3e5f5",
    "#e1bee7",
    "#ce93d8",
    "#ba68c8",
    "#ab47bc",
    "#9c27b0",
    "#8e24aa",
    "#7b1fa2",

    "#fce4ec",
    "#f8bbd0",
    "#f48fb1",
    "#f06292",
    "#ec407a",
    "#e91e63",
    "#d81b60",
    "#c2185b",
  ];

  function createColorGrid(gridId, execCommandType) {
    const grid = document.getElementById(gridId);
    colors.forEach((color) => {
      const box = document.createElement("div");
      box.style.backgroundColor = color;
      box.onclick = (e) => {
        e.stopPropagation();
        restoreSelection();
        document.execCommand(execCommandType, false, color);
        hideAllColorGrids();
      };
      grid.appendChild(box);
    });
  }

  createColorGrid("text-color-grid", "foreColor");
  createColorGrid("highlight-color-grid", "hiliteColor");

  function hideAllColorGrids() {
    document
      .querySelectorAll(".color-grid")
      .forEach((g) => (g.style.display = "none"));
  }
  hideAllColorGrids();

  document.getElementById("text-color-picker").onclick = (e) => {
    e.stopPropagation();
    toggleColorGrid("text-color-grid");
  };
  document.getElementById("highlight-color-picker").onclick = (e) => {
    e.stopPropagation();
    toggleColorGrid("highlight-color-grid");
  };

  function toggleColorGrid(gridId) {
    const grid = document.getElementById(gridId);
    const isVisible = grid.style.display === "grid";
    hideAllColorGrids();
    grid.style.display = isVisible ? "none" : "grid";
  }

  document.addEventListener("click", () => {
    hideAllColorGrids();
  });

  document.getElementById("bold-btn").onclick = (e) => {
    e.preventDefault();
    messageInput.focus();
    document.execCommand("bold");
  };
  document.getElementById("italic-btn").onclick = (e) => {
    e.preventDefault();
    messageInput.focus();
    document.execCommand("italic");
  };
  document.getElementById("underline-btn").onclick = (e) => {
    e.preventDefault();
    messageInput.focus();
    document.execCommand("underline");
  };
  document.getElementById("strike-btn").onclick = (e) => {
    e.preventDefault();
    messageInput.focus();
    document.execCommand("strikeThrough");
  };

  function wrapSelectedText(wrapperNode) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.surroundContents(wrapperNode);
  }

  document.getElementById("message-input").addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          document.execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          document.execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          document.execCommand("underline");
          break;
        case "s":
          e.preventDefault();
          document.execCommand("strikeThrough");
          break;
      }
    }
    if (e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      adjustInputHeight();
    }
  });

  document
    .getElementById("message-input")
    .addEventListener("input", adjustInputHeight);

  function adjustInputHeight() {
    const input = document.getElementById("message-input");
    input.style.height = "auto";
    input.style.maxHeight = "108px";
  }

  function resetMessageInput() {
    const messageInput = document.getElementById("message-input");
    messageInput.innerHTML = "";
    messageInput.textContent = "";

    messageInput.style.height = "";
    hideAllColorGrids();
  }

  document
    .getElementById("message-input")
    .addEventListener("mouseup", saveSelection);
  document
    .getElementById("message-input")
    .addEventListener("keyup", saveSelection);

  document
    .getElementById("message-input")
    .addEventListener("keyup", updateToolbar);
  document
    .getElementById("message-input")
    .addEventListener("mouseup", updateToolbar);

  function updateToolbar() {
    const isBold = document.queryCommandState("bold");
    const isItalic = document.queryCommandState("italic");
    const isUnderline = document.queryCommandState("underline");
    const isStrike = document.queryCommandState("strikeThrough");

    toggleButton("bold-btn", isBold);
    toggleButton("italic-btn", isItalic);
    toggleButton("underline-btn", isUnderline);
    toggleButton("strike-btn", isStrike);
  }

  function toggleButton(id, active) {
    const button = document.getElementById(id);
    if (active) {
      button.style.backgroundColor = "#00b894";
    } else {
      button.style.backgroundColor = "";
    }
  }
  const linkBtn = document.getElementById("link-btn");
  const linkDialog = document.getElementById("link-dialog");
  const linkText = document.getElementById("link-text");
  const linkUrl = document.getElementById("link-url");
  const applyLink = document.getElementById("apply-link");
  const removeLink = document.getElementById("remove-link");
  const cancelLink = document.getElementById("cancel-link");
  let linkRange = null;

  function positionLinkDialog() {
    const linkDialog = document.getElementById("link-dialog");
    const guiContainer = document.getElementById("bookmarklet-gui");

    const guiRect = guiContainer.getBoundingClientRect();

    const left = (guiRect.width - linkDialog.offsetWidth) / 2;
    const top = (guiRect.height - linkDialog.offsetHeight) / 2;

    linkDialog.style.position = "absolute";
    linkDialog.style.left = `${left}px`;
    linkDialog.style.top = `${top}px`;
  }

  linkBtn.addEventListener("click", function () {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      linkRange = selection.getRangeAt(0).cloneRange();

      let parentLink = null;
      let currentNode = selection.anchorNode;

      while (currentNode && !parentLink) {
        if (currentNode.tagName === "A") {
          parentLink = currentNode;
        }
        currentNode = currentNode.parentNode;
      }

      if (parentLink) {
        linkText.value = parentLink.textContent;
        linkUrl.value = parentLink.href;
        linkRange = document.createRange();
        linkRange.selectNode(parentLink);
      } else {
        linkText.value = selection.toString();
        linkUrl.value = "";

        if (/^(https?:\/\/|www\.)[^\s]+$/i.test(linkText.value)) {
          linkUrl.value = linkText.value;
          if (linkUrl.value.startsWith("www.")) {
            linkUrl.value = "https://" + linkUrl.value;
          }
        }
      }

      linkDialog.style.display = "block";
      positionLinkDialog();
    }
  });

  applyLink.addEventListener("click", function () {
    if (linkRange && linkUrl.value) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(linkRange);

      const url = linkUrl.value.trim();
      let formattedUrl = url;

      if (!url.match(/^[a-zA-Z]+:\/\//) && !url.startsWith("mailto:")) {
        formattedUrl = "https://" + url;
      }

      const link = document.createElement("a");
      link.href = formattedUrl;
      link.textContent = linkText.value.trim() || url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      linkRange.deleteContents();
      linkRange.insertNode(link);

      linkDialog.style.display = "none";

      linkRange = null;
      messageInput.focus();
    }
  });

  removeLink.addEventListener("click", function () {
    if (linkRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(linkRange);

      const text = selection.toString();
      document.execCommand("unlink", false, null);

      linkDialog.style.display = "none";

      linkRange = null;
      messageInput.focus();
    }
  });

  cancelLink.addEventListener("click", function () {
    linkDialog.style.display = "none";
    linkRange = null;
    messageInput.focus();
  });

  document.addEventListener("click", function (e) {
    if (
      e.target !== linkDialog &&
      !linkDialog.contains(e.target) &&
      e.target !== linkBtn
    ) {
      linkDialog.style.display = "none";
    }
  });

  // Remove link detection while typing
  // document.getElementById("message-input").addEventListener("input", function () {});

  function autoDetectLinks(text) {
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;

    const urlRegex = /(https?:\/\/[^\s]+)|((www\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b(\/[^\s]*)?)/gi;

    function processNode(node) {
      // Only process text nodes
      if (node.nodeType === Node.TEXT_NODE) {
        const replaced = node.textContent.replace(urlRegex, function (url) {
          let href = url;
          if (url.startsWith("www.")) {
            href = "https://" + url;
          }
          return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });

        // If replacement happened, replace the text node with new HTML
        if (replaced !== node.textContent) {
          const span = document.createElement('span');
          span.innerHTML = replaced;
          node.replaceWith(...span.childNodes);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip <span class="mention"> elements entirely
        if (node.classList.contains('mention')) return;

        // Recurse through child nodes
        [...node.childNodes].forEach(processNode);
      }
    }

    [...tempDiv.childNodes].forEach(processNode);

    return tempDiv.innerHTML;
  }

  const attachmentPreview = document.getElementById("attachment-preview");
  const fileUploadInput = document.getElementById("file-upload");
  const attachmentBtn = document.getElementById("attachment-btn");

  let attachments = [];

  function updateAttachmentBar() {
    attachmentPreview.style.display = attachments.length > 0 ? "flex" : "none";
  }

  function addAttachment(fileBlobOrUrl, type, fileName = "") {
    const item = document.createElement("div");
    item.className = "attachment-item";
    item.title = fileName;

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "&#10005;";
    removeBtn.className = "remove-attachment";
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      attachments = attachments.filter((a) => a.file !== fileBlobOrUrl);
      item.remove();
      updateAttachmentBar();
    };

    const fileNameDisplay = document.createElement("div");
    fileNameDisplay.className = "attachment-filename";
    fileNameDisplay.textContent = fileName
      ? fileName.length > 12
        ? fileName.substring(0, 10) + "..."
        : fileName
      : "";

    const mimeType = fileBlobOrUrl.split(",")[0].split(":")[1].split(";")[0];

    if (type === "image") {
      const imgContainer = document.createElement("div");
      imgContainer.style.width = "100%";
      imgContainer.style.height = "100%";
      imgContainer.style.position = "relative";

      const img = document.createElement("img");
      img.src = fileBlobOrUrl;
      img.style.width = "100%";
      img.style.height = "calc(100% - 14px)";
      img.style.objectFit = "cover";

      imgContainer.appendChild(img);
      item.appendChild(imgContainer);

      item.onclick = (e) => {
        if (
          e.target.classList.contains("remove-attachment") ||
          e.target === removeBtn
        )
          return;
        window.openFileViewer(fileBlobOrUrl, fileName, mimeType);
      };
    } else {
      const fileIcon = document.createElement("div");
      fileIcon.innerHTML = "📎";
      fileIcon.style.fontSize = "24px";
      fileIcon.style.height = "calc(100% - 14px)";
      fileIcon.style.display = "flex";
      fileIcon.style.alignItems = "center";
      fileIcon.style.justifyContent = "center";
      fileIcon.style.width = "100%";

      item.appendChild(fileIcon);

      item.onclick = (e) => {
        if (
          e.target.classList.contains("remove-attachment") ||
          e.target === removeBtn
        )
          return;
        window.openFileViewer(fileBlobOrUrl, fileName, mimeType);
      };
    }

    item.appendChild(fileNameDisplay);
    item.appendChild(removeBtn);

    attachmentPreview.appendChild(item);
    attachments.push({ file: fileBlobOrUrl, type, name: fileName });
    updateAttachmentBar();
  }
  function clearAttachments() {
    attachments = [];
    attachmentPreview.innerHTML = "";
    updateAttachmentBar();
  }

  messageInput.addEventListener("paste", (e) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file && file.type.startsWith("image/")) {
        e.preventDefault();
        if (file.size > 2 * 1024 * 1024) {
          alert("Image too large (max 2MB)");
          return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
          addAttachment(event.target.result, "image");
        };
        reader.readAsDataURL(file);
      }
    }
  });

  attachmentBtn.addEventListener("click", () => {
    fileUploadInput.click();
  });

  fileUploadInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (!files.length) return;

    [...files].forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const result = event.target.result;
        const type = file.type.startsWith("image/") ? "image" : "file";
        addAttachment(result, type, file.name);
      };
      reader.readAsDataURL(file);
    });

    fileUploadInput.value = "";
  });

  async function markAllMessagesAsRead() {
    try {
      document.querySelectorAll(".message.unread").forEach((msg) => {
        msg.classList.remove("unread");
      });

      document.querySelectorAll(".unread-badge").forEach((badge) => {
        badge.style.display = "none";
        badge.textContent = "0";
      });

      const chatInfoRef = ref(database, "Chat Info");
      const chatInfoSnapshot = await get(chatInfoRef);
      const chatInfo = chatInfoSnapshot.val();

      const readMessagesUpdates = {};

      for (const [chatName, chatDetails] of Object.entries(chatInfo)) {
        const isAccessible =
          chatDetails.Type === "Public" ||
          (chatDetails.Type === "Private" &&
            chatDetails.Members.split(",").includes(email.replace(/\./g, "*")));

        if (isAccessible) {
          const chatRef = ref(database, `Chats/${chatName}`);
          const chatSnapshot = await get(chatRef);
          const messages = chatSnapshot.val();

          if (messages) {
            const messageIds = Object.keys(messages).sort();
            const latestMessageId = messageIds[messageIds.length - 1];

            const readMessageRef = ref(
              database,
              `Accounts/${email.replace(/\./g, "*")}/readMessages/${chatName}`,
            );
            await set(readMessageRef, latestMessageId);

            readMessages[chatName] = latestMessageId;
          }
        }
      }

      updateReadAllStatus();
      updateFavicon();
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      alert("Failed to mark all messages as read. Please try again.");
    }
  }

  const hideSidebarButton = document.getElementById("hide-left-sidebar");
  let isSidebarHidden = false;

  hideSidebarButton.addEventListener("click", function () {
    const leftSidebar = document.getElementById("left-sidebar");
    const rightSidebar = document.getElementById("right-sidebar");
    const chatScreen = document.getElementById("chat-screen");

    if (!isSidebarHidden) {
      leftSidebar.style.transition = "all 0.3s ease";
      leftSidebar.style.width = "0";
      leftSidebar.style.opacity = "0";
      leftSidebar.style.overflow = "hidden";
      leftSidebar.style.display = "none";

      rightSidebar.style.width = "100%";
      rightSidebar.style.left = "0";

      isSidebarHidden = true;
    } else {
      leftSidebar.style.transition = "all 0.3s ease";
      leftSidebar.style.width = "20%";
      leftSidebar.style.opacity = "1";
      leftSidebar.style.overflow = "visible";
      leftSidebar.style.display = "block";

      rightSidebar.style.width = "80%";
      rightSidebar.style.left = "20%";

      isSidebarHidden = false;
    }
  });

  document.getElementById("read-all").addEventListener("click", async () => {
    try {
      await markAllMessagesAsRead();
      updateFavicon();
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  });

  document.getElementById("voice-chat").addEventListener("click", function () {
    toggleVoiceChatMenu();
  });

  gui.querySelector("#bookmarklet-close").onclick = function () {
    const currentUrl = window.location.href;
    let link = document.querySelector(
      'link[rel="icon"], link[rel="shortcut icon"]',
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    if (currentUrl.includes("lakesideschool.instructure.com")) {
      link.href =
        "https://instructure-uploads-pdx.s3.us-west-2.amazonaws.com/account_211800000000000001/attachments/3701/smallershield.png";
    } else if (currentUrl.includes("google.com")) {
      link.href = "https://google.com/favicon.ico";
    }

    gui.remove();
  };

  document
    .getElementById("customize-profile")
    .addEventListener("click", async function () {
      const customizeScreen = document.getElementById(
        "customize-account-screen",
      );
      const chatScreen = document.getElementById("chat-screen");

      document.getElementById("create-username").value = "";
      document.getElementById("create-bio").value = "";

      const accountRef = ref(database, `Accounts/${email.replace(/\./g, "*")}`);
      const snapshot = await get(accountRef);
      const userData = snapshot.val();

      if (userData) {
        document.getElementById("create-username").value =
          userData.Username || "";
        document.getElementById("create-bio").value = userData.Bio || "";
      }

      chatScreen.classList.add("hidden");
      customizeScreen.classList.remove("hidden");
    });

  document.getElementById("submit-customize").onclick = async function () {
    const username = document.getElementById("create-username").value.trim();
    const bio = document.getElementById("create-bio").value.trim();
    const chatScreen = document.getElementById("chat-screen");
    const customizeScreen = document.getElementById("customize-account-screen");

    try {
      const accountsRef = ref(
        database,
        `Accounts/${email.replace(/\./g, "*")}`,
      );
      const snapshot = await get(accountsRef);
      const existingData = snapshot.val() || {};

      const updatedAccountData = {
        ...existingData,
        Username: username || "Anonymous",
        Bio: bio || "I'm a yapper",
      };

      await set(accountsRef, updatedAccountData);

      chatScreen.classList.remove("hidden");
      customizeScreen.classList.add("hidden");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };
  function resetForm() {
    const channelType = document.getElementById("channel-type");
    const channelMembers = document.getElementById("channel-members");
    const channelName = document.getElementById("channel-name");
    const channelDescription = document.getElementById("channel-description");
    const submitButton = document.getElementById("submit-channel");
    const backButton = document.getElementById("back-channel");
    const membersContainer = document.getElementById("members-container");
    const selectedMembers = document.getElementById("selected-members");
    const membersList = document.getElementById("members-list");
    const deleteButton = document.getElementById("delete-channel");
    const memberSearch = document.getElementById("member-search");
    channelType.value = "Public";
    membersContainer.style.display = "none";
    membersList.innerHTML = "";
    selectedMembers.innerHTML = "";
    if (!submitButton.clicked) {
      channelName.value = "";
      channelDescription.value = "";
    }
    deleteButton.style.display = "none";
    channelName.disabled = false;
    previousChannelType = "Public";
    originalMembers = "";
  }

  async function handleChannelForm(
    isModifying = false,
    existingChannelName = null,
  ) {
    chatScreen.style.display = "none";
    document.getElementById("channel-screen").classList.remove("hidden");
    const channelType = document.getElementById("channel-type");
    const channelMembers = document.getElementById("channel-members");
    const channelName = document.getElementById("channel-name");
    const channelDescription = document.getElementById("channel-description");
    const submitButton = document.getElementById("submit-channel");
    const backButton = document.getElementById("back-channel");
    const membersContainer = document.getElementById("members-container");
    const selectedMembers = document.getElementById("selected-members");
    const membersList = document.getElementById("members-list");
    const deleteButton = document.getElementById("delete-channel");
    const memberSearch = document.getElementById("member-search");
    const title = document.getElementById("channel-screen-title");
    title.textContent = `${isModifying ? "Customize Channel" : "Create Channel"}`;

    let originalMembers = "";
    let previousChannelType = "Public";

    resetForm();

    if (isModifying && existingChannelName) {
      const chatInfoRef = ref(database, `Chat Info/${existingChannelName}`);
      const snapshot = await get(chatInfoRef);

      if (snapshot.exists()) {
        const channelData = snapshot.val();

        const currentUserEmail = email.replace(/\./g, "*");
        if (!channelData.Creator || channelData.Creator !== currentUserEmail) {
          document.getElementById("channel-screen").classList.add("hidden");
          chatScreen.style.display = "flex";
          return;
        }

        channelName.value = existingChannelName;
        channelName.disabled = true;
        deleteButton.style.display = "block";

        channelDescription.value = channelData.Description;
        channelType.value = channelData.Type;
        previousChannelType = channelData.Type;
        originalMembers = channelData.Members;

        if (channelData.Type === "Private") {
          membersContainer.style.display = "block";
          await loadExistingMembers(channelData.Members);
        } else {
          membersContainer.style.display = "none";
        }
      } else {
        document.getElementById("channel-screen").classList.add("hidden");
        chatScreen.style.display = "flex";
        return;
      }
    }

    let availableMembers = [];
    document
      .getElementById("channel-type")
      .addEventListener("change", function () {
        if (this.value === "Public") {
          membersContainer.style.display = "none";
        } else {
          membersContainer.style.display = "block";
          loadMemberOptions();

          if (
            previousChannelType === "Public" &&
            originalMembers &&
            originalMembers !== "None"
          ) {
            loadExistingMembers(originalMembers);
          }
        }
        previousChannelType = this.value;
      });

    function loadMemberOptions() {
      async function updateAvailableMembers() {
        const accountsRef = ref(database, "Accounts");
        const snapshot = await get(accountsRef);
        const accounts = snapshot.val();

        const selectedEmails = new Set(
          Array.from(document.querySelectorAll(".selected-member"))
            .map((el) => el.textContent.trim().replace(/×$/, ""))
            .map((email) => email.replace(/\./g, "*")),
        );

        availableMembers = Object.keys(accounts)
          .filter(
            (accountEmail) =>
              accountEmail !== email.replace(/\./g, "*") &&
              !selectedEmails.has(accountEmail),
          )
          .map((accountEmail) => ({
            id: accountEmail,
            email: accountEmail.replace(/\*/g, "."),
          }));

        renderMembersList(availableMembers);
      }

      function renderMembersList(members) {
        membersList.innerHTML = "";
        members.forEach((member) => {
          const option = document.createElement("div");
          option.className = "member-option";
          option.textContent = member.email;
          option.onclick = () => addMember(member);
          membersList.appendChild(option);
        });
      }

      function addMember(member) {
        const memberElement = document.createElement("div");
        memberElement.className = "selected-member";
        memberElement.innerHTML = `
    ${member.email}
    <span class="remove-member">×</span>
`;

        memberElement.querySelector(".remove-member").onclick = () => {
          memberElement.remove();
          availableMembers.push(member);
          availableMembers.sort((a, b) => a.email.localeCompare(b.email));
          renderMembersList(availableMembers);
        };

        selectedMembers.appendChild(memberElement);

        availableMembers = availableMembers.filter(
          (availableMember) => availableMember.id !== member.id,
        );
        renderMembersList(availableMembers);

        membersList.style.display = "none";
        memberSearch.value = "";
      }

      updateAvailableMembers();

      memberSearch.onfocus = () => {
        membersList.style.display = "block";
      };

      document.addEventListener("click", (e) => {
        if (!membersContainer.contains(e.target)) {
          membersList.style.display = "none";
        }
      });

      memberSearch.oninput = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredMembers = availableMembers.filter((member) =>
          member.email.toLowerCase().includes(searchTerm),
        );
        renderMembersList(filteredMembers);
        membersList.style.display = "block";
      };
    }

    async function loadExistingMembers(membersList) {
      if (!membersList || membersList === "None") return;

      const members = membersList.split(",");
      const currentUserEmail = email.replace(/\./g, "*");

      const otherMembers = members.filter(
        (member) => member !== currentUserEmail,
      );

      selectedMembers.innerHTML = "";

      for (const memberEmail of otherMembers) {
        const memberElement = document.createElement("div");
        memberElement.className = "selected-member";
        memberElement.innerHTML = `
        ${memberEmail.replace(/\*/g, ".")}
        <span class="remove-member">×</span>
      `;

        memberElement.querySelector(".remove-member").onclick = () => {
          memberElement.remove();

          const formattedEmail = memberEmail.replace(/\*/g, ".");
          availableMembers.push({
            id: memberEmail,
            email: formattedEmail,
          });
          availableMembers.sort((a, b) => a.email.localeCompare(b.email));
          if (
            document.getElementById("members-list").style.display !== "none"
          ) {
            renderMembersList(availableMembers);
          }
        };

        selectedMembers.appendChild(memberElement);
      }

      loadMemberOptions();
    }
    pendingFormOptions = { isModifying, existingChannelName, originalMembers };

    submitButton.onclick = createChannelHandler;
    deleteButton.onclick = deleteChannelHandler;

    backButton.addEventListener("click", async function () {
      resetForm();
      document.getElementById("channel-screen").classList.add("hidden");
      chatScreen.style.display = "flex";
    });
  }
  async function createChannelHandler() {
    const { isModifying, existingChannelName, originalMembers } =
      pendingFormOptions;
    const channelType = document.getElementById("channel-type");
    const channelMembers = document.getElementById("channel-members");
    const channelName = document.getElementById("channel-name");
    const channelDescription = document.getElementById("channel-description");
    const submitButton = document.getElementById("submit-channel");
    const backButton = document.getElementById("back-channel");
    const membersContainer = document.getElementById("members-container");
    const selectedMembers = document.getElementById("selected-members");
    const membersList = document.getElementById("members-list");
    const deleteButton = document.getElementById("delete-channel");
    const memberSearch = document.getElementById("member-search");
    const name = channelName.value.trim();
    const type = channelType.value;
    const description = channelDescription.value.trim();

    if (!name) {
      alert("Please enter a channel name");
      return;
    }

    if (!isModifying) {
      const chatInfoRef = ref(database, `Chat Info/${name}`);
      const snapshot = await get(chatInfoRef);
      if (snapshot.exists()) {
        alert(
          "A channel with this name already exists. Please choose a different name.",
        );
        return;
      }
    }

    let members = [];
    members.push(email.replace(/\./g, "*"));

    if (type === "Private") {
      const selectedMemberElements =
        document.querySelectorAll(".selected-member");
      if (selectedMemberElements.length === 0) {
        alert("Please select at least one member for private channel");
        return;
      }
      members = members.concat(
        Array.from(selectedMemberElements).map((el) =>
          el.textContent
            .trim()
            .replace(/×$/, "")
            .replace(/\./g, "*")
            .trim()
            .replace(/\s+/g, ""),
        ),
      );
    }

    const channelData = {
      Description: description || "No description provided",

      Members:
        type === "Private"
          ? members.join(",")
          : isModifying && originalMembers && originalMembers !== "None"
            ? originalMembers
            : email.replace(/\./g, "*"),
      Type: type,
      Creator: email.replace(/\./g, "*"),
    };

    try {
      const newChannelRef = ref(database, `Chat Info/${name}`);
      await set(newChannelRef, channelData);

      channelName.value = "";
      channelDescription.value = "";
      channelType.value = "Public";
      await fetchChatList();
      selectServer(name);
      currentChat = name;
      document.getElementById("channel-screen").classList.add("hidden");
      chatScreen.style.display = "flex";
      updateModifyButtonVisibility();
      resetForm();
    } catch (error) {
      console.error("Error creating/modifying channel:", error);
      alert("Error creating/modifying channel. Please try again.");
    }
  }

  function deleteChannelHandler() {
    const { isModifying, existingChannelName, originalMembers } =
      pendingFormOptions;
    const channelType = document.getElementById("channel-type");
    const channelMembers = document.getElementById("channel-members");
    const channelName = document.getElementById("channel-name");
    const channelDescription = document.getElementById("channel-description");
    const submitButton = document.getElementById("submit-channel");
    const backButton = document.getElementById("back-channel");
    const membersContainer = document.getElementById("members-container");
    const selectedMembers = document.getElementById("selected-members");
    const membersList = document.getElementById("members-list");
    const deleteButton = document.getElementById("delete-channel");
    const memberSearch = document.getElementById("member-search");
    if (isModifying) {
      const channelNameToDelete = channelName.value.trim();
      if (!channelNameToDelete) {
        alert("Channel name is missing");
        return;
      }

      if (
        confirm(
          `Are you sure you want to delete channel "${channelNameToDelete}"?`,
        )
      ) {
        try {
          const channelRef = ref(database, `Chat Info/${channelNameToDelete}`);
          remove(channelRef)
            .then(() => {
              const messagesRef = ref(database, `Chats/${channelNameToDelete}`);
              return remove(messagesRef);
            })
            .then(() => {
              document.getElementById("channel-screen").classList.add("hidden");
              chatScreen.style.display = "flex";
              resetForm();
              alert(`Channel "${channelNameToDelete}" has been deleted.`);
              fetchChatList();
              loadMessages("General");
              currentChat = "General";
              updateModifyButtonVisibility();
            })
            .catch((error) => {
              console.error("Error in deletion process:", error);
              alert("Error deleting channel. Please try again.");
            });
        } catch (error) {
          console.error("Error initiating delete:", error);
          alert("Error deleting channel. Please try again.");
        }
      }
    }
  }
  document
    .getElementById("create-new-server")
    .addEventListener("click", function () {
      handleChannelForm(false);
    });

  async function updateModifyButtonVisibility() {
    const modifyButton = document.getElementById("modify-channel");

    if (!currentChat) {
      modifyButton.style.display = "none";
      return;
    }

    try {
      const chatInfoRef = ref(database, `Chat Info/${currentChat}`);
      const snapshot = await get(chatInfoRef);

      if (snapshot.exists()) {
        const channelData = snapshot.val();
        const currentUserEmail = email.replace(/\./g, "*");

        if (channelData.Creator && channelData.Creator === currentUserEmail) {
          modifyButton.style.display = "block";
        } else {
          modifyButton.style.display = "none";
        }
      } else {
        modifyButton.style.display = "none";
      }
    } catch (error) {
      console.error("Error checking channel creator:", error);
      modifyButton.style.display = "none";
    }
  }

  document
    .getElementById("modify-channel")
    .addEventListener("click", function () {
      if (!currentChat) {
        alert("Please select a channel to modify");
        return;
      }

      handleChannelForm(true, currentChat);
    });

  function setupUnreadCountUpdates() {
    const chatsRef = ref(database, "Chats");

    onValue(chatsRef, async (snapshot) => {
      const chats = snapshot.val();
      if (!chats) return;

      const servers = document.querySelectorAll(".server");
      for (const server of servers) {
        const chatName = server.textContent.trim();
        if (chats[chatName]) {
          await updateUnreadCount(chatName);
        }
      }
    });
  }

  async function selectServer(channelName) {
    const servers = document.querySelectorAll(".server");
    servers.forEach((server) => {
      if (server.textContent.trim() === channelName) {
        server.classList.add("selected");
      } else {
        server.classList.remove("selected");
      }
    });
    await loadMessages(channelName);
  }

  checkForUpdates();
  setupGlobalFileViewer();
  fetchChatList();
  setupUnreadCountUpdates();
  await initializeReadMessages();
  loadMessages("General");
  setupInteractionTracking(document.getElementById("bookmarklet-gui"));
  initializeUserActivitySidebar();
  const messagesDiv = document.getElementById("messages");
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  updateModifyButtonVisibility();
})();
