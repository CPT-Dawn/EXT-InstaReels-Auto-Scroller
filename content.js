// ----------- State Variables ----------- //
let isOnReels = false;
let appIsRunning = false;
let newVideoObserver;
let instagramObserver;

// Function to stop the app
function stopApp() {
  if (appIsRunning) {
    appIsRunning = false;
    console.log("App stopped (navigated away from /reels/).");

    // Clean up logic
    if (newVideoObserver) {
      newVideoObserver.disconnect();
      console.log("IntersectionObserver disconnected.");
    }
  }
}

// Function to check the URL and manage app state
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

// Observe URL changes using MutationObserver
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

// Listen for pushState, replaceState, and popstate events
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

// Initial check when the page loads
checkURLAndManageApp();

// ----------- App-Specific Logic ----------- //

function initializeExtension() {
  if (!appIsRunning) {
    appIsRunning = true;
    console.log("App started on /reels/.");

    // ----------- HTML Selectors ----------- //
    const VIDEOS_LIST_SELECTOR = "main video";

    // ----------- State Variables ----------- //
    let applicationIsOn = true;
    let autoReelsStart;

    // ----------- Get Functions ----------- //
    function getStoredAutoReelsStart() {
      chrome.storage.sync.get(["autoReelsStart"], (result) => {
        autoReelsStart = result.autoReelsStart;
        console.log("Auto Reels Start setting:", autoReelsStart);
        if (autoReelsStart) startAutoScrolling();
      });
    }

    // ----------- Update Variables From Storage ----------- //
    getStoredAutoReelsStart();

    // ----------- Add Listeners To Change Stored Variables ----------- //
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync") {
        if (changes.autoReelsStart) {
          autoReelsStart = changes.autoReelsStart.newValue;
          console.log("Updated autoReelsStart:", autoReelsStart);
        }
      }
    });

    // Listener for start/stop button
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

    // Start auto-scrolling
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

    // Start the loop for auto-scrolling
    function beginAutoScrollLoop() {
      setInterval(() => {
        if (applicationIsOn) {
          const currentVideo = getCurrentVideo();
          if (currentVideo) {
            currentVideo.removeAttribute("loop");
            currentVideo.addEventListener("ended", onVideoEnd);
          }
        }
      }, 100); // Repeat every 100ms
    }

    // Handles the end of a video
    function onVideoEnd() {
      const currentVideo = getCurrentVideo();
      if (!currentVideo) return;

      const nextVideoInfo = getNextVideo(currentVideo);
      const nextVideo = nextVideoInfo[0];

      if (nextVideo && autoReelsStart) {
        scrollToNextVideo(nextVideo);
      }
    }

    // Find the next video based on the current one
    function getNextVideo(currentVideo) {
      const videos = Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR));
      const index = videos.findIndex((vid) => vid === currentVideo);
      return [videos[index + 1] || null]; // Return the next video or null
    }

    // Scroll to the next video
    function scrollToNextVideo(nextVideo) {
      if (nextVideo) {
        nextVideo.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "center",
        });
        console.log("Scrolling to the next video.");
      }
    }

    // Get the currently visible video on the screen
    function getCurrentVideo() {
      return Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR)).find(
        (video) => {
          const rect = video.getBoundingClientRect();
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          );
        }
      );
    }

    newVideoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!appIsRunning) {
            console.log("App is no longer running, skipping video processing.");
            return;
          }

          if (entry.isIntersecting) {
            console.log("Video is in view:", entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    // Function to start observing a video
    function observeVideo(video) {
      newVideoObserver.observe(video);
    }

    // Function to observe all videos on the page
    function observeAllVideos() {
      const videos = document.querySelectorAll("main video");
      videos.forEach((video) => observeVideo(video));
    }

    // Start observing all videos initially
    observeAllVideos();

    // Check for new videos to observe every 2 seconds
    setInterval(() => {
      document.querySelectorAll("main video").forEach((video) => observeVideo(video));
    }, 500);
  }
}
