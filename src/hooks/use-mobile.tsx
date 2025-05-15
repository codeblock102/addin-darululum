
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", handleChange)
    handleChange() // Set initial value
    
    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return !!isMobile
}

// Add the useMediaQuery hook as an alias to useIsMobile for compatibility
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(false)
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handleChange = () => {
      setMatches(mediaQuery.matches)
    }
    
    mediaQuery.addEventListener("change", handleChange)
    handleChange() // Set initial value
    
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [query])

  return matches
};
