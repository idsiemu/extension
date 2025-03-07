import { useEffect, useState } from "react";
import CancelIcon from '@assets/icons/cancel.svg?react';
import CancelCircleIcon from '@assets/icons/x-circle.svg?react';
import CrossHairIcon from '@assets/icons/crosshair.svg?react';
import ArrowDownIcon from '@assets/icons/arrow-down.svg?react';
import "src/style/index.scss";
import "src/style/target.scss";
import Row from "src/components/Row";
import axiosApiInstance from "src/core/axiosInstance";
import { ICompanyUrlTag } from "src/types/company";
import { useMutation } from "@tanstack/react-query";

function ElementSelector() {
  const [code, setCode] = useState<string | null>(null);
  const [urlCode, setUrlCode] = useState<string | null>(null);
  const [type, setType] = useState<'list' | 'detail' | null>(null);
  const [tags, setTags] = useState<ICompanyUrlTag[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isUnwanted, setIsUnwanted] = useState<boolean>(false);

  const handleFetchTags = async () => {
    try {
      const { data } = await axiosApiInstance.get(`/api/scraper/company/${code}/url/${urlCode}/tags`, {
        params: {
          mode: type === 'list' ? '1' : '2'
        }
      })
      if (type === 'list' && Array.isArray(data)) {
        const sortedData = [...data].sort((a, b) => {
          if (a.type === 'article_list') return -1;
          if (b.type === 'article_list') return 1;
          if (a.type === 'link') return b.type === 'article_list' ? 1 : -1;
          return 0;
        });
        setTags(sortedData);
      } else {
        setTags(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleDeleteTagName = (index: number) => {
    const newTags = [...tags];
    const targetTag = newTags[index];
    if (targetTag.type === 'article_list') {
      newTags.forEach(tag => {
        tag.tagName = '';
      });
    } else {
      newTags[index].tagName = '';
    }
    setTags(newTags);
  }

  const handleChangeConvertType = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index].processType = value;
    setTags(newTags);
  }

  const handleClose = () => {
    try {
      chrome.runtime.sendMessage({ action: 'toggleIframeLayer', data: { flag: false } });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeTarget = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index].target = value;
    setTags(newTags);
  }

  const handleChangeReplace = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index].replace = value;
    setTags(newTags);
  }


  const handleSelectElement = (index: number) => {
    setCurrentIndex(index);
    window.parent.postMessage({ action: 'EXTRACT_START' }, '*');
  };

  const handleUnwantedElement = (index: number) => {
    setCurrentIndex(index);
    setIsUnwanted(true);
    window.parent.postMessage({
      action: 'EXTRACT_UNWANTED', data: {
        unwantedTag: tags[index].unwantedTag,
        tagName: tags[index].tagName
      }
    }, '*');
  };

  const handleUnwantedDone = () => {
    setIsUnwanted(false);
    setCurrentIndex(null);
    window.parent.postMessage({ action: 'EXTRACT_UNWANTED_DONE' }, '*');
  }

  const handleCancelTargeting = () => {
    setCurrentIndex(null);
    window.parent.postMessage({ action: 'EXTRACT_CANCEL' }, '*');
  }

  const handleDeleteUnwantedTag = (index: number) => {
    const newTags = [...tags];
    newTags[index].unwantedTag = '';
    setTags(newTags);
  }

  const handleSave = () => {
    if (tags.length) {
      saveTags();
    }

  };

  const { mutate: saveTags } = useMutation({
    mutationFn: () => axiosApiInstance.patch(`/api/scraper/company/url/tags`, {
      tags
    }),
    onSuccess: () => {
      alert('저장되었습니다.');
      handleClose();
    }
  })

  useEffect(() => {
    try {
      chrome.storage.local.get(['extractType'], function (result) {
        setType(result.extractType ?? null);
      });
    } catch (error) {
      console.error('크롬 스토리지 접근 실패:', error);
    }
  }, []);

  useEffect(() => {
    try {
      chrome.storage.local.get(['currentPageParams'], (result) => {
        if (result.currentPageParams) {
          setCode(result.currentPageParams.code ?? null);
          setUrlCode(result.currentPageParams.urlCode ?? null);
        }
      });
    } catch (error) {

    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'ELEMENT_SELECTED' && currentIndex !== null) {
        tags[currentIndex].tagName = event.data.data.selector;
        if (tags[currentIndex].type === 'article_list') {
          const linkIndex = tags.findIndex(tag => tag.type === 'link');
          if (linkIndex !== -1) {
            tags[linkIndex].tagName = event.data.data.hasAnchorTags ? 'a' : 'onclick';
          }
        }
        setTags([...tags]);
        setCurrentIndex(null);
      } else if (event.data.action === 'ELEMENT_REMOVED' && currentIndex !== null) {
        tags[currentIndex].unwantedTag = event.data.data.selector;
        setTags([...tags]);
        setCurrentIndex(null);
      } else if (event.data.action === 'UNWANTED_ELEMENT_SELECTED' && currentIndex !== null) {
        tags[currentIndex].unwantedTag = event.data.data;
        setTags([...tags]);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentIndex]);


  useEffect(() => {
    if (!!type && !!code && !!urlCode) {
      handleFetchTags();
    }
  }, [type, code, urlCode]);


  return (
    <>
      {!isUnwanted && currentIndex !== null && <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: 6 }}>
        <button className="common-button" style={{ height: 44, width: 80 }} onClick={handleCancelTargeting}>
          취소
        </button>
      </div>}
      {isUnwanted && currentIndex !== null && <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: 6 }}>
        <div style={{ flex: 1, fontSize: 16, paddingLeft: 16, paddingRight: 16 }}>{tags[currentIndex].unwantedTag}</div>
        <button className="common-button" style={{ height: 44, width: 80 }} onClick={handleUnwantedDone}>
          선택 완료
        </button>
      </div>}
      {currentIndex === null && <div className="container">
        <div className="sticky-header">
          <div className="header">
            <h1>엘리먼트 타겟하기</h1>
            <button className="close-button" onClick={handleClose}>
              <CancelIcon />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 16, marginBottom: 16, fontSize: 14, color: '#666', textAlign: 'left' }}>
          *수집하려고하는 메체사의 목록 페이지의 엘리먼트를 선택해주세요
        </div>

        {tags.map((row, key) => <div key={key} className="element-section">
          <div className="element-title">1. {row.type}</div>
          <Row gap={1}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                readOnly
                value={row.tagName}
                placeholder="#article > div > a"
                className="input-box"
                style={{
                  paddingRight: row.tagName !== '' && row.type !== 'link' ? '30px' : '0px'
                }}
              />
              {row.tagName !== '' && row.type !== 'link' && <div
                style={{
                  cursor: 'pointer',
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 20,
                  height: 20,
                  backgroundColor: 'white',
                }}
                onClick={() => handleDeleteTagName(key)}
              >
                <CancelCircleIcon />
              </div>}
            </div>
            {row.type !== 'link' && <button
              className="common-button"
              style={{ width: 40, cursor: 'pointer' }}
              onClick={() => handleSelectElement(key)}
            >
              <CrossHairIcon />
            </button>}
          </Row>

          <div className="transform-section">
            <div className="radio-group">
              <div className="radio-label">2. 컨텐츠 변환 타입</div>
              <label className="radio-option">
                <input
                  type="radio"
                  value="R"
                  checked={row.processType === '' || row.processType === 'R'}
                  onChange={() => handleChangeConvertType(key, 'R')}
                />
                <span>변환</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="D"
                  checked={row.processType === 'D'}
                  onChange={() => handleChangeConvertType(key, 'D')}
                />
                <span>삭제</span>
              </label>
            </div>

            <div className="transform-note">
              *변환, 삭제가 필요한 문자를 ||| 해당 문자 기준으로 여러개 입력할 수 있습니다.
            </div>

            <Row>
              <input
                type="text"
                value={row.target}
                onChange={(e) => handleChangeTarget(key, e.target.value)}
                placeholder="ABC|||DEF"
                className="input-box"
              />
            </Row>
            {(row.processType === 'R' || row.processType === '') && <>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <ArrowDownIcon />
              </div>

              <Row>
                <input
                  type="text"
                  onChange={(e) => handleChangeReplace(key, e.target.value)}
                  value={row.replace}
                  placeholder="abc|||def"
                  className="input-box"
                />
              </Row>
            </>}
            <div className="element-title" style={{ marginTop: 16 }}>3. 제거 할 엘리먼트 설정</div>
            <Row gap={1}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  readOnly
                  value={row.unwantedTag}
                  placeholder="#a2,iframe"
                  className="input-box"
                  style={{
                    paddingRight: row.unwantedTag !== '' ? '30px' : '0px'
                  }}
                />
                {row.tagName !== '' && row.unwantedTag !== '' && <div
                  style={{
                    cursor: 'pointer',
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 20,
                    height: 20,
                    backgroundColor: 'white',
                  }}
                  onClick={() => handleDeleteUnwantedTag(key)}
                >
                  <CancelCircleIcon />
                </div>}
              </div>
              {<button
                className="common-button"
                style={{ width: 44, cursor: 'pointer' }}
                disabled={row.tagName === ''}
                onClick={() => handleUnwantedElement(key)}
              >
                <CrossHairIcon />
              </button>}
            </Row>
          </div>
        </div>)}

        <div style={{ float: 'right', marginBottom: 16 }}>
          <button className="common-button" style={{ width: 80 }} disabled={!tags.length} onClick={handleSave}>
            저장
          </button>
        </div>
      </div>}
    </>
  );
}

export default ElementSelector;
