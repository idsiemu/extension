const test = () => {
  console.log("test");
};

const sendMessageToActiveTab = (action: string, sendResponse: any) => {
  console.log(11);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log(112);
    const activeTab = tabs[0];
    console.log(activeTab);
    if (activeTab && activeTab.id) {
      console.log(113);
      console.log(activeTab.id);
      console.log(114);
      chrome.tabs.sendMessage(activeTab.id, { action }, (response) => {
        console.log(response);
        console.log(115);
        if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
        sendResponse({ result: "success", response });
      });
    }
  });
};

console.log("background.ts");
chrome.runtime.onInstalled.addListener(({ reason }) => {
  test();
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

  test();
  // console.log('add listener:', command, data);
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
      console.log(123123);
      const action = data.flag ? "showIframeLayer" : "hideIframeLayer";
      sendMessageToActiveTab(action, sendResponse);
      break;
  }

  return true;
});
