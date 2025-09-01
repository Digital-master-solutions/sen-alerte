import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Fonctions utilitaires pour améliorer le responsive mobile
export function useMobileOptimization() {
  const isMobile = useIsMobile()
  
  return {
    isMobile,
    // Classes CSS conditionnelles pour mobile
    mobileClasses: {
      container: isMobile ? 'px-4 py-3' : 'px-6 py-4',
      card: isMobile ? 'p-3' : 'p-6',
      button: isMobile ? 'h-10 px-3 text-sm' : 'h-11 px-4',
      input: isMobile ? 'h-10 text-sm' : 'h-11',
      spacing: isMobile ? 'space-y-3' : 'space-y-4',
      grid: isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
      text: {
        title: isMobile ? 'text-xl' : 'text-2xl',
        subtitle: isMobile ? 'text-base' : 'text-lg',
        body: isMobile ? 'text-sm' : 'text-base'
      }
    },
    // Styles inline pour mobile
    mobileStyles: {
      fullHeight: isMobile ? { minHeight: '100vh' } : {},
      stickyHeader: isMobile ? { position: 'sticky', top: 0, zIndex: 50 } : {},
      bottomNav: isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40 } : {},
    }
  }
}
