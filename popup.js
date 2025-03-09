document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("autoReelsToggle");

    // Load saved state
    chrome.storage.sync.get("autoReelsStart", (data) => {
        toggle.checked = data.autoReelsStart || false;
    });

    // Toggle state on change
    toggle.addEventListener("change", () => {
        const newState = toggle.checked;
        chrome.storage.sync.set({ autoReelsStart: newState });

        // Send message to content script
        chrome.runtime.sendMessage({ event: "toggleAutoReels", state: newState });

        // Refresh Instagram page
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    });
});
