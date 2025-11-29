let autoScrollEnabled = false;
let showToggleEnabled = false;
let currentVideo = null;
let videoObserver = null;
let pageObserver = null;

// ✅ Initialize the extension
function init() {
  chrome.storage.sync.get(["autoReelsStart", "injectReelsButton"], (data) => {
    autoScrollEnabled = data.autoReelsStart || false;
    showToggleEnabled = data.injectReelsButton || false;
    checkPage();
  });
}

// ✅ Listen for storage changes (Dynamic Updates)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoReelsStart) {
    autoScrollEnabled = changes.autoReelsStart.newValue;
    updateToggleState(autoScrollEnabled);
    if (autoScrollEnabled && currentVideo) {
      setupVideoListener(currentVideo);
    }
  }
});

// ✅ Check if current page is Reels
function isReelsPage() {
  return window.location.href.startsWith("https://www.instagram.com/reels/");
}

// ✅ Main Logic to Start/Stop App based on URL
function checkPage() {
  if (isReelsPage()) {
    if (showToggleEnabled) injectToggle(autoScrollEnabled);
    setupObservers();
  } else {
    cleanup();
  }
}

// ✅ Setup Observers
function setupObservers() {
  if (videoObserver) return; // Already set up

  // IntersectionObserver to detect the active video
  videoObserver = new IntersectionObserver(handleVideoIntersection, {
    threshold: 0.7, // Video is considered "active" when 70% visible
  });

  // MutationObserver to detect new videos loading (Infinite Scroll)
  pageObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          const videos = node.querySelectorAll ? node.querySelectorAll("video") : [];
          videos.forEach((video) => videoObserver.observe(video));
          if (node.tagName === "VIDEO") videoObserver.observe(node);
        }
      });
    });
  });

  pageObserver.observe(document.body, { childList: true, subtree: true });

  // Observe existing videos
  document.querySelectorAll("video").forEach((video) => videoObserver.observe(video));
}

// ✅ Handle Video Intersection
function handleVideoIntersection(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      currentVideo = entry.target;
      if (autoScrollEnabled) {
        setupVideoListener(currentVideo);
      }
    }
  });
}

// ✅ Setup Video End Listener
function setupVideoListener(video) {
  video.removeAttribute("loop");
  video.removeEventListener("ended", onVideoEnd); // Prevent duplicates
  video.addEventListener("ended", onVideoEnd);
}

// ✅ Handle Video End -> Scroll to Next
function onVideoEnd() {
  if (!autoScrollEnabled) return;
  
  const nextVideo = getNextVideo();
  if (nextVideo) {
    nextVideo.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ✅ Find the next video in the DOM
function getNextVideo() {
  if (!currentVideo) return null;
  const videos = Array.from(document.querySelectorAll("video"));
  const currentIndex = videos.indexOf(currentVideo);
  return videos[currentIndex + 1] || null;
}

// ✅ Cleanup function
function cleanup() {
  removeToggle();
  if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
  }
  if (pageObserver) {
    pageObserver.disconnect();
    pageObserver = null;
  }
  currentVideo = null;
}

// ✅ Listen for URL changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkPage();
  }
}).observe(document, { subtree: true, childList: true });

// ✅ Inject Toggle Button
function injectToggle(isEnabled) {
  if (document.getElementById("myInjectedToggleWrapper")) return;

  const toggleWrapper = document.createElement("div");
  toggleWrapper.id = "myInjectedToggleWrapper";
  Object.assign(toggleWrapper.style, {
    position: "fixed",
    right: "20px",
    bottom: "80px",
    zIndex: "1000",
    padding: "13px",
    background: "#111827",
    borderRadius: "50px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "background 0.3s ease",
  });

  const label = document.createElement("p");
  label.innerText = "Auto-Scroll";
  Object.assign(label.style, {
    color: "#FFF",
    fontSize: "14px",
    margin: "0",
  });

  const slider = document.createElement("span");
  slider.className = "slider";
  Object.assign(slider.style, {
    width: "40px",
    height: "20px",
    borderRadius: "50px",
    position: "relative",
    transition: "background 0.3s",
    display: "block",
  });

  const circle = document.createElement("span");
  Object.assign(circle.style, {
    position: "absolute",
    width: "18px",
    height: "18px",
    background: "white",
    borderRadius: "50%",
    top: "1px",
    transition: "left 0.3s",
  });

  slider.appendChild(circle);
  toggleWrapper.appendChild(label);
  toggleWrapper.appendChild(slider);

  toggleWrapper.addEventListener("click", () => {
    const newState = !autoScrollEnabled;
    chrome.storage.sync.set({ autoReelsStart: newState });
  });

  document.body.appendChild(toggleWrapper);
  updateToggleState(isEnabled);
}

// ✅ Update Toggle Visuals
function updateToggleState(isEnabled) {
  const slider = document.querySelector("#myInjectedToggleWrapper .slider");
  const circle = slider?.querySelector("span");

  if (slider && circle) {
    slider.style.background = isEnabled
      ? "radial-gradient(61.46% 59.09% at 36.25% 96.55%, #FFD600 0%, #FF6930 48.44%, #FE3B36 73.44%, rgba(254, 59, 54, 0.00) 100%)"
      : "rgba(255, 255, 255, 0.2)";
    
    circle.style.left = isEnabled ? "20px" : "2px";
  }
}

// ✅ Remove Toggle
function removeToggle() {
  const el = document.getElementById("myInjectedToggleWrapper");
  if (el) el.remove();
}

// Start
init();
