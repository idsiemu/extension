chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.action) {
    case 'COLLECT_COOKIE':
      // 모든 쿠키를 가져와서 파싱
      const cookieString = document.cookie;
      const cookiePairs = cookieString.split(';');
      const cookies = cookiePairs
        .map(pair => {
          const [name, value] = pair.trim().split('=');
          return {
            name,
            value,
            domain: '.naver.com',
            path: '/',
          };
        })
        .filter(cookie => cookie.name); // 빈 쿠키 제외

      // 수집된 쿠키 데이터 전송
      chrome.runtime.sendMessage({
        action: 'COLLECTED_DATA',
        data: { cookies },
      });
      break;
  }
  sendResponse({ result: 'success' });
  return true;
});
