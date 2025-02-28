import { useEffect, useRef, useState } from "react";
import CancelIcon from '@assets/icons/cancel.svg?react';
import SearchIcon from '@assets/icons/search.svg?react';
import "src/style/index.scss";
import Row from "src/components/Row";
import { axiosApiInstance } from "src/core/axiosInstance";
import useInfinityScroll from "src/hooks/useInfinityScroll";
import { ICompany } from "src/types/company";
import { useSetRecoilState } from "recoil";
import getMainPageState from "src/atom/selector";

const Companies = () => {
  const setMainPageState = useSetRecoilState(getMainPageState);
  const [keyword, setKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const size = 20
  const [end, setEnd] = useState(false)
  const [companies, setCompanies] = useState<ICompany[]>([])
  const [trigger, setTrigger] = useState(0)
  const target = useRef<HTMLTableRowElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // const onAddMouseEvent = async () => {
  //   chrome.runtime.sendMessage({ action: "toggleIframeLayer", data: { flag: true } });

  //   // 윈도우 종료
  //   setTimeout(() => {
  //     window.close();
  //   }, 100);
  // };

  const handleChangeKeyword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
  }

  const handleTrigger = () => {
    setTrigger(trigger + 1)
    setPage(0)
    setEnd(false)
    setCompanies([])
  }

  const handleClose = () => {
    window.close();
  }

  const handleFetchCompanies = () => {
    setIsLoading(true)
    axiosApiInstance.get('/api/scraper/companies', {
      params: {
        keyword,
        page,
        size
      }
    }).then((res) => {
      setIsLoading(false)
      if (page === 0) {
        setCompanies(res.data.companies)
      } else {
        setCompanies([...companies, ...res.data.companies])
      }
      if (res.data.companies.length === 20) {
        setPage(page + 1)
      } else {
        setEnd(true)
      }
    })
  }

  const onIntersect = (entries: IntersectionObserverEntry[]) => {
    if (!isLoading && !end && entries[0].isIntersecting) {
      handleFetchCompanies();
    }
  };

  const handleClickCompany = (code: string) => {
    setMainPageState({
      currentPage: 'company',
      currentPageParams: { code }
    })
  }

  useInfinityScroll({
    target: target as React.RefObject<HTMLDivElement>,
    triggers: [page, end, keyword],
    onIntersect,
  });

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //       if (tabs[0].id) {
  //       console.log('reloaded')
  //         chrome.tabs.reload(tabs[0].id); // 현재 탭 새로고침
  //       }
  //     });
  //   }, 5000); // 5초마다 실행

  //   return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 정리
  // }, []);

  useEffect(() => {
    if (!end) {
      handleFetchCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    try {
      chrome.storage.local.set({ currentPage: 'companies', currentPageParams: {} });
    } catch (e) {

    }
  }, [])

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 스크롤 위치에 따라 버튼 표시 여부 결정
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  console.log(showScrollTop)

  return (
    <div className="container">
      <div className="sticky-header">
        <div className="header">
          <h1>매체사 목록</h1>
          <button className="close-button" onClick={handleClose}>
            <CancelIcon />
          </button>
        </div>
        <Row gap={1}>
          <input className="input-box" type="text" placeholder="매체사명, 코드" onChange={handleChangeKeyword} onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTrigger()
            }
          }} />
          <button className="common-button" style={{ width: 44, cursor: 'pointer' }} onClick={handleTrigger}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTrigger()
              }
            }}>
            <SearchIcon />
          </button>
        </Row>
      </div>
      <table className="company-table">
        <thead>
          <tr>
            <th>매체사</th>
            <th>매체사코드</th>
            <th>사용여부</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, index) => (
            <tr key={index} ref={index === companies.length - 10 ? target : undefined} onClick={() => handleClickCompany(company.code)}>
              <td>{company.name}</td>
              <td>{company.code}</td>
              <td>{company.active ? 'Y' : 'N'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className={`scroll-top-button ${showScrollTop ? 'visible' : ''}`}
        onClick={handleScrollToTop}
        aria-label="페이지 상단으로 이동"
      >
        ↑
      </button>
    </div>
  );
}

export default Companies

