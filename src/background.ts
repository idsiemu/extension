const sendMessageToActiveTab = ({ action, data, sendResponse }: { action: string, data?: any, sendResponse: any }) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action, data }, (response) => {
        if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
        sendResponse({ result: "success", response });
      });
    }
  });
};

chrome.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "install":
      // console.log(reason);
      break;
    case "update":
      // console.log(reason);
      break;
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const command = message.action;
  const data = message.data;

  switch (command) {
    case "createtab":
      if (data.url === "activeurl") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => chrome.tabs.create({ url: tabs[0].url }));
      } else chrome.tabs.create({ url: data.url });
      break;
    case "tabid":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => sendResponse({ result: "success", tabId: tabs[0].id }));
      break;
    case "checktabid":
      break;
    case "toggleIframeLayer":
      const action = data.flag ? "showIframeLayer" : "hideIframeLayer";
      sendMessageToActiveTab({ action, data: data.type, sendResponse });
      break;
    case "linkClicked":
      const clickedTabId = data.tabId;
      const tabUpdateListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
        if (tabId === clickedTabId && changeInfo.status === 'complete') {
          sendResponse({ success: true, url: tab.url });
          chrome.tabs.onUpdated.removeListener(tabUpdateListener);
        }
      };
      chrome.tabs.onUpdated.addListener(tabUpdateListener);
      chrome.scripting.executeScript({
        target: { tabId: data.tabId },
        func: (selector: string) => {
          const element = document.querySelector(selector);
          if (element) {
            if (element instanceof HTMLAnchorElement && element.href) {
              window.location.href = element.href;
              return true;
            }
            const anchorInside = element.querySelector('a');
            if (anchorInside && anchorInside.href) {
              window.location.href = anchorInside.href;
              return true;
            }
            (element as HTMLElement).click();
          }
          return false;
        },
        args: [data.selector]
      }).then(response => {
        if (!response[0].result) {
          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(tabUpdateListener);
            sendResponse({ success: false, error: "클릭 후 페이지 변경이 감지되지 않았습니다. 클릭 이벤트가 없는 엘리먼트일 수 있습니다." });
          }, 3000);
        }
      }).catch(error => {
        chrome.tabs.onUpdated.removeListener(tabUpdateListener);
        sendResponse({ success: false, error: error.message });
      });
      break;
  }

  return true;
});
