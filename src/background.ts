const sendMessageToActiveTab = ({
  action,
  data,
  sendResponse,
}: {
  action: string;
  data?: any;
  sendResponse: any;
}) => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action, data }, response => {
        if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
        sendResponse({ result: 'success', response });
      });
    }
  });
};

chrome.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case 'install':
      // console.log(reason);
      break;
    case 'update':
      // console.log(reason);
      break;
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const command = message.action;
  const data = message.data;

  switch (command) {
    case 'collectCookie':
      sendMessageToActiveTab({
        action: 'COLLECT_COOKIE',
        data: data,
        sendResponse,
      });
      break;
  }

  return true;
});
