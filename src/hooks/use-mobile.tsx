import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const handleChange = () => {
      setIsMobile(globalThis.innerWidth < MOBILE_BREAKPOINT);
    };

    // Add event listener
    globalThis.addEventListener("resize", handleChange);

    // Set initial value
    handleChange();

    return () => globalThis.removeEventListener("resize", handleChange);
  }, []);

  return !!isMobile;
}

// Add the useMediaQuery hook as an alias to useIsMobile for compatibility
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = globalThis.matchMedia(query);

    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    handleChange(); // Set initial value

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

// Added for better responsive design with specific breakpoints
export const useBreakpoint = () => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");

  return { isMobile, isTablet, isDesktop };
};
