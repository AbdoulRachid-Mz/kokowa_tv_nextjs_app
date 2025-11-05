"use client"

import { useState, useEffect, useRef } from 'react'

export function useScreenSize(customSize?: number) {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSmallScreen = screenSize.width < 640;
  const isMediumScreen = screenSize.width >= 640 && screenSize.width < 768;
  const isLargeScreen = screenSize.width >= 768 && screenSize.width < 1024;
  const isXLargeScreen = screenSize.width >= 1024;

  // Custom size comparisons
  const isLargerThan = customSize ? screenSize.width > customSize : false;
  const isSmallerThan = customSize ? screenSize.width < customSize : false;

  return {
    screenSize,
    isSmallScreen,
    isMediumScreen, 
    isLargeScreen,
    isXLargeScreen,
    isLargerThan,
    isSmallerThan
  };
}


export function useParentSize(threshold: number) {
  const [isSmaller, setIsSmaller] = useState(false)
  const parentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!parentRef.current) return

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setIsSmaller(width < threshold)
      }
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(parentRef.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  return { isSmaller, parentRef }
}
