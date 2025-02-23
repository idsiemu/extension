console.log("load contents");
import HtmlParser from "./libs/htmlparser";

console.log("load contents");
const layerIframeWork = "becu-iframe-popup";

console.log("load contents");
let parser = new HtmlParser();

console.log("load contents");
const getPageContent = async (xpath: string) => {
  const nextPageElement = await parser.getXPathElement(xpath);
  let content = nextPageElement.innerText;
  if (content === "") content = nextPageElement.innerHTML;
  return `${xpath}||${content}`;
};

const showIframeLayer = async (data: any = []) => {
  // 현재 모드 설정은 Paging.svelte 에서 처리합니다.
  let currentMode = await localStorage.getItem("currentMode");
  if (currentMode === undefined || currentMode === null || currentMode !== "paging") currentMode = "working";

  let appElement = document.querySelector(`#${layerIframeWork}`);
  let iframe;

  console.log(appElement);

  if (appElement) iframe = appElement.querySelector("iframe");
  else {
    console.log("appElement is null");
    // iframe 생성
    appElement = document.createElement("div");
    appElement.id = layerIframeWork;

    iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("./index.html");

    appElement.appendChild(iframe);
    document.body.appendChild(appElement);
  }

  console.log(22);
  // iframe에 data 를 전송합니다.
  let xpath = currentMode === "paging" ? data : "";
  if (xpath !== "" && xpath.length > 5) xpath = await getPageContent(xpath);
  console.log("showIframeLayer:", currentMode, data, xpath);

  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ mode: currentMode, data, xpath }, "*");
  } else {
    console.error("iframe or iframe.contentWindow is null");
  }
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.action) {
    case "showIframeLayer": // 수집하기 iframe 창 열기
      showIframeLayer();
      break;
  }
  sendResponse({ result: "success" });
  return true;
});
