import { Send, ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onNewChat: () => void
  selectedModel: string
  onModelChange: (model: string) => void
  availableModels: Array<{ id: string; name: string }>
  disabled?: boolean
  modelsLoading?: boolean
  modelLoadingError?: string
  className?: string
}

export function ChatInput({
  onSendMessage,
  onNewChat,
  selectedModel,
  onModelChange,
  availableModels,
  disabled = false,
  modelsLoading = false,
  modelLoadingError,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage)
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const selectedModelName = modelsLoading
    ? 'Loading models...'
    : modelLoadingError
      ? 'Error loading models'
      : availableModels.find(m => m.id === selectedModel)?.name || selectedModel || 'No model selected'

  const isModelSelectorDisabled = disabled || modelsLoading || !!modelLoadingError || !availableModels.length

  return (
    <div className={cn('border-t bg-background p-4', className)}>
      <div className='mx-auto max-w-4xl'>
        {/* Input Area */}
        <div className='relative flex gap-2'>
          {/* New Chat Button */}
          <Button
            onClick={onNewChat}
            variant='ghost'
            className='h-[60px] w-10 flex-shrink-0 p-0 text-muted-foreground hover:text-foreground'
          >
            <Plus className='h-4 w-4' />
          </Button>

          <div className='relative flex-1'>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Send a message'
              disabled={disabled}
              className='max-h-32 min-h-[60px] resize-none rounded-xl border-border bg-background pr-32 focus:border-transparent focus:ring-2 focus:ring-primary'
            />
            <div className='absolute bottom-2 right-2 flex items-center gap-2'>
              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={isModelSelectorDisabled}
                    className={cn(
                      'h-8 gap-1 border-border bg-transparent text-xs text-muted-foreground hover:bg-muted/50',
                      modelLoadingError && 'text-destructive'
                    )}
                  >
                    {selectedModelName}
                    <ChevronDown className='h-3 w-3' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  {modelsLoading ? (
                    <DropdownMenuItem disabled>Loading models...</DropdownMenuItem>
                  ) : modelLoadingError ? (
                    <DropdownMenuItem disabled>Error loading models</DropdownMenuItem>
                  ) : availableModels.length > 0 ? (
                    availableModels.map(model => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className={cn('cursor-pointer', selectedModel === model.id && 'bg-muted')}
                      >
                        {model.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No models available</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleSubmit}
                disabled={disabled || !message.trim() || isModelSelectorDisabled}
                size='sm'
                className='h-8 w-8 p-0'
              >
                <Send className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message Display */}
        {modelLoadingError && (
          <div className='mt-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive'>
            {modelLoadingError}
          </div>
        )}

        <div className='mt-2 text-center text-xs text-muted-foreground'>
          AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  )
}
