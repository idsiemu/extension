console.log("Content script loaded!"); // 스크립트가 로드되었는지 확인

let isInspectorActive = false;
let highlightedElement: HTMLElement | null = null;

console.log("1. Content script initialized");

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("2. Message received:", message);

  if (message.type === "TOGGLE_INSPECTOR") {
    isInspectorActive = message.active;
    console.log("3. Inspector state changed:", isInspectorActive);

    if (!isInspectorActive && highlightedElement) {
      highlightedElement.style.outline = "";
    }

    sendResponse({ success: true });
  }
  return true;
});

// 마우스 오버 이벤트
document.addEventListener("mouseover", (e) => {
  console.log("4. Mouseover event triggered");

  if (!isInspectorActive) {
    console.log("5. Inspector not active, ignoring");
    return;
  }

  const target = e.target as HTMLElement;
  console.log("6. Hovered element:", target);

  if (highlightedElement) {
    highlightedElement.style.outline = "";
  }

  highlightedElement = target;
  target.style.outline = "2px solid #ff0000";
});

// 클릭 이벤트
document.addEventListener("click", (event) => {
  console.log("7. Click event triggered");

  if (!isInspectorActive) {
    console.log("8. Inspector not active, ignoring click");
    return;
  }

  // 이벤트 전파를 완전히 막습니다
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const target = event.target as HTMLElement;
  console.log("9. Clicked element:", target);

  const elementInfo = {
    tagName: target.tagName,
    className: target.className,
    id: target.id,
    text: target.textContent,
    attributes: Array.from(target.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    })),
  };

  console.log("10. Element info:", elementInfo);

  chrome.runtime.sendMessage(
    {
      type: "ELEMENT_INFO",
      data: elementInfo,
    },
    (response) => {
      console.log("11. Message sent response:", response);
    }
  );

  return false;
});
