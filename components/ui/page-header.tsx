import React from 'react'
import { cn } from '@/lib/utils'
import { ResponsiveText } from './responsive-container'

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  children,
  className
}) => {
  return (
    <div className={cn(
      'flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 lg:gap-4 mb-4 sm:mb-6',
      className
    )}>
      <div className="flex-1 min-w-0">
        <ResponsiveText variant="h1" className="mb-1">
          {title}
        </ResponsiveText>
        {subtitle && (
          <ResponsiveText variant="h2" color="muted" className="mb-2">
            {subtitle}
          </ResponsiveText>
        )}
        {description && (
          <ResponsiveText variant="small" color="muted">
            {description}
          </ResponsiveText>
        )}
      </div>
      {children && (
        <div className="flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'
  className?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  className
}) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
    red: 'from-red-50 to-red-100 border-red-200 text-red-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-700'
  }

  const valueColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    orange: 'text-orange-900',
    red: 'text-red-900',
    purple: 'text-purple-900',
    gray: 'text-gray-900'
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  }

  return (
    <div className={cn(
      'bg-gradient-to-br border rounded-lg p-3 sm:p-4',
      colorClasses[color],
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs sm:text-sm font-medium mb-1',
            colorClasses[color]
          )}>
            {title}
          </p>
          <p className={cn(
            'text-lg sm:text-xl lg:text-2xl font-bold',
            valueColorClasses[color]
          )}>
            {typeof value === 'number' ? value.toLocaleString('th-TH') : value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs mt-1',
              colorClasses[color]
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ml-2',
            iconColorClasses[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface ActionButtonProps {
  href?: string
  onClick?: () => void
  icon: React.ReactNode
  label: string
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo'
  className?: string
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  href,
  onClick,
  icon,
  label,
  color = 'blue',
  className
}) => {
  const colorClasses = {
    blue: 'hover:bg-blue-50 hover:border-blue-300 text-blue-600',
    green: 'hover:bg-green-50 hover:border-green-300 text-green-600',
    purple: 'hover:bg-purple-50 hover:border-purple-300 text-purple-600',
    red: 'hover:bg-red-50 hover:border-red-300 text-red-600',
    yellow: 'hover:bg-yellow-50 hover:border-yellow-300 text-yellow-600',
    indigo: 'hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600'
  }

  const buttonContent = (
    <div className={cn(
      'w-full h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2',
      'border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md',
      colorClasses[color],
      className
    )}>
      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-medium text-center leading-tight">
        {label}
      </span>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {buttonContent}
      </a>
    )
  }

  return (
    <button onClick={onClick} className="block w-full">
      {buttonContent}
    </button>
  )
}