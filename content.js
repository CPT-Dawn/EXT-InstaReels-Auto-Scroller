let isOnReels = false;
let appIsRunning = false;
let newVideoObserver;

// Function to toggle auto-scrolling
function toggleAutoScrolling(state) {
  appIsRunning = state;
  chrome.storage.sync.set({ autoReelsStart: state });
  console.log(`Auto-scrolling ${state ? "started" : "stopped"}.`);
  state ? startAutoScrolling() : stopAutoScrolling();
}

// Function to check the URL and start/stop the app accordingly
function checkURLAndManageApp() {
  const isOnReelsPage = window.location.href.startsWith(
    "https://www.instagram.com/reels/"
  );
  if (isOnReelsPage && !isOnReels) {
    isOnReels = true;
    chrome.storage.sync.get("autoReelsStart", (result) => {
      if (result.autoReelsStart) toggleAutoScrolling(true);
    });
  } else if (!isOnReelsPage && isOnReels) {
    isOnReels = false;
    toggleAutoScrolling(false);
  }
}

// Function to start auto-scrolling
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

// Function to stop auto-scrolling
function stopAutoScrolling() {
  console.log("Auto-scrolling disabled");
}

// Function to handle video end event
function onVideoEnd() {
  if (!appIsRunning) return;
  const nextVideo = getNextVideo();
  if (nextVideo) scrollToNextVideo(nextVideo);
}

// Utility functions
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

// MutationObserver to track URL changes
new MutationObserver(checkURLAndManageApp).observe(document.body, {
  childList: true,
  subtree: true,
});
window.addEventListener("popstate", checkURLAndManageApp);
checkURLAndManageApp();

// Listener for toggle button in popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.event === "toggleAutoReels") {
    toggleAutoScrolling(message.state);
  }
});
