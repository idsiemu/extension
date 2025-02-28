import { selector } from 'recoil';
import mainPageState from './mainPageState';

const getMainPageState = selector({
    key: 'getMainPageState',
    get: ({ get }) => {
        return get(mainPageState);
    },
    set: ({ set }, newValue) => {
        set(mainPageState, newValue);
    },
});

export default getMainPageState;