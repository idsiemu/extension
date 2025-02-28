import "src/style/index.scss";
import HtmlParser from "./libs/htmlparser";

const layerIframeWork = "becu-iframe-popup";

let parser = new HtmlParser();

const getPageContent = async (xpath: string) => {
  const nextPageElement = await parser.getXPathElement(xpath);
  let content = nextPageElement.innerText;
  if (content === "") content = nextPageElement.innerHTML;
  return `${xpath}||${content}`;
};

const showIframeLayer = async (data: any = []) => {
  let currentMode = await localStorage.getItem("currentMode");
  if (currentMode === undefined || currentMode === null || currentMode !== "paging") currentMode = "working";

  const appElement = document.querySelector(`#${layerIframeWork}`);
  let iframe;

  if (appElement) iframe = appElement.querySelector("iframe");
  else {
    const newAppElement = document.createElement("div");
    newAppElement.style.position = "fixed";
    newAppElement.style.top = "100px";
    newAppElement.style.right = "0px";
    newAppElement.style.width = "300px";
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

  // iframe에 data 를 전송합니다.
  let xpath = currentMode === "paging" ? data : "";
  if (xpath !== "" && xpath.length > 5) xpath = await getPageContent(xpath);

  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ mode: currentMode, data, xpath }, "*");
  } else {
    console.error("iframe or iframe.contentWindow is null");
  }
};

const hideIframeLayer = () => {
  let hiding = true;
  while (hiding) {
    const element = document.querySelector(`#${layerIframeWork}`);
    if (element) element.remove();
    else hiding = false;
  }
}

document.addEventListener('mouseover', (event) => {
  const target = event.target as HTMLElement;
  target.style.outline = '2px solid rgba(255, 192, 203, 0.5)'; // 투명한 핑크색
});

document.addEventListener('mouseout', (event) => {
  const target = event.target as HTMLElement;
  target.style.outline = ''; // 스타일 제거
});

document.addEventListener('click', (event) => {
  event.preventDefault();
  const target = event.target as HTMLElement;
  const elementInfo = {
    tagName: target.tagName,
    innerText: target.innerText,
    innerHTML: target.innerHTML,
  };
  chrome.runtime.sendMessage({ action: 'elementClicked', data: elementInfo });
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.action) {
    case "showIframeLayer":
      showIframeLayer();
      break;
    case 'hideIframeLayer':
      hideIframeLayer();
      break;
  }
  sendResponse({ result: "success" });
  return true;
});


window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type && event.data.type === 'FROM_PAGE') {
    chrome.runtime.sendMessage({ action: 'FROM_PAGE', data: event.data.data });
  }

  console.log(event.data);
  if (event.data.type && event.data.type === "REQUEST_DATA") {
    console.log("--------------------------------");
    console.log(event.data.key);
    console.log("--------------------------------");
    chrome.runtime.sendMessage({ action: "GET_DATA", data: event.data.data }, (response) => {
      console.log(response);
      window.postMessage({ type: "FROM_EXTENSION", data: response }, "*");
    });
  }
});