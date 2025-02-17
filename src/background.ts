chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    console.log("Tab updated:", tabId, tab.url);

    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
      })
      .then(() => {
        console.log("Content script injected successfully");
      })
      .catch((err: Error) => {
        console.error("Failed to inject content script:", err);
      });
  }
});

// 팝업 대신 창으로 열기
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: "index.html",
    type: "popup",
    width: 400,
    height: 600,
  });
});
