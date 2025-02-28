import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useRecoilState } from "recoil";
import getMainPageState from "src/atom/selector";
import 'src/style/company-detail.scss';
import axiosApiInstance from "src/core/axiosInstance";
import CancelIcon from '@assets/icons/cancel.svg?react';
import ArrowLeftIcon from '@assets/icons/arrow-left.svg?react';
import EditIcon from '@assets/icons/icn_modify.svg?react';
import { ICompany } from "src/types/company";

const Company = () => {
  const [mainPageState, setMainPageState] = useRecoilState(getMainPageState);

  const handleClose = () => {
    window.close();
  }

  const handleBack = () => {
    setMainPageState({
      currentPage: 'companies',
      currentPageParams: {}
    })
  }

  const handleOnclickUrl = (urlCode: string) => {
    if (!company) {
      return;
    }
    setMainPageState({
      currentPage: 'companyUrl',
      currentPageParams: {
        code: company.code,
        urlCode
      }
    })
  }

  useEffect(() => {
    try {
      chrome.storage.local.set({ currentPage: 'company', currentPageParams: { code: mainPageState.currentPageParams.code } });
    } catch {

    }
  }, [])

  const { data } = useQuery({
    queryKey: ['company', mainPageState.currentPageParams.code],
    queryFn: () => axiosApiInstance.get(`/api/scraper/company/${mainPageState.currentPageParams.code}`),
    enabled: !!mainPageState.currentPageParams.code
  })

  const company: ICompany = useMemo(() => {
    return data?.data || null;
  }, [data])

  return (
    <div className="container">
      <div className="sticky-header">
        <div className="header">
          <button className="action-button" onClick={handleBack}>
            <ArrowLeftIcon />
          </button>
          <h1>매체사 상세</h1>
          <button className="close-button" onClick={handleClose}>
            <CancelIcon />
          </button>
        </div>
      </div>
      <div className="company-detail">
        <div className="info-row">
          <div className="info-label">매체코드</div>
          <div className="info-value">{company?.code}</div>
        </div>

        <div className="info-row">
          <div className="info-label">매체사명</div>
          <div className="info-value">{company?.name}</div>
        </div>

        <div className="info-row">
          <div className="info-label">매체사url</div>
          <div className="info-value">{company?.url}</div>
        </div>

        <div className="info-row">
          <div className="info-label">사용여부</div>
          <div className="info-value">{company?.active ? 'Y' : 'N'}</div>
        </div>

        <div className="divider"></div>

        <h2 className="section-title">수집 대상 URL</h2>

        <div className="url-table">
          <div className="table-header">
            <div className="table-cell">카테고리</div>
            <div className="table-cell">URL</div>
            <div className="table-cell">URL 코드</div>
            <div className="table-cell"></div>
          </div>

          {company?.urls?.map((url, index) => (
            <div className="table-row" key={index}>
              <div className="table-cell">{url.code}</div>
              <div className="table-cell url-cell">{url.url}</div>
              <div className="table-cell">{url.urlCode}</div>
              <div className="table-cell">
                <button className="edit-button" onClick={() => handleOnclickUrl(url.urlCode)}>
                  <EditIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Company;
