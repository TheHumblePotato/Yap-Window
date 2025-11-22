(async function () {
  if (document.getElementById("bookmarklet-gui")) {
    const gui = document.getElementById("bookmarklet-gui");
    gui.style.opacity = "1";
    gui.style.display = "flex";
  } else {
    // GitHub repository owner and repo name used to fetch latest raw files
    const GITHUB_USER = "TheHumblePotato";
    const GITHUB_REPO = "Yap-Window";

    // Helper to build raw.githubusercontent URL for files in the main branch and
    // attach a timestamp token to avoid aggressive caching.
    // buildRawUrl(path, useEncodedToken=false)
    // - when useEncodedToken is false (default) it appends a numeric unix timestamp
    //   to help avoid caching.
    // - when true it appends the literal, URL-encoded shell token string
    //   $(date%20+%s) so the assembled URL matches the encoded fallback format.
    function buildRawUrl(path, useEncodedToken = false) {
      if (useEncodedToken) {
        return `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/main/${path}?token=$(date%20+%s)`;
      }
      const ts = Math.floor(Date.now() / 1000);
      return `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/main/${path}?token=${ts}`;
    }
    const firebaseConfig = {
      apiKey: "AIzaSyA48Uv_v5c7-OCnkQ8nBkjIW8MN4STDcJs",
      authDomain: "noise-75cba.firebaseapp.com",
      databaseURL: "https://noise-75cba-default-rtdb.firebaseio.com",
      projectId: "noise-75cba",
      storageBucket: "noise-75cba.appspot.com",
      messagingSenderId: "1092146908435",
      appId: "1:1092146908435:web:f72b90362cc86c5f83dee6", 
      measurementId: "G-5DH6JFX6W5"
    };    
    var database, auth, provider, email, mostRecentVersionKey;

    try {
      var { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"
      );
      var { getDatabase, get, ref, set, onValue, push, update, remove, child } =
        await import(
          "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js"
        );
      var {
        getAuth,
        GoogleAuthProvider,
        createUserWithEmailAndPassword,
        signInWithPopup,
        signInWithEmailAndPassword,
        sendEmailVerification,
        sendSignInLinkToEmail,
        isSignInWithEmailLink,
        signInWithEmailLink,
        setPersistence,
        browserLocalPersistence,
        onAuthStateChanged,
      } = await import(
        "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"
      );

      var app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      auth = getAuth(app);
      provider = new GoogleAuthProvider();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      alert("Firebase initialization failed. Check the console for details.");
      return;
    }

  const guiPrimaryUrl = buildRawUrl("Code/gui.js", true);
      const guiFallbackUrl =
        "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/main/Code/gui.js?token=$(date%20+%s)";

    fetch(guiPrimaryUrl)
      .then((r) => {
        if (!r.ok) return fetch(guiFallbackUrl);
        return r;
      })
      .then((r) => r.text())
      .then((code) => {
        eval(code);
        const gui = document.getElementById("bookmarklet-gui");
        async function openChatScreen() {
          const firebaseStuff = {
            firebase,
            database,
            auth,
            app,
            getDatabase,
            get,
            ref,
            set,
            onValue,
            push,
            update,
            remove,
            child,
            app
          };
          const chatPrimaryUrl = buildRawUrl("Code/chat.js", true);
            const chatFallbackUrl =
              "https://raw.githubusercontent.com/TheHumblePotato/Yap-Window/refs/heads/main/Code/chat.js?token=$(date%20+%s)";

          fetch(chatPrimaryUrl)
            .then((r) => {
              if (!r.ok) return fetch(chatFallbackUrl);
              return r;
            })
            .then((r) => r.text())
            .then((chatCode) => {
              const wrappedChatCode = `
              (function(firebaseStuff) {
                const { database, auth, app, getDatabase, get, ref, set, onValue, push, update, remove, child  } = firebaseStuff;
                ${chatCode}
              })(firebaseStuff);
            `;
              eval(wrappedChatCode);
            })
            .catch((error) => {
              console.error("Error loading code:", error);
              alert("Failed to load chat code. Check the console for details.");
            });
        }

        const mainScreen = document.getElementById("main-screen");
        const loginScreen = document.getElementById("login-screen");
        const createScreen = document.getElementById("create-account-screen");
        const customizeScreen = document.getElementById(
          "customize-account-screen",
        );
        const verificationScreen = document.getElementById(
          "verification-screen",
        );
        const stayloginScreen = document.getElementById("stay-login-screen");
        const savedAccountScreen = document.getElementById("saved-account");
        let skip = false;
        let email = "";

        mainScreen.classList.add("hidden");

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (user) {
            const storedForget = localStorage.getItem("neverPersist");
            email = user.email;
            const sanitizedEmail = email.replace(/\./g, "*");
            const usernameRef = ref(
              database,
              `Accounts/${sanitizedEmail}/Username`,
            );

            mainScreen.classList.add("hidden");
            savedAccountScreen.classList.remove("hidden");

            try {
              const snapshot = await get(usernameRef);
              if (snapshot.exists()) {
                const username = snapshot.val();
                document.getElementById("saved-username").textContent =
                  "Username: " + username;
              } else {
                document.getElementById("saved-username").textContent =
                  "Username: Not Found";
              }
            } catch (error) {
              document.getElementById("saved-username").textContent =
                "Username: Error";
            }

            document.getElementById("saved-email").textContent =
              "Email: " + email;

            document.getElementById("saved-login-button").onclick =
              async function () {
                const userRef = ref(
                  database,
                  `Accounts/${email.replace(/\./g, "*")}`,
                );
                try {
                  const userSnapshot = await get(userRef);
                  if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();
                    const missingUsername = !userData.Username;
                    const missingBio = !userData.Bio;

                    if (missingUsername || missingBio) {
                      customizeScreen.classList.remove("hidden");
                      savedAccountScreen.classList.add("hidden");
                      document.getElementById("create-username").value =
                        userData.Username || "Anonymous";
                      document.getElementById("create-bio").value =
                        userData.Bio || "";
                      skip = true;
                      return;
                    } else {
                      const missingVersion = !userData.Version;
                      if (missingVersion) {
                        const updatesRef = ref(database, "Updates");
                        const updatesSnapshot = await get(updatesRef);
                        if (updatesSnapshot.exists()) {
                          const updates = updatesSnapshot.val();
                          const versionKeys = Object.keys(updates).sort(
                            (a, b) => {
                              const aParts = a.split("*").map(Number);
                              const bParts = b.split("*").map(Number);
                              for (
                                let i = 0;
                                i < Math.max(aParts.length, bParts.length);
                                i++
                              ) {
                                const aSegment = aParts[i] || 0;
                                const bSegment = bParts[i] || 0;
                                if (aSegment < bSegment) return -1;
                                if (aSegment > bSegment) return 1;
                              }
                              return 0;
                            },
                          );
                          mostRecentVersionKey =
                            versionKeys[versionKeys.length - 1];

                          await update(userRef, {
                            Version: mostRecentVersionKey,
                          });

                          const storedForget =
                            localStorage.getItem("neverPersist");

                          savedAccountScreen.classList.add("hidden");
                          openChatScreen();
                        }
                      } else {
                        savedAccountScreen.classList.add("hidden");
                        openChatScreen();
                      }
                    }
                  } else {
                    console.error("User record not found in database.");
                    customizeScreen.classList.remove("hidden");
                    savedAccountScreen.classList.add("hidden");
                    return;
                  }
                } catch (error) {
                  console.error("Error checking user info:", error);
                }
              };

            document.getElementById("saved-signout-button").onclick =
              async function () {
                try {
                  await auth.signOut();
                  savedAccountScreen.classList.add("hidden");
                  mainScreen.classList.remove("hidden");
                } catch (error) {
                  console.error("Error signing out:", error);
                }
              };
          } else {
            mainScreen.classList.remove("hidden");
          }
        });

        async function handleEmailVerification(user, screen) {
          let retryCount = 0;
          let verificationCheckInterval;
          verificationScreen.classList.remove("hidden");
          screen.classList.add("hidden");
          async function attemptVerification() {
            try {
              await sendEmailVerification(user);

              return true;
            } catch (error) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              return await attemptVerification();
            }
          }
          await attemptVerification();

          return new Promise((resolve) => {
            verificationCheckInterval = setInterval(async () => {
              try {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                  clearInterval(verificationCheckInterval);

                  verificationScreen.classList.add("hidden");
                  resolve();
                }
              } catch (error) {
                console.error("Error checking verification status:", error);
              }
            }, 1000);

            document.getElementById("resend-verification").onclick =
              async () => {
                try {
                  await sendEmailVerification(auth.currentUser);
                  document.getElementById("verification-error").textContent =
                    "Verification email resent!";
                } catch (error) {
                  document.getElementById("verification-error").textContent =
                    error.message;
                }
              };
          }).finally(() => {
            if (verificationCheckInterval) {
              clearInterval(verificationCheckInterval);
            }
          });
        }

        storedEmail = localStorage.getItem("userEmail");

        document.getElementById("login-button").onclick = function () {
          mainScreen.classList.add("hidden");
          loginScreen.classList.remove("hidden");
        };

        document.getElementById("create-account-button").onclick = function () {
          mainScreen.classList.add("hidden");
          createScreen.classList.remove("hidden");
        };

        document.getElementById("submit-create-email").onclick =
          async function () {
            const emailInput = document.getElementById("create-email");
            const passwordInput = document.getElementById("create-password");
            const errorLabel = document.getElementById("create-email-error");
            email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
              errorLabel.textContent = "Please enter both email and password.";
              return;
            }

            try {
              const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
              );
              const user = result.user;

              email = user.email;

              await handleEmailVerification(user, createScreen);

              emailInput.value = "";
              passwordInput.value = "";
              errorLabel.textContent = "";
              create_account();
              customizeScreen.classList.remove("hidden");
              createScreen.classList.add("hidden");
              document.getElementById("create-username").value = "Anonymous";
            } catch (error) {
              errorLabel.textContent = error.message;
            }
          };

        document.getElementById("google-create-button").onclick =
          async function () {
            try {
              result = await signInWithPopup(auth, provider);
              const user = result.user;
              email = result.user;
              email = user.email = user.email;
              create_account();
              customizeScreen.classList.remove("hidden");
              createScreen.classList.add("hidden");
              document.getElementById("create-username").value = "Anonymous";
            } catch (error) {
              document.getElementById("create-email-error").textContent =
                error.message;
            }
          };

        document.getElementById("back-create-button").onclick =
          async function () {
            mainScreen.classList.remove("hidden");
            createScreen.classList.add("hidden");
          };

        document.getElementById("submit-login-email").onclick =
          async function () {
            const emailInput = document.getElementById("login-email");
            const passwordInput = document.getElementById("login-password");
            const errorLabel = document.getElementById("login-email-error");
            email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
              errorLabel.textContent = "Please enter your email and password.";
              return;
            }

            try {
              const result = await signInWithEmailAndPassword(
                auth,
                email,
                password,
              );
              const user = result.user;

              if (!user.emailVerified) {
                await handleEmailVerification(user, loginScreen);
              }

              email = user.email;
              emailInput.value = "";
              passwordInput.value = "";
              errorLabel.textContent = "";
              const userRef = ref(
                database,
                `Accounts/${email.replace(/\./g, "*")}`,
              );

              try {
                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                  const userData = userSnapshot.val();
                  const missingUsername = !userData.Username;
                  const missingBio = !userData.Bio;
                  const missingVersion = !userData.Version;

                  if (missingUsername || missingBio) {
                    customizeScreen.classList.remove("hidden");
                    loginScreen.classList.add("hidden");
                    document.getElementById("create-username").value =
                      userData.Username || "Anonymous";
                    document.getElementById("create-bio").value =
                      userData.Bio || "";
                    return;
                  } else if (missingVersion) {
                    const updatesRef = ref(database, "Updates");
                    const updatesSnapshot = await get(updatesRef);
                    if (updatesSnapshot.exists()) {
                      const updates = updatesSnapshot.val();
                      const versionKeys = Object.keys(updates).sort((a, b) => {
                        const aParts = a.split("*").map(Number);
                        const bParts = b.split("*").map(Number);
                        for (
                          let i = 0;
                          i < Math.max(aParts.length, bParts.length);
                          i++
                        ) {
                          const aSegment = aParts[i] || 0;
                          const bSegment = bParts[i] || 0;
                          if (aSegment < bSegment) return -1;
                          if (aSegment > bSegment) return 1;
                        }
                        return 0;
                      });
                      mostRecentVersionKey =
                        versionKeys[versionKeys.length - 1];

                      await update(userRef, { Version: mostRecentVersionKey });

                      const storedForget = localStorage.getItem("neverPersist");

                      if (storedForget !== "true") {
                        loginScreen.classList.add("hidden");
                        stayloginScreen.classList.remove("hidden");
                      } else {
                        loginScreen.classList.add("hidden");
                        openChatScreen();
                      }
                    }
                  } else {
                    const storedForget = localStorage.getItem("neverPersist");
                    if (storedForget !== "true") {
                      loginScreen.classList.add("hidden");
                      stayloginScreen.classList.remove("hidden");
                    } else {
                      loginScreen.classList.add("hidden");
                      openChatScreen();
                    }
                  }
                } else {
                  console.error("User record not found in database.");
                  customizeScreen.classList.remove("hidden");
                  loginScreen.classList.add("hidden");
                  return;
                }
              } catch (error) {
                console.error("Error checking user info:", error);
              }
            } catch (error) {
              errorLabel.textContent = error.message;
            }
          };

        document.getElementById("google-login-button").onclick =
          async function () {
            try {
              result = await signInWithPopup(auth, provider);
              const user = result.user;
              email = user.email;
              try {
                const userRef = ref(
                  database,
                  `Accounts/${email.replace(/\./g, "*")}`,
                );

                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                  const userData = userSnapshot.val();
                  const missingUsername = !userData.Username;
                  const missingBio = !userData.Bio;
                  const missingVersion = !userData.Version;

                  if (missingUsername || missingBio) {
                    customizeScreen.classList.remove("hidden");
                    loginScreen.classList.add("hidden");
                    document.getElementById("create-username").value =
                      userData.Username || "Anonymous";
                    document.getElementById("create-bio").value =
                      userData.Bio || "";
                    return;
                  } else if (missingVersion) {
                    const updatesRef = ref(database, "Updates");
                    const updatesSnapshot = await get(updatesRef);
                    if (updatesSnapshot.exists()) {
                      const updates = updatesSnapshot.val();
                      const versionKeys = Object.keys(updates).sort((a, b) => {
                        const aParts = a.split("*").map(Number);
                        const bParts = b.split("*").map(Number);
                        for (
                          let i = 0;
                          i < Math.max(aParts.length, bParts.length);
                          i++
                        ) {
                          const aSegment = aParts[i] || 0;
                          const bSegment = bParts[i] || 0;
                          if (aSegment < bSegment) return -1;
                          if (aSegment > bSegment) return 1;
                        }
                        return 0;
                      });
                      mostRecentVersionKey =
                        versionKeys[versionKeys.length - 1];

                      await update(userRef, { Version: mostRecentVersionKey });

                      const storedForget = localStorage.getItem("neverPersist");

                      if (storedForget !== "true") {
                        loginScreen.classList.add("hidden");
                        stayloginScreen.classList.remove("hidden");
                      } else {
                        loginScreen.classList.add("hidden");
                        openChatScreen();
                      }
                    }
                  } else {
                    const storedForget = localStorage.getItem("neverPersist");
                    if (storedForget !== "true") {
                      loginScreen.classList.add("hidden");
                      stayloginScreen.classList.remove("hidden");
                    } else {
                      loginScreen.classList.add("hidden");
                      openChatScreen();
                    }
                  }
                } else {
                  console.error("User record not found in database.");
                  customizeScreen.classList.remove("hidden");
                  loginScreen.classList.add("hidden");
                  return;
                }
              } catch (error) {
                console.error("Error checking user info:", error);
              }
            } catch (error) {
              const errorLabel = document.getElementById("login-email-error");
              errorLabel.textContent = error.message;
            }
          };

        document.getElementById("back-login-button").onclick =
          async function () {
            mainScreen.classList.remove("hidden");
            loginScreen.classList.add("hidden");
          };

        function create_account() {
          const accountsRef = ref(
            database,
            `Accounts/${email.replace(/\./g, "*")}`,
          );

          const updatesRef = ref(database, "Updates");

          get(updatesRef)
            .then((updatesSnapshot) => {
              const updates = updatesSnapshot.val();

              const versionKeys = Object.keys(updates).sort((a, b) => {
                const aParts = a.split("*").map(Number);
                const bParts = b.split("*").map(Number);

                for (
                  let i = 0;
                  i < Math.max(aParts.length, bParts.length);
                  i++
                ) {
                  const aSegment = aParts[i] || 0;
                  const bSegment = bParts[i] || 0;

                  if (aSegment < bSegment) return -1;
                  if (aSegment > bSegment) return 1;
                }

                return 0;
              });

              mostRecentVersionKey = versionKeys[versionKeys.length - 1];

              const accountData = {
                Bio: "None",
                Username: "Anonymous",
                Version: mostRecentVersionKey,
              };

              set(accountsRef, accountData)
                .then(() => {})
                .catch((error) => {
                  console.error("Error creating account:", error);
                  alert("Failed to create account. Please try again.");
                });
            })
            .catch((error) => {
              console.error("Error fetching updates:", error);
              alert("Failed to fetch the latest version. Please try again.");
            });
        }

        document.getElementById("submit-customize").onclick =
          async function () {
            const username = document
              .getElementById("create-username")
              .value.trim();
            const bio = document.getElementById("create-bio").value.trim();

            if (!email) {
              console.error("Email is undefined! Cannot update account.");
              alert("Missing email. Please refresh.");
              return;
            }
            if (!database) {
              console.error("Database is undefined! Cannot update account.");
              alert("Missing database. Please refresh.");
              return;
            }

            let versionToSave = mostRecentVersionKey;

            const accountsRef = ref(
              database,
              `Accounts/${email.replace(/\./g, "*")}`,
            );
            const userRef = ref(
              database,
              `Accounts/${email.replace(/\./g, "*")}`,
            );

            try {
              const userSnapshot = await get(userRef);
              const userData = userSnapshot.val();
              const missingVersion = !userData || !userData.Version;

              if (missingVersion) {
                const updatesRef = ref(database, "Updates");
                const updatesSnapshot = await get(updatesRef);
                if (updatesSnapshot.exists()) {
                  const updates = updatesSnapshot.val();
                  const versionKeys = Object.keys(updates).sort((a, b) => {
                    const aParts = a.split("*").map(Number);
                    const bParts = b.split("*").map(Number);
                    for (
                      let i = 0;
                      i < Math.max(aParts.length, bParts.length);
                      i++
                    ) {
                      const aSegment = aParts[i] || 0;
                      const bSegment = bParts[i] || 0;
                      if (aSegment < bSegment) return -1;
                      if (aSegment > bSegment) return 1;
                    }
                    return 0;
                  });
                  versionToSave = versionKeys[versionKeys.length - 1];
                }
              }

              if (!versionToSave) {
                console.warn(
                  "No version key found. Setting default version '1*0'.",
                );
                versionToSave = "1*0";
              }

              const updatedAccountData = {
                Username: username || "Anonymous",
                Bio: bio || "I'm a yapper",
                Version: versionToSave,
              };

              await set(accountsRef, updatedAccountData);
              console.log("Profile updated successfully!");

              const storedForget = localStorage.getItem("neverPersist");

              if (storedForget !== "true" && !skip) {
                customizeScreen.classList.add("hidden");
                stayloginScreen.classList.remove("hidden");
              } else {
                customizeScreen.classList.add("hidden");
                openChatScreen();
              }
            } catch (error) {
              console.error("Error updating profile:", error);
              alert("Failed to update profile. Please try again.");
            }
          };

        document.getElementById("stay-yes").onclick = async function () {
          localStorage.setItem("userEmail", email);
          openChatScreen();
          stayloginScreen.classList.add("hidden");
        };
        document.getElementById("stay-no").onclick = async function () {
          openChatScreen();
          stayloginScreen.classList.add("hidden");
        };
        document.getElementById("stay-forget").onclick = async function () {
          localStorage.setItem("userEmail", "none");
          openChatScreen();
          stayloginScreen.classList.add("hidden");
        };
      });
  }
})();
