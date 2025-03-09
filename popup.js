document.addEventListener("DOMContentLoaded", () => {
    const autoReelsToggle = document.getElementById("autoReelsToggle");
    const injectToggleButton = document.getElementById("injectToggleButton");

    chrome.storage.sync.get(["autoReelsStart", "showToggleButton"], (data) => {
        autoReelsToggle.checked = data.autoReelsStart || false;
        injectToggleButton.checked = data.showToggleButton || false;
    });

    function refreshPage() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
        });
    }

    autoReelsToggle.addEventListener("change", () => {
        const newState = autoReelsToggle.checked;
        chrome.storage.sync.set({ autoReelsStart: newState }, () => {
            chrome.runtime.sendMessage({ event: "toggleAutoReels", state: newState });
            refreshPage();
        });
    });

    injectToggleButton.addEventListener("change", () => {
        const newState = injectToggleButton.checked;
        chrome.storage.sync.set({ showToggleButton: newState }, () => {
            chrome.runtime.sendMessage({ event: "toggleButtonInjection", state: newState });
            refreshPage();
        });
    });
});
