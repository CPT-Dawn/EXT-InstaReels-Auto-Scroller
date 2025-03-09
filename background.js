chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.event === "toggleAutoReels") {
    chrome.storage.sync.set({ autoReelsStart: message.state }, () => {
      console.log("Auto Scroll state saved:", message.state);
    });
  }

  if (message.event === "toggleInjectButton") {
    chrome.storage.sync.set({ injectReelsButton: message.state }, () => {
      console.log("Inject Button state saved:", message.state);
    });
  }

  // ✅ Refresh active tab to apply changes
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
});
