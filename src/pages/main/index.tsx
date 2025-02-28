import { useEffect } from "react";
import Companies from "./Companies";
import getMainPageState from "src/atom/selector";
import { useRecoilState } from "recoil";
import Company from "./Company";
import CompanyUrl from "./CompanyUrl";

function App() {
  const [mainPageState, setMainPageState] = useRecoilState(getMainPageState);

  useEffect(() => {
    try {
      chrome.storage.local.get(['currentPage', 'currentPageParams'], (result) => {
        if (result.currentPage) {
          setMainPageState({
            currentPage: result.currentPage,
            currentPageParams: result.currentPageParams,
          });
        } else {
          setMainPageState({
            currentPage: 'companies',
            currentPageParams: {},
          });
        }
      });
    } catch (e) {
      setMainPageState({
        currentPage: 'companies',
        currentPageParams: {},
      });
    }
  }, []);

  return <>
    {mainPageState.currentPage === 'companies' && <Companies />}
    {mainPageState.currentPage === 'company' && <Company />}
    {mainPageState.currentPage === 'companyUrl' && <CompanyUrl />}
  </>
}

export default App;
