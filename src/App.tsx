import { useState, useEffect } from "react";
import "./App.css";

interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  text: string | null;
  attributes: Array<{ name: string; value: string }>;
}

function App() {
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);

  useEffect(() => {
    console.log("A. App component mounted");

    const messageListener = (message: any) => {
      console.log("B. Message received in App:", message);
      if (message.type === "ELEMENT_INFO") {
        console.log("C. Setting element info:", message.data);
        setElementInfo(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    console.log("D. Message listener added");

    return () => {
      console.log("E. Cleanup: removing message listener");
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const toggleInspector = async () => {
    console.log("F. Toggle inspector clicked");
    const newState = !isInspectorActive;
    setIsInspectorActive(newState);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log("G. Current tab:", tab);

      if (tab.id) {
        console.log("H. Sending toggle message to content script");
        await chrome.tabs.sendMessage(tab.id, {
          type: "TOGGLE_INSPECTOR",
          active: newState,
        });
        console.log("I. Toggle message sent successfully");
      }
    } catch (error) {
      console.error("J. Error in toggleInspector:", error);
    }
  };

  return (
    <div className="inspector-container">
      <h2>DOM Inspector</h2>
      <button onClick={toggleInspector} className={`toggle-button ${isInspectorActive ? "active" : ""}`}>
        {isInspectorActive ? "인스펙터 중지" : "인스펙터 시작"}
      </button>

      {elementInfo && (
        <div className="element-info">
          <h3>선택된 요소 정보:</h3>
          <pre>{JSON.stringify(elementInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
