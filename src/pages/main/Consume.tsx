import CancelIcon from '@assets/icons/cancel.svg?react';
import 'src/style/index.scss';
import { useEffect, useState, useRef } from 'react';
// import axios from 'axios';

const ConsumeScreen = () => {
  const [start, setStart] = useState<boolean>(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleTabUpdate = (
      _: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (changeInfo.status === 'complete' && tab.active && !isProcessingRef.current) {
        isProcessingRef.current = true;
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'COLLECT_COOKIE', data: {} });
          }
        });
        // 1초 후에 플래그를 리셋
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      }
    };

    const handleMessage = async (
      message: any,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void,
    ) => {
      console.log(message);
      if (message.action === 'COLLECTED_DATA') {
        try {
          // await axios.post('http://localhost:8000/api/v1/naver/cookies', message.data);
          console.log('Data sent successfully');
        } catch (error) {
          console.error('Error sending data:', error);
        }
      }
    };

    try {
      if (start) {
        chrome.tabs.onUpdated.addListener(handleTabUpdate);
        chrome.runtime.onMessage.addListener(handleMessage);
      }
    } catch (e) {}

    let timeoutId: NodeJS.Timeout;

    const scheduleNextReload = () => {
      if (start) {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0].id) {
              chrome.tabs.reload(tabs[0].id);
            }
          });
        } catch (e) {}
      }

      // 1~2초 사이의 랜덤한 시간으로 다음 실행 예약
      const randomDelay = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
      timeoutId = setTimeout(scheduleNextReload, randomDelay);
    };

    if (start) {
      scheduleNextReload();
    }

    return () => {
      clearTimeout(timeoutId);
      try {
        if (start) {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate);
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      } catch (e) {}
    };
  }, [start]);

  return (
    <div className="container">
      <div className="sticky-header">
        <div className="header">
          <h1>네이버 쿠키 컬렉터</h1>
          <button className="close-button" onClick={() => {}}>
            <CancelIcon />
          </button>
        </div>
      </div>
      <div style={{ float: 'right', marginBottom: 16 }}>
        <button className="common-button" style={{ width: 80 }} onClick={() => setStart(!start)}>
          {start ? '중지' : '시작'}
        </button>
      </div>
    </div>
  );
};

export default ConsumeScreen;
