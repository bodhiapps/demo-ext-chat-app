import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export type ExtensionStatus = 'idle' | 'detecting' | 'ready' | 'not-found' | 'error'
export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error'
export type CallbackStepStatus = 'pending' | 'active' | 'completed' | 'error'

export interface StatusConfig {
  icon: ReactNode
  text: string
  colorClass: string
}

const extensionStatusMap: Record<ExtensionStatus, StatusConfig> = {
  idle: {
    icon: <AlertCircle className='h-4 w-4 text-gray-500' />,
    text: 'Idle',
    colorClass: 'text-gray-700',
  },
  detecting: {
    icon: <Loader2 className='h-4 w-4 animate-spin' />,
    text: 'Detecting extension...',
    colorClass: 'text-blue-700',
  },
  ready: {
    icon: <CheckCircle className='h-4 w-4 text-green-500' />,
    text: 'Extension ready',
    colorClass: 'text-green-700',
  },
  'not-found': {
    icon: <XCircle className='h-4 w-4 text-red-500' />,
    text: 'Extension not found',
    colorClass: 'text-red-700',
  },
  error: {
    icon: <AlertCircle className='h-4 w-4 text-yellow-500' />,
    text: 'Extension error',
    colorClass: 'text-yellow-700',
  },
}

const authStatusMap: Record<AuthStatus, StatusConfig> = {
  idle: {
    icon: <AlertCircle className='h-4 w-4 text-gray-500' />,
    text: 'Not authenticated',
    colorClass: 'text-gray-700',
  },
  authenticating: {
    icon: <Loader2 className='h-4 w-4 animate-spin' />,
    text: 'Authenticating...',
    colorClass: 'text-blue-700',
  },
  authenticated: {
    icon: <CheckCircle className='h-4 w-4 text-green-500' />,
    text: 'Authenticated',
    colorClass: 'text-green-700',
  },
  error: {
    icon: <AlertCircle className='h-4 w-4 text-red-500' />,
    text: 'Authentication error',
    colorClass: 'text-red-700',
  },
}

const callbackStepStatusMap: Record<CallbackStepStatus, StatusConfig> = {
  pending: {
    icon: <div className='h-4 w-4 rounded-full border-2 border-gray-300' />,
    text: 'Pending',
    colorClass: 'text-gray-500',
  },
  active: {
    icon: <Loader2 className='h-4 w-4 animate-spin text-blue-500' />,
    text: 'Active',
    colorClass: 'text-blue-700',
  },
  completed: {
    icon: <CheckCircle className='h-4 w-4 text-green-500' />,
    text: 'Completed',
    colorClass: 'text-green-700',
  },
  error: {
    icon: <XCircle className='h-4 w-4 text-red-500' />,
    text: 'Error',
    colorClass: 'text-red-700',
  },
}

export const StatusUtils = {
  extension: {
    getConfig: (status: ExtensionStatus): StatusConfig => extensionStatusMap[status],
    getIcon: (status: ExtensionStatus): ReactNode => extensionStatusMap[status].icon,
    getText: (status: ExtensionStatus): string => extensionStatusMap[status].text,
    getColorClass: (status: ExtensionStatus): string => extensionStatusMap[status].colorClass,
  },
  auth: {
    getConfig: (status: AuthStatus): StatusConfig => authStatusMap[status],
    getIcon: (status: AuthStatus): ReactNode => authStatusMap[status].icon,
    getText: (status: AuthStatus): string => authStatusMap[status].text,
    getColorClass: (status: AuthStatus): string => authStatusMap[status].colorClass,
  },
  callbackStep: {
    getConfig: (status: CallbackStepStatus): StatusConfig => callbackStepStatusMap[status],
    getIcon: (status: CallbackStepStatus): ReactNode => callbackStepStatusMap[status].icon,
    getText: (status: CallbackStepStatus): string => callbackStepStatusMap[status].text,
    getColorClass: (status: CallbackStepStatus): string => callbackStepStatusMap[status].colorClass,
  },
}
