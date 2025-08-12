import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'default' | 'large' | 'full'
  spacing?: 'default' | 'large' | 'none'
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  size = 'default',
  spacing = 'default'
}) => {
  const sizeClasses = {
    default: 'w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6',
    large: 'w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8',
    full: 'w-full px-3 sm:px-4 lg:px-6'
  }

  const spacingClasses = {
    default: 'py-3 sm:py-4',
    large: 'py-3 sm:py-4 lg:py-6',
    none: ''
  }

  return (
    <div className={cn(
      sizeClasses[size],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 6
  gap?: 'sm' | 'md' | 'lg'
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = 3,
  gap = 'md'
}) => {
  const colClasses = {
    1: 'grid grid-cols-1',
    2: 'grid grid-cols-1 sm:grid-cols-2',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  }

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-3 sm:gap-4 lg:gap-6'
  }

  return (
    <div className={cn(
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false
}) => {
  const paddingClasses = {
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-3 sm:p-4 lg:p-6'
  }

  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : ''

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm',
      paddingClasses[padding],
      hoverClasses,
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption'
  color?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'error'
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  variant = 'body',
  color = 'default'
}) => {
  const variantClasses = {
    h1: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold',
    h2: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    h3: 'text-base sm:text-lg lg:text-xl font-medium',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm',
    caption: 'text-xs'
  }

  const colorClasses = {
    default: 'text-gray-900',
    muted: 'text-gray-600',
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600'
  }

  return (
    <div className={cn(
      variantClasses[variant],
      colorClasses[color],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveButtonProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  className,
  size = 'md',
  variant = 'default',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs sm:text-sm',
    md: 'px-3 py-2 text-xs sm:text-sm',
    lg: 'px-4 py-2 text-sm sm:text-base'
  }

  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600',
    outline: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-none'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  )
}