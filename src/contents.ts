import "src/style/index.scss";
import HtmlParser from "./libs/htmlparser";

const layerIframeWork = "becu-iframe-popup";

let parser = new HtmlParser();

let currentMode: string | undefined;
let unwantedTagName: string | undefined;
const unwantedTagNameSet = new Set<string>();

const showIframeLayer = async (extractType: string | undefined) => {
  chrome.storage.local.set({ 'extractType': extractType });
  const appElement = document.querySelector(`#${layerIframeWork}`);
  let iframe;

  if (appElement) iframe = appElement.querySelector("iframe");
  else {
    const newAppElement = document.createElement("div");
    newAppElement.style.position = "fixed";
    newAppElement.style.top = "100px";
    newAppElement.style.right = "100px";
    newAppElement.style.width = "420px";
    newAppElement.style.minHeight = "400px";
    newAppElement.style.display = "inline-block";
    newAppElement.style.margin = "0";
    newAppElement.style.padding = "0";
    newAppElement.style.border = "1px solid #e4e6fe";
    newAppElement.style.backgroundColor = "white";
    newAppElement.style.zIndex = "9999999";
    newAppElement.id = layerIframeWork;

    iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "530px";
    iframe.style.border = "none";
    iframe.style.overflowX = "hidden";
    iframe.style.overflowY = "auto";
    iframe.src = chrome.runtime.getURL("/src/preview.html");

    newAppElement.appendChild(iframe);
    document.body.appendChild(newAppElement);
  }

  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({}, "*");
  } else {
    console.error("iframe or iframe.contentWindow is null");
  }
};

const hideIframeLayer = () => {
  currentMode = undefined;
  chrome.storage.local.set({ 'extractType': undefined });
  let hiding = true;
  while (hiding) {
    const element = document.querySelector(`#${layerIframeWork}`);
    if (element) element.remove();
    else hiding = false;
  }
}

document.addEventListener('mouseover', (event) => {
  if (currentMode === 'extract') {
    const target = event.target as HTMLElement;
    if (target.closest(`#${layerIframeWork}`)) return;
    target.style.outline = '3px solid rgba(138, 43, 226, 0.5)';
    target.style.backgroundColor = 'rgba(230, 230, 250, 0.6)';
  } else if (currentMode === 'extract_unwanted') {
    if (unwantedTagName) {
      const target = event.target as HTMLElement;
      const parentElement = document.querySelector(unwantedTagName);
      if (parentElement && parentElement.contains(target) && target !== parentElement) {
        target.style.outline = '3px solid rgba(255, 165, 0, 0.5)';
        target.style.backgroundColor = 'rgba(255, 255, 224, 0.6)';
      }
    }
  }
});

document.addEventListener('mouseout', (event) => {
  if (currentMode === 'extract') {
    const target = event.target as HTMLElement;
    if (target.closest(`#${layerIframeWork}`)) return;
    target.style.outline = '';
    target.style.backgroundColor = '';
  } else if (currentMode === 'extract_unwanted') {
    if (unwantedTagName) {
      const target = event.target as HTMLElement;
      const parentElement = document.querySelector(unwantedTagName);
      if (parentElement && parentElement.contains(target) && target !== parentElement) {
        let isUnwanted = false;
        for (const selector of unwantedTagNameSet) {
          const matchingElements = parentElement.querySelectorAll(selector);
          if (Array.from(matchingElements).some(el => el === target)) {
            isUnwanted = true;
            break;
          }
        }
        if (!isUnwanted) {
          target.style.outline = '';
          target.style.backgroundColor = '';
        }
      }
    }
  }
});

document.addEventListener('click', async (event) => {
  if (currentMode === 'extract') {
    event.preventDefault();
    const target = event.target as HTMLElement;
    if (target.closest(`#${layerIframeWork}`)) return;
    const anchorTags = target.querySelectorAll('a');

    const selector = parser.getCssSelectorPath(target);
    target.style.outline = '';
    target.style.backgroundColor = '';

    const appElement = document.querySelector(`#${layerIframeWork}`) as HTMLElement;
    if (appElement) {
      appElement.style.width = "420px";
      appElement.style.height = "auto";
      appElement.style.minHeight = "400px";
      appElement.style.border = '1px solid #e4e6fe';
      appElement.style.backgroundColor = 'white';
      appElement.style.borderRadius = '0px';
      appElement.style.cssText += 'box-shadow: none;';
      const iframe = appElement.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.style.height = "530px";
      }
    }
    const iframe = appElement.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'ELEMENT_SELECTED',
        data: {
          selector: selector,
          hasAnchorTags: anchorTags.length > 0 || target.tagName.toLowerCase() === 'a'
        }
      }, '*');
    }

    currentMode = undefined;
  } else if (currentMode === 'extract_unwanted') {
    if (unwantedTagName) {
      const target = event.target as HTMLElement;
      const parentElement = document.querySelector(unwantedTagName);
      if (parentElement && parentElement.contains(target) && target !== parentElement) {
        event.preventDefault();
        let selector = '';
        if (target.id) {
          selector = `#${target.id}`;
        } else if (target.classList.length > 0) {
          selector = `${target.tagName.toLowerCase()}.${target.classList[0]}`;
        } else {
          selector = target.tagName.toLowerCase();
        }
        if (unwantedTagNameSet.has(selector)) {
          unwantedTagNameSet.delete(selector);
          parentElement.querySelectorAll(selector).forEach(element => {
            if (element instanceof HTMLElement) {
              element.style.outline = '';
              element.style.backgroundColor = '';
            }
          });
        } else {
          parentElement.querySelectorAll(selector).forEach(element => {
            if (element instanceof HTMLElement) {
              element.style.outline = '3px solid rgba(255, 165, 0, 0.5)';
              element.style.backgroundColor = 'rgba(255, 255, 224, 0.6)';
            }
          });
          unwantedTagNameSet.add(selector);
        }

        const iframeElement = document.querySelector(`#${layerIframeWork} iframe`) as HTMLIFrameElement;
        if (iframeElement && iframeElement.contentWindow) {
          iframeElement.contentWindow.postMessage({
            action: 'UNWANTED_ELEMENT_SELECTED',
            data: Array.from(unwantedTagNameSet).join(',')
          }, '*');
        }
      }
    }
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.action) {
    case "showIframeLayer":
      showIframeLayer(request.data);
      break;
    case 'hideIframeLayer':
      hideIframeLayer();
      break;
  }
  sendResponse({ result: "success" });
  return true;
});


