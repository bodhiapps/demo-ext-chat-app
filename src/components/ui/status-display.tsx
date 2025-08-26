import { StatusUtils, type ExtensionStatus, type AuthStatus, type CallbackStepStatus } from '@/lib/status-utils'
import { cn } from '@/lib/utils'

interface BaseStatusDisplayProps {
  className?: string
  showIcon?: boolean
  showText?: boolean
  iconClassName?: string
  textClassName?: string
}

interface ExtensionStatusDisplayProps extends BaseStatusDisplayProps {
  type: 'extension'
  status: ExtensionStatus
}

interface AuthStatusDisplayProps extends BaseStatusDisplayProps {
  type: 'auth'
  status: AuthStatus
}

interface CallbackStepStatusDisplayProps extends BaseStatusDisplayProps {
  type: 'callbackStep'
  status: CallbackStepStatus
}

type StatusDisplayProps = ExtensionStatusDisplayProps | AuthStatusDisplayProps | CallbackStepStatusDisplayProps

export function StatusDisplay({
  type,
  status,
  className,
  showIcon = true,
  showText = true,
  iconClassName,
  textClassName,
}: StatusDisplayProps) {
  const config = StatusUtils[type].getConfig(status as any)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && <div className={iconClassName}>{config.icon}</div>}
      {showText && <span className={cn(config.colorClass, 'text-sm', textClassName)}>{config.text}</span>}
    </div>
  )
}

interface StatusBadgeProps extends BaseStatusDisplayProps {
  type: 'extension' | 'auth' | 'callbackStep'
  status: ExtensionStatus | AuthStatus | CallbackStepStatus
  variant?: 'default' | 'compact'
}

export function StatusBadge({ type, status, className, variant = 'default', ...props }: StatusBadgeProps) {
  const baseClasses =
    variant === 'compact'
      ? 'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium'
      : 'inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium'

  const variantClasses =
    status === 'ready' || status === 'authenticated' || status === 'completed'
      ? 'bg-green-50 text-green-800 border border-green-200'
      : status === 'error'
        ? 'bg-red-50 text-red-800 border border-red-200'
        : status === 'detecting' || status === 'authenticating' || status === 'active'
          ? 'bg-blue-50 text-blue-800 border border-blue-200'
          : 'bg-gray-50 text-gray-800 border border-gray-200'

  return (
    <span className={cn(baseClasses, variantClasses, className)}>
      <StatusDisplay
        type={type as any}
        status={status as any}
        showText={variant === 'default'}
        textClassName='text-inherit'
        {...props}
      />
    </span>
  )
}
