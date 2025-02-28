import { useEffect } from "react";
import "../../style/index.scss";

function App() {
  const handleClose = () => {
    chrome.runtime.sendMessage({ action: 'toggleIframeLayer', data: { flag: false } });
  };

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'renderElement') {
        console.log(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>엘리먼트 설정</h1>
        <button className="close-button" onClick={handleClose}>닫기</button>
      </div>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="row">
          <input type="text" placeholder={`입력 ${index + 1}`} className="input-box" />
          <button className="select-button" >선택</button>
        </div>
      ))}
    </div>
  );
}

export default App;
