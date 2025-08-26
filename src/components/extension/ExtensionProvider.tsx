import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import type { UseAuthReturn } from '@/hooks/useAuth'
import { useExtension } from '@/hooks/useExtension'
import type { UseExtensionReturn } from '@/hooks/useExtension'

interface ExtensionContextType {
  extension: UseExtensionReturn
  auth: UseAuthReturn
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(undefined)

interface ExtensionProviderProps {
  children: ReactNode
}

export function ExtensionProvider({ children }: ExtensionProviderProps) {
  const extension = useExtension()
  const auth = useAuth(extension.client)

  const contextValue: ExtensionContextType = {
    extension,
    auth,
  }

  return <ExtensionContext.Provider value={contextValue}>{children}</ExtensionContext.Provider>
}

export function useExtensionContext(): ExtensionContextType {
  const context = useContext(ExtensionContext)
  if (context === undefined) {
    throw new Error('useExtensionContext must be used within an ExtensionProvider')
  }
  return context
}
