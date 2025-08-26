import { Copy, User, Bot } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  messageRole: 'user' | 'assistant' | 'system'
  content: string
  isStreaming?: boolean
  isProcessing?: boolean
}

export function ChatMessage({ messageRole, content, isStreaming = false, isProcessing = false }: ChatMessageProps) {
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        description: 'Message copied to clipboard',
        duration: 2000,
      })
    } catch {
      toast({
        description: 'Failed to copy message',
        variant: 'destructive',
        duration: 2000,
      })
    }
  }

  const isUser = messageRole === 'user'
  const isSystem = messageRole === 'system'

  return (
    <div className='group px-4 py-1'>
      <div className={cn('mx-auto flex max-w-2xl gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar */}
        <div
          className={cn(
            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
            isUser ? 'bg-primary text-white' : isSystem ? 'bg-accent' : 'bg-muted'
          )}
        >
          {isUser ? <User className='h-3 w-3' /> : <Bot className='h-3 w-3' />}
        </div>

        {/* Message Content */}
        <div className={cn('min-w-0 flex-1', isUser ? 'text-right' : 'text-left')}>
          <div className='whitespace-pre-wrap text-sm leading-relaxed'>
            {content}
            {isProcessing && (
              <div className='mt-1 flex items-center gap-1'>
                <div className='flex gap-1'>
                  <div
                    className='h-2 w-2 animate-pulse rounded-full bg-muted-foreground'
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className='h-2 w-2 animate-pulse rounded-full bg-muted-foreground'
                    style={{ animationDelay: '200ms' }}
                  />
                  <div
                    className='h-2 w-2 animate-pulse rounded-full bg-muted-foreground'
                    style={{ animationDelay: '400ms' }}
                  />
                </div>
              </div>
            )}
            {isStreaming && !isProcessing && <span className='ml-1 inline-block h-4 w-2 animate-pulse bg-primary' />}
          </div>

          {/* Actions */}
          {!isStreaming && !isProcessing && content && (
            <div
              className={cn(
                'mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
                isUser ? 'text-right' : 'text-left'
              )}
            >
              <Button
                variant='ghost'
                size='sm'
                onClick={handleCopy}
                className='h-6 px-2 text-muted-foreground transition-colors duration-200 hover:text-foreground'
              >
                <Copy className='h-3 w-3' />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
