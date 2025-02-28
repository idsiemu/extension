import { atom } from 'recoil';

// 액션 모달 상태의 인터페이스 정의
export interface IMainPageState {
    currentPage: string | null;
    currentPageParams: Record<string, any>;
}

const mainPageState = atom<IMainPageState>({
    key: 'mainPageState', // 고유한 ID (전역적으로 고유해야 함)
    default: {
        currentPage: null,
        currentPageParams: {},
    },
});

export default mainPageState;