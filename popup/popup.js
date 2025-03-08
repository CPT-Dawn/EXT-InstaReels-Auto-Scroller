document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("autoReelsToggle");

    chrome.storage.sync.get("autoReelsStart", (data) => {
        toggle.checked = data.autoReelsStart || false;
    });

    toggle.addEventListener("change", () => {
        const newState = toggle.checked;
        chrome.storage.sync.set({ autoReelsStart: newState });

        // Send a message to content.js to toggle the feature
        chrome.runtime.sendMessage({ event: "toggleAutoReels", state: newState });

        // Refresh the page after a slight delay to ensure state is saved
        setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        }, 200);
    });
});
