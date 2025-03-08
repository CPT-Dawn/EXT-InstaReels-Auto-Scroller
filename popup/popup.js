document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("autoReelsToggle");
    const toggleBackground = document.getElementById("toggleBackground");
    const toggleCircle = document.getElementById("toggleCircle");

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
            toggleBackground.classList.remove("bg-gray-500");
            toggleBackground.classList.add("bg-pink-500");
            toggleCircle.classList.add("translate-x-6");
        } else {
            toggleBackground.classList.remove("bg-pink-500");
            toggleBackground.classList.add("bg-gray-500");
            toggleCircle.classList.remove("translate-x-6");
        }
    }
});
