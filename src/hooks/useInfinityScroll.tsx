import React, { useEffect } from 'react';

const useInfinityScroll = ({
  target,
  triggers,
  onIntersect,
}: {
  target: React.RefObject<HTMLDivElement>;
  triggers: Array<any>;
  onIntersect: (entries: IntersectionObserverEntry[]) => void;
}) => {
  useEffect(() => {
    const targetElement = target.current;

    const options = {
      rootMargin: '0px', // 변경된 부분
      threshold: 0.5,
    };
    const observer = new IntersectionObserver(onIntersect, options);

    if (targetElement) {
      observer.observe(targetElement);
    }

    return () => {
      if (targetElement) {
        observer.unobserve(targetElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.current, ...triggers]);
};

export default useInfinityScroll;