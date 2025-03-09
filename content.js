let appIsRunning = false;

chrome.storage.sync.get("autoReelsStart", (data) => {
    if (data.autoReelsStart) startAutoScrolling();
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.event === "toggleAutoReels") {
        message.state ? startAutoScrolling() : stopAutoScrolling();
    } else if (message.event === "toggleButtonInjection") {
        message.state ? injectButton() : removeButton();
    }
});

function startAutoScrolling() {
    appIsRunning = true;
    console.log("Auto-scrolling enabled");

    setInterval(() => {
        if (!appIsRunning) return;
        const currentVideo = getCurrentVideo();
        if (currentVideo) {
            currentVideo.removeAttribute("loop");
            currentVideo.addEventListener("ended", onVideoEnd);
        }
    }, 100);
}

function stopAutoScrolling() {
    appIsRunning = false;
    console.log("Auto-scrolling disabled");
}

function onVideoEnd() {
    if (!appIsRunning) return;
    const nextVideo = getNextVideo();
    if (nextVideo) nextVideo.scrollIntoView({ behavior: "smooth", block: "center" });
}

function getCurrentVideo() {
    return [...document.querySelectorAll("main video")].find(video => {
        const rect = video.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
}

function getNextVideo() {
    const videos = document.querySelectorAll("main video");
    return videos[[...videos].findIndex(v => v === getCurrentVideo()) + 1] || null;
}

// Injects a toggle button in Reels page
function injectButton() {
    if (document.getElementById("reels-toggle-button")) return;

    const btn = document.createElement("button");
    btn.innerText = "Toggle Auto-Scroll";
    btn.id = "reels-toggle-button";
    btn.style.position = "fixed";
    btn.style.bottom = "100px";
    btn.style.right = "20px";
    btn.style.padding = "10px";
    btn.style.background = "#4CAF50";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => chrome.runtime.sendMessage({ event: "toggleAutoReels", state: !appIsRunning }));

    document.body.appendChild(btn);
}

function removeButton() {
    const btn = document.getElementById("reels-toggle-button");
    if (btn) btn.remove();
}