window.addEventListener('message', (event) => {
  if (event.data.action === 'EXTRACT_START') {
    const appElement = document.querySelector(`#${layerIframeWork}`) as HTMLElement | null;
    if (appElement) {
      appElement.style.width = "80px";
      appElement.style.height = "44px";
      appElement.style.minHeight = "44px";
      appElement.style.border = 'none';
      appElement.style.backgroundColor = 'transparent';
      appElement.style.borderRadius = '4px';
      appElement.style.cssText += 'box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);';
      const iframe = appElement.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.style.height = "100%";
      }
    }
    currentMode = 'extract';
  } else if (event.data.action === 'EXTRACT_UNWANTED') {
    const appElement = document.querySelector(`#${layerIframeWork}`) as HTMLElement | null;
    if (appElement) {
      appElement.style.width = "600px";
      appElement.style.height = "44px";
      appElement.style.minHeight = "44px";
      appElement.style.border = 'none';
      appElement.style.backgroundColor = 'transparent';
      appElement.style.borderRadius = '4px';
      appElement.style.cssText += 'box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);';
      const iframe = appElement.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.style.height = "100%";
      }
    }
    // 선택된 요소 가져오기
    unwantedTagName = event.data.data.tagName;
    const targetElement = document.querySelector(`${unwantedTagName}`) as HTMLElement | null;
    const unwantedTag = event.data.data.unwantedTag;
    unwantedTagNameSet.clear();

    // 딤 레이어 생성 및 추가 z
    const dimLayer = document.createElement('div');
    dimLayer.id = 'becu-dim-layer';
    dimLayer.style.position = 'fixed';
    dimLayer.style.top = '0';
    dimLayer.style.left = '0';
    dimLayer.style.width = '100%';
    dimLayer.style.height = '100%';
    dimLayer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    dimLayer.style.zIndex = '9999990';
    dimLayer.style.pointerEvents = 'all';
    document.body.appendChild(dimLayer);

    if (targetElement) {
      targetElement.style.position = 'relative';
      targetElement.style.zIndex = '9999991';
      targetElement.style.pointerEvents = 'auto';

      targetElement.style.boxShadow = '0 0 0 2000px rgba(0, 0, 0, 0.6)';
      targetElement.style.outline = '3px solid rgba(138, 43, 226, 0.8)';

      unwantedTag.split(',').forEach((tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag) {
          unwantedTagNameSet.add(trimmedTag);
        }
      });
      unwantedTagNameSet.forEach(selector => {
        const elements = targetElement.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.outline = '3px solid rgba(255, 165, 0, 0.5)';
            element.style.backgroundColor = 'rgba(255, 255, 224, 0.6)';
          }
        });
      });
    }
    currentMode = 'extract_unwanted';
  } else if (event.data.action === 'EXTRACT_UNWANTED_DONE') {
    const appElement = document.querySelector(`#${layerIframeWork}`) as HTMLElement | null;
    if (appElement) {
      appElement.style.width = "420px";
      appElement.style.height = "auto";
      appElement.style.minHeight = "400px";
      appElement.style.border = '1px solid #e4e6fe';
      appElement.style.backgroundColor = 'white';
      appElement.style.borderRadius = '0px';
      appElement.style.cssText += 'box-shadow: none;';
      const iframe = appElement.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.style.height = "530px";
      }
    }
    const targetElement = document.querySelector(`${unwantedTagName}`) as HTMLElement | null;
    if (targetElement) {
      targetElement.style.position = '';
      targetElement.style.zIndex = '';
      targetElement.style.pointerEvents = '';
      targetElement.style.boxShadow = '';
      targetElement.style.outline = '';
      for (const selector of unwantedTagNameSet) {
        const matchingElements = targetElement.querySelectorAll(selector);
        matchingElements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.outline = '';
            element.style.backgroundColor = '';
          }
        });
      }
    }

    const dimLayer = document.querySelector('#becu-dim-layer') as HTMLElement | null;
    if (dimLayer) {
      document.body.removeChild(dimLayer);
    }

    unwantedTagNameSet.clear();
    unwantedTagName = undefined;
    currentMode = undefined;
  } else if (event.data.action === 'EXTRACT_CANCEL') {
    const appElement = document.querySelector(`#${layerIframeWork}`) as HTMLElement | null;
    if (appElement) {
      appElement.style.width = "420px";
      appElement.style.height = "auto";
      appElement.style.minHeight = "400px";
      appElement.style.border = '1px solid #e4e6fe';
      appElement.style.backgroundColor = 'white';
      appElement.style.borderRadius = '0px';
      appElement.style.cssText += 'box-shadow: none;';
      const iframe = appElement.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.style.height = "530px";
      }
    }
    currentMode = undefined;
  }
});