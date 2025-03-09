let appIsRunning = false;
let currentURL = window.location.href;

// Function to check if we are on the Reels page
function isOnReelsPage() {
    return window.location.href.startsWith("https://www.instagram.com/reels/");
}

// Function to inject the toggle button
function injectToggleButton() {
    // Remove button if not on Reels page
    if (!isOnReelsPage()) {
        const existingButton = document.getElementById("instaAutoScrollToggle");
        if (existingButton) existingButton.remove();
        return;
    }

    // Prevent duplicate buttons
    if (document.getElementById("instaAutoScrollToggle")) return;

    // Create the toggle button
    const toggleButton = document.createElement("button");
    toggleButton.id = "instaAutoScrollToggle";
    toggleButton.innerText = "🔄 Auto-Scroll";
    toggleButton.style.cssText = `
        position: fixed;
        top: 15px;
        right: 15px;
        background: rgba(255, 64, 129, 0.9);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        z-index: 99999;
    `;

    // Load saved toggle state and update button opacity
    chrome.storage.sync.get("autoReelsStart", (data) => {
        toggleButton.style.opacity = data.autoReelsStart ? "1" : "0.5";
    });

    // Toggle button click event
    toggleButton.addEventListener("click", () => {
        chrome.storage.sync.get("autoReelsStart", (data) => {
            const newState = !data.autoReelsStart;
            chrome.storage.sync.set({ autoReelsStart: newState });

            toggleButton.style.opacity = newState ? "1" : "0.5";

            // Send message to background script
            chrome.runtime.sendMessage({ event: "toggleAutoReels", state: newState });

            // Refresh page
            location.reload();
        });
    });

    // Append button to the page
    document.body.appendChild(toggleButton);
}

// Function to start auto-scrolling
function autoScrollReels() {
    setInterval(() => {
        if (!appIsRunning || !isOnReelsPage()) return;
        const currentVideo = document.querySelector("main video");
        if (currentVideo) {
            currentVideo.removeAttribute("loop");
            currentVideo.addEventListener("ended", () => {
                window.scrollBy(0, window.innerHeight);
            });
        }
    }, 100);
}

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.event === "toggleAutoReels") {
        appIsRunning = message.state;
        if (appIsRunning) autoScrollReels();
    }
});

// Observe page changes and manage button visibility
const observer = new MutationObserver(() => {
    if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        injectToggleButton();
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial check to inject or remove the button
injectToggleButton();
