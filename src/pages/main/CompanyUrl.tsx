import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import getMainPageState from "src/atom/selector";
import axiosApiInstance from "src/core/axiosInstance";
import { ICompanyUrlByTag } from "src/types/company";
import CancelIcon from '@assets/icons/cancel.svg?react';
import ArrowLeftIcon from '@assets/icons/arrow-left.svg?react';
import CrossHairIcon from '@assets/icons/crosshair.svg?react';
import 'src/style/company-url.scss'

const CompanyUrl = () => {
  const [mainPageState, setMainPageState] = useRecoilState(getMainPageState);
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const { data } = useQuery({
    queryKey: ['companyTag', mainPageState.currentPageParams.code, mainPageState.currentPageParams.urlCode],
    queryFn: () => axiosApiInstance.get(`/api/scraper/company/${mainPageState.currentPageParams.code}/url/${mainPageState.currentPageParams.urlCode}`),
    enabled: !!mainPageState.currentPageParams.code && !!mainPageState.currentPageParams.urlCode
  })
  const urlData: ICompanyUrlByTag = useMemo(() => {
    return data?.data || null;
  }, [data]);

  const handleBack = () => {
    setMainPageState({
      currentPage: 'company',
      currentPageParams: {
        code: mainPageState.currentPageParams.code
      }
    })
  }

  const handleClose = () => {
    window.close();
  }

  const handleClickListPage = () => {
    if (!urlData) {
      return;
    }
    setLoadingList(true)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        const tabId = tabs[0].id;

        const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo, _tab: chrome.tabs.Tab) => {
          if (updatedTabId === tabId && changeInfo.status === 'complete') {
            setLoadingList(false)
            chrome.runtime.sendMessage({ action: "toggleIframeLayer", data: { flag: true, type: "list" } });
            chrome.tabs.onUpdated.removeListener(listener);

            setTimeout(() => {
              window.close();
            }, 100);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
        chrome.tabs.update(tabId, { url: urlData.url });
      }
    });
  }

  const handleClickDetailPage = () => {
    if (!urlData || !urlData.detailTarget) {
      return;
    }

    setLoadingDetail(true);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        const tabId = tabs[0].id;

        const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo, _tab: chrome.tabs.Tab) => {
          if (updatedTabId === tabId && changeInfo.status === 'complete') {
            chrome.runtime.sendMessage({
              action: "linkClicked",
              data: {
                tabId: tabId,
                selector: urlData.detailTarget
              }
            }, (response) => {
              setLoadingDetail(false);
              if (response.success) {
                chrome.runtime.sendMessage({ action: "toggleIframeLayer", data: { flag: true, type: "detail" } });
                setTimeout(() => {
                  window.close();
                }, 100);
              } else {
                alert(response.error);
              }
            });

            chrome.tabs.onUpdated.removeListener(listener);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
        chrome.tabs.update(tabId, { url: urlData.url });
      }
    });
  }

  useEffect(() => {
    try {
      chrome.storage.local.set({ currentPage: 'companyUrl', currentPageParams: { code: mainPageState.currentPageParams.code, urlCode: mainPageState.currentPageParams.urlCode } });
    } catch {

    }
  }, [])
  return <div className="container">
    <div className="sticky-header">
      <div className="header">
        <button className="action-button" onClick={handleBack}>
          <ArrowLeftIcon />
        </button>
        <h1>수집 대상 URL 관리</h1>
        <button className="close-button" onClick={handleClose}>
          <CancelIcon />
        </button>
      </div>
    </div>
    <div className="company-url">
      <div className="info-row">
        <div className="info-label">카테고리</div>
        <div className="info-value">{urlData?.code}</div>
      </div>

      <div className="info-row">
        <div className="info-label">URL 코드</div>
        <div className="info-value">{urlData?.urlCode}</div>
      </div>

      <div className="info-row">
        <div className="info-label">URL</div>
        <div className="info-value">{urlData?.url}</div>
      </div>

      <div className="divider"></div>

      <div className="button-container">
        <button
          className="tag-button"
          onClick={handleClickListPage}
          disabled={loadingList}
        >
          {loadingList ? (
            <span className="loading-spinner"></span>
          ) : (
            <>
              <CrossHairIcon />
              <span>목록 페이지 <br />엘리먼트 지정</span>
            </>
          )}
        </button>
        <button
          className="tag-button"
          onClick={handleClickDetailPage}
          disabled={loadingDetail || !urlData?.detailTarget}
        >
          {loadingDetail ? (
            <span className="loading-spinner"></span>
          ) : (
            <>
              <CrossHairIcon />
              <span>상세 페이지 <br />엘리먼트 지정</span>
            </>
          )}
        </button>
      </div>
    </div>
  </div>;
};

export default CompanyUrl;

