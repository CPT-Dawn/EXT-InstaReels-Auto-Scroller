// This event listener runs when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');

  // Retrieve stored values for "autoReelsStart" and "applicationIsOn" from Chrome's synced storage.
  chrome.storage.sync.get(["autoReelsStart", "applicationIsOn"], (result) => {
    
    // If "autoReelsStart" is not set (undefined), initialize it to true.
    if (result.autoReelsStart === undefined) {
      chrome.storage.sync.set({ autoReelsStart: true });
    }

    // If "applicationIsOn" is not set (undefined), initialize it to true.
    if (result.applicationIsOn === undefined) {
      chrome.storage.sync.set({ applicationIsOn: true });
    }

    console.log("Set up keys."); // Log that keys have been initialized.
  });
});

// This event listener listens for messages sent from other parts of the extension (e.g., content scripts or popup scripts).
chrome.runtime.onMessage.addListener(data => {
switch(data.event) {

  // If the message event is "autoReelsStart", update its value in storage.
  case "autoReelsStart":
      {
        console.log("Updating autoReelsStart to: " + data.autoReelsValue); // Log the updated value.
        
        // Save the new value in Chrome's synced storage.
        chrome.storage.sync.set( {"autoReelsStart" : data.autoReelsValue} );
        break;
      }

}
});
