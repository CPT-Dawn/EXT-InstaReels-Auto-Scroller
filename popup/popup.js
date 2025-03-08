// Get references to the toggle switch and start/stop button in the popup UI.
const autoReelsToggle = document.getElementById("autoReelsToggle");
const startButton = document.getElementById("startStopButton");

// Retrieve the "autoReelsStart" value from Chrome's synced storage when the popup opens.
chrome.storage.sync.get("autoReelsStart", (result) => {
    console.log(result); // Debugging: Log the retrieved storage result.
    
    autoReelsStartValue = result.autoReelsStart; // Store the retrieved value.
    console.log("autoReelsStart original value on startup: ", autoReelsStartValue);
    
    // Set the toggle switch's checked state based on the stored value.
    autoReelsToggle.checked = autoReelsStartValue;

    // Set the button text based on the current state (Start or Stop).
    startButton.textContent = autoReelsStartValue ? "Stop" : "Start";
});

// Event listener for the toggle switch.
autoReelsToggle.onclick = () => {
    const autoReelsValue = autoReelsToggle.checked; // Get the new toggle state.

    // Send a message to the background script to update the storage.
    chrome.runtime.sendMessage({ event: "autoReelsStart", autoReelsValue });
};

// Event listener for the Start/Stop button.
startButton.addEventListener("click", () => {
    // Determine if the button should start or stop the reels.
    const isStarting = startButton.textContent === "Start";

    // Toggle the button text (Start <-> Stop).
    startButton.textContent = isStarting ? "Stop" : "Start";

    // Send a message to the content script in the active tab to start/stop the reels.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        event: "toggleAutoReels",
        action: isStarting ? "start" : "stop",
      });
    });
});
