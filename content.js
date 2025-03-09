let appIsRunning = false;

// Function to inject the toggle button in a visible location
function injectToggleButton() {
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

    // Load saved state and set button opacity
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
        if (!appIsRunning) return;
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

// Observe page changes and inject the button when needed
const observer = new MutationObserver(injectToggleButton);
observer.observe(document.body, { childList: true, subtree: true });

// Initial button injection
injectToggleButton();
