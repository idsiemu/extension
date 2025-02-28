const sendMessageToActiveTab = (action: string, sendResponse: any) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action }, (response) => {
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
      sendMessageToActiveTab(action, sendResponse);
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
            const href = (element as HTMLAnchorElement).href;
            if (href) {
              window.location.href = href;
              return true;
            }
            (element as HTMLElement).click();
          }
          return false;
        },
        args: [data.selector]
      }).catch(error => {
        chrome.tabs.onUpdated.removeListener(tabUpdateListener);
        sendResponse({ success: false, error: error.message });
      });
      break;
    // case "elementClicked":
    //   console.log(data);
    //   const elementData = message.data;
    //   // 데이터를 React 컴포넌트로 전달
    //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //     if (tabs[0].id) {
    //       chrome.tabs.sendMessage(tabs[0].id, { action: 'renderElement', data: elementData });
    //     }
    //   });
    //   break;
    case "FROM_PAGE":
      const { key, value } = data;
      chrome.storage.local.set({ [key]: value }, () => {
        console.log(`Value saved: ${key} = ${value}`);
      });
      break;
    case "GET_DATA":
      console.log(data);
      chrome.storage.local.get([data.key], (result) => {
        sendResponse(result[data.key]);
      });
      break;
  }

  return true;
});
