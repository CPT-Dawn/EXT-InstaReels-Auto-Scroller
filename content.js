let isOnReels = false;
let appIsRunning = false;

// ✅ Function to start or stop auto-scrolling
function toggleAutoScrolling(state, shouldRefresh = true) {
  appIsRunning = state;
  chrome.storage.sync.set({ autoReelsStart: state }, () => {
    updateToggleState(state);
    if (shouldRefresh) location.reload(); // ✅ Refresh only when the toggle changes
  });

  state ? startAutoScrolling() : stopAutoScrolling();
}

// ✅ Check if we are on the Reels page and apply changes
function checkURLAndManageApp() {
  const isOnReelsPage = window.location.href.startsWith("https://www.instagram.com/reels/");

  if (isOnReelsPage && !isOnReels) {
    isOnReels = true;
    chrome.storage.sync.get(["autoReelsStart", "injectReelsButton"], (result) => {
      if (result.autoReelsStart) toggleAutoScrolling(true, false); // ✅ No refresh on first load
      if (result.injectReelsButton) injectToggle(result.autoReelsStart);
    });
  } else if (!isOnReelsPage && isOnReels) {
    isOnReels = false;
    toggleAutoScrolling(false, false);
    removeToggle();
  }
}

// ✅ Function to inject a toggle button in Reels
function injectToggle(isEnabled) {
  removeToggle(); // ✅ Prevent duplicates

  const toggleWrapper = document.createElement("div");
  toggleWrapper.id = "myInjectedToggleWrapper";
  toggleWrapper.style.position = "fixed";
  toggleWrapper.style.right = "20px";
  toggleWrapper.style.bottom = "80px";
  toggleWrapper.style.zIndex = "1000";
  toggleWrapper.style.padding = "10px";
  toggleWrapper.style.background = "#111827";
  toggleWrapper.style.borderRadius = "50px";
  toggleWrapper.style.display = "flex";
  toggleWrapper.style.alignItems = "center";
  toggleWrapper.style.gap = "10px";
  toggleWrapper.style.cursor = "pointer";
  toggleWrapper.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.1)";
  toggleWrapper.style.transition = "background 0.3s ease";

  const label = document.createElement("p");
  label.innerText = "Auto-Scroll";
  label.style.color = "#FFF";
  label.style.fontSize = "14px";
  label.style.margin = "0";

  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.id = "myInjectedToggle";
  toggle.style.display = "none";
  toggle.checked = isEnabled;

  const slider = document.createElement("span");
  slider.className = "slider";
  slider.style.width = "40px";
  slider.style.height = "20px";
  slider.style.background = isEnabled ? "#FFD600" : "#666";
  slider.style.borderRadius = "50px";
  slider.style.position = "relative";
  slider.style.transition = "background 0.3s";

  const circle = document.createElement("span");
  circle.style.position = "absolute";
  circle.style.width = "18px";
  circle.style.height = "18px";
  circle.style.background = "white";
  circle.style.borderRadius = "50%";
  circle.style.top = "1px";
  circle.style.left = isEnabled ? "20px" : "2px";
  circle.style.transition = "left 0.3s";

  slider.appendChild(circle);
  toggleWrapper.appendChild(label);
  toggleWrapper.appendChild(slider);

  toggleWrapper.addEventListener("click", () => {
    chrome.storage.sync.get("autoReelsStart", (data) => {
      const newState = !data.autoReelsStart;
      chrome.storage.sync.set({ autoReelsStart: newState }, () => {
        toggleAutoScrolling(newState); // ✅ Only refreshes when the toggle is clicked
      });
    });
  });

  document.body.appendChild(toggleWrapper);
}

// ✅ Function to update the toggle state visually
function updateToggleState(isEnabled) {
  const slider = document.querySelector("#myInjectedToggleWrapper .slider");
  const circle = slider?.querySelector("span");

  if (slider && circle) {
    slider.style.background = isEnabled ? "#FFD600" : "#666";
    circle.style.left = isEnabled ? "20px" : "2px";
  }
}

// ✅ Function to remove toggle when leaving Reels
function removeToggle() {
  const toggleWrapper = document.querySelector("#myInjectedToggleWrapper");
  if (toggleWrapper) toggleWrapper.remove();
}

// ✅ Start Auto-Scrolling
function startAutoScrolling() {
  console.log("Auto-scrolling enabled");
  setInterval(() => {
    if (!appIsRunning) return;
    const currentVideo = getCurrentVideo();
    if (currentVideo) {
      currentVideo.removeAttribute("loop");
      currentVideo.addEventListener("ended", onVideoEnd);
    }
  }, 100);
}

// ✅ Stop Auto-Scrolling
function stopAutoScrolling() {
  console.log("Auto-scrolling disabled");
}

// ✅ Handle video end event
function onVideoEnd() {
  if (!appIsRunning) return;
  const nextVideo = getNextVideo();
  if (nextVideo) scrollToNextVideo(nextVideo);
}

// ✅ Utility functions
function getCurrentVideo() {
  return [...document.querySelectorAll("main video")].find((video) => {
    const rect = video.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
}

function getNextVideo() {
  const videos = document.querySelectorAll("main video");
  const currentIndex = [...videos].findIndex(
    (video) => video === getCurrentVideo()
  );
  return videos[currentIndex + 1] || null;
}

function scrollToNextVideo(video) {
  video.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ✅ Listen for URL changes
new MutationObserver(checkURLAndManageApp).observe(document.body, {
  childList: true,
  subtree: true,
});
window.addEventListener("popstate", checkURLAndManageApp);
checkURLAndManageApp();

// ✅ Listen for popup toggle events
chrome.runtime.onMessage.addListener((message) => {
  if (message.event === "toggleAutoReels") {
    toggleAutoScrolling(message.state);
  }
  if (message.event === "toggleInjectButton") {
    chrome.storage.sync.set({ injectReelsButton: message.state }, () => {
      injectToggle(message.state);
    });
  }
});
