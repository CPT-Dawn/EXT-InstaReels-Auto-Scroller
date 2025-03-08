chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');

    chrome.storage.sync.get(["autoReelsStart", "applicationIsOn"], (result) => {
      if (result.autoReelsStart === undefined) {
        chrome.storage.sync.set({ autoReelsStart: true });
      }
      if (result.applicationIsOn === undefined) {
        chrome.storage.sync.set({ applicationIsOn: true });
      }
      console.log("Set up keys.");
    });
  });

chrome.runtime.onMessage.addListener(data => {
  switch(data.event) {

    case "autoReelsStart":
        {
          console.log("Updating autoReelsStart to: " + data.autoReelsValue)
          chrome.storage.sync.set( {"autoReelsStart" : data.autoReelsValue} )
          break;
        }

  }
})
