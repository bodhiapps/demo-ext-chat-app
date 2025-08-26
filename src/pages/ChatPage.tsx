import { ArrowLeft } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import { ChatInput } from '@/components/ChatInput'
import { ChatMessage } from '@/components/ChatMessage'
import { useExtensionContext } from '@/components/extension/ExtensionProvider'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useExtensionApi } from '@/hooks/useExtensionApi'
import { ExtensionAPI } from '@/lib/extensionApi'
import type { ChatMessage as ChatMessageType } from '@/lib/extensionApi'

const ChatPage = () => {
  const { extension, auth } = useExtensionContext()
  const extensionApi = useExtensionApi(extension.client)
  const [api, setApi] = useState<ExtensionAPI | null>(null)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Create API instance when extension client is available
  useEffect(() => {
    if (extension.client) {
      setApi(new ExtensionAPI(extensionApi))
    } else {
      setApi(null)
    }
  }, [extension.client, extensionApi])

  // Fetch models when API is ready
  useEffect(() => {
    if (api) {
      fetchModels()
    }
  }, [api])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const fetchModels = async () => {
    if (!api) return

    // Reset previous state
    setModelsLoading(true)
    setModelsError(null)
    setModelsLoaded(false)

    try {
      const models = await api.fetchModels()
      const chatModels = models
        .filter(
          model =>
            model.id.includes('gpt') ||
            model.id.includes('claude') ||
            model.id.includes('llama') ||
            model.id.includes('gemma')
        )
        .map(model => ({
          id: model.id,
          name: model.id,
        }))
        .slice(0, 20) // Limit to 20 models for UI

      if (chatModels.length > 0) {
        setAvailableModels(chatModels)
        setSelectedModel(chatModels[0].id)
        setModelsLoaded(true)
        setModelsError(null)
      } else {
        // No models returned from API
        setAvailableModels([])
        setSelectedModel('')
        setModelsError('No compatible models found on the server.')
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)

      // 401 errors will be handled by useExtensionApi hook (contextual redirect)
      // Handle non-auth errors here with inline display
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          setModelsError('Server error while loading models. Please try refreshing the page.')
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          setModelsError('Unable to connect to the server. Please check your internet connection.')
        } else {
          setModelsError('Unable to load models from the remote server. Please try refreshing the page.')
        }
      } else {
        setModelsError('Unable to load models from the remote server. Please try refreshing the page.')
      }

      // Clear models on error
      setAvailableModels([])
      setSelectedModel('')
    } finally {
      setModelsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setStreamingContent('')
    setIsStreaming(false)
    setIsProcessing(false)
  }

  const handleSendMessage = async (content: string) => {
    if (!api || isStreaming || isProcessing) return

    // Check if extension is connected
    if (!extension.client) {
      toast({
        title: 'Extension Required',
        description: 'Please install and connect the Bodhi browser extension to use chat.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    // Check if user is authenticated
    if (!auth.isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to use chat functionality.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    // Check if models are loaded and available
    if (!modelsLoaded || !availableModels.length || !selectedModel) {
      toast({
        title: 'Models Not Available',
        description: 'Please wait for models to load or try refreshing the page.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    const userMessage: ChatMessageType = { role: 'user', content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsProcessing(true)
    setStreamingContent('')

    try {
      const stream = api.streamChatCompletion(newMessages, selectedModel)
      let fullResponse = ''
      let buffer = ''
      let isFirstChunk = true

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta

        // Handle both content and reasoning_content fields, filter out null/undefined
        let contentToAdd = ''
        if (delta?.content !== undefined && delta.content !== null) {
          contentToAdd = delta.content
        } else if (delta?.reasoning_content !== undefined && delta.reasoning_content !== null) {
          contentToAdd = delta.reasoning_content
        }

        if (contentToAdd) {
          buffer += contentToAdd

          if (isFirstChunk) {
            setIsProcessing(false)
            setIsStreaming(true)
            isFirstChunk = false
          }

          // Flush complete "word + following whitespace" groups
          while (true) {
            const match = buffer.match(/^\s*\S+\s+/)
            if (!match) break
            fullResponse += match[0]
            buffer = buffer.slice(match[0].length)
          }

          // Update UI with flushed words plus any partial
          setStreamingContent(fullResponse + buffer)
        }
      }

      // Flush any remaining buffer at the end
      if (buffer.length) {
        fullResponse += buffer
        setStreamingContent(fullResponse)
      }

      const assistantMessage: ChatMessageType = { role: 'assistant', content: fullResponse }
      setMessages([...newMessages, assistantMessage])
      setStreamingContent('')
    } catch (error) {
      console.error('Chat completion error:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please check your connection and try again.',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
      setIsStreaming(false)
    }
  }

  return (
    <div className='fixed inset-0 flex flex-col bg-background'>
      {/* Header */}
      <div className='flex-shrink-0 border-b border-border px-4 py-4'>
        <div className='mx-auto flex max-w-4xl items-center justify-between'>
          <div className='flex items-center gap-3'>
            <span className='text-2xl'>🪷</span>
            <h1 className='text-lg font-semibold'>Bodhi Browser Extension Demo App</h1>
          </div>
          <Button variant='ghost' size='sm' className='gap-2' onClick={() => (window.location.href = '/')}>
            <ArrowLeft className='h-4 w-4' />
            Back to Landing
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className='flex min-h-0 flex-1 flex-col'>
        {/* Messages */}
        <div className='flex-1 overflow-y-auto'>
          {messages.length === 0 && !isStreaming && !isProcessing ? (
            <div className='flex h-full items-center justify-center px-4'>
              <div className='animate-fade-in max-w-2xl text-center'>
                {!extension.client ? (
                  <>
                    <h1 className='mb-2 text-2xl font-semibold'>Extension Required</h1>
                    <p className='text-muted-foreground'>
                      Please install and connect the Bodhi browser extension to start chatting.
                    </p>
                  </>
                ) : !auth.isAuthenticated ? (
                  <>
                    <h1 className='mb-2 text-2xl font-semibold'>Authentication Required</h1>
                    <p className='text-muted-foreground'>Please sign in to start using the chat functionality.</p>
                  </>
                ) : (
                  <>
                    <h1 className='mb-2 text-2xl font-semibold'>Where should we begin?</h1>
                    <p className='text-muted-foreground'>Start a conversation by typing a message below.</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className='mx-auto w-full max-w-4xl px-4 py-4'>
              {messages
                .filter(msg => msg.role !== 'system')
                .map((message, index) => (
                  <div key={index} className='animate-fade-in'>
                    <ChatMessage messageRole={message.role as 'user' | 'assistant'} content={message.content} />
                  </div>
                ))}
              {isProcessing && (
                <div className='animate-fade-in'>
                  <ChatMessage messageRole='assistant' content='Thinking...' isProcessing={true} />
                </div>
              )}
              {isStreaming && streamingContent && (
                <div className='animate-fade-in'>
                  <ChatMessage messageRole='assistant' content={streamingContent} isStreaming={true} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className='flex-shrink-0'>
          <ChatInput
            onSendMessage={handleSendMessage}
            onNewChat={handleNewChat}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            availableModels={availableModels}
            disabled={isStreaming || isProcessing || !extension.client || !auth.isAuthenticated}
            modelsLoading={modelsLoading}
            modelLoadingError={modelsError || undefined}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatPage
