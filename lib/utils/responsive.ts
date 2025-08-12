// Responsive utility functions and constants

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

export const RESPONSIVE_CLASSES = {
  // Container classes
  container: 'w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4',
  containerLarge: 'w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6',
  
  // Spacing classes
  spacing: {
    section: 'space-y-4 sm:space-y-6',
    sectionLarge: 'space-y-4 sm:space-y-6 lg:space-y-8',
    margin: 'mb-4 sm:mb-6',
    marginLarge: 'mb-4 sm:mb-6 lg:mb-8',
    gap: 'gap-3 sm:gap-4',
    gapLarge: 'gap-3 sm:gap-4 lg:gap-6'
  },
  
  // Grid classes
  grid: {
    cards2: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
    cards3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4',
    cards4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4',
    cards6: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3',
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
  },
  
  // Typography classes
  typography: {
    h1: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold',
    h2: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    h3: 'text-base sm:text-lg lg:text-xl font-medium',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm',
    caption: 'text-xs'
  },
  
  // Button classes
  button: {
    responsive: 'text-xs sm:text-sm',
    icon: 'w-4 h-4 sm:w-5 sm:h-5',
    iconLarge: 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6'
  },
  
  // Card classes
  card: {
    padding: 'p-3 sm:p-4',
    paddingLarge: 'p-3 sm:p-4 lg:p-6',
    header: 'pb-2 sm:pb-3'
  },
  
  // Form classes
  form: {
    input: 'text-xs sm:text-sm',
    label: 'text-xs sm:text-sm',
    select: 'text-xs sm:text-sm'
  },
  
  // Flex classes
  flex: {
    responsive: 'flex flex-col sm:flex-row',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    wrap: 'flex flex-wrap gap-3 sm:gap-4'
  }
} as const

// Helper function to combine responsive classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

// Responsive breakpoint utilities
export const useResponsive = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  
  return {
    isMobile,
    isTablet,
    isDesktop
  }
}

// Common responsive patterns
export const RESPONSIVE_PATTERNS = {
  // Dashboard layout
  dashboard: {
    container: RESPONSIVE_CLASSES.containerLarge,
    header: cn(RESPONSIVE_CLASSES.flex.responsive, RESPONSIVE_CLASSES.spacing.margin),
    stats: RESPONSIVE_CLASSES.grid.cards4,
    charts: 'grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6'
  },
  
  // Form layout
  form: {
    container: RESPONSIVE_CLASSES.container,
    grid2: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
    grid3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4',
    actions: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-3'
  },
  
  // List layout
  list: {
    container: RESPONSIVE_CLASSES.container,
    grid: RESPONSIVE_CLASSES.grid.responsive,
    item: 'border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2'
  }
} as const