import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return isMobile;
};
