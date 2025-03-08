document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("autoReelsToggle");
  
    // Load saved state
    chrome.storage.sync.get("autoReelsStart", (data) => {
      toggle.checked = data.autoReelsStart || false;
    });
  
    // Listen for toggle changes
    toggle.addEventListener("change", () => {
      const newState = toggle.checked;
      chrome.storage.sync.set({ autoReelsStart: newState });
      chrome.runtime.sendMessage({ event: "toggleAutoReels", state: newState });
    });
  });
  