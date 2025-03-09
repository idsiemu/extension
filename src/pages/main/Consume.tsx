import Row from 'src/components/Row';
import CancelIcon from '@assets/icons/cancel.svg?react';
// import CancelCircleIcon from '@assets/icons/x-circle.svg?react';
// import CrossHairIcon from '@assets/icons/crosshair.svg?react';
import 'src/style/index.scss';
import { useEffect, useState } from 'react';

const ConsumeScreen = () => {
  const [start, setStart] = useState<boolean>(false);
  const [targets, setTargets] = useState<string>('');
  const [childTargets, setChildTargets] = useState<string>('');

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargets(e.target.value);
  };

  const handleChildTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChildTargets(e.target.value);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isLoading = false;

    // 페이지 리로드 완료 이벤트 리스너
    const handleTabUpdate = (
      _: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (changeInfo.status === 'complete' && tab.active) {
        chrome.runtime.sendMessage({ action: 'findElement', data: { targets, childTargets } });
        isLoading = false;

        // 페이지 로딩이 완료되면 다음 리로드를 예약
        if (start) {
          timeoutId = setTimeout(reloadPage, 5000);
        }
      }
    };

    const reloadPage = () => {
      if (!isLoading && start) {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0].id) {
              console.log('reloaded');
              isLoading = true;
              chrome.tabs.reload(tabs[0].id);
            }
          });
        } catch (e) {
          isLoading = false;
          if (start) {
            timeoutId = setTimeout(reloadPage, 5000);
          }
        }
      }
    };

    try {
      // 이벤트 리스너 등록
      chrome.tabs.onUpdated.addListener(handleTabUpdate);
      if (start) {
        reloadPage();
      }
    } catch (e) {}

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // 이벤트 리스너 제거
      try {
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      } catch (e) {}
    };
  }, [start, targets, childTargets]);

  useEffect(() => {
    const handleMessage = async (
      message: any,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void,
    ) => {
      console.log(message.action === 'COLLECTED_DATA');
      console.log(message);
      if (message.action === 'COLLECTED_DATA') {
        try {
          const response = await fetch('http://172.30.1.73:8000/api/v1/embedding/bulk_index', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documents: message.data,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          console.log('Data sent successfully');
        } catch (error) {
          console.error('Error sending data:', error);
        }
      }
    };

    // 메시지 리스너 등록
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div className="container">
      <div className="sticky-header">
        <div className="header">
          <h1>엘리먼트 타겟하기</h1>
          <button className="close-button" onClick={() => {}}>
            <CancelIcon />
          </button>
        </div>
      </div>
      <div
        style={{ marginTop: 16, marginBottom: 16, fontSize: 14, color: '#666', textAlign: 'left' }}
      >
        *수집하려고하는 메체사의 목록 페이지의 엘리먼트를 선택해주세요
      </div>

      <div className="element-section">
        <Row gap={1}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={targets}
              placeholder="#article > div > a"
              className="input-box"
              onChange={handleTargetChange}
            />
          </div>
        </Row>

        <Row gap={1}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={childTargets}
              placeholder="타겟 엘리먼트"
              className="input-box"
              onChange={handleChildTargetChange}
            />
          </div>
        </Row>

        <div className="transform-section">
          <div className="radio-group">
            <div className="radio-label">2. 컨텐츠 변환 타입</div>
            <label className="radio-option">
              <input type="radio" value="R" checked={true} onChange={() => {}} />
              <span>변환</span>
            </label>
            <label className="radio-option">
              <input type="radio" value="D" checked={true} onChange={() => {}} />
              <span>삭제</span>
            </label>
          </div>

          <div className="transform-note">
            *변환, 삭제가 필요한 문자를 ||| 해당 문자 기준으로 여러개 입력할 수 있습니다.
          </div>

          <Row>
            <input
              type="text"
              value={''}
              onChange={() => {}}
              placeholder="ABC|||DEF"
              className="input-box"
            />
          </Row>
        </div>
      </div>

      <div style={{ float: 'right', marginBottom: 16 }}>
        <button
          className="common-button"
          style={{ width: 80 }}
          disabled={!targets || !childTargets}
          onClick={() => setStart(!start)}
        >
          {start ? '중지' : '시작'}
        </button>
      </div>
    </div>
  );
};

export default ConsumeScreen;
