document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("autoReelsToggle");
    const toggleBackground = document.querySelector(".toggle-background");
    const toggleCircle = document.querySelector(".toggle-circle");

    // Load the stored state
    chrome.storage.sync.get("autoReelsStart", (data) => {
        const isEnabled = data.autoReelsStart || false;
        toggle.checked = isEnabled;
        updateToggleUI(isEnabled);
    });

    // Listen for toggle changes
    toggle.addEventListener("change", () => {
        const newState = toggle.checked;
        chrome.storage.sync.set({ autoReelsStart: newState });

        // Update UI immediately
        updateToggleUI(newState);

        // Send message to content.js
        chrome.runtime.sendMessage({ event: "toggleAutoReels", state: newState });

        // Refresh the page after toggling
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    });

    // Function to update the toggle UI
    function updateToggleUI(isEnabled) {
        if (isEnabled) {
            toggleBackground.style.background = "#ff4081";
            toggleCircle.style.transform = "translateX(26px)";
        } else {
            toggleBackground.style.background = "#666";
            toggleCircle.style.transform = "translateX(0)";
        }
    }
});
