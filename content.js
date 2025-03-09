let isOnReels = false;
let appIsRunning = false;

// Function to toggle auto-scrolling
function toggleAutoScrolling(state) {
  appIsRunning = state;
  chrome.storage.sync.set({ autoReelsStart: state });
  console.log(`Auto-scrolling ${state ? "started" : "stopped"}.`);
  state ? startAutoScrolling() : stopAutoScrolling();
}

// Function to check if we are on the Reels page and apply changes
function checkURLAndManageApp() {
  const isOnReelsPage = window.location.href.startsWith("https://www.instagram.com/reels/");

  if (isOnReelsPage && !isOnReels) {
    isOnReels = true;
    chrome.storage.sync.get(["autoReelsStart", "injectReelsButton"], (result) => {
      if (result.autoReelsStart) toggleAutoScrolling(true);
      if (result.injectReelsButton) injectButton();
    });
  } else if (!isOnReelsPage && isOnReels) {
    isOnReels = false;
    toggleAutoScrolling(false);
    removeButton(); // Hide the button when leaving Reels
  }
}

// Function to remove the injected button when leaving Reels
function removeButton() {
  const button = document.querySelector("#myInjectedButton");
  if (button) button.remove();
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
  const currentIndex = [...videos].findIndex((video) => video === getCurrentVideo());
  return videos[currentIndex + 1] || null;
}

function scrollToNextVideo(video) {
  video.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Function to inject a button into the Reels page
function injectButton() {
  if (document.querySelector("#myInjectedButton")) return; // Prevent duplicate buttons

  const button = document.createElement("button");
  button.innerText = "Auto Scroll";
  button.id = "myInjectedButton";
  button.style.position = "fixed";  
  button.style.right = "20px";  
  button.style.bottom = "80px";  
  button.style.zIndex = "1000";  
  button.style.padding = "10px";
  button.style.backgroundColor = "#0095F6";  
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.style.fontSize = "14px";

  document.body.appendChild(button);

  // ✅ Add click event to toggle auto-scrolling
  button.addEventListener("click", () => {
    chrome.storage.sync.get("autoReelsStart", (data) => {
      const newState = !data.autoReelsStart; // Toggle state
      chrome.storage.sync.set({ autoReelsStart: newState }, () => {
        chrome.runtime.sendMessage({ event: "toggleAutoReels", state: newState });
        location.reload(); // Refresh to apply changes
      });
    });
  });
}

// Observer to track URL changes and apply logic
new MutationObserver(checkURLAndManageApp).observe(document.body, {
  childList: true,
  subtree: true,
});
window.addEventListener("popstate", checkURLAndManageApp);
checkURLAndManageApp();

// Listener for popup toggle events
chrome.runtime.onMessage.addListener((message) => {
  if (message.event === "toggleAutoReels") {
    toggleAutoScrolling(message.state);
    location.reload(); // ✅ Refresh page on toggle change
  }
  if (message.event === "toggleInjectButton") {
    chrome.storage.sync.set({ injectReelsButton: message.state }, () => {
      console.log("Inject Button state updated:", message.state);
      location.reload(); // ✅ Refresh to apply button visibility
    });
  }
});
