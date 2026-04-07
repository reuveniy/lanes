import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function getLayout() {
  if (typeof window === "undefined") return { isMobile: false, isTablet: false, isLandscape: false };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isLandscape = w > h && h < 500;
  const isMobile = w < MOBILE_BREAKPOINT && !isLandscape;
  const isTablet = (w >= MOBILE_BREAKPOINT && w < TABLET_BREAKPOINT) || isLandscape;
  return { isMobile, isTablet, isLandscape };
}

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => getLayout().isMobile);

  useEffect(() => {
    const handler = () => setIsMobile(getLayout().isMobile);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
}

export function useTablet(): boolean {
  const [isTablet, setIsTablet] = useState(() => getLayout().isTablet);

  useEffect(() => {
    const handler = () => setIsTablet(getLayout().isTablet);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isTablet;
}

export function useLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(() => getLayout().isLandscape);

  useEffect(() => {
    const handler = () => setIsLandscape(getLayout().isLandscape);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isLandscape;
}
