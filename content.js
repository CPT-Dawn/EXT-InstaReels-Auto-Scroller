// ----------- State Variables ----------- //
// Flags to track if the user is on the Reels page and if the app is running
let isOnReels = false;
let appIsRunning = false;
let newVideoObserver;
let instagramObserver;

// Function to stop the app when the user navigates away from Reels
function stopApp() {
  if (appIsRunning) {
    appIsRunning = false;
    console.log("App stopped (navigated away from /reels/).");

    // Disconnect the observer to stop watching for new videos
    if (newVideoObserver) {
      newVideoObserver.disconnect();
      console.log("IntersectionObserver disconnected.");
    }
  }
}

// Function to check the URL and manage the app's state accordingly
function checkURLAndManageApp() {
  const isOnInstagram = window.location.href.startsWith("https://www.instagram.com/");
  const isOnReelsPage = window.location.href.startsWith("https://www.instagram.com/reels/");

  if (isOnInstagram && isOnReelsPage && !isOnReels) {
    isOnReels = true;
    initializeExtension(); // Start the app
  } else if ((isOnInstagram && !isOnReelsPage) || !isOnInstagram) {
    if (isOnReels) {
      isOnReels = false;
      stopApp(); // Stop the app
    }
  }
}

// Observe URL changes using MutationObserver to detect navigation changes
let lastUrl = window.location.href;
instagramObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    checkURLAndManageApp();
  }
});

instagramObserver.observe(document.body, {
  childList: true,
  subtree: true,
});

// Listen for history navigation events (pushState, replaceState, popstate)
(function (history) {
  const pushState = history.pushState;
  const replaceState = history.replaceState;

  history.pushState = function () {
    pushState.apply(history, arguments);
    checkURLAndManageApp();
  };

  history.replaceState = function () {
    replaceState.apply(history, arguments);
    checkURLAndManageApp();
  };
})(window.history);

window.addEventListener("popstate", checkURLAndManageApp);

// Initial URL check when the page loads
checkURLAndManageApp();

// ----------- App-Specific Logic ----------- //

// Function to initialize the extension when the user is on Reels
function initializeExtension() {
  if (!appIsRunning) {
    appIsRunning = true;
    console.log("App started on /reels/.");

    // ----------- HTML Selectors ----------- //
    const VIDEOS_LIST_SELECTOR = "main video";

    // ----------- State Variables ----------- //
    let applicationIsOn = true;
    let autoReelsStart;

    // Fetch stored setting for auto-scrolling and start if enabled
    function getStoredAutoReelsStart() {
      chrome.storage.sync.get(["autoReelsStart"], (result) => {
        autoReelsStart = result.autoReelsStart;
        console.log("Auto Reels Start setting:", autoReelsStart);
        if (autoReelsStart) startAutoScrolling();
      });
    }

    // Load the auto-scroll setting from storage
    getStoredAutoReelsStart();

    // Listen for storage changes to update auto-scroll setting dynamically
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync") {
        if (changes.autoReelsStart) {
          autoReelsStart = changes.autoReelsStart.newValue;
          console.log("Updated autoReelsStart:", autoReelsStart);
        }
      }
    });

    // Handle messages from background scripts or popup to toggle auto-scrolling
    chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
      if (data.event === "toggleAutoReels") {
        if (data.action === "start") {
          chrome.storage.sync.set({ autoReelsStart: true });
          getStoredAutoReelsStart();
          startAutoScrolling();
        } else if (data.action === "stop") {
          chrome.storage.sync.set({ autoReelsStart: false });
          getStoredAutoReelsStart();
          stopAutoScrolling();
        }
      }
    });

    // Start auto-scrolling through reels
    function startAutoScrolling() {
      console.log("Start auto-scrolling");
      if (!applicationIsOn) {
        applicationIsOn = true;
        chrome.storage.sync.set({ applicationIsOn: true });
        console.log("Auto-scrolling started.");
      }

      setTimeout(() => {
        if (autoReelsStart) beginAutoScrollLoop();
      }, 500);
    }

    // Stop auto-scrolling
    function stopAutoScrolling() {
      if (applicationIsOn) {
        applicationIsOn = false;
        chrome.storage.sync.set({ applicationIsOn: false });
        console.log("Auto-scrolling stopped.");
      }
    }

    // Loop to check when to scroll to the next video
    function beginAutoScrollLoop() {
      setInterval(() => {
        if (applicationIsOn) {
          const currentVideo = getCurrentVideo();
          if (currentVideo) {
            currentVideo.removeAttribute("loop");
            currentVideo.addEventListener("ended", onVideoEnd);
          }
        }
      }, 100);
    }

    // Event listener for when a video ends, triggering the next one
    function onVideoEnd() {
      const currentVideo = getCurrentVideo();
      if (!currentVideo) return;
      const nextVideoInfo = getNextVideo(currentVideo);
      const nextVideo = nextVideoInfo[0];
      if (nextVideo && autoReelsStart) {
        scrollToNextVideo(nextVideo);
      }
    }

    // Find the next video after the current one
    function getNextVideo(currentVideo) {
      const videos = Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR));
      const index = videos.findIndex((vid) => vid === currentVideo);
      return [videos[index + 1] || null];
    }

    // Scroll to the next video in the list
    function scrollToNextVideo(nextVideo) {
      if (nextVideo) {
        nextVideo.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
        console.log("Scrolling to the next video.");
      }
    }

    // Get the currently visible video
    function getCurrentVideo() {
      return Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR)).find((video) => {
        const rect = video.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
      });
    }

    // Set up observer to track new videos being loaded
    newVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!appIsRunning) return;
        if (entry.isIntersecting) console.log("Video is in view:", entry.target);
      });
    }, { threshold: 0.5 });

    // Observe all videos on the page
    function observeAllVideos() {
      document.querySelectorAll("main video").forEach((video) => newVideoObserver.observe(video));
    }
    observeAllVideos();
  }
}
